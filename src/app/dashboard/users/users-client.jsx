"use client";

import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import Modal from "@/components/modal";
import { notify } from "@/components/toast";
import { deleteUser, listUserAdminData, updateUserStatus } from "../actions";

const filters = ["Semua", "Admin", "Member", "Curator"];
const filterRoles = { Admin: "admin", Member: "member", Curator: "curator" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function statusInfo(status) {
  if (status === "rejected") return { label: "Rejected", className: "status-rejected" };
  if (status === "suspended") return { label: "Ditangguhkan", className: "status-suspended" };
  if (status === "pending") return { label: "Pending", className: "status-pending" };
  return { label: "Aktif", className: "status-approved" };
}

function formWith(entries) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => formData.set(key, String(value ?? "")));
  return formData;
}

export default function DashboardUsersClient({ initialUsers, currentDbId }) {
  const [users, setUsers] = useState(initialUsers);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [confirmingId, setConfirmingId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const result = await listUserAdminData();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers(result.users);
  }

  const filteredUsers = useMemo(() => {
    const role = filterRoles[activeFilter];
    return role ? users.filter((item) => item.role === role) : users;
  }, [users, activeFilter]);

  const confirming = confirmingId ? users.find((item) => item.dbId === confirmingId) ?? null : null;

  async function removeUser() {
    setError("");
    const result = await deleteUser(formWith({ id: confirmingId }));
    setConfirmingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Akun curator berhasil dihapus.", "success");
    await refresh();
  }

  async function suspendUser() {
    if (!suspendTarget || !reason.trim()) return;
    setError("");
    const result = await updateUserStatus(
      formWith({ id: suspendTarget.dbId, status: "suspended", reason: reason.trim() }),
    );
    setSuspendTarget(null);
    setReason("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Akun berhasil ditangguhkan.", "success");
    await refresh();
  }

  async function restoreUser(item) {
    setError("");
    const result = await updateUserStatus(formWith({ id: item.dbId, status: "approved", reason: "" }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Akun berhasil diaktifkan kembali.", "success");
    await refresh();
  }

  return (
    <>
      <header className="border-b hairline pb-5">
        <p className="label text-wine">Panel admin</p>
        <h1 className="font-display mt-2 text-3xl lg:text-4xl">Pengguna</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
          Lihat dan kelola akun pengguna platform. Akun Admin dan akun Anda sendiri dilindungi.
        </p>
      </header>

      {error && <div className="border hairline bg-white px-5 py-3 text-[13px] text-wine">{error}</div>}

      <div className="border hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline px-5 py-4">
          <div>
            <p className="label text-ink/65">Manajemen pengguna</p>
            <p className="mt-1 text-[13px] text-ink/65">{filteredUsers.length} pengguna</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setActiveFilter(item)}
                className={`chip ${item === activeFilter ? "active" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Email</th>
                <th>Bergabung</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-ink/55">
                    Tidak ada pengguna pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const info = statusInfo(item.status);
                  const protectedUser = item.role === "admin" || item.dbId === currentDbId;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {item.avatar ? (
                            <img src={item.avatar} alt="" className="avatar h-8 w-8 shrink-0" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 font-display text-xs">
                              {(item.name ?? "U").charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">
                              {item.name}
                              {item.dbId === currentDbId && (
                                <span className="ml-1.5 text-[11px] font-label text-wine">(Anda)</span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[12px] text-ink/55">@{item.username}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">
                          {item.role === "admin"
                            ? "Admin"
                            : item.role === "curator"
                              ? "Curator"
                              : "Member"}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${info.className}`}>{info.label}</span>
                      </td>
                      <td className="text-ink/70">{item.email}</td>
                      <td className="text-ink/65">{formatDate(item.joinedAt)}</td>
                      <td className="text-right">
                        {protectedUser ? (
                          <span className="label text-ink/40">Dilindungi</span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {item.status === "suspended" ? (
                              <button
                                type="button"
                                onClick={() => restoreUser(item)}
                                aria-label={`Aktifkan ${item.name}`}
                                className="btn btn-outline btn-sm text-wine hover:border-wine"
                              >
                                <i className="fa-solid fa-rotate-left text-[11px]" />
                              </button>
                            ) : item.status === "rejected" ? null : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingId(null);
                                  setSuspendTarget(item);
                                  setReason("");
                                }}
                                aria-label={`Tangguhkan ${item.name}`}
                                className="btn btn-outline btn-sm text-wine hover:border-wine"
                              >
                                <i className="fa-solid fa-ban text-[11px]" />
                              </button>
                            )}
                            {item.role === "curator" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSuspendTarget(null);
                                  setReason("");
                                  setConfirmingId(item.dbId);
                                }}
                                aria-label={`Hapus ${item.name}`}
                                className="btn btn-outline btn-sm text-wine hover:border-wine"
                              >
                                <i className="fa-solid fa-trash text-[11px]" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t hairline px-5 py-3 text-[12px] text-ink/55">
          Curator mengikuti aturan PRD: admin dapat menghapus akun curator beserta data terkait. Member dan curator yang ditangguhkan dapat diaktifkan kembali tanpa menghapus karya atau data lainnya.
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirmingId(null)}
        onConfirm={removeUser}
        title="Hapus pengguna"
        subtitle="Panel admin"
        message={
          <>
            Hapus akun curator <span className="font-semibold">{confirming?.name}</span>? Akun, karya, komentar, laporan, dan submisi terkait ikut dihapus.
          </>
        }
        confirmLabel="Ya, hapus"
        danger
      />

      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => {
          setSuspendTarget(null);
          setReason("");
        }}
        title="Tangguhkan akun"
        subtitle="Panel admin"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void suspendUser();
          }}
          className="space-y-5"
        >
          <p className="text-[14px] leading-relaxed text-ink/65">
            Akun <span className="font-semibold">{suspendTarget?.name}</span> akan ditangguhkan dan tidak dapat mengakses platform. Alasan ini akan ditampilkan ke pemilik akun.
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
