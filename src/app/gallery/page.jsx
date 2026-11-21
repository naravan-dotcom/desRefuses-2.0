"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const initialSeed = createSeedDb();
const categories = ["Semua", ...initialSeed.categories.map((category) => category.name)];
const categoryIds = Object.fromEntries(
  initialSeed.categories.map((category) => [category.name, category.id]),
);

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
        activeCategory === "Semua" ||
        artwork.categoryId === categoryIds[activeCategory];
      if (!matchCategory) return false;
      if (!needle) return true;

      const creator = creators[artwork.userId] ?? "";
      return [artwork.title, creator, ...artwork.tags].some((value) =>
        String(value).toLowerCase().includes(needle),
      );
    });
  }, [db, query, activeCategory, creators]);

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
                    category === activeCategory
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
              <Link
                key={artwork.id}
                href={`/artwork/${artwork.id}`}
                className="group block border border-ink/15 bg-white transition-colors hover:border-ink/40"
              >
                <article>
                  <div className="aspect-[4/5] overflow-hidden bg-ink/5">
                    <img
                      src={artwork.image}
                      alt={`Karya ${artwork.title} oleh ${creators[artwork.userId] ?? "kreator"}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                      {categoryNames[artwork.categoryId]}
                    </p>
                    <h3 className="mt-1 text-sm font-medium leading-snug">
                      {artwork.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink/55">
                      {creators[artwork.userId]}
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-ink/10 pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/45">
                      <span>{artwork.likes} suka</span>
                      <span>{commentCounts[artwork.id] ?? 0} komentar</span>
                    </div>
                  </div>
                </article>
              </Link>
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
