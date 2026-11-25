"use client";

import Link from "next/link";

function fallbackImage(event) {
  const image = event.currentTarget;
  if (image.dataset.fallback) return;
  image.dataset.fallback = "1";
  image.src = "/desrefuses-mark.png";
}

function formatArtCode(id, index) {
  const digits = String(id || "").replace(/\D/g, "");
  if (digits) return `No. ${digits.padStart(2, "0")}`;
  return `No. ${String((index ?? 0) + 1).padStart(2, "0")}`;
}

export default function ArtworkCard({
  artwork,
  creator,
  creatorAvatar,
  creatorId,
  category,
  commentCount,
  index = 0,
}) {
  const hasAiTag = Array.isArray(artwork?.tags) && artwork.tags.some((t) => String(t).toLowerCase() === "ai");

  return (
    <article className="art-card group break-inside-avoid mb-10">
      <Link href={`/artwork/${artwork.id}`} className="block">
        <div className="art-media relative aspect-[4/5]">
          <img
            src={artwork.image}
            alt={artwork.title}
            loading="lazy"
            onError={fallbackImage}
            className="art-img h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
            <span className="label bg-white/92 px-2.5 py-1 text-ink backdrop-blur-sm">
              {category ?? "Tanpa kategori"}
            </span>
            {hasAiTag && (
              <span className="label bg-ink px-2 py-1 text-paper">AI</span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-start justify-between gap-5 pt-5">
        <div className="min-w-0">
          <Link href={`/artwork/${artwork.id}`} className="block">
            <h3 className="font-display line-clamp-2 text-[25px] leading-[1.12] tracking-[-0.01em] transition-colors group-hover:text-wine">
              {artwork.title}
            </h3>
          </Link>
          <div className="mt-2.5 flex items-center gap-2 text-[12px] font-label text-ink/65">
            {creatorAvatar && (
              <img
                src={creatorAvatar}
                alt={creator ?? "Kreator"}
                className="avatar h-5 w-5"
                onError={fallbackImage}
              />
            )}
            {creatorId ? (
              <Link href={`/creator/${creatorId}`} className="truncate hover:text-ink">
                {creator ?? "Kreator"}
              </Link>
            ) : (
              <span className="truncate">{creator ?? "Kreator"}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="label text-ink/45">{formatArtCode(artwork.id, index)}</div>
          <div className="mt-4 flex items-center justify-end gap-3 text-[12px] font-label text-ink/65">
            <span>
              <i className="fa-solid fa-heart mr-1 text-wine/70" />
              {artwork.likes ?? 0}
            </span>
            {typeof commentCount === "number" && (
              <span>
                <i className="fa-regular fa-comment mr-1 text-slate/60" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
