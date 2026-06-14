import React, { useState } from "react";
import { Score, Student } from "../types";
import { Database } from "../data";
import { getScoreComponents, calculateCurrentTermTotal } from "../utils";
import { Table, Download, Eye, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface BroadsheetProps {
  db: Database;
  teacherId?: string; // If provided, limits classes/subjects to what the teacher teaches
}

export default function Broadsheet({ db, teacherId }: BroadsheetProps) {
  const [activeTab, setActiveTab] = useState<"subject" | "class">("subject");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [generated, setGenerated] = useState(false);

  // For teacher portal we could filter
  // However, Admin requested this so let's check teacher assignment
  const allowedClasses = teacherId 
    ? db.classTeacherAssignments.filter(a => a.teacherId === teacherId).map(a => a.classId)
    // maybe we should also check subject assignment?
    : db.classes.map(c => c.id);
    
  let availableClasses = db.classes.filter(c => !teacherId || allowedClasses.includes(c.id));
  
  // If teacher, they might teach subject without being a form teacher, so let's give them classes where they teach
  if (teacherId) {
     const teacherSubjects = db.subjectAssignments.filter(sa => sa.teacherId === teacherId);
     const classesTaught = Array.from(new Set(teacherSubjects.map(ts => ts.classId)));
     // Merge class teacher and subject teacher classes
     const allClassIds = Array.from(new Set([...allowedClasses, ...classesTaught]));
     availableClasses = db.classes.filter(c => allClassIds.includes(c.id));
  }

  const availableSubjects = db.subjects.filter(sub => {
    if (!teacherId || !selectedClass) return true;
    const assignment = db.subjectAssignments.find(sa => sa.classId === selectedClass && sa.subjectId === sub.id && sa.teacherId === teacherId);
    return !!assignment;
  });

  const students = db.students.filter(s => s.classId === selectedClass);
  const scoreComponents = getScoreComponents(db);

  const getSubjectTotal = (studentId: string, subjectId: string) => {
    const score = db.scores.find(sc => sc.studentId === studentId && sc.subjectId === subjectId);
    if (!score) return 0;
    return calculateCurrentTermTotal(score, scoreComponents);
  };

  const getStudentClassTotal = (studentId: string, allClassSubjects: string[]) => {
    let total = 0;
    allClassSubjects.forEach(subId => {
      total += getSubjectTotal(studentId, subId);
    });
    return total;
  };

  // Helper to calculate positions
  const calculateRanks = (items: { id: string, score: number }[]) => {
    const sorted = [...items].sort((a, b) => b.score - a.score);
    const ranks: Record<string, number> = {};
    let currentRank = 1;
    let prevScore = -1;
    let rankOffset = 0;

    sorted.forEach((item, index) => {
      if (item.score === prevScore) {
        ranks[item.id] = currentRank;
        rankOffset++;
      } else {
        currentRank += rankOffset;
        ranks[item.id] = currentRank;
        rankOffset = 1;
        prevScore = item.score;
      }
    });
    return ranks;
  };

  // Subject Broadsheet Rows
  let subjectRows: { student: Student, score: number, rawScore: Score | null, position: number }[] = [];
  if (activeTab === "subject" && generated) {
    const data = students.map(s => {
      const dbScore = db.scores.find(sc => sc.studentId === s.id && sc.subjectId === selectedSubject);
      return {
        student: s,
        score: getSubjectTotal(s.id, selectedSubject),
        rawScore: dbScore || null
      };
    });
    const ranks = calculateRanks(data.map(d => ({ id: d.student.id, score: d.score })));
    subjectRows = data.map(d => ({
      ...d,
      position: ranks[d.student.id]
    })).sort((a, b) => a.position - b.position); // Sort by position
  }

  // Class Broadsheet Rows
  const classSubjects: string[] = Array.from(new Set(
    db.scores.filter(sc => students.some(s => s.id === sc.studentId)).map(sc => sc.subjectId)
  ));
  
  let classRows: { student: Student, totals: Record<string, number>, overallScore: number, percentage: number, position: number }[] = [];
  if (activeTab === "class" && generated) {
    const maxPossiblePerSubject = scoreComponents.reduce((acc, curr) => acc + curr.maxMark, 0);
    const maxTotalScore = classSubjects.length * maxPossiblePerSubject;

    const data = students.map(s => {
      const totals: Record<string, number> = {};
      classSubjects.forEach(sub => {
        totals[sub] = getSubjectTotal(s.id, sub);
      });
      const overall = getStudentClassTotal(s.id, classSubjects);
      const percentage = maxTotalScore > 0 ? (overall / maxTotalScore) * 100 : 0;
      return {
        student: s,
        totals,
        overallScore: overall,
        percentage
      };
    });

    const ranks = calculateRanks(data.map(d => ({ id: d.student.id, score: d.overallScore })));
    classRows = data.map(d => ({
      ...d,
      position: ranks[d.student.id]
    })).sort((a, b) => a.position - b.position);
  }

  const handleGenerate = () => {
    if (activeTab === "subject" && (!selectedClass || !selectedSubject)) return;
    if (activeTab === "class" && !selectedClass) return;
    setGenerated(true);
  };

  const getNumberSuffix = (i: number) => {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const themeColor = db.schoolSettings?.themeColor || "#064e3b";

  const getCompScore = (score: Score | null, compId: string) => {
    if (!score) return "-";
    if (compId === "test1") return score.test1 ?? 0;
    if (compId === "test2") return score.test2 ?? 0;
    if (compId === "exam") return score.exam ?? 0;
    return score.customScores?.[compId] ?? 0;
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>
      
      <div className="flex gap-4 border-b border-slate-200 print:hidden">
        <button 
          onClick={() => { setActiveTab("subject"); setGenerated(false); }}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors ${activeTab === "subject" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Subject Broadsheet
        </button>
        <button 
          onClick={() => { setActiveTab("class"); setGenerated(false); }}
          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors ${activeTab === "class" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Class Broadsheet
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col md:flex-row gap-4 items-end print:hidden">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => { setSelectedClass(e.target.value); setGenerated(false); setSelectedSubject(""); }} 
            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold outline-none focus:border-emerald-500"
          >
            <option value="">-- Select Class --</option>
            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        
        {activeTab === "subject" && (
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => { setSelectedSubject(e.target.value); setGenerated(false); }} 
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold outline-none focus:border-emerald-500"
              disabled={!selectedClass}
            >
              <option value="">-- Select Subject --</option>
              {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        
        <div className="flex gap-2">
          <button 
            onClick={handleGenerate}
            disabled={activeTab === "subject" ? (!selectedClass || !selectedSubject) : !selectedClass}
            className="h-[34px] md:h-auto bg-emerald-600 text-white font-bold text-xs py-2 px-6 rounded-lg disabled:bg-slate-300 flex items-center justify-center gap-2 uppercase hover:bg-emerald-700"
          >
            <Table size={14} /> Generate
          </button>
          
          <button 
            onClick={() => window.print()}
            disabled={!generated}
            className="h-[34px] md:h-auto bg-blue-600 text-white font-bold text-xs py-2 px-6 rounded-lg disabled:bg-slate-300 flex items-center justify-center gap-2 uppercase hover:bg-blue-700"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="print:block" style={{ width: "100%" }}>
        <div className="hidden print:block mb-4 text-center pb-2">
          <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: themeColor }}>
             {db.schoolSettings?.schoolName || "School Broadsheet"}
          </h2>
          <h3 className="text-sm font-bold text-slate-700 mt-1 uppercase">
            {activeTab === "subject" ? `Subject Broadsheet: ${db.subjects.find(s => s.id === selectedSubject)?.name || ""}` : `Class Broadsheet`}
            &nbsp;— {db.classes.find(c => c.id === selectedClass)?.name || ""}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {generated && activeTab === "subject" && (
          <div className="bg-white border md:border-slate-200 border-none rounded-xl shadow-sm overflow-hidden animate-fade-in print:shadow-none print:p-0">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="text-white text-[11px] font-bold uppercase tracking-wider text-center" style={{ backgroundColor: themeColor }}>
                    <th className="p-2 border border-white/20 w-16">Pos</th>
                    <th className="p-2 border border-white/20 text-left">Student Name</th>
                    <th className="p-2 border border-white/20 w-32">Reg No</th>
                    {scoreComponents.map(comp => (
                      <th key={comp.id} className="p-2 border border-white/20 text-center">{comp.name} ({comp.maxMark})</th>
                    ))}
                    <th className="p-2 border border-white/20 w-24 text-center">1st Term</th>
                    <th className="p-2 border border-white/20 w-24 text-center">2nd Term</th>
                    <th className="p-2 border border-white/20 w-24 text-center bg-black/10">Term Total</th>
                    <th className="p-2 border border-white/20 w-24 text-center">Cum. Total</th>
                    <th className="p-2 border border-white/20 w-24 text-center">Cum. Avg</th>
                    <th className="p-2 border border-white/20 w-16 text-center">Grade</th>
                    <th className="p-2 border border-white/20 w-24 text-center">Remark</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-bold text-slate-800">
                  {subjectRows.length > 0 ? subjectRows.map((row) => {
                    const firstTerm = row.rawScore?.firstTerm || 0;
                    const secondTerm = row.rawScore?.secondTerm || 0;
                    const cumTotal = firstTerm + secondTerm + row.score;
                    const term = row.rawScore?.term || "Term1";
                    const multiplier = term === "Term3" ? 3 : term === "Term2" ? 2 : 1;
                    const avg = cumTotal / multiplier;
                    const gradeInfo = row.rawScore ? db.schoolSettings?.schoolName ? (() => {
                      if (avg >= 75) return { grade: "A1", text: "Excellent" };
                      if (avg >= 70) return { grade: "B2", text: "Very good" };
                      if (avg >= 65) return { grade: "B3", text: "Good" };
                      if (avg >= 60) return { grade: "C4", text: "Credit" };
                      if (avg >= 55) return { grade: "C5", text: "Credit" };
                      if (avg >= 50) return { grade: "C6", text: "Credit" };
                      if (avg >= 45) return { grade: "D7", text: "Pass" };
                      if (avg >= 40) return { grade: "E8", text: "Pass" };
                      return { grade: "F9", text: "Fail" };
                    })() : { grade: "-", text: "-" } : { grade: "-", text: "-" };
                    return (
                    <tr key={row.student.id} className="border-b border-slate-300 print:break-inside-avoid hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-300">
                        <span className="font-bold text-xs text-slate-800">{row.position}</span>
                        <span className="text-[9px] text-slate-500">{getNumberSuffix(row.position)}</span>
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        {row.student.fullName}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-[9px] text-slate-600">
                        {row.student.regNo}
                      </td>
                      {scoreComponents.map(comp => (
                        <td key={comp.id} className="p-2 text-center border-r border-slate-300">
                          {getCompScore(row.rawScore, comp.id)}
                        </td>
                      ))}
                      <td className="p-2 text-center border-r border-slate-300 text-slate-600">
                        {firstTerm > 0 ? firstTerm : "-"}
                      </td>
                      <td className="p-2 text-center border-r border-slate-300 text-slate-600">
                        {secondTerm > 0 ? secondTerm : "-"}
                      </td>
                      <td className="p-2 text-center text-[11px] font-bold border-r border-slate-300 bg-emerald-50">
                         {row.score}
                      </td>
                      <td className="p-2 text-center text-xs font-black border-r border-slate-300 text-emerald-800">
                         {cumTotal}
                      </td>
                      <td className="p-2 text-center text-[11px] font-bold border-r border-slate-300">
                         {avg.toFixed(1)}%
                      </td>
                      <td className="p-2 text-center text-xs font-black border-r border-slate-300" style={{ color: gradeInfo.grade.includes("A") || gradeInfo.grade.includes("B") ? "#15803d" : gradeInfo.grade.includes("F") ? "#b91c1c" : "inherit" }}>
                         {gradeInfo.grade}
                      </td>
                      <td className="p-2 text-center text-[9px] font-bold border-r border-slate-300">
                         {gradeInfo.text}
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                       <td colSpan={11 + scoreComponents.length} className="p-6 text-center text-xs font-bold text-slate-400">No students recorded in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {generated && activeTab === "class" && (
          <div className="bg-white border md:border-slate-200 border-none rounded-xl shadow-sm overflow-hidden animate-fade-in w-full max-w-full print:shadow-none print:p-0">
            <div className="overflow-x-auto print:overflow-visible" style={{ maxWidth: '100%' }}>
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="text-white text-[11px] font-bold uppercase tracking-wider text-center" style={{ backgroundColor: themeColor }}>
                    <th className="p-2 border border-white/20 w-16 sticky md:static left-0 z-10 shadow-[1px_0_0_#cbd5e1] print:shadow-none bg-inherit md:bg-transparent">Pos</th>
                    <th className="p-2 border border-white/20 text-left sticky md:static left-[48px] z-10 shadow-[1px_0_0_#cbd5e1] print:shadow-none bg-inherit md:bg-transparent min-w-[200px]">Student Name</th>
                    <th className="p-2 border border-white/20 w-24">Reg No</th>
                    {classSubjects.map(subId => {
                      const subInfo = db.subjects.find(s => s.id === subId);
                      return (
                        <React.Fragment key={subId}>
                          <th colSpan={4} className="p-1 border border-white/20 text-center" title={subInfo?.name}>{subInfo?.name || subId}</th>
                        </React.Fragment>
                      );
                    })}
                    <th className="p-2 border border-white/20 text-center w-20">Overall Total</th>
                    <th className="p-2 border border-white/20 text-center w-24">%</th>
                    <th className="p-2 border border-white/20 w-16 text-center">Grade</th>
                    <th className="p-2 border border-white/20 w-24 text-center">Remark</th>
                  </tr>
                  <tr className="text-white text-[9px] font-bold uppercase tracking-wider text-center" style={{ backgroundColor: themeColor }}>
                    <th className="p-1 border-r border-white/20"></th>
                    <th className="p-1 border-r border-white/20"></th>
                    <th className="p-1 border-r border-white/20"></th>
                    {classSubjects.map(subId => (
                      <React.Fragment key={subId}>
                        <th className="p-1 border-r border-white/20">T1</th>
                        <th className="p-1 border-r border-white/20">T2</th>
                        <th className="p-1 border-r border-white/20">EX</th>
                        <th className="p-1 border-r border-white/20">TOT</th>
                      </React.Fragment>
                    ))}
                    <th className="p-1 border-r border-white/20"></th>
                    <th className="p-1 border-r border-white/20"></th>
                    <th className="p-1 border-r border-white/20"></th>
                    <th className="p-1"></th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-bold text-slate-800">
                  {classRows.length > 0 ? classRows.map((row) => {
                    const avg = row.percentage;
                     const gradeInfo = db.schoolSettings?.schoolName ? (() => {
                      if (avg >= 75) return { grade: "A1", text: "Excellent" };
                      if (avg >= 70) return { grade: "B2", text: "Very good" };
                      if (avg >= 65) return { grade: "B3", text: "Good" };
                      if (avg >= 60) return { grade: "C4", text: "Credit" };
                      if (avg >= 55) return { grade: "C5", text: "Credit" };
                      if (avg >= 50) return { grade: "C6", text: "Credit" };
                      if (avg >= 45) return { grade: "D7", text: "Pass" };
                      if (avg >= 40) return { grade: "E8", text: "Pass" };
                      return { grade: "F9", text: "Fail" };
                    })() : { grade: "-", text: "-" };
                    
                    return (
                    <tr key={row.student.id} className="border-b border-slate-300 print:break-inside-avoid hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-300 sticky md:static left-0 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_#cbd5e1] z-10 print:shadow-none">
                        <span className="font-bold text-xs text-slate-800">{row.position}</span>
                      </td>
                      <td className="p-2 border-r border-slate-300 sticky md:static left-[48px] bg-white group-hover:bg-slate-50 shadow-[1px_0_0_#cbd5e1] z-10 print:shadow-none max-w-[200px] print:max-w-none">
                        <div className="text-[11px] truncate" title={row.student.fullName}>{row.student.fullName}</div>
                      </td>
                      <td className="p-2 text-center text-[11px] border-r border-slate-300 font-mono text-slate-600">
                        {row.student.regNo}
                      </td>
                      {classSubjects.map(subId => {
                         const scoreObj = db.scores.find(sc => sc.studentId === row.student.id && sc.subjectId === subId);
                         return (
                            <React.Fragment key={subId}>
                               <td className="p-1 text-center text-[10px] border-r border-slate-300">{scoreObj?.test1 || "-"}</td>
                               <td className="p-1 text-center text-[10px] border-r border-slate-300">{scoreObj?.test2 || "-"}</td>
                               <td className="p-1 text-center text-[10px] border-r border-slate-300">{scoreObj?.exam || "-"}</td>
                               <td className="p-1 text-center text-[10px] font-bold border-r border-slate-300 bg-emerald-50">{row.totals[subId]}</td>
                            </React.Fragment>
                         );
                      })}
                      <td className="p-2 text-center text-[11px] font-bold text-slate-800 border-r border-slate-300">
                        {row.overallScore}
                      </td>
                      <td className="p-2 text-center text-[11px] font-bold border-r border-slate-300">
                        {row.percentage.toFixed(1)}%
                      </td>
                      <td className="p-2 text-center text-xs font-black border-r border-slate-300" style={{ color: gradeInfo.grade.includes("A") || gradeInfo.grade.includes("B") ? "#15803d" : gradeInfo.grade.includes("F") ? "#b91c1c" : "inherit" }}>
                          {gradeInfo.grade}
                      </td>
                      <td className="p-2 text-center text-[9px] font-bold border-r border-slate-300">
                          {gradeInfo.text}
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                       <td colSpan={classSubjects.length * 4 + 7} className="p-6 text-center text-xs font-bold text-slate-400">No students or scores recorded in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

