const filters = ["Semua", "Aktif", "Mendatang", "Selesai"];

const challenges = [
  {
    title: "Neo-Parisian Rejection",
    curator: "Musée Libre Paris",
    status: "Aktif",
    description:
      "Tantangan bagi karya surealis yang pernah ditolak galeri konvensional. Pameran tandingan kecil yang merayakan penolakan.",
  },
  {
    title: "The Unjuried Vanguard",
    curator: "DAO Hectic Arts",
    status: "Aktif",
    description:
      "Pameran tandingan untuk merayakan kebebasan kreator digital. Tanpa tema, tanpa batas.",
  },
  {
    title: "Quiet Radical",
    curator: "DAO Hectic Arts",
    status: "Mendatang",
    description:
      "Menantikan karya yang tenang namun subversif, dengan pendekatan minimal dan pesan yang menggugat.",
  },
  {
    title: "Digital Heresy",
    curator: "Musée Libre Paris",
    status: "Selesai",
    description:
      "Eksplorasi estetika radikal tanpa batasan moralitas tradisional. Arsip pemenang terbuka untuk publik.",
  },
];

export default function ChallengesPage() {
  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Tantangan kuratorial
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ruang pameran tandingan.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Tantangan dikelola oleh kurator terverifikasi. Partisipasi bersifat
            sukarela — galeri utama tetap terbuka tanpa seleksi.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <span
                key={filter}
                className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
                  index === 0
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-ink/60"
                }`}
              >
                {filter}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map((item, index) => (
              <article key={index} className="border border-ink/15 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {item.curator}
                  </p>
                  <span className="border border-ink/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/60">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
