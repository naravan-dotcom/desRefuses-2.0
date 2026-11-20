export default function DashboardUsersPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Lihat dan kelola akun pengguna platform.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["Semua", "Admin", "Member", "Kurator"].map((item, index) => (
          <span
            key={item}
            className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
              index === 0
                ? "border-ink bg-ink text-paper"
                : "border-ink/20 text-ink/60"
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 bg-paper text-[10px] uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/45">
                  Belum ada data pengguna.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
