export default function DashboardFavoritesPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Favorit</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Karya yang Anda simpan dari galeri.
        </p>
      </header>

      <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
        Belum ada karya favorit.
      </div>
    </>
  );
}
