"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toCategory } from "@/lib/db-shape";

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function isUniqueError(error) {
  return error?.code === "23505";
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin" || session.user.status !== "approved") {
    return { error: "Hanya Admin yang bisa mengelola kategori." };
  }
  return { dbId: Number(session.user.dbId) };
}

export async function listCategories() {
  try {
    const { rows } = await pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC");
    return { ok: true, categories: rows.map(toCategory) };
  } catch {
    return { ok: false, error: "Kategori gagal dimuat." };
  }
}

export async function listCategoryAdminData() {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [categories, counts] = await Promise.all([
      pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
      pool.query("SELECT category_id, COUNT(*)::int AS total FROM artworks GROUP BY category_id"),
    ]);
    return {
      ok: true,
      categories: categories.rows.map(toCategory),
      counts: Object.fromEntries(counts.rows.map((row) => [String(row.category_id), Number(row.total)])),
    };
  } catch {
    return { ok: false, error: "Kategori gagal dimuat." };
  }
}

export async function createCategory(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const name = value(formData, "name");
  if (!name) return { ok: false, error: "Nama kategori wajib diisi." };

  const slug = slugify(name);
  try {
    const duplicate = await pool.query(
      "SELECT 1 FROM categories WHERE lower(name) = lower($1) OR slug = $2 LIMIT 1",
      [name, slug],
    );
    if (duplicate.rowCount) return { ok: false, error: "Nama kategori sudah dipakai." };

    const { rows } = await pool.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
      [name, slug],
    );
    revalidatePath("/dashboard/categories");
    revalidatePath("/gallery");
    revalidatePath("/home");
    return { ok: true, category: toCategory(rows[0]) };
  } catch (error) {
    if (isUniqueError(error)) return { ok: false, error: "Nama kategori sudah dipakai." };
    return { ok: false, error: "Kategori gagal ditambahkan." };
  }
}

export async function updateCategory(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  const name = value(formData, "name");
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Kategori tidak ditemukan." };
  if (!name) return { ok: false, error: "Nama kategori wajib diisi." };

  const slug = slugify(name);
  try {
    const duplicate = await pool.query(
      "SELECT 1 FROM categories WHERE id <> $1 AND (lower(name) = lower($2) OR slug = $3) LIMIT 1",
      [id, name, slug],
    );
    if (duplicate.rowCount) return { ok: false, error: "Nama kategori sudah dipakai." };

    const { rows } = await pool.query(
      "UPDATE categories SET name = $1, slug = $2 WHERE id = $3 RETURNING id, name, slug",
      [name, slug, id],
    );
    if (!rows.length) return { ok: false, error: "Kategori tidak ditemukan." };

    revalidatePath("/dashboard/categories");
    revalidatePath("/gallery");
    revalidatePath("/home");
    return { ok: true, category: toCategory(rows[0]) };
  } catch (error) {
    if (isUniqueError(error)) return { ok: false, error: "Nama kategori sudah dipakai." };
    return { ok: false, error: "Kategori gagal diperbarui." };
  }
}

export async function deleteCategory(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Kategori tidak ditemukan." };

  try {
    const used = await pool.query("SELECT 1 FROM artworks WHERE category_id = $1 LIMIT 1", [id]);
    if (used.rowCount) {
      return { ok: false, error: "Kategori masih dipakai karya dan tidak bisa dihapus." };
    }
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    revalidatePath("/dashboard/categories");
    revalidatePath("/gallery");
    revalidatePath("/home");
    return { ok: true };
  } catch {
    return { ok: false, error: "Kategori gagal dihapus." };
  }
}
