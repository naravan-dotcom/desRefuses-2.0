"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout, useSession } from "@/lib/use-session";

const ADMIN_EMAIL = "admin@desrefuses.id";

export default function SuspendedPage() {
  const router = useRouter();
  const { user, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.status !== "suspended") {
      if (user.role === "admin") router.replace("/dashboard");
      else if (user.role === "curator") {
        if (user.status === "approved") router.replace("/dashboard/challenges");
        else router.replace("/pending");
      } else router.replace("/home");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.status !== "suspended") {
    return (
      <main className="page-enter grid min-h-[60vh] place-items-center px-5">
        <p className="label text-ink/55">Memeriksa sesi...</p>
      </main>
    );
  }

  const reason = user.suspensionReason || "Admin menangguhkan akun ini tanpa keterangan tambahan.";

  return (
    <main className="page-enter mx-auto max-w-3xl px-5 py-14 lg:px-8">
      <div className="border hairline bg-white">
        <div className="border-b hairline p-7 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label text-ink/65">Status akun</div>
              <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">
                Akun Anda ditangguhkan.
              </h1>
            </div>
            <span className="status status-suspended">Ditangguhkan</span>
          </div>
          <p className="mt-4 text-[16px] leading-relaxed text-ink/80">
            Admin menangguhkan akun Anda. Anda tidak dapat mengakses dashboard maupun fitur interaksi sampai akun diaktifkan kembali.
          </p>
        </div>

        <div className="space-y-5 p-7 sm:p-10">
          <div className="border-l-2 border-wine bg-wine/5 px-4 py-3">
            <div className="label text-wine">Alasan penangguhan</div>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{reason}</p>
          </div>
          <div className="border hairline bg-paper p-4">
            <div className="label text-ink/65">Banding</div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
              Jika Anda merasa ada kesalahan, harap hubungi email admin{" "}
              <a
                href={`mailto:${ADMIN_EMAIL}`}
                className="font-semibold text-wine underline underline-offset-4"
              >
                {ADMIN_EMAIL}
              </a>{" "}
              untuk banding. Admin dapat mengaktifkan kembali akun Anda setelah peninjauan.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t hairline p-7 sm:flex-row sm:items-center sm:p-10">
          <div>
            <div className="label text-ink/65">Login sebagai</div>
            <div className="mt-1 text-[15px] font-semibold">
              {user.name} <span className="font-normal text-ink/65">@{user.username}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="btn btn-ink btn-sm"
          >
            Keluar
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-[13px] font-label text-ink/65">
        Penangguhan bersifat sementara. Hubungi admin melalui kanal resmi komunitas untuk informasi lebih lanjut.
      </p>
    </main>
  );
}
