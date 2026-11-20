"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function SiteShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      {!isDashboard && <Footer />}
    </>
  );
}
