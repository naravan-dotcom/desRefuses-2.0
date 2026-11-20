export default function DashboardPage() {
  return (
    <>
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Ringkasan</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
          Kelola aktivitas Anda dari satu tempat. Tampilan ini masih dasar dan
          akan disesuaikan dengan peran serta sesi nantinya.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Karya", value: "0", note: "Portofolio publik" },
          { label: "Apresiasi", value: "0", note: "Total suka" },
          { label: "Favorit", value: "0", note: "Karya tersimpan" },
          { label: "Submisi", value: "0", note: "Tantangan diikuti" },
        ].map((item) => (
          <div key={item.label} className="border border-ink/15 bg-white p-4">
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {item.label}
            </p>
            <p className="mt-1 text-xs text-ink/45">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Karya terbaru
          </p>
          <h2 className="mt-1 text-lg font-medium">Portofolio</h2>
          <div className="mt-4 border border-dashed border-ink/20 p-6 text-center text-sm text-ink/45">
            Belum ada karya untuk ditampilkan.
          </div>
        </div>
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Langkah berikutnya
          </p>
          <h2 className="mt-1 text-lg font-medium">Tetap bergerak</h2>
          <div className="mt-4 space-y-3">
            <div className="border border-ink/15 p-4">
              <p className="text-sm font-medium">Unggah karya</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/55">
                Mulai bangun portofolio publik Anda di galeri.
              </p>
            </div>
            <div className="border border-ink/15 p-4">
              <p className="text-sm font-medium">Ikuti tantangan</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/55">
                Lihat tantangan aktif dan kirim karya pilihan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Kurator
          </p>
          <p className="mt-2 text-sm font-medium">Tantangan saya</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Ringkasan tantangan dan submisi akan tampil di sini.
          </p>
        </div>
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Admin
          </p>
          <p className="mt-2 text-sm font-medium">Moderasi & pengguna</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Antrean verifikasi dan laporan akan tampil di sini.
          </p>
        </div>
        <div className="border border-ink/15 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Status
          </p>
          <p className="mt-2 text-sm font-medium">Akun & sesi</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Informasi akun dan status peran akan ditampilkan setelah auth aktif.
          </p>
        </div>
      </section>
    </>
  );
}
