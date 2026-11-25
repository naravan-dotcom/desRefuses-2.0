"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadDb } from "@/lib/local-data";
import { useSession } from "@/lib/use-session";

const groups = [
  {
    label: "Umum",
    roles: ["admin", "member", "curator"],
    items: [{ label: "Ringkasan", href: "/dashboard", icon: "fa-gauge" }],
  },
  {
    label: "Member",
    roles: ["member"],
    items: [
      { label: "Karya saya", href: "/dashboard/artworks", icon: "fa-images", count: "artworks" },
      { label: "Favorit", href: "/dashboard/favorites", icon: "fa-bookmark", count: "favorites" },
      { label: "Submisi", href: "/dashboard/submissions", icon: "fa-paper-plane", count: "submissions" },
      { label: "Profil", href: "/dashboard/profile", icon: "fa-user" },
      { label: "Akun", href: "/dashboard/account", icon: "fa-gear" },
    ],
  },
  {
    label: "Kurator",
    roles: ["curator"],
    items: [
      {
        label: "Tantangan saya",
        href: "/dashboard/challenges",
        icon: "fa-flag",
        count: "challenges",
      },
    ],
  },
  {
    label: "Admin",
    roles: ["admin"],
    items: [
      { label: "Pengguna", href: "/dashboard/users", icon: "fa-users" },
      { label: "Verifikasi kurator", href: "/dashboard/curators", icon: "fa-user-check", count: "pendingCurators" },
      { label: "Kategori", href: "/dashboard/categories", icon: "fa-tags" },
      { label: "Moderasi", href: "/dashboard/moderation", icon: "fa-shield-halved", count: "openReports" },
    ],
  },
];

export function canOpen(role, pathname) {
  const group = groups.find((item) => item.items.some((entry) => entry.href === pathname));
  if (!group) return true;
  return group.roles.includes(role);
}

export default function DashboardNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const [counts, setCounts] = useState({
    artworks: 0,
    favorites: 0,
    submissions: 0,
    challenges: 0,
    pendingCurators: 0,
    openReports: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) return;
      const db = loadDb();
      setCounts({
        artworks: db.artworks.filter((item) => item.userId === user.id).length,
        favorites: (user.favorites ?? []).length,
        submissions: db.submissions.filter((item) => item.userId === user.id).length,
        challenges: db.challenges.filter((item) => item.curatorId === user.id).length,
        pendingCurators: db.users.filter((item) => item.role === "curator" && item.status === "pending").length,
        openReports: db.reports.filter((item) => item.status === "open").length,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [user, pathname]);

  if (!user) return null;

  const visible = groups.filter((group) => group.roles.includes(user.role));

  return (
    <nav className="space-y-6">
      <div className="border-b hairline pb-5">
        <div className="flex items-center gap-3">
          <img src={user.avatar || "/desrefuses-mark.png"} alt="" className="avatar h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{user.name}</p>
            <p className="label mt-0.5 truncate text-ink/55">@{user.username}</p>
            <p className="label mt-1 capitalize text-ink/45">
              {user.role} · {user.status}
            </p>
          </div>
        </div>
        {user.role !== "admin" && (
          <Link
            href={`/creator/${user.id}`}
            className="label mt-4 flex items-center gap-1.5 text-wine hover:text-ink"
          >
            Profil publik <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
          </Link>
        )}
      </div>
      {visible.map((group) => (
        <div key={group.label}>
          <p className="label mb-2 text-ink/45">{group.label}</p>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`side-link ${active ? "active" : ""}`}
                >
                  <span className="flex items-center gap-2.5">
                    <i className={`fa-solid ${item.icon} w-4 text-[12px]`} />
                    {item.label}
                  </span>
                  {item.count && counts[item.count] > 0 && (
                    <span className="tag">{counts[item.count]}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
