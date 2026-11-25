"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
const REPORT_REASONS = [
  "Plagiat",
  "SARA",
  "Konten tidak pantas",
  "Perundungan",
  "Spam",
  "Lainnya",
];
import { toComment } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMember() {
  const session = await auth();
  if (!session?.user || session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Masuk sebagai Member untuk melakukan ini." };
  }
  return {
    dbId: Number(session.user.dbId),
    name: session.user.name,
    avatar: session.user.avatar ?? "",
  };
}

function revalidateArtwork(artworkId) {
  revalidatePath(`/artwork/${artworkId}`);
  revalidatePath("/gallery");
  revalidatePath("/home");
  revalidatePath("/dashboard/favorites");
}

export async function toggleLike(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const artworkId = Number(value(formData, "artworkId"));
  if (!Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Karya tidak ditemukan." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT 1 FROM likes WHERE artwork_id = $1 AND member_id = $2",
      [artworkId, access.dbId],
    );
    let liked = false;
    if (existing.rowCount) {
      await client.query("DELETE FROM likes WHERE artwork_id = $1 AND member_id = $2", [artworkId, access.dbId]);
      await client.query("UPDATE artworks SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1", [artworkId]);
    } else {
      await client.query("INSERT INTO likes (artwork_id, member_id) VALUES ($1, $2)", [artworkId, access.dbId]);
      await client.query("UPDATE artworks SET likes_count = likes_count + 1 WHERE id = $1", [artworkId]);
      liked = true;
    }
    const { rows } = await client.query("SELECT likes_count FROM artworks WHERE id = $1", [artworkId]);
    await client.query("COMMIT");
    revalidateArtwork(artworkId);
    return { ok: true, liked, likes: Number(rows[0]?.likes_count ?? 0) };
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "Gagal memperbarui suka." };
  } finally {
    client.release();
  }
}

export async function toggleFavorite(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const artworkId = Number(value(formData, "artworkId"));
  if (!Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Karya tidak ditemukan." };
  }

  try {
    const existing = await pool.query(
      "SELECT 1 FROM favorites WHERE artwork_id = $1 AND member_id = $2",
      [artworkId, access.dbId],
    );
    let favorited = false;
    if (existing.rowCount) {
      await pool.query("DELETE FROM favorites WHERE artwork_id = $1 AND member_id = $2", [artworkId, access.dbId]);
    } else {
      await pool.query("INSERT INTO favorites (artwork_id, member_id) VALUES ($1, $2)", [artworkId, access.dbId]);
      favorited = true;
    }
    revalidateArtwork(artworkId);
    return { ok: true, favorited };
  } catch {
    return { ok: false, error: "Gagal memperbarui favorit." };
  }
}

export async function addComment(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const artworkId = Number(value(formData, "artworkId"));
  const text = value(formData, "text");
  if (!Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Karya tidak ditemukan." };
  }
  if (!text || text.length > 400) {
    return { ok: false, error: "Komentar tidak boleh kosong dan maksimal 400 karakter." };
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO comments (artwork_id, user_id, text) VALUES ($1, $2, $3) RETURNING *",
      [artworkId, access.dbId, text],
    );
    revalidateArtwork(artworkId);
    return {
      ok: true,
      comment: {
        ...toComment({ ...rows[0], author_name: access.name, author_avatar: access.avatar }),
        own: true,
      },
    };
  } catch {
    return { ok: false, error: "Komentar gagal dikirim." };
  }
}

export async function deleteComment(formData) {
  const session = await auth();
  if (!session?.user || session.user.status !== "approved") {
    return { ok: false, error: "Anda tidak dapat menghapus komentar ini." };
  }

  const id = Number(value(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Komentar tidak ditemukan." };
  }

  try {
    const { rows } = await pool.query("SELECT artwork_id, user_id FROM comments WHERE id = $1", [id]);
    if (!rows.length) return { ok: false, error: "Komentar tidak ditemukan." };
    const canDelete =
      Number(rows[0].user_id) === Number(session.user.dbId) || session.user.role === "admin";
    if (!canDelete) return { ok: false, error: "Anda hanya dapat menghapus komentar sendiri." };

    await pool.query(
      "UPDATE reports SET status = 'dismissed' WHERE type = 'comment' AND target_id = $1 AND status = 'open'",
      [id],
    );
    await pool.query("DELETE FROM comments WHERE id = $1", [id]);
    revalidateArtwork(rows[0].artwork_id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Komentar gagal dihapus." };
  }
}

export async function submitReport(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const type = value(formData, "type");
  const targetId = Number(value(formData, "targetId"));
  const reason = value(formData, "reason");
  const detail = value(formData, "detail");

  if (!["artwork", "comment"].includes(type) || !Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, error: "Konten tidak ditemukan." };
  }
  if (!REPORT_REASONS.includes(reason)) {
    return { ok: false, error: "Pilih alasan laporan." };
  }

  try {
    const table = type === "artwork" ? "artworks" : "comments";
    const target = await pool.query(`SELECT user_id FROM ${table} WHERE id = $1`, [targetId]);
    if (!target.rowCount) return { ok: false, error: "Konten tidak ditemukan." };
    if (Number(target.rows[0].user_id) === access.dbId) {
      return { ok: false, error: "Anda tidak dapat melaporkan konten sendiri." };
    }

    const duplicate = await pool.query(
      "SELECT 1 FROM reports WHERE type = $1 AND target_id = $2 AND reporter_id = $3",
      [type, targetId, access.dbId],
    );
    if (duplicate.rowCount) return { ok: false, error: "Anda sudah pernah melaporkan ini." };

    await pool.query(
      "INSERT INTO reports (type, target_id, reporter_id, reason, detail) VALUES ($1, $2, $3, $4, $5)",
      [type, targetId, access.dbId, reason, detail.slice(0, 500)],
    );
    revalidatePath("/dashboard/moderation");
    return { ok: true };
  } catch (error) {
    if (error?.code === "23505") return { ok: false, error: "Anda sudah pernah melaporkan ini." };
    return { ok: false, error: "Laporan gagal dikirim." };
  }
}
