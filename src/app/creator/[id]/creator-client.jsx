"use client";

import Link from "next/link";
import { useState } from "react";
import ArtworkCard from "@/components/artwork/artwork-card";
import StatusBadge from "@/components/ui/status-badge";
import { useSession } from "@/lib/use-session";
import { toggleCreatorFollow } from "./actions";

function externalHref(value) {
  return /^https?:\/\//i.test(value) ? value : null;
}

export default function CreatorClient({ creator, artworks, categoryNames, initialFollowing }) {
  const { user } = useSession();
  const [notice, setNotice] = useState("");
  const [isFollowing, setIsFollowing] = useState(Boolean(initialFollowing));
  const [pending, setPending] = useState(false);

  const isSelf = Boolean(user && String(user.dbId ?? user.id.replace(/^u/, "")) === creator.id);

  const links = [
    { label: "Instagram", value: creator.links?.instagram ?? "" },
    { label: "Behance", value: creator.links?.behance ?? "" },
    { label: "Website", value: creator.links?.website ?? "" },
  ].filter((item) => item.value);

  const roleLabel = creator.role === "admin" ? "Admin" : creator.role === "curator" ? "Kurator" : "Member";

  async function toggleFollow() {
    if (pending) return;
    if (!user) {
      setNotice("Masuk sebagai Member untuk mengikuti kreator.");
      return;
    }
    if (user.role !== "member") {
      setNotice("Akun Admin atau Kurator hanya dapat menjelajahi profil.");
      return;
    }
    if (isSelf) {
      setNotice("Anda tidak dapat mengikuti diri sendiri.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("targetId", creator.id);
    const result = await toggleCreatorFollow(formData);
    setPending(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setIsFollowing(result.following);
    setNotice(result.following ? `${creator.name} kini diikuti.` : `Mengikuti ${creator.name} dihentikan.`);
  }

  return (
    <main className="page-enter">
      <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-10 lg:py-16">
        <Link href="/gallery" className="label flex w-fit items-center gap-2 text-ink/65 hover:text-ink">
          <i className="fa-solid fa-arrow-left text-[11px]" /> Kembali ke galeri
        </Link>

        <section className="mt-8 border-b hairline pb-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <div className="art-media aspect-[4/5] bg-canvas">
                <img src={creator.avatar || "/desrefuses-mark.png"} alt={`Foto profil ${creator.name}`} className="art-img h-full w-full object-cover" />
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="label text-wine">Profil kreator · {roleLabel}</div>
              <h1 className="font-display mt-4 text-[42px] leading-[1.06] sm:text-[58px]">{creator.name}</h1>
              <p className="mt-2 text-[15px] text-ink/60">@{creator.username}</p>
              {creator.status && creator.role === "curator" && (
                <StatusBadge className={`mt-4 ${creator.status === "approved" ? "status-approved" : creator.status === "pending" ? "status-pending" : "status-rejected"}`}>
                  Kurator {creator.status === "approved" ? "Approved" : creator.status === "pending" ? "Pending" : "Rejected"}
                </StatusBadge>
              )}
              {creator.bio && <p className="mt-6 max-w-2xl text-[15px] leading-[1.8] text-ink/70">{creator.bio}</p>}
              {user && !isSelf && user.role === "member" && (
                <button type="button" onClick={toggleFollow} disabled={pending} className={`btn btn-sm mt-7 ${isFollowing ? "btn-outline" : "btn-ink"}`}>
                  <i className={`fa-${isFollowing ? "solid" : "regular"} fa-user-plus mr-1`} />
                  {isFollowing ? "Mengikuti" : "Ikuti"}
                </button>
              )}
              {notice && <p className="label mt-4 text-wine">{notice}</p>}

              {links.length > 0 ? (
                <div className="mt-8 grid gap-3 border-t hairline pt-6 sm:grid-cols-3">
                  {links.map((link) => {
                    const href = externalHref(link.value);
                    const content = (
                      <>
                        <span className="label text-ink/55">{link.label}</span>
                        <span className="mt-1 block break-all text-[13px] text-ink/70">{link.value}</span>
                      </>
                    );
                    return href ? (
                      <a key={link.label} href={href} target="_blank" rel="noreferrer" className="border hairline p-4 transition-colors hover:border-ink">
                        {content}
                      </a>
                    ) : (
                      <div key={link.label} className="border hairline p-4">{content}</div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-8 border-t hairline pt-6 text-[13px] text-ink/55">Belum ada tautan eksternal.</p>
              )}
            </div>
          </div>
        </section>

        <section className="pt-12">
          <div className="label text-ink/65">Galeri kreator</div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h2 className="font-display text-[34px] leading-[1.12]">Karya dari {creator.name}.</h2>
            <p className="label text-ink/65">{artworks.length} karya</p>
          </div>
          {artworks.length ? (
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {artworks.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  creator={creator.name}
                  creatorId={creator.dbId}
                  category={categoryNames[artwork.categoryId]}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-ink/20 p-10 text-center text-[14px] text-ink/55">
              Kreator ini belum mempublikasikan karya.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
