"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

const winnerRanks = [
  ["first", "Juara 1"],
  ["second", "Juara 2"],
  ["third", "Juara 3"],
];

function getStatus(challenge) {
  const now = new Date();
  const start = new Date(`${challenge.startDate}T00:00:00`);
  const end = new Date(`${challenge.endDate}T23:59:59`);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

export default function DashboardSubmissionsPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
      setSessionIdState(getSessionId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const user = useMemo(
    () => (sessionId ? db.users.find((item) => item.id === sessionId) ?? null : null),
    [db, sessionId],
  );

  const submissions = useMemo(() => {
    if (!user) return [];
    return db.submissions
      .filter((submission) => submission.userId === user.id)
      .map((submission) => {
        const challenge = db.challenges.find(
          (item) => item.id === submission.challengeId,
        );
        const artwork = db.artworks.find((item) => item.id === submission.artworkId);
        const winnerLabel = challenge
          ? winnerRanks.find(([key]) => challenge.winners?.[key] === submission.artworkId)?.[1] ?? null
          : null;

        return {
          submission,
          challenge,
          artwork,
          status: challenge ? getStatus(challenge) : null,
          winnerLabel,
        };
      })
      .sort((a, b) => String(b.submission.createdAt).localeCompare(String(a.submission.createdAt)));
  }, [db, user]);

  const confirming = submissions.find(
    (item) => item.submission.id === confirmingId,
  );

  function withdraw(id) {
    const fresh = loadDb();
    const target = fresh.submissions.find(
      (item) => item.id === id && item.userId === user?.id,
    );
    if (!target) {
      setNotice("Submisi tidak ditemukan.");
      setConfirmingId(null);
      return;
    }

    const challenge = fresh.challenges.find(
      (item) => item.id === target.challengeId,
    );
    if (challenge && getStatus(challenge) === "ended") {
      setNotice("Submisi tidak dapat ditarik setelah challenge berakhir.");
      setConfirmingId(null);
      return;
    }

    fresh.submissions = fresh.submissions.filter((item) => item.id !== id);
    saveDb(fresh);
    setDb(fresh);
    setConfirmingId(null);
    setNotice("Submisi berhasil ditarik.");
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Submisi</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Riwayat partisipasi Anda dalam tantangan.
        </p>
      </header>

      {notice && (
        <div className="flex items-start justify-between gap-4 border border-ink/20 bg-paper px-4 py-3 text-sm text-ink/70">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-[10px] uppercase tracking-[0.12em] text-ink/45 hover:text-ink"
          >
            Tutup
          </button>
        </div>
      )}

      {confirming && (
        <div className="flex flex-col gap-3 border border-ink/20 bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/70">
            Tarik submisi <span className="font-medium">{confirming.challenge?.title ?? "ini"}</span>?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingId(null)}
              className="border border-ink/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink/60 hover:border-ink"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => withdraw(confirming.submission.id)}
              className="bg-ink px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-paper hover:bg-ink/85"
            >
              Ya, tarik
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/55">
          Masuk untuk melihat submisi Anda.{" "}
          <Link href="/login" className="underline">
            Masuk
          </Link>
        </div>
      ) : submissions.length === 0 ? (
        <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
          Belum ada submisi tantangan.
        </div>
      ) : (
        <div className="border border-ink/15 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Tantangan</th>
                  <th className="px-4 py-3 font-medium">Karya</th>
                  <th className="px-4 py-3 font-medium">Status challenge</th>
                  <th className="px-4 py-3 font-medium">Status menang</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => {
                  const canWithdraw = !item.challenge || item.status !== "ended";

                  return (
                    <tr
                      key={item.submission.id}
                      className="border-b border-ink/10 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {item.challenge ? (
                          <Link
                            href={`/challenges/${item.challenge.id}`}
                            className="font-medium hover:underline"
                          >
                            {item.challenge.title}
                          </Link>
                        ) : (
                          <span className="text-ink/45">Challenge dihapus</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.artwork ? (
                          <Link
                            href={`/artwork/${item.artwork.id}`}
                            className="hover:underline"
                          >
                            {item.artwork.title}
                          </Link>
                        ) : (
                          <span className="text-ink/45">Karya dihapus</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.status ? (
                          <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
                            {statusLabels[item.status]}
                          </span>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.winnerLabel ? (
                          <span className="border border-ink px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                            {item.winnerLabel}
                          </span>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink/50">
                        {String(item.submission.createdAt ?? "").slice(0, 10) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {canWithdraw ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(item.submission.id)}
                            className="text-[10px] uppercase tracking-[0.12em] text-ink/55 hover:text-ink hover:underline"
                          >
                            Withdraw
                          </button>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
