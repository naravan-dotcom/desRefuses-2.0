"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

export default function DashboardFavoritesPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addSelections, setAddSelections] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDb());
      setSessionIdState(getSessionId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const user = useMemo(
    () => (sessionId ? db.users.find((item) => item.id === sessionId) ?? null : null),
    [db, sessionId],
  );

  const favorites = useMemo(() => {
    if (!user) return [];
    return (user.favorites ?? [])
      .map((id) => db.artworks.find((item) => item.id === id))
      .filter(Boolean);
  }, [db, user]);

  const collections = user?.collections ?? [];

  function toggleCollectionSelection(artworkId) {
    setSelectedCollectionIds((current) => {
      const next = new Set(current);
      if (next.has(artworkId)) next.delete(artworkId);
      else next.add(artworkId);
      return next;
    });
  }

  function createCollection(event) {
    event.preventDefault();
    const name = newCollectionName.trim();
    if (!user) return;
    if (!name) {
      setError("Nama koleksi wajib diisi.");
      return;
    }
    const artworkIds = favorites
      .filter((item) => selectedCollectionIds.has(item.id))
      .map((item) => item.id);
    const next = loadDb();
    const target = next.users.find((item) => item.id === user.id);
    if (!target) return;
    const isDuplicate = (target.collections ?? []).some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicate) {
      setError("Nama koleksi sudah ada.");
      return;
    }
    target.collections = target.collections ?? [];
    target.collections.push({ id: uid("col"), name, artworkIds });
    saveDb(next);
    setDb(next);
    setNewCollectionName("");
    setSelectedCollectionIds(new Set());
    setNotice("Koleksi berhasil dibuat.");
  }

  function deleteCollection(id) {
    const next = loadDb();
    const target = next.users.find((item) => item.id === user?.id);
    if (!target) return;
    target.collections = (target.collections ?? []).filter(
      (item) => item.id !== id,
    );
    saveDb(next);
    setDb(next);
    setNotice("Koleksi dihapus.");
  }

  function removeFromCollection(collectionId, artworkId) {
    const next = loadDb();
    const target = next.users.find((item) => item.id === user?.id);
    if (!target) return;
    const collection = (target.collections ?? []).find(
      (item) => item.id === collectionId,
    );
    if (!collection) return;
    collection.artworkIds = (collection.artworkIds ?? []).filter(
      (item) => item !== artworkId,
    );
    saveDb(next);
    setDb(next);
    setNotice("Karya dikeluarkan dari koleksi.");
  }

  function addToCollection(collectionId, artworkId) {
    const next = loadDb();
    const target = next.users.find((item) => item.id === user?.id);
    if (!target) return;
    const collection = (target.collections ?? []).find(
      (item) => item.id === collectionId,
    );
    if (!collection) return;
    if ((collection.artworkIds ?? []).includes(artworkId)) return;
    collection.artworkIds = [...(collection.artworkIds ?? []), artworkId];
    saveDb(next);
    setDb(next);
    setNotice("Karya ditambahkan ke koleksi.");
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favorit</h1>
          <p className="text-sm leading-relaxed text-ink/55">
            Karya yang Anda simpan dari galeri.
          </p>
        </div>
      </header>

      {!user ? (
        <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/55">
          Masuk untuk melihat karya favorit Anda.{" "}
          <Link href="/login" className="underline">
            Masuk
          </Link>
        </div>
      ) : favorites.length === 0 ? (
        <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
          Belum ada karya favorit.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {favorites.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artwork/${artwork.id}`}
              className="border border-ink/15 bg-white"
            >
              <img
                src={artwork.image}
                alt={artwork.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-medium">{artwork.title}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {db.users.find((item) => item.id === artwork.userId)?.name ?? "Kreator"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-4 border border-ink/15 bg-white p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Member
          </p>
          <h2 className="text-xl font-semibold">Koleksi</h2>
          <p className="text-sm text-ink/55">
            Kelompokkan favorit Anda ke dalam koleksi bernama.
          </p>
        </div>

        <form onSubmit={createCollection} className="space-y-3">
          <label className="block text-xs text-ink/60">
            Nama koleksi
            <input
              type="text"
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="Mis. Inspirasi Desain Karakter"
              className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          {favorites.length > 0 && (
            <div className="space-y-2">
              {favorites.map((artwork) => (
                <label
                  key={artwork.id}
                  className="flex items-center gap-2 text-xs text-ink/70"
                >
                  <input
                    type="checkbox"
                    checked={selectedCollectionIds.has(artwork.id)}
                    onChange={() => toggleCollectionSelection(artwork.id)}
                  />
                  {artwork.title}
                </label>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="bg-ink px-3 py-2 text-xs font-medium text-paper transition-colors hover:bg-brand"
          >
            Buat koleksi
          </button>
        </form>

        {collections.length === 0 ? (
          <p className="border border-dashed border-ink/20 p-6 text-center text-sm text-ink/45">
            Belum ada koleksi.
          </p>
        ) : (
          collections.map((collection) => (
            <div key={collection.id} className="space-y-3 border-t border-ink/10 pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{collection.name}</p>
                <button
                  type="button"
                  onClick={() => deleteCollection(collection.id)}
                  className="border border-red-600/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-red-700 transition-colors hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
              {collection.artworkIds.length > 0 && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {collection.artworkIds.map((artworkId) => {
                    const artwork = db.artworks.find((item) => item.id === artworkId);
                    if (!artwork) return null;
                    return (
                      <div key={artworkId} className="relative border border-ink/15 bg-white">
                        <Link href={`/artwork/${artwork.id}`} className="block">
                          <img
                            src={artwork.image}
                            alt={artwork.title}
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <div className="p-3">
                            <p className="text-sm font-medium">{artwork.title}</p>
                            <p className="mt-1 text-xs text-ink/50">
                              {db.users.find((item) => item.id === artwork.userId)?.name ?? "Kreator"}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCollection(collection.id, artworkId)}
                          className="absolute right-2 top-2 border border-ink/20 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60 hover:text-ink"
                        >
                          Keluar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {favorites.some((item) => !collection.artworkIds.includes(item.id)) && (
                <div className="flex items-center gap-2">
                  <select
                    value={addSelections[collection.id] ?? ""}
                    onChange={(event) =>
                      setAddSelections((current) => ({
                        ...current,
                        [collection.id]: event.target.value,
                      }))
                    }
                    className="flex-1 border border-ink/20 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Tambah karya dari favorit...</option>
                    {favorites
                      .filter((item) => !collection.artworkIds.includes(item.id))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const artworkId = addSelections[collection.id];
                      if (artworkId) addToCollection(collection.id, artworkId);
                    }}
                    className="bg-ink px-3 py-2 text-xs font-medium text-paper"
                  >
                    Tambah
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
