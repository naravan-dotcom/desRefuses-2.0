"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ErrorBanner from "@/components/ui/error-banner";
import Modal from "@/components/ui/modal";
import ModalActions from "@/components/ui/modal-actions";
import StatusBadge from "@/components/ui/status-badge";
import { notify } from "@/components/ui/toast";
import useErrorNotify from "@/hooks/use-error-notify";
import { formDataWithFile } from "@/lib/form-data";
import { IMAGE_ACCEPT } from "@/lib/upload";
import { createArtwork, deleteArtwork, listArtworkPageData, updateArtwork } from "./actions";

function artCode(id) {
  const digits = String(id ?? "").replace(/\D/g, "");
  return digits ? `No. ${digits.padStart(2, "0")}` : `#${id}`;
}

function dateId(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardArtworksPage() {
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function refresh() {
    const result = await listArtworkPageData();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setArtworks(result.artworks);
    setCategories(result.categories);
    setCategoryId((current) => current || result.categories[0]?.id || "");
  }

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, []);

  useErrorNotify(error);

  async function addArtwork(event) {
    event.preventDefault();
    setError("");
    const result = await createArtwork(
      formDataWithFile({ title, description, categoryId, tags }, image),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setDescription("");
    setTags("");
    setImage(null);
    event.target.reset();
    notify("Karya berhasil ditambahkan.", "success");
    await refresh();
  }

  function startEdit(artwork) {
    setEditing({
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      categoryId: artwork.categoryId,
      tags: Array.isArray(artwork.tags) ? artwork.tags.join(", ") : "",
      image: artwork.image,
      imageFile: null,
    });
    setError("");
    setShowEdit(true);
  }

  async function saveEdit() {
    if (!editing) return;
    setError("");
    const result = await updateArtwork(
      formDataWithFile(
        {
          id: editing.id,
          title: editing.title,
          description: editing.description,
          categoryId: editing.categoryId,
          tags: editing.tags,
          existingImage: editing.image,
        },
        editing.imageFile,
      ),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(null);
    setShowEdit(false);
    notify("Karya berhasil diperbarui.", "success");
    await refresh();
  }

  async function removeArtwork() {
    setError("");
    const id = deletingId;
    setDeletingId(null);
    const result = await deleteArtwork(formDataWithFile({ id }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Karya berhasil dihapus.", "success");
    await refresh();
  }

  const categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel kreator</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Karya Saya</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Unggah karya baru, perbarui detail, atau hapus karya yang tidak ingin ditampilkan.
        </p>
      </header>

      <form onSubmit={addArtwork} className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div>
            <label htmlFor="artwork-image" className="label">Gambar karya</label>
            <label
              htmlFor="artwork-image"
              className="art-media mt-2 flex aspect-[10/7] cursor-pointer flex-col items-center justify-center border border-dashed border-ink/25 text-center transition-colors hover:border-ink/60"
            >
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Pratinjau karya"
                  className="art-img absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <i className="fa-regular fa-image text-2xl text-ink/40" />
                  <span className="label mt-3 text-ink/65">Klik untuk pilih gambar</span>
                  <span className="mt-1 text-[12px] text-ink/50">JPG, PNG, WEBP, GIF · maksimal 1 MB</span>
                </>
              )}
              <input
                id="artwork-image"
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-ink btn-lg">Unggah karya</button>
            <span className="label text-ink/55">Tampil langsung di galeri</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <div>
            <label htmlFor="artwork-title" className="label">Judul karya</label>
            <input
              id="artwork-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul yang ingin ditampilkan"
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label htmlFor="artwork-category" className="label">Kategori</label>
            <select
              id="artwork-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="field mt-2"
              required
            >
              {categories.length === 0 && <option value="">Belum ada kategori</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="artwork-tags" className="label">Tag</label>
            <input
              id="artwork-tags"
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Pisahkan dengan koma, misal: lukisan, monokrom"
              className="field mt-2"
            />
          </div>
          <div>
            <label htmlFor="artwork-description" className="label">Deskripsi</label>
            <textarea
              id="artwork-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ceritakan ide, teknik, atau makna karya..."
              className="field mt-2 min-h-[110px] resize-y"
              required
            />
          </div>
        </div>
      </form>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="border hairline bg-white">
        <div className="flex items-center justify-between border-b hairline px-5 py-4">
          <p className="label text-ink/65">Daftar karya</p>
          <span className="text-[13px] text-ink/65">{artworks.length} karya</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Karya</th>
                <th>Kategori</th>
                <th>Apresiasi</th>
                <th>Tanggal</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {artworks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Belum ada karya. Unggah karya pertama Anda di atas.
                  </td>
                </tr>
              ) : (
                artworks.map((artwork) => (
                  <tr key={artwork.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={artwork.image} alt="" className="h-11 w-14 shrink-0 object-cover" />
                        <div className="min-w-0">
                          <div className="font-medium">{artwork.title}</div>
                          <div className="label mt-0.5 text-ink/45">{artCode(artwork.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink/70">{categoryNames[artwork.categoryId] ?? "—"}</td>
                    <td className="text-ink/70">{artwork.likes ?? 0} suka</td>
                    <td className="text-ink/70">{dateId(artwork.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(artwork)}
                          aria-label={`Edit ${artwork.title}`}
                          className="btn btn-outline btn-sm"
                        >
                          <i className="fa-solid fa-pen text-[11px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(artwork.id)}
                          aria-label={`Hapus ${artwork.title}`}
                          className="btn btn-outline btn-sm text-wine hover:border-wine"
                        >
                          <i className="fa-solid fa-trash text-[11px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t hairline px-5 py-3 text-[12px] text-ink/55">
          Karya langsung tampil di galeri publik setelah diunggah.
        </div>
      </div>

      <Modal
        open={showEdit && Boolean(editing)}
        onClose={() => {
          setShowEdit(false);
          setEditing(null);
        }}
        title="Edit karya"
        subtitle="Panel kreator"
        maxWidth="max-w-2xl"
      >
        {editing && (
          <div className="grid gap-5 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label htmlFor="edit-artwork-image" className="label">Ganti gambar</label>
              <label
                htmlFor="edit-artwork-image"
                className="art-media mt-2 flex aspect-[10/7] cursor-pointer items-center justify-center border border-dashed border-ink/25 transition-colors hover:border-ink/60"
              >
                <img src={editing.image} alt="" className="art-img absolute inset-0 h-full w-full object-cover" />
                <StatusBadge className="status-approved relative">Klik untuk ganti</StatusBadge>
                <input
                  id="edit-artwork-image"
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={(event) => setEditing({ ...editing, imageFile: event.target.files?.[0] ?? null })}
                  className="sr-only"
                />
              </label>
              <p className="mt-2 text-[12px] text-ink/50">
                {editing.imageFile?.name ?? "Biarkan kosong untuk mempertahankan gambar saat ini."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:col-span-7">
              <div>
                <label htmlFor="edit-artwork-title" className="label">Judul karya</label>
                <input
                  id="edit-artwork-title"
                  type="text"
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                  className="field mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="edit-artwork-category" className="label">Kategori</label>
                <select
                  id="edit-artwork-category"
                  value={editing.categoryId}
                  onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}
                  className="field mt-1.5"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-artwork-tags" className="label">Tag</label>
                <input
                  id="edit-artwork-tags"
                  type="text"
                  value={editing.tags}
                  onChange={(event) => setEditing({ ...editing, tags: event.target.value })}
                  className="field mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="edit-artwork-description" className="label">Deskripsi</label>
                <textarea
                  id="edit-artwork-description"
                  value={editing.description}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                  className="field mt-1.5 min-h-[84px] resize-y"
                />
              </div>
            </div>
          </div>
        )}
        <ModalActions>
          <button
            type="button"
            onClick={() => {
              setShowEdit(false);
              setEditing(null);
            }}
            className="btn btn-outline btn-sm"
          >
            Batal
          </button>
          <button type="button" onClick={saveEdit} className="btn btn-ink btn-sm">
            Simpan perubahan
          </button>
        </ModalActions>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={removeArtwork}
        title="Hapus karya"
        subtitle="Panel kreator"
        message="Karya akan dihapus permanen beserta suka, favorit, komentar, dan laporan terkait."
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
