"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

export default function DashboardCategoriesPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (error) notify(error, "error");
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const counts = useMemo(() => {
    return db.artworks.reduce((acc, artwork) => {
      acc[artwork.categoryId] = (acc[artwork.categoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [db]);

  function addCategory(event) {
    event.preventDefault();
    setError("");
    const clean = name.trim();
    if (!clean) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    const next = loadDb();
    if (
      next.categories.some(
        (item) => item.name.toLowerCase() === clean.toLowerCase(),
      )
    ) {
      setError("Nama kategori sudah dipakai.");
      return;
    }
    next.categories.push({ id: uid("cat"), name: clean, slug: slugify(clean) });
    saveDb(next);
    setDb(next);
    setName("");
    notify("Kategori berhasil ditambahkan.", "success");
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setError("");
    setShowEdit(true);
  }

  function saveEdit(id) {
    setError("");
    const clean = editName.trim();
    if (!clean) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    const next = loadDb();
    if (
      next.categories.some(
        (item) =>
          item.id !== id && item.name.toLowerCase() === clean.toLowerCase(),
      )
    ) {
      setError("Nama kategori sudah dipakai.");
      return;
    }
    const target = next.categories.find((item) => item.id === id);
    if (!target) return;
    target.name = clean;
    target.slug = slugify(clean);
    saveDb(next);
    setDb(next);
    setEditingId(null);
    setShowEdit(false);
    notify("Kategori berhasil diperbarui.", "success");
  }

  function deleteCategory(id) {
    setError("");
    setDeletingId(null);
    const next = loadDb();
    if (next.artworks.some((item) => item.categoryId === id)) {
      setError("Kategori masih dipakai karya dan tidak bisa dihapus.");
      return;
    }
    next.categories = next.categories.filter((item) => item.id !== id);
    saveDb(next);
    setDb(next);
    notify("Kategori berhasil dihapus.", "success");
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
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kategori baru"
          className="field sm:max-w-xs"
        />
        <button type="submit" className="btn btn-ink btn-lg">
          Tambah kategori
        </button>
      </form>

      {error && (
        <p className="border-l-2 border-wine bg-wine/5 px-4 py-3 text-[13px] text-wine">
          {error}
        </p>
      )}

      <div className="border hairline bg-white">
        <div className="flex items-center justify-between border-b hairline px-5 py-4">
          <p className="label text-ink/65">Kategori karya</p>
          <span className="text-[13px] text-ink/65">{db.categories.length} kategori</span>
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
              {db.categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                db.categories.map((category) => {
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
        <div className="mt-8 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            className="btn btn-outline btn-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => saveEdit(editingId)}
            className="btn btn-ink btn-sm"
          >
            Simpan
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deleteCategory(deletingId)}
        title="Hapus kategori"
        subtitle="Panel admin"
        message="Kategori akan dihapus permanen. Kategori yang masih dipakai karya tidak dapat dihapus."
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
