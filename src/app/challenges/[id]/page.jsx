"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

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

const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

const winnerRanks = [
  { key: "first", label: "Juara 1" },
  { key: "second", label: "Juara 2" },
  { key: "third", label: "Juara 3" },
];

export default function ChallengeDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
      setSessionIdState(getSessionId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const challenge = useMemo(
    () => db.challenges.find((item) => item.id === id),
    [db, id],
  );

  const curator = useMemo(
    () => db.users.find((item) => item.id === challenge?.curatorId),
    [db, challenge],
  );

  const user = useMemo(
    () => db.users.find((item) => item.id === sessionId) ?? null,
    [db, sessionId],
  );

  const status = challenge ? getStatus(challenge) : null;
  const isActive = status === "active";

  const submissions = useMemo(
    () => db.submissions.filter((item) => item.challengeId === id),
    [db, id],
  );

  const entries = useMemo(
    () =>
      submissions
        .map((submission) => ({
          ...submission,
          artwork: db.artworks.find((item) => item.id === submission.artworkId),
          submitter: db.users.find((item) => item.id === submission.userId),
        }))
        .filter((entry) => entry.artwork),
    [submissions, db],
  );

  const mySubmission = useMemo(
    () => submissions.find((item) => item.userId === user?.id) ?? null,
    [submissions, user],
  );

  const myArtworks = useMemo(
    () => db.artworks.filter((item) => item.userId === user?.id),
    [db, user],
  );

  const winners = useMemo(
    () =>
      winnerRanks
        .map((rank) => {
          const artworkId = challenge?.winners?.[rank.key];
          const artwork = db.artworks.find((item) => item.id === artworkId);
          return artwork ? { ...rank, artwork } : null;
        })
        .filter(Boolean),
    [challenge, db],
  );

  function openSubmit() {
    setNotice("");
    setConfirmWithdraw(false);
    if (!user) {
      setNotice("Masuk sebagai Member untuk mensubmit karya.");
      return;
    }
    if (user.role !== "member") {
      setNotice("Hanya Member yang dapat mengikuti challenge.");
      return;
    }
    if (!isActive) {
      setNotice("Submit hanya tersedia saat challenge masih aktif.");
      return;
    }
    if (mySubmission) {
      setNotice("Anda sudah mensubmit karya ke challenge ini.");
      return;
    }
    if (myArtworks.length === 0) {
      setNotice("Unggah karya terlebih dahulu di dashboard Anda.");
      return;
    }
    setSelectedArtwork("");
    setSubmitOpen(true);
  }

  function submitWork(event) {
    event.preventDefault();
    setNotice("");

    const next = loadDb();
    const target = next.challenges.find((item) => item.id === id);
    if (!target || getStatus(target) !== "active") {
      setNotice("Challenge sudah tidak aktif. Submisi dibatalkan.");
      setSubmitOpen(false);
      return;
    }
    if (
      next.submissions.some(
        (item) => item.challengeId === id && item.userId === user?.id,
      )
    ) {
      setNotice("Anda sudah memiliki submisi di challenge ini.");
      setSubmitOpen(false);
      return;
    }
    if (
      !next.artworks.some(
        (item) => item.id === selectedArtwork && item.userId === user?.id,
      )
    ) {
      setNotice("Pilih salah satu karya milik Anda.");
      return;
    }

    next.submissions.push({
      id: uid("s"),
      challengeId: id,
      artworkId: selectedArtwork,
      userId: user.id,
      createdAt: isoNow(),
    });
    saveDb(next);
    setDb(next);
    setSubmitOpen(false);
    setNotice("Karya berhasil disubmit.");
  }

  function withdraw() {
    setNotice("");
    const next = loadDb();
    const target = next.challenges.find((item) => item.id === id);
    if (!target || getStatus(target) === "ended") {
      setNotice("Challenge sudah berakhir. Submisi tidak bisa ditarik.");
      setConfirmWithdraw(false);
      return;
    }
    next.submissions = next.submissions.filter(
      (item) => !(item.challengeId === id && item.userId === user?.id),
    );
    saveDb(next);
    setDb(next);
    setConfirmWithdraw(false);
    setNotice("Submisi ditarik.");
  }

  if (!challenge) {
    return (
      <main className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl border border-dashed border-ink/20 p-10 text-center">
          <p className="text-sm text-ink/55">Challenge tidak ditemukan.</p>
          <Link href="/challenges" className="mt-4 inline-block text-xs underline">
            Kembali ke daftar challenge
          </Link>
        </div>
      </main>
    );
  }

  let participation = null;
  if (!user) {
    participation = (
      <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
        Masuk sebagai Member untuk mengikuti challenge.{" "}
        <Link href="/login" className="text-ink underline">
          Masuk
        </Link>
      </div>
    );
  } else if (user.role !== "member") {
    participation = (
      <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
        {user.role === "admin" ? "Admin" : "Curator"} hanya dapat menjelajahi
        challenge. Partisipasi tersedia untuk Member.
      </div>
    );
  } else if (mySubmission) {
    participation = (
      <div className="space-y-3 border border-ink/15 bg-white p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Submisi Anda
        </p>
        <p className="text-sm font-medium">
          {db.artworks.find((item) => item.id === mySubmission.artworkId)?.title ??
            "Karya"}
        </p>
        {status !== "ended" ? (
          confirmWithdraw ? (
            <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
              <p>Tarik submisi ini dari challenge?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={withdraw}
                  className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800"
                >
                  Ya, tarik
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWithdraw(false)}
                  className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNotice("");
                setConfirmWithdraw(true);
              }}
              className="border border-ink/20 px-3 py-2 text-xs transition-colors hover:border-ink"
            >
              Withdraw
            </button>
          )
        ) : (
          <p className="text-xs text-ink/50">
            Challenge sudah berakhir; submisi tidak dapat ditarik.
          </p>
        )}
      </div>
    );
  } else if (isActive) {
    participation = (
      <button
        type="button"
        onClick={openSubmit}
        className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
      >
        Submit Your Work
      </button>
    );
  } else {
    participation = (
      <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
        {status === "upcoming"
          ? "Challenge belum dimulai. Submit dibuka setelah tanggal mulai."
          : "Challenge sudah berakhir. Submit tidak lagi tersedia."}
      </div>
    );
  }

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/challenges"
          className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
        >
          Kembali ke challenge
        </Link>

        <section className="border border-ink/15 bg-white">
          <div className="aspect-[16/6] overflow-hidden bg-ink/5">
            <img
              src={challenge.banner}
              alt={challenge.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  {curator?.name ?? "Kurator"}
                </p>
                <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
                  {statusLabels[status]}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {challenge.title}
              </h1>
              <p className="text-sm leading-relaxed text-ink/70">
                {challenge.description}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-ink/15 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    Aturan
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">
                    {challenge.rules}
                  </p>
                </div>
                <div className="border border-ink/15 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    Hadiah
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">
                    {challenge.prize}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-ink/10 pt-4 text-xs text-ink/60">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    Mulai
                  </p>
                  <p className="mt-1">{formatDate(challenge.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    Selesai
                  </p>
                  <p className="mt-1">{formatDate(challenge.endDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    Submisi
                  </p>
                  <p className="mt-1">{submissions.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Partisipasi
              </p>
              {participation}
              {notice && <p className="text-xs text-ink/55">{notice}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Galeri partisipan
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Karya yang disubmit
              </h2>
            </div>
            <p className="text-xs text-ink/50">{entries.length} submisi</p>
          </div>
          {entries.length === 0 ? (
            <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
              Belum ada karya yang disubmit.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/artwork/${entry.artwork.id}`}
                  className="group block border border-ink/15 bg-white transition-colors hover:border-ink/40"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-ink/5">
                    <img
                      src={entry.artwork.image}
                      alt={entry.artwork.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium leading-snug">
                      {entry.artwork.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink/55">
                      {entry.submitter?.name ?? "Kreator"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Pemenang
          </p>
          <h2 className="text-xl font-semibold">Hasil challenge</h2>
          {winners.length === 0 ? (
            <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
              Pemenang belum diumumkan.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {winners.map((winner) => (
                <article
                  key={winner.key}
                  className="border border-ink/15 bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                    <img
                      src={winner.artwork.image}
                      alt={winner.artwork.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                      {winner.label}
                    </p>
                    <h3 className="mt-1 text-sm font-medium">
                      {winner.artwork.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink/55">
                      {db.users.find((item) => item.id === winner.artwork.userId)
                        ?.name ?? "Kreator"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {submitOpen && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/60 p-5">
          <section className="w-full max-w-lg border border-ink/15 bg-paper p-6">
            <h2 className="text-xl font-semibold">Submit Your Work</h2>
            <form onSubmit={submitWork} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-ink/60">
                  Pilih satu karya
                </span>
                <select
                  value={selectedArtwork}
                  onChange={(event) => setSelectedArtwork(event.target.value)}
                  className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Pilih karya...</option>
                  {myArtworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}>
                      {artwork.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-[11px] leading-relaxed text-ink/45">
                Satu Member hanya dapat mensubmit satu karya per challenge.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitOpen(false)}
                  className="border border-ink/20 px-3 py-2 text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="bg-ink px-3 py-2 text-xs text-paper">
                  Kirim submisi
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
