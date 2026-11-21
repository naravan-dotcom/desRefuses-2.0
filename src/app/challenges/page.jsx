"use client";

import { useMemo, useState } from "react";
import { createSeedDb } from "@/lib/seed";

const seed = createSeedDb();
const filters = ["Semua", "Aktif", "Mendatang", "Selesai"];

const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

const curators = Object.fromEntries(
  seed.users.map((user) => [user.id, user.name]),
);
const submissionCounts = seed.submissions.reduce((counts, submission) => {
  counts[submission.challengeId] = (counts[submission.challengeId] ?? 0) + 1;
  return counts;
}, {});

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
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function winnerTitle(id) {
  if (!id) return null;
  return seed.artworks.find((artwork) => artwork.id === id)?.title ?? null;
}

export default function ChallengesPage() {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const challenges = useMemo(() => {
    return seed.challenges.filter((challenge) => {
      if (activeFilter === "Semua") return true;
      return statusLabels[getStatus(challenge)] === activeFilter;
    });
  }, [activeFilter]);

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Tantangan kuratorial
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ruang pameran tandingan.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Tantangan dikelola oleh kurator terverifikasi. Partisipasi bersifat
            sukarela — galeri utama tetap terbuka tanpa seleksi.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  filter === activeFilter
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-ink/60 hover:border-ink hover:text-ink"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((challenge) => {
              const status = getStatus(challenge);
              const winner = winnerTitle(challenge.winners?.first);

              return (
                <article
                  key={challenge.id}
                  className="border border-ink/15 bg-white"
                >
                  <div className="aspect-[16/7] overflow-hidden bg-ink/5">
                    <img
                      src={challenge.banner}
                      alt={challenge.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                        {curators[challenge.curatorId] ?? "Kurator"}
                      </p>
                      <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
                        {statusLabels[status]}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-medium">{challenge.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">
                      {challenge.description}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3 text-[10px] uppercase tracking-[0.12em] text-ink/45">
                      <span>{submissionCounts[challenge.id] ?? 0} submisi</span>
                      <span>
                        {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
                      </span>
                    </div>
                    {winner && (
                      <p className="mt-2 text-[11px] text-ink/55">
                        Pemenang: {winner}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
            {challenges.length === 0 && (
              <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Tidak ada tantangan pada kategori ini.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
