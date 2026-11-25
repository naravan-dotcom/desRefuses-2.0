import Link from "next/link";
import pool from "@/lib/db";
import { toArtwork, toCategory, toUser } from "@/lib/db-shape";
import CreatorClient from "./creator-client";

export default async function CreatorPage({ params }) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return (
      <main className="page-enter px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-user text-2xl text-ink/40" />
          <h1 className="font-display mt-4 text-[28px]">Kreator tidak ditemukan.</h1>
          <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Kembali ke galeri</Link>
        </div>
      </main>
    );
  }

  const [userResult, artworksResult, categoriesResult] = await Promise.all([
    pool.query("SELECT * FROM users WHERE id = $1", [numericId]),
    pool.query("SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC", [numericId]),
    pool.query("SELECT id, name, slug FROM categories"),
  ]);

  if (!userResult.rows.length) {
    return (
      <main className="page-enter px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-user text-2xl text-ink/40" />
          <h1 className="font-display mt-4 text-[28px]">Kreator tidak ditemukan.</h1>
          <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Kembali ke galeri</Link>
        </div>
      </main>
    );
  }

  const creatorRow = userResult.rows[0];
  const creator = { ...toUser(creatorRow), id: String(creatorRow.id) };
  const artworks = artworksResult.rows.map(toArtwork);
  const categoryNames = Object.fromEntries(categoriesResult.rows.map((row) => [String(row.id), toCategory(row).name]));

  return <CreatorClient creator={creator} artworks={artworks} categoryNames={categoryNames} />;
}
