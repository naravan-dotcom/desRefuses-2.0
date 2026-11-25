"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ArtworkCard from "@/components/artwork-card";
import { loadDb, saveDb } from "@/lib/local-data";
import { createSeedDb } from "@/lib/seed";
import { useSession } from "@/lib/use-session";

function externalHref(value) {
  return /^https?:\/\//i.test(value) ? value : null;
}

export default function CreatorPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [db, setDb] = useState(() => createSeedDb());
  const [notice, setNotice] = useState("");
  const { user } = useSession();

  useEffect(() => {
    const timer = setTimeout(() => setDb(loadDb()), 0);
    return () => clearTimeout(timer);
  }, []);

  const creator = useMemo(() => db.users.find((item) => item.id === id), [db, id]);
  const artworks = useMemo(
    () => db.artworks.filter((item) => item.userId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [db, id],
  );
  const categoryNames = useMemo(
    () => Object.fromEntries(db.categories.map((item) => [item.id, item.name])),
    [db],
  );
  const isFollowing = Boolean(user && creator && user.id !== creator.id && (user.following ?? []).includes(creator.id));

  const links = creator
    ? [
        { label: "Instagram", value: creator.links?.instagram ?? "" },
        { label: "Behance", value: creator.links?.behance ?? "" },
        { label: "Website", value: creator.links?.website ?? "" },
      ].filter((item) => item.value)
    : [];

  const roleLabel = creator?.role === "admin" ? "Admin" : creator?.role === "curator" ? "Kurator" : "Member";

  function toggleFollow() {
    if (!user) {
      setNotice("Masuk sebagai Member untuk mengikuti kreator.");
      return;
    }
    if (user.role !== "member") {
      setNotice("Akun Admin atau Kurator hanya dapat menjelajahi profil.");
      return;
    }
    if (user.id === creator.id) {
      setNotice("Anda tidak dapat mengikuti diri sendiri.");
      return;
    }
    const next = loadDb();
    const target = next.users.find((item) => item.id === user.id);
    if (!target) return;
    target.following = target.following ?? [];
    const index = target.following.indexOf(creator.id);
    if (index >= 0) {
      target.following.splice(index, 1);
      setNotice(`Mengikuti ${creator.name} dihentikan.`);
    } else {
      target.following.push(creator.id);
      setNotice(`${creator.name} kini diikuti.`);
    }
    saveDb(next);
    setDb(next);
  }

  if (!creator) {
    return (
      <main className="page-enter px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
          <i className="fa-regular fa-user text-2xl text-ink/40" />
          <h1 className="font-display mt-4 text-[28px]">Kreator tidak ditemukan.</h1>
          <Link href="/gallery" className="btn btn-outline btn-sm mt-5">Kembali ke galeri</Link>
        </div>
      </main>
    );
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
                <span className={`status mt-4 ${creator.status === "approved" ? "status-approved" : creator.status === "pending" ? "status-pending" : "status-rejected"}`}>
                  Kurator {creator.status === "approved" ? "Approved" : creator.status === "pending" ? "Pending" : "Rejected"}
                </span>
              )}
              {creator.bio && <p className="mt-6 max-w-2xl text-[15px] leading-[1.8] text-ink/70">{creator.bio}</p>}
              {user && user.id !== creator.id && user.role === "member" && (
                <button type="button" onClick={toggleFollow} className={`btn btn-sm mt-7 ${isFollowing ? "btn-outline" : "btn-ink"}`}>
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
            <div className="mt-8 columns-1 gap-8 sm:columns-2 xl:columns-3">
              {artworks.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  creator={creator.name}
                  creatorId={creator.id}
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
