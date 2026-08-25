import { useState, useEffect } from "react";
import { Database } from "./data";
import { syncDatabase, saveDatabaseToServer } from "./lib/dbSync";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import TeacherPortal from "./components/TeacherPortal";
import StudentPortal from "./components/StudentPortal";

// Simple localStorage helpers (inline if localStorage.ts doesn't exist)
const saveDatabase = (db: Database) => {
  try {
    localStorage.setItem("picoresult_db", JSON.stringify(db));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
};

const loadDatabase = (): Database | null => {
  try {
    const cached = localStorage.getItem("picoresult_db");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Failed to load from localStorage:", err);
    return null;
  }
};

export default function App() {
  const [userRole, setUserRole] = useState<"landing" | "admin" | "teacher" | "student">("landing");
  const [userId, setUserId] = useState("");
  const [db, setDb] = useState<Database | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [reportView, setReportView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load: load cached data, then sync fresh from server
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load from cache first
        const cachedDb = loadDatabase();
        if (cachedDb) {
          setDb(cachedDb);
        }

        // Fetch fresh data from server
        syncDatabase(
          (freshDb) => {
            setDb(freshDb);
            saveDatabase(freshDb);
            setSyncFailed(false);
          },
          (err) => {
            console.error("Initial sync error:", err);
            setSyncFailed(true);
          }
        );
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle login: fetch fresh data from server
  const handleLoginSuccess = (role: "admin" | "teacher" | "student", id: string) => {
    setUserRole(role);
    setUserId(id);
    setReportView(null);

    // Fetch fresh data from server after login
    syncDatabase(
      (freshDb) => {
        setDb(freshDb);
        saveDatabase(freshDb);
        setSyncFailed(false);
      },
      (err) => {
        console.error("Sync error after login:", err);
        setSyncFailed(true);
      }
    );
  };

  // Handle logout: keep data cached
  const handleLogout = () => {
    setUserRole("landing");
    setUserId("");
    setReportView(null);
    // Data stays cached - don't clear it
  };

  // Handle data updates: save to server AND cache
  const handleUpdateDb = async (newDb: Database) => {
    try {
      await saveDatabaseToServer(newDb);
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(false);
    } catch (error) {
      console.error("Failed to save to server:", error);
      // Keep changes locally
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(true);
      alert("Error saving to server. Changes saved locally.");
    }
  };

  // Show loading
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Landing page (no db required yet)
  if (userRole === "landing") {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Require db for all portals
  if (!db) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2>Loading data...</h2>
      </div>
    );
  }

  // Admin portal
  if (userRole === "admin") {
    return (
      <AdminPortal
        db={db}
        onUpdateDb={handleUpdateDb}
        onLogout={handleLogout}
        syncFailed={syncFailed}
        reportView={reportView}
        setReportView={setReportView}
      />
    );
  }

  // Teacher portal
  if (userRole === "teacher") {
    return (
      <TeacherPortal
        db={db}
        onUpdateDb={handleUpdateDb}
        onLogout={handleLogout}
        teacherId={userId}
        syncFailed={syncFailed}
      />
    );
  }

  // Student portal
  if (userRole === "student") {
    return (
      <StudentPortal
        db={db}
        onUpdateDb={handleUpdateDb}
        onLogout={handleLogout}
        studentId={userId}
        syncFailed={syncFailed}
      />
    );
  }

  return null;
}
