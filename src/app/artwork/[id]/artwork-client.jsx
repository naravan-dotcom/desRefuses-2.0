"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
const REPORT_REASONS = [
  "Plagiat",
  "SARA",
  "Konten tidak pantas",
  "Perundungan",
  "Spam",
  "Lainnya",
];
import { addComment, deleteComment, submitReport, toggleFavorite, toggleLike } from "./actions";

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
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}`;
}

function artCode(artwork) {
  return `DR-${String(artwork.id).slice(-4).toUpperCase()}`;
}

export default function ArtworkClient({
  artwork,
  creator,
  categoryName,
  comments,
  related,
  user,
  liked,
  favorited,
  reported,
}) {
  const router = useRouter();
  const [likes, setLikes] = useState(artwork.likes);
  const [likedState, setLikedState] = useState(liked);
  const [favoritedState, setFavoritedState] = useState(favorited);
  const [commentList, setCommentList] = useState(comments);
  const [commentText, setCommentText] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState(null);
  const [reason, setReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportedKeys, setReportedKeys] = useState(() => new Set(reported));

  const isMember = user?.role === "member";

  function buildForm(entries) {
    const formData = new FormData();
    Object.entries(entries).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    return formData;
  }

  async function handleLike() {
    if (!isMember) {
      setNotice("Masuk sebagai Member untuk melakukan ini.");
      return;
    }
    const result = await toggleLike(buildForm({ artworkId: artwork.id }));
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setLikedState(result.liked);
    setLikes(result.likes);
    setNotice("");
    router.refresh();
  }

  async function handleFavorite() {
    if (!isMember) {
      setNotice("Masuk sebagai Member untuk melakukan ini.");
      return;
    }
    const result = await toggleFavorite(buildForm({ artworkId: artwork.id }));
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setFavoritedState(result.favorited);
    setNotice(result.favorited ? "Karya disimpan ke favorit." : "Dihapus dari favorit.");
    router.refresh();
  }

  async function handleComment(event) {
    event.preventDefault();
    if (!isMember) {
      setNotice("Masuk sebagai Member untuk melakukan ini.");
      return;
    }
    const text = commentText.trim();
    if (!text) {
      setNotice("Komentar tidak boleh kosong.");
      return;
    }
    const result = await addComment(buildForm({ artworkId: artwork.id, text }));
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setCommentList((current) => [result.comment, ...current]);
    setCommentText("");
    setNotice("Komentar dikirim ke diskusi publik.");
    router.refresh();
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Hapus komentar ini?")) return;
    const result = await deleteComment(buildForm({ id: commentId }));
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setCommentList((current) => current.filter((item) => item.id !== commentId));
    setNotice("Komentar dihapus.");
    router.refresh();
  }

  function openReport(type, targetId, ownerId) {
    if (!isMember) {
      setNotice("Masuk sebagai Member untuk melakukan ini.");
      return;
    }
    if (String(ownerId) === String(user.dbId)) {
      setNotice("Anda tidak dapat melaporkan konten sendiri.");
      return;
    }
    if (reportedKeys.has(`${type}:${targetId}`)) {
      setNotice("Anda sudah pernah melaporkan ini.");
      return;
    }
    setReport({ type, targetId });
    setReason("");
    setReportDetail("");
    setNotice("");
  }

  async function handleReport(event) {
    event.preventDefault();
    if (!report || !isMember) return;
    const result = await submitReport(
      buildForm({ type: report.type, targetId: report.targetId, reason, detail: reportDetail }),
    );
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setReportedKeys((current) => new Set([...current, `${report.type}:${report.targetId}`]));
    setReport(null);
    setNotice("Laporan terkirim ke antrean moderasi.");
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
        <button type="button" onClick={handleLike} className={`btn btn-sm ${likedState ? "btn-wine" : "btn-outline"}`}>
          <i className={`fa-${likedState ? "solid" : "regular"} fa-heart`} />
          {likedState ? "Disukai" : "Suka"} · {likes}
        </button>
        <button type="button" onClick={handleFavorite} className={`btn btn-sm ${favoritedState ? "btn-wine" : "btn-outline"}`}>
          <i className={`fa-${favoritedState ? "solid" : "regular"} fa-bookmark`} />
          {favoritedState ? "Tersimpan" : "Favorit"}
        </button>
        {String(user.dbId) === creator.id ? (
          <Link href="/dashboard/artworks" className="btn btn-outline btn-sm">Kelola karya</Link>
        ) : (
          <button type="button" onClick={() => openReport("artwork", artwork.id, creator.dbId)} className="btn btn-outline btn-sm">
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
            <div className="label text-wine">{categoryName ?? "Tanpa kategori"}</div>
            <h1 className="font-display mt-4 text-[38px] leading-[1.08] sm:text-[52px]">{artwork.title}</h1>
            {creator && (
              <p className="mt-4 text-[15px] text-ink/70">
                oleh{" "}
                <Link href={`/creator/${creator.id}`} className="text-wine hover:underline">
                  {creator.name}
                </Link>{" "}
                · @{creator.username}
              </p>
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
                <div className="font-display mt-1 text-[28px] leading-none">{likes}</div>
              </div>
              <div className="border-r hairline py-4 pl-4">
                <div className="label text-ink/65">Komentar</div>
                <div className="font-display mt-1 text-[28px] leading-none">{commentList.length}</div>
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
            <form onSubmit={handleComment} className="mt-6 flex flex-col gap-3 sm:flex-row">
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
            {commentList.length ? (
              commentList.map((comment) => {
                const own = Boolean(user && String(user.dbId) === comment.userId.replace(/^u/, ""));
                return (
                  <article key={comment.id} className="border hairline bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={comment.authorAvatar || "/desrefuses-mark.png"} alt="" className="avatar h-8 w-8" />
                        <div>
                          <p className="text-[14px] font-semibold">{comment.authorName || "Pengguna"}</p>
                          <p className="label mt-0.5 text-ink/50">{new Date(comment.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                      {own && <span className="status status-approved">Komentar Anda</span>}
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink/70">{comment.text}</p>
                    <div className="mt-4 flex gap-5 border-t hairline pt-3">
                      {(own || user?.role === "admin") && (
                        <button type="button" onClick={() => handleDeleteComment(comment.id)} className="label text-wine hover:text-ink">
                          Hapus
                        </button>
                      )}
                      {isMember && !own && (
                        <button
                          type="button"
                          onClick={() => openReport("comment", comment.id, comment.userId.replace(/^u/, ""))}
                          className="label text-ink/60 hover:text-ink"
                        >
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
            <form onSubmit={handleReport} className="mt-6 space-y-4">
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
