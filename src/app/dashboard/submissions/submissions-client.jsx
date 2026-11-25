"use client";

import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import StatusBadge from "@/components/ui/status-badge";
import { notify } from "@/components/ui/toast";
import { withdrawSubmission } from "@/app/challenges/actions";
import { buildForm } from "@/app/challenges/form-utils";
import { formatDate, getChallengeStatus, statusClasses, statusLabels } from "@/lib/challenge-status";

export default function DashboardSubmissionsClient({ initial }) {
  const [submissions, setSubmissions] = useState(initial.ok ? initial.submissions : []);
  const [today, setToday] = useState(initial.ok ? initial.today : new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(initial.ok ? "" : initial.error);
  const [notice, setNotice] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [pending, setPending] = useState(false);

  const confirming = submissions.find((item) => item.id === confirmingId) ?? null;

  async function withdraw() {
    if (!confirming || pending) return;
    setError("");
    setPending(true);
    const result = await withdrawSubmission(buildForm({ submissionId: confirming.id }));
    setPending(false);
    setConfirmingId(null);
    if (!result.ok) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    setSubmissions((current) => current.filter((item) => item.id !== confirming.id));
    setNotice("Submisi berhasil ditarik.");
    notify("Submisi berhasil ditarik.", "success");
  }

  return (
    <>
      <header className="border-b hairline pb-7">
        <div className="label flex items-center gap-3 text-wine">
          <span className="h-px w-8 bg-wine" />
          Member
        </div>
        <h1 className="font-display mt-5 text-[38px] leading-none sm:text-[48px]">Submisi.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Riwayat partisipasi Anda dalam tantangan.
        </p>
      </header>

      {error && <p className="border-l-2 border-wine bg-wine/5 px-3 py-2 text-[13px] text-wine">{error}</p>}
      {notice && (
        <div className="flex items-start justify-between gap-4 border-l-2 border-wine bg-wine/5 px-4 py-3">
          <p className="text-[13px] text-wine">{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="btn btn-ghost btn-sm text-wine">
            Tutup
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={withdraw}
        title="Tarik submisi"
        subtitle="Member"
        message={confirming ? `Tarik submisi "${confirming.challenge.title}"? Submisi ini akan dihapus dari riwayat Anda.` : ""}
        danger
        confirmLabel="Ya, tarik"
      />

      {submissions.length === 0 ? (
        <div className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/55">
          Belum ada submisi tantangan.
        </div>
      ) : (
        <div className="border hairline bg-white">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Tantangan</th>
                  <th>Karya</th>
                  <th>Status challenge</th>
                  <th>Status menang</th>
                  <th>Tanggal</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => {
                  const status = getChallengeStatus(item.challenge, today);
                  const canWithdraw = status !== "ended";
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/challenges/${item.challenge.id}`} className="font-semibold hover:text-wine">
                          {item.challenge.title}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/artwork/${item.artwork.id}`} className="hover:text-wine">
                          {item.artwork.title}
                        </Link>
                      </td>
                      <td><StatusBadge className={statusClasses[status]}>{statusLabels[status]}</StatusBadge></td>
                      <td>
                        {item.winnerLabel ? (
                          <StatusBadge className="status-approved">{item.winnerLabel}</StatusBadge>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                      <td className="text-ink/60">{formatDate(item.createdAt)}</td>
                      <td className="text-right">
                        {canWithdraw ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(item.id)}
                            className="btn btn-ghost btn-sm text-wine"
                          >
                            Withdraw
                          </button>
                        ) : (
                          <span className="text-ink/45">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
