"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./navbar";
import Footer from "./footer";
import PageProgress from "./page-progress";
import { useSession } from "@/lib/use-session";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();

  useEffect(() => {
    if (!ready || !user || user.status !== "suspended") return;
    if (pathname === "/suspended" || pathname === "/login" || pathname === "/") return;
    router.replace("/suspended");
  }, [ready, user, pathname, router]);

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return undefined;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <>
      <PageProgress />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
