"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/use-session";

const groups = [
  {
    label: "Umum",
    roles: ["admin", "member", "curator"],
    items: [{ label: "Ringkasan", href: "/dashboard" }],
  },
  {
    label: "Member",
    roles: ["member"],
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
    roles: ["curator"],
    items: [{ label: "Tantangan saya", href: "/dashboard/challenges" }],
  },
  {
    label: "Admin",
    roles: ["admin"],
    items: [
      { label: "Pengguna", href: "/dashboard/users" },
      { label: "Verifikasi kurator", href: "/dashboard/curators" },
      { label: "Kategori", href: "/dashboard/categories" },
      { label: "Moderasi", href: "/dashboard/moderation" },
    ],
  },
];

export function canOpen(role, pathname) {
  const group = groups.find((item) =>
    item.items.some((entry) => entry.href === pathname),
  );
  if (!group) return true;
  return group.roles.includes(role);
}

export default function DashboardNav() {
  const pathname = usePathname();
  const { user } = useSession();

  if (!user) return null;

  const visible = groups.filter((group) => group.roles.includes(user.role));

  return (
    <nav className="space-y-5">
      {visible.map((group) => (
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
