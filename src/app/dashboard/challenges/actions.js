"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toChallenge } from "@/lib/db-shape";
import { IMAGE_EXTENSIONS, MAX_UPLOAD_SIZE } from "@/lib/upload";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function isDateInput(input) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const parsed = new Date(`${input}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === input;
}

function validateImage(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return { error: "Pilih file banner terlebih dahulu." };
  }
  if (!Object.keys(IMAGE_EXTENSIONS).includes(String(file.type))) {
    return { error: "Banner harus berupa JPG, PNG, WEBP, atau GIF." };
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return { error: "Ukuran banner maksimal 1 MB." };
  }
  return { ok: true };
}

async function saveImage(file) {
  const filename = `${randomUUID()}${IMAGE_EXTENSIONS[file.type]}`;
  const directory = join(process.cwd(), "public", "uploads", "banner");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/banner/${filename}`;
}

async function removeImage(image) {
  if (typeof image !== "string" || !image.startsWith("/uploads/banner/")) return;
  try {
    await unlink(join(process.cwd(), "public", image));
  } catch {}
}

async function requireCurator() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "curator" ||
    session.user.status !== "approved"
  ) {
    return { error: "Hanya Kurator terverifikasi yang bisa mengelola tantangan." };
  }
  return { dbId: Number(session.user.dbId) };
}

function revalidateChallenges() {
  revalidatePath("/challenges");
  revalidatePath("/dashboard/challenges");
  revalidatePath("/dashboard/submissions");
  revalidatePath("/home");
}

function winnerMap(entries) {
  const labels = { 1: "first", 2: "second", 3: "third" };
  const winners = {};
  entries.forEach((entry) => {
    if (!entry.rank || !labels[entry.rank]) return;
    const key = String(entry.challenge_id);
    if (!winners[key]) winners[key] = { first: null, second: null, third: null };
    winners[key][labels[entry.rank]] = String(entry.artwork?.id ?? "");
  });
  return winners;
}

export async function listCuratorChallengeData() {
  const access = await requireCurator();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [challenges, entries, clock] = await Promise.all([
      pool.query(
        "SELECT c.*, u.name AS curator_name FROM challenges c JOIN users u ON u.id = c.curator_id WHERE c.curator_id = $1 ORDER BY c.created_at DESC",
        [access.dbId],
      ),
      pool.query(
        "SELECT s.id AS submission_id, s.challenge_id, s.member_id, s.rank, s.created_at AS submitted_at, to_jsonb(a) AS artwork, u.name AS submitter_name FROM submissions s JOIN artworks a ON a.id = s.artwork_id JOIN users u ON u.id = s.member_id JOIN challenges c ON c.id = s.challenge_id WHERE c.curator_id = $1 ORDER BY s.created_at DESC",
        [access.dbId],
      ),
      pool.query("SELECT CURRENT_DATE::text AS today"),
    ]);

    const winners = winnerMap(entries.rows);
    const counts = {};
    entries.rows.forEach((entry) => {
      const key = String(entry.challenge_id);
      counts[key] = (counts[key] ?? 0) + 1;
    });

    return {
      ok: true,
      today: clock.rows[0].today,
      challenges: challenges.rows.map((row) => ({
        ...toChallenge(row),
        curatorName: row.curator_name ?? "Kurator",
        submissionCount: counts[String(row.id)] ?? 0,
        winners: winners[String(row.id)] ?? { first: null, second: null, third: null },
      })),
      entries: entries.rows.map((entry) => ({
        id: String(entry.submission_id),
        challengeId: String(entry.challenge_id),
        memberId: String(entry.member_id),
        rank: entry.rank ?? null,
        createdAt: entry.submitted_at ? new Date(entry.submitted_at).toISOString() : "",
        submitterName: entry.submitter_name ?? "Kreator",
        artwork: toArtwork(entry.artwork),
      })),
    };
  } catch {
    return { ok: false, error: "Tantangan gagal dimuat." };
  }
}

export async function createChallenge(formData) {
  const access = await requireCurator();
  if (access.error) return { ok: false, error: access.error };

  const title = value(formData, "title");
  const description = value(formData, "description");
  const rules = value(formData, "rules");
  const prize = value(formData, "prize");
  const startDate = value(formData, "startDate");
  const endDate = value(formData, "endDate");
  const file = formData.get("banner");

  if (!title || !description || !rules || !prize) {
    return { ok: false, error: "Semua field tantangan wajib diisi." };
  }
  if (!isDateInput(startDate) || !isDateInput(endDate)) {
    return { ok: false, error: "Format tanggal tidak valid." };
  }
  const imageCheck = validateImage(file);
  if (imageCheck.error) return { ok: false, error: imageCheck.error };

  try {
    const { rows } = await pool.query("SELECT CURRENT_DATE::text AS today");
    const today = rows[0].today;
    if (startDate < today) return { ok: false, error: "Tanggal mulai tidak boleh sebelum hari ini." };
    if (endDate <= startDate || endDate <= today) {
      return { ok: false, error: "Tanggal selesai harus setelah tanggal mulai dan tidak boleh hari ini." };
    }

    const banner = await saveImage(file);
    const { rows: inserted } = await pool.query(
      "INSERT INTO challenges (curator_id, title, description, rules, prize, start_date, end_date, banner) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [access.dbId, title, description, rules, prize, startDate, endDate, banner],
    );
    revalidateChallenges();
    return { ok: true, challenge: toChallenge(inserted[0]) };
  } catch {
    return { ok: false, error: "Tantangan gagal dibuat." };
  }
}

export async function updateChallenge(formData) {
  const access = await requireCurator();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  const title = value(formData, "title");
  const description = value(formData, "description");
  const rules = value(formData, "rules");
  const prize = value(formData, "prize");
  const startDate = value(formData, "startDate");
  const endDate = value(formData, "endDate");
  const existingBanner = value(formData, "existingBanner");
  const file = formData.get("banner");

  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Tantangan tidak ditemukan." };
  if (!title || !description || !rules || !prize) {
    return { ok: false, error: "Semua field tantangan wajib diisi." };
  }
  if (!isDateInput(startDate) || !isDateInput(endDate)) {
    return { ok: false, error: "Format tanggal tidak valid." };
  }

  let banner = existingBanner;
  let newBanner = "";
  if (file && typeof file !== "string" && file.size > 0) {
    const imageCheck = validateImage(file);
    if (imageCheck.error) return { ok: false, error: imageCheck.error };
    banner = await saveImage(file);
    newBanner = banner;
  }
  if (!banner) return { ok: false, error: "Banner tantangan wajib diisi." };

  try {
    const existing = await pool.query(
      "SELECT banner, created_at::date::text AS created FROM challenges WHERE id = $1 AND curator_id = $2",
      [id, access.dbId],
    );
    if (!existing.rowCount) {
      if (newBanner) await removeImage(newBanner);
      return { ok: false, error: "Tantangan tidak ditemukan." };
    }
    if (startDate < existing.rows[0].created) {
      if (newBanner) await removeImage(newBanner);
      return { ok: false, error: "Tanggal mulai tidak boleh sebelum tanggal dibuat." };
    }
    if (endDate <= startDate) {
      if (newBanner) await removeImage(newBanner);
      return { ok: false, error: "Tanggal selesai harus setelah tanggal mulai." };
    }

    const { rows } = await pool.query(
      "UPDATE challenges SET title = $1, description = $2, rules = $3, prize = $4, start_date = $5, end_date = $6, banner = $7 WHERE id = $8 AND curator_id = $9 RETURNING *",
      [title, description, rules, prize, startDate, endDate, banner, id, access.dbId],
    );
    if (!rows.length) {
      if (newBanner) await removeImage(newBanner);
      return { ok: false, error: "Tantangan tidak ditemukan." };
    }
    if (newBanner) await removeImage(existing.rows[0].banner);
    revalidateChallenges();
    return { ok: true, challenge: toChallenge(rows[0]) };
  } catch {
    if (newBanner) await removeImage(newBanner);
    return { ok: false, error: "Tantangan gagal diperbarui." };
  }
}

export async function deleteChallenge(formData) {
  const access = await requireCurator();
  if (access.error) return { ok: false, error: access.error };

  const id = Number(value(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Tantangan tidak ditemukan." };

  try {
    const { rows } = await pool.query(
      "SELECT banner FROM challenges WHERE id = $1 AND curator_id = $2",
      [id, access.dbId],
    );
    if (!rows.length) return { ok: false, error: "Tantangan tidak ditemukan." };

    await pool.query("DELETE FROM challenges WHERE id = $1 AND curator_id = $2", [id, access.dbId]);
    await removeImage(rows[0].banner);
    revalidateChallenges();
    return { ok: true };
  } catch {
    return { ok: false, error: "Tantangan gagal dihapus." };
  }
}

export async function saveWinners(formData) {
  const access = await requireCurator();
  if (access.error) return { ok: false, error: access.error };

  const challengeId = Number(value(formData, "challengeId"));
  if (!Number.isInteger(challengeId) || challengeId <= 0) {
    return { ok: false, error: "Tantangan tidak ditemukan." };
  }

  const selections = [
    { rank: 1, artworkId: Number(value(formData, "first")) },
    { rank: 2, artworkId: Number(value(formData, "second")) },
    { rank: 3, artworkId: Number(value(formData, "third")) },
  ].filter((item) => Number.isInteger(item.artworkId) && item.artworkId > 0);

  const chosen = selections.map((item) => item.artworkId);
  if (chosen.length !== new Set(chosen).size) {
    return { ok: false, error: "Satu karya hanya boleh dipilih untuk satu peringkat." };
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT c.end_date::text AS end, CURRENT_DATE::text AS today FROM challenges c WHERE c.id = $1 AND c.curator_id = $2",
      [challengeId, access.dbId],
    );
    if (!rows.length) {
      return { ok: false, error: "Tantangan tidak ditemukan." };
    }
    if (rows[0].today <= rows[0].end) {
      return { ok: false, error: "Pemenang hanya bisa dipilih setelah tantangan berakhir." };
    }

    await client.query("BEGIN");
    await client.query("UPDATE submissions SET rank = NULL WHERE challenge_id = $1", [challengeId]);
    for (const item of selections) {
      const updated = await client.query(
        "UPDATE submissions SET rank = $1 WHERE challenge_id = $2 AND artwork_id = $3",
        [item.rank, challengeId, item.artworkId],
      );
      if (!updated.rowCount) {
        await client.query("ROLLBACK");
        return { ok: false, error: "Salah satu karya bukan peserta tantangan ini." };
      }
    }
    await client.query("COMMIT");
    revalidateChallenges();
    return { ok: true };
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {}
    return { ok: false, error: "Pemenang gagal disimpan." };
  } finally {
    client.release();
  }
}
