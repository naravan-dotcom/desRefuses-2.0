"use client";

import { useEffect, useState } from "react";
import { getSessionId, loadDb, saveDb } from "@/lib/local-data";
import { notifySessionChange } from "@/lib/use-session";

export default function DashboardAccountPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const db = loadDb();
      const current = db.users.find((item) => item.id === getSessionId());
      if (!current) return;
      setUser(current);
      setEmail(current.email ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function saveAccount(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanEmail = email.trim();
    if (!user || user.role !== "member") {
      setError("Hanya Member yang bisa mengelola akun.");
      return;
    }
    if (!cleanEmail) {
      setError("Email wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Format email tidak valid.");
      return;
    }
    if (password && password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Ulangi password tidak sama.");
      return;
    }

    const next = loadDb();
    const target = next.users.find((item) => item.id === user.id);
    if (!target) {
      setError("Akun tidak ditemukan.");
      return;
    }
    if (
      next.users.some(
        (item) =>
          item.id !== user.id &&
          item.email.toLowerCase() === cleanEmail.toLowerCase(),
      )
    ) {
      setError("Email sudah digunakan.");
      return;
    }

    const emailChanged = target.email !== cleanEmail;
    target.email = cleanEmail;
    if (password) target.password = password;

    saveDb(next);
    notifySessionChange();
    setUser(target);
    setPassword("");
    setConfirmPassword("");
    setNotice(
      emailChanged
        ? "Email berhasil diperbarui."
        : password
          ? "Password berhasil diperbarui."
          : "Tidak ada perubahan yang disimpan.",
    );
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Akun</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola informasi akun dan keamanan.
        </p>
      </header>

      <form
        onSubmit={saveAccount}
        className="space-y-4 border border-ink/15 bg-white p-5 sm:p-6"
      >
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Password baru</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Min. 6 karakter"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
          <span className="mt-1 block text-xs text-ink/45">
            Kosongkan jika tidak ingin mengganti password.
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/60">
            Ulangi password baru
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ulangi password"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>
        <button
          type="submit"
          className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
        >
          Simpan perubahan
        </button>
      </form>

      {error && (
        <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {notice && <p className="text-xs text-ink/55">{notice}</p>}
    </>
  );
}
