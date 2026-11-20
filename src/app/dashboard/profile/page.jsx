export default function DashboardProfilePage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola informasi profil publik Anda.
        </p>
      </header>

      <div className="space-y-4 border border-ink/15 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border border-ink/15 bg-ink/5 text-xs text-ink/40">
            Foto
          </div>
          <div>
            <p className="text-sm font-medium">Nama tampilan</p>
            <p className="mt-1 text-xs text-ink/50">@username</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">Nama tampilan</span>
          <input
            type="text"
            placeholder="Nama tampilan"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">Bio</span>
          <textarea
            rows={4}
            placeholder="Ceritakan tentang diri dan karya Anda"
            className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Instagram</span>
            <input
              type="text"
              placeholder="tautan"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Behance</span>
            <input
              type="text"
              placeholder="tautan"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Website</span>
            <input
              type="text"
              placeholder="tautan"
              className="mt-1.5 w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
          </label>
        </div>

        <button
          type="button"
          className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
        >
          Simpan profil
        </button>
      </div>
    </>
  );
}
