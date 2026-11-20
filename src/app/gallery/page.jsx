const categories = ["Semua", "Lukis", "Digital", "Patung", "Fotografi", "Tekstil"];

const artworks = [
  { title: "Deconstruction of Dogma", artist: "Sora Vane", category: "Lukis" },
  { title: "Static Noise", artist: "Aethelgard", category: "Digital" },
  { title: "Architectural Ghost of 1863", artist: "Clara Mond", category: "Digital" },
  { title: "Bronze Rebellion", artist: "Rian K.", category: "Patung" },
  { title: "Frayed Memory", artist: "Lina Arka", category: "Tekstil" },
  { title: "Glass Horizon", artist: "Dimas Noor", category: "Fotografi" },
  { title: "Unframed Echo", artist: "Mara Sel", category: "Lukis" },
  { title: "Paper Cathedral", artist: "Jonas Re", category: "Patung" },
];

export default function GalleryPage() {
  return (
    <main className="px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Galeri publik
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Karya tanpa seleksi juri.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink/55">
            Jelajahi karya yang dipajang langsung oleh para kreator. Tidak ada
            kurasi untuk tampil — apresiasi datang dari publik.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Cari karya atau kreator"
              className="w-full border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-ink sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <span
                  key={category}
                  className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
                    index === 0
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-ink/60"
                  }`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {artworks.map((art, index) => (
              <article key={index} className="border border-ink/15 bg-white">
                <div className="aspect-[4/5] bg-ink/5" />
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {art.category}
                  </p>
                  <h3 className="mt-1 text-sm font-medium leading-snug">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink/55">{art.artist}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
