import React, { useState } from "react";
import { Score, Student, AffectiveTraits, PsychomotorSkills } from "../types";
import { Database, DEFAULT_TEACHER_AVATAR, DEFAULT_STUDENT_AVATAR, generateUsername } from "../data";
import { calculateGrade, getScoreComponents, calculateCurrentTermTotal } from "../utils";
import Broadsheet from "./Broadsheet";
import { Table, Save, AlertCircle, Edit, Check, Star, RefreshCw, UserCheck, BookOpen, AlertTriangle, ArrowUpDown, FileSpreadsheet, Download, Upload, FileUp, UserPlus, Plus, Image, FileText } from "lucide-react";
import * as XLSX from "xlsx";

interface TeacherPortalProps {
  teacherId: string;
  db: Database;
  onUpdateDb: (newDb: Database) => void;
  onLogout: () => void;
}

export default function TeacherPortal({ teacherId, db, onUpdateDb, onLogout }: TeacherPortalProps) {
  // Find current teacher
  const currentTeacher = db.teachers.find((t) => t.id === teacherId) || {
    id: "temp",
    fullName: "Staff Teacher",
    subjectIds: db.subjects.map((s) => s.id),
    passportUrl: DEFAULT_TEACHER_AVATAR
  };

  // Helper to handle logged-in teacher uploading passport
  const handleTeacherPassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedTeachers = db.teachers.map((teach) => {
          if (teach.id === currentTeacher.id) {
            return { ...teach, passportUrl: base64 };
          }
          return teach;
        });
        onUpdateDb({
          ...db,
          teachers: updatedTeachers,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Selections
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("Term2");
  const [selectedClass, setSelectedClass] = useState(db.classes[0]?.id || "");
  
  // Keep selectedClass synced if db classes change
  React.useEffect(() => {
    if (db.classes.length > 0 && !db.classes.find((c) => c.id === selectedClass)) {
      setSelectedClass(db.classes[0].id);
    }
  }, [db.classes]);

  const [selectedSubject, setSelectedSubject] = useState(
    currentTeacher.subjectIds?.[0] || db.subjects[0]?.id || ""
  );

  // Active student selected for detailed grading (Affective & Psychomotor & Comments)
  const [selectedStudentForTraits, setSelectedStudentForTraits] = useState<string>("");

  // Sheet status feedback
  const [saveFeedback, setSaveFeedback] = useState("");
  const [errorFeedback, setErrorFeedback] = useState("");

  // Arrange Sort Order for Student Name ("name_asc", "name_desc", "reg_asc", "reg_desc")
  const [studentSortOrder, setStudentSortOrder] = useState<"name_asc" | "name_desc" | "reg_asc" | "reg_desc">("name_asc");

  // Choose input mode: "manual" or "excel"
  const [inputMode, setInputMode] = useState<"manual" | "excel">("manual");

  // Excel importer state variables
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [commitFeedback, setCommitFeedback] = useState("");

  // Enrollment State
  const [activeTeacherTab, setActiveTeacherTab] = useState<"scores" | "enrollment" | "broadsheet" | "remarks" | "report_settings">("scores");
  const [enrollName, setEnrollName] = useState("");
  const [enrollReg, setEnrollReg] = useState("");
  const [enrollClass, setEnrollClass] = useState(db.classes[0]?.id || "");
  const [enrollPassport, setEnrollPassport] = useState(DEFAULT_STUDENT_AVATAR);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  // Keep enrollment class in sync with selectedClass for convenience
  React.useEffect(() => {
    setEnrollClass(selectedClass);
  }, [selectedClass]);

  const handleEnrollPassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEnrollPassport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnrollStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError("");
    setEnrollSuccess("");

    if (!enrollName.trim() || !enrollReg.trim() || !enrollClass) {
      setEnrollError("All fields (Student Name, Registration Number, and Class) are required.");
      return;
    }

    const username = generateUsername(enrollName);

    // Check pre-existence
    if (db.students.some((s) => s.username === username || s.regNo === enrollReg)) {
      setEnrollError("A student with this name or registration number already exists.");
      return;
    }

    const newStudent: Student = {
      id: `stud_${Date.now()}`,
      fullName: enrollName.toUpperCase().trim(),
      username,
      regNo: enrollReg.trim(),
      classId: enrollClass,
      passportUrl: enrollPassport,
      session: selectedSession,
      term: selectedTerm,
      nextTermBegins: "2026-04-27",
      termEnded: "2026-07-24",
      daysSchoolOpened: 118,
      daysPresent: 118,
      daysAbsent: 0,
      classTeacherReport: "ADMITTED. PERFORMANCE AWAITS EVALUATION.",
      principalReport: "ADMITTED TO PROGRESS INTELLECTUAL SCHOOLS.",
    };

    // Auto-seed initial scores of 0s for all subjects in the system so report cards look great
    const newScores = db.subjects.map((sub) => ({
      studentId: newStudent.id,
      subjectId: sub.id,
      session: selectedSession,
      term: selectedTerm,
      test1: 0,
      test2: 0,
      exam: 0,
      firstTerm: 0,
      secondTerm: 0,
    }));

    // Auto-seed affective & psychomotor traits
    const initialAffective: AffectiveTraits = {
      studentId: newStudent.id,
      session: selectedSession,
      term: selectedTerm,
      punctuality: 3, mentalAlertness: 3, behaviour: 3, reliability: 3, attentiveness: 3,
      respect: 3, neatness: 3, politeness: 3, honesty: 3, relationshipWithStaff: 3,
      relationshipWithStudents: 3, attitudeToSchool: 3, selfControl: 3
    };

    const initialPsychomotor: PsychomotorSkills = {
      studentId: newStudent.id,
      session: selectedSession,
      term: selectedTerm,
      spiritOfTeamwork: 3, initiatives: 3, organizationalAbility: 3, handwriting: 3,
      reading: 3, verbalFluencyDiction: 3, musicalSkills: 3, creativeArts: 3,
      physicalEducation: 3, generalReasoning: 3
    };

    const updatedDb: Database = {
      ...db,
      students: [newStudent, ...db.students],
      scores: [...db.scores, ...newScores],
      affectiveTraits: [...db.affectiveTraits, initialAffective],
      psychomotorSkills: [...db.psychomotorSkills, initialPsychomotor]
    };

    onUpdateDb(updatedDb);
    setEnrollSuccess(`Success! Student "${enrollName.toUpperCase()}" registered and enrolled in class registry "${enrollClass}" successfully.`);
    
    // Reset form fields
    setEnrollName("");
    setEnrollReg("");
    setEnrollPassport(DEFAULT_STUDENT_AVATAR);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setEnrollSuccess("");
    }, 5000);
  };

  // Memoized sorted active students list
  const sortedClassStudents = React.useMemo(() => {
    const list = db.students.filter((s) => s.classId === selectedClass);
    if (studentSortOrder === "name_asc") {
      return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (studentSortOrder === "name_desc") {
      return [...list].sort((a, b) => b.fullName.localeCompare(a.fullName));
    } else if (studentSortOrder === "reg_asc") {
      return [...list].sort((a, b) => a.regNo.localeCompare(b.regNo));
    } else if (studentSortOrder === "reg_desc") {
      return [...list].sort((a, b) => b.regNo.localeCompare(a.regNo));
    }
    return list;
  }, [db.students, selectedClass, studentSortOrder]);

  // Handle Score download template handler
  const handleDownloadExcelTemplate = () => {
    if (sortedClassStudents.length === 0) {
      alert("No students are registered in the active class to generate a spreadsheet template.");
      return;
    }

    // Determine current subject name
    const subName = db.subjects.find((s) => s.id === selectedSubject)?.name || "Subject";
    const comps = getScoreComponents(db);

    // Set headers
    const headers = [
      "Registration Number",
      "Student Name",
      ...comps.map((c) => `${c.name} (Max ${c.maxMark})`)
    ];

    if (selectedTerm !== "Term1") {
      headers.push("First Term Score (Max 100)");
    }
    if (selectedTerm === "Term3") {
      headers.push("Second Term Score (Max 100)");
    }

    // Rows mapping
    const fileRows = sortedClassStudents.map((stud) => {
      const match = db.scores.find(
        (sc) =>
          sc.studentId === stud.id &&
          sc.subjectId === selectedSubject &&
          sc.session === selectedSession &&
          sc.term === selectedTerm
      ) || { test1: 0, test2: 0, exam: 0, firstTerm: 0, secondTerm: 0, customScores: {} };

      const studentRow = [
        stud.regNo,
        stud.fullName
      ];

      comps.forEach((c) => {
        const isDefault = ["test1", "test2", "exam"].includes(c.id);
        const val = isDefault ? (match[c.id as keyof Score] as number || 0) : (match.customScores?.[c.id] || 0);
        studentRow.push(val);
      });

      if (selectedTerm !== "Term1") {
        studentRow.push(match.firstTerm);
      }
      if (selectedTerm === "Term3") {
        studentRow.push(match.secondTerm || 0);
      }

      return studentRow;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...fileRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scores Sheet");

    const cleanClassName = selectedClass.replace(/[^a-zA-Z0-9]/g, "_");
    const cleanSubName = subName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileTitle = `${cleanClassName}_${cleanSubName}_${selectedTerm}_ScoresTemplate.xlsx`;

    XLSX.writeFile(workbook, fileTitle);
  };

  // Excel scores upload parser handler
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");
    setCommitFeedback("");
    setImportedRows([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawJson.length <= 1) {
          setUploadError("The Excel spreadsheet contains no score records inside.");
          return;
        }

        const rows = rawJson.slice(1);
        const parsed: any[] = [];
        const comps = getScoreComponents(db);

        rows.forEach((row, idx) => {
          if (!row || row.length === 0 || !row[0]) return; // Skip blank lines

          const fileRegNo = String(row[0]).trim();
          const fileName = String(row[1] || "").trim();

          const customScores: Record<string, number> = {};
          let t1 = 0;
          let t2 = 0;
          let examVal = 0;

          let colIndex = 2;
          comps.forEach((c) => {
            const val = parseFloat(row[colIndex]) || 0;
            if (c.id === "test1") t1 = val;
            else if (c.id === "test2") t2 = val;
            else if (c.id === "exam") examVal = val;
            else {
              customScores[c.id] = val;
            }
            colIndex++;
          });

          let fTerm = 0;
          let sTerm = 0;

          if (selectedTerm !== "Term1") {
            fTerm = parseFloat(row[colIndex]) || 0;
            colIndex++;
          }
          if (selectedTerm === "Term3") {
            sTerm = parseFloat(row[colIndex]) || 0;
            colIndex++;
          }

          // Match student
          let matchedStudent = db.students.find(
            (s) => s.regNo.toLowerCase() === fileRegNo.toLowerCase()
          );

          if (!matchedStudent) {
            matchedStudent = db.students.find(
              (s) => s.fullName.toLowerCase() === fileName.toLowerCase()
            );
          }

          const correctClass = matchedStudent ? matchedStudent.classId === selectedClass : false;

          let allCompsValid = true;
          comps.forEach((c) => {
            const val = c.id === "test1" ? t1 : c.id === "test2" ? t2 : c.id === "exam" ? examVal : customScores[c.id];
            if (val < 0 || val > c.maxMark) {
              allCompsValid = false;
            }
          });

          const fTermValid = fTerm >= 0 && fTerm <= 100;
          const sTermValid = sTerm >= 0 && sTerm <= 100;

          const isRowValid = !!matchedStudent && correctClass && allCompsValid && fTermValid && sTermValid;

          parsed.push({
            rowNum: idx + 2,
            regNo: fileRegNo,
            studentName: fileName || (matchedStudent ? matchedStudent.fullName : "Unknown"),
            studentId: matchedStudent ? matchedStudent.id : null,
            test1: t1,
            test2: t2,
            exam: examVal,
            customScores,
            firstTerm: fTerm,
            secondTerm: sTerm,
            isCorrectClass: correctClass,
            isValid: isRowValid,
          });
        });

        if (parsed.length === 0) {
          setUploadError("Could not extract any valid record rows from this Excel file.");
        } else {
          setImportedRows(parsed);
          const valCount = parsed.filter((r) => r.isValid).length;
          setUploadSuccess(`Parsed ${parsed.length} row(s) from Excel spreadsheet. ${valCount} row(s) are completely correct and ready to insert.`);
        }
      } catch (err) {
        console.error("SheetJS parse error:", err);
        setUploadError("Problem loading Excel spreadsheet. Please confirm file structural headers match standard downloaded template.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Commit Excel uploaded records to the backend
  const handleCommitExcelScores = () => {
    const validEntries = importedRows.filter((r) => r.isValid);
    if (validEntries.length === 0) {
      alert("No valid rows could be imported.");
      return;
    }

    const matchedIds = validEntries.map((v) => v.studentId);
    
    // Filter existing student scores
    const cleanScoresList = db.scores.filter(
      (sc) =>
        !(
          sc.subjectId === selectedSubject &&
          sc.session === selectedSession &&
          sc.term === selectedTerm &&
          matchedIds.includes(sc.studentId)
        )
    );

    const importedScores: Score[] = validEntries.map((v) => ({
      studentId: v.studentId,
      subjectId: selectedSubject,
      session: selectedSession,
      term: selectedTerm,
      test1: v.test1,
      test2: v.test2,
      exam: v.exam,
      customScores: v.customScores,
      firstTerm: v.firstTerm,
      secondTerm: v.secondTerm,
    }));

    const updatedDb: Database = {
      ...db,
      scores: [...cleanScoresList, ...importedScores],
    };

    onUpdateDb(updatedDb);
    setCommitFeedback(`Successfully imported & locked ${importedScores.length} student scores directly!`);
    
    // Reset uploader states after brief delay
    setTimeout(() => {
      setCommitFeedback("");
      setImportedRows([]);
      setUploadSuccess("");
    }, 4500);
  };

  // Temporary local state for editing scores spreadsheet
  const [localScores, setLocalScores] = useState<Record<string, Score>>({});

  // Sync spreadsheet map dynamically when selection or DB updates
  React.useEffect(() => {
    const scoresMap: Record<string, Score> = {};
    sortedClassStudents.forEach((stud) => {
      const match = db.scores.find(
        (sc) =>
          sc.studentId === stud.id &&
          sc.subjectId === selectedSubject &&
          sc.session === selectedSession &&
          sc.term === selectedTerm
      );

      scoresMap[stud.id] = match
        ? { ...match }
        : {
            studentId: stud.id,
            subjectId: selectedSubject,
            session: selectedSession,
            term: selectedTerm,
            test1: 0,
            test2: 0,
            exam: 0,
            firstTerm: 0,
            secondTerm: 0,
          };
    });
    setLocalScores(scoresMap);
    if (sortedClassStudents.length > 0) {
      setSelectedStudentForTraits(sortedClassStudents[0].id);
    } else {
      setSelectedStudentForTraits("");
    }
  }, [sortedClassStudents, selectedSubject, selectedSession, selectedTerm, db.scores]);

  // Handle score cell editing
  const handleScoreChange = (
    studentId: string,
    field: "test1" | "test2" | "exam" | "firstTerm" | "secondTerm",
    value: string
  ) => {
    setSaveFeedback("");
    setErrorFeedback("");
    const parsedVal = value === "" ? 0 : parseFloat(value);
    
    // Bounds check
    let max = 100;
    if (field === "test1" || field === "test2") max = 20;
    if (field === "exam") max = 60;
    if (field === "firstTerm") max = 100;
    if (field === "secondTerm") max = 100;

    if (parsedVal < 0 || parsedVal > max) {
      setErrorFeedback(`Input values out of boundaries! Test1 & Test2 max 20, Exam max 60, First/Second Term max 100.`);
      return;
    }

    setLocalScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parsedVal,
      },
    }));
  };

  // Save score sheet
  const handleSaveScoresSheet = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback("");
    setErrorFeedback("");

    // Validate all local scores dynamically
    let hasError = false;
    const comps = getScoreComponents(db);
    (Object.values(localScores) as Score[]).forEach((sc) => {
      comps.forEach((c) => {
        const isDefault = ["test1", "test2", "exam"].includes(c.id);
        const val = isDefault ? (sc[c.id as keyof Score] as number || 0) : (sc.customScores?.[c.id] || 0);
        if (val < 0 || val > c.maxMark) {
          hasError = true;
        }
      });
      if (sc.firstTerm < 0 || sc.firstTerm > 100 || sc.secondTerm < 0 || sc.secondTerm > 100) {
        hasError = true;
      }
    });

    if (hasError) {
      setErrorFeedback("Invalid values found in score sheet. Double-check custom limits of assessment areas.");
      return;
    }

    // Replace or insert score sheet values in DB
    const listWithoutChanged = db.scores.filter(
      (sc) =>
        !(
          sc.subjectId === selectedSubject &&
          sc.session === selectedSession &&
          sc.term === selectedTerm &&
          sortedClassStudents.some((stud) => stud.id === sc.studentId)
        )
    );

    const scoresToInsert = Object.values(localScores) as Score[];

    const updatedDb: Database = {
      ...db,
      scores: [...listWithoutChanged, ...scoresToInsert],
    };

    onUpdateDb(updatedDb);
    setSaveFeedback("Score template saved and metrics updated successfully!");
  };

  // Edit comments & behavioral skills for active student
  const activeStudentObj = db.students.find((s) => s.id === selectedStudentForTraits);
  
  const activeAffective = db.affectiveTraits.find(
    (a) =>
      a.studentId === selectedStudentForTraits &&
      a.session === selectedSession &&
      a.term === selectedTerm
  ) || {
    studentId: selectedStudentForTraits,
    session: selectedSession,
    term: selectedTerm,
    punctuality: 4, mentalAlertness: 4, behaviour: 4, reliability: 4, attentiveness: 4,
    respect: 4, neatness: 4, politeness: 4, honesty: 4, relationshipWithStaff: 4,
    relationshipWithStudents: 4, attitudeToSchool: 4, selfControl: 4
  };

  const activePsychomotor = db.psychomotorSkills.find(
    (p) =>
      p.studentId === selectedStudentForTraits &&
      p.session === selectedSession &&
      p.term === selectedTerm
  ) || {
    studentId: selectedStudentForTraits,
    session: selectedSession,
    term: selectedTerm,
    spiritOfTeamwork: 4, initiatives: 4, organizationalAbility: 3, handwriting: 3,
    reading: 4, verbalFluencyDiction: 3, musicalSkills: 2, creativeArts: 3,
    physicalEducation: 3, generalReasoning: 4
  };

  const [traitsFeedback, setTraitsFeedback] = useState("");

  const handleAffectiveChange = (key: string, value: number) => {
    setTraitsFeedback("");
    const listWithoutMatch = db.affectiveTraits.filter(
      (a) =>
        !(
          a.studentId === selectedStudentForTraits &&
          a.session === selectedSession &&
          a.term === selectedTerm
        )
    );

    const updatedTrait: AffectiveTraits = {
      ...activeAffective,
      [key]: value,
    };

    onUpdateDb({
      ...db,
      affectiveTraits: [...listWithoutMatch, updatedTrait],
    });
  };

  const handlePsychomotorChange = (key: string, value: number) => {
    setTraitsFeedback("");
    const listWithoutMatch = db.psychomotorSkills.filter(
      (p) =>
        !(
          p.studentId === selectedStudentForTraits &&
          p.session === selectedSession &&
          p.term === selectedTerm
        )
    );

    const updatedPsych: PsychomotorSkills = {
      ...activePsychomotor,
      [key]: value,
    };

    onUpdateDb({
      ...db,
      psychomotorSkills: [...listWithoutMatch, updatedPsych],
    });
  };

  // Attendance metrics update helper
  const handleAttendanceChange = (field: "daysSchoolOpened" | "daysPresent" | "daysAbsent", value: string) => {
    if (!activeStudentObj) return;
    const parsed = parseInt(value) || 0;

    const listWithoutMatch = db.students.filter((s) => s.id !== selectedStudentForTraits);
    const updatedStud: Student = {
      ...activeStudentObj,
      [field]: parsed,
    };

    onUpdateDb({
      ...db,
      students: [updatedStud, ...listWithoutMatch].sort((a, b) => b.id.localeCompare(a.id)),
    });
  };

  // Report Settings state
  const [classDaysOpened, setClassDaysOpened] = useState(118);
  const [classNextTermBegins, setClassNextTermBegins] = useState("2026-04-27");
  const [classTermEnded, setClassTermEnded] = useState("2026-07-24");

  // Report Remarks update helper
  const handleCommentChange = (field: "classTeacherReport" | "principalReport", value: string) => {
    if (!activeStudentObj) return;

    const listWithoutMatch = db.students.filter((s) => s.id !== selectedStudentForTraits);
    const updatedStud: Student = {
      ...activeStudentObj,
      [field]: value.toUpperCase(),
    };

    onUpdateDb({
      ...db,
      students: [updatedStud, ...listWithoutMatch].sort((a, b) => b.id.localeCompare(a.id)),
    });
  };

  const assignedClasses = (db.classTeacherAssignments || [])
    .filter((cta) => cta.teacherId === currentTeacher.id)
    .map((cta) => cta.classId);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
      
      {/* Teacher Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl border-b-4 border-amber-500 mb-6 shadow-md relative overflow-hidden select-text">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-lg p-0.5">
            <img src={db.schoolSettings.logoUrl} alt="School Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-emerald-950 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                Academic Teacher Portal
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-tight animate-fade-in">
              Welcome, {currentTeacher.fullName}
            </h1>
            <p className="text-xs text-amber-400 italic font-medium mt-0.5">
              {db.schoolSettings.schoolName} — {db.schoolSettings.motto}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          {/* Teacher Passport Profile Upload */}
          <div className="relative group w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden shrink-0 shadow-lg bg-amber-50 cursor-pointer">
            <img
              src={currentTeacher.passportUrl || DEFAULT_TEACHER_AVATAR}
              alt={currentTeacher.fullName}
              className="w-full h-full object-cover text-black"
              referrerPolicy="no-referrer"
            />
            <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[8px] font-black uppercase text-center text-white opacity-0 group-hover:opacity-100 transition whitespace-pre">
              <span>Change</span>
              <span>Pic</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTeacherPassportUpload}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={onLogout}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition cursor-pointer"
            id="btn_teacher_logout"
          >
            Portal Logout
          </button>
        </div>
      </div>

      {/* Classroom Scope Selections */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
          >
            {db.sessions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Academic Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
          >
            {db.terms.map((t) => (
              <option key={t} value={t}>{t === "Term1" ? "1st Term" : t === "Term2" ? "2nd Term" : "3rd Term"}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Class Registry</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white uppercase font-bold"
            id="teacher_select_class"
          >
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selected Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
            id="teacher_select_subject"
          >
            {db.subjects.map((sub) => {
              const isAssigned = currentTeacher.subjectIds?.includes(sub.id);
              return (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code}) {isAssigned ? "★ Assigned" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Flex container for sidebar + workspace contents */}
      <div className="flex flex-row gap-4 md:gap-6 items-start w-full mt-6">
        
        {/* Left Vertical Navigation Menu Panel */}
        <div className="w-14 sm:w-16 md:w-64 bg-white rounded-xl border border-slate-200 p-1.5 md:p-3 shadow-sm flex flex-col gap-1.5 shrink-0 select-text">
          <span className="hidden md:block text-[10px] text-slate-400 font-extrabold tracking-wider uppercase px-3 py-2 border-b border-slate-100 mb-1">
            Teacher Tools
          </span>
          {[
            { id: "scores", label: "Score Sheets & Traits", icon: BookOpen },
            { id: "remarks", label: "Student Remarks", icon: FileText },
            { id: "report_settings", label: "Report Settings", icon: FileUp },
            { id: "enrollment", label: "Student Enrollment", icon: UserPlus },
            { id: "broadsheet", label: "Broadsheet", icon: Table }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTeacherTab(tab.id as any)}
                className={`flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3.5 py-3 rounded-lg text-xs font-black transition-all cursor-pointer w-full text-left uppercase tracking-wide ${
                  activeTeacherTab === tab.id
                    ? "bg-emerald-600 text-white shadow-sm font-black"
                    : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                }`}
                id={`tab_teacher_${tab.id}`}
                title={tab.label}
              >
                <Icon size={15} className="shrink-0" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden md:block mt-6 border-t border-slate-100 pt-4 px-3">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">
              Registry Role
            </span>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-bold uppercase leading-relaxed">
              {assignedClasses.length > 0 ? (
                <div>
                  Class Teacher for: <span className="text-emerald-700 font-black">{assignedClasses.join(", ")}</span>
                </div>
              ) : (
                "Subject Teacher Role"
              )}
            </div>
          </div>
        </div>

        {/* Right Active Workspace Content Panel */}
        <div className="flex-1 min-w-0">

          {activeTeacherTab === "broadsheet" && (
            <div className="animate-fade-in space-y-6 flex-1">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200">
                 <div className="bg-emerald-900 px-6 py-4 rounded-t-xl border-b-4 border-amber-500 print:hidden">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                       <Table size={16} className="text-amber-400" />
                       Class &amp; Subject Broadsheets
                    </h3>
                 </div>
                 <div className="p-6">
                    <Broadsheet db={db} teacherId={teacherId} />
                 </div>
              </div>
            </div>
          )}

          {activeTeacherTab === "enrollment" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-fade-in text-xs select-text">
              <div className="border-b border-slate-200 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <UserPlus size={16} className="text-emerald-600" />
                    Enroll Student into Classes
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    All newly enrolled students are automatically seeded with standard academic metrics, attributes and traits indicators.
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] px-2 py-0.5 rounded font-black uppercase">
                  SEEKING ADMISSION
                </span>
              </div>

              <form onSubmit={handleEnrollStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  
                  {/* Name */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      placeholder="e.g. BELLO AYOMIDE"
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white uppercase font-bold text-slate-800"
                      id="enroll_stud_name"
                    />
                  </div>

                  {/* Registration Number */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollReg}
                      onChange={(e) => setEnrollReg(e.target.value)}
                      placeholder="e.g. 1084/73919"
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold text-slate-850"
                      id="enroll_stud_reg"
                    />
                  </div>

                  {/* Target Class selection */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                      Enroll Into Class *
                    </label>
                    <select
                      value={enrollClass}
                      onChange={(e) => setEnrollClass(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold text-slate-800 uppercase"
                      id="enroll_stud_class"
                    >
                      {db.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Passport Selector / Upload (Simple File input + Small Preview display) */}
                  <div className="md:col-span-1 flex items-center gap-3">
                    <div className="w-10 h-10 border border-slate-300 rounded overflow-hidden shadow-sm flex items-center justify-center shrink-0 bg-slate-50">
                      <img 
                        src={enrollPassport} 
                        alt="Preview avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                        Student Passport Image
                      </label>
                      <label className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded text-[10px] cursor-pointer w-fit select-none">
                        <Image size={12} />
                        <span>Upload JPG/PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEnrollPassportUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>

                {enrollError && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-[10px] text-rose-800 font-extrabold animate-fade-in">
                    ⚠️ {enrollError}
                  </div>
                )}

                {enrollSuccess && (
                  <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-lg text-[10px] text-emerald-800 font-extrabold animate-fade-in">
                    ✓ {enrollSuccess}
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-4.5 py-2.5 rounded-lg transition uppercase cursor-pointer shadow-sm flex items-center gap-1.5"
                    id="btn_record_enrollment"
                  >
                    <Plus size={12} />
                    <span>Confirm Enrollment</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTeacherTab === "remarks" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-fade-in select-text">
              <div className="border-b border-slate-200 pb-3 mb-4">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   <FileText size={16} className="text-emerald-600" />
                   Student Terminal Remarks
                 </h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                   Edit class teacher and principal attributes for {selectedClass} roster.
                 </p>
              </div>

              <div className="space-y-4">
                {sortedClassStudents.map(student => (
                  <div key={student.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={student.passportUrl || DEFAULT_STUDENT_AVATAR} className="w-10 h-10 rounded-full border border-slate-300 object-cover" />
                      <div>
                        <div className="text-xs font-black text-slate-800 uppercase">{student.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{student.regNo}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Class Teacher Report</label>
                        <textarea
                          value={student.classTeacherReport || ""}
                          onChange={(e) => {
                            const newDb = { ...db, students: db.students.map(s => s.id === student.id ? { ...s, classTeacherReport: e.target.value } : s) };
                            onUpdateDb(newDb);
                          }}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-medium text-slate-800 resize-y"
                          rows={3}
                          placeholder="Enter class teacher remarks..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Principal Report</label>
                        <textarea
                          value={student.principalReport || ""}
                          onChange={(e) => {
                            const newDb = { ...db, students: db.students.map(s => s.id === student.id ? { ...s, principalReport: e.target.value } : s) };
                            onUpdateDb(newDb);
                          }}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-medium text-slate-800 resize-y"
                          rows={3}
                          placeholder="Enter principal remarks..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {sortedClassStudents.length === 0 && (
                  <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase">
                    No registered students found in {selectedClass} registry.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTeacherTab === "report_settings" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-fade-in select-text">
              <div className="border-b border-slate-200 pb-3 mb-4">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   <FileUp size={16} className="text-emerald-600" />
                   Class-wide Report Metrics
                 </h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                   Update days school opened, term dates for all {selectedClass} students.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Days School Opened</label>
                  <input
                    type="number"
                    value={classDaysOpened}
                    onChange={(e) => setClassDaysOpened(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Next Term Begins</label>
                  <input
                    type="date"
                    value={classNextTermBegins}
                    onChange={(e) => setClassNextTermBegins(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Term Ended</label>
                  <input
                    type="date"
                    value={classTermEnded}
                    onChange={(e) => setClassTermEnded(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  const updatedStudents = db.students.map(s => {
                    if (s.classId === selectedClass) {
                      return {
                        ...s,
                        daysSchoolOpened: classDaysOpened,
                        nextTermBegins: classNextTermBegins,
                        termEnded: classTermEnded
                      };
                    }
                    return s;
                  });
                  onUpdateDb({ ...db, students: updatedStudents });
                  alert("Report metrics updated for all students in " + selectedClass);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Apply to Class
              </button>
            </div>
          )}

          {activeTeacherTab === "scores" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
        {/* SPREADSHEET CARD (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 select-text">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
            <div>
              <h2 className="text-md font-bold text-emerald-950">
                Automated Score Grading Engine
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                Current Class: {selectedClass} | Subject: {db.subjects.find(sub => sub.id === selectedSubject)?.name}
              </p>
            </div>
            
            {/* Input switcher pills */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  inputMode === "manual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setInputMode("excel")}
                className={`px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer flex items-center gap-1 ${
                  inputMode === "excel"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <FileSpreadsheet size={12} />
                Excel Upload
              </button>
            </div>
          </div>

          {/* Arrange and Sort Student Name Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-emerald-700 shrink-0" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Arrange Roster Order:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { id: "name_asc", label: "A - Z Alphabetical" },
                { id: "name_desc", label: "Z - A Alphabetical" },
                { id: "reg_asc", label: "Reg No. Ascending" },
                { id: "reg_desc", label: "Reg No. Descending" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStudentSortOrder(opt.id as any)}
                  className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                    studentSortOrder === opt.id
                      ? "bg-emerald-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-250 hover:border-slate-350"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {inputMode === "manual" ? (
            sortedClassStudents.length === 0 ? (
              <div className="text-center p-10 bg-slate-50 rounded-lg border border-dashed text-slate-400 font-semibold uppercase text-xs">
                <AlertTriangle className="mx-auto mb-2 text-amber-500" size={24} />
                No registered students in Class {selectedClass} yet.
              </div>
            ) : (
              <form onSubmit={handleSaveScoresSheet} className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-150 text-slate-700 font-extrabold border-b border-slate-200 text-[9px] uppercase">
                        <th className="p-2.5 text-left w-36">Student Name</th>
                        {getScoreComponents(db).map((comp) => (
                          <th key={comp.id} className="p-1 font-bold uppercase whitespace-nowrap">
                            {comp.name}
                            <br />
                            <span className="text-[9px] text-slate-400 font-medium">({comp.maxMark})</span>
                          </th>
                        ))}
                        {selectedTerm !== "Term1" && (
                          <th className="p-1 font-bold leading-none">1ST TERM<br/><span className="text-[9px] text-slate-450 font-medium">(100)</span></th>
                        )}
                        {selectedTerm === "Term3" && (
                          <th className="p-1 font-bold leading-none">2ND TERM<br/><span className="text-[9px] text-slate-450 font-medium">(100)</span></th>
                        )}
                        <th className="p-1 font-extrabold text-emerald-800">TOTAL<br/><span className="text-[9px] text-emerald-800 font-medium">({selectedTerm === 'Term1' ? '100' : selectedTerm === 'Term2' ? '200' : '300'})</span></th>
                        <th className="p-1">GRADE</th>
                        <th className="p-2 w-12 text-center">TRAITS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {sortedClassStudents.map((stud) => {
                        const score = localScores[stud.id] || { test1: 0, test2: 0, exam: 0, firstTerm: 0, secondTerm: 0 };
                        const currentTermSum = calculateCurrentTermTotal(score, getScoreComponents(db));
                        let overallTotal = currentTermSum;
                        let termDivisor = 1;
                        if (selectedTerm === "Term2") {
                          overallTotal = score.firstTerm + currentTermSum;
                          termDivisor = 2;
                        } else if (selectedTerm === "Term3") {
                          overallTotal = score.firstTerm + (score.secondTerm || 0) + currentTermSum;
                          termDivisor = 3;
                        }
                        const percentage = overallTotal / termDivisor;
                        const gradeObj = calculateGrade(percentage);

                        return (
                          <tr
                            key={stud.id}
                            className={`hover:bg-slate-50/50 ${
                              selectedStudentForTraits === stud.id ? "bg-emerald-50/30 border-l-4 border-emerald-500 pl-1" : ""
                            }`}
                          >
                            <td className="p-2 text-left">
                              <span className="font-extrabold text-slate-800 uppercase block truncate max-w-[150px]">
                                {stud.fullName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">{stud.regNo}</span>
                            </td>
                            {getScoreComponents(db).map((comp) => {
                              const isDefault = ["test1", "test2", "exam"].includes(comp.id);
                              const value = isDefault ? (score[comp.id as keyof Score] as number || 0) : (score.customScores?.[comp.id] || 0);
                              return (
                                <td key={comp.id} className="p-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={comp.maxMark}
                                    value={value}
                                    onChange={(e) => {
                                      const parsedVal = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                      if (parsedVal < 0 || parsedVal > comp.maxMark) {
                                        setErrorFeedback(`Value for ${comp.name} must be between 0 and ${comp.maxMark}`);
                                        return;
                                      }
                                      setErrorFeedback("");
                                      setLocalScores((prev) => {
                                        const prevScore = prev[stud.id] || { studentId: stud.id, subjectId: selectedSubject, session: selectedSession, term: selectedTerm, test1: 0, test2: 0, exam: 0, firstTerm: 0, secondTerm: 0 };
                                        if (isDefault) {
                                          return {
                                            ...prev,
                                            [stud.id]: {
                                              ...prevScore,
                                              [comp.id]: parsedVal
                                            }
                                          };
                                        } else {
                                          const existingCustoms = prevScore.customScores || {};
                                          return {
                                            ...prev,
                                            [stud.id]: {
                                              ...prevScore,
                                              customScores: {
                                                ...existingCustoms,
                                                [comp.id]: parsedVal
                                              }
                                            }
                                          };
                                        }
                                      });
                                    }}
                                    className="w-12 text-center px-1 py-1 border border-slate-300 rounded font-bold text-slate-800 focus:outline-emerald-600 mx-auto bg-slate-50/30"
                                  />
                                </td>
                              );
                            })}
                            {selectedTerm !== "Term1" && (
                              <td className="p-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="100"
                                  value={score.firstTerm}
                                  onChange={(e) => handleScoreChange(stud.id, "firstTerm", e.target.value)}
                                  className="w-12 text-center px-1 py-1 border border-slate-300 rounded font-bold text-slate-800 focus:outline-emerald-600 mx-auto bg-slate-50/30"
                                />
                              </td>
                            )}
                            {selectedTerm === "Term3" && (
                              <td className="p-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="100"
                                  value={score.secondTerm || 0}
                                  onChange={(e) => handleScoreChange(stud.id, "secondTerm", e.target.value)}
                                  className="w-12 text-center px-1 py-1 border border-slate-300 rounded font-bold text-slate-800 focus:outline-emerald-600 mx-auto bg-slate-50/30"
                                />
                              </td>
                            )}
                            <td className="p-1 font-black text-emerald-950 bg-emerald-50/20 text-center">
                              {overallTotal}
                            </td>
                            <td className="p-1 text-center font-black text-rose-700">
                              {gradeObj.grade}
                            </td>
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForTraits(stud.id)}
                                className={`p-1.5 rounded transition ${
                                  selectedStudentForTraits === stud.id
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                                title="Edit Behavioral traits & Comments"
                              >
                                <UserCheck size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {saveFeedback && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 font-bold flex items-center gap-2">
                    <Check size={16} />
                    {saveFeedback}
                  </div>
                )}

                {errorFeedback && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errorFeedback}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-300 transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download size={14} className="text-emerald-700" />
                    Download Class Roster excel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer text-center"
                  >
                    Confirm and Commit Scores
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4 animate-fade-in text-slate-700 text-xs">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-2">
                <h3 className="font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase text-xs">
                  <FileSpreadsheet size={16} className="text-emerald-705 shrink-0" />
                  Excel Spreadsheet Scoring Instructions
                </h3>
                <p className="text-[11px] text-slate-650 leading-normal font-medium">
                  To avoid record mapping discrepancies, we recommend downloading our pre-structured template containing the students registration numbers of the active sorted roster list.
                </p>
                
                <div className="pt-1 select-none">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="bg-white hover:bg-slate-50 text-emerald-950 font-extrabold text-[10px] px-3.5 py-2 rounded-lg border border-emerald-250 transition-all inline-flex items-center gap-1.5 uppercase shadow-2xs cursor-pointer"
                  >
                    <Download size={13} className="text-emerald-750" />
                    1st Step: Download Prefilled Template (.xlsx)
                  </button>
                </div>
              </div>

              {/* Upload input zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition bg-slate-50/50 cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <FileUp className="mx-auto text-slate-400" size={32} />
                  <p className="font-black text-slate-700 text-xs uppercase tracking-tight">
                    Select or Drag &amp; Drop Excel Score Spreadsheet Here
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                </div>
              </div>

              {/* Status messages */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 font-extrabold flex items-center gap-2 text-[11px]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-3 text-emerald-800 font-extrabold flex items-center gap-2 text-[11px]">
                  <Check size={16} className="text-emerald-750 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {commitFeedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-800 font-black flex items-center gap-2 text-[11px] uppercase tracking-wider">
                  <Check size={16} className="shrink-0" />
                  <span>{commitFeedback}</span>
                </div>
              )}

              {/* Parsed Rows Previewer Table */}
              {importedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
                    <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider">
                      Parsed Spreadsheet Rows Preview ({importedRows.length} total)
                    </span>
                    <button
                      type="button"
                      onClick={handleCommitExcelScores}
                      disabled={importedRows.filter(r => r.isValid).length === 0}
                      className="bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 text-white font-black text-[10px] px-5 py-2.5 rounded-lg transition-all shadow-sm uppercase tracking-wide cursor-pointer text-center"
                    >
                      Commit Excel Rows to DB
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                    <table className="w-full text-center border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[9px]">
                          <th className="p-2 w-12 text-left">Row</th>
                          <th className="p-2 text-left">Reg No</th>
                          <th className="p-2 text-left">Student Name</th>
                          <th className="p-1 font-bold">Test 1</th>
                          <th className="p-1 font-bold">Test 2</th>
                          <th className="p-1 font-bold">Exam</th>
                          {selectedTerm !== "Term1" && <th className="p-1 font-bold">1st Term</th>}
                          {selectedTerm === "Term3" && <th className="p-1 font-bold">2nd Term</th>}
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                        {importedRows.map((row, index) => {
                          return (
                            <tr key={index} className={`hover:bg-slate-50/50 ${!row.isValid ? "bg-red-50/30" : ""}`}>
                              <td className="p-2 text-left text-slate-400 font-normal">#{row.rowNum}</td>
                              <td className="p-2 text-left font-black text-slate-800">{row.regNo}</td>
                              <td className="p-2 text-left truncate max-w-[120px]" title={row.studentName}>{row.studentName}</td>
                              <td className="p-1">
                                <span className={!row.isTest1Valid ? "text-red-650 font-black" : "text-slate-850"}>{row.test1}</span>
                              </td>
                              <td className="p-1">
                                <span className={!row.isTest2Valid ? "text-red-650 font-black" : "text-slate-850"}>{row.test2}</span>
                              </td>
                              <td className="p-1">
                                <span className={!row.isExamValid ? "text-red-650 font-black" : "text-slate-850"}>{row.exam}</span>
                              </td>
                              {selectedTerm !== "Term1" && (
                                <td className="p-1">
                                  <span className={!row.isFirstTermValid ? "text-red-650 font-black" : "text-slate-850"}>{row.firstTerm}</span>
                                </td>
                              )}
                              {selectedTerm === "Term3" && (
                                <td className="p-1">
                                  <span className={!row.isSecondTermValid ? "text-red-650 font-black" : "text-slate-850"}>{row.secondTerm}</span>
                                </td>
                              )}
                              <td className="p-2 text-center select-none">
                                {row.isValid ? (
                                  <span className="bg-green-100 text-green-800 text-[8.5px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                                    Valid Record
                                  </span>
                                ) : (
                                  <span
                                    className="bg-red-100 text-red-800 text-[8.5px] px-2 py-0.5 rounded-full font-extrabold uppercase cursor-help shrink-0 block"
                                    title={
                                      !row.studentId
                                        ? "Student registration number not found in current Database registry."
                                        : !row.isCorrectClass
                                        ? `Student registered under another class registry (not ${selectedClass}).`
                                        : "Scores out of max boundaries (Test1/2 max 20, Exam max 60, Terms max 100)."
                                    }
                                  >
                                    ⚠ Error Match
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-800 leading-tight font-extrabold uppercase">
                    <strong>* Note:</strong> Only valid rows highlighted as <strong>&quot;Valid Record&quot;</strong> will be imported to current {selectedClass} class registry. Any invalid lines will be excluded to avoid file mapping corruption.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BEHAVIORAL TRAITS & COMMENTS (1 COL) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            BEHAVIORAL TRAITS &amp; COMMENTS
          </h2>

          {!activeStudentObj ? (
            <p className="text-xs text-slate-400 font-medium italic text-center py-10 uppercase">
              Select a student from the traits column to evaluate behavior.
            </p>
          ) : (
            <div className="space-y-4 text-xs select-text">
              
              {/* Student Identification header */}
              <div className="p-3 bg-emerald-50/25 rounded-xl border border-emerald-105">
                <p className="font-extrabold text-[12px] text-emerald-950 uppercase">{activeStudentObj.fullName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Reg. No: {activeStudentObj.regNo}</p>
              </div>

              {/* Attendance metrics */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">Attendance Metrics</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Days Opened</label>
                    <input
                      type="number"
                      value={activeStudentObj.daysSchoolOpened}
                      onChange={(e) => handleAttendanceChange("daysSchoolOpened", e.target.value)}
                      className="w-full text-center py-1 border border-slate-300 rounded font-extrabold focus:outline-emerald-600 bg-slate-50/25"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Days Present</label>
                    <input
                      type="number"
                      value={activeStudentObj.daysPresent}
                      onChange={(e) => handleAttendanceChange("daysPresent", e.target.value)}
                      className="w-full text-center py-1 border border-slate-300 rounded font-extrabold focus:outline-emerald-600 text-emerald-800 bg-slate-50/25"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Days Absent</label>
                    <input
                      type="number"
                      value={activeStudentObj.daysAbsent}
                      onChange={(e) => handleAttendanceChange("daysAbsent", e.target.value)}
                      className="w-full text-center py-1 border border-slate-300 rounded font-extrabold focus:outline-emerald-600 text-red-700 bg-slate-50/25"
                    />
                  </div>
                </div>
              </div>

              {/* Slider / Picker Ratings for Affective (Quick sample: 3 major ones, or select with simple dropdowns) */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                <h3 className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">Affective Traits Ratings</h3>
                
                {[
                  { key: "punctuality", label: "Punctuality" },
                  { key: "mentalAlertness", label: "Mental Alertness" },
                  { key: "behaviour", label: "Behaviour" },
                  { key: "reliability", label: "Reliability" },
                  { key: "attentiveness", label: "Attentiveness" },
                  { key: "respect", label: "Respect" },
                  { key: "neatness", label: "Neatness" },
                  { key: "politeness", label: "Politeness" },
                  { key: "honesty", label: "Honesty" },
                ].map((item) => {
                  const val = (activeAffective as any)[item.key] || 4;
                  return (
                    <div key={item.key} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700 text-[11px]">{item.label}</span>
                      <select
                        value={val}
                        onChange={(e) => handleAffectiveChange(item.key, parseInt(e.target.value))}
                        className="bg-white border border-slate-300 px-1.5 py-0.5 rounded font-black text-emerald-900"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                <h3 className="font-bold text-slate-600 text-[10px] uppercase tracking-wider pt-2">Psychomotor Traits Ratings</h3>
                {[
                  { key: "spiritOfTeamwork", label: "Spirit of Teamwork" },
                  { key: "initiatives", label: "Initiatives" },
                  { key: "organizationalAbility", label: "Organizational Ability" },
                  { key: "handwriting", label: "Handwriting" },
                  { key: "reading", label: "Reading" },
                  { key: "verbalFluencyDiction", label: "Verbal Fluency Diction" },
                  { key: "physicalEducation", label: "Physical Education" },
                ].map((item) => {
                  const val = (activePsychomotor as any)[item.key] || 4;
                  return (
                    <div key={item.key} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700 text-[11px]">{item.label}</span>
                      <select
                        value={val}
                        onChange={(e) => handlePsychomotorChange(item.key, parseInt(e.target.value))}
                        className="bg-white border border-slate-300 px-1.5 py-0.5 rounded font-black text-amber-600"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Comments fields */}
              <div className="space-y-3 pt-2 border-t border-slate-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Class Teacher&apos;s Report</label>
                  <textarea
                    rows={2}
                    value={activeStudentObj.classTeacherReport}
                    onChange={(e) => handleCommentChange("classTeacherReport", e.target.value)}
                    placeholder="ENTER TEACHER REMARK COMMENTS..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase font-semibold bg-slate-50/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Principal&apos;s report</label>
                  <textarea
                    rows={2}
                    value={activeStudentObj.principalReport}
                    onChange={(e) => handleCommentChange("principalReport", e.target.value)}
                    placeholder="ENTER PRINCIPAL PERFORMANCE COMMENT..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase font-semibold text-emerald-800 bg-slate-50/30"
                  />
                </div>
              </div>

              <p className="text-[10px] text-emerald-650 text-center font-bold uppercase italic animate-pulse">
                ★ Behavioral changes are saved instantly!
              </p>

            </div>
          )}
        </div>

      </div>
          )}
        </div>
      </div>

    </div>
  );
}
