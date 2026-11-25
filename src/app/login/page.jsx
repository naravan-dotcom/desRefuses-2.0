"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/auth-shell";
import { notify } from "@/components/ui/toast";
import { homeForUser } from "@/lib/access";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        const msg = "Email atau password tidak cocok.";
        setError(msg);
        notify(msg, "error");
        return;
      }

      const session = await fetch("/api/auth/session").then((response) => response.json());
      router.push(homeForUser(session.user));
      router.refresh();
    } catch {
      const msg = "Login gagal. Coba lagi.";
      setError(msg);
      notify(msg, "error");
    }
  }

  return (
    <AuthShell mode="login">
      <h1 className="font-display text-[34px] leading-[1.12] tracking-[-0.01em] lg:text-[40px]">
        Masuk ke<br />ruang yang terbuka.
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-ink/65">
        Masuk menggunakan email dan password akun Anda.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="label text-ink/65" htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label className="label text-ink/65" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="field mt-1.5"
          />
        </div>
        {error && (
          <p className="border-l-2 border-wine bg-wine/5 px-4 py-3 font-label text-[13px] leading-relaxed text-wine">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-ink w-full">Masuk</button>
      </form>
    </AuthShell>
  );
}
