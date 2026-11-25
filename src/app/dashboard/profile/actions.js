"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toUser } from "@/lib/db-shape";

const MAX_FILE_SIZE = 1024 * 1024;

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMember() {
  const session = await auth();
  if (!session?.user?.dbId) return { error: "Sesi tidak ditemukan." };
  const dbId = Number(session.user.dbId);
  if (session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Hanya Member yang bisa mengelola profil." };
  }
  return { dbId };
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function saveUpload(file) {
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const name = `${Date.now()}-${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "profile");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/profile/${name}`;
}

async function removeUpload(file) {
  if (typeof file !== "string" || !file.startsWith("/uploads/profile/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", file.replace(/^\/+/, "")));
  } catch {
    return;
  }
}

export async function listProfileData() {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [userResult, followResult] = await Promise.all([
      pool.query("SELECT * FROM users WHERE id = $1", [access.dbId]),
      pool.query(
        "SELECT u.id, u.name, u.username, u.avatar FROM follows f JOIN users u ON u.id = f.target_id WHERE f.member_id = $1 ORDER BY f.created_at DESC",
        [access.dbId],
      ),
    ]);
    if (!userResult.rows[0]) return { ok: false, error: "Akun tidak ditemukan." };
    return {
      ok: true,
      user: toUser(userResult.rows[0]),
      following: followResult.rows.map((row) => ({
        id: String(row.id),
        dbId: Number(row.id),
        name: row.name,
        username: row.username,
        avatar: row.avatar ?? "",
      })),
    };
  } catch {
    return { ok: false, error: "Profil gagal dimuat." };
  }
}

export async function updateProfile(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const name = value(formData, "name");
  const bio = value(formData, "bio");
  const instagram = value(formData, "instagram");
  const behance = value(formData, "behance");
  const website = value(formData, "website");
  const avatarUrl = value(formData, "avatarUrl");
  const avatarFile = formData.get("avatar");

  if (!name) return { ok: false, error: "Nama tampilan wajib diisi." };
  if (name.length > 60) return { ok: false, error: "Nama tampilan maksimal 60 karakter." };
  for (const [label, url] of [["Instagram", instagram], ["Behance", behance], ["Website", website]]) {
    if (!isValidUrl(url)) return { ok: false, error: `URL ${label} tidak valid.` };
  }

  const hasFile = avatarFile instanceof File && avatarFile.size > 0;
  if (hasFile) {
    if (!avatarFile.type.startsWith("image/")) return { ok: false, error: "File harus berupa gambar." };
    if (avatarFile.size > MAX_FILE_SIZE) return { ok: false, error: "Ukuran gambar maksimal 1 MB." };
  }
  if (avatarUrl && !isValidUrl(avatarUrl)) return { ok: false, error: "URL foto profil tidak valid." };

  try {
    const current = await pool.query("SELECT avatar FROM users WHERE id = $1", [access.dbId]);
    if (!current.rows[0]) return { ok: false, error: "Akun tidak ditemukan." };

    let nextAvatar = current.rows[0].avatar ?? "";
    let uploaded = null;
    if (hasFile) {
      uploaded = await saveUpload(avatarFile);
      nextAvatar = uploaded;
    } else if (avatarUrl) {
      nextAvatar = avatarUrl;
    }

    const links = { instagram, behance, website };
    const { rows } = await pool.query(
      "UPDATE users SET name = $1, bio = $2, links = $3::jsonb, avatar = $4 WHERE id = $5 RETURNING *",
      [name, bio, JSON.stringify(links), nextAvatar, access.dbId],
    );

    if (uploaded && current.rows[0].avatar !== uploaded) {
      await removeUpload(current.rows[0].avatar);
    }

    revalidatePath("/dashboard/profile");
    revalidatePath(`/creator/${access.dbId}`);
    revalidatePath("/gallery");
    revalidatePath("/home");
    return { ok: true, user: toUser(rows[0]) };
  } catch {
    return { ok: false, error: "Profil gagal disimpan." };
  }
}
