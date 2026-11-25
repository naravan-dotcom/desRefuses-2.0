"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const ROLE_LABEL = { admin: "Admin", member: "Member", curator: "Kurator" };

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayStr() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function artCode(artwork) {
  const digits = String(artwork?.id || "").replace(/\D/g, "");
  return digits ? `No. ${digits.padStart(2, "0")}` : `DR-${String(artwork.id).slice(-4).toUpperCase()}`;
}

export default function DashboardPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = loadDb();
      const id = getSessionId();
      setDb(next);
      setUser(next.users.find((item) => item.id === id) ?? null);
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    if (!user) return null;
    const today = todayStr();
    const isActive = (challenge) => challenge.startDate <= today && challenge.endDate >= today;
    const roleCounts = db.users.reduce(
      (acc, item) => {
        acc[item.role] = (acc[item.role] ?? 0) + 1;
        return acc;
      },
      { admin: 0, member: 0, curator: 0 },
    );
    const ownArtworks = db.artworks.filter((item) => item.userId === user.id);
    const ownChallenges = db.challenges.filter((item) => item.curatorId === user.id);
    const ownChallengeIds = ownChallenges.map((item) => item.id);
    const pendingCuratorsList = db.users.filter((item) => item.role === "curator" && item.status === "pending");
    const openReportsList = db.reports.filter((item) => item.status === "open");

    return {
      roleCounts,
      openReports: openReportsList.length,
      openReportsList: openReportsList.slice(0, 4),
      pendingCurators: pendingCuratorsList.length,
      pendingCuratorsList: pendingCuratorsList.slice(0, 4),
      activeChallenges: db.challenges.filter(isActive).length,
      ownArtworksCount: ownArtworks.length,
      totalLikes: ownArtworks.reduce((sum, item) => sum + (item.likes ?? 0), 0),
      favorites: (user.favorites ?? []).length,
      ownSubmissions: db.submissions.filter((item) => item.userId === user.id).length,
      incomingSubmissions: db.submissions.filter((item) => ownChallengeIds.includes(item.challengeId)).length,
      ownChallengesCount: ownChallenges.length,
      ownActiveChallenges: ownChallenges.filter(isActive).length,
      winners: ownChallenges.reduce(
        (sum, challenge) => sum + ["first", "second", "third"].filter((rank) => challenge.winners?.[rank]).length,
        0,
      ),
      recentArtworks: [...ownArtworks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
      featuredArtwork: [...ownArtworks].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null,
      recentChallenges: [...ownChallenges]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    };
  }, [db, user]);

  function quickApproveCurator(id) {
    const next = loadDb();
    const target = next.users.find((item) => item.id === id && item.role === "curator");
    if (!target) return;
    target.status = "approved";
    target.suspensionReason = "";
    target.suspendedAt = null;
    saveDb(next);
    setDb(next);
  }

  if (!loaded || !user || !stats) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        Memuat data dashboard...
      </div>
    );
  }

  const cards =
    user.role === "admin"
      ? [
          { label: "Admin", value: stats.roleCounts.admin, note: "Akun administrator" },
          { label: "Member", value: stats.roleCounts.member, note: "Kreator terdaftar" },
          { label: "Kurator", value: stats.roleCounts.curator, note: "Termasuk pending" },
          { label: "Karya", value: db.artworks.length, note: "Total di platform" },
          { label: "Laporan open", value: stats.openReports, note: "Belum diproses" },
          { label: "Challenge aktif", value: stats.activeChallenges, note: "Periode berjalan" },
        ]
      : user.role === "member"
        ? [
            { label: "Karya saya", value: stats.ownArtworksCount, note: "Portofolio publik" },
            { label: "Apresiasi", value: stats.totalLikes, note: "Total suka diterima" },
            { label: "Favorit", value: stats.favorites, note: "Karya tersimpan" },
            { label: "Submisi", value: stats.ownSubmissions, note: "Challenge diikuti" },
          ]
        : [
            { label: "Challenge", value: stats.ownChallengesCount, note: "Dibuat oleh Anda" },
            { label: "Submisi masuk", value: stats.incomingSubmissions, note: "Karya partisipan" },
            { label: "Challenge aktif", value: stats.ownActiveChallenges, note: "Periode berjalan" },
            { label: "Pemenang", value: stats.winners, note: "Juara 1–3 ditandai" },
          ];

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Ringkasan · {ROLE_LABEL[user.role] ?? user.role}</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Halo, {user.name}.</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          {user.role === "admin"
            ? "Ringkasan statistik platform dan antrean yang perlu ditinjau."
            : user.role === "curator"
              ? "Pantau perkembangan challenge dan submisi partisipan Anda."
              : "Pantau portofolio, apresiasi, dan submisi challenge Anda."}
        </p>
      </header>

      {user.role === "member" && stats.featuredArtwork && (
        <Link
          href={`/artwork/${stats.featuredArtwork.id}`}
          className="group grid overflow-hidden border hairline bg-ink text-paper sm:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]"
        >
          <div className="relative min-h-[240px] overflow-hidden bg-ink/20 sm:min-h-[300px]">
            <img
              src={stats.featuredArtwork.image}
              alt=""
              className="art-img absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <span className="absolute left-4 top-4 bg-paper/95 px-2.5 py-1 font-label text-[11px] uppercase tracking-wider text-ink">
              {db.categories.find((item) => item.id === stats.featuredArtwork.categoryId)?.name ?? "Karya"}
            </span>
          </div>
          <div className="flex flex-col justify-between p-6 lg:p-7">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="label text-paper/70">Sorotan portofolio</span>
                <span className="label text-pink">{artCode(stats.featuredArtwork)}</span>
              </div>
              <h2 className="font-display mt-4 break-words text-3xl leading-[1.05] transition-colors group-hover:text-pink">
                {stats.featuredArtwork.title}
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-label text-[13px] text-paper/70">
                <span>
                  <i className="fa-solid fa-heart mr-1.5 text-pink" />
                  {stats.featuredArtwork.likes ?? 0} suka
                </span>
                <span>{stats.featuredArtwork.createdAt.slice(0, 10)}</span>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-paper/15 pt-4 font-label text-[12px] uppercase tracking-wider">
              <span>Karya paling diapresiasi</span>
              <span className="flex items-center gap-2">
                Buka karya <i className="fa-solid fa-arrow-right" />
              </span>
            </div>
          </div>
        </Link>
      )}

      <section className={`grid grid-cols-2 gap-4 ${user.role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {cards.map((item) => (
          <div key={item.label} className="card p-5">
            <div className="font-display text-[34px] leading-none">{item.value}</div>
            <div className="label mt-3 text-wine">{item.label}</div>
            <p className="mt-1 text-[13px] text-ink/55">{item.note}</p>
          </div>
        ))}
      </section>

      {user.role === "admin" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border hairline bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label text-ink/60">Antrean verifikasi</p>
                <h2 className="font-display mt-2 text-2xl leading-none">Kurator pending</h2>
              </div>
              <Link href="/dashboard/curators" className="label text-wine hover:text-ink">
                Semua <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {stats.pendingCuratorsList.length === 0 ? (
                <p className="border-t hairline pt-4 text-[14px] text-ink/55">
                  Tidak ada kurator menunggu verifikasi.
                </p>
              ) : (
                stats.pendingCuratorsList.map((curator) => (
                  <div key={curator.id} className="flex items-center justify-between gap-3 border hairline p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={curator.avatar || "/desrefuses-mark.png"} alt="" className="avatar h-9 w-9 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{curator.name}</p>
                        <p className="truncate text-[12px] text-ink/55">@{curator.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => quickApproveCurator(curator.id)}
                      className="btn btn-ink btn-sm shrink-0"
                    >
                      Approve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border hairline bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label text-ink/60">Antrean moderasi</p>
                <h2 className="font-display mt-2 text-2xl leading-none">Laporan terbuka</h2>
              </div>
              <Link href="/dashboard/moderation" className="label text-wine hover:text-ink">
                Semua <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {stats.openReportsList.length === 0 ? (
                <p className="border-t hairline pt-4 text-[14px] text-ink/55">
                  Tidak ada laporan terbuka saat ini.
                </p>
              ) : (
                stats.openReportsList.map((report) => {
                  const reporter = db.users.find((u) => u.id === report.reporterId);
                  return (
                    <div key={report.id} className="flex items-center justify-between gap-3 border hairline p-3.5">
                      <div className="min-w-0">
                        <p className="font-label text-[11px] uppercase tracking-wider text-wine">
                          {report.reason}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-ink/75">
                          {report.type === "artwork" ? "Karya" : "Komentar"} · Pelapor: {reporter?.name ?? "Member"}
                        </p>
                      </div>
                      <span className="status status-pending shrink-0">Open</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {user.role === "member" && (
        <section className="border hairline bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label text-ink/60">Portofolio</p>
              <h2 className="font-display mt-2 text-2xl leading-none">Karya terbaru</h2>
            </div>
            <Link href="/dashboard/artworks" className="label text-wine hover:text-ink">
              Kelola karya <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stats.recentArtworks.length ? (
              stats.recentArtworks.map((item) => (
                <Link
                  key={item.id}
                  href={`/artwork/${item.id}`}
                  className="group flex items-center gap-4 border hairline p-3.5 transition-colors hover:border-ink"
                >
                  <img src={item.image} alt="" className="h-14 w-14 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold group-hover:text-wine">{item.title}</p>
                    <p className="mt-1 text-[12px] text-ink/55">
                      <i className="fa-solid fa-heart mr-1 text-wine/70" />
                      {item.likes ?? 0} suka · {item.createdAt.slice(0, 10)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-2 border-t hairline pt-4 text-[14px] text-ink/55">
                Belum ada karya. Unggah karya pertama Anda dari menu Karya saya.
              </p>
            )}
          </div>
        </section>
      )}

      {user.role === "curator" && (
        <section className="border hairline bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label text-ink/60">Event Anda</p>
              <h2 className="font-display mt-2 text-2xl leading-none">Challenge terbaru</h2>
            </div>
            <Link href="/dashboard/challenges" className="label text-wine hover:text-ink">
              Semua <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {stats.recentChallenges.length ? (
              stats.recentChallenges.map((item) => {
                const today = todayStr();
                const statusClass =
                  item.startDate <= today && item.endDate >= today
                    ? "status-live"
                    : item.startDate > today
                      ? "status-upcoming"
                      : "status-ended";
                const statusText =
                  statusClass === "status-live"
                    ? "Berlangsung"
                    : statusClass === "status-upcoming"
                      ? "Akan datang"
                      : "Selesai";
                const submissionCount = db.submissions.filter(
                  (entry) => entry.challengeId === item.id,
                ).length;

                return (
                  <div key={item.id} className="flex items-center gap-4 border hairline p-4">
                    <img src={item.banner} alt="" className="h-12 w-16 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{item.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`status ${statusClass}`}>{statusText}</span>
                        <span className="label text-ink/55">{submissionCount} submisi</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/challenges?challenge=${item.id}`}
                      className="btn btn-outline btn-sm shrink-0"
                    >
                      Kelola
                    </Link>
                  </div>
                );
              })
            ) : (
              <p className="border-t hairline pt-4 text-[14px] text-ink/55">
                Belum ada challenge. Buat challenge baru di menu Tantangan saya.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
