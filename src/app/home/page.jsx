import pool from "@/lib/db";
import { toArtwork, toCategory, toChallenge } from "@/lib/db-shape";
import HomeClient from "./home-client";

export default async function HomePage() {
  const [categoriesResult, usersResult, artworksResult, commentsResult, challengesResult, submissionsResult, winnersResult] =
    await Promise.all([
      pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
      pool.query("SELECT id, name, username, role FROM users"),
      pool.query("SELECT * FROM artworks ORDER BY created_at DESC"),
      pool.query("SELECT artwork_id, COUNT(*)::int AS total FROM comments GROUP BY artwork_id"),
      pool.query(
        "SELECT * FROM challenges WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE ORDER BY end_date ASC",
      ),
      pool.query("SELECT challenge_id, COUNT(*)::int AS total FROM submissions GROUP BY challenge_id"),
      pool.query(
        "SELECT s.challenge_id, a.title FROM submissions s JOIN artworks a ON a.id = s.artwork_id WHERE s.rank = 1",
      ),
    ]);

  const categories = categoriesResult.rows.map(toCategory);
  const artworks = artworksResult.rows.map(toArtwork);
  const users = Object.fromEntries(
    usersResult.rows.map((row) => [`u${row.id}`, { ...row, dbId: Number(row.id) }]),
  );
  const categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  const memberCount = usersResult.rows.filter((row) => row.role === "member").length;
  const commentCounts = Object.fromEntries(commentsResult.rows.map((row) => [String(row.artwork_id), Number(row.total)]));
  const activeChallenges = challengesResult.rows.map(toChallenge);
  const submissionCounts = Object.fromEntries(
    submissionsResult.rows.map((row) => [String(row.challenge_id), Number(row.total)]),
  );
  const winnerTitles = Object.fromEntries(winnersResult.rows.map((row) => [String(row.challenge_id), row.title]));

  return (
    <HomeClient
      categories={categories}
      artworks={artworks}
      users={users}
      categoryNames={categoryNames}
      memberCount={memberCount}
      commentCounts={commentCounts}
      activeChallenges={activeChallenges}
      submissionCounts={submissionCounts}
      winnerTitles={winnerTitles}
    />
  );
}
