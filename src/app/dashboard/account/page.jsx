export default function DashboardAccountPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Akun</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola informasi akun dan keamanan.
        </p>
      </header>

      <div className="space-y-4 border border-ink/15 bg-white p-5 sm:p-6">
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Email</span>
          <input
            type="email"
            placeholder="nama@email.com"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Password baru</span>
          <input
            type="password"
            placeholder="Min. 6 karakter"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Ulangi password baru</span>
          <input
            type="password"
            placeholder="Ulangi password"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>
        <button
          type="button"
          className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
        >
          Simpan perubahan
        </button>
      </div>
    </>
  );
}
