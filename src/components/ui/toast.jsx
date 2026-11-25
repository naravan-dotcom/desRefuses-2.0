"use client";

import { useEffect, useState } from "react";

export function notify(message, type = "error") {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent("desrefuses:toast", { detail: { message, type } }));
}

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(event) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const { message, type = "error" } = event.detail ?? {};
      if (!message) return;
      setItems((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 4000);
    }

    window.addEventListener("desrefuses:toast", onToast);
    return () => window.removeEventListener("desrefuses:toast", onToast);
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] flex flex-col gap-2.5 sm:bottom-5 sm:left-auto sm:right-5 sm:w-full sm:max-w-sm">
      {items.map((item) => {
        const isError = item.type === "error";
        return (
          <div
            key={item.id}
            role="alert"
            className={`flex items-start justify-between gap-3 border px-4 py-3 text-[13px] leading-relaxed shadow-[0_20px_40px_-20px_rgba(22,20,17,0.45)] ${
              isError ? "border-wine bg-wine text-paper" : "border-ink bg-ink text-paper"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <i className={`fa-solid ${isError ? "fa-circle-exclamation" : item.type === "success" ? "fa-circle-check" : "fa-circle-info"} mt-0.5 text-[13px]`} />
              <span>{item.message}</span>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              className="text-paper/70 transition-colors hover:text-paper"
            >
              <i className="fa-solid fa-xmark text-[12px]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
