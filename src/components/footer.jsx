"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, useSession } from "@/lib/use-session";

export default function Footer() {
  const router = useRouter();
  const { user } = useSession();

  function handleLogout() {
    logout();
    router.push("/home");
  }

  function handleReset() {
    window.localStorage.removeItem("desrefuses_db_v1");
    logout();
    router.push("/home");
    router.refresh();
  }

  return (
    <footer className="overflow-hidden bg-ink text-paper">
      <div className="mx-auto max-w-[1240px] px-5 pb-0 pt-12 lg:px-10">
        <div className="grid gap-10 border-b border-paper/15 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <img src="/desrefuses-mark.png" alt="" className="h-9 w-auto invert" />
              <span className="font-display text-[22px]">desRefusés</span>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-paper/60">
              Galeri digital tanpa dewan juri. Karya Anda, hak Anda untuk dilihat.
            </p>
          </div>
          <div>
            <div className="label mb-4 text-paper/50">Jelajahi</div>
            <div className="flex flex-col gap-3 font-label text-[13px] uppercase tracking-normal text-paper/60">
              <Link href="/gallery" className="hover:text-acid">Jelajahi</Link>
              <Link href="/challenges" className="hover:text-acid">Tantangan</Link>
              <Link href="/home#manifesto" className="hover:text-acid">Manifesto</Link>
            </div>
          </div>
          <div>
            <div className="label mb-4 text-paper/50">Akun</div>
            <div className="flex flex-col gap-3 font-label text-[13px] uppercase tracking-normal text-paper/60">
              {user ? (
                <>
                  <Link href={user.role === "curator" && user.status !== "approved" ? "/pending" : "/dashboard"} className="hover:text-acid">
                    Dashboard
                  </Link>
                  <button type="button" onClick={handleLogout} className="text-left hover:text-acid">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-acid">Masuk</Link>
                  <Link href="/register" className="hover:text-acid">Daftar</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 py-5 font-label text-[12px] uppercase tracking-normal text-paper/50 sm:flex-row">
          <span>© 2026 desRefusés — Unjuried since 1863</span>
          <button type="button" onClick={handleReset} className="transition-colors hover:text-acid">
            Reset data demo
          </button>
        </div>
      </div>
    </footer>
  );
}
