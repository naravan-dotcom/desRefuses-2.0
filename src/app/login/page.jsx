"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadDb, setSessionId } from "@/lib/local-data";
import { notifySessionChange } from "@/lib/use-session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const db = loadDb();
    const user = db.users.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password,
    );

    if (!user) {
      setError("Email atau password salah.");
      return;
    }

    setSessionId(user.id);
    notifySessionChange();
    if (user.role === "curator" && user.status !== "approved") {
      router.push("/pending");
    } else if (user.role === "admin") router.push("/dashboard");
    else if (user.role === "curator") router.push("/dashboard/challenges");
    else router.push("/home");
  }

  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-md space-y-4">
        <div className="border border-ink/15 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Masuk ke galeri
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Selamat datang kembali.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/55">
            Masuk untuk mengelola karya dan melihat aktivitas Anda.
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-medium text-ink/60">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-ink/60">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>

            {error && (
              <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-brand"
            >
              Masuk
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink/50">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-ink underline underline-offset-4 hover:text-brand"
            >
              Daftar
            </Link>
          </p>
        </div>

        <div className="border border-dashed border-ink/20 bg-white p-4 text-[11px] leading-relaxed text-ink/55">
          <p className="font-medium text-ink/70">Akun demo:</p>
          <p>Member — sora@desrefuses.id / member123</p>
          <p>Admin — admin@desrefuses.id / admin123</p>
          <p>Kurator — musee@desrefuses.id / curator123</p>
          <p>Kurator pending — dao@desrefuses.id / curator123</p>
          <p>Kurator rejected — nol@desrefuses.id / curator123</p>
        </div>
      </div>
    </main>
  );
}
