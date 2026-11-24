"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const timeline = [
  {
    year: "1863",
    place: "Paris",
    title: "Penolakan Juri",
    text: "Salon (ruang) resmi menutup pintu bagi sebagian besar karya yang diajukan.",
  },
  {
    year: "1863",
    place: "Pameran",
    title: "Pembentukan ruang baru",
    text: "Salon des Refusés memberi karya yang ditolak sebuah ruang untuk dilihat.",
  },
  {
    year: "2026",
    place: "Web",
    title: "Modernisasi",
    text: "desRefusés 2.0 memindahkan semangat itu ke galeri digital tanpa seleksi.",
  },
];

const principles = [
  {
    num: "01",
    title: "Hak untuk dilihat",
    text: "Karya tampil di galeri utama tanpa antrean seleksi kurator. Tidak ada dewan juri yang menentukan kelayakan tampil.",
  },
  {
    num: "02",
    title: "Publik yang menilai",
    text: "Apresiasi tumbuh dari respons komunitas — suka, komentar, simpan, dan perhatian yang nyata. Bukan dari stempel satu meja.",
  },
  {
    num: "03",
    title: "Kekuasaan yang terbatas",
    text: "Kurator mengelola tantangan miliknya. Admin menjaga etika dan verifikasi. Tidak ada satu peran yang memiliki seluruh galeri.",
  },
  {
    num: "04",
    title: "Menjunjung etika",
    text: "Kebebasan ekspresi tetap menghormati batas: tanpa plagiarisme, kebencian, pelecehan, atau konten yang membahayakan.",
  },
];

const roles = [
  {
    num: "01",
    label: "Member",
    title: "Kreator",
    text: "Memajang karya tanpa sensor juri, mengelola portofolio, berinteraksi, menyimpan favorit, dan melaporkan konten yang melanggar.",
    tags: ["Unggah karya", "Berkomentar", "Melapor"],
  },
  {
    num: "02",
    label: "Kurator",
    title: "Penyelenggara",
    text: "Mengelola tantangan sukarela setelah disetujui admin. Kuasanya terbatas pada ruang acara sendiri, bukan pada galeri utama.",
    tags: ["Tantangan", "Submisi", "Pemenang"],
  },
  {
    num: "03",
    label: "Admin",
    title: "Konservator",
    text: "Memverifikasi kurator, mengelola kategori, dan menindak laporan berdasarkan etika komunitas. Bukan penentu selera seni.",
    tags: ["Verifikasi", "Moderasi", "Kategori"],
  },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayStr() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function ArtworkCard({ artwork, creator, category }) {
  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block border border-ink/15 bg-white transition-colors hover:border-ink/40"
    >
      <div className="aspect-[4/5] overflow-hidden bg-ink/5">
        <img
          src={artwork.image}
          alt={`Karya ${artwork.title} oleh ${creator ?? "kreator"}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          {category ?? "Tanpa kategori"}
        </p>
        <h3 className="mt-1 text-sm font-medium leading-snug">{artwork.title}</h3>
        <p className="mt-1 text-xs text-ink/55">{creator ?? "kreator"}</p>
        <div className="mt-3 border-t border-ink/10 pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/45">
          {artwork.likes} suka
        </div>
      </div>
    </Link>
  );
}

function ChallengeCard({ challenge, curator, submissions }) {
  return (
    <article className="border border-ink/15 bg-white">
      <div className="aspect-[16/7] overflow-hidden bg-ink/5">
        <img
          src={challenge.banner}
          alt={challenge.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            {curator ?? "Kurator"}
          </p>
          <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
            Aktif
          </span>
        </div>
        <h3 className="mt-2 text-base font-medium">{challenge.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {challenge.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-ink/10 pt-3 text-[10px] uppercase tracking-[0.12em] text-ink/45">
          <span>{submissions} submisi</span>
          <span>
            {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(
    () => ["Semua", ...db.categories.map((category) => category.name)],
    [db],
  );

  const categoryIds = useMemo(
    () =>
      Object.fromEntries(db.categories.map((category) => [category.name, category.id])),
    [db],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((category) => [category.id, category.name])),
    [db],
  );

  const creators = useMemo(
    () => Object.fromEntries(db.users.map((user) => [user.id, user.name])),
    [db],
  );

  const submissionCounts = useMemo(
    () =>
      db.submissions.reduce((counts, submission) => {
        counts[submission.challengeId] = (counts[submission.challengeId] ?? 0) + 1;
        return counts;
      }, {}),
    [db],
  );

  const activeName = categories.includes(activeCategory) ? activeCategory : "Semua";

  const matchingArtworks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const categoryId = categoryIds[activeName];

    return db.artworks.filter((artwork) => {
      if (activeName !== "Semua" && artwork.categoryId !== categoryId) return false;
      if (!needle) return true;
      return [artwork.title, creators[artwork.userId] ?? ""].some((value) =>
        String(value).toLowerCase().includes(needle),
      );
    });
  }, [db, query, activeName, categoryIds, creators]);

  const popularArtworks = useMemo(
    () =>
      [...matchingArtworks]
        .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
        .slice(0, 4),
    [matchingArtworks],
  );

  const latestArtworks = useMemo(
    () =>
      [...matchingArtworks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [matchingArtworks],
  );

  const activeChallenges = useMemo(() => {
    const today = todayStr();
    const needle = query.trim().toLowerCase();

    return db.challenges.filter((challenge) => {
      if (challenge.startDate > today || challenge.endDate < today) return false;
      if (!needle) return true;
      return [challenge.title, challenge.description].some((value) =>
        String(value).toLowerCase().includes(needle),
      );
    });
  }, [db, query]);

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-14">
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Arsip fondasi / 1863—2026
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Penolakan yang melahirkan ruang.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Pada 1863, juri Salon resmi Paris menolak sebagian besar karya yang
            diajukan. Protes itu membuka <span className="font-medium text-ink">Salon des Refusés</span> — pameran bagi karya yang tidak diterima institusi.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Nilai sebuah karya tidak seharusnya ditentukan oleh satu meja juri.
            Hak untuk dilihat tidak boleh dimonopoli satu pihak.
          </p>
          <div className="flex flex-wrap gap-8 pt-2">
            <div>
              <p className="text-2xl font-semibold">{db.artworks.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Karya dipajang
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeChallenges.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Tantangan aktif
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">0</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Juri utama
              </p>
            </div>
          </div>
        </section>

        <section id="jelajah" className="scroll-mt-24 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Jelajah galeri
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Cari karya atau tantangan.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul karya, kreator, atau challenge"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink sm:max-w-sm"
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
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Paling disukai
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Karya populer
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {popularArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                creator={creators[artwork.userId]}
                category={categoryNames[artwork.categoryId]}
              />
            ))}
            {popularArtworks.length === 0 && (
              <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Tidak ada karya yang cocok.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Terbaru
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Karya terbaru
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latestArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                creator={creators[artwork.userId]}
                category={categoryNames[artwork.categoryId]}
              />
            ))}
            {latestArtworks.length === 0 && (
              <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Tidak ada karya yang cocok.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Tantangan aktif
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Ruang yang sedang berjalan.
              </h2>
            </div>
            <Link
              href="/challenges"
              className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                curator={creators[challenge.curatorId]}
                submissions={submissionCounts[challenge.id] ?? 0}
              />
            ))}
            {activeChallenges.length === 0 && (
              <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Tidak ada tantangan aktif yang cocok.
              </p>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-14">
          <section className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Kronologi
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Dari pintu tertutup ke dinding terbuka.
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {timeline.map((item, index) => (
                <div key={index} className="border border-ink/15 bg-white p-5">
                  <p className="text-2xl font-semibold text-ink/30">{item.year}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {item.place}
                  </p>
                  <p className="mt-3 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="prinsip" className="scroll-mt-24 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Prinsip
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Empat hal yang kami jaga.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
              Bukan janji bahwa semua karya akan disukai. Janji bahwa tidak ada
              karya yang boleh dihalangi hanya karena selera seseorang.
            </p>
            <div className="space-y-3">
              {principles.map((item) => (
                <div key={item.num} className="border border-ink/15 bg-white p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {item.num}
                  </p>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="peran" className="scroll-mt-24 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Division of Power
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Desentralisasi Kekuasaan.
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {roles.map((item) => (
                <div key={item.num} className="border border-ink/15 bg-white p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    {item.text}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-ink/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-ink/15 pt-10">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Ajakan
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Sejarah tidak berhenti pada penolakan.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
              Setiap karya yang diunggah adalah kelanjutan dari semangat 1863:
              membuka ruang ketika pintu lain menutup.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/register"
                className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
              >
                Daftar sebagai kreator
              </Link>
              <Link
                href="/gallery"
                className="border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                Jelajahi galeri
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
