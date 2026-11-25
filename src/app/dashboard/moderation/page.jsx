"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/confirm-dialog";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const FILTERS = ["Semua", "Karya", "Komentar"];
const TYPE_BY_FILTER = { Karya: "artwork", Komentar: "comment" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardModerationPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [notice, setNotice] = useState("");
  const [confirmGroup, setConfirmGroup] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const allOpenGroups = useMemo(() => {
    const map = new Map();
    db.reports
      .filter((item) => item.status === "open")
      .forEach((item) => {
        const key = `${item.type}:${item.targetId}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            type: item.type,
            targetId: item.targetId,
            reports: [],
          });
        }
        map.get(key).reports.push(item);
      });
    return Array.from(map.values());
  }, [db]);

  const artworkReportCount = allOpenGroups.filter((g) => g.type === "artwork").length;
  const commentReportCount = allOpenGroups.filter((g) => g.type === "comment").length;

  const groups = useMemo(() => {
    return allOpenGroups
      .filter((group) => {
        const type = TYPE_BY_FILTER[activeFilter];
        return !type || group.type === type;
      })
      .map((group) => {
        const artwork =
          group.type === "artwork"
            ? db.artworks.find((item) => item.id === group.targetId) ?? null
            : null;
        const comment =
          group.type === "comment"
            ? db.comments.find((item) => item.id === group.targetId) ?? null
            : null;
        const parentArtwork = comment
          ? db.artworks.find((item) => item.id === comment.artworkId) ?? null
          : null;
        const authorId = artwork?.userId ?? comment?.userId;
        const author = db.users.find((item) => item.id === authorId);
        const category = artwork
          ? db.categories.find((c) => c.id === artwork.categoryId)
          : null;

        return {
          ...group,
          artwork,
          comment,
          parentArtwork,
          author,
          category,
          href: artwork ? `/artwork/${artwork.id}` : parentArtwork ? `/artwork/${parentArtwork.id}` : null,
        };
      });
  }, [allOpenGroups, db, activeFilter]);

  function dismiss(group) {
    const next = loadDb();
    next.reports.forEach((item) => {
      if (
        item.type === group.type &&
        item.targetId === group.targetId &&
        item.status === "open"
      ) {
        item.status = "dismissed";
      }
    });
    saveDb(next);
    setDb(next);
    setConfirmGroup(null);
    setNotice("Laporan diabaikan. Member dapat melapor ulang jika perlu.");
  }

  function takeDown(group) {
    const next = loadDb();
    const matching = (item) =>
      item.type === group.type && item.targetId === group.targetId;

    if (group.type === "artwork") {
      const removedComments = next.comments
        .filter((item) => item.artworkId === group.targetId)
        .map((item) => item.id);

      next.comments = next.comments.filter(
        (item) => item.artworkId !== group.targetId,
      );
      next.artworks = next.artworks.filter(
        (item) => item.id !== group.targetId,
      );
      next.submissions = next.submissions.filter(
        (item) => item.artworkId !== group.targetId,
      );
      next.challenges.forEach((challenge) => {
        ["first", "second", "third"].forEach((rank) => {
          if (challenge.winners?.[rank] === group.targetId) {
            challenge.winners[rank] = null;
          }
        });
      });
      next.users.forEach((item) => {
        item.favorites = (item.favorites ?? []).filter(
          (id) => id !== group.targetId,
        );
      });
      next.reports.forEach((item) => {
        if (
          matching(item) ||
          (item.type === "comment" && removedComments.includes(item.targetId))
        ) {
          item.status = "resolved";
        }
      });
    } else {
      next.comments = next.comments.filter(
        (item) => item.id !== group.targetId,
      );
      next.reports.forEach((item) => {
        if (matching(item)) item.status = "resolved";
      });
    }

    saveDb(next);
    setDb(next);
    setConfirmGroup(null);
    setNotice("Konten dihapus dan laporan ditandai selesai.");
  }

  function countLabel(filter) {
    if (filter === "Karya") return `Laporan karya (${artworkReportCount})`;
    if (filter === "Komentar") return `Laporan komentar (${commentReportCount})`;
    return `Semua (${allOpenGroups.length})`;
  }

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel admin</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Moderasi</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Tinjau laporan karya dan komentar dari komunitas.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-6 border-b hairline">
        {FILTERS.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => {
              setActiveFilter(item);
              setNotice("");
            }}
            className={`chip ${item === activeFilter ? "active" : ""}`}
          >
            {countLabel(item)}
          </button>
        ))}
      </div>

      {notice && (
        <p className="border-l-2 border-ink bg-white px-4 py-3 text-[13px] text-ink/75">
          {notice}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="border-t border-b hairline px-6 py-12 text-center">
          <i className="fa-solid fa-shield-halved text-2xl text-ink/35" />
          <h3 className="font-display mt-3 text-xl font-bold">Antrean moderasi kosong</h3>
          <p className="mt-1 text-[14px] text-ink/60">Tidak ada laporan terbuka pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="border hairline bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="status status-pending">
                    {group.reports.length} laporan terbuka
                  </span>
                  <span className="label text-ink/60">
                    {group.type === "artwork" ? "Karya" : "Komentar"}
                  </span>
                </div>
                {group.href && (
                  <Link href={group.href} className="btn btn-outline btn-sm">
                    Buka karya <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
                  </Link>
                )}
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-2">
                <div>
                  {group.type === "artwork" && group.artwork ? (
                    <div className="flex gap-4">
                      <img
                        src={group.artwork.image}
                        alt={group.artwork.title}
                        className="h-28 w-24 shrink-0 border hairline object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-tight">
                          {group.artwork.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-ink/60">
                          {group.author?.name ?? "Kreator"}
                          {group.category ? ` · ${group.category.name}` : ""}
                        </p>
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/70">
                          {group.artwork.description}
                        </p>
                        <p className="mt-2 text-[11px] font-label text-ink/50">
                          Diunggah {formatDate(group.artwork.createdAt)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border hairline bg-paper p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">
                          {group.author?.name ?? "Pengguna"}
                        </span>
                        <span className="text-[11px] font-label text-ink/50">
                          {formatDate(group.comment?.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink/80">
                        {group.comment ? `"${group.comment.text}"` : "Komentar tidak ditemukan"}
                      </p>
                      {group.parentArtwork && (
                        <p className="mt-2 text-[12px] text-ink/55">
                          Pada karya: {group.parentArtwork.title}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="label text-ink/60">Detail laporan</p>
                  <div className="mt-2.5 max-h-40 space-y-2 overflow-y-auto pr-1">
                    {group.reports.map((report) => {
                      const reporter = db.users.find((u) => u.id === report.reporterId);
                      return (
                        <div key={report.id} className="border hairline bg-canvas/50 p-3 text-[13px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-label text-[11px] uppercase tracking-wider text-wine">
                              {report.reason}
                            </span>
                            <span className="text-[11px] text-ink/50">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          {report.detail && (
                            <p className="mt-1 text-ink/75">{report.detail}</p>
                          )}
                          <p className="mt-1 text-[11px] text-ink/50">
                            Pelapor: {reporter?.name ?? "Member"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t hairline px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => dismiss(group)}
                  className="btn btn-outline btn-sm"
                >
                  Dismiss report
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmGroup(group)}
                  className="btn btn-pink btn-sm"
                >
                  Take down
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 border hairline bg-canvas/60 p-4 text-[13px] text-ink/70">
        <i className="fa-solid fa-scale-balanced mt-0.5 text-wine" />
        <p>
          Moderasi hanya menindak pelanggaran serius (SARA, plagiat, atau konten tidak pantas) — bukan penilaian estetika karya.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(confirmGroup)}
        onClose={() => setConfirmGroup(null)}
        onConfirm={() => takeDown(confirmGroup)}
        title="Hapus konten"
        subtitle="Moderasi"
        message={
          <>
            Take down{" "}
            <span className="font-semibold">
              {confirmGroup?.artwork?.title ?? "komentar ini"}
            </span>
            ? Konten akan dihapus permanen dan laporan ditandai selesai.
          </>
        }
        confirmLabel="Ya, take down"
        danger
      />
    </>
  );
}
