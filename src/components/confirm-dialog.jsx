"use client";

import Modal from "@/components/modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} maxWidth="max-w-md">
      <div className="text-[14px] leading-relaxed text-ink/65">{message}</div>
      <div className="mt-8 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-outline btn-sm">{cancelLabel}</button>
        <button type="button" onClick={onConfirm} className={`btn btn-sm ${danger ? "btn-wine" : "btn-ink"}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
