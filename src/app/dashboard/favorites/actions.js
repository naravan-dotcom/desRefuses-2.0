"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMember() {
  const session = await auth();
  if (!session?.user || session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Masuk sebagai Member untuk melihat favorit." };
  }
  return { dbId: Number(session.user.dbId) };
}

function revalidateFavorites() {
  revalidatePath("/dashboard/favorites");
}

function toCollection(row) {
  return {
    id: String(row.id),
    name: row.name,
    artworkIds: (row.artwork_ids ?? []).map((id) => String(id)),
    createdAt: row.created_at,
  };
}

export async function listFavorites() {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [favoriteResult, collectionResult] = await Promise.all([
      pool.query(
        "SELECT a.*, u.name AS creator_name, f.created_at AS favorited_at FROM favorites f JOIN artworks a ON a.id = f.artwork_id JOIN users u ON u.id = a.user_id WHERE f.member_id = $1 ORDER BY f.created_at DESC",
        [access.dbId],
      ),
      pool.query(
        `SELECT c.id, c.name, c.created_at,
          COALESCE(json_agg(ci.artwork_id ORDER BY ci.created_at) FILTER (WHERE ci.id IS NOT NULL), '[]'::json) AS artwork_ids
         FROM collections c
         LEFT JOIN collection_items ci ON ci.collection_id = c.id
         WHERE c.member_id = $1
         GROUP BY c.id, c.name, c.created_at
         ORDER BY c.created_at DESC`,
        [access.dbId],
      ),
    ]);
    const creators = {};
    favoriteResult.rows.forEach((row) => {
      creators[String(row.user_id)] = row.creator_name ?? "Kreator";
    });
    return {
      ok: true,
      artworks: favoriteResult.rows.map((row) => ({ ...toArtwork(row), favoritedAt: row.favorited_at })),
      collections: collectionResult.rows.map(toCollection),
      creators,
    };
  } catch {
    return { ok: false, error: "Favorit gagal dimuat." };
  }
}

export async function createCollection(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const name = value(formData, "name");
  if (!name || name.length > 60) {
    return { ok: false, error: "Nama koleksi wajib diisi dan maksimal 60 karakter." };
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO collections (member_id, name) VALUES ($1, $2) RETURNING id, name, created_at",
      [access.dbId, name],
    );
    revalidateFavorites();
    return {
      ok: true,
      collection: { id: String(rows[0].id), name: rows[0].name, artworkIds: [], createdAt: rows[0].created_at },
    };
  } catch (error) {
    if (error?.code === "23505") return { ok: false, error: "Koleksi dengan nama ini sudah ada." };
    return { ok: false, error: "Koleksi gagal dibuat." };
  }
}

export async function addToCollection(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const collectionId = Number(value(formData, "collectionId"));
  const artworkId = Number(value(formData, "artworkId"));
  if (!Number.isInteger(collectionId) || collectionId <= 0 || !Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Koleksi atau karya tidak ditemukan." };
  }

  try {
    const owner = await pool.query("SELECT 1 FROM collections WHERE id = $1 AND member_id = $2", [collectionId, access.dbId]);
    if (!owner.rowCount) return { ok: false, error: "Koleksi tidak ditemukan." };
    const favorite = await pool.query("SELECT 1 FROM favorites WHERE member_id = $1 AND artwork_id = $2", [access.dbId, artworkId]);
    if (!favorite.rowCount) return { ok: false, error: "Simpan karya sebagai favorit terlebih dahulu." };

    await pool.query(
      "INSERT INTO collection_items (collection_id, artwork_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [collectionId, artworkId],
    );
    revalidateFavorites();
    return { ok: true };
  } catch {
    return { ok: false, error: "Karya gagal ditambahkan ke koleksi." };
  }
}

export async function removeFromCollection(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const collectionId = Number(value(formData, "collectionId"));
  const artworkId = Number(value(formData, "artworkId"));
  if (!Number.isInteger(collectionId) || collectionId <= 0 || !Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Koleksi atau karya tidak ditemukan." };
  }

  try {
    await pool.query(
      `DELETE FROM collection_items
       WHERE collection_id = $1 AND artwork_id = $2
         AND collection_id IN (SELECT id FROM collections WHERE member_id = $3)`,
      [collectionId, artworkId, access.dbId],
    );
    revalidateFavorites();
    return { ok: true };
  } catch {
    return { ok: false, error: "Karya gagal dikeluarkan dari koleksi." };
  }
}

export async function deleteCollection(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const collectionId = Number(value(formData, "collectionId"));
  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return { ok: false, error: "Koleksi tidak ditemukan." };
  }

  try {
    const { rowCount } = await pool.query("DELETE FROM collections WHERE id = $1 AND member_id = $2", [collectionId, access.dbId]);
    if (!rowCount) return { ok: false, error: "Koleksi tidak ditemukan." };
    revalidateFavorites();
    return { ok: true };
  } catch {
    return { ok: false, error: "Koleksi gagal dihapus." };
  }
}
