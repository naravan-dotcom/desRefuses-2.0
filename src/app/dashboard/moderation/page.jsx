"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { dismissReport, listModerationGroups, takeDown } from "./actions";

function artCode(id) {
  const digits = String(id ?? "").replace(/\D/g, "");
  return digits ? `No. ${digits.padStart(2, "0")}` : `#${id}`;
}

function timeId(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildForm(type, targetId) {
  const formData = new FormData();
  formData.set("type", type);
  formData.set("targetId", String(targetId));
  return formData;
}

export default function DashboardModerationPage() {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState("all");
  const [activeGroup, setActiveGroup] = useState(null);
  const [takedownGroup, setTakedownGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    const result = await listModerationGroups();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setGroups(result.groups);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, []);

  useEffect(() => {
    if (error) notify(error, "error");
  }, [error]);

  const artworkCount = groups.filter((group) => group.type === "artwork").length;
  const commentCount = groups.filter((group) => group.type === "comment").length;
  const reportCount = groups.reduce((sum, group) => sum + group.reports.length, 0);
  const visibleGroups = groups.filter((group) => filter === "all" || group.type === filter);
  const mostReported = [...groups].sort((a, b) => b.reports.length - a.reports.length)[0];

  async function dismiss(group) {
    const result = await dismissReport(buildForm(group.type, group.targetId));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setActiveGroup(null);
    notify("Laporan diabaikan.", "success");
    await refresh();
  }

  async function takeDownGroup() {
    const group = takedownGroup;
    if (!group) return;
    setTakedownGroup(null);
    setActiveGroup(null);
    const result = await takeDown(buildForm(group.type, group.targetId));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Konten berhasil dihapus.", "success");
    await refresh();
  }

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel admin</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Moderasi</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Tinjau laporan komunitas dan ambil tindakan berdasarkan etika, bukan selera.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border hairline bg-white p-5">
          <div className="label text-ink/65">Laporan masuk</div>
          <p className="font-display mt-2 text-[34px] leading-none">{reportCount}</p>
          <div className="mt-2 text-[13px] text-ink/60">dari {groups.length} konten</div>
        </div>
        <div className="border hairline bg-white p-5">
          <div className="label text-ink/65">Karya dilaporkan</div>
          <p className="font-display mt-2 text-[34px] leading-none text-wine">{artworkCount}</p>
          <div className="mt-2 text-[13px] text-ink/60">menunggu tinjauan</div>
        </div>
        <div className="border hairline bg-white p-5">
          <div className="label text-ink/65">Komentar dilaporkan</div>
          <p className="font-display mt-2 text-[34px] leading-none">{commentCount}</p>
          <div className="mt-2 text-[13px] text-ink/60">menunggu tinjauan</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "Semua"],
                ["artwork", "Karya"],
                ["comment", "Komentar"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`chip ${filter === value ? "active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="label text-ink/55">{visibleGroups.length} antrean</span>
          </div>

          {loading ? (
            <div className="mt-5 border border-dashed border-ink/20 p-10 text-center text-[14px] text-ink/55">
              Memuat antrean moderasi...
            </div>
          ) : visibleGroups.length ? (
            <div className="mt-5 space-y-3">
              {visibleGroups.map((group) => {
                const preview = group.artwork ?? group.parentArtwork;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveGroup(group)}
                    className="flex w-full items-center gap-4 border hairline bg-white p-3 text-left transition-colors hover:bg-canvas"
                  >
                    <img src={preview?.image} alt="" className="h-16 w-20 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="status status-pending">{group.type === "artwork" ? "Karya" : "Komentar"}</span>
                        <span className="label text-ink/45">{artCode(group.targetId)}</span>
                      </div>
                      <h3 className="font-display mt-2 truncate text-[20px] leading-tight">
                        {group.artwork?.title ?? (group.comment ? `Komentar oleh ${group.author?.name ?? "Member"}` : "Konten tidak ditemukan")}
                      </h3>
                      <p className="mt-1 truncate text-[13px] text-ink/60">
                        {group.comment?.text ?? group.artwork?.description ?? "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-[26px] leading-none text-wine">{group.reports.length}</div>
                      <div className="label mt-1 text-ink/55">laporan</div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[12px] text-ink/40" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-ink/20 p-10 text-center">
              <i className="fa-regular fa-circle-check text-2xl text-ink/40" />
              <h3 className="font-display mt-4 text-[24px]">Antrean bersih</h3>
              <p className="mt-2 text-sm text-ink/60">Belum ada laporan yang perlu ditinjau.</p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="border hairline bg-white p-5">
            <p className="label text-ink/65">Paling banyak dilaporkan</p>
            {mostReported ? (
              <>
                <img
                  src={mostReported.artwork?.image ?? mostReported.parentArtwork?.image}
                  alt=""
                  className="art-media mt-4 aspect-[4/3] w-full object-cover"
                />
                <h3 className="font-display mt-4 text-[22px] leading-tight">
                  {mostReported.artwork?.title ?? "Komentar dilaporkan"}
                </h3>
                <div className="mt-3 flex items-center justify-between border-t hairline pt-3 text-[13px] text-ink/65">
                  <span>{mostReported.reports.length} laporan</span>
                  <span>{mostReported.author?.name ?? "Kreator"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGroup(mostReported)}
                  className="btn btn-outline btn-sm mt-5 w-full"
                >
                  Tinjau sekarang
                </button>
              </>
            ) : (
              <p className="mt-4 text-[14px] text-ink/55">Belum ada laporan masuk.</p>
            )}
          </div>
          <div className="border-t hairline mt-6 pt-4 text-[12px] leading-relaxed text-ink/55">
            Tindakan moderasi bersifat permanen. Abaikan laporan jika konten tidak melanggar etika komunitas.
          </div>
        </aside>
      </div>

      <Modal
        open={Boolean(activeGroup)}
        onClose={() => setActiveGroup(null)}
        title={activeGroup?.type === "comment" ? "Tinjau komentar" : "Tinjau karya"}
        subtitle="Panel admin"
        maxWidth="max-w-3xl"
      >
        {activeGroup && (
          <>
            <p className="text-[14px] leading-relaxed text-ink/65">
              {activeGroup.reports.length} laporan masuk untuk {activeGroup.type === "artwork" ? "karya" : "komentar"} ini.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <img
                src={activeGroup.artwork?.image ?? activeGroup.parentArtwork?.image}
                alt=""
                className="art-media aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="sm:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="status status-pending">{activeGroup.type === "artwork" ? "Karya" : "Komentar"}</span>
                <span className="label text-ink/45">{artCode(activeGroup.targetId)}</span>
              </div>
              <h3 className="font-display mt-3 text-[26px] leading-tight">
                {activeGroup.artwork?.title ?? `Komentar oleh ${activeGroup.author?.name ?? "Member"}`}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
                {activeGroup.artwork
                  ? activeGroup.artwork.description
                  : activeGroup.comment?.text ?? "Komentar tidak ditemukan."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-ink/60">
                <span>Oleh <span className="font-medium text-ink">{activeGroup.author?.name ?? "Kreator"}</span></span>
                {activeGroup.category && <span>· {activeGroup.category.name}</span>}
                {activeGroup.href && (
                  <Link href={activeGroup.href} target="_blank" className="label inline-flex items-center gap-2 text-wine hover:underline">
                    Lihat konten <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                  </Link>
                )}
              </div>
              <div className="mt-6 border-t hairline pt-4">
                <div className="label text-ink/65">Alasan laporan</div>
                <div className="mt-3 space-y-3">
                  {activeGroup.reports.map((report) => (
                    <div key={report.id} className="border-l-2 border-wine bg-wine/5 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-[13px]">{report.reason}</span>
                        <span className="label text-ink/50">{timeId(report.createdAt)}</span>
                      </div>
                      {report.detail && <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{report.detail}</p>}
                      <p className="label mt-1 text-ink/45">oleh {report.reporterName}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTakedownGroup(activeGroup)}
                  className="btn btn-ink btn-sm"
                >
                  Hapus konten
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(activeGroup)}
                  className="btn btn-outline btn-sm"
                >
                  Abaikan laporan
                </button>
                <Link href={activeGroup.href ?? "#"} className="btn btn-outline btn-sm">
                  Buka karya
                </Link>
              </div>
            </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(takedownGroup)}
        onClose={() => setTakedownGroup(null)}
        onConfirm={takeDownGroup}
        title="Hapus konten"
        subtitle="Panel admin"
        message="Konten akan dihapus permanen beserta data terkait. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, hapus"
        danger
      />
    </>
  );
}
