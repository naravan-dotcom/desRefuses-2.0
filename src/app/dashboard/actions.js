"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toChallenge, toUser } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.dbId == null) {
    return { error: "Sesi tidak ditemukan." };
  }
  const dbId = Number(session.user.dbId);
  if (session.user.role !== "admin" || session.user.status !== "approved") {
    return { error: "Hanya Admin yang bisa mengelola pengguna." };
  }
  return { dbId };
}

function revalidateAdmin() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/curators");
  revalidatePath("/gallery");
  revalidatePath("/home");
}

async function removeUploads(files) {
  await Promise.all(
    files
      .filter((file) => file.startsWith("/uploads/"))
      .map(async (file) => {
        try {
          await unlink(path.join(process.cwd(), "public", file.replace(/^\/+/, "")));
        } catch {
          return;
        }
      }),
  );
}

export async function listDashboardData() {
  const session = await auth();
  if (!session?.user || session.user.dbId == null) {
    return { ok: false, error: "Sesi tidak ditemukan." };
  }

  const dbId = Number(session.user.dbId);
  const role = session.user.role;

  try {
    const [roleCountsResult, artworkTotalResult, reportTotalResult, activeChallengeResult, pendingCurators, openReports] =
      await Promise.all([
        pool.query("SELECT role, COUNT(*)::int AS total FROM users GROUP BY role"),
        pool.query("SELECT COUNT(*)::int AS total FROM artworks"),
        pool.query("SELECT COUNT(*)::int AS total FROM reports WHERE status = 'open'"),
        pool.query(
          "SELECT COUNT(*)::int AS total FROM challenges WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE",
        ),
        pool.query(
          "SELECT id, name, username, avatar FROM users WHERE role = 'curator' AND status = 'pending' ORDER BY joined_at ASC LIMIT 4",
        ),
        pool.query(
          "SELECT r.id, r.type, r.reason, u.name AS reporter_name FROM reports r JOIN users u ON u.id = r.reporter_id WHERE r.status = 'open' ORDER BY r.created_at DESC LIMIT 4",
        ),
      ]);

    let memberData = {
      ownArtworkCount: 0,
      totalLikes: 0,
      favoriteCount: 0,
      submissionCount: 0,
      recentArtworks: [],
      featuredArtwork: null,
    };
    let curatorData = {
      challengeCount: 0,
      activeChallengeCount: 0,
      incomingSubmissionCount: 0,
      winnerCount: 0,
      recentChallenges: [],
    };

    if (role === "member") {
      const [ownArtworkCount, totalLikes, favoriteCount, submissionCount, recentArtworks, featuredArtwork] =
        await Promise.all([
          pool.query("SELECT COUNT(*)::int AS total FROM artworks WHERE user_id = $1", [dbId]),
          pool.query("SELECT COALESCE(SUM(likes_count), 0)::int AS total FROM artworks WHERE user_id = $1", [dbId]),
          pool.query("SELECT COUNT(*)::int AS total FROM favorites WHERE member_id = $1", [dbId]),
          pool.query("SELECT COUNT(*)::int AS total FROM submissions WHERE member_id = $1", [dbId]),
          pool.query(
            "SELECT a.*, c.name AS category_name FROM artworks a LEFT JOIN categories c ON c.id = a.category_id WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT 4",
            [dbId],
          ),
          pool.query(
            "SELECT a.*, c.name AS category_name FROM artworks a LEFT JOIN categories c ON c.id = a.category_id WHERE a.user_id = $1 ORDER BY a.likes_count DESC, a.created_at DESC LIMIT 1",
            [dbId],
          ),
        ]);

      memberData = {
        ownArtworkCount: Number(ownArtworkCount.rows[0]?.total ?? 0),
        totalLikes: Number(totalLikes.rows[0]?.total ?? 0),
        favoriteCount: Number(favoriteCount.rows[0]?.total ?? 0),
        submissionCount: Number(submissionCount.rows[0]?.total ?? 0),
        recentArtworks: recentArtworks.rows.map((row) => ({ ...toArtwork(row), categoryName: row.category_name ?? "" })),
        featuredArtwork: featuredArtwork.rows[0]
          ? { ...toArtwork(featuredArtwork.rows[0]), categoryName: featuredArtwork.rows[0].category_name ?? "" }
          : null,
      };
    }

    if (role === "curator") {
      const [challengeCount, activeChallengeCount, incomingSubmissionCount, winnerCount, recentChallenges] =
        await Promise.all([
          pool.query("SELECT COUNT(*)::int AS total FROM challenges WHERE curator_id = $1", [dbId]),
          pool.query(
            "SELECT COUNT(*)::int AS total FROM challenges WHERE curator_id = $1 AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE",
            [dbId],
          ),
          pool.query(
            "SELECT COUNT(*)::int AS total FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE c.curator_id = $1",
            [dbId],
          ),
          pool.query(
            "SELECT COUNT(*)::int AS total FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE c.curator_id = $1 AND s.rank IS NOT NULL",
            [dbId],
          ),
          pool.query(
            "SELECT c.*, (SELECT COUNT(*)::int FROM submissions s WHERE s.challenge_id = c.id) AS submission_count FROM challenges c WHERE c.curator_id = $1 ORDER BY c.created_at DESC LIMIT 4",
            [dbId],
          ),
        ]);

      curatorData = {
        challengeCount: Number(challengeCount.rows[0]?.total ?? 0),
        activeChallengeCount: Number(activeChallengeCount.rows[0]?.total ?? 0),
        incomingSubmissionCount: Number(incomingSubmissionCount.rows[0]?.total ?? 0),
        winnerCount: Number(winnerCount.rows[0]?.total ?? 0),
        recentChallenges: recentChallenges.rows.map((row) => ({
          ...toChallenge(row),
          submissionCount: Number(row.submission_count ?? 0),
        })),
      };
    }

    const roleCounts = { admin: 0, member: 0, curator: 0 };
    roleCountsResult.rows.forEach((row) => {
      roleCounts[row.role] = Number(row.total);
    });

    return {
      ok: true,
      user: { id: `u${dbId}`, dbId, role, name: session.user.name ?? "Pengguna" },
      today: new Date().toISOString().slice(0, 10),
      stats: {
        roleCounts,
        totalArtworks: Number(artworkTotalResult.rows[0]?.total ?? 0),
        openReports: Number(reportTotalResult.rows[0]?.total ?? 0),
        activeChallenges: Number(activeChallengeResult.rows[0]?.total ?? 0),
      },
      pendingCurators: pendingCurators.rows,
      openReports: openReports.rows.map((row) => ({
        id: String(row.id),
        type: row.type,
        reason: row.reason,
        reporterName: row.reporter_name ?? "Member",
      })),
      member: memberData,
      curator: curatorData,
    };
  } catch {
    return { ok: false, error: "Data dashboard gagal dimuat." };
  }
}

export async function listUserAdminData() {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  try {
    const { rows } = await pool.query("SELECT * FROM users ORDER BY joined_at DESC");
    return { ok: true, users: rows.map(toUser), currentDbId: access.dbId };
  } catch {
    return { ok: false, error: "Data pengguna gagal dimuat." };
  }
}

export async function listCuratorAdminData() {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE role = 'curator' ORDER BY joined_at DESC");
    return { ok: true, curators: rows.map(toUser), currentDbId: access.dbId };
  } catch {
    return { ok: false, error: "Data curator gagal dimuat." };
  }
}

export async function updateUserStatus(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const dbId = Number(value(formData, "id"));
  const status = value(formData, "status");
  const reason = value(formData, "reason");

  if (!Number.isInteger(dbId) || dbId <= 0) return { ok: false, error: "Pengguna tidak ditemukan." };
  if (dbId === access.dbId) return { ok: false, error: "Akun sendiri tidak bisa diubah." };
  if (!["approved", "rejected", "suspended"].includes(status)) {
    return { ok: false, error: "Status tidak valid." };
  }

  try {
    const { rows } = await pool.query("SELECT role, status FROM users WHERE id = $1", [dbId]);
    const target = rows[0];
    if (!target || target.role === "admin") return { ok: false, error: "Pengguna tidak ditemukan." };
    if (status === "rejected" && target.role !== "curator") {
      return { ok: false, error: "Penolakan hanya berlaku untuk curator." };
    }
    if (status === "suspended" && !reason) {
      return { ok: false, error: "Alasan penangguhan wajib diisi." };
    }
    if (status === "suspended" && target.status === "rejected") {
      return { ok: false, error: "Curator yang ditolak tidak bisa ditangguhkan." };
    }

    await pool.query(
      "UPDATE users SET status = $1, suspension_reason = $2, suspended_at = $3 WHERE id = $4",
      [status, status === "suspended" ? reason : "", status === "suspended" ? new Date().toISOString() : null, dbId],
    );
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: "Status pengguna gagal diperbarui." };
  }
}

export async function deleteUser(formData) {
  const access = await requireAdmin();
  if (access.error) return { ok: false, error: access.error };

  const dbId = Number(value(formData, "id"));
  if (!Number.isInteger(dbId) || dbId <= 0) return { ok: false, error: "Pengguna tidak ditemukan." };
  if (dbId === access.dbId) return { ok: false, error: "Akun sendiri tidak bisa dihapus." };

  const client = await pool.connect();
  let files = [];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT role FROM users WHERE id = $1", [dbId]);
    const target = rows[0];
    if (!target || target.role !== "curator") {
      await client.query("ROLLBACK");
      return { ok: false, error: "Hanya akun Curator yang bisa dihapus." };
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
    return { ok: false, error: "Pengguna gagal dihapus." };
  } finally {
    client.release();
  }

  await removeUploads(files);
  revalidateAdmin();
  return { ok: true };
}
