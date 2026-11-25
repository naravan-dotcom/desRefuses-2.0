"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { notify } from "@/components/toast";
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
    if (error) notify(error, "error");
  }, [error]);

  useEffect(() => {
    if (notice) notify(notice, "success");
  }, [notice]);

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
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Favorit.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Karya yang Anda simpan dari galeri, dikumpulkan di satu tempat.
        </p>
      </header>

      {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
      {notice && <p className="label text-wine">{notice}</p>}

      {!user ? (
        <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
          Masuk untuk melihat karya favorit Anda.{" "}
          <Link href="/login" className="font-semibold text-wine underline">Masuk</Link>
        </div>
      ) : favorites.length === 0 ? (
        <div className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/55">
          Belum ada karya favorit. Simpan karya dari galeri untuk memulai koleksi.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {favorites.map((artwork) => (
            <Link key={artwork.id} href={`/artwork/${artwork.id}`} className="art-card group block">
              <div className="art-media">
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  loading="lazy"
                  className="art-img aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="mt-3">
                <p className="text-[14px] font-semibold group-hover:text-wine">{artwork.title}</p>
                <p className="label mt-1 text-ink/55">
                  {db.users.find((item) => item.id === artwork.userId)?.name ?? "Kreator"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-5 border hairline bg-white p-5 sm:p-6">
        <div>
          <div className="label text-wine">Member</div>
          <h2 className="font-display mt-3 text-[28px] leading-none">Koleksi.</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Kelompokkan favorit Anda ke dalam koleksi bernama.
          </p>
        </div>

        <form onSubmit={createCollection} className="space-y-4 border hairline p-4">
          <label className="block">
            <span className="label">Nama koleksi</span>
            <input
              type="text"
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="Mis. Inspirasi Desain Karakter"
              className="field mt-2"
            />
          </label>

          {favorites.length > 0 && (
            <div className="space-y-2">
              <p className="label text-ink/65">Pilih karya untuk koleksi ini</p>
              {favorites.map((artwork) => (
                <label
                  key={artwork.id}
                  className="flex items-center gap-2.5 text-[13px] text-ink/70"
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

          <button type="submit" className="btn btn-ink btn-sm">Buat koleksi</button>
        </form>

        {collections.length === 0 ? (
          <div className="border border-dashed border-ink/20 p-6 text-center text-[14px] text-ink/55">
            Belum ada koleksi.
          </div>
        ) : (
          <div className="space-y-5">
            {collections.map((collection) => (
              <div key={collection.id} className="space-y-4 border-t hairline pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold">{collection.name}</p>
                    <p className="label mt-1 text-ink/55">{collection.artworkIds.length} karya</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCollection(collection.id)}
                    className="btn btn-outline btn-sm !border-wine/40 !text-wine"
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
                        <div key={artworkId} className="relative border hairline bg-white">
                          <Link href={`/artwork/${artwork.id}`} className="block">
                            <div className="art-media">
                              <img
                                src={artwork.image}
                                alt={artwork.title}
                                loading="lazy"
                                className="art-img aspect-[4/3] w-full object-cover"
                              />
                            </div>
                            <div className="p-3">
                              <p className="text-[14px] font-semibold">{artwork.title}</p>
                              <p className="label mt-1 text-ink/55">
                                {db.users.find((item) => item.id === artwork.userId)?.name ?? "Kreator"}
                              </p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCollection(collection.id, artworkId)}
                            className="btn btn-outline btn-sm absolute right-2 top-2 bg-white"
                          >
                            Keluar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {favorites.some((item) => !collection.artworkIds.includes(item.id)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={addSelections[collection.id] ?? ""}
                      onChange={(event) =>
                        setAddSelections((current) => ({
                          ...current,
                          [collection.id]: event.target.value,
                        }))
                      }
                      className="field min-w-[200px] flex-1"
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
                      className="btn btn-ink btn-sm"
                    >
                      Tambah
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
