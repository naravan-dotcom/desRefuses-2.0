"use server";

import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork } from "@/lib/db-shape";

export async function listFavorites() {
  const session = await auth();
  if (!session?.user || session.user.role !== "member" || session.user.status !== "approved") {
    return { ok: false, error: "Masuk sebagai Member untuk melihat favorit." };
  }

  try {
    const { rows } = await pool.query(
      "SELECT a.*, u.name AS creator_name, f.created_at AS favorited_at FROM favorites f JOIN artworks a ON a.id = f.artwork_id JOIN users u ON u.id = a.user_id WHERE f.member_id = $1 ORDER BY f.created_at DESC",
      [Number(session.user.dbId)],
    );
    const creators = {};
    rows.forEach((row) => {
      creators[String(row.user_id)] = row.creator_name ?? "Kreator";
    });
    return {
      ok: true,
      artworks: rows.map((row) => ({ ...toArtwork(row), favoritedAt: row.favorited_at })),
      creators,
    };
  } catch {
    return { ok: false, error: "Favorit gagal dimuat." };
  }
}
