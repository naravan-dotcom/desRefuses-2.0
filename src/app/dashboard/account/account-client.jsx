"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { notifySessionChange } from "@/lib/use-session";
import { updateAccount } from "./actions";

export default function DashboardAccountClient({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [email, setEmail] = useState(initialUser.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function openForm() {
    setError("");
    setEmail(user?.email ?? "");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setShowForm(true);
  }

  function closeForm(nextUser = user) {
    setShowForm(false);
    setEmail(nextUser?.email ?? "");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function saveAccount(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("currentPassword", currentPassword);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    const result = await updateAccount(formData);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }

    setUser(result.user);
    notifySessionChange();
    notify(
      result.emailChanged
        ? "Email berhasil diperbarui."
        : result.passwordChanged
          ? "Password berhasil diperbarui."
          : "Akun berhasil diperbarui.",
      "success",
    );
    closeForm(result.user);
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
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="field mt-2" />
          </label>
          <label className="block">
            <span className="label">Password saat ini</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Wajib jika ganti password" className="field mt-2" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Password baru</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Min. 6 karakter" className="field mt-2" />
            </label>
            <label className="block">
              <span className="label">Ulangi password baru</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi password" className="field mt-2" />
            </label>
          </div>
          <p className="label text-ink/55">Kosongkan password jika tidak ingin mengganti.</p>
          {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-ink btn-sm">{saving ? "Menyimpan..." : "Simpan perubahan"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
