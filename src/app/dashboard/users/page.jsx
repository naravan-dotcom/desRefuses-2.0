"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { notify } from "@/components/toast";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";
import { useSession } from "@/lib/use-session";

const filters = ["Semua", "Admin", "Member", "Curator"];
const filterRoles = { Admin: "admin", Member: "member", Curator: "curator" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

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
    const list = role ? db.users.filter((item) => item.role === role) : db.users;
    return [...list].sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
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
    notify("Akun pengguna berhasil dihapus.", "success");
  }

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel admin</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Pengguna</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Lihat dan kelola akun pengguna platform. Akun Admin tidak dapat dihapus.
        </p>
      </header>

      <div className="border hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline px-5 py-4">
          <div>
            <p className="label text-ink/65">Manajemen pengguna</p>
            <p className="mt-1 text-[13px] text-ink/65">{users.length} pengguna</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setActiveFilter(item)}
                className={`chip ${item === activeFilter ? "active" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Email</th>
                <th>Bergabung</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Tidak ada pengguna pada filter ini.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img src={item.avatar} alt="" className="avatar h-8 w-8 shrink-0" />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 font-display text-xs">
                            {(item.name ?? "U").charAt(0)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">
                            {item.name}
                            {item.id === user?.id && (
                              <span className="ml-1.5 text-[11px] font-label text-wine">(Anda)</span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[12px] text-ink/55">@{item.username}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag">
                        {item.role === "admin"
                          ? "Admin"
                          : item.role === "curator"
                            ? "Curator"
                            : "Member"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status ${
                          item.status === "rejected"
                            ? "status-rejected"
                            : item.status === "pending"
                              ? "status-pending"
                              : "status-approved"
                        }`}
                      >
                        {item.status === "approved" ? "Aktif" : item.status}
                      </span>
                    </td>
                    <td className="text-ink/70">{item.email}</td>
                    <td className="text-ink/65">{formatDate(item.joinedAt)}</td>
                    <td className="text-right">
                      {item.role === "admin" || item.id === user?.id ? (
                        <span className="label text-ink/40">Dilindungi</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(item.id)}
                          aria-label={`Hapus ${item.name}`}
                          className="btn btn-outline btn-sm text-wine hover:border-wine"
                        >
                          <i className="fa-solid fa-trash text-[11px]" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t hairline px-5 py-3 text-[12px] text-ink/55">
          Menghapus pengguna akan membersihkan karya, komentar, laporan, dan submisi terkait secara otomatis.
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={() => deleteUser(confirmingId)}
        title="Hapus pengguna"
        subtitle="Panel admin"
        message={
          <>
            Hapus akun <span className="font-semibold">{confirming?.name}</span>? Karya, komentar, laporan, dan submisi terkait ikut dihapus.
          </>
        }
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
