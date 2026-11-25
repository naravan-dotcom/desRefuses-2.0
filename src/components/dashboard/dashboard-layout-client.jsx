"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardNav, { canOpen } from "@/components/dashboard/dashboard-nav";
import SessionLoading from "@/components/ui/session-loading";
import { useSession } from "@/lib/use-session";

export default function DashboardLayoutClient({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();

  const suspended = Boolean(user && user.status === "suspended");
  const pendingCurator = Boolean(
    user && user.role === "curator" && user.status !== "approved" && user.status !== "suspended",
  );
  const allowed = Boolean(
    ready && user && !suspended && !pendingCurator && canOpen(user.role, pathname),
  );

  useEffect(() => {
    if (!ready || allowed) return;
    if (!user) router.replace("/login");
    else if (suspended) router.replace("/suspended");
    else if (pendingCurator) router.replace("/pending");
    else router.replace("/dashboard");
  }, [ready, allowed, user, suspended, pendingCurator, router]);

  if (!allowed) {
    return (
      <div className="page-enter grid min-h-[60vh] place-items-center px-5">
        <SessionLoading />
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
