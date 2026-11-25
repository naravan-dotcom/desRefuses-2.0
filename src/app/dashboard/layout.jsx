"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardNav, { canOpen } from "@/components/dashboard/dashboard-nav";
import { useSession } from "@/lib/use-session";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user, ready } = useSession();

  const suspended = Boolean(user && user.status === "suspended");
  const pendingCurator = Boolean(
    user && user.role === "curator" && user.status !== "approved" && user.status !== "suspended",
  );
  const allowed = Boolean(
    ready && user && !suspended && !pendingCurator && canOpen(user.role, pathname),
  );

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
