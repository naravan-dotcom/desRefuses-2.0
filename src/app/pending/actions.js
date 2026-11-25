"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function deleteOwnAccount() {
  const session = await auth();
  if (!session?.user || session.user.dbId == null) {
    return { ok: false, error: "Sesi tidak ditemukan." };
  }

  const dbId = Number(session.user.dbId);
  if (session.user.role !== "curator" || session.user.status !== "rejected") {
    return { ok: false, error: "Hanya curator yang ditolak yang bisa menghapus akun." };
  }

  const client = await pool.connect();
  let files = [];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT role, status FROM users WHERE id = $1", [dbId]);
    const target = rows[0];
    if (!target || target.role !== "curator" || target.status !== "rejected") {
      await client.query("ROLLBACK");
      return { ok: false, error: "Akun tidak ditemukan atau tidak bisa dihapus." };
    }

    const artworks = await client.query("SELECT id, image FROM artworks WHERE user_id = $1", [dbId]);
    const comments = await client.query(
      "SELECT id FROM comments WHERE user_id = $1 OR artwork_id IN (SELECT id FROM artworks WHERE user_id = $1)",
      [dbId],
    );
    const banners = await client.query("SELECT banner FROM challenges WHERE curator_id = $1", [dbId]);
    const artworkIds = artworks.rows.map((row) => Number(row.id));
    const commentIds = comments.rows.map((row) => Number(row.id));
    files = [...artworks.rows.map((row) => row.image), ...banners.rows.map((row) => row.banner)];

    await client.query(
      "DELETE FROM reports WHERE reporter_id = $1 OR (type = 'artwork' AND target_id = ANY($2::bigint[])) OR (type = 'comment' AND target_id = ANY($3::bigint[]))",
      [dbId, artworkIds, commentIds],
    );
    await client.query("DELETE FROM users WHERE id = $1", [dbId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "Akun gagal dihapus." };
  } finally {
    client.release();
  }

  await Promise.all(
    files
      .filter((file) => typeof file === "string" && /^\/uploads\/(art|profile|banner)\//.test(file))
      .map(async (file) => {
        try {
          await unlink(path.join(process.cwd(), "public", file.replace(/^\/+/, "")));
        } catch {
          return;
        }
      }),
  );

  return { ok: true };
}
