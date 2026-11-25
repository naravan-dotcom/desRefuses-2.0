"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth-shell";
import { notify } from "@/components/toast";
import { homeForUser } from "@/lib/access";

const demoAccounts = [
  { role: "Member", name: "Sora Vane", email: "sora@desrefuses.id", password: "member123" },
  { role: "Member ditangguhkan", name: "Balthazar K.", email: "balthazar@desrefuses.id", password: "member123" },
  { role: "Admin", name: "Nadia Pratama", email: "admin@desrefuses.id", password: "admin123" },
  { role: "Curator approved", name: "Musée Libre Paris", email: "musee@desrefuses.id", password: "curator123" },
  { role: "Curator pending", name: "DAO Hectic Arts", email: "dao@desrefuses.id", password: "curator123" },
  { role: "Curator rejected", name: "Studio Nol", email: "nol@desrefuses.id", password: "curator123" },
];

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
        const msg = "Email atau password tidak cocok. Coba akun demo di bawah.";
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

  function fillDemo(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <AuthShell mode="login">
      <h1 className="font-display text-[34px] leading-[1.12] tracking-[-0.01em] lg:text-[40px]">
        Masuk ke<br />ruang yang terbuka.
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-ink/65">
        Gunakan akun Anda, atau pilih salah satu akun demo untuk mencoba peran yang berbeda.
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

      <details className="mt-8 border-t hairline pt-5" open>
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span className="label text-ink/65">Akun demo</span>
        </summary>
        <div className="mt-1 grid gap-x-8 sm:grid-cols-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account.email, account.password)}
              className="border-b hairline py-2.5 text-left transition-colors hover:text-wine"
            >
              <div className="text-[13px] font-semibold">{account.name}</div>
              <div className="label mt-1 text-ink/65">{account.role}</div>
            </button>
          ))}
        </div>
        <p className="font-label mt-3 text-[12px] uppercase tracking-normal text-ink/65">
          Klik akun untuk mengisi kredensial, lalu tekan Masuk.
        </p>
      </details>
    </AuthShell>
  );
}
