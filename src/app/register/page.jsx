"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/auth-shell";
import { notify } from "@/components/ui/toast";
import { homeForUser } from "@/lib/access";


export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("member");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    function fail(msg) {
      setError(msg);
      notify(msg, "error");
    }

    if (!cleanName || !cleanUsername || !cleanEmail || !password || !confirmPassword) {
      fail("Semua kolom wajib diisi.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      fail("Username hanya boleh huruf kecil, angka, dan underscore (3-20 karakter).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      fail("Format email tidak valid.");
      return;
    }
    if (password.length < 6) {
      fail("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      fail("Konfirmasi password tidak sama.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        fail(data.error ?? "Pendaftaran gagal.");
        return;
      }

      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        router.push("/login");
        return;
      }

      const session = await fetch("/api/auth/session").then((res) => res.json());
      router.push(homeForUser(session.user));
      router.refresh();
    } catch {
      fail("Pendaftaran gagal. Coba lagi.");
    }
  }

  return (
    <AuthShell mode="register">
      <h1 className="font-display text-[34px] leading-[1.12] tracking-[-0.01em] lg:text-[40px]">
        Buat<br />akun kreator.
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-ink/65">
        {role === "curator"
          ? "Daftar sebagai curator untuk membuat tantangan setelah disetujui admin."
          : "Daftar sebagai member untuk mulai memajang karya."}
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <span className="label text-ink/65">Daftar sebagai</span>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRole("member")}
              className={`chip ${role === "member" ? "active" : ""}`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setRole("curator")}
              className={`chip ${role === "curator" ? "active" : ""}`}
            >
              Curator
            </button>
          </div>
        </div>
        <div>
          <label className="label text-ink/65" htmlFor="reg-name">Nama tampilan</label>
          <input
            id="reg-name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama atau komunitas"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label text-ink/65" htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            type="text"
            required
            pattern="[a-z0-9_]{3,20}"
            title="3-20 karakter: huruf kecil, angka, atau underscore"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="huruf, angka, _"
            autoComplete="username"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label text-ink/65" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label text-ink/65" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Min. 6 karakter"
            autoComplete="new-password"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label text-ink/65" htmlFor="reg-confirm">Ulangi password</label>
          <input
            id="reg-confirm"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ulangi password"
            autoComplete="new-password"
            className="field mt-1.5"
          />
        </div>
        {role === "curator" && (
          <p className="border-l-2 border-gold bg-gold/10 px-4 py-3 text-[13px] leading-relaxed text-ink/65">
            Akun kurator akan berstatus <span className="font-semibold">pending</span> sampai Admin menyetujui.
          </p>
        )}
        {error && (
          <p className="border-l-2 border-wine bg-wine/5 px-4 py-3 font-label text-[13px] leading-relaxed text-wine">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-ink w-full">Daftar</button>
      </form>
      <div className="mt-8 border-t hairline pt-5">
        <p className="text-[13px] leading-relaxed text-ink/65">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-wine transition-colors hover:text-ink">Masuk di sini</Link>.
        </p>
      </div>
    </AuthShell>
  );
}
