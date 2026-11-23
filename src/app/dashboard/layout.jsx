"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardNav, { canOpen } from "@/components/dashboard/dashboard-nav";
import { getSessionId, loadDb } from "@/lib/local-data";
import { useSession } from "@/lib/use-session";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useSession();

  const pendingCurator = Boolean(
    user && user.role === "curator" && user.status !== "approved",
  );
  const allowed = Boolean(
    ready && user && !pendingCurator && canOpen(user.role, pathname),
  );

  useEffect(() => {
    if (!ready) return;
    const id = getSessionId();
    const db = loadDb();
    const current = db.users.find((item) => item.id === id) ?? null;
    if (!current) {
      router.replace("/login");
      return;
    }
    if (current.role === "curator" && current.status !== "approved") {
      router.replace("/pending");
      return;
    }
    if (!canOpen(current.role, pathname)) router.replace("/dashboard");
  }, [ready, pathname, router]);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-ink/45 sm:px-10">
        Memeriksa sesi...
      </div>
    );
  }

  return <DashboardShell nav={<DashboardNav />}>{children}</DashboardShell>;
}
