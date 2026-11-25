"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ArtworkCard from "@/components/artwork/artwork-card";
import ChallengeCard from "@/components/challenge/challenge-card";
import { useSession } from "@/lib/use-session";

function artCode(artwork) {
  const digits = String(artwork?.id || "").replace(/\D/g, "");
  return digits ? `No. ${digits.padStart(2, "0")}` : `No. ${String(artwork?.id || "").slice(-2).toUpperCase()}`;
}

export default function HomeClient({
  categories,
  artworks,
  users,
  categoryNames,
  memberCount,
  commentCounts,
  activeChallenges,
  submissionCounts,
  winnerTitles,
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState("popular");
  const { user } = useSession();

  const filteredArtworks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = artworks.filter((artwork) => {
      if (categoryId !== "all" && artwork.categoryId !== categoryId) return false;
      if (!needle) return true;
      const creator = users[artwork.userId];
      return [artwork.title, artwork.description, ...(artwork.tags ?? []), creator?.name, creator?.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    list = [...list].sort((a, b) => {
      if (sort === "popular") return (b.likes ?? 0) - (a.likes ?? 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }, [artworks, users, query, categoryId, sort]);
  const visibleArtworks = filteredArtworks.slice(0, 6);

  const sortedByLikes = useMemo(
    () => [...artworks].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)),
    [artworks],
  );
  const featured = sortedByLikes[0];
  const secondary = sortedByLikes[1] ?? featured;

  const matchingChallenges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return activeChallenges;
    return activeChallenges.filter((challenge) =>
      `${challenge.title} ${challenge.description}`.toLowerCase().includes(needle),
    );
  }, [activeChallenges, query]);

  function scrollToGallery() {
    document.getElementById("galeri")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFilters() {
    setQuery("");
    setCategoryId("all");
  }

  return (
    <main className="page-enter">
      <section className="border-b hairline">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pb-20 lg:pt-14">
          <div className="lg:col-span-7">
            <p className="label" data-reveal>Salon des Refusés · MDCCCLXIII</p>
            <h1 className="font-display mt-5 text-[44px] leading-[1.06] sm:text-[58px] lg:text-[70px]" data-reveal>
              Karya yang ditolak juri, dikenang sejarah.
            </h1>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.7] text-ink/80" data-reveal>
              Platform seni digital yang membalik sejarah. Tanpa dewan juri, tanpa antrean seleksi. Publik yang mengapresiasi, kreator yang berkuasa penuh atas karyanya.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3" data-reveal>
              <button type="button" onClick={scrollToGallery} className="btn btn-ink">Jelajahi galeri</button>
              <Link href="/challenges" className="btn btn-outline">Lihat tantangan</Link>
              {user?.role === "member" && (
                <Link href="/dashboard/artworks" className="btn btn-acid">Unggah karya</Link>
              )}
            </div>
            <div className="mt-12 grid max-w-[34rem] grid-cols-3 gap-6 border-t hairline pt-6">
              <div>
                <div className="font-display text-[36px] leading-none">{artworks.length}</div>
                <div className="label mt-2">Karya terpajang</div>
              </div>
              <div>
                <div className="font-display text-[36px] leading-none">{memberCount}</div>
                <div className="label mt-2">Kreator</div>
              </div>
              <div>
                <div className="font-display text-[36px] leading-none text-wine">{activeChallenges.length}</div>
                <div className="label mt-2">Tantangan aktif</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            {featured && (
              <>
                <Link href={`/artwork/${featured.id}`} className="art-media block aspect-[4/5]">
                  <img src={featured.image} alt={featured.title} className="art-img h-full w-full object-cover" />
                </Link>
                <div className="border-b hairline pb-4 pt-4">
                  <div className="label">Karya paling diapresiasi · {artCode(featured)}</div>
                  <div className="font-display mt-1.5 text-[26px] leading-[1.15]">{featured.title}</div>
                  <div className="mt-1 text-[15px] text-ink/70">
                    {users[featured.userId]?.name ?? "Kreator"}, {featured.likes ?? 0} suka
                  </div>
                </div>
              </>
            )}
            {secondary && (
              <Link href={`/artwork/${secondary.id}`} className="group flex items-center gap-4 pt-4">
                <img src={secondary.image} alt="" className="h-14 w-14 shrink-0 object-cover" />
                <div className="min-w-0">
                  <div className="label">Karya kedua</div>
                  <div className="font-display text-[19px] leading-tight transition-colors group-hover:text-wine">{secondary.title}</div>
                  <div className="text-[14px] text-ink/70">{users[secondary.userId]?.name ?? "Kreator"}</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="border-b hairline bg-canvas">
        <p className="font-serif-italic mx-auto max-w-[1240px] px-5 py-5 text-center text-[20px] text-ink/80 lg:px-10">
          Tanpa juri seleksi. Karya Anda, hak Anda untuk dilihat.
        </p>
      </div>

      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3" data-reveal>
            <div className="label flex items-center gap-4 text-ink/65"><span>Kronologi</span></div>
            <h2 className="font-display mt-6 text-[31px] leading-[1.12]">
              Dari pintu tertutup ke dinding terbuka.
            </h2>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-ink/65">
              Sejarah singkat gagasan yang terus berpindah bentuk, dari salon Paris ke galeri digital.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-9" data-reveal data-reveal-delay="1">
            {[
              ["1863", "Paris", "Juri menolak", "Salon resmi menutup pintu bagi sebagian besar karya yang diajukan."],
              ["1863", "Pameran", "Publik membuka", "Salon des Refusés memberi karya yang ditolak sebuah ruang untuk dilihat."],
              ["2026", "Web", "Gerbang dilepas", "desRefusés memindahkan semangat itu ke galeri digital tanpa seleksi."],
            ].map(([year, context, title, text]) => (
              <div key={`${year}-${context}`} className="group border-t hairline pt-7">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[38px] leading-none text-wine transition-colors">{year}</span>
                  <span className="label text-ink/65">{context}</span>
                </div>
                <h3 className="font-display mt-6 text-[25px] leading-none">{title}</h3>
                <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ink/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prinsip" className="scroll-mt-24 border-y hairline bg-canvas">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5" data-reveal>
              <div className="label flex items-center gap-4 text-ink/65"><span>Prinsip</span></div>
              <h2 className="font-display mt-6 text-[41px] leading-[1.12] tracking-[-0.01em] sm:text-[46px]">
                Empat hal<br />yang kami jaga.
              </h2>
              <p className="mt-7 max-w-sm text-[15px] leading-[1.7] text-ink/65">
                Bukan janji bahwa semua karya akan disukai. Janji bahwa tidak ada karya yang boleh dihalangi hanya karena selera seseorang.
              </p>
            </div>
            <div className="lg:col-span-7" data-reveal data-reveal-delay="1">
              {[
                ["01", "Hak untuk dilihat", "Karya tampil di galeri utama tanpa antrean seleksi kurator. Tidak ada dewan juri yang menentukan kelayakan tampil."],
                ["02", "Publik yang menilai", "Apresiasi tumbuh dari respons komunitas — suka, komentar, simpan, dan perhatian yang nyata. Bukan dari stempel satu meja."],
                ["03", "Kuasa yang terbatas", "Kurator mengelola challenge miliknya. Admin menjaga etika dan verifikasi. Tidak ada satu peran yang memiliki seluruh galeri."],
                ["04", "Etika, bukan selera", "Kebebasan ekspresi tetap menghormati batas: tanpa plagiarisme, kebencian, pelecehan, atau konten yang membahayakan."],
              ].map(([num, title, text], index) => (
                <details key={num} className="accordion group" open={index === 0}>
                  <summary>
                    <div className="flex items-baseline gap-6">
                      <span className="label w-7 shrink-0 text-wine">{num}</span>
                      <h3 className="font-display text-[28px] leading-none">{title}</h3>
                    </div>
                    <i className="fa-solid fa-plus text-[13px] text-ink/65" />
                  </summary>
                  <div className="accordion-body pb-8 pl-0 sm:pl-[3.25rem]">
                    <p className="max-w-2xl text-[15px] leading-[1.7] text-ink/65">{text}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="galeri" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8" data-reveal>
            <div className="label flex items-center gap-4 text-ink/65"><span>Galeri publik</span></div>
            <h2 className="font-display mt-5 text-[41px] leading-[1.12] tracking-[-0.01em] sm:text-[54px] lg:text-[62px]">
              Salon<br />tanpa juri.
            </h2>
          </div>
          <div className="lg:col-span-4" data-reveal data-reveal-delay="1">
            <p className="max-w-sm text-[15px] leading-[1.7] text-ink/65">
              Semua karya tampil langsung setelah diunggah. Tidak ada antrean seleksi, tidak ada penolakan kurator. Hanya karya dan publiknya.
            </p>
            <div className="mt-6 flex items-center gap-7">
              <button type="button" onClick={() => setSort("popular")} className={`chip ${sort === "popular" ? "active" : ""}`}>
                Paling diapresiasi
              </button>
              <button type="button" onClick={() => setSort("newest")} className={`chip ${sort === "newest" ? "active" : ""}`}>
                Terbaru
              </button>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-b hairline pb-5 lg:flex-row lg:items-end lg:justify-between">
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
          Menampilkan <span className="font-semibold text-ink/80">{visibleArtworks.length}</span> dari {filteredArtworks.length} karya
          {query ? ` untuk “${query}”` : ""}
        </p>

        {visibleArtworks.length ? (
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {visibleArtworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                creator={users[artwork.userId]?.name}
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
            <h3 className="font-display mt-4 text-[24px]">Belum ada karya yang cocok</h3>
            <p className="mt-2 text-sm text-ink/60">Coba kata kunci lain atau pilih kategori berbeda.</p>
            <button type="button" onClick={resetFilters} className="btn btn-outline btn-sm mt-5">Reset filter</button>
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Link href="/gallery" className="btn btn-outline">Jelajahi Galeri</Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-16 lg:px-10 lg:pb-24">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end" data-reveal>
          <div>
            <div className="label flex items-center gap-4 text-ink/65"><span>Ruang kurator</span></div>
            <h2 className="font-display mt-5 text-[38px] leading-[1.12] sm:text-[46px] lg:text-[56px]">
              Pameran<br />tandingan.
            </h2>
          </div>
          <Link href="/challenges" className="btn btn-outline w-fit">Semua tantangan</Link>
        </div>
        {matchingChallenges.length ? (
          <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {matchingChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                curator={users[challenge.curatorId]?.name}
                submissions={submissionCounts[challenge.id] ?? 0}
                winnerTitle={winnerTitles[challenge.id]}
              />
            ))}
          </div>
        ) : (
          <div className="mt-14 border border-dashed border-ink/20 p-10 text-center">
            <i className="fa-regular fa-flag text-2xl text-ink/40" />
            <h3 className="font-display mt-4 text-[24px]">Belum ada tantangan aktif</h3>
            <p className="mt-2 text-sm text-ink/60">Curator sedang menyiapkan pameran tandingan berikutnya.</p>
          </div>
        )}
      </section>


      <section id="manifesto" className="relative scroll-mt-20 overflow-hidden border-y hairline bg-canvas">
        <div className="pointer-events-none absolute -bottom-20 -right-10 select-none font-display text-[36vw] leading-none text-ink/[0.035]">
          1863
        </div>
        <div className="relative mx-auto max-w-[1240px] scroll-mt-24 px-5 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4" data-reveal>
              <p className="font-serif-italic mt-8 text-[32px] leading-[1.12] text-ink sm:text-[41px]">
                “Karya Anda,<br />hak Anda<br />untuk dilihat.”
              </p>
              <Link href="/home#prinsip" className="label mt-9 inline-flex items-center gap-3 text-ink/65 transition-colors hover:text-wine">
                Baca manifesto
              </Link>
            </div>
            <div className="lg:col-span-8" data-reveal data-reveal-delay="1">
              <h2 className="font-display max-w-3xl text-[28px] leading-[1.12] tracking-[-0.01em] text-ink sm:text-[38px]">
                Juri tidak lagi memegang kunci galeri. Kekuasaan dibagi agar tidak menumpuk.
              </h2>
              <div className="mt-14 grid gap-8 sm:grid-cols-3">
                {[
                  ["01", "Member & Kreator", "Mengunggah karya tanpa sensor juri. Mengelola portofolio, berinteraksi, dan melaporkan konten yang melanggar."],
                  ["02", "Curator", "Menyelenggarakan tantangan sukarela setelah disetujui admin. Kuasa terbatas pada ruang acaranya sendiri."],
                  ["03", "Admin", "Memverifikasi curator, mengelola kategori, dan menindak laporan berdasarkan etika komunitas."],
                ].map(([num, title, text]) => (
                  <div key={num} className="group border-t hairline pt-6">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-[28px] leading-none text-wine">{num}</span>
                      <span className="label text-ink/65">Peran</span>
                    </div>
                    <h3 className="font-display mt-5 text-[26px] leading-none">{title}</h3>
                    <p className="mt-4 text-[13px] leading-relaxed text-ink/65">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t hairline pt-7 sm:flex-row sm:items-center">
                <span className="label text-ink/65">Tanpa juri seleksi. Tanpa sensor selera.</span>
                <div className="flex flex-wrap gap-3">
                  {user?.role === "member" ? (
                    <Link href="/dashboard/artworks" className="btn btn-ink btn-sm">Unggah karya sekarang</Link>
                  ) : (
                    <Link href="/register" className="btn btn-outline btn-sm">Daftar sebagai kreator</Link>
                  )}
                  <Link href="/challenges" className="btn btn-outline btn-sm">Lihat tantangan</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
