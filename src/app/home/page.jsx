import Link from "next/link";

const timeline = [
  {
    year: "1863",
    place: "Paris",
    title: "Penolakan Juri",
    text: "Salon (ruang) resmi menutup pintu bagi sebagian besar karya yang diajukan.",
  },
  {
    year: "1863",
    place: "Pameran",
    title: "Pembentukan ruang baru",
    text: "Salon des Refusés memberi karya yang ditolak sebuah ruang untuk dilihat.",
  },
  {
    year: "2026",
    place: "Web",
    title: "Modernisasi",
    text: "desRefusés 2.0 memindahkan semangat itu ke galeri digital tanpa seleksi.",
  },
];

const principles = [
  {
    num: "01",
    title: "Hak untuk dilihat",
    text: "Karya tampil di galeri utama tanpa antrean seleksi kurator. Tidak ada dewan juri yang menentukan kelayakan tampil.",
  },
  {
    num: "02",
    title: "Publik yang menilai",
    text: "Apresiasi tumbuh dari respons komunitas — suka, komentar, simpan, dan perhatian yang nyata. Bukan dari stempel satu meja.",
  },
  {
    num: "03",
    title: "Kekuasaan yang terbatas",
    text: "Kurator mengelola tantangan miliknya. Admin menjaga etika dan verifikasi. Tidak ada satu peran yang memiliki seluruh galeri.",
  },
  {
    num: "04",
    title: "Menjunjung etika",
    text: "Kebebasan ekspresi tetap menghormati batas: tanpa plagiarisme, kebencian, pelecehan, atau konten yang membahayakan.",
  },
];

const roles = [
  {
    num: "01",
    label: "Member",
    title: "Kreator",
    text: "Memajang karya tanpa sensor juri, mengelola portofolio, berinteraksi, menyimpan favorit, dan melaporkan konten yang melanggar.",
    tags: ["Unggah karya", "Berkomentar", "Melapor"],
  },
  {
    num: "02",
    label: "Kurator",
    title: "Penyelenggara",
    text: "Mengelola tantangan sukarela setelah disetujui admin. Kuasanya terbatas pada ruang acara sendiri, bukan pada galeri utama.",
    tags: ["Tantangan", "Submisi", "Pemenang"],
  },
  {
    num: "03",
    label: "Admin",
    title: "Konservator",
    text: "Memverifikasi kurator, mengelola kategori, dan menindak laporan berdasarkan etika komunitas. Bukan penentu selera seni.",
    tags: ["Verifikasi", "Moderasi", "Kategori"],
  },
];

export default function HomePage() {
  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-14">
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Arsip fondasi / 1863—2026
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Penolakan yang melahirkan ruang.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Pada 1863, juri Salon resmi Paris menolak sebagian besar karya yang
            diajukan. Protes itu membuka <span className="font-medium text-ink">Salon des Refusés</span> — pameran bagi karya yang tidak diterima institusi.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Nilai sebuah karya tidak seharusnya ditentukan oleh satu meja juri.
            Hak untuk dilihat tidak boleh dimonopoli satu pihak.
          </p>
          <div className="flex flex-wrap gap-8 pt-2">
            <div>
              <p className="text-2xl font-semibold">1863</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Titik mula
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">0</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                Juri utama
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Kronologi
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Dari pintu tertutup ke dinding terbuka.
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {timeline.map((item, index) => (
              <div key={index} className="border border-ink/15 bg-white p-5">
                <p className="text-2xl font-semibold text-ink/30">{item.year}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  {item.place}
                </p>
                <p className="mt-3 text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="prinsip" className="scroll-mt-24 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Prinsip
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Empat hal yang kami jaga.
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Bukan janji bahwa semua karya akan disukai. Janji bahwa tidak ada
            karya yang boleh dihalangi hanya karena selera seseorang.
          </p>
          <div className="space-y-3">
            {principles.map((item) => (
              <div key={item.num} className="border border-ink/15 bg-white p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  {item.num}
                </p>
                <p className="mt-1 text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="peran" className="scroll-mt-24 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
           Division of Power
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Desentralisasi Kekuasaan.
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {roles.map((item) => (
              <div key={item.num} className="border border-ink/15 bg-white p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  {item.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-ink/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-ink/15 pt-10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Ajakan
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Sejarah tidak berhenti pada penolakan.
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Setiap karya yang diunggah adalah kelanjutan dari semangat 1863:
            membuka ruang ketika pintu lain menutup.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/register"
              className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
            >
              Daftar sebagai kreator
            </Link>
            <Link
              href="/gallery"
              className="border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
            >
              Jelajahi galeri
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
