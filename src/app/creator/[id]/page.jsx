import NotFoundState from "@/components/ui/not-found-state";
import pool from "@/lib/db";
import { toArtwork, toCategory, toUser } from "@/lib/db-shape";
import CreatorClient from "./creator-client";

export default async function CreatorPage({ params }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return (
      <NotFoundState
        icon="fa-regular fa-user"
        title="Kreator tidak ditemukan."
        href="/gallery"
        linkLabel="Kembali ke galeri"
      />
    );
  }

  const [userResult, artworksResult, categoriesResult] = await Promise.all([
    pool.query("SELECT * FROM users WHERE id = $1", [numericId]),
    pool.query("SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC", [numericId]),
    pool.query("SELECT id, name, slug FROM categories"),
  ]);

  if (!userResult.rows.length) {
    return (
      <NotFoundState
        icon="fa-regular fa-user"
        title="Kreator tidak ditemukan."
        href="/gallery"
        linkLabel="Kembali ke galeri"
      />
    );
  }

  const creatorRow = userResult.rows[0];
  const creator = { ...toUser(creatorRow), id: String(creatorRow.id) };
  const artworks = artworksResult.rows.map(toArtwork);
  const categoryNames = Object.fromEntries(categoriesResult.rows.map((row) => [String(row.id), toCategory(row).name]));

  return <CreatorClient creator={creator} artworks={artworks} categoryNames={categoryNames} />;
}
