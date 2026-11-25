"use client";

import { useMemo, useState } from "react";
import ArtworkCard from "@/components/artwork-card";

export default function GalleryClient({ categories, artworks, creators, categoryNames, commentCounts }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return artworks.filter((artwork) => {
      if (categoryId !== "all" && artwork.categoryId !== categoryId) return false;
      if (!needle) return true;
      return [artwork.title, creators[artwork.userId], ...(artwork.tags ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [artworks, creators, query, categoryId]);

  return (
    <main className="page-enter">
      <section className="border-b hairline">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-10 lg:py-20">
          <div className="label flex items-center gap-4 text-ink/65"><span>Galeri publik</span></div>
          <h1 className="font-display mt-6 text-[44px] leading-[1.06] sm:text-[59px] lg:text-[68px]">
            Karya tanpa<br />seleksi juri.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-ink/65">
            Jelajahi karya yang dipajang langsung oleh para kreator. Tidak ada kurasi untuk tampil — apresiasi datang dari publik.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-12 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-5 border-b hairline pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <i className="fa-solid fa-magnifying-glass absolute left-0 top-1/2 -translate-y-1/2 text-xs text-ink/65" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul, kreator, atau tag..."
              className="field pl-6 text-[15px]"
            />
          </div>
          <div className="-mx-1 flex items-center gap-6 overflow-x-auto px-1 pb-1">
            <button type="button" onClick={() => setCategoryId("all")} className={`chip ${categoryId === "all" ? "active" : ""}`}>
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`chip ${categoryId === category.id ? "active" : ""}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <p className="label mt-6 text-ink/65">
          <span className="font-semibold text-ink/80">{filtered.length}</span> karya ditemukan
          {query ? ` untuk “${query}”` : ""}
        </p>

        {filtered.length ? (
          <div className="mt-8 columns-1 gap-8 sm:columns-2 xl:columns-3">
            {filtered.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                creator={creators[artwork.userId]}
                creatorId={artwork.userId.replace(/^u/, "")}
                category={categoryNames[artwork.categoryId]}
                commentCount={commentCounts[artwork.id] ?? 0}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-ink/20 p-10 text-center">
            <i className="fa-regular fa-folder-open text-2xl text-ink/40" />
            <h2 className="font-display mt-4 text-[24px]">Belum ada karya yang cocok</h2>
            <p className="mt-2 text-sm text-ink/60">Coba kata kunci lain atau pilih kategori berbeda.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategoryId("all");
              }}
              className="btn btn-outline btn-sm mt-5"
            >
              Reset filter
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
