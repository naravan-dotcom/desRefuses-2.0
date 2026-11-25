import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { IMAGES } from "@/lib/seed";

export async function POST(request) {
  const body = await request.json();
  const role = body.role === "curator" ? "curator" : "member";
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !username || !email || password.length < 6) {
    return NextResponse.json({ error: "Data pendaftaran tidak lengkap." }, { status: 400 });
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: "Format username tidak valid." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }

  const existing = await pool.query(
    "SELECT id FROM users WHERE lower(email) = $1 OR lower(username) = $2",
    [email, username],
  );
  if (existing.rowCount) {
    return NextResponse.json(
      { error: "Email atau username sudah terdaftar." },
      { status: 409 },
    );
  }

  const hashed = await hashPassword(password);
  const { rows } = await pool.query(
    "INSERT INTO users (role, status, name, username, email, password, avatar, bio, links, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7, '', '{}'::jsonb, NOW()) RETURNING id, role, status, name, username, email, avatar",
    [role, role === "curator" ? "pending" : "approved", name, username, email, hashed, IMAGES.av6],
  );

  const row = rows[0];
  return NextResponse.json(
    {
      user: {
        id: `u${row.id}`,
        role: row.role,
        status: row.status,
        name: row.name,
        username: row.username,
        email: row.email,
        avatar: row.avatar,
      },
    },
    { status: 201 },
  );
}
