import pool from "@/lib/db";
import { toArtwork, toCategory } from "@/lib/db-shape";
import GalleryClient from "./gallery-client";

export default async function GalleryPage() {
  const [categoriesResult, artworksResult, usersResult, commentsResult] = await Promise.all([
    pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC"),
    pool.query("SELECT * FROM artworks ORDER BY created_at DESC"),
    pool.query("SELECT id, name FROM users"),
    pool.query("SELECT artwork_id, COUNT(*)::int AS total FROM comments GROUP BY artwork_id"),
  ]);

  const categories = categoriesResult.rows.map(toCategory);
  const artworks = artworksResult.rows.map(toArtwork);
  const creators = Object.fromEntries(usersResult.rows.map((row) => [`u${row.id}`, row.name]));
  const categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  const commentCounts = Object.fromEntries(commentsResult.rows.map((row) => [String(row.artwork_id), Number(row.total)]));

  return (
    <GalleryClient
      categories={categories}
      artworks={artworks}
      creators={creators}
      categoryNames={categoryNames}
      commentCounts={commentCounts}
    />
  );
}
