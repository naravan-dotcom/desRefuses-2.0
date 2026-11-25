"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const filters = ["all", "active", "upcoming", "ended"];

const statusLabels = {
  active: "Berlangsung",
  upcoming: "Akan datang",
  ended: "Selesai",
};

const statusOrder = {
  active: 0,
  upcoming: 1,
  ended: 2,
};

function getStatus(challenge) {
  const now = new Date();
  const start = new Date(`${challenge.startDate}T00:00:00`);
  const end = new Date(`${challenge.endDate}T23:59:59`);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function timeLeft(challenge) {
  const end = new Date(`${challenge.endDate}T23:59:59`);
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return "Ditutup";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}h ${hours}j lagi`;
  return `${hours} jam lagi`;
}

export default function ChallengesPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const curators = useMemo(
    () => Object.fromEntries((db.users ?? []).map((user) => [user.id, user.name])),
    [db],
  );
  const submissionCounts = useMemo(
    () =>
      (db.submissions ?? []).reduce((counts, submission) => {
        counts[submission.challengeId] = (counts[submission.challengeId] ?? 0) + 1;
        return counts;
      }, {}),
    [db],
  );

  const challenges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (db.challenges ?? [])
      .filter((challenge) => {
        if (activeFilter !== "all" && getStatus(challenge) !== activeFilter) return false;
        if (!needle) return true;
        return [challenge.title, challenge.description, curators[challenge.curatorId] ?? ""]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const byStatus = statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
        return byStatus || new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [db, activeFilter, query, curators]);

  return (
    <main className="page-enter mx-auto max-w-[1240px] px-5 pb-16 pt-16 lg:px-10 lg:pt-24">
      <div className="grid items-end gap-8 border-b hairline pb-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="label flex items-center gap-4 text-ink/65"><span>Ruang kurator</span></div>
          <h1 className="font-display mt-6 text-[44px] leading-[1.12] tracking-[-0.01em] sm:text-[59px] lg:text-[67px]">
            Pameran<br />tandingan.
          </h1>
        </div>
        <div className="lg:col-span-4">
          <p className="max-w-sm text-[15px] leading-[1.7] text-ink/65">
            Tantangan dikelola mandiri oleh curator terverifikasi. Galeri utama tetap terbuka untuk semua karya, tanpa pengaruh hasil tantangan.
          </p>
          <div className="relative mt-6">
            <i className="fa-solid fa-magnifying-glass absolute left-0 top-1/2 -translate-y-1/2 text-xs text-ink/65" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tantangan..."
              className="field pl-6 text-[15px]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7 overflow-x-auto py-7">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`chip ${filter === activeFilter ? "active" : ""}`}
          >
            {filter === "all" ? "Semua" : statusLabels[filter]}
          </button>
        ))}
      </div>

      <div className="border-t hairline">
        {challenges.length ? (
          challenges.map((challenge, index) => {
            const status = getStatus(challenge);
            const num = String(index + 1).padStart(2, "0");
            const deadline =
              status === "active"
                ? timeLeft(challenge)
                : status === "upcoming"
                  ? `Dibuka ${formatDate(challenge.startDate)}`
                  : "Berakhir";

            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="row-link isolate group block cursor-pointer"
              >
                <div className="relative z-10 grid items-center gap-5 border-b hairline px-2 py-7 md:grid-cols-12 md:py-8 lg:gap-8 lg:px-5">
                  <div className="label text-ink/65 transition-colors group-hover:text-white/40 md:col-span-1">
                    {num}
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-24 w-24 overflow-hidden rounded-t-full bg-ink/5 sm:h-28 sm:w-28">
                      <img
                        src={challenge.banner}
                        alt={challenge.title}
                        loading="lazy"
                        className="art-img h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-5">
                    <div className="label flex items-center gap-3 text-ink/65 transition-colors group-hover:text-white/40">
                      <span>{curators[challenge.curatorId] ?? "Kurator"}</span>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span>{statusLabels[status]}</span>
                    </div>
                    <h3 className="font-display mt-3 text-[29px] leading-[1.12] tracking-[-0.01em] sm:text-[32px]">
                      {challenge.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 max-w-xl text-[14px] leading-relaxed text-ink/65 transition-colors group-hover:text-white/55">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="font-label text-[12px] uppercase tracking-normal text-ink/65 transition-colors group-hover:text-white/50 md:col-span-2">
                    <div>Tenggat</div>
                    <div className="mt-1.5 text-[13px] text-ink transition-colors group-hover:text-white">
                      {formatDate(challenge.endDate)}
                    </div>
                    <div className="mt-4">Submisi</div>
                    <div className="mt-1.5 text-[13px] text-ink transition-colors group-hover:text-white">
                      {submissionCounts[challenge.id] ?? 0} karya
                    </div>
                  </div>
                  <div className="flex items-center gap-5 md:col-span-2 md:justify-end">
                    <span className="font-label text-[12px] uppercase tracking-normal text-ink/65 transition-colors group-hover:text-white/50">
                      {deadline}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border hairline transition-colors group-hover:border-white/40 group-hover:text-white">
                      <i className="fa-solid fa-arrow-right text-[12px]" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="border-b hairline px-6 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center text-ink/65">
              <i className="fa-solid fa-flag" />
            </div>
            <h2 className="font-display mt-4 text-xl font-bold">Tidak ada tantangan</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink/65">
              Belum ada tantangan yang sesuai dengan filter atau pencarian Anda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
