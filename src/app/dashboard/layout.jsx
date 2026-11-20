import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({ children }) {
  return <DashboardShell nav={<DashboardNav />}>{children}</DashboardShell>;
}
