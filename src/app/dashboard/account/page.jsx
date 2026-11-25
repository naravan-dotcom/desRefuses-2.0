"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { getSessionId, loadDb, saveDb } from "@/lib/local-data";
import { notifySessionChange } from "@/lib/use-session";

export default function DashboardAccountPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (error) notify(error, "error");
  }, [error]);

  useEffect(() => {
    if (notice) notify(notice, "success");
  }, [notice]);

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

  function openForm() {
    setError("");
    setEmail(user?.email ?? "");
    setPassword("");
    setConfirmPassword("");
    setShowForm(true);
  }

  function closeForm(nextUser = user) {
    setShowForm(false);
    setEmail(nextUser?.email ?? "");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

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
    setNotice(
      emailChanged
        ? "Email berhasil diperbarui."
        : password
          ? "Password berhasil diperbarui."
          : "Tidak ada perubahan yang disimpan.",
    );
    closeForm(target);
  }

  return (
    <>
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Akun.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Kelola informasi akun dan keamanan.
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 border hairline bg-white p-5 sm:p-6">
        <div>
          <p className="label text-ink/65">Akun masuk</p>
          <p className="mt-2 text-[14px] font-semibold">{user?.username ?? "kreator"}</p>
          <p className="label mt-1 text-ink/55">{user?.email ?? "—"}</p>
        </div>
        <button type="button" onClick={openForm} className="btn btn-outline btn-sm">Ubah akun</button>
      </section>

      <Modal open={showForm} onClose={closeForm} title="Edit akun" subtitle="Member">
        <form onSubmit={saveAccount} className="space-y-5">
          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="field mt-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Password baru</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min. 6 karakter"
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Ulangi password baru</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password"
                className="field mt-2"
              />
            </label>
          </div>
          <p className="label text-ink/55">Kosongkan password jika tidak ingin mengganti.</p>
          {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" className="btn btn-ink btn-sm">Simpan perubahan</button>
          </div>
        </form>
      </Modal>

      {notice && <p className="label text-wine">{notice}</p>}
    </>
  );
}
