import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  const user = session?.user;

  if (!user) redirect("/login");
  if (user.status === "suspended") redirect("/suspended");
  if (user.role === "curator" && user.status !== "approved") redirect("/pending");

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
