import React, { useState } from "react";
import { Student } from "../types";
import { Database } from "../data";
import { computeStudentReport } from "../utils";
import { BookOpen, MapPin, Printer, Shield, Calendar, Award, Star, CheckCircle, Smartphone, Lock, AlertCircle, Key, Eye, EyeOff } from "lucide-react";

interface StudentPortalProps {
  studentId: string;
  db: Database;
  onLogout: () => void;
  onUpdateDb: (newDb: Database) => void;
  onViewReport: (session: string, term: string) => void;
}

export default function StudentPortal({ studentId, db, onLogout, onUpdateDb, onViewReport }: StudentPortalProps) {
  // Find current student
  const student = db.students.find((s) => s.id === studentId);

  // Fallback if student not found
  if (!student) {
    return (
      <div className="w-full max-w-md mx-auto mt-20 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl text-center uppercase text-xs">
        <h1 className="text-red-650 font-black mb-2">Student Session Expired</h1>
        <p className="text-slate-500 mb-4">You have been logged out. Please log in again.</p>
        <button onClick={onLogout} className="bg-slate-800 text-white px-4 py-2 rounded font-bold">
          Return to Login
        </button>
      </div>
    );
  }

  // Active Tab/Navigation selection
  const [activeTab, setActiveTab] = useState<"report" | "password">("report");

  // Password Reset State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("All fields are required.");
      return;
    }

    const currentActual = student.password || "12345678";
    if (currentPassword !== currentActual) {
      setPwdError("Incorrect current password.");
      return;
    }

    if (newPassword.length < 4) {
      setPwdError("New password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    // Persist to parent context
    const updatedStudents = db.students.map((s) => {
      if (s.id === studentId) {
        return { ...s, password: newPassword };
      }
      return s;
    });

    onUpdateDb({
      ...db,
      students: updatedStudents,
    });

    setPwdSuccess("Your password was updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Session & Term Selection State
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("Term2");

  // Compute stats on fly for dynamic summary dashboard
  let reportStats;
  try {
    reportStats = computeStudentReport(studentId, selectedSession, selectedTerm, db);
  } catch (err) {
    // If no scores found for selected session/term
    reportStats = null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      
        {/* Welcoming Header Banner */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-emerald-900 text-white rounded-2xl p-6 md:p-8 border-b-4 border-amber-500 shadow-md mb-6 relative overflow-hidden">
          {/* Abstract background graphics */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-lg p-1 shrink-0">
              <img
                src={db.schoolSettings.logoUrl}
                alt={db.schoolSettings.schoolName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="bg-amber-500 text-emerald-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-xs inline-block">
                Student Portal
              </span>
              <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight uppercase">
                {db.schoolSettings.schoolName}
              </h1>
              <p className="text-amber-400 font-semibold italic text-xs">
                Motto: {db.schoolSettings.motto}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-emerald-100 font-bold uppercase mt-2 pt-2 border-t border-white/10">
                <MapPin size={12} className="text-amber-400" />
                <span>{db.schoolSettings.address}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition relative z-10 cursor-pointer shrink-0"
            id="btn_student_logout"
          >
            Logout of Profile
          </button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-text">
        
        {/* Left pane: Profile Card & Performance quick info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-100 shadow-md overflow-hidden relative mb-4">
              <img
                src={student.passportUrl}
                alt={student.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">
               {student.fullName}
            </h2>
            <code className="text-[10px] text-emerald-700 font-bold mt-1 block truncate max-w-full">
              {student.username}
            </code>

            <div className="grid grid-cols-2 gap-3 w-full mt-5 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Reg. Number</span>
                <span className="font-extrabold text-slate-800">{student.regNo}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Current Class</span>
                <span className="font-black text-emerald-800">{student.classId}</span>
              </div>
            </div>
          </div>

          {/* Navigation/Menu Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 select-none">
            <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mb-2 px-1">Navigation Menu</span>
            <button
              onClick={() => {
                setActiveTab("report");
                setPwdError("");
                setPwdSuccess("");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "report"
                  ? "text-white shadow-xs bg-emerald-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Award size={15} className={activeTab === "report" ? "text-amber-400" : "text-emerald-700"} />
                View Report Card
              </span>
              <span className="text-[9px] opacity-70">➔</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("password");
                setPwdError("");
                setPwdSuccess("");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "password"
                  ? "text-white shadow-xs bg-emerald-900"
                  : "text-slate-650 hover:bg-slate-50 hover:text-slate-800"
              }`}
              id="student_nav_password_reset"
            >
              <span className="flex items-center gap-2">
                <Lock size={15} className={activeTab === "password" ? "text-amber-400" : "text-emerald-700"} />
                Password Reset
              </span>
              <span className="text-[9px] opacity-70">➔</span>
            </button>
          </div>

          {/* Quick Metrics display (If report stats exist) */}
          {reportStats && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase border-b border-slate-100 pb-2">
                Performance Dashboard
              </h3>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Term Position:</span>
                <span className="font-black text-emerald-950 bg-emerald-50/50 px-2.5 py-0.5 rounded text-sm">
                  {reportStats.stats.classRankStr} / {reportStats.stats.classSize}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Average Percentage:</span>
                <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-sm">
                  {reportStats.stats.averageScore}%
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Academic Standing:</span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded uppercase text-[10px]">
                  {reportStats.stats.overallPerformance}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Right pane: Session select and interactive result sheet generation OR Password Reset */}
        <div className="lg:col-span-2">
          {activeTab === "report" ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between h-full min-h-[420px]">
              <div>
                <h2 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Award size={18} className="text-emerald-700" />
                  Select Term &amp; Retrieve Result Sheeting
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Academic Session Period</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                      id="student_select_session"
                    >
                      {db.sessions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Current Term</label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                      id="student_select_term"
                    >
                      <option value="Term1">1ST TERM</option>
                      <option value="Term2">2ND TERM CUMULATIVE</option>
                      <option value="Term3">3RD TERM</option>
                    </select>
                  </div>
                </div>

                {/* Quick overview of course totals */}
                {reportStats ? (
                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">Subject Performance Brief</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {reportStats.subjectsReport.map((sr) => (
                        <div key={sr.subjectId} className="flex justify-between p-2 bg-white rounded border border-slate-100">
                          <span className="font-bold text-slate-600 truncate max-w-[130px]">{sr.subjectName}</span>
                          <span className="font-extrabold text-emerald-800">
                            {sr.total} <code className="text-rose-600">({sr.grade})</code>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-amber-50 rounded-xl border border-dashed border-amber-300 text-amber-800 uppercase font-bold text-xs mb-6">
                    No exam record sheets found in database for selected Period ({selectedSession} — {selectedTerm}).
                  </div>
                )}
              </div>

              <div>
                {reportStats && (
                  <button
                    onClick={() => onViewReport(selectedSession, selectedTerm)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs uppercase"
                    id="btn_view_report_card"
                  >
                    <Printer size={18} />
                    Generate and View Report Sheet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between h-full min-h-[420px]">
              <div>
                <h2 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-emerald-750 text-emerald-700" />
                  Secure Student Password Reset
                </h2>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Provide your current security credentials below to establish a new customized access code for your portal account.
                </p>

                {pwdError && (
                  <div className="bg-rose-50 border border-rose-250 p-3.5 rounded-xl text-xs text-rose-700 font-extrabold flex items-center gap-2 mb-5">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                {pwdSuccess && (
                  <div className="bg-emerald-50 border border-emerald-250 p-3.5 rounded-xl text-xs text-emerald-800 font-extrabold flex items-center gap-2 mb-5">
                    <CheckCircle size={15} className="text-emerald-750 shrink-0" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Current Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Key size={14} />
                      </div>
                      <input
                        type={showCurrent ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold placeholder:font-normal"
                        id="student_reset_current_password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-650 cursor-pointer"
                        title={showCurrent ? "Hide password" : "Show password"}
                      >
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">New Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold placeholder:font-normal"
                        id="student_reset_new_password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-455 hover:text-slate-655 cursor-pointer"
                        title={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase">Minimum 4 characters required</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Confirm New Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold placeholder:font-normal"
                        id="student_reset_confirm_password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-455 hover:text-slate-655 cursor-pointer"
                        title={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide px-5 py-3 rounded-lg transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Lock size={14} />
                      Update Portal Password
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">
                Managed securely &bull; Progress Intellectual Schools IT Board
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
