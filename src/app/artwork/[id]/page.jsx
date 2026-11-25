"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb, REPORT_REASONS } from "@/lib/seed";

function cloneDb(db) {
  return JSON.parse(JSON.stringify(db));
}

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthName = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

function artCode(artwork) {
  return `DR-${String(artwork.id).slice(-4).toUpperCase()}`;
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

  const artwork = useMemo(() => db.artworks.find((item) => item.id === id), [db, id]);
  const creator = useMemo(() => db.users.find((user) => user.id === artwork?.userId), [db, artwork]);
  const category = useMemo(() => db.categories.find((item) => item.id === artwork?.categoryId), [db, artwork]);
  const comments = useMemo(
    () => db.comments.filter((item) => item.artworkId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db, id],
  );
  const related = useMemo(
    () => db.artworks.filter((item) => item.userId === artwork?.userId && item.id !== id).slice(0, 3),
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
    if (db.reports.some((item) => item.type === type && item.targetId === targetId && item.reporterId === user.id && item.status === "open")) {
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
      <main className="page-enter px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-image text-2xl text-ink/40" />
          <h1 className="font-display mt-4 text-[28px]">Karya tidak ditemukan.</h1>
          <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Kembali ke galeri</Link>
        </div>
      </main>
    );
  }

  let actions = null;
  if (!user) {
    actions = (
      <div className="border hairline bg-canvas p-4 text-[14px] leading-relaxed text-ink/65">
        Masuk sebagai Member untuk menyukai, menyimpan, berkomentar, atau melaporkan karya ini.
        <div className="mt-4 flex gap-2">
          <Link href="/login" className="btn btn-ink btn-sm">Masuk</Link>
          <Link href="/register" className="btn btn-outline btn-sm">Daftar</Link>
        </div>
      </div>
    );
  } else if (isMember) {
    actions = (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleLike} className={`btn btn-sm ${liked ? "btn-wine" : "btn-outline"}`}>
          <i className={`fa-${liked ? "solid" : "regular"} fa-heart`} />
          {liked ? "Disukai" : "Suka"} · {artwork.likes}
        </button>
        <button type="button" onClick={toggleFavorite} className={`btn btn-sm ${favorited ? "btn-wine" : "btn-outline"}`}>
          <i className={`fa-${favorited ? "solid" : "regular"} fa-bookmark`} />
          {favorited ? "Tersimpan" : "Favorit"}
        </button>
        {artwork.userId === user.id ? (
          <Link href="/dashboard/artworks" className="btn btn-outline btn-sm">Kelola karya</Link>
        ) : (
          <button type="button" onClick={() => openReport("artwork", artwork.id)} className="btn btn-outline btn-sm">
            <i className="fa-solid fa-flag" /> Laporkan
          </button>
        )}
      </div>
    );
  } else {
    actions = (
      <div className="border hairline bg-canvas p-4 text-[14px] leading-relaxed text-ink/65">
        Akun {user.role === "admin" ? "Admin" : "Curator"} hanya dapat menjelajahi karya. Interaksi tersedia untuk Member.
      </div>
    );
  }

  return (
    <main className="page-enter">
      <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-10 lg:py-16">
        <Link href="/gallery" className="label flex w-fit items-center gap-2 text-ink/65 hover:text-ink">
          <i className="fa-solid fa-arrow-left text-[11px]" /> Kembali ke galeri
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="art-media aspect-[4/5] bg-ink p-2 sm:p-3">
              <img src={artwork.image} alt={artwork.title} className="art-img h-full w-full object-contain" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b hairline pb-4">
              <div className="label">Karya · {artCode(artwork)}</div>
              <div className="label text-ink/65">Diunggah {formatDate(artwork.createdAt)}</div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="label text-wine">{category?.name ?? "Tanpa kategori"}</div>
            <h1 className="font-display mt-4 text-[38px] leading-[1.08] sm:text-[52px]">{artwork.title}</h1>
            {creator ? (
              <p className="mt-4 text-[15px] text-ink/70">
                oleh{" "}
                <Link href={`/creator/${creator.id}`} className="text-wine hover:underline">
                  {creator.name}
                </Link>{" "}
                · @{creator.username}
              </p>
            ) : (
              <p className="mt-4 text-[15px] text-ink/70">oleh Kreator</p>
            )}
            <p className="mt-6 text-[15px] leading-[1.8] text-ink/70">{artwork.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {(artwork.tags ?? []).map((tag) => (
                <span key={tag} className="chip">#{tag}</span>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 border-y hairline">
              <div className="border-r hairline py-4">
                <div className="label text-ink/65">Suka</div>
                <div className="font-display mt-1 text-[28px] leading-none">{artwork.likes ?? 0}</div>
              </div>
              <div className="border-r hairline py-4 pl-4">
                <div className="label text-ink/65">Komentar</div>
                <div className="font-display mt-1 text-[28px] leading-none">{comments.length}</div>
              </div>
              <div className="py-4 pl-4">
                <div className="label text-ink/65">Tanggal</div>
                <div className="mt-1 text-[13px] text-ink/70">{formatDate(artwork.createdAt)}</div>
              </div>
            </div>

            <div className="mt-7">{actions}</div>
            {notice && <p className="label mt-4 text-wine">{notice}</p>}
          </div>
        </div>

        <section className="mt-16 border-t hairline pt-10">
          <div className="label text-ink/65">Diskusi publik</div>
          <h2 className="font-display mt-3 text-[34px] leading-[1.12]">Apresiasi &amp; kritik.</h2>
          {isMember ? (
            <form onSubmit={addComment} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={400}
                placeholder="Tulis apresiasi atau kritik yang membangun..."
                className="field flex-1"
              />
              <button type="submit" className="btn btn-ink">Kirim komentar</button>
            </form>
          ) : (
            <p className="mt-6 text-[14px] text-ink/65">
              <Link href="/login" className="text-wine underline">Masuk sebagai Member</Link> untuk ikut berdiskusi.
            </p>
          )}

          <div className="mt-8 space-y-4">
            {comments.length ? (
              comments.map((comment) => {
                const author = db.users.find((item) => item.id === comment.userId);
                const own = Boolean(user && comment.userId === user.id);
                return (
                  <article key={comment.id} className="border hairline bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={author?.avatar || "/desrefuses-mark.png"}
                          alt=""
                          className="avatar h-8 w-8"
                        />
                        <div>
                          <p className="text-[14px] font-semibold">{author?.name ?? "Pengguna dihapus"}</p>
                          <p className="label mt-0.5 text-ink/50">{new Date(comment.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                      {own && <span className="status status-approved">Komentar Anda</span>}
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink/70">{comment.text}</p>
                    <div className="mt-4 flex gap-5 border-t hairline pt-3">
                      {(own || user?.role === "admin") && (
                        <button type="button" onClick={() => deleteComment(comment.id)} className="label text-wine hover:text-ink">
                          Hapus
                        </button>
                      )}
                      {isMember && !own && (
                        <button type="button" onClick={() => openReport("comment", comment.id)} className="label text-ink/60 hover:text-ink">
                          Laporkan komentar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="border border-dashed border-ink/20 p-8 text-center text-[14px] text-ink/55">
                Belum ada diskusi. Jadi yang pertama memberi apresiasi.
              </div>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16 border-t hairline pt-10">
            <div className="label text-ink/65">Portofolio kreator</div>
            <h2 className="font-display mt-3 text-[34px] leading-[1.12]">Karya lain oleh kreator.</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/artwork/${item.id}`} className="group block">
                  <div className="art-media aspect-[4/3]">
                    <img src={item.image} alt={item.title} loading="lazy" className="art-img h-full w-full object-cover" />
                  </div>
                  <div className="font-display mt-3 text-[20px] leading-tight group-hover:text-wine">{item.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {report && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/65 p-5">
          <section className="w-full max-w-lg border hairline bg-paper p-6 shadow-2xl">
            <div className="label text-wine">Laporan konten</div>
            <h2 className="font-display mt-2 text-[28px] leading-none">
              {report.type === "artwork" ? "Laporkan karya" : "Laporkan komentar"}
            </h2>
            <form onSubmit={submitReport} className="mt-6 space-y-4">
              <label className="block">
                <span className="label">Alasan laporan</span>
                <select value={reason} onChange={(event) => setReason(event.target.value)} className="field mt-2">
                  <option value="">Pilih alasan...</option>
                  {REPORT_REASONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Keterangan tambahan</span>
                <textarea
                  value={reportDetail}
                  onChange={(event) => setReportDetail(event.target.value)}
                  maxLength={500}
                  className="field mt-2 min-h-24"
                />
              </label>
              <p className="text-[12px] leading-relaxed text-ink/55">
                Satu karya atau komentar hanya dapat dilaporkan sekali per akun.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReport(null)} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-wine btn-sm">Kirim laporan</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
