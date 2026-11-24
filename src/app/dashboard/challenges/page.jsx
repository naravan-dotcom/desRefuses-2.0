"use client";

import { useEffect, useMemo, useState } from "react";
import { isoNow, loadDb, saveDb, uid } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";
import { useSession } from "@/lib/use-session";

const MAX_FILE_SIZE = 1024 * 1024;
const emptyForm = {
  title: "",
  description: "",
  rules: "",
  prize: "",
  startDate: "",
  endDate: "",
  banner: "",
};

function getStatus(challenge) {
  const now = new Date();
  const start = new Date(`${challenge.startDate}T00:00:00`);
  const end = new Date(`${challenge.endDate}T23:59:59`);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function DashboardChallengesPage() {
  const { user } = useSession();
  const [db, setDb] = useState(() => createSeedDb());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const challenges = useMemo(() => {
    if (!user || user.role !== "curator") return [];
    return db.challenges.filter((item) => item.curatorId === user.id);
  }, [db, user]);

  const submissionCounts = useMemo(() => {
    return db.submissions.reduce((counts, submission) => {
      counts[submission.challengeId] = (counts[submission.challengeId] ?? 0) + 1;
      return counts;
    }, {});
  }, [db]);

  const confirming = confirmingId
    ? challenges.find((item) => item.id === confirmingId) ?? null
    : null;

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFileName("");
  }

  function pickBanner(event) {
    const file = event.target.files?.[0];
    setError("");
    setNotice("");

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File banner harus berupa gambar.");
      setFileName("");
      setForm((current) => ({ ...current, banner: "" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran banner maksimal 1 MB.");
      setFileName("");
      setForm((current) => ({ ...current, banner: "" }));
      return;
    }

    setFileName(file.name);
    setForm((current) => ({ ...current, banner: "" }));
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        banner: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => setError("Banner gagal dibaca.");
    reader.readAsDataURL(file);
  }

  function startCreate() {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setEditingId(null);
    setForm(emptyForm);
    setFileName("");
    setShowForm(true);
  }

  function startEdit(challenge) {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setEditingId(challenge.id);
    setForm({
      title: challenge.title,
      description: challenge.description,
      rules: challenge.rules,
      prize: challenge.prize,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      banner: challenge.banner,
    });
    setFileName("");
    setShowForm(true);
  }

  function saveChallenge(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!user || user.role !== "curator") {
      setError("Hanya akun Kurator yang bisa mengelola tantangan.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const rules = form.rules.trim();
    const prize = form.prize.trim();
    const startDate = form.startDate;
    const endDate = form.endDate;

    if (!title || !description || !rules || !prize || !startDate || !endDate || !form.banner) {
      setError("Semua field tantangan wajib diisi, termasuk banner.");
      return;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    const next = loadDb();
    if (editingId) {
      const target = next.challenges.find(
        (item) => item.id === editingId && item.curatorId === user.id,
      );
      if (!target) {
        setError("Tantangan tidak ditemukan.");
        return;
      }
      target.title = title;
      target.description = description;
      target.rules = rules;
      target.prize = prize;
      target.startDate = startDate;
      target.endDate = endDate;
      target.banner = form.banner;
      setNotice("Tantangan diperbarui.");
    } else {
      next.challenges.push({
        id: uid("ch"),
        curatorId: user.id,
        title,
        description,
        rules,
        prize,
        startDate,
        endDate,
        banner: form.banner,
        createdAt: isoNow(),
        winners: { first: null, second: null, third: null },
      });
      setNotice("Tantangan berhasil dibuat.");
    }

    saveDb(next);
    setDb(next);
    resetForm();
  }

  function deleteChallenge(id) {
    setError("");
    setNotice("");

    const next = loadDb();
    const target = next.challenges.find(
      (item) => item.id === id && item.curatorId === user?.id,
    );
    if (!target) return;

    next.submissions = next.submissions.filter(
      (item) => item.challengeId !== id,
    );
    next.challenges = next.challenges.filter((item) => item.id !== id);

    saveDb(next);
    setDb(next);
    setConfirmingId(null);
    setNotice("Tantangan berhasil dihapus beserta submisinya.");
  }

  const statusLabels = {
    active: "Aktif",
    upcoming: "Mendatang",
    ended: "Selesai",
  };

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Kurator
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Tantangan saya</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola tantangan yang Anda selenggarakan.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">{challenges.length} tantangan</p>
        <button
          type="button"
          onClick={startCreate}
          className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
        >
          Buat tantangan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveChallenge}
          className="space-y-4 border border-ink/15 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {editingId ? "Edit tantangan" : "Tantangan baru"}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
            >
              Batal
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-ink/60">
              Judul tantangan
              <input
                type="text"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Judul tantangan"
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              Hadiah
              <input
                type="text"
                required
                value={form.prize}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prize: event.target.value }))
                }
                placeholder="Hadiah tantangan"
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
              />
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              Tanggal mulai
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              Tanggal selesai
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs text-ink/60">
            Deskripsi
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi tantangan"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block space-y-1 text-xs text-ink/60">
            Aturan
            <textarea
              required
              rows={4}
              value={form.rules}
              onChange={(event) =>
                setForm((current) => ({ ...current, rules: event.target.value }))
              }
              placeholder="Aturan tantangan"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block space-y-1 text-xs text-ink/60">
            Banner (URL atau upload gambar)
            <input
              type="text"
              value={form.banner}
              onChange={(event) =>
                setForm((current) => ({ ...current, banner: event.target.value }))
              }
              placeholder="https://... atau data URL"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
            <input
              type="file"
              accept="image/*"
              onChange={pickBanner}
              className="mt-2 w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
            {fileName && (
              <p className="mt-1 text-[11px] text-ink/55">{fileName}</p>
            )}
          </label>

          <button
            type="submit"
            className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
          >
            {editingId ? "Simpan perubahan" : "Buat tantangan"}
          </button>
        </form>
      )}

      {error && (
        <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {notice && <p className="text-xs text-ink/55">{notice}</p>}

      {confirming && (
        <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <p>Hapus &quot;{confirming.title}&quot;? Submisinya ikut dihapus.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => deleteChallenge(confirming.id)}
              className="bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800"
            >
              Ya, hapus
            </button>
            <button
              type="button"
              onClick={() => setConfirmingId(null)}
              className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Tantangan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submisi</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {challenges.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/45">
                    Belum ada tantangan. Buat tantangan pertama Anda.
                  </td>
                </tr>
              ) : (
                challenges.map((challenge) => {
                  const status = getStatus(challenge);
                  const submissionCount = submissionCounts[challenge.id] ?? 0;

                  return (
                    <tr
                      key={challenge.id}
                      className="border-b border-ink/10 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-xs text-ink/50">{challenge.prize}</p>
                      </td>
                      <td className="px-4 py-3 text-ink/60">{statusLabels[status]}</td>
                      <td className="px-4 py-3 text-ink/60">{submissionCount}</td>
                      <td className="px-4 py-3 text-ink/60">
                        {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(challenge)}
                            className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setConfirmingId(challenge.id);
                            }}
                            className="border border-red-600/50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
