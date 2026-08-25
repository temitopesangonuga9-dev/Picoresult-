import React, { useState, useEffect } from "react";
import { Database, getDatabase, saveDatabase } from "./data";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import TeacherPortal from "./components/TeacherPortal";
import StudentPortal from "./components/StudentPortal";
import ReportCard from "./components/ReportCard";
import { syncDatabase, saveDatabaseToServer } from "./lib/dbSync";

export default function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [userRole, setUserRole] = useState<"landing" | "admin" | "teacher" | "student">("landing");
  const [userId, setUserId] = useState<string>("");
  const [reportView, setReportView] = useState<{
    studentId: string;
    session: string;
    term: string;
  } | null>(null);

  useEffect(() => {
    const unsub = syncDatabase((syncedDb) => {
      // Robust check: Is it truly empty?
      const hasAnyData = (syncedDb.students && syncedDb.students.length > 0) || 
                         (syncedDb.classes && syncedDb.classes.length > 0) ||
                         (syncedDb.schoolSettings && syncedDb.schoolSettings.schoolName);

      if (!hasAnyData) {
        const seeded = getDatabase();
        // Only seed to cloud if we haven't failed sync
        if (!syncFailed) {
          saveDatabaseToServer(seeded);
        }
        setDb(seeded);
      } else {
        setDb(syncedDb);
        setSyncFailed(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setSyncFailed(true);
      // Fallback to local storage if firestore fails
      const localData = getDatabase();
      setDb(localData);
      setLoading(false);
    });
    return unsub;
  }, [syncFailed]);

  const handleLoginSuccess = (role: "admin" | "teacher" | "student", id: string) => {
  setUserRole(role);
  setUserId(id);
  setReportView(null);
  
  // ADD THIS LINE - reload fresh data from database on login:
  syncDatabase(setDb, (err) => console.error("Sync error:", err));
};

  const handleLogout = () => {
    setUserRole("landing");
    setUserId("");
    setReportView(null);
  };

  const handleUpdateDb = async (newDb: Database) => {
    try {
      await saveDatabaseToServer(newDb);
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(false);
    } catch (error) {
      console.error("Failed to save to Firestore:", error);
      alert("Error saving data to the cloud. Changes saved locally to this browser only.");
      setDb(newDb);
      saveDatabase(newDb);
      setSyncFailed(true);
    }
  };

  // Back from printing goes back to student portal or whichever active portal trigger
  const handleBackToPortal = () => {
    setReportView(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!db) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Failed to load application data. Please check your network or refresh the page.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans tracking-tight antialiased">
      {reportView ? (
        <ReportCard
          studentId={reportView.studentId}
          session={reportView.session}
          term={reportView.term}
          db={db}
          onBack={handleBackToPortal}
        />
      ) : (
        <>
          {userRole === "landing" && (
            <LandingPage db={db} onLoginSuccess={handleLoginSuccess} />
          )}

          {userRole === "admin" && (
            <AdminPortal db={db} onUpdateDb={handleUpdateDb} onLogout={handleLogout} />
          )}

          {userRole === "teacher" && (
            <TeacherPortal
              teacherId={userId}
              db={db}
              onUpdateDb={handleUpdateDb}
              onLogout={handleLogout}
            />
          )}

          {userRole === "student" && (
            <StudentPortal
              studentId={userId}
              db={db}
              onLogout={handleLogout}
              onUpdateDb={handleUpdateDb}
              onViewReport={(session, term) =>
                setReportView({ studentId: userId, session, term })
              }
            />
          )}
        </>
      )}
    </div>
  );
}
