"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
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
    if (error) notify(error, "error");
  }, [error]);

  useEffect(() => {
    if (notice) notify(notice, "success");
  }, [notice]);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const artworks = useMemo(() => db.artworks.filter((item) => item.userId === user?.id), [db, user]);
  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((item) => [item.id, item.name])),
    [db],
  );
  const confirming = confirmingId ? artworks.find((item) => item.id === confirmingId) ?? null : null;

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
      setForm((current) => ({ ...current, image: typeof reader.result === "string" ? reader.result : "" }));
    };
    reader.onerror = () => setError("Gambar gagal dibaca.");
    reader.readAsDataURL(file);
  }

  function startCreate() {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: db.categories[0]?.id ?? "" });
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
    const tags = form.tags.split(",").map((item) => item.trim()).filter(Boolean);
    if (!title || !description || !form.categoryId || tags.length === 0) {
      setError("Judul, deskripsi, kategori, dan minimal satu tag wajib diisi.");
      return;
    }
    if (!editingId && !form.image) {
      setError("Pilih file gambar terlebih dahulu.");
      return;
    }
    const next = loadDb();
    if (editingId) {
      const target = next.artworks.find((item) => item.id === editingId && item.userId === user.id);
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
    const target = next.artworks.find((item) => item.id === id && item.userId === user?.id);
    if (!target) return;
    const removedComments = next.comments.filter((item) => item.artworkId === id).map((item) => item.id);
    next.comments = next.comments.filter((item) => item.artworkId !== id);
    next.submissions = next.submissions.filter((item) => item.artworkId !== id);
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
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Karya saya.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Kelola karya yang Anda pajang di galeri publik. Gambar disimpan di browser dengan batas 1 MB per karya.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="label text-ink/65">{artworks.length} karya</p>
        <button type="button" onClick={startCreate} className="btn btn-ink btn-sm">
          <i className="fa-solid fa-plus" /> Unggah karya
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={resetForm}
        subtitle={editingId ? "Perbarui karya" : "Karya baru"}
        title={editingId ? "Edit karya" : "Unggah karya"}
      >
        <form onSubmit={saveArtwork} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Judul karya</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Judul karya"
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Kategori</span>
              <select
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                className="field mt-2"
              >
                <option value="">Pilih kategori</option>
                {db.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="label">Deskripsi</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              placeholder="Ceritakan karya Anda"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label">Tags (dipisah koma, minimal satu)</span>
            <input
              type="text"
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="abstrak, warna, manifesto"
              className="field mt-2"
            />
          </label>
          {editingId ? (
            <p className="border border-dashed border-ink/20 p-3 text-[13px] leading-relaxed text-ink/55">
              File karya tidak bisa diganti saat edit. Hapus dan unggah ulang karya untuk mengganti gambar.
            </p>
          ) : (
            <label className="block">
              <span className="label">File gambar (maksimal 1 MB)</span>
              <input type="file" accept="image/*" onChange={pickFile} className="field mt-2" />
            </label>
          )}
          {form.image && (
            <div className="flex items-center gap-3 border hairline p-3">
              <img src={form.image} alt="Pratinjau karya" className="h-16 w-16 object-cover" />
              <p className="text-[13px] text-ink/55">{fileName || "Gambar karya saat ini"}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" className="btn btn-ink btn-sm">
              {editingId ? "Simpan perubahan" : "Unggah karya"}
            </button>
          </div>
        </form>
      </Modal>

      {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
      {notice && <p className="label text-wine">{notice}</p>}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={() => confirming && deleteArtwork(confirming.id)}
        title="Hapus karya"
        subtitle="Member"
        message={
          confirming
            ? `Hapus "${confirming.title}"? Komentar, suka, favorit, laporan, dan submisi terkait ikut dihapus.`
            : ""
        }
        danger
        confirmLabel="Ya, hapus"
      />

      <div className="border hairline bg-white">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Karya</th>
                <th>Kategori</th>
                <th>Suka</th>
                <th>Tanggal</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {artworks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink/55">Belum ada karya. Unggah karya pertama Anda.</td>
                </tr>
              ) : (
                artworks.map((artwork) => (
                  <tr key={artwork.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={artwork.image} alt="" className="h-12 w-12 object-cover" />
                        <div>
                          <p className="font-semibold">{artwork.title}</p>
                          <p className="label mt-1 text-ink/50">{(artwork.tags ?? []).map((tag) => `#${tag}`).join(" ")}</p>
                          <Link href={`/artwork/${artwork.id}`} className="label mt-1 inline-block text-ink/55 hover:text-wine">
                            Lihat di galeri
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink/65">{categoryNames[artwork.categoryId] ?? "Tanpa kategori"}</td>
                    <td className="text-ink/65">{artwork.likes}</td>
                    <td className="text-ink/65">{artwork.createdAt?.slice(0, 10) ?? "—"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(artwork)} className="btn btn-outline btn-sm">Edit</button>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setNotice("");
                            setConfirmingId(artwork.id);
                          }}
                          className="btn btn-outline btn-sm !border-wine/40 !text-wine"
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
