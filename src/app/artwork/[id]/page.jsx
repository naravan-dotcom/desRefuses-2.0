import Link from "next/link";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { toArtwork, toComment } from "@/lib/db-shape";
import ArtworkClient from "./artwork-client";

function notFound() {
  return (
    <main className="page-enter px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
        <i className="fa-regular fa-image text-2xl text-ink/40" />
        <h1 className="font-display mt-4 text-[28px]">Karya tidak ditemukan.</h1>
        <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Kembali ke galeri</Link>
      </div>
    </main>
  );
}

export default async function ArtworkPage({ params }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return notFound();

  const session = await auth();
  const memberId = session?.user?.role === "member" ? Number(session.user.dbId) : null;

  const [artworkResult, commentsResult, relatedResult, likeResult, favoriteResult, reportsResult] = await Promise.all([
    pool.query(
      "SELECT a.*, u.name AS creator_name, u.username AS creator_username, u.avatar AS creator_avatar, c.name AS category_name FROM artworks a JOIN users u ON u.id = a.user_id LEFT JOIN categories c ON c.id = a.category_id WHERE a.id = $1",
      [numericId],
    ),
    pool.query(
      "SELECT c.*, u.name AS author_name, u.avatar AS author_avatar FROM comments c JOIN users u ON u.id = c.user_id WHERE c.artwork_id = $1 ORDER BY c.created_at DESC",
      [numericId],
    ),
    pool.query("SELECT * FROM artworks WHERE user_id = (SELECT user_id FROM artworks WHERE id = $1) AND id <> $1 ORDER BY created_at DESC LIMIT 3", [numericId]),
    memberId
      ? pool.query("SELECT 1 FROM likes WHERE artwork_id = $1 AND member_id = $2", [numericId, memberId])
      : Promise.resolve({ rowCount: 0 }),
    memberId
      ? pool.query("SELECT 1 FROM favorites WHERE artwork_id = $1 AND member_id = $2", [numericId, memberId])
      : Promise.resolve({ rowCount: 0 }),
    memberId
      ? pool.query("SELECT type, target_id FROM reports WHERE reporter_id = $1", [memberId])
      : Promise.resolve({ rows: [] }),
  ]);

  const row = artworkResult.rows[0];
  if (!row) return notFound();

  const creator = {
    id: String(row.user_id),
    dbId: Number(row.user_id),
    name: row.creator_name,
    username: row.creator_username,
    avatar: row.creator_avatar ?? "",
  };
  const reported = reportsResult.rows.map((item) => `${item.type}:${item.target_id}`);
  const user = session?.user
    ? {
        id: session.user.id,
        dbId: Number(session.user.dbId),
        role: session.user.role,
        name: session.user.name,
      }
    : null;

  return (
    <ArtworkClient
      artwork={toArtwork(row)}
      creator={creator}
      categoryName={row.category_name}
      comments={commentsResult.rows.map(toComment)}
      related={relatedResult.rows.map(toArtwork)}
      user={user}
      liked={Boolean(likeResult.rowCount)}
      favorited={Boolean(favoriteResult.rowCount)}
      reported={reported}
    />
  );
}
