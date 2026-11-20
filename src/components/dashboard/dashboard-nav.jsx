"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Umum",
    items: [{ label: "Ringkasan", href: "/dashboard" }],
  },
  {
    label: "Member",
    items: [
      { label: "Karya saya", href: "/dashboard/artworks" },
      { label: "Favorit", href: "/dashboard/favorites" },
      { label: "Submisi", href: "/dashboard/submissions" },
      { label: "Profil", href: "/dashboard/profile" },
      { label: "Akun", href: "/dashboard/account" },
    ],
  },
  {
    label: "Kurator",
    items: [{ label: "Tantangan saya", href: "/dashboard/challenges" }],
  },
  {
    label: "Admin",
    items: [
      { label: "Pengguna", href: "/dashboard/users" },
      { label: "Verifikasi kurator", href: "/dashboard/curators" },
      { label: "Kategori", href: "/dashboard/categories" },
      { label: "Moderasi", href: "/dashboard/moderation" },
    ],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border px-3 py-2 text-xs transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-transparent text-ink/60 hover:border-ink/15 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
