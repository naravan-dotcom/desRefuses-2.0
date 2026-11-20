export default function DashboardSubmissionsPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Member
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Submisi</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Riwayat partisipasi Anda dalam tantangan.
        </p>
      </header>

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Tantangan</th>
                <th className="px-4 py-3 font-medium">Karya</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/45">
                  Belum ada submisi tantangan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
