"use client";

import { signOut, useSession as useNextAuthSession } from "next-auth/react";

export function notifySessionChange() {}

export async function logout() {
  await signOut({ redirect: false });
}

export function useSession() {
  const { data, status } = useNextAuthSession();

  return {
    user: data?.user ?? null,
    ready: status !== "loading",
  };
}
