"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";

async function requireMember() {
  const session = await auth();
  if (!session?.user || session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Masuk sebagai Member untuk melakukan ini." };
  }
  return { dbId: Number(session.user.dbId) };
}

export async function toggleCreatorFollow(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const targetId = Number(String(formData.get("targetId") ?? "").trim());
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, error: "Kreator tidak ditemukan." };
  }
  if (targetId === access.dbId) {
    return { ok: false, error: "Anda tidak dapat mengikuti diri sendiri." };
  }

  try {
    const target = await pool.query("SELECT 1 FROM users WHERE id = $1", [targetId]);
    if (!target.rowCount) return { ok: false, error: "Kreator tidak ditemukan." };

    const existing = await pool.query(
      "SELECT 1 FROM follows WHERE member_id = $1 AND target_id = $2",
      [access.dbId, targetId],
    );
    if (existing.rowCount) {
      await pool.query("DELETE FROM follows WHERE member_id = $1 AND target_id = $2", [access.dbId, targetId]);
    } else {
      await pool.query("INSERT INTO follows (member_id, target_id) VALUES ($1, $2)", [access.dbId, targetId]);
    }

    revalidatePath(`/creator/${targetId}`);
    revalidatePath("/dashboard/profile");
    return { ok: true, following: !existing.rowCount };
  } catch {
    return { ok: false, error: "Gagal memperbarui ikutan." };
  }
}
