"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout, useSession } from "@/lib/use-session";

const baseLinks = [
  { label: "Beranda", href: "/home" },
  { label: "Jelajahi", href: "/gallery" },
  { label: "Tantangan", href: "/challenges" },
];

function roleLinks(user) {
  if (!user) return [];
  if (user.status === "suspended") {
    return [{ label: "Status Akun", href: "/suspended" }];
  }
  if (user.role === "member") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Karya Saya", href: "/dashboard/artworks" },
      { label: "Favorit", href: "/dashboard/favorites" },
    ];
  }
  if (user.role === "curator") {
    return [
      {
        label: user.status === "approved" ? "Dashboard" : "Status Akun",
        href: user.status === "approved" ? "/dashboard/challenges" : "/pending",
      },
    ];
  }
  return [{ label: "Panel Admin", href: "/dashboard" }];
}

function homeOfUser(user) {
  if (!user) return "/home";
  if (user.status === "suspended") return "/suspended";
  if (user.role === "curator") {
    return user.status === "approved" ? "/dashboard/challenges" : "/pending";
  }
  return "/dashboard";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const links = isAdmin ? [] : baseLinks;

  useEffect(() => {
    if (accountRef.current) accountRef.current.removeAttribute("open");
  }, [pathname]);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    router.push("/home");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-5 lg:px-10">
          <Link href="/home" className="group flex shrink-0 items-center gap-2.5 sm:gap-3">
            <img
              src="/desrefuses-mark.png"
              alt=""
              className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105 sm:h-11"
            />
            <span className="flex flex-col">
              <span className="font-display text-[20px] leading-none sm:text-[23px]">desRefusés</span>
              <span className="label mt-1.5 hidden text-ink/65 sm:block">Salon 1863</span>
            </span>
          </Link>

          <nav className="desktop-nav hidden items-center gap-9 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || (link.href === "/home" && pathname === "/home");
              return (
                <Link key={link.href} href={link.href} className={`nav-link ${active ? "active" : ""}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link href="/login" className="nav-link hidden sm:inline">
                  Masuk
                </Link>
                <Link href="/register" className="btn btn-ink btn-sm">
                  Daftar
                </Link>
              </>
            ) : (
              <>
                {user.role === "member" && (
                  <Link href="/dashboard/artworks" className="btn btn-pink btn-sm">
                    <i className="fa-solid fa-plus" />
                    <span className="hidden sm:inline">Unggah</span>
                  </Link>
                )}
                {user.role !== "member" && (
                  <Link href={homeOfUser(user)} className="btn btn-ink btn-sm hidden sm:inline-flex">
                    {user.role === "curator" && user.status !== "approved" ? "Status" : "Dashboard"}
                  </Link>
                )}
                <details ref={accountRef} className="menu relative">
                  <summary className="flex cursor-pointer items-center gap-2 py-1 pl-1 pr-1 list-none">
                    <img
                      src={user.avatar || "/desrefuses-mark.png"}
                      alt={user.name}
                      className="avatar h-8 w-8"
                    />
                    <span className="font-label hidden max-w-[100px] truncate text-[12px] uppercase tracking-normal lg:block">
                      {user.name}
                    </span>
                    <i className="fa-solid fa-chevron-down text-[12px] text-ink/65" />
                  </summary>
                  <div className="menu-panel absolute right-0 z-50 mt-3 w-60 border hairline bg-white p-0 shadow-[0_30px_60px_-35px_rgba(22,20,17,.45)]">
                    <div className="border-b hairline px-4 py-3">
                      <div className="truncate text-[14px] font-semibold">{user.name}</div>
                      <div className="label mt-1.5 text-muted">
                        {user.role === "member" ? "Member" : user.role === "curator" ? "Kurator" : "Admin"}
                        {user.role === "curator"
                          ? ` · ${user.status === "approved" ? "Approved" : user.status === "pending" ? "Pending" : user.status === "suspended" ? "Ditangguhkan" : "Rejected"}`
                          : ""}
                      </div>
                    </div>
                    {roleLinks(user).map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2.5 font-label text-[13px] uppercase tracking-normal hover:bg-ink/[0.04]"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href={`/creator/${user.dbId ?? String(user.id).replace(/^u/, "")}`}
                      className="block px-4 py-2.5 font-label text-[13px] uppercase tracking-normal hover:bg-ink/[0.04]"
                    >
                      Profil Publik
                    </Link>
                    <div className="border-t hairline">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left font-label text-[13px] uppercase tracking-normal text-wine hover:bg-ink/[0.04]"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </details>
              </>
            )}

            <button
              type="button"
              className="flex h-9 w-9 flex-col items-end justify-center gap-1.5 md:hidden"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
            >
              <span className="h-px w-7 bg-ink" />
              <span className="h-px w-4 bg-ink" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[80] flex flex-col bg-ink px-6 py-6 text-paper transition-all duration-300 ${mobileOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/desrefuses-mark.png" alt="" className="h-11 w-auto invert" />
            <span className="font-display text-[26px]">desRefusés</span>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-paper/60 hover:text-paper"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
        <nav className="mt-12 flex flex-1 flex-col gap-4 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`font-display text-[27px] ${pathname === link.href ? "text-acid" : "text-paper"}`}
            >
              {link.label}
            </Link>
          ))}
          {roleLinks(user).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`font-display text-[27px] ${pathname === link.href ? "text-acid" : "text-paper"}`}
            >
              {link.label}
            </Link>
          ))}
          {user && !isAdmin && (
            <Link
              href={`/creator/${user.dbId ?? String(user.id).replace(/^u/, "")}`}
              onClick={() => setMobileOpen(false)}
              className="font-display text-[27px] text-paper"
            >
              Profil Publik
            </Link>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-paper/15 pt-8">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm w-full !border-paper/30 !text-paper hover:!bg-paper hover:!text-ink"
            >
              Keluar
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline btn-sm w-full !border-paper/30 !text-paper hover:!bg-paper hover:!text-ink">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="btn btn-acid btn-sm w-full">
                Daftar
              </Link>
            </>
          )}
          <div className="label mt-2 text-center text-paper/70">Salon des Refusés · MDCCCLXIII</div>
        </div>
      </div>
    </>
  );
}
