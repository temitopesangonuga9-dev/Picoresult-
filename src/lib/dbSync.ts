import { Database } from "../data";

// Point this at wherever you upload the api/ folder on InfinityFree.
// If the React app and the PHP API are on the SAME domain, a relative
// path like "/api" is enough. If they're on different domains, use the
// full URL, e.g. "https://yoursite.infinityfreeapp.com/api"
const API_BASE = "/api";

let pollInterval: ReturnType<typeof setInterval> | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let latestDbToSave: Database | null = null;
let saveInFlight = false;

// Poll-based replacement for Firestore's onSnapshot. Not truly real-time,
// but simple and reliable. Adjust POLL_MS if you want faster/slower sync.
const POLL_MS = 5000;

export const syncDatabase = (
  onUpdate: (db: Database) => void,
  onError: (err: any) => void
) => {
  const fetchOnce = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_database.php`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Database;
      onUpdate(data);
    } catch (err) {
      onError(err);
    }
  };

  fetchOnce();
  pollInterval = setInterval(fetchOnce, POLL_MS);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
};

// Debounced save: rapid calls (e.g. typing in a score field) collapse
// into a single request 600ms after the LAST change, instead of firing
// one overlapping request per keystroke. This is the fix for the race
// condition that was silently reverting edits.
const SAVE_DEBOUNCE_MS = 600;

export const saveDatabaseToServer = (newDb: Database): Promise<void> => {
  latestDbToSave = newDb;

  return new Promise((resolve, reject) => {
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      if (saveInFlight) {
        // A save is already in progress; the next debounce cycle will
        // pick up latestDbToSave, so it's safe to just resolve here.
        resolve();
        return;
      }
      saveInFlight = true;
      try {
        const res = await fetch(`${API_BASE}/save_database.php`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestDbToSave),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        saveInFlight = false;
      }
    }, SAVE_DEBOUNCE_MS);
  });
};

// ---- Auth ----
export const loginRequest = async (
  username: string,
  password: string,
  role: "admin" | "teacher" | "student"
) => {
  const res = await fetch(`${API_BASE}/login.php`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  return res.json();
};

export const logoutRequest = async () => {
  await fetch(`${API_BASE}/logout.php`, {
    method: "POST",
    credentials: "include",
  });
};
