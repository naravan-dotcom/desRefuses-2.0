"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb, REPORT_REASONS } from "@/lib/seed";

function cloneDb(db) {
  return JSON.parse(JSON.stringify(db));
}

export default function ArtworkPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
      setSessionIdState(getSessionId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const artwork = useMemo(
    () => db.artworks.find((item) => item.id === id),
    [db, id],
  );
  const creator = useMemo(
    () => db.users.find((user) => user.id === artwork?.userId),
    [db, artwork],
  );
  const category = useMemo(
    () => db.categories.find((item) => item.id === artwork?.categoryId),
    [db, artwork],
  );
  const comments = useMemo(
    () =>
      db.comments
        .filter((comment) => comment.artworkId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db, id],
  );
  const related = useMemo(
    () =>
      db.artworks
        .filter((item) => item.userId === artwork?.userId && item.id !== id)
        .slice(0, 3),
    [db, artwork, id],
  );
  const user = useMemo(
    () => (sessionId ? db.users.find((item) => item.id === sessionId) ?? null : null),
    [db, sessionId],
  );

  const isMember = user?.role === "member";
  const liked = Boolean(user && artwork?.likedBy?.includes(user.id));
  const favorited = Boolean(user && user.favorites?.includes(id));

  function commit(mutator) {
    const next = cloneDb(db);
    mutator(next);
    saveDb(next);
    setDb(next);
  }

  function requireMember() {
    if (!isMember) {
      setNotice("Masuk sebagai Member untuk melakukan ini.");
      return false;
    }
    return true;
  }

  function toggleLike() {
    if (!requireMember()) return;

    commit((next) => {
      const item = next.artworks.find((entry) => entry.id === id);
      item.likedBy = item.likedBy || [];
      const index = item.likedBy.indexOf(user.id);

      if (index >= 0) {
        item.likedBy.splice(index, 1);
        item.likes = Math.max(0, item.likes - 1);
      } else {
        item.likedBy.push(user.id);
        item.likes += 1;
      }
    });
    setNotice("");
  }

  function toggleFavorite() {
    if (!requireMember()) return;

    const wasFavorited = favorited;
    commit((next) => {
      const account = next.users.find((entry) => entry.id === user.id);
      account.favorites = account.favorites || [];
      const index = account.favorites.indexOf(id);

      if (index >= 0) account.favorites.splice(index, 1);
      else account.favorites.push(id);
    });
    setNotice(wasFavorited ? "Dihapus dari favorit." : "Karya disimpan ke favorit.");
  }

  function addComment(event) {
    event.preventDefault();
    if (!requireMember()) return;

    const text = commentText.trim();
    if (!text) {
      setNotice("Komentar tidak boleh kosong.");
      return;
    }

    commit((next) => {
      next.comments.push({
        id: uid("cm"),
        artworkId: id,
        userId: user.id,
        text,
        createdAt: isoNow(),
      });
    });
    setCommentText("");
    setNotice("Komentar dikirim ke diskusi publik.");
  }

  function deleteComment(commentId) {
    if (!user) return;

    const target = db.comments.find((comment) => comment.id === commentId);
    if (!target) return;

    if (target.userId !== user.id && user.role !== "admin") {
      setNotice("Anda hanya dapat menghapus komentar sendiri.");
      return;
    }
    if (!window.confirm("Hapus komentar ini?")) return;

    commit((next) => {
      next.comments = next.comments.filter((comment) => comment.id !== commentId);
      next.reports.forEach((item) => {
        if (item.type === "comment" && item.targetId === commentId && item.status === "open") {
          item.status = "dismissed";
        }
      });
    });
    setNotice("Komentar dihapus.");
  }

  function openReport(type, targetId) {
    if (!requireMember()) return;

    const ownerId =
      type === "artwork"
        ? db.artworks.find((item) => item.id === targetId)?.userId
        : db.comments.find((item) => item.id === targetId)?.userId;

    if (!ownerId) return;
    if (ownerId === user.id) {
      setNotice("Anda tidak dapat melaporkan konten sendiri.");
      return;
    }
    if (
      db.reports.some(
        (item) =>
          item.type === type &&
          item.targetId === targetId &&
          item.reporterId === user.id &&
          item.status === "open",
      )
    ) {
      setNotice("Anda sudah pernah melaporkan ini.");
      return;
    }

    setReport({ type, targetId });
    setReason("");
    setReportDetail("");
    setNotice("");
  }

  function submitReport(event) {
    event.preventDefault();
    if (!report || !isMember) return;

    if (!reason) {
      setNotice("Pilih alasan laporan.");
      return;
    }

    commit((next) => {
      next.reports.push({
        id: uid("r"),
        type: report.type,
        targetId: report.targetId,
        reporterId: user.id,
        reason,
        detail: reportDetail.trim(),
        createdAt: isoNow(),
        status: "open",
      });
    });
    setReport(null);
    setNotice("Laporan terkirim ke antrean moderasi.");
  }

  if (!artwork) {
    return (
      <main className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl border border-dashed border-ink/20 p-10 text-center">
          <p className="text-sm text-ink/55">Karya tidak ditemukan.</p>
          <Link href="/gallery" className="mt-4 inline-block text-xs underline">
            Kembali ke galeri
          </Link>
        </div>
      </main>
    );
  }

  let actions = null;
  if (!user) {
    actions = (
      <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
        Masuk sebagai Member untuk menyukai, menyimpan, berkomentar, atau
        melaporkan karya ini.
        <div className="mt-3 flex gap-2">
          <Link href="/login" className="border border-ink bg-ink px-3 py-2 text-paper">
            Masuk
          </Link>
          <Link href="/register" className="border border-ink/20 px-3 py-2">
            Daftar
          </Link>
        </div>
      </div>
    );
  } else if (isMember) {
    actions = (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleLike}
          className="border border-ink/20 px-3 py-2 text-xs transition-colors hover:border-ink"
        >
          {liked ? "Disukai" : "Suka"} · {artwork.likes}
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          className="border border-ink/20 px-3 py-2 text-xs transition-colors hover:border-ink"
        >
          {favorited ? "Tersimpan" : "Favorit"}
        </button>
        {artwork.userId === user.id ? (
          <Link
            href="/dashboard/artworks"
            className="border border-ink/20 px-3 py-2 text-xs"
          >
            Kelola karya
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openReport("artwork", artwork.id)}
            className="border border-ink/20 px-3 py-2 text-xs transition-colors hover:border-ink"
          >
            Laporkan
          </button>
        )}
      </div>
    );
  } else {
    actions = (
      <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
        Akun {user.role === "admin" ? "Admin" : "Curator"} hanya dapat
        menjelajahi karya. Interaksi tersedia untuk Member.
      </div>
    );
  }

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/gallery"
          className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
        >
          Kembali ke galeri
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="border border-ink/15 bg-ink p-2 sm:p-3">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="max-h-[68vh] w-full object-contain"
            />
          </div>

          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {category?.name ?? "Tanpa kategori"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {artwork.title}
            </h1>
            <p className="text-sm text-ink/55">
              oleh {creator?.name ?? "Kreator"} · @{creator?.username ?? "kreator"}
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              {artwork.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {(artwork.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="border border-ink/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/50"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 border border-ink/15 bg-white">
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Suka</p>
                <p className="mt-1 text-lg font-semibold">{artwork.likes}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Komentar</p>
                <p className="mt-1 text-lg font-semibold">{comments.length}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Status</p>
                <p className="mt-2 text-[11px] text-ink/55">Tanpa kurasi</p>
              </div>
            </div>

            <div>{actions}</div>
            {notice && <p className="text-xs text-ink/55">{notice}</p>}
          </div>
        </div>

        <section className="border-t border-ink/15 pt-8">
          <h2 className="text-xl font-semibold">Diskusi publik</h2>

          {isMember ? (
            <form onSubmit={addComment} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={400}
                placeholder="Tulis apresiasi atau kritik yang membangun..."
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
              <button
                type="submit"
                className="shrink-0 bg-ink px-4 py-2.5 text-xs text-paper"
              >
                Kirim komentar
              </button>
            </form>
          ) : (
            <p className="mt-4 text-xs text-ink/45">
              <Link href="/login" className="underline">
                Masuk sebagai Member
              </Link>{" "}
              untuk ikut berdiskusi.
            </p>
          )}

          <div className="mt-5 space-y-3">
            {comments.length ? (
              comments.map((comment) => {
                const author = db.users.find((item) => item.id === comment.userId);
                const own = Boolean(user && comment.userId === user.id);

                return (
                  <div key={comment.id} className="border border-ink/15 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium">
                        {author?.name ?? "Pengguna dihapus"}
                      </p>
                      {own && <span className="text-[10px] text-ink/40">Komentar Anda</span>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">
                      {comment.text}
                    </p>
                    <div className="mt-3 flex gap-4 text-[10px] uppercase tracking-[0.12em] text-ink/45">
                      {(own || user?.role === "admin") && (
                        <button
                          type="button"
                          onClick={() => deleteComment(comment.id)}
                          className="hover:text-ink"
                        >
                          Hapus
                        </button>
                      )}
                      {isMember && !own && (
                        <button
                          type="button"
                          onClick={() => openReport("comment", comment.id)}
                          className="hover:text-ink"
                        >
                          Laporkan komentar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="border border-dashed border-ink/20 p-6 text-center text-sm text-ink/45">
                Belum ada diskusi.
              </p>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-ink/15 pt-8">
            <h2 className="text-xl font-semibold">Karya lain oleh kreator</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/artwork/${item.id}`}
                  className="border border-ink/15 bg-white"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="p-2 text-xs">{item.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {report && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/60 p-5">
          <section className="w-full max-w-lg border border-ink/15 bg-paper p-6">
            <h2 className="text-xl font-semibold">
              {report.type === "artwork" ? "Laporkan karya" : "Laporkan komentar"}
            </h2>
            <form onSubmit={submitReport} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-ink/60">Alasan laporan</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Pilih alasan...</option>
                  {REPORT_REASONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-ink/60">
                  Keterangan tambahan
                </span>
                <textarea
                  value={reportDetail}
                  onChange={(event) => setReportDetail(event.target.value)}
                  maxLength={500}
                  className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <p className="text-[11px] leading-relaxed text-ink/45">
                Satu karya atau komentar hanya dapat dilaporkan sekali per akun.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReport(null)}
                  className="border border-ink/20 px-3 py-2 text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="bg-ink px-3 py-2 text-xs text-paper">
                  Kirim laporan
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
