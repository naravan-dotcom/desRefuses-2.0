"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { isoNow, loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function DashboardCuratorsPage() {
  const [db, setDb] = useState(() => createSeedDb());
  const [confirmReject, setConfirmReject] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const curators = useMemo(
    () => db.users.filter((item) => item.role === "curator"),
    [db],
  );
  const pending = curators.filter((item) => item.status === "pending");
  const history = curators.filter((item) => item.status !== "pending");

  function decide(id, status, suspensionReason = "") {
    const next = loadDb();
    const target = next.users.find(
      (item) => item.id === id && item.role === "curator",
    );
    if (!target) return;
    target.status = status;
    if (status === "suspended") {
      target.suspensionReason = suspensionReason.trim();
      target.suspendedAt = isoNow();
    } else {
      target.suspensionReason = "";
      target.suspendedAt = null;
    }
    saveDb(next);
    setDb(next);
    setConfirmReject(null);
    setSuspendTarget(null);
    setReason("");
    notify(
      status === "suspended"
        ? "Akun curator berhasil ditangguhkan."
        : status === "approved"
          ? "Akun curator berhasil diaktifkan kembali."
          : "Pengajuan curator ditolak.",
      "success",
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b hairline pb-5">
        <div>
          <p className="label text-wine">Panel admin</p>
          <h1 className="font-display mt-2 text-3xl lg:text-4xl">Verifikasi kurator</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
            Tinjau dan setujui pendaftaran akun kurator sebelum mereka dapat membuat challenge.
          </p>
        </div>
        <span className="status status-pending">{pending.length} pending</span>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="label text-ink/65">Antrean verifikasi · Menunggu keputusan</p>
        </div>

        {pending.length === 0 ? (
          <div className="border-t border-b hairline px-6 py-12 text-center">
            <i className="fa-solid fa-user-check text-2xl text-ink/35" />
            <h3 className="font-display mt-3 text-xl font-bold">Tidak ada pengajuan baru</h3>
            <p className="mt-1 text-[14px] text-ink/60">Semua pendaftaran kurator sudah ditinjau.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((curator) => (
              <div key={curator.id} className="flex flex-col justify-between border hairline bg-white p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {curator.avatar ? (
                        <img src={curator.avatar} alt="" className="avatar h-10 w-10 shrink-0" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/10 font-display text-sm">
                          {(curator.name ?? "C").charAt(0)}
                        </span>
                      )}
                      <div>
                        <h3 className="font-display text-xl leading-tight">{curator.name}</h3>
                        <p className="mt-0.5 text-[12px] text-ink/60">
                          @{curator.username} • {curator.email}
                        </p>
                      </div>
                    </div>
                    <span className="status status-pending">Pending</span>
                  </div>
                  <p className="mt-4 text-[14px] leading-relaxed text-ink/75">
                    {curator.bio || "Belum menyertakan bio."}
                  </p>
                  <p className="mt-3 text-[12px] font-label text-ink/55">
                    Diajukan {formatDate(curator.joinedAt)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t hairline pt-4">
                  <button
                    type="button"
                    onClick={() => decide(curator.id, "approved")}
                    className="btn btn-ink btn-sm w-full"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReject(curator)}
                    className="btn btn-outline btn-sm w-full"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReject(null);
                      setSuspendTarget(curator);
                      setReason("");
                    }}
                    className="btn btn-outline btn-sm w-full text-wine hover:border-wine"
                  >
                    Tangguhkan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border hairline bg-white">
        <div className="border-b hairline px-5 py-4">
          <p className="label text-ink/65">
            Daftar kurator · Approved, rejected &amp; ditangguhkan ({history.length})
          </p>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Curator</th>
                <th>Status</th>
                <th>Alasan</th>
                <th>Email</th>
                <th>Bergabung</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Belum ada keputusan.
                  </td>
                </tr>
              ) : (
                history.map((curator) => {
                  const statusClass =
                    curator.status === "approved"
                      ? "status-approved"
                      : curator.status === "rejected"
                        ? "status-rejected"
                        : "status-suspended";
                  const statusLabel =
                    curator.status === "approved"
                      ? "Approved"
                      : curator.status === "rejected"
                        ? "Rejected"
                        : "Ditangguhkan";
                  return (
                    <tr key={curator.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {curator.avatar ? (
                            <img src={curator.avatar} alt="" className="avatar h-8 w-8 shrink-0" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 font-display text-xs">
                              {(curator.name ?? "C").charAt(0)}
                            </span>
                          )}
                          <div>
                            <p className="font-medium leading-tight">{curator.name}</p>
                            <p className="mt-0.5 text-[12px] text-ink/55">@{curator.username}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status ${statusClass}`}>{statusLabel}</span>
                      </td>
                      <td className="max-w-[280px] text-[13px] text-ink/65">
                        {curator.status === "suspended" ? curator.suspensionReason || "—" : "—"}
                      </td>
                      <td className="text-ink/70">{curator.email}</td>
                      <td className="text-ink/65">{formatDate(curator.joinedAt)}</td>
                      <td className="text-right">
                        {curator.status === "suspended" ? (
                          <button
                            type="button"
                            onClick={() => decide(curator.id, "approved")}
                            aria-label={`Aktifkan ${curator.name}`}
                            className="btn btn-outline btn-sm text-wine hover:border-wine"
                          >
                            <i className="fa-solid fa-rotate-left text-[11px]" />
                          </button>
                        ) : (
                          <span className="label text-ink/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(confirmReject)}
        onClose={() => setConfirmReject(null)}
        onConfirm={() => decide(confirmReject.id, "rejected")}
        title="Tolak kurator"
        subtitle="Panel admin"
        message={
          <>
            Tolak pengajuan kurator <span className="font-semibold">{confirmReject?.name}</span>?
          </>
        }
        confirmLabel="Ya, tolak"
        danger
      />

      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => {
          setSuspendTarget(null);
          setReason("");
        }}
        title="Tangguhkan kurator"
        subtitle="Panel admin"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!suspendTarget || !reason.trim()) return;
            decide(suspendTarget.id, "suspended", reason);
          }}
          className="space-y-5"
        >
          <p className="text-[14px] leading-relaxed text-ink/65">
            Akun <span className="font-semibold">{suspendTarget?.name}</span> akan ditangguhkan dan tidak dapat mengakses dashboard. Alasan ini akan ditampilkan ke kurator yang bersangkutan.
          </p>
          <label className="block">
            <span className="label text-ink/65">Alasan penangguhan</span>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tuliskan alasan penangguhan"
              className="field mt-1.5"
            />
          </label>
          <div className="flex justify-end gap-3 border-t hairline pt-5">
            <button
              type="button"
              onClick={() => {
                setSuspendTarget(null);
                setReason("");
              }}
              className="btn btn-outline btn-sm"
            >
              Batal
            </button>
            <button type="submit" className="btn btn-wine btn-sm">
              Tangguhkan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
