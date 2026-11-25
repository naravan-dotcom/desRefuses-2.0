"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { deleteOwnAccount } from "./actions";
import { logout, useSession } from "@/lib/use-session";

export default function PendingCuratorPage() {
  const router = useRouter();
  const { user, ready } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const isPendingCurator = Boolean(
    user && user.role === "curator" && (user.status === "pending" || user.status === "rejected"),
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.status === "suspended") {
      router.replace("/suspended");
      return;
    }
    if (!isPendingCurator) {
      if (user.role === "admin") router.replace("/dashboard");
      else if (user.role === "curator") router.replace("/dashboard/challenges");
      else router.replace("/home");
    }
  }, [ready, user, router, isPendingCurator]);

  async function handleDelete() {
    const result = await deleteOwnAccount();
    if (!result.ok) {
      setError(result.error ?? "Akun gagal dihapus.");
      return;
    }
    logout();
    router.push("/home");
  }

  if (!isPendingCurator) {
    return (
      <main className="page-enter grid min-h-[60vh] place-items-center px-5">
        <p className="label text-ink/55">Memeriksa sesi...</p>
      </main>
    );
  }

  const rejected = user.status === "rejected";
  const description = rejected
    ? "Admin menolak pengajuan akun curator Anda. Anda tidak dapat mengakses dashboard curator. Sesuai ketentuan, akun yang ditolak hanya dapat dihapus melalui halaman ini."
    : "Terima kasih telah mendaftar sebagai curator. Admin sedang memverifikasi identitas dan maksud penyelenggaraan event Anda. Dashboard curator akan terbuka setelah disetujui.";
  const steps = [
    ["01", "Pendaftaran", true],
    ["02", "Verifikasi admin", !rejected],
    ["03", "Dashboard curator", false],
  ];

  return (
    <main className="page-enter mx-auto max-w-3xl px-5 py-14 lg:px-8">
      <div className="border hairline bg-white">
        <div className="border-b hairline p-7 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label text-ink/65">Status akun curator</div>
              <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">
                {rejected ? "Pendaftaran ditolak." : "Akun Anda sedang ditinjau."}
              </h1>
            </div>
            <span className={`status ${rejected ? "status-rejected" : "status-pending"}`}>
              {rejected ? "Rejected" : "Pending"}
            </span>
          </div>
          <p className="mt-4 text-[16px] leading-relaxed text-ink/80">{description}</p>
        </div>

        <div className="grid grid-cols-3 gap-px border-b hairline bg-ink/10 p-px">
          {steps.map(([num, label, active]) => (
            <div key={num} className="bg-white p-4">
              <div className="flex items-center gap-2">
                <span className={`label ${active ? "text-pink" : "text-ink/65"}`}>{num}</span>
                <span className={`text-[12px] font-label uppercase tracking-normal ${active ? "text-ink" : "text-ink/65"}`}>
                  {active ? "Aktif" : "Menunggu"}
                </span>
              </div>
              <div className={`mt-2 text-[14px] font-semibold ${active ? "" : "text-ink/65"}`}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-4 p-7 sm:flex-row sm:items-center sm:p-10">
          <div>
            <div className="label text-ink/65">Login sebagai</div>
            <div className="mt-1 text-[15px] font-semibold">
              {user.name} <span className="font-normal text-ink/65">@{user.username}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/home" className="btn btn-outline btn-sm">Jelajahi galeri</Link>
            {rejected ? (
              <button type="button" onClick={() => setConfirming(true)} className="btn btn-pink btn-sm">
                <i className="fa-solid fa-trash" />
                Hapus akun
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="btn btn-outline btn-sm"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="label mt-4 text-center text-wine">{error}</p>}

      <p className="mt-4 text-center text-[13px] font-label text-ink/65">
        Keputusan verifikasi tidak berdasarkan selera karya. Butuh bantuan? Hubungi admin melalui kanal komunitas.
      </p>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        title="Hapus akun curator?"
        subtitle="Curator"
        message="Akun, data profil, dan riwayat pendaftaran akan dihapus permanen dari platform demo ini."
        danger
        confirmLabel="Hapus akun saya"
      />
    </main>
  );
}
