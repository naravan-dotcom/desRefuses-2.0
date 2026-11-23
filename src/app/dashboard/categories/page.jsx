"use client";

import { useEffect, useMemo, useState } from "react";
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
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setError("");
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
  }

  function deleteCategory(id) {
    setError("");
    const next = loadDb();
    if (next.artworks.some((item) => item.categoryId === id)) {
      setError("Kategori masih dipakai karya dan tidak bisa dihapus.");
      return;
    }
    next.categories = next.categories.filter((item) => item.id !== id);
    saveDb(next);
    setDb(next);
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Kategori</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola kategori karya yang tersedia di platform. Kategori yang masih
          dipakai karya tidak dapat dihapus.
        </p>
      </header>

      <form onSubmit={addCategory} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kategori baru"
          className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink sm:max-w-xs"
        />
        <button
          type="submit"
          className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
        >
          Tambah kategori
        </button>
        <p className="text-xs text-ink/50">{db.categories.length} kategori</p>
      </form>

      {error && (
        <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Nama kategori</th>
                <th className="px-4 py-3 font-medium">Jumlah karya</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {db.categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink/45">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                db.categories.map((category) => {
                  const used = counts[category.id] ?? 0;
                  const editing = editingId === category.id;
                  return (
                    <tr key={category.id} className="border-b border-ink/10 last:border-b-0">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="w-full border border-ink/20 bg-paper px-3 py-2 text-sm outline-none focus:border-ink sm:max-w-xs"
                          />
                        ) : (
                          <p className="font-medium">{category.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/60">{used}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(category.id)}
                                className="bg-ink px-3 py-1.5 text-xs text-paper transition-colors hover:bg-brand"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(category)}
                                className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                              >
                                Edit
                              </button>
                              {used > 0 ? (
                                <span className="px-3 py-1.5 text-xs text-ink/35">
                                  Tidak bisa dihapus
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => deleteCategory(category.id)}
                                  className="border border-red-600/50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
                            </>
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
      </div>
    </>
  );
}
