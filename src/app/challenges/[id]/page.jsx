import Link from "next/link";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toChallenge } from "@/lib/db-shape";
import ChallengeClient from "./challenge-client";

function notFound() {
  return (
    <main className="page-enter px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
        <i className="fa-regular fa-flag text-2xl text-ink/40" />
        <h1 className="font-display mt-4 text-[28px]">Challenge tidak ditemukan.</h1>
        <Link href="/challenges" className="btn btn-outline btn-sm mt-5">Kembali ke daftar challenge</Link>
      </div>
    </main>
  );
}

export default async function ChallengeDetailPage({ params }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return notFound();

  const session = await auth();
  const memberId = session?.user?.role === "member" ? Number(session.user.dbId) : null;

  const [challengeResult, entriesResult, artworksResult, clockResult] = await Promise.all([
    pool.query(
      "SELECT c.*, u.name AS curator_name, u.avatar AS curator_avatar, u.id AS curator_db_id FROM challenges c JOIN users u ON u.id = c.curator_id WHERE c.id = $1",
      [numericId],
    ),
    pool.query(
      "SELECT s.id AS submission_id, s.rank, s.created_at AS submitted_at, to_jsonb(a) AS artwork, u.name AS submitter_name, u.id AS submitter_id, au.name AS artwork_owner_name, au.id AS artwork_owner_id, au.avatar AS artwork_owner_avatar, cat.name AS category_name, (SELECT COUNT(*)::int FROM comments cm WHERE cm.artwork_id = a.id) AS comment_count FROM submissions s JOIN artworks a ON a.id = s.artwork_id JOIN users u ON u.id = s.member_id JOIN users au ON au.id = a.user_id LEFT JOIN categories cat ON cat.id = a.category_id WHERE s.challenge_id = $1 ORDER BY s.created_at DESC",
      [numericId],
    ),
    memberId
      ? pool.query("SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC", [memberId])
      : Promise.resolve({ rows: [] }),
    pool.query("SELECT CURRENT_DATE::text AS today"),
  ]);

  const row = challengeResult.rows[0];
  if (!row) return notFound();

  const entries = entriesResult.rows.map((entry) => ({
    id: String(entry.submission_id),
    rank: entry.rank ?? null,
    createdAt: entry.submitted_at ? new Date(entry.submitted_at).toISOString() : "",
    submitterName: entry.submitter_name ?? "Kreator",
    submitterId: String(entry.submitter_id ?? ""),
    artwork: {
      ...toArtwork(entry.artwork),
      creatorName: entry.artwork_owner_name ?? "Kreator",
      creatorId: String(entry.artwork_owner_id ?? ""),
      creatorAvatar: entry.artwork_owner_avatar ?? "",
      categoryName: entry.category_name ?? "",
      commentCount: Number(entry.comment_count ?? 0),
    },
  }));

  const rankLabels = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
  const winners = entries
    .filter((entry) => rankLabels[entry.rank])
    .map((entry) => ({ key: entry.rank, label: rankLabels[entry.rank], artwork: entry.artwork }));

  const user = session?.user
    ? {
        id: session.user.id,
        dbId: Number(session.user.dbId),
        role: session.user.role,
        name: session.user.name,
      }
    : null;

  return (
    <ChallengeClient
      challenge={{ ...toChallenge(row), curatorDbId: Number(row.curator_db_id) }}
      curator={{
        id: String(row.curator_db_id),
        name: row.curator_name ?? "Curator",
        avatar: row.curator_avatar ?? "",
      }}
      entries={entries}
      winners={winners}
      myArtworks={artworksResult.rows.map(toArtwork)}
      mySubmission={entries.find((entry) => entry.submitterId === String(memberId)) ?? null}
      user={user}
      today={clockResult.rows[0].today}
    />
  );
}
