"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
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

const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

const statusClasses = {
  active: "status-live",
  upcoming: "status-upcoming",
  ended: "status-ended",
};

const winnerRanks = [
  { key: "first", label: "Juara 1" },
  { key: "second", label: "Juara 2" },
  { key: "third", label: "Juara 3" },
];

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [db, setDb] = useState(() => createSeedDb());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (error) notify(error, "error");
  }, [error]);

  useEffect(() => {
    if (notice) notify(notice, "success");
  }, [notice]);
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

  function clearQuery() {
    if (searchParams.get("create") || searchParams.get("challenge")) {
      router.replace("/dashboard/challenges", { scroll: false });
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFileName("");
    clearQuery();
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
    setSelectedId(null);
    setEditingId(null);
    setForm(emptyForm);
    setFileName("");
    setShowForm(true);
    router.replace("/dashboard/challenges?create=1", { scroll: false });
  }

  function startEdit(challenge) {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setSelectedId(null);
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
    clearQuery();
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
    if (selectedId === id) {
      setSelectedId(null);
      clearQuery();
    }
    setNotice("Tantangan berhasil dihapus beserta submisinya.");
  }

  function openManage(id) {
    setError("");
    setNotice("");
    setConfirmingId(null);
    setShowForm(false);
    setSelectedId(id);
    const target = db.challenges.find((item) => item.id === id);
    setWinnerDraft({
      first: target?.winners?.first ?? null,
      second: target?.winners?.second ?? null,
      third: target?.winners?.third ?? null,
    });
    router.replace(`/dashboard/challenges?challenge=${id}`, { scroll: false });
  }

  function closeManage() {
    setSelectedId(null);
    clearQuery();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.get("create") === "1") {
        setError("");
        setNotice("");
        setConfirmingId(null);
        setSelectedId(null);
        setEditingId(null);
        setForm(emptyForm);
        setFileName("");
        setShowForm(true);
      }
      const challengeId = searchParams.get("challenge");
      if (challengeId) {
        setError("");
        setNotice("");
        setConfirmingId(null);
        setShowForm(false);
        setSelectedId(challengeId);
        const target = db.challenges.find((item) => item.id === challengeId);
        setWinnerDraft({
          first: target?.winners?.first ?? null,
          second: target?.winners?.second ?? null,
          third: target?.winners?.third ?? null,
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams, db.challenges]);

  return (
    <>
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Kurator
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Tantangan saya.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Kelola tantangan yang Anda selenggarakan, submisi yang masuk, dan pemenangnya.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="label text-ink/65">{challenges.length} tantangan</p>
        <button type="button" onClick={startCreate} className="btn btn-ink btn-sm">
          <i className="fa-solid fa-plus" /> Buat tantangan
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={resetForm}
        subtitle={editingId ? "Perbarui tantangan" : "Tantangan baru"}
        title={editingId ? "Edit tantangan" : "Buat tantangan"}
      >
        <form onSubmit={saveChallenge} className="space-y-5">

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Judul tantangan</span>
              <input
                type="text"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Judul tantangan"
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Hadiah</span>
              <input
                type="text"
                required
                value={form.prize}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prize: event.target.value }))
                }
                placeholder="Hadiah tantangan"
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Tanggal mulai</span>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Tanggal selesai</span>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                className="field mt-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Deskripsi</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi tantangan"
              className="field mt-2"
            />
          </label>

          <label className="block">
            <span className="label">Aturan</span>
            <textarea
              required
              rows={4}
              value={form.rules}
              onChange={(event) =>
                setForm((current) => ({ ...current, rules: event.target.value }))
              }
              placeholder="Aturan tantangan"
              className="field mt-2"
            />
          </label>

          <label className="block">
            <span className="label">Banner (URL atau upload gambar)</span>
            <input
              type="text"
              value={form.banner}
              onChange={(event) =>
                setForm((current) => ({ ...current, banner: event.target.value }))
              }
              placeholder="https://... atau data URL"
              className="field mt-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={pickBanner}
              className="field mt-3"
            />
            {fileName && <p className="label mt-2 text-ink/55">{fileName}</p>}
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" className="btn btn-ink btn-sm">
              {editingId ? "Simpan perubahan" : "Buat tantangan"}
            </button>
          </div>
        </form>
      </Modal>

      {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
      {notice && <p className="label text-wine">{notice}</p>}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={() => deleteChallenge(confirming.id)}
        title="Hapus tantangan"
        subtitle="Kurator"
        message={
          confirming
            ? `Hapus "${confirming.title}"? Semua submisi untuk tantangan ini ikut dihapus.`
            : ""
        }
        danger
        confirmLabel="Ya, hapus"
      />

      <div className="border hairline bg-white">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tantangan</th>
                <th>Status</th>
                <th>Submisi</th>
                <th>Periode</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {challenges.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink/55">
                    Belum ada tantangan. Buat tantangan pertama Anda.
                  </td>
                </tr>
              ) : (
                challenges.map((challenge) => {
                  const status = getStatus(challenge);
                  const submissionCount = submissionCounts[challenge.id] ?? 0;

                  return (
                    <tr key={challenge.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img src={challenge.banner} alt="" className="h-12 w-16 object-cover" />
                          <div>
                            <p className="font-semibold">{challenge.title}</p>
                            <p className="label mt-1 text-ink/55">{challenge.prize}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`status ${statusClasses[status]}`}>{statusLabels[status]}</span></td>
                      <td className="text-ink/65">{submissionCount}</td>
                      <td className="text-ink/65">
                        {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openManage(challenge.id)} className="btn btn-outline btn-sm">
                            Submisi
                          </button>
                          <button type="button" onClick={() => startEdit(challenge)} className="btn btn-outline btn-sm">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setConfirmingId(challenge.id);
                            }}
                            className="btn btn-outline btn-sm !border-wine/40 !text-wine"
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

      <Modal
        open={Boolean(selected)}
        onClose={closeManage}
        title="Kelola submisi."
        subtitle="Kurator"
        maxWidth="max-w-5xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline pb-5">
              <p className="text-[14px] text-ink/65">{selected.title}</p>
              <div className="flex items-center gap-3">
                <span className={`status ${statusClasses[getStatus(selected)]}`}>
                  {statusLabels[getStatus(selected)]}
                </span>
                <button type="button" onClick={closeManage} className="btn btn-outline btn-sm">Tutup</button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-4">
                <p className="label text-ink/65">Periode</p>
                <p className="mt-2 text-[14px] font-semibold">
                  {formatDate(selected.startDate)} — {formatDate(selected.endDate)}
                </p>
              </div>
              <div className="card p-4">
                <p className="label text-ink/65">Submisi masuk</p>
                <p className="mt-2 text-[14px] font-semibold">{selectedEntries.length} karya</p>
              </div>
              <div className="card p-4">
                <p className="label text-ink/65">Pemenang</p>
                <p className="mt-2 text-[14px] font-semibold">
                  {winnerRanks.filter((rank) => selected.winners?.[rank.key]).length} dari 3 ditandai
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="label text-ink/65">Galeri partisipan</p>
              {selectedEntries.length === 0 ? (
                <div className="border border-dashed border-ink/20 p-8 text-center text-[14px] text-ink/55">
                  Belum ada karya yang disubmit.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {selectedEntries.map((entry) => (
                    <article key={entry.submission.id} className="art-card border hairline bg-white">
                      <div className="art-media">
                        <img
                          src={entry.artwork.image}
                          alt={entry.artwork.title}
                          loading="lazy"
                          className="art-img aspect-[4/5] w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-[14px] font-semibold leading-snug">{entry.artwork.title}</h3>
                        <p className="label mt-1 text-ink/55">{entry.submitter?.name ?? "Kreator"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {getStatus(selected) === "ended" ? (
              <div className="space-y-5 border-t hairline pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="label text-wine">Pemenang</div>
                    <h3 className="font-display mt-3 text-[28px] leading-none">Pilih pemenang.</h3>
                    <p className="mt-2 text-[14px] text-ink/65">
                      Challenge sudah berakhir. Pilih maksimal tiga karya sebagai pemenang.
                    </p>
                  </div>
                  <button type="button" onClick={saveWinners} className="btn btn-ink btn-sm">
                    Simpan pemenang
                  </button>
                </div>
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
                      <label key={rank.key} className="block">
                        <span className="label text-ink/65">{rank.label}</span>
                        <select
                          value={assignedArtworkId ?? ""}
                          onChange={(event) =>
                            setWinner(rank.key, event.target.value || null)
                          }
                          className="field mt-2"
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
              <div className="border border-dashed border-ink/20 p-4 text-[14px] text-ink/55">
                Pemilihan pemenang dibuka setelah tanggal selesai.
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
