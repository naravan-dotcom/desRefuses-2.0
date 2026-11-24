"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";
import { useSession } from "@/lib/use-session";

const MAX_FILE_SIZE = 1024 * 1024;
const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  tags: "",
  image: "",
};

export default function DashboardArtworksPage() {
  const { user } = useSession();
  const [db, setDb] = useState(() => createSeedDb());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const artworks = useMemo(
    () => db.artworks.filter((item) => item.userId === user?.id),
    [db, user],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((item) => [item.id, item.name])),
    [db],
  );

  const confirming = confirmingId
    ? artworks.find((item) => item.id === confirmingId) ?? null
    : null;

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFileName("");
  }

  function pickFile(event) {
    const file = event.target.files?.[0];
    setError("");
    setNotice("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      setFileName("");
      setForm((current) => ({ ...current, image: "" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran gambar maksimal 1 MB.");
      setFileName("");
      setForm((current) => ({ ...current, image: "" }));
      return;
    }

    setFileName(file.name);
    setForm((current) => ({ ...current, image: "" }));
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => setError("Gambar gagal dibaca.");
    reader.readAsDataURL(file);
  }

  function startCreate() {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: db.categories[0]?.id ?? "",
    });
    setFileName("");
    setShowForm(true);
  }

  function startEdit(artwork) {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setEditingId(artwork.id);
    setForm({
      title: artwork.title,
      description: artwork.description,
      categoryId: artwork.categoryId,
      tags: (artwork.tags ?? []).join(", "),
      image: artwork.image,
    });
    setFileName("");
    setShowForm(true);
  }

  function saveArtwork(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!user || user.role !== "member") {
      setError("Hanya Member yang bisa mengelola karya.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const tags = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!title || !description || !form.categoryId || tags.length === 0) {
      setError(
        "Judul, deskripsi, kategori, dan minimal satu tag wajib diisi.",
      );
      return;
    }
    if (!editingId && !form.image) {
      setError("Pilih file gambar terlebih dahulu.");
      return;
    }

    const next = loadDb();
    if (editingId) {
      const target = next.artworks.find(
        (item) => item.id === editingId && item.userId === user.id,
      );
      if (!target) {
        setError("Karya tidak ditemukan.");
        return;
      }
      target.title = title;
      target.description = description;
      target.categoryId = form.categoryId;
      target.tags = tags;
      setNotice("Karya diperbarui.");
    } else {
      next.artworks.push({
        id: uid("a"),
        userId: user.id,
        title,
        description,
        categoryId: form.categoryId,
        tags,
        image: form.image,
        createdAt: isoNow(),
        likes: 0,
        likedBy: [],
      });
      setNotice("Karya berhasil diunggah.");
    }

    saveDb(next);
    setDb(next);
    setConfirmingId(null);
    resetForm();
  }

  function deleteArtwork(id) {
    const next = loadDb();
    const target = next.artworks.find(
      (item) => item.id === id && item.userId === user?.id,
    );
    if (!target) return;

    const removedComments = next.comments
      .filter((item) => item.artworkId === id)
      .map((item) => item.id);

    next.comments = next.comments.filter((item) => item.artworkId !== id);
    next.submissions = next.submissions.filter(
      (item) => item.artworkId !== id,
    );
    next.reports = next.reports.filter(
      (item) =>
        !(item.type === "artwork" && item.targetId === id) &&
        !(item.type === "comment" && removedComments.includes(item.targetId)),
    );
    next.challenges.forEach((challenge) => {
      ["first", "second", "third"].forEach((rank) => {
        if (challenge.winners?.[rank] === id) challenge.winners[rank] = null;
      });
    });
    next.users.forEach((item) => {
      item.favorites = (item.favorites ?? []).filter((fav) => fav !== id);
    });
    next.artworks = next.artworks.filter((item) => item.id !== id);

    saveDb(next);
    setDb(next);
    setConfirmingId(null);
    resetForm();
    setNotice("Karya dihapus beserta komentar dan submisinya.");
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Karya saya</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola karya yang Anda pajang di galeri publik. Gambar disimpan di
          browser dengan batas 1 MB per karya.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">{artworks.length} karya</p>
        <button
          type="button"
          onClick={startCreate}
          className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
        >
          Unggah karya
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveArtwork}
          className="space-y-4 border border-ink/15 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {editingId ? "Edit karya" : "Karya baru"}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
            >
              Batal
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-ink/60">
              Judul karya
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Judul karya"
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>
            <label className="space-y-1 text-xs text-ink/60">
              Kategori
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
              >
                <option value="">Pilih kategori</option>
                {db.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs text-ink/60">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder="Ceritakan karya Anda"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block space-y-1 text-xs text-ink/60">
            Tags (dipisah koma, minimal satu)
            <input
              type="text"
              value={form.tags}
              onChange={(event) =>
                setForm((current) => ({ ...current, tags: event.target.value }))
              }
              placeholder="abstrak, warna, manifesto"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          {editingId ? (
            <p className="border border-dashed border-ink/20 p-3 text-xs leading-relaxed text-ink/55">
              File karya tidak bisa diganti saat edit. Hapus dan unggah ulang
              karya untuk mengganti gambar.
            </p>
          ) : (
            <label className="block space-y-1 text-xs text-ink/60">
              File gambar (maksimal 1 MB)
              <input
                type="file"
                accept="image/*"
                onChange={pickFile}
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </label>
          )}

          {form.image && (
            <div className="flex items-center gap-3 border border-ink/15 p-3">
              <img
                src={form.image}
                alt="Pratinjau karya"
                className="h-16 w-16 object-cover"
              />
              <p className="text-xs text-ink/55">
                {fileName || "Gambar karya saat ini"}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
          >
            {editingId ? "Simpan perubahan" : "Unggah karya"}
          </button>
        </form>
      )}

      {error && (
        <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {notice && <p className="text-xs text-ink/55">{notice}</p>}

      {confirming && (
        <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <p>
            Hapus &quot;{confirming.title}&quot;? Komentar, suka, favorit,
            laporan, dan submisi terkait ikut dihapus.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => deleteArtwork(confirming.id)}
              className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800"
            >
              Ya, hapus
            </button>
            <button
              type="button"
              onClick={() => setConfirmingId(null)}
              className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Karya</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Suka</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {artworks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/45">
                    Belum ada karya. Unggah karya pertama Anda.
                  </td>
                </tr>
              ) : (
                artworks.map((artwork) => (
                  <tr
                    key={artwork.id}
                    className="border-b border-ink/10 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={artwork.image}
                          alt=""
                          className="h-12 w-12 object-cover"
                        />
                        <div>
                          <p className="font-medium">{artwork.title}</p>
                          <p className="text-xs text-ink/50">
                            {(artwork.tags ?? []).map((tag) => `#${tag}`).join(" ")}
                          </p>
                          <Link
                            href={`/artwork/${artwork.id}`}
                            className="text-xs text-ink/45 hover:text-ink hover:underline"
                          >
                            Lihat di galeri
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {categoryNames[artwork.categoryId] ?? "Tanpa kategori"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{artwork.likes}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {artwork.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(artwork)}
                          className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setNotice("");
                            setConfirmingId(artwork.id);
                          }}
                          className="border border-red-600/50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
