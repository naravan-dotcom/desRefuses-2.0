"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/auth-shell";
import ConfirmDialog from "@/components/confirm-dialog";
import { loadDb, saveDb } from "@/lib/local-data";
import { logout, useSession } from "@/lib/use-session";

export default function PendingCuratorPage() {
  const router = useRouter();
  const { user, ready } = useSession();
  const [confirming, setConfirming] = useState(false);

  const isPendingCurator = Boolean(user && user.role === "curator" && user.status !== "approved");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "curator" || user.status === "approved") {
      if (user.role === "admin") router.replace("/dashboard");
      else if (user.role === "curator") router.replace("/dashboard/challenges");
      else router.replace("/home");
    }
  }, [ready, user, router]);

  function handleDelete() {
    const db = loadDb();
    db.users = db.users.filter((item) => item.id !== user.id);
    saveDb(db);
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
    ? "Admin menolak pendaftaran kurator ini. Anda dapat menghapus akun yang telah didaftarkan, lalu mendaftar ulang dengan informasi yang lebih baik."
    : "Admin akan meninjau pendaftaran kurator Anda. Selama menunggu, Anda tetap bisa menjelajahi karya seperti tamu, tetapi dashboard belum bisa diakses.";
  const steps = [
    ["01", "Pendaftaran", true],
    ["02", "Verifikasi admin", !rejected],
    ["03", "Dashboard curator", false],
  ];

  return (
    <AuthShell mode="pending">
      <div className="label text-wine">Status akun curator</div>
      <h1 className="font-display mt-5 text-[34px] leading-[1.12] tracking-[-0.01em] lg:text-[40px]">
        {rejected ? <>Pendaftaran<br />ditolak.</> : <>Akun sedang<br />ditinjau.</>}
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-ink/65">{description}</p>

      <div className="mt-8 border hairline bg-white p-5">
        <div className="label text-wine">Detail akun</div>
        <div className="mt-4 space-y-2 text-[13px] text-ink/65">
          <p><span className="text-ink/45">Nama:</span> {user.name}</p>
          <p><span className="text-ink/45">Email:</span> {user.email}</p>
          <p>
            <span className="text-ink/45">Status:</span>{" "}
            <span className={`status ${rejected ? "status-rejected" : "status-pending"}`}>
              {rejected ? "Rejected" : "Pending"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-px border-y hairline bg-ink/10">
        {steps.map(([num, label, done]) => (
          <div key={num} className="bg-white px-4 py-5">
            <div className={`label ${done ? "text-wine" : "text-ink/45"}`}>{num}</div>
            <div className="mt-2 text-[13px] font-semibold leading-snug">{label}</div>
          </div>
        ))}
      </div>

      {rejected ? (
        <div className="mt-6 space-y-3">
          <button type="button" onClick={() => setConfirming(true)} className="btn btn-wine w-full">Hapus akun</button>
        </div>
      ) : (
        <Link href="/gallery" className="btn btn-ink mt-6 w-full">Jelajahi galeri</Link>
      )}

      <p className="mt-6 text-center text-[13px] text-ink/60">
        Bukan akun Anda?{" "}
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-wine underline underline-offset-4"
        >
          Keluar
        </button>
      </p>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        title="Hapus akun"
        subtitle="Curator"
        message="Hapus akun ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        danger
        confirmLabel="Ya, hapus akun"
      />
    </AuthShell>
  );
}
