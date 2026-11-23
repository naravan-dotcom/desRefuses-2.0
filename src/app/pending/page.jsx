"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadDb, saveDb } from "@/lib/local-data";
import { logout, useSession } from "@/lib/use-session";

export default function PendingCuratorPage() {
  const router = useRouter();
  const { user, ready } = useSession();
  const [confirming, setConfirming] = useState(false);

  const isPendingCurator = Boolean(
    user && user.role === "curator" && user.status !== "approved",
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "curator" || user.status === "approved") {
      if (user.role === "admin") router.replace("/dashboard");
      else if (user.role === "curator") router.replace("/dashboard/challenges");
      else router.replace("/home");
    }
  }, [ready, user, router]);

  function handleDelete() {
    const db = loadDb();
    db.users = db.users.filter((item) => item.id !== user.id);
    saveDb(db);
    logout();
    router.push("/home");
  }

  if (!isPendingCurator) {
    return (
      <main className="px-6 py-16 sm:px-10">
        <p className="mx-auto max-w-md text-sm text-ink/45">Memeriksa sesi...</p>
      </main>
    );
  }

  const rejected = user.status === "rejected";

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-md space-y-4">
        <div className="border border-ink/15 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Status kurator
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {rejected ? "Pengajuan Anda ditolak." : "Akun Anda sedang ditinjau."}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-ink/55">
            {rejected
              ? "Admin menolak pendaftaran kurator ini. Anda dapat menghapus akun yang telah didaftarkan, lalu mendaftar ulang dengan informasi yang lebih baik."
              : "Admin akan meninjau pendaftaran kurator Anda. Selama menunggu, Anda tetap bisa menjelajahi karya seperti tamu, tetapi dashboard belum bisa diakses."}
          </p>

          <div className="mt-6 space-y-1 border border-ink/15 bg-paper p-4 text-xs text-ink/60">
            <p>
              <span className="text-ink/40">Nama:</span> {user.name}
            </p>
            <p>
              <span className="text-ink/40">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-ink/40">Status:</span>{" "}
              <span
                className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                  rejected
                    ? "border-red-600/40 text-red-700"
                    : "border-ink/25 text-ink/70"
                }`}
              >
                {rejected ? "Rejected" : "Pending"}
              </span>
            </p>
          </div>

          {rejected ? (
            <div className="mt-6 space-y-3">
              {confirming ? (
                <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <p>Hapus akun ini secara permanen?</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800"
                    >
                      Ya, hapus akun
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="w-full border border-red-600/50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Delete Account
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/gallery"
              className="mt-6 block w-full bg-ink px-4 py-3 text-center text-sm font-medium text-paper transition-colors hover:bg-brand"
            >
              Jelajahi galeri
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-ink/50">
          Bukan akun Anda?{" "}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-ink underline underline-offset-4 hover:text-brand"
          >
            Keluar
          </button>
        </p>
      </div>
    </main>
  );
}
