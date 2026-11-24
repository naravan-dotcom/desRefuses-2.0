"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

export default function GalleryPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(
    () => ["Semua", ...db.categories.map((category) => category.name)],
    [db],
  );

  const categoryIds = useMemo(
    () => Object.fromEntries(db.categories.map((category) => [category.name, category.id])),
    [db],
  );

  const activeName = categories.includes(activeCategory) ? activeCategory : "Semua";

  const creators = useMemo(
    () => Object.fromEntries(db.users.map((user) => [user.id, user.name])),
    [db],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((category) => [category.id, category.name])),
    [db],
  );

  const commentCounts = useMemo(() => {
    return db.comments.reduce((counts, comment) => {
      counts[comment.artworkId] = (counts[comment.artworkId] ?? 0) + 1;
      return counts;
    }, {});
  }, [db]);

  const artworks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.artworks.filter((artwork) => {
      const matchCategory =
        activeName === "Semua" ||
        artwork.categoryId === categoryIds[activeName];
      if (!matchCategory) return false;
      if (!needle) return true;

      const creator = creators[artwork.userId] ?? "";
      return [artwork.title, creator, ...artwork.tags].some((value) =>
        String(value).toLowerCase().includes(needle),
      );
    });
  }, [db, query, activeName, creators, categoryIds]);

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Galeri publik
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Karya tanpa seleksi juri.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Jelajahi karya yang dipajang langsung oleh para kreator. Tidak ada
            kurasi untuk tampil — apresiasi datang dari publik.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari karya atau kreator"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                    category === activeName
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-ink/60 hover:border-ink hover:text-ink"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {artworks.map((artwork) => (
              <article
                key={artwork.id}
                className="group border border-ink/15 bg-white transition-colors hover:border-ink/40"
              >
                <Link href={`/artwork/${artwork.id}`} className="block">
                  <div className="aspect-[4/5] overflow-hidden bg-ink/5">
                    <img
                      src={artwork.image}
                      alt={`Karya ${artwork.title} oleh ${creators[artwork.userId] ?? "kreator"}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-3 pb-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                      {categoryNames[artwork.categoryId]}
                    </p>
                    <h3 className="mt-1 text-sm font-medium leading-snug">
                      {artwork.title}
                    </h3>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  {creators[artwork.userId] ? (
                    <Link
                      href={`/creator/${artwork.userId}`}
                      className="text-xs text-ink/55 hover:text-ink hover:underline"
                    >
                      {creators[artwork.userId]}
                    </Link>
                  ) : (
                    <p className="text-xs text-ink/55">Kreator</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 border-t border-ink/10 pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/45">
                    <span>{artwork.likes} suka</span>
                    <span>{commentCounts[artwork.id] ?? 0} komentar</span>
                  </div>
                </div>
              </article>
            ))}
            {artworks.length === 0 && (
              <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Tidak ada karya yang cocok.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
