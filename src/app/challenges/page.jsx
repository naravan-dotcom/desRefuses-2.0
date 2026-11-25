import pool from "@/lib/db";
import { toChallenge } from "@/lib/db-shape";
import ChallengesClient from "./challenges-client";

export default async function ChallengesPage() {
  const [challengesResult, curatorsResult, countsResult, clockResult] = await Promise.all([
    pool.query(
      "SELECT c.*, u.name AS curator_name FROM challenges c JOIN users u ON u.id = c.curator_id ORDER BY c.created_at DESC",
    ),
    pool.query("SELECT id, name FROM users WHERE role = 'curator'"),
    pool.query("SELECT challenge_id, COUNT(*)::int AS total FROM submissions GROUP BY challenge_id"),
    pool.query("SELECT CURRENT_DATE::text AS today"),
  ]);

  const challenges = challengesResult.rows.map((row) => ({
    ...toChallenge(row),
    curatorName: row.curator_name ?? "Kurator",
  }));
  const curators = Object.fromEntries(
    curatorsResult.rows.map((row) => [`u${row.id}`, row.name]),
  );
  const submissionCounts = Object.fromEntries(
    countsResult.rows.map((row) => [String(row.challenge_id), Number(row.total)]),
  );

  return (
    <ChallengesClient
      challenges={challenges}
      curators={curators}
      submissionCounts={submissionCounts}
      today={clockResult.rows[0].today}
    />
  );
}
