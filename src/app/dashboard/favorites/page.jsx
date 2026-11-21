"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSessionId, loadDb, setSessionId } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

export default function DashboardFavoritesPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [sessionId, setSessionIdState] = useState(null);

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

  function logout() {
    setSessionId(null);
    setSessionIdState(null);
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Favorit</h1>
            <p className="text-sm leading-relaxed text-ink/55">
              Karya yang Anda simpan dari galeri.
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={logout}
              className="border border-ink/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink/60"
            >
              Keluar
            </button>
          )}
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
    </>
  );
}
