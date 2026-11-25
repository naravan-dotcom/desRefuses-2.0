"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toCategory } from "@/lib/db-shape";
import { listCategories } from "@/app/dashboard/categories/actions";

const MAX_FILE_SIZE = 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function validateImage(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return { error: "Pilih file gambar terlebih dahulu." };
  }
  if (!Object.keys(EXTENSIONS).includes(String(file.type))) {
    return { error: "File harus berupa JPG, PNG, WEBP, atau GIF." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Ukuran gambar maksimal 1 MB." };
  }
  return { ok: true };
}

async function saveImage(file) {
  const filename = `${randomUUID()}${EXTENSIONS[file.type]}`;
  const directory = join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

async function removeImage(image) {
  if (typeof image !== "string" || !image.startsWith("/uploads/")) return;
  try {
    await unlink(join(process.cwd(), "public", image));
  } catch {}
}

function parseTags(raw) {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requireMember() {
  const session = await auth();
  if (!session?.user || session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Hanya Member yang bisa mengelola karya." };
  }
  return { dbId: Number(session.user.dbId) };
}

function revalidateArtworks() {
  revalidatePath("/dashboard/artworks");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/favorites");
  revalidatePath("/gallery");
  revalidatePath("/home");
}

export async function listArtworkPageData() {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [{ rows: artworks }, categories] = await Promise.all([
      pool.query("SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC", [access.dbId]),
      listCategories(),
    ]);
    return {
      ok: true,
      artworks: artworks.map(toArtwork),
      categories: categories.ok ? categories.categories : [],
    };
  } catch {
    return { ok: false, error: "Karya gagal dimuat." };
  }
}

export async function createArtwork(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const title = value(formData, "title");
  const description = value(formData, "description");
  const categoryId = Number(value(formData, "categoryId"));
  const tags = parseTags(formData.get("tags"));
  const file = formData.get("image");

  if (!title || !description || !Number.isInteger(categoryId) || tags.length === 0) {
    return { ok: false, error: "Judul, deskripsi, kategori, dan minimal satu tag wajib diisi." };
  }
  const imageCheck = validateImage(file);
  if (imageCheck.error) return { ok: false, error: imageCheck.error };

  try {
    const category = await pool.query("SELECT 1 FROM categories WHERE id = $1", [categoryId]);
    if (!category.rowCount) return { ok: false, error: "Kategori tidak ditemukan." };

    const image = await saveImage(file);
    const { rows } = await pool.query(
      "INSERT INTO artworks (user_id, title, description, category_id, tags, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [access.dbId, title, description, categoryId, tags, image],
    );
    revalidateArtworks();
    return { ok: true, artwork: toArtwork(rows[0]) };
  } catch {
    return { ok: false, error: "Karya gagal diunggah." };
  }
}

export async function updateArtwork(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  const title = value(formData, "title");
  const description = value(formData, "description");
  const categoryId = Number(value(formData, "categoryId"));
  const tags = parseTags(formData.get("tags"));
  const file = formData.get("image");
  const existingImage = value(formData, "existingImage");

  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Karya tidak ditemukan." };
  if (!title || !description || !Number.isInteger(categoryId) || tags.length === 0) {
    return { ok: false, error: "Judul, deskripsi, kategori, dan minimal satu tag wajib diisi." };
  }

  let image = existingImage;
  let newImage = "";
  if (file && typeof file !== "string" && file.size > 0) {
    const imageCheck = validateImage(file);
    if (imageCheck.error) return { ok: false, error: imageCheck.error };
    image = await saveImage(file);
    newImage = image;
  }

  try {
    const { rows } = await pool.query(
      "UPDATE artworks SET title = $1, description = $2, category_id = $3, tags = $4, image = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
      [title, description, categoryId, tags, image, id, access.dbId],
    );
    if (!rows.length) {
      if (newImage) await removeImage(newImage);
      return { ok: false, error: "Karya tidak ditemukan." };
    }
    if (newImage) await removeImage(existingImage);
    revalidateArtworks();
    return { ok: true, artwork: toArtwork(rows[0]) };
  } catch {
    if (newImage) await removeImage(newImage);
    return { ok: false, error: "Karya gagal diperbarui." };
  }
}

export async function deleteArtwork(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Karya tidak ditemukan." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const owned = await client.query("SELECT image FROM artworks WHERE id = $1 AND user_id = $2", [id, access.dbId]);
    if (!owned.rowCount) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Karya tidak ditemukan." };
    }
    const comments = await client.query("SELECT id FROM comments WHERE artwork_id = $1", [id]);
    const commentIds = comments.rows.map((row) => Number(row.id));
    await client.query(
      "DELETE FROM reports WHERE (type = 'artwork' AND target_id = $1) OR (type = 'comment' AND target_id = ANY($2::bigint[]))",
      [id, commentIds],
    );
    await client.query("DELETE FROM artworks WHERE id = $1", [id]);
    await client.query("COMMIT");
    await removeImage(owned.rows[0].image);
    revalidateArtworks();
    return { ok: true };
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "Karya gagal dihapus." };
  } finally {
    client.release();
  }
}
