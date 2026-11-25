"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { setCurrentUser } from "@/lib/auth-client";

function SessionBridge({ children }) {
  const { data } = useSession();

  useEffect(() => {
    setCurrentUser(data?.user ?? null);
  }, [data]);

  return children;
}

export default function SessionProviderClient({ children }) {
  return (
    <SessionProvider>
      <SessionBridge>{children}</SessionBridge>
    </SessionProvider>
  );
}
