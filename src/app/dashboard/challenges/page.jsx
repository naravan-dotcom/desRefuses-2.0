export default function DashboardChallengesPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Kurator
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Tantangan saya</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Kelola tantangan yang Anda selenggarakan.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">0 tantangan</p>
        <button
          type="button"
          className="border border-ink/20 px-3 py-2 text-xs hover:border-ink"
        >
          Buat tantangan
        </button>
      </div>

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Tantangan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submisi</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/45">
                  Belum ada tantangan. Buat tantangan pertama Anda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
