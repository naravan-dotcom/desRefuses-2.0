import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import pool from "@/lib/db";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const { rows } = await pool.query(
          "SELECT id, role, status, name, username, email, avatar, password FROM users WHERE lower(email) = $1",
          [email],
        );
        const row = rows[0];
        if (!row || !(await verifyPassword(password, row.password))) return null;

        if (!isHashedPassword(row.password)) {
          await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
            await hashPassword(password),
            row.id,
          ]);
        }

        return {
          id: `u${row.id}`,
          dbId: row.id,
          role: row.role,
          status: row.status,
          name: row.name,
          username: row.username,
          email: row.email,
          image: row.avatar || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.dbId = user.dbId;
        token.role = user.role;
        token.status = user.status;
        token.username = user.username;
        token.avatar = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.dbId = token.dbId;
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.username = token.username;
      session.user.avatar = token.avatar;
      session.user.image = token.avatar;

      if (token.dbId) {
        const { rows } = await pool.query(
          "SELECT role, status, name, username, email, avatar, suspension_reason FROM users WHERE id = $1",
          [token.dbId],
        );
        const row = rows[0];
        if (row) {
          session.user.role = row.role;
          session.user.status = row.status;
          session.user.name = row.name;
          session.user.username = row.username;
          session.user.email = row.email;
          session.user.avatar = row.avatar || null;
          session.user.image = row.avatar || null;
          session.user.suspensionReason = row.suspension_reason ?? "";
        }
      }

      return session;
    },
  },
});
