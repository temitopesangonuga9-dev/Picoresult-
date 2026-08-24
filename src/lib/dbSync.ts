import { Database } from "../data";

const API_BASE = "/api";

let pollInterval: ReturnType<typeof setInterval> | null = null;

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
  //pollInterval = setInterval(fetchOnce, 5000);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
};

export const saveDatabaseToServer = async (newDb: Database): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/save_database.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDb),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Save error:", err);
    throw err;
  }
};

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
