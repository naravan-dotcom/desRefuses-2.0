"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";
import { useSession } from "@/lib/use-session";

const filters = ["Semua", "Admin", "Member", "Kurator"];
const filterRoles = { Admin: "admin", Member: "member", Kurator: "curator" };

export default function DashboardUsersPage() {
  const { user } = useSession();
  const [db, setDb] = useState(() => createSeedDb());
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const users = useMemo(() => {
    const role = filterRoles[activeFilter];
    if (!role) return db.users;
    return db.users.filter((item) => item.role === role);
  }, [db, activeFilter]);

  const confirming = confirmingId
    ? db.users.find((item) => item.id === confirmingId) ?? null
    : null;

  function deleteUser(id) {
    const next = loadDb();
    const target = next.users.find((item) => item.id === id);
    if (!target || target.role === "admin" || target.id === user?.id) return;

    const removedArtworks = next.artworks
      .filter((item) => item.userId === id)
      .map((item) => item.id);
    const removedComments = next.comments
      .filter(
        (item) => item.userId === id || removedArtworks.includes(item.artworkId),
      )
      .map((item) => item.id);
    const removedChallenges = next.challenges
      .filter((item) => item.curatorId === id)
      .map((item) => item.id);

    next.challenges = next.challenges.filter(
      (item) => item.curatorId !== id,
    );
    next.challenges.forEach((challenge) => {
      ["first", "second", "third"].forEach((rank) => {
        if (removedArtworks.includes(challenge.winners?.[rank])) {
          challenge.winners[rank] = null;
        }
      });
    });

    next.artworks = next.artworks.filter((item) => item.userId !== id);
    next.artworks.forEach((artwork) => {
      if ((artwork.likedBy ?? []).includes(id)) {
        artwork.likedBy = artwork.likedBy.filter((item) => item !== id);
        artwork.likes = Math.max(0, (artwork.likes ?? 0) - 1);
      }
    });

    next.comments = next.comments.filter(
      (item) => !removedComments.includes(item.id),
    );
    next.reports = next.reports.filter(
      (item) =>
        item.reporterId !== id &&
        !(item.type === "artwork" && removedArtworks.includes(item.targetId)) &&
        !(item.type === "comment" && removedComments.includes(item.targetId)),
    );
    next.submissions = next.submissions.filter(
      (item) =>
        item.userId !== id &&
        !removedArtworks.includes(item.artworkId) &&
        !removedChallenges.includes(item.challengeId),
    );

    next.users = next.users.filter((item) => item.id !== id);
    next.users.forEach((item) => {
      item.favorites = (item.favorites ?? []).filter(
        (fav) => !removedArtworks.includes(fav),
      );
      item.following = (item.following ?? []).filter((fav) => fav !== id);
    });

    saveDb(next);
    setDb(next);
    setConfirmingId(null);
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Lihat dan kelola akun pengguna platform. Akun Admin tidak dapat
          dihapus.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
              item === activeFilter
                ? "border-ink bg-ink text-paper"
                : "border-ink/20 text-ink/60 hover:border-ink hover:text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {confirming && (
        <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <p>
            Hapus akun {confirming.name}? Karya, komentar, laporan, dan submisi
            terkait ikut dihapus.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => deleteUser(confirming.id)}
              className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800"
            >
              Ya, hapus
            </button>
            <button
              type="button"
              onClick={() => setConfirmingId(null)}
              className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/45">
                    Tidak ada pengguna pada filter ini.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-b border-ink/10 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-ink/50">@{item.username}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {item.role === "admin"
                        ? "Admin"
                        : item.role === "curator"
                          ? "Kurator"
                          : "Member"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                          item.status === "rejected"
                            ? "border-red-600/40 text-red-700"
                            : item.status === "pending"
                              ? "border-brand/50 text-ink/70"
                              : "border-ink/25 text-ink/70"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{item.email}</td>
                    <td className="px-4 py-3 text-right">
                      {item.role === "admin" ? (
                        <span className="text-xs text-ink/35">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(item.id)}
                          className="border border-red-600/50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
