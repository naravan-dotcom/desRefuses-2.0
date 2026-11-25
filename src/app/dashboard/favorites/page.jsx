"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ArtworkCard from "@/components/artwork/artwork-card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Modal from "@/components/ui/modal";
import ModalActions from "@/components/ui/modal-actions";
import { notify } from "@/components/ui/toast";
import useErrorNotify from "@/hooks/use-error-notify";
import { useSession } from "@/lib/use-session";
import {
  addToCollection as addCollectionItem,
  createCollection,
  deleteCollection as deleteCollectionAction,
  listFavorites,
  removeFromCollection as removeCollectionItem,
} from "./actions";

function artCode(id) {
  const digits = String(id ?? "").replace(/\D/g, "");
  return digits ? `No. ${digits.padStart(2, "0")}` : `#${id}`;
}

function collectionHas(collection, artwork) {
  const id = String(artwork.id);
  return (collection?.artworkIds ?? []).some((value) => {
    const raw = String(value);
    return raw === id || raw === `a${id}` || raw.replace(/\D/g, "") === id;
  });
}

export default function DashboardFavoritesPage() {
  const { user } = useSession();
  const [favoriteArtworks, setFavoriteArtworks] = useState([]);
  const [creators, setCreators] = useState({});
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddTo, setShowAddTo] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [showRemove, setShowRemove] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(null);

  async function refreshFavorites() {
    const result = await listFavorites();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setFavoriteArtworks(result.artworks);
    setCollections(result.collections ?? []);
    setCreators(result.creators);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(refreshFavorites);
  }, []);

  useErrorNotify(error);

  async function addCollection(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const formData = new FormData();
    formData.set("name", name);
    const result = await createCollection(formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCollections((current) => [...current, result.collection]);
    setNewName("");
    setShowNew(false);
    notify("Koleksi berhasil dibuat.", "success");
  }

  async function addToCollection(collectionId) {
    const artwork = showAddTo;
    if (!artwork) return;
    const formData = new FormData();
    formData.set("collectionId", collectionId);
    formData.set("artworkId", artwork.id);
    const result = await addCollectionItem(formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCollections((current) =>
      current.map((collection) =>
        collection.id === String(collectionId)
          ? { ...collection, artworkIds: [...(collection.artworkIds ?? []), String(artwork.id)] }
          : collection,
      ),
    );
    setShowAddTo(null);
    notify("Karya ditambahkan ke koleksi.", "success");
  }

  async function removeFromCollection() {
    const artwork = showRemove;
    if (!artwork) return;
    const formData = new FormData();
    formData.set("collectionId", selectedCollection);
    formData.set("artworkId", artwork.id);
    const result = await removeCollectionItem(formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCollections((current) =>
      current.map((collection) =>
        collection.id === selectedCollection
          ? {
              ...collection,
              artworkIds: (collection.artworkIds ?? []).filter((id) => String(id) !== String(artwork.id)),
            }
          : collection,
      ),
    );
    setShowRemove(null);
    notify("Karya dikeluarkan dari koleksi.", "success");
  }

  async function deleteCollection() {
    const id = deletingCollection;
    if (!id) return;
    const formData = new FormData();
    formData.set("collectionId", id);
    const result = await deleteCollectionAction(formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCollections((current) => current.filter((collection) => collection.id !== id));
    if (selectedCollection === id) setSelectedCollection("all");
    setDeletingCollection(null);
    notify("Koleksi berhasil dihapus.", "success");
  }

  const activeCollection = collections.find((collection) => collection.id === selectedCollection);
  const visibleArtworks = useMemo(() => {
    if (!activeCollection) return favoriteArtworks;
    return favoriteArtworks.filter((artwork) => collectionHas(activeCollection, artwork));
  }, [favoriteArtworks, activeCollection]);

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel kreator</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Favorit Saya</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Karya yang Anda simpan dari galeri, dikumpulkan dalam satu ruang pribadi.
        </p>
      </header>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSelectedCollection("all")} className={`chip ${selectedCollection === "all" ? "active" : ""}`}>
            Semua · {favoriteArtworks.length}
          </button>
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setSelectedCollection(collection.id)}
              className={`chip ${selectedCollection === collection.id ? "active" : ""}`}
            >
              {collection.name}
            </button>
          ))}
          <button type="button" onClick={() => setShowNew(true)} className="chip">
            <i className="fa-solid fa-plus text-[11px]" /> Koleksi baru
          </button>
        </div>
        {activeCollection && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/favorites?collection=${activeCollection.id}`} className="btn btn-outline btn-sm">
              <i className="fa-solid fa-pen text-[11px]" /> Kelola
            </Link>
            <button
              type="button"
              onClick={() => setDeletingCollection(activeCollection.id)}
              className="btn btn-outline btn-sm text-wine hover:border-wine"
            >
              <i className="fa-solid fa-trash text-[11px]" /> Hapus koleksi
            </button>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between border-b hairline pb-3">
        <p className="label text-ink/65">
          {activeCollection ? activeCollection.name : "Semua favorit"} · {visibleArtworks.length} karya
        </p>
        {user?.role === "member" && (
          <Link href="/gallery" className="label inline-flex items-center gap-2 text-ink/65 hover:text-wine">
            Cari karya lain
            <i className="fa-solid fa-arrow-right text-[11px]" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="border border-dashed border-ink/20 p-10 text-center text-[14px] text-ink/55">
          Memuat favorit...
        </div>
      ) : visibleArtworks.length ? (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {visibleArtworks.map((artwork, index) => (
            <div key={artwork.id} className="flex flex-col">
              <ArtworkCard
                artwork={artwork}
                creator={creators[String(artwork.userId)] ?? "Kreator"}
                creatorId={String(artwork.userId).replace(/^u/, "")}
                commentCount={0}
                index={index}
              />
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2.5">
                <span className="label text-ink/50">{artCode(artwork.id)}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddTo(artwork)} className="btn btn-outline btn-sm">
                    <i className="fa-solid fa-folder-plus text-[11px]" /> Masukkan koleksi
                  </button>
                  {activeCollection && (
                    <button type="button" onClick={() => setShowRemove(artwork)} className="btn btn-outline btn-sm text-wine hover:border-wine">
                      <i className="fa-solid fa-xmark text-[11px]" /> Keluarkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-heart text-2xl text-ink/40" />
          <h2 className="font-display mt-4 text-[24px]">
            {activeCollection ? "Koleksi ini masih kosong" : "Belum ada karya favorit"}
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            {activeCollection
              ? "Tambahkan karya favorit ke koleksi ini dari daftar Semua."
              : "Tekan ikon hati pada karya di galeri untuk menyimpannya di sini."}
          </p>
          {user?.role === "member" && (
            <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Jelajahi galeri</Link>
          )}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Koleksi baru" subtitle="Panel kreator" maxWidth="max-w-md">
        <form onSubmit={addCollection}>
          <label htmlFor="new-collection-name" className="label">Nama koleksi</label>
          <input
            id="new-collection-name"
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Misal: Arsip hitam putih"
            className="field mt-2"
            required
          />
          <p className="mt-2 text-[12px] leading-relaxed text-ink/55">
            Koleksi tersimpan di akun Anda bersama favorit karya.
          </p>
          <ModalActions>
            <button type="button" onClick={() => setShowNew(false)} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" className="btn btn-ink btn-sm">Buat koleksi</button>
          </ModalActions>
        </form>
      </Modal>

      <Modal
        open={Boolean(showAddTo)}
        onClose={() => setShowAddTo(null)}
        title="Masukkan ke koleksi"
        subtitle="Panel kreator"
        maxWidth="max-w-md"
      >
        <p className="text-[14px] text-ink/70">
          Pilih koleksi untuk <span className="font-medium text-ink">{showAddTo?.title}</span>.
        </p>
        <div className="mt-5 space-y-2">
          {collections.length === 0 ? (
            <p className="border border-dashed border-ink/20 p-4 text-center text-[13px] text-ink/55">
              Belum ada koleksi. Buat koleksi terlebih dahulu.
            </p>
          ) : (
            collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => addToCollection(collection.id)}
                className={`flex w-full items-center justify-between border hairline px-4 py-3 text-left transition-colors hover:bg-canvas ${
                  collectionHas(collection, showAddTo ?? { id: "" }) ? "opacity-55" : ""
                }`}
              >
                <span className="font-medium">{collection.name}</span>
                <span className="label text-ink/55">
                  {collectionHas(collection, showAddTo ?? { id: "" }) ? "Sudah" : `${collection.artworkIds?.length ?? 0} karya`}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(showRemove)}
        onClose={() => setShowRemove(null)}
        onConfirm={removeFromCollection}
        title="Keluarkan dari koleksi"
        subtitle="Panel kreator"
        message="Karya akan dikeluarkan dari koleksi ini, tetapi tetap tersimpan sebagai favorit."
        confirmLabel="Ya, keluarkan"
        danger
      />

      <ConfirmDialog
        open={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        onConfirm={deleteCollection}
        title="Hapus koleksi"
        subtitle="Panel kreator"
        message="Koleksi akan dihapus dari akun. Favorit karya tidak terhapus."
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
