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

  const suspended = Boolean(user && user.status === "suspended");
  const pendingCurator = Boolean(
    user && user.role === "curator" && user.status !== "approved" && user.status !== "suspended",
  );
  const allowed = Boolean(
    ready && user && !suspended && !pendingCurator && canOpen(user.role, pathname),
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
    if (current.status === "suspended") {
      router.replace("/suspended");
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
      <div className="page-enter grid min-h-[60vh] place-items-center px-5">
        <p className="label text-ink/55">Memeriksa sesi...</p>
      </div>
    );
  }

  const roomLabel =
    user.role === "curator"
      ? "Ruang curator"
      : user.role === "admin"
        ? "Ruang admin"
        : "Ruang member";

  return (
    <DashboardShell label={roomLabel} nav={<DashboardNav />}>
      {children}
    </DashboardShell>
  );
}
