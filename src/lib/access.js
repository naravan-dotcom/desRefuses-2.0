export const dashboardSections = {
  admin: ["users", "curators", "categories", "moderation"],
  curator: ["challenges"],
  member: ["artworks", "favorites", "submissions", "profile", "account"],
};

export function canOpenDashboard(role, pathname) {
  const section = pathname.split("/")[2];
  if (!section) return true;
  return (dashboardSections[role] ?? []).includes(section);
}

export function homeForUser(user) {
  if (!user) return "/login";
  if (user.status === "suspended") return "/suspended";
  if (user.role === "admin") return "/dashboard";
  if (user.role === "curator") {
    return user.status === "approved" ? "/dashboard/challenges" : "/pending";
  }
  return "/home";
}
