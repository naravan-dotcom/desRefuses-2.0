"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthName = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

function externalHref(value) {
  return /^https?:\/\//i.test(value) ? value : null;
}

export default function CreatorPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [db, setDb] = useState(() => createSeedDb());

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const creator = useMemo(
    () => db.users.find((user) => user.id === id),
    [db, id],
  );

  const artworks = useMemo(
    () =>
      db.artworks
        .filter((item) => item.userId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db, id],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((item) => [item.id, item.name])),
    [db],
  );

  const links = creator
    ? [
        { label: "Instagram", value: creator.links?.instagram ?? "" },
        { label: "Behance", value: creator.links?.behance ?? "" },
        { label: "Website", value: creator.links?.website ?? "" },
      ].filter((item) => item.value)
    : [];

  const roleLabel =
    creator?.role === "admin"
      ? "Admin"
      : creator?.role === "curator"
        ? "Kurator"
        : "Member";

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/gallery"
          className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
        >
          Kembali ke galeri
        </Link>

        {!creator ? (
          <div className="border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/55">Kreator tidak ditemukan.</p>
            <Link href="/gallery" className="mt-4 inline-block text-xs underline">
              Kembali ke galeri
            </Link>
          </div>
        ) : (
          <>
            <section className="border border-ink/15 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {creator.avatar ? (
                  <img
                    src={creator.avatar}
                    alt={`Foto profil ${creator.name}`}
                    className="h-20 w-20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center border border-ink/15 bg-ink/5 text-xs text-ink/40">
                    Foto
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    Profil kreator · {roleLabel}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {creator.name}
                  </h1>
                  <p className="text-sm text-ink/55">@{creator.username}</p>
                  {creator.bio && (
                    <p className="max-w-2xl text-sm leading-relaxed text-ink/70">
                      {creator.bio}
                    </p>
                  )}
                </div>
              </div>

              {links.length > 0 ? (
                <div className="mt-6 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-3">
                  {links.map((link) =>
                    externalHref(link.value) ? (
                      <a
                        key={link.label}
                        href={externalHref(link.value)}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-ink/15 p-3 text-xs transition-colors hover:border-ink"
                      >
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/40">
                          {link.label}
                        </span>
                        <span className="mt-1 block break-all text-ink/70">
                          {link.value}
                        </span>
                      </a>
                    ) : (
                      <div
                        key={link.label}
                        className="border border-ink/15 p-3 text-xs"
                      >
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-ink/40">
                          {link.label}
                        </span>
                        <span className="mt-1 block break-all text-ink/70">
                          {link.value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-6 border-t border-ink/10 pt-5 text-xs text-ink/45">
                  Belum ada tautan eksternal.
                </p>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    Galeri kreator
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Karya dari {creator.name}
                  </h2>
                </div>
                <p className="text-xs text-ink/50">{artworks.length} karya</p>
              </div>

              {artworks.length === 0 ? (
                <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                  Kreator ini belum mempublikasikan karya.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {artworks.map((artwork) => (
                    <Link
                      key={artwork.id}
                      href={`/artwork/${artwork.id}`}
                      className="group block border border-ink/15 bg-white transition-colors hover:border-ink/40"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-ink/5">
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                          {categoryNames[artwork.categoryId] ?? "Tanpa kategori"}
                        </p>
                        <h3 className="mt-1 text-sm font-medium leading-snug">
                          {artwork.title}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-3 border-t border-ink/10 pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/45">
                          <span>{artwork.likes} suka</span>
                          <span>{formatDate(artwork.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
