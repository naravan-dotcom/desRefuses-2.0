"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSessionId, loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const ROLE_LABEL = { admin: "Admin", member: "Member", curator: "Kurator" };

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayStr() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
    const isActive = (challenge) =>
      challenge.startDate <= today && challenge.endDate >= today;
    const roleCounts = db.users.reduce(
      (acc, item) => {
        acc[item.role] = (acc[item.role] ?? 0) + 1;
        return acc;
      },
      { admin: 0, member: 0, curator: 0 },
    );
    const ownArtworks = db.artworks.filter((item) => item.userId === user.id);
    const ownChallenges = db.challenges.filter(
      (item) => item.curatorId === user.id,
    );
    const ownChallengeIds = ownChallenges.map((item) => item.id);
    const recentSource =
      user.role === "member" ? ownArtworks : db.artworks;

    return {
      roleCounts,
      openReports: db.reports.filter((item) => item.status === "open").length,
      pendingCurators: db.users.filter(
        (item) => item.role === "curator" && item.status === "pending",
      ).length,
      activeChallenges: db.challenges.filter(isActive).length,
      ownArtworksCount: ownArtworks.length,
      totalLikes: ownArtworks.reduce((sum, item) => sum + (item.likes ?? 0), 0),
      favorites: (user.favorites ?? []).length,
      ownSubmissions: db.submissions.filter(
        (item) => item.userId === user.id,
      ).length,
      incomingSubmissions: db.submissions.filter((item) =>
        ownChallengeIds.includes(item.challengeId),
      ).length,
      ownActiveChallenges: ownChallenges.filter(isActive).length,
      winners: ownChallenges.reduce(
        (sum, challenge) =>
          sum +
          ["first", "second", "third"].filter(
            (rank) => challenge.winners?.[rank],
          ).length,
        0,
      ),
      recentArtworks: [...recentSource]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((item) => ({
          ...item,
          creator:
            db.users.find((entry) => entry.id === item.userId)?.name ??
            "Kreator tidak diketahui",
        })),
      recentChallenges: [...ownChallenges]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3),
    };
  }, [db, user]);

  if (!loaded || !user || !stats) {
    return (
      <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
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
            {
              label: "Karya saya",
              value: stats.ownArtworksCount,
              note: "Portofolio publik",
            },
            { label: "Apresiasi", value: stats.totalLikes, note: "Total suka diterima" },
            { label: "Favorit", value: stats.favorites, note: "Karya tersimpan" },
            { label: "Submisi", value: stats.ownSubmissions, note: "Challenge diikuti" },
          ]
        : [
            {
              label: "Challenge",
              value: db.challenges.filter((item) => item.curatorId === user.id).length,
              note: "Dibuat oleh Anda",
            },
            {
              label: "Submisi masuk",
              value: stats.incomingSubmissions,
              note: "Karya partisipan",
            },
            {
              label: "Challenge aktif",
              value: stats.ownActiveChallenges,
              note: "Periode berjalan",
            },
            { label: "Pemenang", value: stats.winners, note: "Juara 1–3 ditandai" },
          ];

  const links =
    user.role === "admin"
      ? [
          { label: "Verifikasi kurator", href: "/dashboard/curators", note: `${stats.pendingCurators} menunggu tinjauan` },
          { label: "Moderasi konten", href: "/dashboard/moderation", note: `${stats.openReports} laporan open` },
          { label: "Kelola pengguna", href: "/dashboard/users", note: "Lihat dan hapus akun" },
        ]
      : user.role === "member"
        ? [
            { label: "Karya saya", href: "/dashboard/artworks", note: "Unggah dan kelola karya" },
            { label: "Jelajahi challenge", href: "/challenges", note: "Cari challenge aktif" },
            { label: "Submisi saya", href: "/dashboard/submissions", note: "Lihat riwayat kiriman" },
          ]
        : [
            { label: "Challenge saya", href: "/dashboard/challenges", note: "Buat dan kelola event" },
            { label: "Jelajahi challenge", href: "/challenges", note: "Lihat halaman publik" },
          ];

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Dashboard · {ROLE_LABEL[user.role] ?? user.role}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Halo, {user.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
          Ringkasan aktivitas Anda dihitung langsung dari data platform.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <div key={item.label} className="border border-ink/15 bg-white p-4">
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {item.label}
            </p>
            <p className="mt-1 text-xs text-ink/45">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            {user.role === "curator" ? "Challenge terbaru" : "Karya terbaru"}
          </p>
          <h2 className="mt-1 text-lg font-medium">
            {user.role === "curator" ? "Event Anda" : "Portofolio"}
          </h2>
          <div className="mt-4 space-y-3">
            {user.role === "curator" ? (
              stats.recentChallenges.length === 0 ? (
                <div className="border border-dashed border-ink/20 p-6 text-center text-sm text-ink/45">
                  Belum ada challenge.
                </div>
              ) : (
                stats.recentChallenges.map((item) => (
                  <div key={item.id} className="border border-ink/15 p-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {item.startDate} — {item.endDate}
                    </p>
                  </div>
                ))
              )
            ) : stats.recentArtworks.length === 0 ? (
              <div className="border border-dashed border-ink/20 p-6 text-center text-sm text-ink/45">
                Belum ada karya untuk ditampilkan.
              </div>
            ) : (
              stats.recentArtworks.map((item) => (
                <div key={item.id} className="border border-ink/15 p-4">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/45">Oleh {item.creator}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Langkah berikutnya
          </p>
          <h2 className="mt-1 text-lg font-medium">Tetap bergerak</h2>
          <div className="mt-4 space-y-3">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border border-ink/15 p-4 transition-colors hover:border-ink"
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/55">
                  {item.note}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Status akun
          </p>
          <p className="mt-2 text-sm font-medium">{user.name}</p>
          <p className="mt-1 text-xs text-ink/55">{user.email}</p>
          <p className="mt-1 text-xs text-ink/45">
            {ROLE_LABEL[user.role] ?? user.role} · {user.status}
          </p>
        </div>
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Antrean
          </p>
          <p className="mt-2 text-sm font-medium">
            {user.role === "admin"
              ? `${stats.pendingCurators} verifikasi kurator`
              : user.role === "member"
                ? `${stats.ownSubmissions} submisi aktif`
                : `${stats.incomingSubmissions} submisi masuk`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            {user.role === "admin"
              ? `${stats.openReports} laporan menunggu keputusan.`
              : user.role === "member"
                ? `${stats.favorites} karya disimpan di favorit.`
                : `${stats.winners} karya sudah ditandai sebagai pemenang.`}
          </p>
        </div>
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Data platform
          </p>
          <p className="mt-2 text-sm font-medium">
            {db.categories.length} kategori · {db.comments.length} komentar
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            {db.submissions.length} submisi dari {db.users.length} akun terdaftar.
          </p>
        </div>
      </section>
    </>
  );
}
