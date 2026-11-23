"use client";

import { useEffect, useState } from "react";
import { getSessionId, loadDb, setSessionId } from "@/lib/local-data";

export function notifySessionChange() {
  window.dispatchEvent(new Event("desrefuses-session"));
}

export function logout() {
  setSessionId(null);
  notifySessionChange();
}

export function useSession() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function read() {
      const id = getSessionId();
      const db = loadDb();
      setUser(db.users.find((item) => item.id === id) ?? null);
      setReady(true);
    }

    read();
    window.addEventListener("storage", read);
    window.addEventListener("desrefuses-session", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("desrefuses-session", read);
    };
  }, []);

  return { user, ready };
}
