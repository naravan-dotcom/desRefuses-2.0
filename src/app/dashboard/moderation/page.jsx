"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const FILTERS = ["Semua", "Karya", "Komentar"];
const TYPE_BY_FILTER = { Karya: "artwork", Komentar: "comment" };

export default function DashboardModerationPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const groups = useMemo(() => {
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

    return Array.from(map.values())
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
        const reasonCounts = group.reports.reduce((acc, item) => {
          acc[item.reason] = (acc[item.reason] ?? 0) + 1;
          return acc;
        }, {});

        return {
          ...group,
          artwork,
          comment,
          author,
          reasonCounts,
          href: artwork ? `/artwork/${artwork.id}` : parentArtwork ? `/artwork/${parentArtwork.id}` : null,
        };
      });
  }, [db, activeFilter]);

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
    setNotice("Laporan diabaikan. Member dapat melapor ulang jika perlu.");
  }

  function takeDown(group) {
    const label = group.artwork?.title ?? "komentar ini";
    if (!window.confirm(`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;

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
    setNotice("Konten dihapus dan laporan ditandai selesai.");
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Moderasi</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Tinjau laporan karya dan komentar dari komunitas.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => {
              setActiveFilter(item);
              setNotice("");
            }}
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

      {notice && (
        <p className="border-l-2 border-ink bg-paper px-3 py-2 text-xs text-ink/70">
          {notice}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
          Antrean moderasi kosong.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.key}
              className="border border-ink/15 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-ink/45">
                    {group.type === "artwork" ? "Karya" : "Komentar"} · {group.count} laporan
                  </p>
                  <p className="text-sm font-medium">
                    {group.artwork?.title ??
                      (group.comment
                        ? `"${group.comment.text}"`
                        : "Konten tidak ditemukan")}
                  </p>
                  {group.author && (
                    <p className="text-xs text-ink/45">
                      Oleh {group.author.name}
                    </p>
                  )}
                </div>
                {group.href && (
                  <Link
                    href={group.href}
                    className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    Lihat konten
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(group.reasonCounts).map(([reason, count]) => (
                  <span
                    key={reason}
                    className="border border-red-600/30 bg-red-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-red-700"
                  >
                    {reason} · {count}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink/50">
                {group.reports
                  .map((item) => item.detail.trim())
                  .filter(Boolean)
                  .join(" · ") || "Tidak ada keterangan tambahan."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => dismiss(group)}
                  className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 transition-colors hover:border-ink hover:text-ink"
                >
                  Abaikan laporan
                </button>
                <button
                  type="button"
                  onClick={() => takeDown(group)}
                  className="bg-red-700 px-3 py-1.5 text-xs text-white transition-colors hover:bg-red-800"
                >
                  Take down
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
