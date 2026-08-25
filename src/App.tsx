import { useState, useEffect } from "react";
import { Database } from "./data";
import { syncDatabase, saveDatabaseToServer } from "./lib/dbSync";
import { saveDatabase, loadDatabase } from "./lib/localStorage";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import TeacherPortal from "./components/TeacherPortal";
import StudentPortal from "./components/StudentPortal";

export default function App() {
  const [userRole, setUserRole] = useState<"landing" | "admin" | "teacher" | "student">("landing");
  const [userId, setUserId] = useState("");
  const [db, setDb] = useState<Database | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [reportView, setReportView] = useState<string | null>(null);

  // On app load: try to load local cache first, then sync from server
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 1. Load from browser cache first (fast)
        const cachedDb = loadDatabase();
        if (cachedDb) {
          setDb(cachedDb);
        }

        // 2. Fetch fresh data from server (will overwrite cache)
        syncDatabase(
          (freshDb) => {
            setDb(freshDb);
            saveDatabase(freshDb); // Update cache
            setSyncFailed(false);
          },
          (err) => {
            console.error("Initial sync error:", err);
            // Cache is still available if sync fails
            setSyncFailed(true);
          }
        );
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    };

    loadInitialData();
  }, []);

  // Handle successful login: reload fresh data from server
  const handleLoginSuccess = async (role: "admin" | "teacher" | "student", id: string) => {
    setUserRole(role);
    setUserId(id);
    setReportView(null);

    // **KEY FIX:** Fetch fresh data from server after login
    try {
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
    } catch (err) {
      console.error("Login sync failed:", err);
    }
  };

  // Handle logout (keep data cached - don't clear it)
  const handleLogout = () => {
    setUserRole("landing");
    setUserId("");
    setReportView(null);
    // DON'T clear db - keep it cached for next login
  };

  // Handle data updates: save to server AND local cache
  const handleUpdateDb = async (newDb: Database) => {
    try {
      // Save to server
      await saveDatabaseToServer(newDb);
      // Update local state and cache
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(false);
    } catch (error) {
      console.error("Failed to save to server:", error);
      // Keep the changes locally even if save fails
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(true);
      alert("Error saving to server. Changes saved locally. Please try again.");
    }
  };

  // Show loading state if data not yet loaded
  if (db === null && userRole === "landing") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Route to appropriate portal based on user role
  if (userRole === "landing") {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (userRole === "admin" && db) {
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

  if (userRole === "teacher" && db) {
    return (
      <TeacherPortal
        db={db}
        onUpdateDb={handleUpdateDb}
        onLogout={handleLogout}
        userId={userId}
        syncFailed={syncFailed}
      />
    );
  }

  if (userRole === "student" && db) {
    return (
      <StudentPortal
        db={db}
        onUpdateDb={handleUpdateDb}
        onLogout={handleLogout}
        userId={userId}
        syncFailed={syncFailed}
      />
    );
  }

  return null;
}
