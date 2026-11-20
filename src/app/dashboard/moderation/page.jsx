export default function DashboardModerationPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Moderasi</h1>
        <p className="text-sm leading-relaxed text-ink/55">
          Tinjau laporan karya dan komentar dari komunitas.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["Karya", "Komentar"].map((item, index) => (
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

      <div className="border border-ink/15 bg-white p-8 text-center text-sm text-ink/45">
        Antrean moderasi kosong.
      </div>
    </>
  );
}
