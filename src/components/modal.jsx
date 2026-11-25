"use client";

import { useEffect } from "react";

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto border hairline bg-paper p-6 shadow-[0_30px_60px_-30px_rgba(22,20,17,0.5)] lg:p-8`}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b hairline pb-4">
          <div>
            {subtitle && <div className="label text-muted">{subtitle}</div>}
            <h2 className="font-display mt-1 text-[26px] leading-[1.12]">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center border hairline text-ink/65 transition-colors hover:bg-ink hover:text-paper"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
