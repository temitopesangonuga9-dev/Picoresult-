import React, { useState, useEffect } from "react";
import { Database, getDatabase, saveDatabase } from "./data";
import LandingPage from "./components/LandingPage";
import AdminPortal from "./components/AdminPortal";
import TeacherPortal from "./components/TeacherPortal";
import StudentPortal from "./components/StudentPortal";
import ReportCard from "./components/ReportCard";

export default function App() {
  const [db, setDb] = useState<Database>(getDatabase());
  const [userRole, setUserRole] = useState<"landing" | "admin" | "teacher" | "student">("landing");
  const [userId, setUserId] = useState<string>("");

  // Report view toggler: If not null, shows printable report sheet overlay
  const [reportView, setReportView] = useState<{
    studentId: string;
    session: string;
    term: string;
  } | null>(null);

  const handleUpdateDb = (newDb: Database) => {
    setDb(newDb);
    saveDatabase(newDb);
  };

  const handleLoginSuccess = (role: "admin" | "teacher" | "student", id: string) => {
    setUserRole(role);
    setUserId(id);
    setReportView(null);
  };

  const handleLogout = () => {
    setUserRole("landing");
    setUserId("");
    setReportView(null);
  };

  // Back from printing goes back to student portal or whichever active portal trigger
  const handleBackToPortal = () => {
    setReportView(null);
  };

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
