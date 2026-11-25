const DB_KEY = "desrefuses_db_v2";

function emptyDb() {
  return {
    categories: [],
    users: [],
    artworks: [],
    comments: [],
    reports: [],
    challenges: [],
    submissions: [],
    collections: [],
  };
}

export function loadDb() {
  if (typeof window === "undefined") return emptyDb();

  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();

    const parsed = JSON.parse(raw);
    const required = ["categories", "users", "artworks", "comments", "reports", "challenges", "submissions"];
    if (!parsed || required.some((key) => !Array.isArray(parsed[key]))) {
      return emptyDb();
    }
    return parsed;
  } catch {
    return emptyDb();
  }
}

export function saveDb(db) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

export function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function isoNow() {
  return new Date().toISOString();
}
