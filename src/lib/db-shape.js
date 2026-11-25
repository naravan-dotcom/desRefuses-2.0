export function toCategory(row) {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
  };
}

export function toUser(row) {
  const links = typeof row.links === "string" ? JSON.parse(row.links) : row.links ?? {};
  return {
    id: `u${row.id}`,
    dbId: Number(row.id),
    role: row.role,
    status: row.status,
    name: row.name,
    username: row.username,
    email: row.email,
    avatar: row.avatar ?? "",
    bio: row.bio ?? "",
    links: {
      instagram: links.instagram ?? "",
      behance: links.behance ?? "",
      website: links.website ?? "",
    },
    joinedAt: row.joined_at ? new Date(row.joined_at).toISOString() : "",
    suspensionReason: row.suspension_reason ?? "",
    suspendedAt: row.suspended_at ? new Date(row.suspended_at).toISOString() : null,
  };
}

export function toArtwork(row) {
  return {
    id: String(row.id),
    userId: `u${row.user_id}`,
    title: row.title,
    description: row.description,
    categoryId: row.category_id == null ? "" : String(row.category_id),
    tags: row.tags ?? [],
    image: row.image,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    likes: Number(row.likes_count ?? 0),
  };
}

export function toChallenge(row) {
  return {
    id: String(row.id),
    curatorId: `u${row.curator_id}`,
    title: row.title,
    description: row.description,
    rules: row.rules,
    prize: row.prize,
    startDate: row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : "",
    endDate: row.end_date ? new Date(row.end_date).toISOString().slice(0, 10) : "",
    banner: row.banner,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  };
}

export function toComment(row) {
  return {
    id: String(row.id),
    artworkId: String(row.artwork_id),
    userId: `u${row.user_id}`,
    text: row.text,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    authorName: row.author_name ?? "",
    authorAvatar: row.author_avatar ?? "",
  };
}
