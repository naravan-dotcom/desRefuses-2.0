"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { loadDb, saveDb } from "@/lib/local-data";
import { getSessionId } from "@/lib/auth-client";
import { createSeedDb } from "@/lib/seed";

const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

const statusClasses = {
  active: "status-live",
  upcoming: "status-upcoming",
  ended: "status-ended",
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
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Submisi.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Riwayat partisipasi Anda dalam tantangan.
        </p>
      </header>

      {notice && (
        <div className="flex items-start justify-between gap-4 border-l-2 border-wine bg-wine/5 px-4 py-3">
          <p className="text-[13px] text-wine">{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="btn btn-ghost btn-sm text-wine">
            Tutup
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={() => confirming && withdraw(confirming.submission.id)}
        title="Tarik submisi"
        subtitle="Member"
        message={confirming ? `Tarik submisi "${confirming.challenge?.title ?? "ini"}"? Submisi ini akan dihapus dari riwayat Anda.` : ""}
        danger
        confirmLabel="Ya, tarik"
      />

      {!user ? (
        <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
          Masuk untuk melihat submisi Anda.{" "}
          <Link href="/login" className="font-semibold text-wine underline">Masuk</Link>
        </div>
      ) : submissions.length === 0 ? (
        <div className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/55">
          Belum ada submisi tantangan.
        </div>
      ) : (
        <div className="border hairline bg-white">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Tantangan</th>
                  <th>Karya</th>
                  <th>Status challenge</th>
                  <th>Status menang</th>
                  <th>Tanggal</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => {
                  const canWithdraw = !item.challenge || item.status !== "ended";

                  return (
                    <tr key={item.submission.id}>
                      <td>
                        {item.challenge ? (
                          <Link href={`/challenges/${item.challenge.id}`} className="font-semibold hover:text-wine">
                            {item.challenge.title}
                          </Link>
                        ) : (
                          <span className="text-ink/55">Challenge dihapus</span>
                        )}
                      </td>
                      <td>
                        {item.artwork ? (
                          <Link href={`/artwork/${item.artwork.id}`} className="hover:text-wine">
                            {item.artwork.title}
                          </Link>
                        ) : (
                          <span className="text-ink/55">Karya dihapus</span>
                        )}
                      </td>
                      <td>
                        {item.status ? (
                          <span className={`status ${statusClasses[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                      <td>
                        {item.winnerLabel ? (
                          <span className="status status-approved">{item.winnerLabel}</span>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                      <td className="text-ink/60">
                        {String(item.submission.createdAt ?? "").slice(0, 10) || "—"}
                      </td>
                      <td className="text-right">
                        {canWithdraw ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(item.submission.id)}
                            className="btn btn-ghost btn-sm text-wine"
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
