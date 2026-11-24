"use client";

import { useEffect, useState } from "react";
import { getSessionId, loadDb, saveDb } from "@/lib/local-data";
import { notifySessionChange } from "@/lib/use-session";

const MAX_FILE_SIZE = 1024 * 1024;

export default function DashboardProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarData, setAvatarData] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [reading, setReading] = useState(false);
  const [links, setLinks] = useState({
    instagram: "",
    behance: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const db = loadDb();
      const current = db.users.find((item) => item.id === getSessionId());
      if (!current) return;
      setUser(current);
      setName(current.name ?? "");
      setBio(current.bio ?? "");
      setLinks({
        instagram: current.links?.instagram ?? "",
        behance: current.links?.behance ?? "",
        website: current.links?.website ?? "",
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function pickFile(event) {
    const file = event.target.files?.[0];
    setError("");
    setNotice("");
    setAvatarUrl("");
    setAvatarData("");
    setAvatarName("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran gambar maksimal 1 MB.");
      return;
    }

    setAvatarName(file.name);
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarData(typeof reader.result === "string" ? reader.result : "");
      setReading(false);
    };
    reader.onerror = () => {
      setError("Gambar gagal dibaca.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  }

  function saveProfile(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanName = name.trim();
    if (!user || user.role !== "member") {
      setError("Hanya Member yang bisa mengelola profil.");
      return;
    }
    if (!cleanName) {
      setError("Nama tampilan wajib diisi.");
      return;
    }
    if (reading) {
      setError("Gambar belum selesai dibaca.");
      return;
    }

    const next = loadDb();
    const target = next.users.find((item) => item.id === user.id);
    if (!target) {
      setError("Akun tidak ditemukan.");
      return;
    }

    target.name = cleanName;
    target.bio = bio.trim();
    target.links = {
      instagram: links.instagram.trim(),
      behance: links.behance.trim(),
      website: links.website.trim(),
    };
    const nextAvatar = avatarData || avatarUrl.trim();
    if (nextAvatar) target.avatar = nextAvatar;

    saveDb(next);
    notifySessionChange();
    setUser(target);
    setAvatarData("");
    setAvatarName("");
    setNotice("Profil disimpan.");
  }

  const preview = avatarData || avatarUrl.trim() || user?.avatar || "";

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola informasi profil publik Anda.
        </p>
      </header>

      <form
        onSubmit={saveProfile}
        className="space-y-4 border border-ink/15 bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-4">
          {preview ? (
            <img
              src={preview}
              alt="Foto profil"
              className="h-16 w-16 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center border border-ink/15 bg-ink/5 text-xs text-ink/40">
              Foto
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{name || "Nama tampilan"}</p>
            <p className="mt-1 text-xs text-ink/50">@{user?.username ?? "kreator"}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">Nama tampilan</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama tampilan"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-ink/60">
              Upload foto profil (maksimal 1 MB)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={pickFile}
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
            <span className="mt-1 block text-xs text-ink/45">
              {avatarName || "Mengisi kolom URL akan mengganti file yang dipilih."}
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Atau URL foto profil</span>
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
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">Bio</span>
          <textarea
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Ceritakan tentang diri dan karya Anda"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          {["instagram", "behance", "website"].map((key) => (
            <label key={key} className="block">
              <span className="text-xs font-medium capitalize text-ink/60">
                {key}
              </span>
              <input
                type="text"
                value={links[key]}
                onChange={(event) =>
                  setLinks((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                placeholder="tautan"
                className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
        >
          Simpan profil
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
