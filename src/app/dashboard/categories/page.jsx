"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ErrorBanner from "@/components/ui/error-banner";
import Modal from "@/components/ui/modal";
import ModalActions from "@/components/ui/modal-actions";
import { notify } from "@/components/ui/toast";
import useErrorNotify from "@/hooks/use-error-notify";
import { entriesToFormData } from "@/lib/form-data";
import { createCategory, deleteCategory, listCategoryAdminData, updateCategory } from "./actions";

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function refresh() {
    const result = await listCategoryAdminData();
    if (result.ok) {
      setCategories(result.categories);
      setCounts(result.counts);
    } else {
      setError(result.error);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, []);

  useErrorNotify(error);

  async function addCategory(event) {
    event.preventDefault();
    setError("");
    const result = await createCategory(entriesToFormData({ name }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    notify("Kategori berhasil ditambahkan.", "success");
    await refresh();
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setError("");
    setShowEdit(true);
  }

  async function saveEdit() {
    setError("");
    const result = await updateCategory(entriesToFormData({ id: editingId, name: editName }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setShowEdit(false);
    notify("Kategori berhasil diperbarui.", "success");
    await refresh();
  }

  async function removeCategory() {
    setError("");
    const id = deletingId;
    setDeletingId(null);
    const result = await deleteCategory(entriesToFormData({ id }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Kategori berhasil dihapus.", "success");
    await refresh();
  }

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel admin</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Kategori</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Kelola kategori karya yang tersedia di platform. Kategori yang masih dipakai karya tidak dapat dihapus.
        </p>
      </header>

      <form onSubmit={addCategory} className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kategori baru"
          className="field sm:max-w-xs"
        />
        <button type="submit" className="btn btn-ink btn-lg">
          Tambah kategori
        </button>
      </form>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="border hairline bg-white">
        <div className="flex items-center justify-between border-b hairline px-5 py-4">
          <p className="label text-ink/65">Kategori karya</p>
          <span className="text-[13px] text-ink/65">{categories.length} kategori</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Slug</th>
                <th>Digunakan</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const used = counts[category.id] ?? 0;
                  return (
                    <tr key={category.id}>
                      <td className="font-medium">{category.name}</td>
                      <td className="font-label text-[12px] text-ink/55">{category.slug}</td>
                      <td className="text-ink/70">{used} karya</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            aria-label={`Edit ${category.name}`}
                            className="btn btn-outline btn-sm"
                          >
                            <i className="fa-solid fa-pen text-[11px]" />
                          </button>
                          {used > 0 ? (
                            <span className="label px-2 py-1.5 text-ink/40">
                              Dipakai
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(category.id)}
                              aria-label={`Hapus ${category.name}`}
                              className="btn btn-outline btn-sm text-wine hover:border-wine"
                            >
                              <i className="fa-solid fa-trash text-[11px]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t hairline px-5 py-3 text-[12px] text-ink/55">
          Nama kategori harus unik. Kategori yang sedang dipakai karya tidak dapat dihapus.
        </div>
      </div>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit kategori"
        subtitle="Panel admin"
        maxWidth="max-w-md"
      >
        <label htmlFor="category-edit-name" className="label">Nama kategori</label>
        <input
          id="category-edit-name"
          type="text"
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          className="field mt-2"
        />
        <ModalActions>
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            className="btn btn-outline btn-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={saveEdit}
            className="btn btn-ink btn-sm"
          >
            Simpan
          </button>
        </ModalActions>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={removeCategory}
        title="Hapus kategori"
        subtitle="Panel admin"
        message="Kategori akan dihapus permanen. Kategori yang masih dipakai karya tidak dapat dihapus."
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
