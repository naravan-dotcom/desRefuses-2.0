"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { notify } from "@/components/toast";
import ArtworkCard from "@/components/artwork-card";
import { isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { getSessionId } from "@/lib/auth-client";
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

const statusClasses = {
  active: "status-live",
  upcoming: "status-upcoming",
  ended: "status-ended",
};

const winnerRanks = [
  { key: "first", label: "Juara 1" },
  { key: "second", label: "Juara 2" },
  { key: "third", label: "Juara 3" },
];

function roleLabel(user) {
  if (!user) return "Guest";
  if (user.role === "admin") return "Admin";
  if (user.role === "curator") return "Curator";
  return "Member";
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
      setSessionIdState(getSessionId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const challenge = useMemo(() => db.challenges.find((item) => item.id === id), [db, id]);
  const curator = useMemo(() => db.users.find((item) => item.id === challenge?.curatorId), [db, challenge]);
  const user = useMemo(() => db.users.find((item) => item.id === sessionId) ?? null, [db, sessionId]);
  const status = challenge ? getStatus(challenge) : null;
  const isActive = status === "active";

  const submissions = useMemo(() => db.submissions.filter((item) => item.challengeId === id), [db, id]);
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
  const categoryNames = useMemo(
    () => Object.fromEntries((db.categories ?? []).map((item) => [item.id, item.name])),
    [db],
  );
  const commentCounts = useMemo(
    () =>
      (db.comments ?? []).reduce((counts, comment) => {
        counts[comment.artworkId] = (counts[comment.artworkId] ?? 0) + 1;
        return counts;
      }, {}),
    [db],
  );

  function openSubmit() {
    setNotice("");
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
    if (next.submissions.some((item) => item.challengeId === id && item.userId === user?.id)) {
      setNotice("Anda sudah memiliki submisi di challenge ini.");
      setSubmitOpen(false);
      return;
    }
    if (!next.artworks.some((item) => item.id === selectedArtwork && item.userId === user?.id)) {
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
    notify("Karya berhasil disubmit.", "success");
  }

  function withdraw() {
    setNotice("");
    const next = loadDb();
    const target = next.challenges.find((item) => item.id === id);
    if (!target || getStatus(target) === "ended") {
      setNotice("Challenge sudah berakhir. Submisi tidak bisa ditarik.");
      notify("Challenge sudah berakhir. Submisi tidak bisa ditarik.", "error");
      return;
    }
    next.submissions = next.submissions.filter(
      (item) => !(item.challengeId === id && item.userId === user?.id),
    );
    saveDb(next);
    setDb(next);
    setNotice("Submisi ditarik.");
    notify("Submisi ditarik.", "info");
  }

  if (!challenge) {
    return (
      <main className="page-enter px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-flag text-2xl text-ink/40" />
          <h1 className="font-display mt-4 text-[28px]">Challenge tidak ditemukan.</h1>
          <Link href="/challenges" className="btn btn-outline btn-sm mt-5">Kembali ke daftar challenge</Link>
        </div>
      </main>
    );
  }

  const isOwner = user?.role === "curator" && user.id === challenge.curatorId;
  const submittedArtwork = db.artworks.find((item) => item.id === mySubmission?.artworkId);

  let participation = null;
  if (!user) {
    participation = (
      <div>
        <p className="text-[14px] leading-relaxed text-ink/80">
          Masuk sebagai Member untuk mengirim karya ke challenge ini.
        </p>
        <div className="mt-3 flex gap-2">
          <Link href="/login" className="btn btn-ink btn-sm">Masuk</Link>
          <Link href="/register" className="btn btn-outline btn-sm">Daftar</Link>
        </div>
      </div>
    );
  } else if (isOwner) {
    participation = (
      <div>
        <p className="text-[14px] leading-relaxed text-ink/80">Anda adalah penyelenggara challenge ini.</p>
        <Link href={`/dashboard/challenges?challenge=${challenge.id}`} className="btn btn-ink btn-sm mt-3 w-full">
          <i className="fa-solid fa-sliders" />Kelola challenge
        </Link>
      </div>
    );
  } else if (user.role !== "member") {
    participation = (
      <p className="text-[14px] leading-relaxed text-ink/80">
        Akun {roleLabel(user)} hanya dapat menjelajahi challenge dan karya partisipan.
      </p>
    );
  } else if (status === "upcoming") {
    participation = (
      <p className="text-[14px] leading-relaxed text-ink/80">
        Submisi dibuka pada <span className="font-semibold text-ink">{formatDate(challenge.startDate)}</span>.
      </p>
    );
  } else if (status === "ended") {
    participation = (
      <div>
        <p className="text-[14px] leading-relaxed text-ink/80">Challenge telah berakhir. Submisi ditutup.</p>
        {mySubmission && (
          <div className="label mt-2 text-green-700">Karya Anda tercatat sebagai peserta</div>
        )}
      </div>
    );
  } else if (mySubmission) {
    participation = (
      <div>
        <div className="label text-ink/65">Submisi Anda</div>
        {submittedArtwork && (
          <div className="mt-2 flex items-center gap-2.5">
            <img src={submittedArtwork.image} alt="" className="h-12 w-12 border hairline object-cover" />
            <div className="min-w-0">
              <Link href={`/artwork/${submittedArtwork.id}`} className="line-clamp-2 text-[14px] font-semibold hover:text-pink">
                {submittedArtwork.title}
              </Link>
              <div className="label mt-1 text-ink/65">{formatDate(mySubmission.createdAt)}</div>
            </div>
          </div>
        )}
        <button type="button" onClick={withdraw} className="btn btn-outline btn-sm mt-3 w-full">
          <i className="fa-solid fa-rotate-left" />Tarik submisi
        </button>
        <p className="font-label mt-2 text-[12px] text-ink/65">
          Submisi dapat ditarik selama challenge belum berakhir.
        </p>
      </div>
    );
  } else {
    participation = (
      <div>
        <p className="text-[14px] leading-relaxed text-ink/80">
          Pilih satu karya dari portofolio Anda. Setiap member hanya dapat mengirim satu karya per challenge.
        </p>
        <button type="button" onClick={openSubmit} className="btn btn-pink btn-sm mt-3 w-full">
          <i className="fa-solid fa-arrow-up-from-bracket" />Submit karya
        </button>
      </div>
    );
  }

  return (
    <main className="page-enter">
      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between gap-3 pb-4">
          <Link href="/challenges" className="font-label text-[13px] uppercase tracking-normal text-ink/65 hover:text-ink">
            <i className="fa-solid fa-arrow-left mr-2" />Semua tantangan
          </Link>
          <span className="label text-ink/65">Ruang curator</span>
        </div>

        <section className="relative overflow-hidden border hairline bg-ink">
          <img
            src={challenge.banner}
            alt={challenge.title}
            className="aspect-[21/9] w-full object-cover opacity-80 sm:aspect-[3/1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`status ${statusClasses[status]}`}>{statusLabels[status]}</span>
              <span className="label text-paper/60">oleh {curator?.name ?? "Curator"}</span>
            </div>
            <h1 className="font-display mt-2 max-w-3xl text-3xl font-bold leading-[1.03] text-paper sm:text-5xl">
              {challenge.title}
            </h1>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <section>
              <div className="label text-ink/65">Tentang challenge</div>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/80">{challenge.description}</p>
            </section>
            <section className="mt-7">
              <div className="label text-ink/65">Aturan</div>
              <div className="mt-2 border hairline bg-white p-5 text-[15px] leading-relaxed text-ink/80">
                {challenge.rules}
              </div>
            </section>
            {winners.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="label text-pink">Pengumuman</div>
                    <h2 className="font-display mt-1 text-2xl font-bold">Pemenang challenge</h2>
                  </div>
                  <span className="label text-ink/65">{winners.length} karya terpilih</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {winners.map((winner) => {
                    const creator = db.users.find((item) => item.id === winner.artwork.userId);
                    return (
                      <article key={winner.key} className="border hairline bg-white p-2.5">
                        <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
                          <Link href={`/artwork/${winner.artwork.id}`}>
                            <img src={winner.artwork.image} alt="" className="h-full w-full object-cover" />
                          </Link>
                          <span className="absolute left-2 top-2 bg-ink px-2 py-1 font-label text-[12px] uppercase tracking-normal text-paper">
                            {winner.label}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <Link href={`/artwork/${winner.artwork.id}`} className="font-display line-clamp-2 text-[15px] font-bold leading-tight hover:text-pink">
                            {winner.artwork.title}
                          </Link>
                          <div className="label mt-1 text-ink/65">{creator?.name ?? ""}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="mt-8">
              <div className="flex items-end justify-between">
                <div>
                  <div className="label text-ink/65">Galeri partisipan</div>
                  <h2 className="font-display mt-1 text-2xl font-bold">Karya yang disubmit</h2>
                </div>
                <span className="label text-ink/65">{submissions.length} karya</span>
              </div>
              {entries.length ? (
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry, index) => (
                    <ArtworkCard
                      key={entry.id}
                      artwork={entry.artwork}
                      creator={entry.submitter?.name}
                      creatorId={entry.submitter?.id}
                      category={categoryNames[entry.artwork.categoryId]}
                      commentCount={commentCounts[entry.artwork.id] ?? 0}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 border-b hairline border-t px-6 py-12 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center text-ink/65">
                    <i className="fa-solid fa-images" />
                  </div>
                  <h3 className="font-display mt-4 text-xl font-bold">Belum ada submisi</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink/65">
                    Jadilah yang pertama mengirim karya ke challenge ini.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="border hairline bg-white">
                <div className="border-b hairline p-4">
                  <div className="label text-ink/65">Informasi challenge</div>
                </div>
                <div className="divide-y divide-ink/10 text-[14px]">
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Penyelenggara</span>
                    <span className="text-right font-medium">{curator?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Mulai</span>
                    <span className="text-right font-medium">{formatDate(challenge.startDate)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Selesai</span>
                    <span className="text-right font-medium">{formatDate(challenge.endDate)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Hadiah</span>
                    <span className="text-right font-medium">{challenge.prize}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Partisipan</span>
                    <span className="text-right font-medium">{submissions.length} karya</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="label pt-0.5 text-ink/65">Status</span>
                    <span className={`status ${statusClasses[status]}`}>{statusLabels[status]}</span>
                  </div>
                </div>
              </div>
              <div className="border hairline bg-white p-4">
                <div className="label text-ink/65">Partisipasi</div>
                <div className="mt-2">{participation}</div>
                {notice && <p className="label mt-4 text-wine">{notice}</p>}
              </div>
              <Link href={`/creator/${challenge.curatorId}`} className="block border hairline bg-white p-4 transition-colors hover:border-ink">
                <div className="label text-ink/65">Diselenggarakan oleh</div>
                <div className="mt-2 flex items-center gap-2.5">
                  {curator?.avatar ? (
                    <img src={curator.avatar} alt="" className="avatar h-9 w-9 border border-ink/10 object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center border border-ink/10 bg-ink/5 font-display text-[15px]">
                      {(curator?.name ?? "C").charAt(0)}
                    </span>
                  )}
                  <div>
                    <div className="text-[14px] font-semibold">{curator?.name ?? "—"}</div>
                    <div className="label mt-0.5 text-ink/65">Lihat profil curator</div>
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {submitOpen && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/65 p-5">
          <section className="w-full max-w-lg border hairline bg-paper p-6 shadow-2xl">
            <div className="label text-wine">Partisipasi challenge</div>
            <h2 className="font-display mt-2 text-[28px] leading-none">Submit karya</h2>
            <form onSubmit={submitWork} className="mt-6 space-y-4">
              <label className="block">
                <span className="label">Pilih satu karya</span>
                <select value={selectedArtwork} onChange={(event) => setSelectedArtwork(event.target.value)} className="field mt-2">
                  <option value="">Pilih karya...</option>
                  {myArtworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}>{artwork.title}</option>
                  ))}
                </select>
              </label>
              <p className="text-[12px] leading-relaxed text-ink/55">
                Satu Member hanya dapat mensubmit satu karya per challenge.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSubmitOpen(false)} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-ink btn-sm">Kirim submisi</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
