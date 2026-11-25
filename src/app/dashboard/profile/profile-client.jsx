"use client";

import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/ui/modal";
import { notify } from "@/components/ui/toast";
import { MAX_UPLOAD_SIZE } from "@/lib/upload";
import { notifySessionChange } from "@/lib/use-session";
import { updateProfile } from "./actions";

export default function DashboardProfileClient({ initialUser, initialFollowing }) {
  const [user, setUser] = useState(initialUser);
  const [following] = useState(initialFollowing);
  const [name, setName] = useState(initialUser.name ?? "");
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarData, setAvatarData] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [links, setLinks] = useState({
    instagram: initialUser.links?.instagram ?? "",
    behance: initialUser.links?.behance ?? "",
    website: initialUser.links?.website ?? "",
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm(nextUser = user) {
    setName(nextUser?.name ?? "");
    setBio(nextUser?.bio ?? "");
    setLinks({
      instagram: nextUser?.links?.instagram ?? "",
      behance: nextUser?.links?.behance ?? "",
      website: nextUser?.links?.website ?? "",
    });
    setAvatarUrl("");
    setAvatarData("");
    setAvatarName("");
    setError("");
  }

  function openForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm(nextUser = user) {
    resetForm(nextUser);
    setShowForm(false);
  }

  function pickFile(event) {
    const file = event.target.files?.[0];
    setError("");
    setAvatarUrl("");
    setAvatarData("");
    setAvatarName("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setError("Ukuran gambar maksimal 1 MB.");
      return;
    }
    setAvatarName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAvatarData(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => setError("Gambar gagal dibaca.");
    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("bio", bio.trim());
    formData.set("instagram", links.instagram.trim());
    formData.set("behance", links.behance.trim());
    formData.set("website", links.website.trim());
    formData.set("avatarUrl", avatarUrl.trim());
    const fileInput = event.currentTarget.querySelector('input[name="avatar"]');
    if (fileInput?.files?.[0]) formData.set("avatar", fileInput.files[0]);

    const result = await updateProfile(formData);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }

    setUser(result.user);
    notifySessionChange();
    notify("Profil disimpan.", "success");
    closeForm(result.user);
  }

  const preview = avatarData || avatarUrl.trim() || user?.avatar || "";

  return (
    <>
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Profil.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Kelola informasi profil publik Anda.
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 border hairline bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Foto profil" className="avatar h-16 w-16" />
          ) : (
            <div className="avatar grid h-16 w-16 place-items-center bg-ink/5 text-[12px] text-ink/50">
              Foto
            </div>
          )}
          <div>
            <p className="text-[15px] font-semibold">{user?.name || "Nama tampilan"}</p>
            <p className="label mt-1 text-ink/55">@{user?.username ?? "kreator"}</p>
          </div>
        </div>
        <button type="button" onClick={openForm} className="btn btn-outline btn-sm">Edit profil</button>
      </section>

      <Modal open={showForm} onClose={closeForm} title="Edit profil" subtitle="Member" maxWidth="max-w-3xl">
        <form onSubmit={saveProfile} className="space-y-5">
          <label className="block">
            <span className="label">Nama tampilan</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama tampilan" className="field mt-2" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Upload foto profil (maksimal 1 MB)</span>
              <input type="file" name="avatar" accept="image/*" onChange={pickFile} className="field mt-2" />
              <span className="label mt-2 block text-ink/55">
                {avatarName || "Mengisi kolom URL akan mengganti file yang dipilih."}
              </span>
            </label>
            <label className="block">
              <span className="label">Atau URL foto profil</span>
              <input
                type="text"
                value={avatarUrl}
                onChange={(event) => {
                  setAvatarUrl(event.target.value);
                  setAvatarData("");
                  setAvatarName("");
                  setError("");
                }}
                placeholder="https://..."
                className="field mt-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Bio</span>
            <textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Ceritakan tentang diri dan karya Anda" className="field mt-2" />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            {["instagram", "behance", "website"].map((key) => (
              <label key={key} className="block">
                <span className="label capitalize">{key}</span>
                <input
                  type="text"
                  value={links[key]}
                  onChange={(event) => setLinks((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder="tautan"
                  className="field mt-2"
                />
              </label>
            ))}
          </div>

          {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-ink btn-sm">{saving ? "Menyimpan..." : "Simpan profil"}</button>
          </div>
        </form>
      </Modal>

      <section className="space-y-4 border hairline bg-white p-5 sm:p-6">
        <div>
          <div className="label text-wine">Member</div>
          <h2 className="font-display mt-3 text-[28px] leading-none">Kreator yang saya ikuti.</h2>
        </div>
        {following.length === 0 ? (
          <div className="border border-dashed border-ink/20 p-6 text-center text-[14px] text-ink/55">
            Belum mengikuti kreator.
          </div>
        ) : (
          <div className="space-y-2">
            {following.map((followed) => (
              <div key={followed.id} className="flex items-center justify-between gap-3 border hairline p-3">
                <div>
                  <p className="text-[14px] font-semibold">{followed.name}</p>
                  <p className="label mt-1 text-ink/55">@{followed.username}</p>
                </div>
                <Link href={`/creator/${followed.dbId}`} className="btn btn-outline btn-sm">
                  Lihat profil
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
