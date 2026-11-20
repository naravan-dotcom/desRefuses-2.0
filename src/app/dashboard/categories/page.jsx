export default function DashboardCategoriesPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Kategori</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola kategori karya yang tersedia di platform.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">0 kategori</p>
        <button
          type="button"
          className="border border-ink/20 px-3 py-2 text-xs hover:border-ink"
        >
          Tambah kategori
        </button>
      </div>

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Nama kategori</th>
                <th className="px-4 py-3 font-medium">Jumlah karya</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink/45">
                  Belum ada kategori.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
