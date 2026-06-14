import React, { useState } from "react";
import { Database } from "../data";
import { BookOpen, Shield, GraduationCap, Users, MapPin, Key, User, ArrowRight, Star, Heart, Eye, EyeOff } from "lucide-react";

interface LandingPageProps {
  db: Database;
  onLoginSuccess: (role: "admin" | "teacher" | "student", id: string) => void;
}

type LoginRole = "student" | "teacher" | "admin";

export default function LandingPage({ db, onLoginSuccess }: LandingPageProps) {
  const [activeRole, setActiveRole] = useState<LoginRole>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { schoolName, motto, logoUrl } = db.schoolSettings;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Both username and password fields are required.");
      return;
    }

    const cleanUser = username.trim().toLowerCase();

    if (activeRole === "admin") {
      if (cleanUser === "admin@progressintellectual.edu.ng" && password === "admin123") {
        onLoginSuccess("admin", "admin_root");
      } else {
        const adminMatch = db.admins?.find(a => a.username.toLowerCase() === cleanUser);
        if (adminMatch && password === adminMatch.password) {
           onLoginSuccess("admin", adminMatch.id);
        } else {
           setErrorMsg("Invalid Admin portal credentials.");
        }
      }
    } else if (activeRole === "teacher") {
      const match = db.teachers.find(
        (t) => t.username.toLowerCase() === cleanUser
      );
      if (match && password === "12345678") {
        onLoginSuccess("teacher", match.id);
      } else {
        setErrorMsg("Invalid Teacher portal coordinates. Use e.g., seyiadewole@progressintellectual.edu.ng / 12345678");
      }
    } else if (activeRole === "student") {
      const match = db.students.find(
        (s) => s.username.toLowerCase() === cleanUser
      );
      if (match && password === (match.password || "12345678")) {
        onLoginSuccess("student", match.id);
      } else {
        setErrorMsg("Student registration name or password unrecognized. Use e.g., ojooluwaseyifunmirukayat@progressintellectual.edu.ng / 12345678");
      }
    }
  };

  // Helper for quick demo fast logs
  const triggerAutoLoginHelper = (role: LoginRole, userStr: string, passStr: string) => {
    setActiveRole(role);
    setUsername(userStr);
    setPassword(passStr);
    setErrorMsg("");
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col justify-between select-text">
      
      {/* Navigation Header */}
      <header className="bg-emerald-900 text-white flex items-center justify-between px-4 sm:px-8 py-4 border-b-4 border-amber-500 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-md shrink-0">
              <img src={logoUrl} alt={schoolName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="block font-black text-white text-xs sm:text-sm uppercase tracking-tight leading-none">
                {schoolName}
              </span>
              <p className="text-[10px] text-amber-400 italic font-medium mt-1">
                Motto: {motto}
              </p>
            </div>
          </div>

          {/* Quick navigations trigger */}
          <div className="flex gap-2 text-[10px] sm:text-xs">
            <button
              onClick={() => {
                setActiveRole("student");
                setErrorMsg("");
              }}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer ${
                activeRole === "student" ? "bg-amber-500 text-emerald-950 font-black shadow-sm" : "bg-emerald-800 text-emerald-105 hover:bg-emerald-700"
              }`}
            >
              Student Portal
            </button>
            <button
              onClick={() => {
                setActiveRole("teacher");
                setErrorMsg("");
              }}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer ${
                activeRole === "teacher" ? "bg-amber-500 text-emerald-950 font-black shadow-sm" : "bg-emerald-800 text-emerald-110 hover:bg-emerald-700"
              }`}
            >
              Teacher Portal
            </button>
            <button
              onClick={() => {
                setActiveRole("admin");
                setErrorMsg("");
              }}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-colors cursor-pointer ${
                activeRole === "admin" ? "bg-amber-500 text-emerald-950 font-black shadow-sm" : "bg-emerald-800 text-emerald-110 hover:bg-emerald-700"
              }`}
            >
              Admin Portal
            </button>
          </div>

        </div>
      </header>

      {/* Hero & Login main container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left side: Hero content */}
        <div className="lg:col-span-7 space-y-6 md:pr-4">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-[10px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider">
            <Star size={12} className="fill-amber-600 stroke-[2.5]" />
            Federal Republic of Nigeria Curriculum Standard
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-emerald-950 tracking-tight leading-tighter uppercase mb-2">
            Automated Academic <br className="hidden sm:inline" />
            <span className="text-emerald-700">Results Registry</span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-lg">
            {schoolName} leverages secondary school cumulative scoring matrices to calculate precise, high-fidelity west African grade ratings, class section ranks, and psychomotor observations instantly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 max-w-lg uppercase text-[11px]">
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                <Shield size={16} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 block">Durable Integrity</span>
                <span className="text-slate-400 text-[9px]">Tamper-proof grade ledger logs.</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <BookOpen size={16} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 block">Nigerian WAEC Grade Ratios</span>
                <span className="text-slate-400 text-[9px]">A1 Distinction down to F9 fail limits.</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="p-4 bg-emerald-900 text-white rounded-2xl space-y-2.5 uppercase max-w-lg border border-emerald-950 shadow-sm text-[10px]">
            <p className="font-extrabold text-amber-400 tracking-wider">Instant Fast Demo Logins:</p>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-800/65">
              <button
                onClick={() =>
                  triggerAutoLoginHelper(
                    "student",
                    "ojooluwaseyifunmirukayat@progressintellectual.edu.ng",
                    "12345678"
                  )
                }
                className="bg-white/10 hover:bg-white/25 px-2.5 py-1.5 rounded font-black transition cursor-pointer text-slate-50 border border-white/5 truncate max-w-[280px]"
              >
                Student (RUKAYAT)
              </button>
              <button
                onClick={() =>
                  triggerAutoLoginHelper(
                    "teacher",
                    "seyiadewole@progressintellectual.edu.ng",
                    "12345678"
                  )
                }
                className="bg-white/10 hover:bg-white/25 px-2.5 py-1.5 rounded font-black transition cursor-pointer text-slate-50 border border-white/5 truncate max-w-[180px]"
              >
                Teacher (Mr. Seyi)
              </button>
              <button
                onClick={() =>
                  triggerAutoLoginHelper("admin", "admin@progressintellectual.edu.ng", "admin123")
                }
                className="bg-white/10 hover:bg-white/25 px-2.5 py-1.5 rounded font-black transition cursor-pointer text-slate-50 border border-white/5"
              >
                Administrator
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Interactive Login Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8 select-text">
          
          <div className="text-center mb-6">
            <span className="text-[10px] text-emerald-800 font-extrabold tracking-widest uppercase bg-emerald-50 px-2 py-1 rounded">
              Secure Registry Gateway
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-3 uppercase border-b-2 border-emerald-500 pb-1 inline-block">
              {activeRole} Login Panel
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
              Input credentials below to access secondary database
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
            
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1 text-[10px]">Portal Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`${activeRole === 'admin' ? 'admin' : activeRole}@progressintellectual.edu.ng`}
                  className="w-full pl-9 pr-3.5 py-3 border-b border-slate-300 focus:border-emerald-500 outline-none bg-slate-50/50 rounded-lg text-sm"
                  id="login_username"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1 text-[10px]">Password Hash</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 border-b border-slate-300 focus:border-emerald-500 outline-none bg-slate-50/50 rounded-lg text-sm"
                  id="login_password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-650 bg-red-50 p-2.5 rounded border border-red-200/50 font-bold leading-normal">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer text-xs uppercase tracking-wide"
              id="btn_submit_login"
            >
              Sign In to {activeRole} Portal
              <ArrowRight size={14} />
            </button>

          </form>

          <p className="text-[10px] text-slate-400 text-center uppercase font-bold mt-4">
            Security regulated by Progress Intellectual IT Board.
          </p>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400/80 text-[10px] sm:text-xs font-medium py-3 border-t border-slate-800 text-center uppercase tracking-normal">
        <p>
          &copy; 2025/2026 {schoolName}. All Rights Reserved. {motto}.
        </p>
      </footer>

    </div>
  );
}
