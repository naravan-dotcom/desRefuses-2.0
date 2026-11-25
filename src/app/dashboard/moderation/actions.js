"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toCategory, toComment } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin" || session.user.status !== "approved") {
    return { error: "Hanya Admin yang bisa memoderasi konten." };
  }
  return { ok: true };
}

function revalidateModeration() {
  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard");
  revalidatePath("/gallery");
  revalidatePath("/home");
}

export async function listModerationGroups() {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [reports, artworks, comments, categories] = await Promise.all([
      pool.query(
        "SELECT r.*, u.name AS reporter_name FROM reports r JOIN users u ON u.id = r.reporter_id WHERE r.status = 'open' ORDER BY r.created_at DESC",
      ),
      pool.query("SELECT a.*, u.name AS author_name FROM artworks a JOIN users u ON u.id = a.user_id"),
      pool.query("SELECT c.*, u.name AS author_name FROM comments c JOIN users u ON u.id = c.user_id"),
      pool.query("SELECT id, name, slug FROM categories"),
    ]);

    const artworkMap = new Map(artworks.rows.map((row) => [String(row.id), toArtwork(row)]));
    const commentMap = new Map(comments.rows.map((row) => [String(row.id), toComment(row)]));
    const categoryMap = new Map(categories.rows.map((row) => [String(row.id), toCategory(row)]));
    const authorMap = new Map(artworks.rows.map((row) => [String(row.id), row.user_id]));
    const grouped = new Map();

    reports.rows.forEach((row) => {
      const key = `${row.type}:${row.target_id}`;
      if (!grouped.has(key)) grouped.set(key, { key, type: row.type, targetId: String(row.target_id), reports: [] });
      grouped.get(key).reports.push({
        id: String(row.id),
        type: row.type,
        targetId: String(row.target_id),
        reason: row.reason,
        detail: row.detail ?? "",
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
        reporterId: `u${row.reporter_id}`,
        reporterName: row.reporter_name ?? "Member",
      });
    });

    const groups = Array.from(grouped.values()).map((group) => {
      const artwork = group.type === "artwork" ? artworkMap.get(group.targetId) ?? null : null;
      const comment = group.type === "comment" ? commentMap.get(group.targetId) ?? null : null;
      const parentArtwork = comment ? artworkMap.get(comment.artworkId) ?? null : null;
      const author = artwork
        ? { name: artworks.rows.find((row) => String(row.id) === group.targetId)?.author_name ?? "Kreator" }
        : comment
          ? { name: comment.authorName }
          : null;
      const category = artwork ? categoryMap.get(artwork.categoryId) ?? null : null;
      return {
        ...group,
        artwork,
        comment,
        parentArtwork,
        author,
        category,
        href: artwork ? `/artwork/${artwork.id}` : parentArtwork ? `/artwork/${parentArtwork.id}` : null,
      };
    });

    return { ok: true, groups, authorMap: Object.fromEntries(authorMap) };
  } catch {
    return { ok: false, error: "Antrean moderasi gagal dimuat." };
  }
}

export async function dismissReport(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const type = value(formData, "type");
  const targetId = Number(value(formData, "targetId"));
  if (!["artwork", "comment"].includes(type) || !Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, error: "Laporan tidak ditemukan." };
  }

  try {
    await pool.query(
      "UPDATE reports SET status = 'dismissed' WHERE type = $1 AND target_id = $2 AND status = 'open'",
      [type, targetId],
    );
    revalidateModeration();
    return { ok: true };
  } catch {
    return { ok: false, error: "Laporan gagal diabaikan." };
  }
}

export async function takeDown(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const type = value(formData, "type");
  const targetId = Number(value(formData, "targetId"));
  if (!["artwork", "comment"].includes(type) || !Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, error: "Konten tidak ditemukan." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (type === "artwork") {
      const comments = await client.query("SELECT id FROM comments WHERE artwork_id = $1", [targetId]);
      const commentIds = comments.rows.map((row) => Number(row.id));
      await client.query(
        "UPDATE reports SET status = 'resolved' WHERE (type = 'artwork' AND target_id = $1) OR (type = 'comment' AND target_id = ANY($2::bigint[]))",
        [targetId, commentIds],
      );
      await client.query("DELETE FROM artworks WHERE id = $1", [targetId]);
    } else {
      await client.query(
        "UPDATE reports SET status = 'resolved' WHERE type = 'comment' AND target_id = $1",
        [targetId],
      );
      await client.query("DELETE FROM comments WHERE id = $1", [targetId]);
    }
    await client.query("COMMIT");
    revalidateModeration();
    return { ok: true };
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "Konten gagal dihapus." };
  } finally {
    client.release();
  }
}
