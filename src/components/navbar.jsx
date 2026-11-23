"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, useSession } from "@/lib/use-session";

const baseLinks = [
  { label: "Beranda", href: "/home" },
  { label: "Galeri", href: "/gallery" },
  { label: "Tantangan", href: "/challenges" },
];

function dashboardLinkFor(user) {
  if (!user) return null;
  if (user.role === "curator" && user.status !== "approved") {
    return { label: "Status akun", href: "/pending" };
  }
  return {
    label: "Dashboard",
    href: user.role === "curator" ? "/dashboard/challenges" : "/dashboard",
  };
}

export default function Navbar() {
  const router = useRouter();
  const { user } = useSession();

  const dashboardLink = dashboardLinkFor(user);
  const links = dashboardLink ? [...baseLinks, dashboardLink] : baseLinks;

  function handleLogout() {
    logout();
    router.push("/home");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6 sm:px-10">
        <Link href="/home" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="font-semibold tracking-tight">desRefusés</span>
          <span className="border border-ink/20 px-1.5 py-0.5 text-[10px] text-ink/60">
            2.0
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink/60 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-xs text-ink/60 sm:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="border border-ink/20 px-3 py-2 text-xs hover:border-ink"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden border border-ink/20 px-3 py-2 text-xs hover:border-ink sm:inline-flex"
              >
                Masuk
              </Link>
              <Link href="/register" className="bg-ink px-3 py-2 text-xs text-paper">
                Daftar
              </Link>
            </>
          )}

          <details className="relative md:hidden">
            <summary className="summary-clean cursor-pointer list-none border border-ink/20 px-3 py-2 text-xs">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-48 border border-ink/15 bg-paper p-2 shadow-lg">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-xs text-ink/65 hover:bg-ink/5 hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
