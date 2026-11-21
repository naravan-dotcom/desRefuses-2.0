import Link from "next/link";
import { notFound } from "next/navigation";
import { createSeedDb } from "@/lib/seed";

const seed = createSeedDb();

export default async function ArtworkPage({ params }) {
  const { id } = await params;
  const artwork = seed.artworks.find((item) => item.id === id);
  if (!artwork) notFound();

  const creator = seed.users.find((user) => user.id === artwork.userId);
  const category = seed.categories.find((item) => item.id === artwork.categoryId);
  const comments = seed.comments.filter((comment) => comment.artworkId === id);
  const related = seed.artworks
    .filter((item) => item.userId === artwork.userId && item.id !== id)
    .slice(0, 3);

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/gallery"
          className="text-[10px] uppercase tracking-[0.16em] text-ink/45 hover:text-ink"
        >
          Kembali ke galeri
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="border border-ink/15 bg-ink p-2 sm:p-3">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="max-h-[68vh] w-full object-contain"
            />
          </div>

          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {category?.name ?? "Tanpa kategori"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {artwork.title}
            </h1>
            <p className="text-sm text-ink/55">
              oleh {creator?.name ?? "Kreator"} · @{creator?.username ?? "kreator"}
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              {artwork.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {(artwork.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="border border-ink/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/50"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 border border-ink/15 bg-white">
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Suka</p>
                <p className="mt-1 text-lg font-semibold">{artwork.likes}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Komentar</p>
                <p className="mt-1 text-lg font-semibold">{comments.length}</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Status</p>
                <p className="mt-2 text-[11px] text-ink/55">Tanpa kurasi</p>
              </div>
            </div>

            <div className="border border-ink/15 bg-white p-4 text-xs leading-relaxed text-ink/55">
              Masuk sebagai Member untuk menyukai, menyimpan, berkomentar, atau
              melaporkan karya ini.
            </div>
            <Link
              href="/login"
              className="inline-block bg-ink px-4 py-2.5 text-xs text-paper transition-colors hover:bg-brand"
            >
              Masuk
            </Link>
          </div>
        </div>

        <section className="border-t border-ink/15 pt-8">
          <h2 className="text-xl font-semibold">Diskusi publik</h2>
          <div className="mt-4 space-y-3">
            {comments.length ? (
              comments.map((comment) => {
                const author = seed.users.find((user) => user.id === comment.userId);
                return (
                  <div key={comment.id} className="border border-ink/15 bg-white p-4">
                    <p className="text-xs font-medium">
                      {author?.name ?? "Pengguna"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/70">
                      {comment.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-ink/45">Belum ada diskusi.</p>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-ink/15 pt-8">
            <h2 className="text-xl font-semibold">Karya lain oleh kreator</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/artwork/${item.id}`}
                  className="border border-ink/15 bg-white"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="p-2 text-xs">{item.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
