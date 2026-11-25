"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { toUser } from "@/lib/db-shape";

function value(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

async function requireMember() {
  const session = await auth();
  if (!session?.user?.dbId) return { error: "Sesi tidak ditemukan." };
  const dbId = Number(session.user.dbId);
  if (session.user.role !== "member" || session.user.status !== "approved") {
    return { error: "Hanya Member yang bisa mengelola akun." };
  }
  return { dbId };
}

export async function listAccountData() {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [access.dbId]);
    if (!rows[0]) return { ok: false, error: "Akun tidak ditemukan." };
    return { ok: true, user: toUser(rows[0]) };
  } catch {
    return { ok: false, error: "Data akun gagal dimuat." };
  }
}

export async function updateAccount(formData) {
  const access = await requireMember();
  if (access.error) return { ok: false, error: access.error };

  const email = value(formData, "email").toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) return { ok: false, error: "Email wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Format email tidak valid." };
  if (password && password.length < 6) return { ok: false, error: "Password minimal 6 karakter." };
  if (password !== confirmPassword) return { ok: false, error: "Ulangi password tidak sama." };

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [access.dbId]);
    const current = rows[0];
    if (!current) return { ok: false, error: "Akun tidak ditemukan." };

    const emailChanged = current.email.toLowerCase() !== email;
    const passwordChanged = Boolean(password);
    if (!emailChanged && !passwordChanged) {
      return { ok: false, error: "Tidak ada perubahan yang disimpan." };
    }
    if (passwordChanged && !currentPassword) {
      return { ok: false, error: "Password saat ini wajib diisi untuk mengganti password." };
    }
    if (passwordChanged && !(await verifyPassword(currentPassword, current.password))) {
      return { ok: false, error: "Password saat ini tidak sesuai." };
    }

    if (emailChanged) {
      const existing = await pool.query("SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2", [email, access.dbId]);
      if (existing.rowCount) return { ok: false, error: "Email sudah digunakan." };
    }

    const nextPassword = passwordChanged ? await hashPassword(password) : current.password;
    const updated = await pool.query(
      "UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING *",
      [email, nextPassword, access.dbId],
    );

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard/profile");
    revalidatePath(`/creator/${access.dbId}`);
    return {
      ok: true,
      user: toUser(updated.rows[0]),
      emailChanged,
      passwordChanged,
    };
  } catch {
    return { ok: false, error: "Akun gagal diperbarui." };
  }
}
