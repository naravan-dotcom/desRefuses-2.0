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
  const [selectedId, setSelectedId] = useState(null);
  const [winnerDraft, setWinnerDraft] = useState({ first: null, second: null, third: null });

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

  const selected = selectedId
    ? challenges.find((item) => item.id === selectedId) ?? null
    : null;

  const selectedEntries = useMemo(() => {
    if (!selected) return [];
    return db.submissions
      .filter((item) => item.challengeId === selected.id)
      .map((submission) => ({
        submission,
        artwork: db.artworks.find((item) => item.id === submission.artworkId) ?? null,
        submitter: db.users.find((item) => item.id === submission.userId) ?? null,
      }))
      .filter((entry) => entry.artwork);
  }, [db, selected]);

  const winnerOptions = useMemo(() => {
    const entriesByArtwork = new Map();
    selectedEntries.forEach((entry) => {
      if (entry.artwork && !entriesByArtwork.has(entry.artwork.id)) {
        entriesByArtwork.set(entry.artwork.id, entry);
      }
    });
    return [...entriesByArtwork.values()];
  }, [selectedEntries]);

  const usedWinnerArtworkIds = useMemo(() => {
    const used = new Set();
    Object.keys(winnerDraft).forEach((key) => {
      const artworkId = winnerDraft[key];
      if (artworkId) used.add(artworkId);
    });
    return used;
  }, [winnerDraft]);

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

  function openManage(id) {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setSelectedId(id);
    const target = db.challenges.find((item) => item.id === id);
    setWinnerDraft({
      first: target?.winners?.first ?? null,
      second: target?.winners?.second ?? null,
      third: target?.winners?.third ?? null,
    });
  }

  function setWinner(key, artworkId) {
    setWinnerDraft((current) => ({ ...current, [key]: artworkId }));
  }

  function saveWinners() {
    if (!selected) return;
    if (getStatus(selected) !== "ended") {
      setError("Pemilihan pemenang hanya dibuka setelah tanggal selesai.");
      return;
    }
    const assigned = [winnerDraft.first, winnerDraft.second, winnerDraft.third].filter(Boolean);
    if (assigned.length !== new Set(assigned).size) {
      setError("Satu karya hanya boleh dipilih untuk satu peringkat.");
      return;
    }
    const next = loadDb();
    const target = next.challenges.find((item) => item.id === selected.id);
    if (!target) {
      setError("Tantangan tidak ditemukan.");
      return;
    }
    target.winners = {
      first: winnerDraft.first,
      second: winnerDraft.second,
      third: winnerDraft.third,
    };
    saveDb(next);
    setDb(next);
    setNotice("Pemenang berhasil disimpan.");
  }

  const statusLabels = {
    active: "Aktif",
    upcoming: "Mendatang",
    ended: "Selesai",
  };

  const winnerRanks = [
    { key: "first", label: "Juara 1" },
    { key: "second", label: "Juara 2" },
    { key: "third", label: "Juara 3" },
  ];

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
                            onClick={() => openManage(challenge.id)}
                            className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
                          >
                            Submisi
                          </button>
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

      {selected && (
        <section className="space-y-5 border border-ink/15 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Kurator
              </p>
              <h2 className="text-xl font-semibold">Kelola submisi</h2>
              <p className="text-sm text-ink/55">{selected.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
                {statusLabels[getStatus(selected)]}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="border border-ink/20 px-3 py-1.5 text-xs text-ink/60 hover:border-ink"
              >
                Tutup
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              Galeri partisipan
            </p>
            {selectedEntries.length === 0 ? (
              <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/45">
                Belum ada karya yang disubmit.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {selectedEntries.map((entry) => (
                  <article key={entry.submission.id} className="border border-ink/15 bg-white">
                    <div className="aspect-[4/5] overflow-hidden bg-ink/5">
                      <img
                        src={entry.artwork.image}
                        alt={entry.artwork.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium leading-snug">
                        {entry.artwork.title}
                      </h3>
                      <p className="mt-1 text-xs text-ink/55">
                        {entry.submitter?.name ?? "Kreator"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {getStatus(selected) === "ended" ? (
            <div className="space-y-4 border-t border-ink/10 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    Pemenang
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">Pilih pemenang</h3>
                </div>
                <button
                  type="button"
                  onClick={saveWinners}
                  className="bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:bg-brand"
                >
                  Simpan pemenang
                </button>
              </div>
              <p className="text-xs text-ink/50">
                Challenge sudah berakhir. Pilih maksimal tiga karya sebagai pemenang.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {winnerRanks.map((rank) => {
                  const assignedArtworkId = winnerDraft[rank.key];
                  const options = winnerOptions
                    .filter(
                      (entry) =>
                        entry.artwork &&
                        (assignedArtworkId === entry.artwork.id ||
                          !usedWinnerArtworkIds.has(entry.artwork.id)),
                    )
                    .map((entry) => ({
                      artworkId: entry.artwork.id,
                      title: entry.artwork.title,
                    }));

                  return (
                    <label key={rank.key} className="block space-y-2 text-xs text-ink/60">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-ink/45">
                        {rank.label}
                      </span>
                      <select
                        value={assignedArtworkId ?? ""}
                        onChange={(event) =>
                          setWinner(rank.key, event.target.value || null)
                        }
                        className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
                      >
                        <option value="">Belum dipilih</option>
                        {options.map((option) => (
                          <option key={option.artworkId} value={option.artworkId}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="border border-dashed border-ink/20 p-4 text-xs text-ink/55">
              Pemilihan pemenang dibuka setelah tanggal selesai.
            </p>
          )}
        </section>
      )}
    </>
  );
}
