"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isoNow, loadDb, saveDb, setSessionId, uid } from "@/lib/local-data";
import { notifySessionChange } from "@/lib/use-session";
import { IMAGES } from "@/lib/seed";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("kreator");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Ulangi password tidak sama.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Format email tidak valid.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError("Username hanya boleh huruf, angka, dan underscore.");
      return;
    }

    const db = loadDb();
    const emailTaken = db.users.some(
      (item) => item.email.toLowerCase() === cleanEmail.toLowerCase(),
    );
    const usernameTaken = db.users.some(
      (item) => item.username.toLowerCase() === cleanUsername.toLowerCase(),
    );

    if (emailTaken) {
      setError("Email sudah digunakan.");
      return;
    }
    if (usernameTaken) {
      setError("Username sudah digunakan.");
      return;
    }

    const finalRole = role === "kurator" ? "curator" : "member";
    const newUser = {
      id: uid("u"),
      role: finalRole,
      status: finalRole === "curator" ? "pending" : "approved",
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password,
      avatar: IMAGES.av6,
      bio: "",
      links: { instagram: "", behance: "", website: "" },
      favorites: [],
      following: [],
      joinedAt: isoNow(),
    };

    db.users.push(newUser);
    saveDb(db);

    if (finalRole === "member") {
      setSessionId(newUser.id);
      notifySessionChange();
      router.push("/home");
      return;
    }

    setSuccess(
      "Pengajuan kurator berhasil. Masuk untuk melihat status akun; dashboard menunggu persetujuan Admin.",
    );
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

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

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama tampilan"
              autoComplete="name"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="huruf, angka, underscore"
              autoComplete="username"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

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
              placeholder="Min. 6 karakter"
              autoComplete="new-password"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">
              Ulangi password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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

          {error && (
            <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="border-l-2 border-green-700 bg-green-50 px-3 py-2 text-xs text-green-800">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-brand"
          >
            Daftar
          </button>
        </form>

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
