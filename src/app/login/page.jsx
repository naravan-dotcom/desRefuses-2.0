import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-md border border-ink/15 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Masuk ke galeri
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Selamat datang kembali.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          Masuk untuk mengelola karya dan melihat aktivitas Anda.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Email</span>
            <input
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink/60">Password</span>
            <input
              type="password"
              placeholder="Masukkan password"
              autoComplete="current-password"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>

          <button
            type="button"
            className="w-full bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-brand"
          >
            Masuk
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-ink/50">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-ink underline underline-offset-4 hover:text-brand"
          >
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
