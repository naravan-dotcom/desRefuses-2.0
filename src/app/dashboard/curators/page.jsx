"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function DashboardCuratorsPage() {
  const [db, setDb] = useState(() => createSeedDb());

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

  function decide(id, status) {
    const next = loadDb();
    const target = next.users.find(
      (item) => item.id === id && item.role === "curator",
    );
    if (!target) return;
    target.status = status;
    saveDb(next);
    setDb(next);
  }

  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Verifikasi kurator</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Tinjau dan setujui pendaftaran akun kurator.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Menunggu tinjauan ({pending.length})
        </p>
        <div className="border border-ink/15 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Kurator</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Diajukan</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/45">
                      Tidak ada pengajuan kurator.
                    </td>
                  </tr>
                ) : (
                  pending.map((curator) => (
                    <tr key={curator.id} className="border-b border-ink/10 last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{curator.name}</p>
                        <p className="text-xs text-ink/50">@{curator.username}</p>
                      </td>
                      <td className="px-4 py-3 text-ink/60">{curator.email}</td>
                      <td className="px-4 py-3 text-ink/60">{formatDate(curator.joinedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => decide(curator.id, "approved")}
                            className="bg-ink px-3 py-1.5 text-xs text-paper transition-colors hover:bg-brand"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(curator.id, "rejected")}
                            className="border border-red-600/50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Riwayat keputusan ({history.length})
        </p>
        <div className="border border-ink/15 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Kurator</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Diajukan</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/45">
                      Belum ada keputusan.
                    </td>
                  </tr>
                ) : (
                  history.map((curator) => (
                    <tr key={curator.id} className="border-b border-ink/10 last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{curator.name}</p>
                        <p className="text-xs text-ink/50">@{curator.username}</p>
                      </td>
                      <td className="px-4 py-3 text-ink/60">{curator.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                            curator.status === "approved"
                              ? "border-ink/25 text-ink/70"
                              : "border-red-600/40 text-red-700"
                          }`}
                        >
                          {curator.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/60">{formatDate(curator.joinedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
