"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [role, setRole] = useState("kreator");

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-md border border-ink/15 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Daftar akun
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Buat akun baru.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          Daftar untuk mulai memajang dan mengelola karya Anda.
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <span className="text-xs font-medium text-ink/60">Daftar sebagai</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("kreator")}
                className={`border px-3 py-2 text-sm transition-colors ${
                  role === "kreator"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-ink/60 hover:border-ink/40"
                }`}
              >
                Kreator
              </button>
              <button
                type="button"
                onClick={() => setRole("kurator")}
                className={`border px-3 py-2 text-sm transition-colors ${
                  role === "kurator"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-ink/60 hover:border-ink/40"
                }`}
              >
                Kurator
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Nama</span>
            <input
              type="text"
              placeholder="Nama tampilan"
              autoComplete="name"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Username</span>
            <input
              type="text"
              placeholder="huruf, angka, underscore"
              autoComplete="username"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Email</span>
            <input
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Password</span>
            <input
              type="password"
              placeholder="Min. 6 karakter"
              autoComplete="new-password"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Ulangi password</span>
            <input
              type="password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          {role === "kurator" && (
            <p className="border-l-2 border-brand/60 bg-brand/5 px-3 py-2.5 text-xs leading-relaxed text-ink/60">
              Akun kurator akan berstatus{" "}
              <span className="font-medium text-ink">pending</span> selama proses
              pembuatan sampai Admin menyetujui.
            </p>
          )}

          <button
            type="button"
            className="w-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-brand"
          >
            Daftar
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-ink/50">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-ink underline underline-offset-4 hover:text-brand"
          >
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
