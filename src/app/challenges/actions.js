"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toChallenge } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMember() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "member" ||
    session.user.status !== "approved"
  ) {
    return { error: "Hanya Member terverifikasi yang bisa mengikuti tantangan." };
  }
  return { dbId: Number(session.user.dbId) };
}

function revalidateChallengeData() {
  revalidatePath("/challenges");
  revalidatePath("/dashboard/challenges");
  revalidatePath("/dashboard/submissions");
  revalidatePath("/home");
}

export async function listMemberSubmissions() {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  try {
    const [submissions, clock] = await Promise.all([
      pool.query(
        "SELECT s.id AS submission_id, s.challenge_id, s.member_id, s.rank, s.created_at AS submitted_at, to_jsonb(c) AS challenge, to_jsonb(a) AS artwork FROM submissions s JOIN challenges c ON c.id = s.challenge_id JOIN artworks a ON a.id = s.artwork_id WHERE s.member_id = $1 ORDER BY s.created_at DESC",
        [access.dbId],
      ),
      pool.query("SELECT CURRENT_DATE::text AS today"),
    ]);

    const labels = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
    return {
      ok: true,
      today: clock.rows[0].today,
      submissions: submissions.rows.map((row) => ({
        id: String(row.submission_id),
        challengeId: String(row.challenge_id),
        artworkId: String(row.artwork?.id ?? ""),
        rank: row.rank ?? null,
        createdAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : "",
        winnerLabel: labels[row.rank] ?? "",
        challenge: toChallenge(row.challenge),
        artwork: toArtwork(row.artwork),
      })),
    };
  } catch {
    return { ok: false, error: "Submisi gagal dimuat." };
  }
}

export async function submitArtwork(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const challengeId = Number(value(formData, "challengeId"));
  const artworkId = Number(value(formData, "artworkId"));
  if (!Number.isInteger(challengeId) || challengeId <= 0) {
    return { ok: false, error: "Challenge tidak ditemukan." };
  }
  if (!Number.isInteger(artworkId) || artworkId <= 0) {
    return { ok: false, error: "Pilih salah satu karya terlebih dahulu." };
  }

  try {
    const [challenge, artwork, existing] = await Promise.all([
      pool.query(
        "SELECT start_date::text AS start, end_date::text AS end, CURRENT_DATE::text AS today FROM challenges WHERE id = $1",
        [challengeId],
      ),
      pool.query("SELECT 1 FROM artworks WHERE id = $1 AND user_id = $2", [artworkId, access.dbId]),
      pool.query("SELECT 1 FROM submissions WHERE challenge_id = $1 AND member_id = $2", [
        challengeId,
        access.dbId,
      ]),
    ]);

    if (!challenge.rowCount) return { ok: false, error: "Challenge tidak ditemukan." };
    const { start, end, today } = challenge.rows[0];
    if (today < start) return { ok: false, error: "Submisi belum dibuka." };
    if (today > end) return { ok: false, error: "Challenge sudah berakhir. Submisi ditutup." };
    if (existing.rowCount) return { ok: false, error: "Anda sudah memiliki submisi di challenge ini." };
    if (!artwork.rowCount) return { ok: false, error: "Pilih salah satu karya milik Anda." };

    await pool.query(
      "INSERT INTO submissions (challenge_id, artwork_id, member_id) VALUES ($1, $2, $3)",
      [challengeId, artworkId, access.dbId],
    );
    revalidateChallengeData();
    return { ok: true };
  } catch (error) {
    if (String(error?.code) === "23505") {
      return { ok: false, error: "Anda sudah memiliki submisi di challenge ini." };
    }
    return { ok: false, error: "Submisi gagal disimpan." };
  }
}

export async function withdrawSubmission(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const submissionId = Number(value(formData, "submissionId"));
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return { ok: false, error: "Submisi tidak ditemukan." };
  }

  try {
    const { rows } = await pool.query(
      "SELECT s.id, c.end_date::text AS end, CURRENT_DATE::text AS today FROM submissions s JOIN challenges c ON c.id = s.challenge_id WHERE s.id = $1 AND s.member_id = $2",
      [submissionId, access.dbId],
    );
    if (!rows.length) return { ok: false, error: "Submisi tidak ditemukan." };
    if (rows[0].today > rows[0].end) {
      return { ok: false, error: "Submisi tidak dapat ditarik setelah challenge berakhir." };
    }

    await pool.query("DELETE FROM submissions WHERE id = $1 AND member_id = $2", [
      submissionId,
      access.dbId,
    ]);
    revalidateChallengeData();
    return { ok: true };
  } catch {
    return { ok: false, error: "Submisi gagal ditarik." };
  }
}
