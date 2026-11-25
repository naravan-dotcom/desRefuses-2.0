"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Modal from "@/components/ui/modal";
import StatusBadge from "@/components/ui/status-badge";
import { notify } from "@/components/ui/toast";
import { buildForm } from "@/app/challenges/form-utils";
import {
  formatDate,
  getChallengeStatus,
  nextDateInput,
  statusClasses,
  statusLabels,
} from "@/lib/challenge-status";
import { IMAGE_ACCEPT, IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/upload";
import {
  createChallenge,
  deleteChallenge,
  listCuratorChallengeData,
  saveWinners,
  updateChallenge,
} from "./actions";

const emptyForm = {
  title: "",
  description: "",
  rules: "",
  prize: "",
  startDate: "",
  endDate: "",
};

const winnerRanks = [
  { key: "first", label: "Juara 1" },
  { key: "second", label: "Juara 2" },
  { key: "third", label: "Juara 3" },
];

export default function DashboardChallengesClient({ initial, initialCreate = false, initialFocus = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChallenges = initial.ok ? initial.challenges : [];
  const initialToday = initial.ok ? initial.today : new Date().toISOString().slice(0, 10);
  const focusedChallenge = initialFocus
    ? initialChallenges.find((item) => item.id === initialFocus) ?? null
    : null;
  const defaultWinners = { first: null, second: null, third: null };

  const [challenges, setChallenges] = useState(initialChallenges);
  const [entries, setEntries] = useState(initial.ok ? initial.entries : []);
  const [today, setToday] = useState(initialToday);
  const [error, setError] = useState(initial.ok ? "" : initial.error);
  const [showForm, setShowForm] = useState(initialCreate);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(
    initialCreate
      ? { ...emptyForm, startDate: initialToday, endDate: nextDateInput(initialToday) }
      : emptyForm,
  );
  const [bannerFile, setBannerFile] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [selectedId, setSelectedId] = useState(initialCreate ? null : initialFocus);
  const [winnerDraft, setWinnerDraft] = useState({
    ...(focusedChallenge?.winners ?? defaultWinners),
  });
  const [pending, setPending] = useState(false);

  async function refresh() {
    const result = await listCuratorChallengeData();
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    setChallenges(result.challenges);
    setEntries(result.entries);
    setToday(result.today);
  }

  function clearQuery() {
    if (searchParams.get("create") || searchParams.get("challenge")) {
      router.replace("/dashboard/challenges", { scroll: false });
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setBannerFile(null);
    clearQuery();
  }

  function pickBanner(event) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) {
      setBannerFile(null);
      return;
    }
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setBannerFile(null);
      setError("Banner harus berupa JPG, PNG, WEBP, atau GIF.");
      notify("Banner harus berupa JPG, PNG, WEBP, atau GIF.", "error");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setBannerFile(null);
      setError("Ukuran banner maksimal 1 MB.");
      notify("Ukuran banner maksimal 1 MB.", "error");
      return;
    }
    setBannerFile(file);
  }

  function startCreate() {
    setError("");
    setConfirmingId(null);
    setSelectedId(null);
    setEditingId(null);
    setForm({ ...emptyForm, startDate: today, endDate: nextDateInput(today) });
    setBannerFile(null);
    setShowForm(true);
    router.replace("/dashboard/challenges?create=1", { scroll: false });
  }

  function startEdit(challenge) {
    setError("");
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
    });
    setBannerFile(null);
    setShowForm(true);
    clearQuery();
  }

  async function saveChallenge(event) {
    event.preventDefault();
    if (pending) return;
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.rules.trim() || !form.prize.trim()) {
      setError("Semua field tantangan wajib diisi.");
      notify("Semua field tantangan wajib diisi.", "error");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Tanggal mulai dan selesai wajib diisi.");
      notify("Tanggal mulai dan selesai wajib diisi.", "error");
      return;
    }
    if (!editingId && !bannerFile) {
      setError("Pilih file banner terlebih dahulu.");
      notify("Pilih file banner terlebih dahulu.", "error");
      return;
    }

    const editing = challenges.find((item) => item.id === editingId) ?? null;
    const values = {
      title: form.title,
      description: form.description,
      rules: form.rules,
      prize: form.prize,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    if (editing) {
      values.id = editing.id;
      values.existingBanner = editing.banner;
    }

    setPending(true);
    const result = editing
      ? await updateChallenge(buildForm(values, bannerFile))
      : await createChallenge(buildForm(values, bannerFile));
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    resetForm();
    notify(editing ? "Tantangan diperbarui." : "Tantangan berhasil dibuat.", "success");
    await refresh();
  }

  async function removeChallenge() {
    if (!confirmingId || pending) return;
    setError("");
    setPending(true);
    const result = await deleteChallenge(buildForm({ id: confirmingId }));
    setPending(false);
    setConfirmingId(null);
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    if (selectedId === confirmingId) setSelectedId(null);
    clearQuery();
    notify("Tantangan berhasil dihapus beserta submisinya.", "success");
    await refresh();
  }

  function openManage(id) {
    setError("");
    setConfirmingId(null);
    setShowForm(false);
    setSelectedId(id);
    const target = challenges.find((item) => item.id === id);
    setWinnerDraft({ ...(target?.winners ?? { first: null, second: null, third: null }) });
    router.replace(`/dashboard/challenges?challenge=${id}`, { scroll: false });
  }

  function closeManage() {
    setSelectedId(null);
    clearQuery();
  }

  const selected = selectedId ? challenges.find((item) => item.id === selectedId) ?? null : null;
  const confirming = confirmingId ? challenges.find((item) => item.id === confirmingId) ?? null : null;
  const selectedEntries = useMemo(
    () => (selected ? entries.filter((entry) => entry.challengeId === selected.id) : []),
    [entries, selected],
  );
  const usedWinnerArtworkIds = useMemo(() => {
    const used = new Set();
    Object.values(winnerDraft).forEach((artworkId) => {
      if (artworkId) used.add(artworkId);
    });
    return used;
  }, [winnerDraft]);

  async function saveChallengeWinners() {
    if (!selected || pending) return;
    setError("");
    if (getChallengeStatus(selected, today) !== "ended") {
      setError("Pemilihan pemenang hanya dibuka setelah tanggal selesai.");
      notify("Pemilihan pemenang hanya dibuka setelah tanggal selesai.", "error");
      return;
    }
    setPending(true);
    const result = await saveWinners(
      buildForm({
        challengeId: selected.id,
        first: winnerDraft.first ?? "",
        second: winnerDraft.second ?? "",
        third: winnerDraft.third ?? "",
      }),
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    notify("Pemenang berhasil disimpan.", "success");
    await refresh();
  }

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
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
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
                onChange={(event) => setForm((current) => ({ ...current, prize: event.target.value }))}
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
                min={editingId && form.startDate < today ? form.startDate : today}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Tanggal selesai</span>
              <input
                type="date"
                required
                value={form.endDate}
                min={nextDateInput(form.startDate || today)}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
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
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
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
              onChange={(event) => setForm((current) => ({ ...current, rules: event.target.value }))}
              placeholder="Aturan tantangan"
              className="field mt-2"
            />
          </label>

          <label className="block">
            <span className="label">Banner challenge</span>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={pickBanner}
              className="field mt-2"
            />
            {bannerFile && <p className="label mt-2 text-ink/55">{bannerFile.name}</p>}
            {!bannerFile && editingId && (
              <img src={challenges.find((item) => item.id === editingId)?.banner} alt="" className="mt-3 h-24 w-40 object-cover" />
            )}
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="btn btn-outline btn-sm">Batal</button>
            <button type="submit" disabled={pending} className="btn btn-ink btn-sm">
              {pending ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Buat tantangan"}
            </button>
          </div>
        </form>
      </Modal>

      {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={removeChallenge}
        title="Hapus tantangan"
        subtitle="Kurator"
        message={confirming ? `Hapus "${confirming.title}"? Semua submisi untuk tantangan ini ikut dihapus.` : ""}
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
                  const status = getChallengeStatus(challenge, today);
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
                      <td><StatusBadge className={statusClasses[status]}>{statusLabels[status]}</StatusBadge></td>
                      <td className="text-ink/65">{challenge.submissionCount}</td>
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
                <StatusBadge className={statusClasses[getChallengeStatus(selected, today)]}>
                  {statusLabels[getChallengeStatus(selected, today)]}
                </StatusBadge>
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
                    <article key={entry.id} className="art-card border hairline bg-white">
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
                        <p className="label mt-1 text-ink/55">{entry.submitterName}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {getChallengeStatus(selected, today) === "ended" ? (
              <div className="space-y-5 border-t hairline pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="label text-wine">Pemenang</div>
                    <h3 className="font-display mt-3 text-[28px] leading-none">Pilih pemenang.</h3>
                    <p className="mt-2 text-[14px] text-ink/65">
                      Challenge sudah berakhir. Pilih maksimal tiga karya sebagai pemenang.
                    </p>
                  </div>
                  <button type="button" onClick={saveChallengeWinners} disabled={pending} className="btn btn-ink btn-sm">
                    {pending ? "Menyimpan..." : "Simpan pemenang"}
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {winnerRanks.map((rank) => {
                    const assignedArtworkId = winnerDraft[rank.key];
                    const options = selectedEntries
                      .filter(
                        (entry) =>
                          assignedArtworkId === entry.artwork.id ||
                          !usedWinnerArtworkIds.has(entry.artwork.id),
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
                            setWinnerDraft((current) => ({ ...current, [rank.key]: event.target.value || null }))
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
