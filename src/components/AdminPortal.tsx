import React, { useState } from "react";
import { Admin, Student, Class, Subject, Teacher, Score, ScoreComponent, AffectiveTraits, PsychomotorSkills } from "../types";
import { Database, DEFAULT_STUDENT_AVATAR, generateUsername, DEFAULT_TEACHER_AVATAR } from "../data";
import ReportCard from "./ReportCard";
import Broadsheet from "./Broadsheet";
import { getScoreComponents, calculateCurrentTermTotal } from "../utils";
import * as XLSX from "xlsx";
import { ShieldCheck, ClipboardList, FileText, Table, Plus, Users, BookOpen, GraduationCap, School, Check, UserPlus, Trash, Bookmark, Eye, ShieldAlert, Settings, Upload, Printer, LayoutGrid, Paintbrush, Layers, Download, FileSpreadsheet, EyeOff, Edit, Trash2 } from "lucide-react";

interface AdminPortalProps {
  db: Database;
  onUpdateDb: (newDb: Database) => void;
  onLogout: () => void;
}

type AdminTab = "students" | "subjects" | "classes" | "teachers" | "manage-admins" | "class-management" | "assignments" | "print-individual" | "print-reports" | "broadsheet" | "settings" | "card-designer" | "score-columns";

export default function AdminPortal({ db, onUpdateDb, onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("students");

  // Score Columns management states
  const [newColName, setNewColName] = useState("");
  const [newColMaxMark, setNewColMaxMark] = useState(10);
  const [colFeedback, setColFeedback] = useState("");

  // Academic period addition states
  const [newSessionInput, setNewSessionInput] = useState("");
  const [newTermInput, setNewTermInput] = useState("");
  const [periodFeedback, setPeriodFeedback] = useState("");

  // Student input mode: "manual" or "excel"
  const [studentInputMode, setStudentInputMode] = useState<"manual" | "excel">("manual");

  // Student Excel Importer State variables
  const [studentImportedRows, setStudentImportedRows] = useState<any[]>([]);
  const [studentUploadSuccess, setStudentUploadSuccess] = useState("");
  const [studentUploadError, setStudentUploadError] = useState("");
  const [studentCommitFeedback, setStudentCommitFeedback] = useState("");

  // State for adding Student
  // State for adding Student
  const [studName, setStudName] = useState("");
  const [studReg, setStudReg] = useState("");
  const [studClass, setStudClass] = useState(db.classes[0]?.id || "");
  const [studPassport, setStudPassport] = useState(DEFAULT_STUDENT_AVATAR);
  const [studentError, setStudentError] = useState("");
  const [studentSuccess, setStudentSuccess] = useState("");

  // Developer/Admin edit modes
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // State for Batch Report Cards Printing
  const [selectedPrintClass, setSelectedPrintClass] = useState(db.classes[0]?.id || "");
  const [selectedPrintSession, setSelectedPrintSession] = useState("2025/2026");
  const [selectedPrintTerm, setSelectedPrintTerm] = useState("Term2");

  // State for Sub Admins
  const [adminName, setAdminName] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // State for Class Management
  const [cmClass, setCmClass] = useState(db.classes[0]?.id || "");
  const [cmSubject, setCmSubject] = useState(db.subjects[0]?.id || "");

  // State for Print Individual
  const [selectedIndClass, setSelectedIndClass] = useState("");
  const [selectedIndStudent, setSelectedIndStudent] = useState("");

  // State for School profile settings
  const [schName, setSchName] = useState(db.schoolSettings?.schoolName || "Progress Intellectual Okeigbo Ondo State");
  const [schMotto, setSchMotto] = useState(db.schoolSettings?.motto || "Godliness and excellence");
  const [schAddress, setSchAddress] = useState(db.schoolSettings?.address || "Progress College Road, Off Surulere Street, Oke Igbo, Ondo State");
  const [schPhone, setSchPhone] = useState(db.schoolSettings?.phone || "08107385362");
  const [schEmail, setSchEmail] = useState(db.schoolSettings?.email || "info@progresschools.com");
  const [schLogo, setSchLogo] = useState(db.schoolSettings?.logoUrl || "");
  const [schPrincipalSignature, setSchPrincipalSignature] = useState(db.schoolSettings?.principalSignatureUrl || "");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Sync state if db changes
  React.useEffect(() => {
    setSchName(db.schoolSettings?.schoolName || "Progress Intellectual Okeigbo Ondo State");
    setSchMotto(db.schoolSettings?.motto || "Godliness and excellence");
    setSchAddress(db.schoolSettings?.address || "Progress College Road, Off Surulere Street, Oke Igbo, Ondo State");
    setSchPhone(db.schoolSettings?.phone || "08107385362");
    setSchEmail(db.schoolSettings?.email || "info@progresschools.com");
    setSchLogo(db.schoolSettings?.logoUrl || "");
    setSchPrincipalSignature(db.schoolSettings?.principalSignatureUrl || "");
  }, [db.schoolSettings]);

  // States for report card design customizer
  const [layoutShowPassport, setLayoutShowPassport] = useState(db.reportCardLayout?.showPassport !== false);
  const [layoutShowLogo, setLayoutShowLogo] = useState(db.reportCardLayout?.showLogo !== false);
  const [layoutShowMotto, setLayoutShowMotto] = useState(db.reportCardLayout?.showMotto !== false);
  const [layoutShowAddress, setLayoutShowAddress] = useState(db.reportCardLayout?.showAddress !== false);
  const [layoutShowContactInfo, setLayoutShowContactInfo] = useState(db.reportCardLayout?.showContactInfo !== false);
  const [layoutShowSessionTermBar, setLayoutShowSessionTermBar] = useState(db.reportCardLayout?.showSessionTermBar !== false);
  const [layoutShowStudentBasicMetricGrid, setLayoutShowStudentBasicMetricGrid] = useState(db.reportCardLayout?.showStudentBasicMetricGrid !== false);
  const [layoutShowAttendance, setLayoutShowAttendance] = useState(db.reportCardLayout?.showAttendance !== false);
  const [layoutShowNextTermBegins, setLayoutShowNextTermBegins] = useState(db.reportCardLayout?.showNextTermBegins !== false);
  const [layoutShowTermEnded, setLayoutShowTermEnded] = useState(db.reportCardLayout?.showTermEnded !== false);
  const [layoutShowStudentRegNo, setLayoutShowStudentRegNo] = useState(db.reportCardLayout?.showStudentRegNo !== false);
  const [layoutShowClassStatistics, setLayoutShowClassStatistics] = useState(db.reportCardLayout?.showClassStatistics !== false);
  const [layoutShowPositionInClass, setLayoutShowPositionInClass] = useState(db.reportCardLayout?.showPositionInClass !== false);
  const [layoutShowPositionInSection, setLayoutShowPositionInSection] = useState(db.reportCardLayout?.showPositionInSection !== false);
  const [layoutShowOverallTotalScore, setLayoutShowOverallTotalScore] = useState(db.reportCardLayout?.showOverallTotalScore !== false);
  const [layoutShowStudentAverageScore, setLayoutShowStudentAverageScore] = useState(db.reportCardLayout?.showStudentAverageScore !== false);
  const [layoutShowClassHighestScore, setLayoutShowClassHighestScore] = useState(db.reportCardLayout?.showClassHighestScore !== false);
  const [layoutShowClassLowestScore, setLayoutShowClassLowestScore] = useState(db.reportCardLayout?.showClassLowestScore !== false);
  const [layoutShowClassAverage, setLayoutShowClassAverage] = useState(db.reportCardLayout?.showClassAverage !== false);
  const [layoutShowTablePreviousTerms, setLayoutShowTablePreviousTerms] = useState(db.reportCardLayout?.showTablePreviousTerms !== false);
  const [layoutShowTableRemarks, setLayoutShowTableRemarks] = useState(db.reportCardLayout?.showTableRemarks !== false);
  const [layoutShowTableSubjectPosition, setLayoutShowTableSubjectPosition] = useState(db.reportCardLayout?.showTableSubjectPosition !== false);
  const [layoutShowTableClassAverage, setLayoutShowTableClassAverage] = useState(db.reportCardLayout?.showTableClassAverage !== false);
  const [layoutShowTableHighestLowest, setLayoutShowTableHighestLowest] = useState(db.reportCardLayout?.showTableHighestLowest !== false);
  const [layoutShowAffectiveTraits, setLayoutShowAffectiveTraits] = useState(db.reportCardLayout?.showAffectiveTraits !== false);
  const [layoutShowPsychomotorSkills, setLayoutShowPsychomotorSkills] = useState(db.reportCardLayout?.showPsychomotorSkills !== false);
  const [layoutShowGradingScale, setLayoutShowGradingScale] = useState(db.reportCardLayout?.showGradingScale !== false);
  const [layoutShowRatingKey, setLayoutShowRatingKey] = useState(db.reportCardLayout?.showRatingKey !== false);
  const [layoutShowSignatureArea, setLayoutShowSignatureArea] = useState(db.reportCardLayout?.showSignatureArea !== false);
  const [layoutShowTeacherRemarks, setLayoutShowTeacherRemarks] = useState(db.reportCardLayout?.showTeacherRemarks !== false);
  const [layoutShowPrincipalRemarks, setLayoutShowPrincipalRemarks] = useState(db.reportCardLayout?.showPrincipalRemarks !== false);
  const [layoutShowStamp, setLayoutShowStamp] = useState(db.reportCardLayout?.showStamp !== false);
  const [layoutShowEmptyRows, setLayoutShowEmptyRows] = useState(db.reportCardLayout?.showEmptyRows !== false);

  const [layoutSchoolNameLabel, setLayoutSchoolNameLabel] = useState(db.reportCardLayout?.schoolNameLabel || "");
  const [layoutMottoLabel, setLayoutMottoLabel] = useState(db.reportCardLayout?.mottoLabel || "");
  const [layoutReportTitleBarLabel, setLayoutReportTitleBarLabel] = useState(db.reportCardLayout?.reportTitleBarLabel || "");
  const [layoutClassTeacherReportLabel, setLayoutClassTeacherReportLabel] = useState(db.reportCardLayout?.classTeacherReportLabel || "Class teacher's report");
  const [layoutPrincipalReportLabel, setLayoutPrincipalReportLabel] = useState(db.reportCardLayout?.principalReportLabel || "Principal's report");

  type PrimaryColorOption = "emerald" | "blue" | "indigo" | "amber" | "rose" | "slate" | "charcoal";
  const [layoutThemePrimaryColor, setLayoutThemePrimaryColor] = useState<PrimaryColorOption>(db.reportCardLayout?.themePrimaryColor || "emerald");
  type DensityOption = "compact" | "normal" | "relaxed";
  const [layoutDensity, setLayoutDensity] = useState<DensityOption>(db.reportCardLayout?.layoutDensity || "normal");
  type PaperSizeOption = "A4" | "Letter";
  const [layoutPaperSize, setLayoutPaperSize] = useState<PaperSizeOption>(db.reportCardLayout?.paperSize || "A4");
  const [layoutUseWatermark, setLayoutUseWatermark] = useState(db.reportCardLayout?.useWatermark !== false);
  const [layoutWatermarkText, setLayoutWatermarkText] = useState(db.reportCardLayout?.watermarkText || "APPROVED");

  const [designerSuccess, setDesignerSuccess] = useState("");

  const handleSaveLayout = () => {
    onUpdateDb({
      ...db,
      reportCardLayout: {
        showPassport: layoutShowPassport,
        showLogo: layoutShowLogo,
        showMotto: layoutShowMotto,
        showAddress: layoutShowAddress,
        showContactInfo: layoutShowContactInfo,
        showSessionTermBar: layoutShowSessionTermBar,
        showStudentBasicMetricGrid: layoutShowStudentBasicMetricGrid,
        showAttendance: layoutShowAttendance,
        showNextTermBegins: layoutShowNextTermBegins,
        showTermEnded: layoutShowTermEnded,
        showStudentRegNo: layoutShowStudentRegNo,
        showClassStatistics: layoutShowClassStatistics,
        showPositionInClass: layoutShowPositionInClass,
        showPositionInSection: layoutShowPositionInSection,
        showOverallTotalScore: layoutShowOverallTotalScore,
        showStudentAverageScore: layoutShowStudentAverageScore,
        showClassHighestScore: layoutShowClassHighestScore,
        showClassLowestScore: layoutShowClassLowestScore,
        showClassAverage: layoutShowClassAverage,
        showTablePreviousTerms: layoutShowTablePreviousTerms,
        showTableRemarks: layoutShowTableRemarks,
        showTableSubjectPosition: layoutShowTableSubjectPosition,
        showTableClassAverage: layoutShowTableClassAverage,
        showTableHighestLowest: layoutShowTableHighestLowest,
        showAffectiveTraits: layoutShowAffectiveTraits,
        showPsychomotorSkills: layoutShowPsychomotorSkills,
        showGradingScale: layoutShowGradingScale,
        showRatingKey: layoutShowRatingKey,
        showSignatureArea: layoutShowSignatureArea,
        showTeacherRemarks: layoutShowTeacherRemarks,
        showPrincipalRemarks: layoutShowPrincipalRemarks,
        showStamp: layoutShowStamp,
        showEmptyRows: layoutShowEmptyRows,

        schoolNameLabel: layoutSchoolNameLabel,
        mottoLabel: layoutMottoLabel,
        reportTitleBarLabel: layoutReportTitleBarLabel,
        classTeacherReportLabel: layoutClassTeacherReportLabel,
        principalReportLabel: layoutPrincipalReportLabel,

        themePrimaryColor: layoutThemePrimaryColor,
        layoutDensity,
        paperSize: layoutPaperSize,
        useWatermark: layoutUseWatermark,
        watermarkText: layoutWatermarkText,
      }
    });

    setDesignerSuccess("Report card layout template updated successfully! Changes applied immediately across all portals.");
    setTimeout(() => {
      setDesignerSuccess("");
    }, 4000);
  };

  // School logo file reader helper
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSchLogo(base64);
        onUpdateDb({ ...db, schoolSettings: { ...db.schoolSettings, logoUrl: base64 } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSchPrincipalSignature(base64);
        onUpdateDb({ ...db, schoolSettings: { ...db.schoolSettings, principalSignatureUrl: base64 } });
      };
      reader.readAsDataURL(file);
    }
  };

  // Student excel bulk download/upload helpers
  const handleDownloadStudentSpreadsheetTemplate = () => {
    const headers = [
      "Full Name (Required)",
      "Registration Number (Required)",
      "Class ID (Required - e.g., SS 2, JS 1)",
      "Portal Password (Optional - Defaults to 12345678)"
    ];

    const exampleRows = [
      ["OJO OLUWASEYIFUNMI RUKAYAT", "1084/539482", "SS 2", "12345678"],
      ["JOHN DOE", "1084/539483", "SS 1", "welcome123"],
      ["MARY SMITH", "1084/539484", "JS 1", "test456"]
    ];

    const activeClassList = db.classes.map(c => [c.id, c.name, c.section]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers, 
      ...exampleRows,
      [],
      ["--- ACTIVE CLASS IDS IN SYSTEM (USE THESE UNDER CLASS ID COLUMN) ---"],
      ["Class ID", "Class Name", "Section"],
      ...activeClassList
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Template");

    XLSX.writeFile(workbook, "Student_Bulk_Import_Template.xlsx");
  };

  const handleExcelStudentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStudentUploadError("");
    setStudentUploadSuccess("");
    setStudentCommitFeedback("");
    setStudentImportedRows([]);

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
          setStudentUploadError("The Excel spreadsheet contains no student records inside.");
          return;
        }

        const rows = rawJson.slice(1);
        const parsed: any[] = [];

        rows.forEach((row, idx) => {
          if (!row || row.length === 0 || !row[0]) return; // Skip blank lines
          
          if (String(row[0]).startsWith("---") || String(row[0]).startsWith("Class ID") || String(row[0]).startsWith("Full Name")) {
            return; 
          }

          const fullName = String(row[0]).trim();
          const regNo = String(row[1] || "").trim();
          const classId = String(row[2] || "").trim().toUpperCase();
          const password = String(row[3] || "12345678").trim();

          if (!fullName || fullName.toLowerCase().includes("required")) return;

          const classMatch = db.classes.find(c => c.id.toLowerCase() === classId.toLowerCase());
          const isClassValid = !!classMatch;
          
          const isRegNoExists = db.students.some(s => s.regNo.toLowerCase() === regNo.toLowerCase());
          const isRegNoValid = regNo.length > 0 && !isRegNoExists;
          
          const isNameValid = fullName.length > 2;
          const isRowValid = isNameValid && isRegNoValid && isClassValid;

          parsed.push({
            rowNum: idx + 2,
            fullName: fullName.toUpperCase(),
            regNo,
            classId: classMatch ? classMatch.id : classId,
            password,
            isNameValid,
            isRegNoValid,
            isRegNoExists,
            isClassValid,
            isValid: isRowValid
          });
        });

        if (parsed.length === 0) {
          setStudentUploadError("Could not extract any valid student record rows from this Excel file.");
        } else {
          setStudentImportedRows(parsed);
          const valCount = parsed.filter((r) => r.isValid).length;
          setStudentUploadSuccess(`Parsed ${parsed.length} student row(s) from Excel. ${valCount} rows are correct & ready to register.`);
        }
      } catch (err) {
        console.error("SheetJS parse student error:", err);
        setStudentUploadError("Problem loading Excel spreadsheet. Please confirm file structural headers match template.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCommitImportedStudents = () => {
    const validEntries = studentImportedRows.filter((r) => r.isValid);
    if (validEntries.length === 0) {
      alert("No valid rows could be imported.");
      return;
    }

    const newStudentsList: Student[] = validEntries.map((v) => ({
      id: `stud_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      fullName: v.fullName,
      username: generateUsername(v.fullName),
      regNo: v.regNo,
      classId: v.classId,
      passportUrl: DEFAULT_STUDENT_AVATAR,
      session: "2025/2026",
      term: "Term2",
      nextTermBegins: "2026-04-27",
      termEnded: "2026-07-24",
      daysSchoolOpened: 118,
      daysPresent: 118,
      daysAbsent: 0,
      classTeacherReport: "ADMITTED. PERFORMANCE EVALUATION COMMENCING.",
      principalReport: "ADMITTED TO PROGRESS INTELLECTUAL SCHOOLS.",
      password: v.password,
    }));

    const newScoresList: Score[] = [];
    newStudentsList.forEach((newS) => {
      db.subjects.forEach((sub) => {
        newScoresList.push({
          studentId: newS.id,
          subjectId: sub.id,
          session: "2025/2026",
          term: "Term2",
          test1: 0,
          test2: 0,
          exam: 0,
          firstTerm: 0,
          secondTerm: 0,
        });
      });
    });

    const newAffectives: AffectiveTraits[] = newStudentsList.map((newS) => ({
      studentId: newS.id,
      session: "2025/2026",
      term: "Term2",
      punctuality: 3, mentalAlertness: 3, behaviour: 3, reliability: 3, attentiveness: 3,
      respect: 3, neatness: 3, politeness: 3, honesty: 3, relationshipWithStaff: 3,
      relationshipWithStudents: 3, attitudeToSchool: 3, selfControl: 3
    }));

    const newPsychomotors: PsychomotorSkills[] = newStudentsList.map((newS) => ({
      studentId: newS.id,
      session: "2025/2026",
      term: "Term2",
      spiritOfTeamwork: 3, initiatives: 3, organizationalAbility: 3, handwriting: 3,
      reading: 3, verbalFluencyDiction: 3, musicalSkills: 3, creativeArts: 3,
      physicalEducation: 3, generalReasoning: 3
    }));

    const updatedDb: Database = {
      ...db,
      students: [...newStudentsList, ...db.students],
      scores: [...db.scores, ...newScoresList],
      affectiveTraits: [...newAffectives, ...db.affectiveTraits],
      psychomotorSkills: [...newPsychomotors, ...db.psychomotorSkills],
    };

    onUpdateDb(updatedDb);
    setStudentCommitFeedback(`Successfully registered & auto-enrolled ${newStudentsList.length} pupils!`);

    setTimeout(() => {
      setStudentCommitFeedback("");
      setStudentImportedRows([]);
      setStudentUploadSuccess("");
    }, 4500);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodFeedback("");
    const cleanSess = newSessionInput.trim();
    if (!cleanSess) return;
    if (db.sessions.includes(cleanSess)) {
      setPeriodFeedback("This session period already exists!");
      return;
    }
    const updatedDb = {
      ...db,
      sessions: [...db.sessions, cleanSess]
    };
    onUpdateDb(updatedDb);
    setPeriodFeedback(`Session "${cleanSess}" created successfully! All portals can now select and evaluate reports for this academic session.`);
    setNewSessionInput("");
    setTimeout(() => setPeriodFeedback(""), 4500);
  };

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodFeedback("");
    const cleanTerm = newTermInput.trim();
    if (!cleanTerm) return;
    if (db.terms.includes(cleanTerm)) {
      setPeriodFeedback("This term already exists!");
      return;
    }
    const updatedDb = {
      ...db,
      terms: [...db.terms, cleanTerm]
    };
    onUpdateDb(updatedDb);
    setPeriodFeedback(`Term "${cleanTerm}" created successfully! All portals can now select and evaluate reports for this academic term.`);
    setNewTermInput("");
    setTimeout(() => setPeriodFeedback(""), 4500);
  };

  // State for adding Subject
  const [subjName, setSubjName] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjectSuccess, setSubjectSuccess] = useState("");

  // State for adding Class
  const [classNameInput, setClassNameInput] = useState("");
  const [classIdInput, setClassIdInput] = useState("");
  const [classSectionInput, setClassSectionInput] = useState("");
  const [classArmInput, setClassArmInput] = useState("");
  const [classSuccess, setClassSuccess] = useState("");

  // State for adding Teacher
  const [teachName, setTeachName] = useState("");
  const [teachSelectedSubjs, setTeachSelectedSubjs] = useState<string[]>([]);
  const [teachPassport, setTeachPassport] = useState(DEFAULT_TEACHER_AVATAR);
  const [teacherSuccess, setTeacherSuccess] = useState("");

  // States for editing a Teacher
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editingTeachName, setEditingTeachName] = useState("");
  const [editingTeachSubjects, setEditingTeachSubjects] = useState<string[]>([]);
  const [editingTeachPassport, setEditingTeachPassport] = useState("");

  // Teacher passport upload helper for additions
  const handleTeachPassportUploadForAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeachPassport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Teacher passport upload helper for editing
  const handleEditTeachPassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingTeachPassport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // State for assignments
  const [assignClass, setAssignClass] = useState(db.classes[0]?.id || "");
  const [assignSubj, setAssignSubj] = useState(db.subjects[0]?.id || "");
  const [assignTeacher, setAssignTeacher] = useState(db.teachers[0]?.id || "");
  const [assignSuccess, setAssignSuccess] = useState("");

  const [classTeacherAssignClass, setClassTeacherAssignClass] = useState(db.classes[0]?.id || "");
  const [classTeacherAssignTeacher, setClassTeacherAssignTeacher] = useState(db.teachers[0]?.id || "");
  const [classTeacherSuccess, setClassTeacherSuccess] = useState("");

  // Student passport file reader helper
  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudPassport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");
    setStudentSuccess("");

    if (!studName.trim() || !studReg.trim()) {
      setStudentError("All fields are required.");
      return;
    }

    const username = generateUsername(studName);

    // Check pre-existence
    if (db.students.some((s) => s.username === username || s.regNo === studReg)) {
      setStudentError("Student with this name or registration number already exists.");
      return;
    }

    const newStudent: Student = {
      id: `stud_${Date.now()}`,
      fullName: studName.toUpperCase(),
      username,
      regNo: studReg,
      classId: studClass,
      passportUrl: studPassport,
      session: "2025/2026",
      term: "Term2",
      nextTermBegins: "2026-04-27",
      termEnded: "2026-07-24",
      daysSchoolOpened: 118,
      daysPresent: 118,
      daysAbsent: 0,
      classTeacherReport: "ADMITTED. PERFORMANCE AWAITS EVALUATION.",
      principalReport: "ADMITTED TO PROGRESS INTELLECTUAL SCHOOLS.",
    };

    // Auto-seed initial scores of 0s for the newly enrolled student for all subjects
    const newScores = db.subjects.map((sub) => ({
      studentId: newStudent.id,
      subjectId: sub.id,
      session: "2025/2026",
      term: "Term2",
      test1: 0,
      test2: 0,
      exam: 0,
      firstTerm: 0,
      secondTerm: 0,
    }));

    // Auto-seed affective & psychomotor
    const initialAffective = {
      studentId: newStudent.id,
      session: "2025/2026",
      term: "Term2",
      punctuality: 3, mentalAlertness: 3, behaviour: 3, reliability: 3, attentiveness: 3,
      respect: 3, neatness: 3, politeness: 3, honesty: 3, relationshipWithStaff: 3,
      relationshipWithStudents: 3, attitudeToSchool: 3, selfControl: 3
    };

    const initialPsychomotor = {
      studentId: newStudent.id,
      session: "2025/2026",
      term: "Term2",
      spiritOfTeamwork: 3, initiatives: 3, organizationalAbility: 3, handwriting: 3,
      reading: 3, verbalFluencyDiction: 3, musicalSkills: 3, creativeArts: 3,
      physicalEducation: 3, generalReasoning: 3
    };

    const updatedDb: Database = {
      ...db,
      students: [newStudent, ...db.students],
      scores: [...db.scores, ...newScores],
      affectiveTraits: [initialAffective, ...db.affectiveTraits],
      psychomotorSkills: [initialPsychomotor, ...db.psychomotorSkills],
    };

    onUpdateDb(updatedDb);
    setStudentSuccess(`Student "${newStudent.fullName}" added successfully! Unique username: ${username}`);
    setStudName("");
    setStudReg("");
    setStudPassport(DEFAULT_STUDENT_AVATAR);
  };

  // Admin Class Management Handlers
  const handleAdminUpdateScore = (studentId: string, subjectId: string, field: keyof Score | string, value: string) => {
    let numVal = parseInt(value, 10);
    if (isNaN(numVal)) numVal = 0;

    onUpdateDb({
      ...db,
      scores: db.scores.map((sc) => {
        if (sc.studentId === studentId && sc.subjectId === subjectId) {
          if (["test1", "test2", "exam", "firstTerm", "secondTerm"].includes(field)) {
            return { ...sc, [field]: numVal };
          } else {
            return {
              ...sc,
              customScores: {
                ...(sc.customScores || {}),
                [field]: numVal,
              },
            };
          }
        }
        return sc;
      }),
    });
  };

  const handleAdminRemoveStudent = (studentId: string) => {
    if (confirm("Remove this student from the class? This will delete the student profile and their scores!")) {
      onUpdateDb({
        ...db,
        students: db.students.filter(s => s.id !== studentId),
        scores: db.scores.filter(sc => sc.studentId !== studentId)
      });
    }
  };

  // Delete Admin
  const handleDeleteAdmin = (id: string) => {
    if (confirm("Are you sure you want to delete this admin?")) {
      onUpdateDb({
        ...db,
        admins: db.admins.filter(a => a.id !== id)
      });
    }
  };

  // Add/Edit Admin
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");

    if (!adminName.trim() || !adminUser.trim()) {
      setAdminError("Please fill all required fields.");
      return;
    }

    if (editingAdmin) {
      const updatedAdmins = db.admins.map(a => 
        a.id === editingAdmin.id 
          ? { ...a, fullName: adminName, username: adminUser, password: adminPass || a.password }
          : a
      );
      onUpdateDb({ ...db, admins: updatedAdmins });
      setAdminSuccess("Admin updated successfully!");
      setEditingAdmin(null);
    } else {
      if (db.admins.some((a) => a.username === adminUser)) {
        setAdminError("Username already exists.");
        return;
      }
      const newAdmin: Admin = {
        id: `admin_${Date.now()}`,
        fullName: adminName,
        username: adminUser,
        password: adminPass || "password",
        role: "sub_admin",
      };
      onUpdateDb({ ...db, admins: [...db.admins, newAdmin] });
      setAdminSuccess("Admin added successfully!");
    }

    setAdminName("");
    setAdminUser("");
    setAdminPass("");
  };

  // Create Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectSuccess("");

    if (!subjName.trim() || !subjCode.trim()) return;

    const newSubj: Subject = {
      id: subjName.toLowerCase().replace(/[^a-z]/g, ""),
      name: subjName,
      code: subjCode.toUpperCase(),
    };

    if (db.subjects.some((s) => s.id === newSubj.id)) {
      alert("Subject already exists.");
      return;
    }

    // Auto-seed scores of 0 for this new subject for all current students
    const newScoresForStudents = db.students.map((stud) => ({
      studentId: stud.id,
      subjectId: newSubj.id,
      session: "2025/2026",
      term: "Term2",
      test1: 0,
      test2: 0,
      exam: 0,
      firstTerm: 0,
      secondTerm: 0,
    }));

    const updatedDb: Database = {
      ...db,
      subjects: [...db.subjects, newSubj],
      scores: [...db.scores, ...newScoresForStudents],
    };

    onUpdateDb(updatedDb);
    setSubjectSuccess(`Subject "${newSubj.name}" registered successfully.`);
    setSubjName("");
    setSubjCode("");
  };

  // Create Class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassSuccess("");

    if (!classIdInput.trim() || !classNameInput.trim()) return;

    // Combine Class Level Short ID with class arm (e.g., JS 1 + A = JS 1A)
    const combinedId = (classIdInput.trim() + classArmInput.trim()).toUpperCase();

    const newClass: Class = {
      id: combinedId,
      name: classNameInput.trim() + (classArmInput.trim() ? ` (Arm ${classArmInput.trim().toUpperCase()})` : ""),
      section: classSectionInput.trim() || "General",
      arm: classArmInput.trim().toUpperCase() || undefined
    };

    if (db.classes.some((c) => c.id === newClass.id)) {
      alert("Class already exists.");
      return;
    }

    const updatedDb: Database = {
      ...db,
      classes: [...db.classes, newClass],
    };

    onUpdateDb(updatedDb);
    setClassSuccess(`Class "${newClass.id}" created successfully.`);
    setClassIdInput("");
    setClassNameInput("");
    setClassSectionInput("");
    setClassArmInput("");
  };

  // Create Teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccess("");

    if (!teachName.trim()) return;

    const username = generateUsername(teachName).replace("schoolname", "progressintellectual");

    const newTeacher: Teacher = {
      id: `teach_${Date.now()}`,
      fullName: teachName,
      username,
      subjectIds: teachSelectedSubjs,
      passportUrl: teachPassport,
    };

    const updatedDb: Database = {
      ...db,
      teachers: [...db.teachers, newTeacher],
    };

    onUpdateDb(updatedDb);
    setTeacherSuccess(`Teacher "${newTeacher.fullName}" added successfully. Portal username: ${username}`);
    setTeachName("");
    setTeachSelectedSubjs([]);
    setTeachPassport(DEFAULT_TEACHER_AVATAR);
  };

  // Assign Subject Teacher
  const handleAssignSubjectTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSuccess("");

    const newAssignment = {
      id: `sa_${assignClass}_${assignSubj}`,
      classId: assignClass,
      subjectId: assignSubj,
      teacherId: assignTeacher,
    };

    // Remove old assignment if any
    const listWithoutOld = db.subjectAssignments.filter(
      (as) => !(as.classId === assignClass && as.subjectId === assignSubj)
    );

    const updatedDb: Database = {
      ...db,
      subjectAssignments: [...listWithoutOld, newAssignment],
    };

    onUpdateDb(updatedDb);
    setAssignSuccess("Subject Teacher Assigned successfully!");
  };

  // Assign Class Teacher
  const handleAssignClassTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setClassTeacherSuccess("");

    const newAssignment = {
      id: `cta_${classTeacherAssignClass}`,
      classId: classTeacherAssignClass,
      teacherId: classTeacherAssignTeacher,
    };

    // Remove old assignment if any
    const listWithoutOld = db.classTeacherAssignments.filter(
      (as) => as.classId !== classTeacherAssignClass
    );

    const updatedDb: Database = {
      ...db,
      classTeacherAssignments: [...listWithoutOld, newAssignment],
    };

    onUpdateDb(updatedDb);
    setClassTeacherSuccess("Class Teacher Assigned successfully!");
  };

  // Delete handlers
  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove student "${name}"?`)) {
      onUpdateDb({
        ...db,
        students: db.students.filter((s) => s.id !== id),
        scores: db.scores.filter((sc) => sc.studentId !== id),
        affectiveTraits: db.affectiveTraits.filter((a) => a.studentId !== id),
        psychomotorSkills: db.psychomotorSkills.filter((p) => p.studentId !== id),
      });
    }
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove teacher "${name}"?`)) {
      onUpdateDb({
        ...db,
        teachers: db.teachers.filter((t) => t.id !== id),
        subjectAssignments: db.subjectAssignments.filter((sa) => sa.teacherId !== id),
        classTeacherAssignments: db.classTeacherAssignments.filter((cta) => cta.teacherId !== id),
      });
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm(`Are you sure you want to delete class group "${classId}"? This will ALSO REMOVE all student profiles, report cards, records, and assignments associated with this class. This is an irreversible developer-level override.`)) {
      const studentIdsToDelete = db.students.filter((s) => s.classId === classId).map((s) => s.id);
      onUpdateDb({
        ...db,
        classes: db.classes.filter((c) => c.id !== classId),
        students: db.students.filter((s) => s.classId !== classId),
        scores: db.scores.filter((sc) => !studentIdsToDelete.includes(sc.studentId)),
        affectiveTraits: db.affectiveTraits.filter((a) => !studentIdsToDelete.includes(a.studentId)),
        psychomotorSkills: db.psychomotorSkills.filter((p) => !studentIdsToDelete.includes(p.studentId)),
        classTeacherAssignments: db.classTeacherAssignments.filter((cta) => cta.classId !== classId),
        subjectAssignments: db.subjectAssignments.filter((sa) => sa.classId !== classId),
      });
    }
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    if (confirm(`Are you sure you want to delete subject "${name}"? This will delete all student columns and continuous assessment scores for this subject from the system. This cannot be undone.`)) {
      onUpdateDb({
        ...db,
        subjects: db.subjects.filter((sub) => sub.id !== subjectId),
        scores: db.scores.filter((sc) => sc.subjectId !== subjectId),
        subjectAssignments: db.subjectAssignments.filter((sa) => sa.subjectId !== subjectId),
        teachers: db.teachers.map((t) => ({
          ...t,
          subjectIds: t.subjectIds.filter((id) => id !== subjectId),
        })),
      });
    }
  };

  const handleSaveClass = (updatedClass: Class) => {
    const originalClassId = editingClass?.id || "";
    const isIdChanged = originalClassId !== updatedClass.id;

    if (isIdChanged && db.classes.some((c) => c.id === updatedClass.id)) {
      alert(`Error: A class with identification ID "${updatedClass.id}" already exists.`);
      return;
    }

    let updatedStudents = [...db.students];
    let updatedSubjectAssignments = [...db.subjectAssignments];
    let updatedClassTeacherAssignments = [...db.classTeacherAssignments];

    if (isIdChanged) {
      updatedStudents = db.students.map((stud) =>
        stud.classId === originalClassId ? { ...stud, classId: updatedClass.id } : stud
      );
      updatedSubjectAssignments = db.subjectAssignments.map((sa) =>
        sa.classId === originalClassId ? { ...sa, classId: updatedClass.id } : sa
      );
      updatedClassTeacherAssignments = db.classTeacherAssignments.map((cta) =>
        cta.classId === originalClassId ? { ...cta, classId: updatedClass.id } : cta
      );
    }

    const updatedClasses = db.classes.map((cls) =>
      cls.id === originalClassId ? updatedClass : cls
    );

    onUpdateDb({
      ...db,
      classes: updatedClasses,
      students: updatedStudents,
      subjectAssignments: updatedSubjectAssignments,
      classTeacherAssignments: updatedClassTeacherAssignments,
    });
    setEditingClass(null);
  };

  const handleSaveSubject = (updatedSubject: Subject) => {
    const originalSubjectId = editingSubject?.id || "";
    const isIdChanged = originalSubjectId !== updatedSubject.id;

    if (isIdChanged && db.subjects.some((s) => s.id === updatedSubject.id)) {
      alert(`Error: A subject with unique code key "${updatedSubject.id}" already exists.`);
      return;
    }

    let updatedScores = [...db.scores];
    let updatedSubjectAssignments = [...db.subjectAssignments];
    
    if (isIdChanged) {
      updatedScores = db.scores.map((sc) =>
        sc.subjectId === originalSubjectId ? { ...sc, subjectId: updatedSubject.id } : sc
      );
      updatedSubjectAssignments = db.subjectAssignments.map((sa) =>
        sa.subjectId === originalSubjectId ? { ...sa, subjectId: updatedSubject.id } : sa
      );
    }

    const updatedSubjects = db.subjects.map((sub) =>
      sub.id === originalSubjectId ? updatedSubject : sub
    );

    const updatedTeachers = db.teachers.map((t) => {
      if (isIdChanged && t.subjectIds.includes(originalSubjectId)) {
        return {
          ...t,
          subjectIds: t.subjectIds.map((sid) => sid === originalSubjectId ? updatedSubject.id : sid)
        };
      }
      return t;
    });

    onUpdateDb({
      ...db,
      subjects: updatedSubjects,
      scores: updatedScores,
      subjectAssignments: updatedSubjectAssignments,
      teachers: updatedTeachers
    });
    setEditingSubject(null);
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    const originalStudentId = editingStudent?.id || "";
    const updatedStudents = db.students.map((stud) =>
      stud.id === originalStudentId ? { ...updatedStudent, fullName: updatedStudent.fullName.toUpperCase().trim() } : stud
    );
    onUpdateDb({
      ...db,
      students: updatedStudents,
    });
    setEditingStudent(null);
  };

  const handleToggleSubjectInTeacher = (subjId: string) => {
    if (teachSelectedSubjs.includes(subjId)) {
      setTeachSelectedSubjs(teachSelectedSubjs.filter((id) => id !== subjId));
    } else {
      setTeachSelectedSubjs([...teachSelectedSubjs, subjId]);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen select-text print:p-0 print:m-0 print:bg-transparent print:max-w-full">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl border-b-4 border-amber-500 mb-6 shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            <img src={db.schoolSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-emerald-950 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs">
                System Admin Portal
              </span>
              <span className="bg-emerald-500/20 text-emerald-100 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 border border-emerald-500/30">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                Live Cloud Mode
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-tight">
              {db.schoolSettings.schoolName}
            </h1>
            <p className="text-xs text-amber-400 italic font-medium mt-0.5">
              Motto: {db.schoolSettings.motto}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition relative z-10 cursor-pointer"
          id="btn_admin_logout"
        >
          Logout Administrator
        </button>
      </div>

      {/* Metrics Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Users size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Total Students</span>
            <span className="text-xl font-black text-slate-800">{db.students.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Total Teachers</span>
            <span className="text-xl font-black text-slate-800">{db.teachers.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Bookmark size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Total Subjects</span>
            <span className="text-xl font-black text-slate-800">{db.subjects.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <School size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Active Classes</span>
            <span className="text-xl font-black text-slate-800">{db.classes.length}</span>
          </div>
        </div>
      </div>

      {/* Flex container for sidebar + workspace contents */}
      <div className="flex flex-row gap-4 md:gap-6 items-start w-full print:block">
        
        {/* Left Vertical Navigation Menu Panel */}
        <div className="w-14 sm:w-16 md:w-64 bg-white rounded-xl border border-slate-200 p-1.5 md:p-3 shadow-sm flex flex-col gap-1.5 shrink-0 print:hidden">
          <span className="hidden md:block text-[10px] text-slate-400 font-extrabold tracking-wider uppercase px-3 py-2">
            ADMIN NAVIGATION
          </span>
          {[
            { id: "students", label: "Students Portal", icon: Users },
            { id: "subjects", label: "Manage Subjects", icon: BookOpen },
            { id: "classes", label: "Manage Classes", icon: School },
            { id: "teachers", label: "Manage Teachers", icon: GraduationCap },
            { id: "manage-admins", label: "Manage Admins", icon: ShieldCheck },
            { id: "class-management", label: "Class Scores", icon: ClipboardList },
            { id: "broadsheet", label: "Broadsheet", icon: Table },
            { id: "assignments", label: "Teacher Assignments", icon: UserPlus },
            { id: "print-individual", label: "Print Single Report", icon: FileText },
            { id: "print-reports", label: "Batch Print Reports", icon: Printer },
            { id: "score-columns", label: "Score Sheets Area", icon: Layers }, // Custom score sheet configuration is here!
            { id: "card-designer", label: "Report Card Layout", icon: Paintbrush },
            { id: "settings", label: "School Profile Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3.5 py-3 rounded-lg text-xs font-black transition-all cursor-pointer w-full text-left uppercase tracking-wide ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                id={`tab_${tab.id}`}
                title={tab.label}
              >
                <Icon size={15} className="shrink-0" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Workspace Content Panel - persistent side-by-side displaying beside the menu */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 p-3 md:p-6 shadow-xs min-h-[500px] print:border-none print:shadow-none print:p-0 print:m-0 print:bg-transparent">
          
          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Option switch column */}
              <div className="lg:col-span-1 border-r border-slate-100 lg:pr-8 animate-fade-in">
                
                {/* Manual Form vs Excel upload selector button group */}
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStudentInputMode("manual")}
                    className={`flex-1 py-2 text-center text-[10px] font-black uppercase rounded-md tracking-wider transition cursor-pointer ${
                      studentInputMode === "manual" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Manual Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentInputMode("excel")}
                    className={`flex-1 py-2 text-center text-[10px] font-black uppercase rounded-md tracking-wider transition cursor-pointer ${
                      studentInputMode === "excel" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Excel Sheet
                  </button>
                </div>

                {studentInputMode === "manual" ? (
                  <>
                    <h2 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase tracking-tight">
                      <Plus size={16} className="text-emerald-650" />
                      Add New Student
                    </h2>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={studName}
                    onChange={(e) => setStudName(e.target.value)}
                    placeholder="e.g. OJO OLUWASEYIFUNMI RUKAYAT"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase"
                    id="input_stud_name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={studReg}
                    onChange={(e) => setStudReg(e.target.value)}
                    placeholder="e.g. 1084/539482"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    id="input_stud_reg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Classrooms</label>
                    <select
                      value={studClass}
                      onChange={(e) => setStudClass(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                      id="select_stud_class"
                    >
                      {db.classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.id} - {cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Password</label>
                    <input
                      type="text"
                      disabled
                      value="12345678"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Passport Image</label>
                  <div className="flex items-center gap-4 mt-1 bg-slate-50/55 p-3 rounded-lg border border-slate-200/50">
                    <img
                      src={studPassport}
                      alt="Student Picture Preview"
                      className="w-14 h-14 object-cover border border-slate-300 rounded bg-white shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePassportUpload}
                        className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                        id="input_stud_passport"
                      />
                      <span className="block text-[9px] text-slate-400 mt-1">Leaves default SVG icon if none chosen.</span>
                    </div>
                  </div>
                </div>

                {studentError && (
                  <p className="text-xs text-red-650 bg-red-50 p-2.5 rounded border border-red-200 font-bold">
                    {studentError}
                  </p>
                )}

                {studentSuccess && (
                  <div className="text-xs text-green-700 bg-green-50 p-3 rounded border border-green-200/70 font-semibold space-y-1">
                    <p className="font-extrabold">{studentSuccess}</p>
                    <p className="text-[10px] text-slate-500 lowercase">Password: 12345678</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                  id="btn_submit_student"
                >
                  Create &amp; Enroll Student
                </button>
              </form>
              </>
              ) : (
                <div className="space-y-4 animate-fade-in text-xs">
                  <h2 className="text-md font-bold text-slate-800 mb-2 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase tracking-tight">
                    <FileSpreadsheet size={16} className="text-emerald-650" />
                    Excel Batch Upload
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase">
                    Register and enroll multiple students in a single Excel sheet upload action.
                  </p>

                  <div className="bg-slate-50 p-4 border rounded-xl space-y-3">
                    <span className="block text-[10px] text-slate-450 font-black uppercase">Step 1: Download Format Sheet</span>
                    <button
                      type="button"
                      onClick={handleDownloadStudentSpreadsheetTemplate}
                      className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-350 text-slate-800 font-extrabold px-3 py-2 rounded text-[10px] cursor-pointer"
                    >
                      <Download size={13} />
                      Download Excel Template
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 border rounded-xl space-y-3">
                    <span className="block text-[10px] text-slate-450 font-black uppercase">Step 2: Upload Completed Sheet</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleExcelStudentUpload}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 cursor-pointer"
                    />
                  </div>

                  {studentUploadError && (
                    <p className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-250 font-extrabold capitalize">
                      {studentUploadError}
                    </p>
                  )}

                  {studentUploadSuccess && (
                     <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-lg text-[10px] text-emerald-800 font-extrabold">
                       {studentUploadSuccess}
                     </div>
                  )}

                  {studentCommitFeedback && (
                     <div className="bg-green-50 border border-green-250 p-3 rounded-lg text-[10px] text-green-800 font-extrabold">
                       {studentCommitFeedback}
                     </div>
                  )}

                  {studentImportedRows.length > 0 && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleCommitImportedStudents}
                        disabled={studentImportedRows.filter(r => r.isValid).length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        Register {studentImportedRows.filter(r => r.isValid).length} Valid Students
                      </button>

                      <div className="max-h-[220px] overflow-y-auto border border-slate-200 bg-slate-50 p-2 rounded-lg space-y-1">
                        <span className="block text-[9px] text-slate-400 font-black uppercase mb-1">Parsed Rows Status</span>
                        {studentImportedRows.map((row, rIdx) => (
                          <div key={rIdx} className="flex justify-between items-center bg-white p-1.5 border rounded text-[10px]">
                            <div className="truncate pr-1">
                              <span className="font-bold text-slate-700">{row.fullName}</span>
                              <span className="text-[9px] text-slate-400 block font-mono">Reg: {row.regNo} | Class: {row.classId}</span>
                            </div>
                            <span>
                              {row.isValid ? (
                                <span className="bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded text-[8px] uppercase">READY</span>
                              ) : (
                                <span className="bg-red-100 text-red-800 font-black px-1.5 py-0.5 rounded text-[8px] uppercase" title={row.isRegNoExists ? "Reg No already Exists!" : "Name or Class ID invalid!"}>INVALID</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
               )}
            </div>

            {/* List */}
            <div className="lg:col-span-2">
              <h2 className="text-md font-bold text-slate-800 mb-4">
                Registered Students List ({db.students.length})
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Info</th>
                      <th className="p-3">Portal Username / Reg No</th>
                      <th className="p-3">Class</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {db.students.map((stud) => (
                      <tr key={stud.id} className="hover:bg-slate-50">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={stud.passportUrl || DEFAULT_STUDENT_AVATAR}
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-xs object-cover"
                            referrerPolicy="no-referrer"
                            alt={stud.fullName}
                          />
                          <span className="font-bold text-slate-800 uppercase">{stud.fullName}</span>
                        </td>
                        <td className="p-3">
                          <code className="text-emerald-700 block text-[10px]">{stud.username}</code>
                          <span className="text-slate-400 font-medium text-[10px]">{stud.regNo}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded font-black text-[10px]">
                            {stud.classId}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => setEditingStudent(stud)}
                              className="text-emerald-650 hover:text-white hover:bg-emerald-650 px-2 py-1 rounded border border-emerald-250 text-[10px] font-black uppercase cursor-pointer transition flex items-center gap-1"
                              id={`edit_stud_${stud.id}`}
                              title="Edit Student Profile Details"
                            >
                              <Edit size={10} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(stud.id, stud.fullName)}
                              className="text-rose-650 hover:text-white hover:bg-rose-600 px-2 py-1 rounded border border-rose-200 text-[10px] font-black uppercase cursor-pointer transition flex items-center gap-1"
                              id={`delete_stud_${stud.id}`}
                              title="Remove Student from School Registry"
                            >
                              <Trash2 size={10} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === "subjects" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-slate-100 lg:pr-8">
              <h2 className="text-md font-bold text-slate-800 mb-4">Add Course Subject</h2>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    placeholder="e.g. English Language"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    id="input_subj_name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjCode}
                    onChange={(e) => setSubjCode(e.target.value)}
                    placeholder="e.g. ENG"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase"
                    id="input_subj_code"
                  />
                </div>

                {subjectSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 font-bold">
                    {subjectSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Create Subject
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-md font-bold text-slate-800 mb-4">Active School Subjects ({db.subjects.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto">
                {db.subjects.map((sub) => (
                  <div key={sub.id} className="p-3.5 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50/55 hover:border-slate-350 transition-colors">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs uppercase">{sub.name}</span>
                      <span className="text-[10px] text-slate-450 font-bold uppercase">Code Key: <code className="text-emerald-700 font-black">{sub.code}</code></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingSubject(sub)}
                        title="Edit Subject"
                        className="p-1 px-2 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded border border-emerald-200 text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit size={10} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        title="Delete Subject"
                        className="p-1 px-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded border border-rose-200 text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={10} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLASSES TAB */}
        {activeTab === "classes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-slate-100 lg:pr-8">
              <h2 className="text-md font-bold text-slate-800 mb-4">Add Class Registry</h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Name Short ID</label>
                  <input
                    type="text"
                    required
                    value={classIdInput}
                    onChange={(e) => setClassIdInput(e.target.value)}
                    placeholder="e.g. JS 1, SS 2"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase"
                    id="input_class_id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Arm (e.g. A, B, Gold)</label>
                  <input
                    type="text"
                    value={classArmInput}
                    onChange={(e) => setClassArmInput(e.target.value)}
                    placeholder="e.g. A, B, C"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 uppercase"
                    id="input_class_arm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Description</label>
                  <input
                    type="text"
                    required
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="e.g. Junior Secondary 1"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    id="input_class_name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Academic Section</label>
                  <input
                    type="text"
                    value={classSectionInput}
                    onChange={(e) => setClassSectionInput(e.target.value)}
                    placeholder="e.g. Junior, Senior Science"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    id="input_class_section"
                  />
                </div>

                {classIdInput && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[11px] font-bold uppercase space-y-1">
                    <span className="text-slate-450 block text-[9px] font-extrabold">Registry ID Preview:</span>
                    <span className="text-sm font-black text-emerald-950">{(classIdInput.trim() + classArmInput.trim()).toUpperCase()}</span>
                    <p className="normal-case font-bold text-[10px] text-emerald-700">
                      Creating registry category for {(classIdInput.trim() + classArmInput.trim()).toUpperCase()} with Arm &quot;{classArmInput.toUpperCase() || "None"}&quot;
                    </p>
                  </div>
                )}

                {classSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 font-bold">
                    {classSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Create Class
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-md font-bold text-slate-800 mb-4">School Classes List ({db.classes.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto">
                {db.classes.map((cls) => {
                  const studCount = db.students.filter((s) => s.classId === cls.id).length;
                  return (
                    <div key={cls.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex justify-between items-center gap-4 hover:border-slate-300 transition-colors">
                      <div className="flex-1">
                        <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {cls.id}
                          {cls.arm && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] font-black px-1.5 py-0.5 rounded">
                              ARM {cls.arm}
                            </span>
                          )}
                        </span>
                        <span className="text-slate-500 block text-[10px] mt-0.5">{cls.name}</span>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block mt-0.5">Section: {cls.section}</span>
                        
                        {/* developer override action buttons */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            onClick={() => setEditingClass(cls)}
                            className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight transition flex items-center gap-1 cursor-pointer"
                            id={`edit_class_${cls.id}`}
                            title="Edit Class details"
                          >
                            <Edit size={10} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight transition flex items-center gap-1 cursor-pointer"
                            id={`delete_class_${cls.id}`}
                            title="Delete Class Group"
                          >
                            <Trash2 size={10} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 bg-white p-2.5 rounded-lg border border-slate-100 min-w-[65px]">
                        <span className="block text-[14px] font-black text-emerald-800">{studCount}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Students</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === "teachers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-slate-100 lg:pr-8 space-y-4">
              <h2 className="text-md font-bold text-slate-800">Add School Teacher</h2>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher Full Name</label>
                  <input
                    type="text"
                    required
                    value={teachName}
                    onChange={(e) => setTeachName(e.target.value)}
                    placeholder="e.g. Mr. Seyi Adewole"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    id="input_teach_name"
                  />
                </div>

                <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Teacher Passport</label>
                  <div className="flex items-center gap-3">
                    <img
                      src={teachPassport}
                      className="w-12 h-12 rounded-full border bg-white p-0.5 object-cover shrink-0"
                      alt="Passport Preview"
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTeachPassportUploadForAdd}
                        className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject Capabilities</label>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/30">
                    {db.subjects.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teachSelectedSubjs.includes(sub.id)}
                          onChange={() => handleToggleSubjectInTeacher(sub.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sub.name} ({sub.code})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {teacherSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 font-bold">
                    {teacherSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Create Teacher profile
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-md font-bold text-slate-800 mb-4">Registered Teachers List ({db.teachers.length})</h2>
              <div className="space-y-3 max-h-[460px] overflow-y-auto">
                {db.teachers.map((teach) => {
                  const isEditing = editingTeacherId === teach.id;

                  if (isEditing) {
                    return (
                      <div key={teach.id} className="p-4 border-2 border-emerald-600 rounded-xl bg-emerald-50/25 shadow-xs space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input
                              type="text"
                              required
                              value={editingTeachName}
                              onChange={(e) => setEditingTeachName(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Passport Photo</label>
                            <div className="flex items-center gap-2">
                              <img
                                src={editingTeachPassport}
                                className="w-8 h-8 rounded-full border bg-white object-cover"
                                alt="Preview"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditTeachPassportUpload}
                                className="text-[10px] file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded file:bg-emerald-100 file:text-emerald-800 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Subject Capabilities</label>
                          <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded bg-white max-h-[100px] overflow-y-auto">
                            {db.subjects.map((sub) => (
                              <label key={sub.id} className="inline-flex items-center gap-1.5 text-[10px] font-bold cursor-pointer bg-slate-50 px-2 py-1 rounded border">
                                <input
                                  type="checkbox"
                                  checked={editingTeachSubjects.includes(sub.id)}
                                  onChange={() => {
                                    if (editingTeachSubjects.includes(sub.id)) {
                                      setEditingTeachSubjects(editingTeachSubjects.filter((id) => id !== sub.id));
                                    } else {
                                      setEditingTeachSubjects([...editingTeachSubjects, sub.id]);
                                    }
                                  }}
                                  className="rounded text-emerald-650 focus:ring-emerald-500"
                                />
                                <span>{sub.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedTeachers = db.teachers.map((t) => {
                                if (t.id === teach.id) {
                                  return {
                                    ...t,
                                    fullName: editingTeachName,
                                    passportUrl: editingTeachPassport,
                                    subjectIds: editingTeachSubjects,
                                  };
                                }
                                return t;
                              });
                              onUpdateDb({ ...db, teachers: updatedTeachers });
                              setEditingTeacherId(null);
                            }}
                            className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded uppercase cursor-pointer hover:bg-emerald-700"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTeacherId(null)}
                            className="bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded uppercase cursor-pointer hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={teach.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={teach.passportUrl || DEFAULT_TEACHER_AVATAR}
                          className="w-9 h-9 rounded-full bg-amber-100 p-0.5 object-cover shrink-0"
                          alt={teach.fullName}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-extrabold text-slate-800 text-xs block">{teach.fullName}</span>
                          <code className="text-emerald-700 block text-[9px] leading-none mt-0.5">{teach.username}</code>
                          <span className="text-[9px] text-slate-400 font-bold uppercase italic block mt-1">Pass: 12345678</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:max-w-[40%] items-center">
                        {teach.subjectIds.map((subjId) => {
                          const subj = db.subjects.find((s) => s.id === subjId);
                          return (
                            <span key={subjId} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase">
                              {subj ? subj.code : subjId}
                            </span>
                          );
                        })}
                        {teach.subjectIds.length === 0 && (
                          <span className="text-slate-400 font-medium text-[9px] italic">No courses capability loaded</span>
                        )}
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacherId(teach.id);
                            setEditingTeachName(teach.fullName);
                            setEditingTeachSubjects(teach.subjectIds);
                            setEditingTeachPassport(teach.passportUrl || DEFAULT_TEACHER_AVATAR);
                          }}
                          className="p-1 px-2.5 rounded border border-slate-300 text-[10px] font-black text-slate-650 hover:bg-slate-200 cursor-pointer uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(teach.id, teach.fullName)}
                          className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PORTAL ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Subject Teacher Assignment Section */}
            <div className="border border-slate-200 p-5 rounded-xl bg-slate-50/20">
              <h3 className="text-sm font-bold text-emerald-950 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                <span>Subject Teacher Allocation</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded">AUTO-SET</span>
              </h3>
              <form onSubmit={handleAssignSubjectTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Target Class</label>
                  <select
                    value={assignClass}
                    onChange={(e) => setAssignClass(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {db.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.id} - {cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course Subject</label>
                  <select
                    value={assignSubj}
                    onChange={(e) => setAssignSubj(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {db.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Teacher Allocation</label>
                  <select
                    value={assignTeacher}
                    onChange={(e) => setAssignTeacher(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {db.teachers.map((teach) => (
                      <option key={teach.id} value={teach.id}>{teach.fullName}</option>
                    ))}
                  </select>
                </div>

                {assignSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 font-bold">
                    {assignSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Confirm Subject Teacher Assignment
                </button>
              </form>
            </div>

            {/* Class Teacher Assignment Section */}
            <div className="border border-slate-200 p-5 rounded-xl bg-slate-50/20">
              <h3 className="text-sm font-bold text-emerald-950 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                <span>Class Form Teacher Allocation</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded">ROSTER</span>
              </h3>
              <form onSubmit={handleAssignClassTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Classroom</label>
                  <select
                    value={classTeacherAssignClass}
                    onChange={(e) => setClassTeacherAssignClass(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {db.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.id} - {cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Class Teacher</label>
                  <select
                    value={classTeacherAssignTeacher}
                    onChange={(e) => setClassTeacherAssignTeacher(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {db.teachers.map((teach) => (
                      <option key={teach.id} value={teach.id}>{teach.fullName}</option>
                    ))}
                  </select>
                </div>

                {classTeacherSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 font-bold">
                    {classTeacherSuccess}
                   </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-lg transition"
                >
                  Assign Form Class Teacher
                </button>
              </form>
            </div>

          </div>
        )}

        {/* BATCH PRINTING REPORTS TAB */}
        {activeTab === "print-reports" && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl print:hidden">
              <h2 className="text-md font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-tight">
                <Printer size={18} className="text-emerald-700" />
                Batch Print Student Report Cards
              </h2>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Filter and view all student report sheets for the selected class and academic period. 
                Clicking <strong>"Print All Cards"</strong> will open the browser menu to print all generated sheets back-to-back, with each student's sheet automatically starting on a fresh page.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Target Class</label>
                  <select
                    value={selectedPrintClass}
                    onChange={(e) => setSelectedPrintClass(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold"
                  >
                    {db.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.id} - {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Academic Session</label>
                  <select
                    value={selectedPrintSession}
                    onChange={(e) => setSelectedPrintSession(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Term</label>
                  <select
                    value={selectedPrintTerm}
                    onChange={(e) => setSelectedPrintTerm(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold"
                  >
                    <option value="Term1">1st Term</option>
                    <option value="Term2">2nd Term</option>
                    <option value="Term3">3rd Term</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => window.print()}
                    disabled={db.students.filter((s) => s.classId === selectedPrintClass).length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <Printer size={14} />
                    Print All Cards
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-6 animate-fade-in print:space-y-0 print:block">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 print:hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Report Sheet Previews ({db.students.filter((s) => s.classId === selectedPrintClass).length} Students Found)
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded uppercase">
                  Class: {selectedPrintClass} | {selectedPrintTerm}
                </span>
              </div>

              {db.students.filter((s) => s.classId === selectedPrintClass).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 print:hidden">
                  <p className="text-sm font-bold text-slate-400">No students found registered under class "{selectedPrintClass}"</p>
                  <p className="text-xs text-slate-400 mt-1">Please register students under this class or adjust the filter selection.</p>
                </div>
              ) : (
                <div className="space-y-12 print:space-y-0 print:block">
                  {db.students
                    .filter((s) => s.classId === selectedPrintClass)
                    .map((stud) => (
                      <div
                        key={stud.id}
                        className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0"
                        style={{ pageBreakAfter: "always" }}
                      >
                        <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg mb-4 text-xs font-mono font-bold text-slate-600 print:hidden">
                          <span>STUDENT REPORT CARD PREVIEW: {stud.fullName} ({stud.id})</span>
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] rounded uppercase">Ready</span>
                        </div>
                        <ReportCard
                          studentId={stud.id}
                          session={selectedPrintSession}
                          term={selectedPrintTerm}
                          db={db}
                          hideControls={true}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGE ADMINS TAB */}
        {activeTab === "manage-admins" && (
          <div className="animate-fade-in max-w-4xl space-y-6 flex-1">
            <h2 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase">
              <ShieldCheck size={16} className="text-emerald-600" />
              Manage Sub-Admins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                <h3 className="text-sm font-bold text-slate-700 mb-4">{editingAdmin ? 'Edit Admin' : 'Add New Sub-Admin'}</h3>
                {adminError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-4">{adminError}</div>}
                {adminSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg mb-4">{adminSuccess}</div>}
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Full Name</label>
                    <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Username</label>
                    <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} disabled={!!editingAdmin} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Password {editingAdmin && "(Leave blank to keep)"}</label>
                    <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full uppercase hover:bg-emerald-700">{editingAdmin ? 'Save Changes' : 'Create Admin'}</button>
                    {editingAdmin && (
                       <button type="button" onClick={() => setEditingAdmin(null)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-xs font-bold w-full uppercase hover:bg-slate-400">Cancel</button>
                    )}
                  </div>
                </form>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {db.admins?.map(a => (
                  <div key={a.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{a.fullName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{a.username}</div>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-2 rounded-full uppercase mt-1 inline-block font-bold">{a.role}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingAdmin(a); setAdminName(a.fullName); setAdminUser(a.username); setAdminPass(''); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit size={16} /></button>
                      {a.role !== "super_admin" && (
                         <button onClick={() => handleDeleteAdmin(a.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLASS MANAGEMENT TAB */}
        {activeTab === "class-management" && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase">
              <ClipboardList size={16} className="text-emerald-600" />
              Class Management (Full Access)
            </h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Class</label>
                <select value={cmClass} onChange={e => setCmClass(e.target.value)} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold">
                  {db.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Subject to Edit Scores</label>
                <select value={cmSubject} onChange={e => setCmSubject(e.target.value)} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold">
                  {db.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white border rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 border-b font-black w-10 text-center">#</th>
                    <th className="p-3 border-b font-black">Student Name</th>
                    {db.scoreComponents?.map(c => (
                      <th key={c.id} className="p-3 border-b font-black text-center">{c.name} (/{c.maxMark})</th>
                    ))}
                    <th className="p-3 border-b font-black text-center text-red-600">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {db.students.filter(s => s.classId === cmClass).map((stud, idx) => {
                    const scoreRecord = db.scores.find(sc => sc.studentId === stud.id && sc.subjectId === cmSubject) || {
                      studentId: stud.id, subjectId: cmSubject, test1: 0, test2: 0, exam: 0, firstTerm: 0, secondTerm: 0, customScores: {}
                    };
                    return (
                      <tr key={stud.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="text-xs font-bold text-slate-800">{stud.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{stud.regNo}</div>
                        </td>
                        {db.scoreComponents?.map(c => {
                          const val = ["test1", "test2", "exam", "firstTerm", "secondTerm"].includes(c.id) 
                            ? (scoreRecord as any)[c.id]
                            : ((scoreRecord.customScores || {})[c.id] || 0);

                          return (
                            <td key={c.id} className="p-2 text-center">
                              <input 
                                type="number" 
                                min={0} 
                                max={c.maxMark}
                                value={val === 0 && !(scoreRecord as any).session ? '' : val}
                                onChange={e => handleAdminUpdateScore(stud.id, cmSubject, c.id, e.target.value)}
                                className="w-16 text-center text-xs py-1.5 border rounded-md font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                              />
                            </td>
                          );
                        })}
                        <td className="p-3 text-center text-red-500">
                          <button onClick={() => handleAdminRemoveStudent(stud.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors tooltip" title="Remove Student">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {db.students.filter(s => s.classId === cmClass).length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 text-xs font-bold">No students found in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRINT INDIVIDUAL REPORT TAB */}
        {activeTab === "print-individual" && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase print:hidden">
              <FileText size={16} className="text-emerald-600" />
              Print Single Report
            </h2>
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl print:hidden">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Class</label>
                  <select value={selectedIndClass} onChange={e => { setSelectedIndClass(e.target.value); setSelectedIndStudent(""); }} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold">
                    <option value="">-- Choose a class --</option>
                    {db.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Student</label>
                  <select value={selectedIndStudent} onChange={e => setSelectedIndStudent(e.target.value)} disabled={!selectedIndClass} className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600 font-bold disabled:bg-slate-100 disabled:text-slate-400">
                    <option value="">-- Choose a student --</option>
                    {db.students.filter(s => s.classId === selectedIndClass).map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.id})</option>)}
                  </select>
                </div>
                <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Session</label>
                   <select className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"><option>2025/2026</option></select>
                </div>
                <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Term</label>
                   <select className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"><option>Term2</option></select>
                </div>
                <div>
                  <button onClick={() => window.print()} disabled={!selectedIndStudent} className="h-[34px] bg-emerald-600 text-white font-bold text-xs py-2 px-6 rounded-lg disabled:bg-slate-300 flex items-center gap-2 uppercase">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </div>

            {selectedIndStudent ? (
              <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0">
                 <ReportCard
                    studentId={selectedIndStudent}
                    session="2025/2026"
                    term="Term2"
                    db={db}
                    hideControls={true}
                 />
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 print:hidden">
                <p className="text-sm font-bold text-slate-400">Select a student above to preview their report card.</p>
              </div>
            )}
          </div>
        )}

        {/* BROADSHEET TAB */}
        {activeTab === "broadsheet" && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase print:hidden">
              <Table size={16} className="text-emerald-600" />
              Broadsheets
            </h2>
            <Broadsheet db={db} />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="animate-fade-in max-w-2xl mx-auto py-4">
            <h2 className="text-md font-bold text-slate-800 mb-6 flex items-center gap-2 border-b-2 border-emerald-500 pb-1 w-fit uppercase">
              <School size={16} className="text-emerald-650" />
              School Profile Settings
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updatedDb: Database = {
                  ...db,
                  schoolSettings: {
                    schoolName: schName,
                    motto: schMotto,
                    address: schAddress,
                    phone: schPhone,
                    email: schEmail,
                    logoUrl: schLogo,
                    principalSignatureUrl: schPrincipalSignature,
                  }
                };
                onUpdateDb(updatedDb);
                setSettingsSuccess("School settings saved successfully!");
                setTimeout(() => setSettingsSuccess(""), 4000);
              }}
              className="space-y-5 text-slate-800 text-xs font-semibold"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Name</label>
                  <input
                    type="text"
                    required
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motto</label>
                  <input
                    type="text"
                    required
                    value={schMotto}
                    onChange={(e) => setSchMotto(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={schAddress}
                  onChange={(e) => setSchAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-650 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={schPhone}
                    onChange={(e) => setSchPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={schEmail}
                    onChange={(e) => setSchEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase">School Emblem Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0">
                    <img src={schLogo} alt="Emblem" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 font-bold leading-none">Upload PNG, JPG, or SVG emblem file.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase">Principal's Signature Passport/Image</label>
                <p className="text-[10px] text-slate-500 font-medium">Replaces the default scribble signature on generated report cards.</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-16 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0">
                    {schPrincipalSignature ? (
                      <img src={schPrincipalSignature} alt="Principal Signature" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <div className="flex gap-2">
                       <p className="text-[10px] text-slate-400 font-bold">Upload PNG/JPG signature image.</p>
                       {schPrincipalSignature && (
                          <button type="button" onClick={() => setSchPrincipalSignature("")} className="text-[10px] text-rose-600 font-bold hover:underline">Remove</button>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded font-bold uppercase tracking-wider text-[10px]">
                  {settingsSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
              >
                Save School Setup Settings
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <h2 className="text-md font-bold text-rose-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                <ShieldAlert size={16} className="text-rose-650" />
                Live Cloud Sync Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase mb-1">Push Local to Cloud</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 leading-tight">
                    Forcefully upload everything currently on this screen to the cloud database. Use this if your changes aren't appearing elsewhere.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("This will overwrite the database in the cloud with exactly what is on this screen. Continue?")) {
                        onUpdateDb(db);
                        alert("Database successfully pushed to cloud!");
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-850 font-black py-3 rounded-xl border border-slate-200 transition text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Overwrite Cloud with This Browser
                  </button>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase mb-1">Wipe Local Cache</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 leading-tight">
                    Delete local browser storage and force a fresh reload from the Live Cloud. Use this to sync with what's actually in the cloud.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("This will clear your browser's local cache and reload the page. Continue?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-black py-3 rounded-xl border border-rose-100 transition text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Clear Local Cache & Reload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT CARD CUSTOM LAYOUT DESIGNER TABS */}
        {activeTab === "card-designer" && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Paintbrush className="text-emerald-650" size={20} />
                Report Card Template Customizer
              </h2>
              <p className="text-xs text-slate-400 font-bold leading-tight">
                Add or remove features, specify custom headers or label translations, alter layouts, configure colors, and download in real-time from the interactive preview canvas.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT CUSTOMIZER CONTROLS COLUMN */}
              <div className="xl:col-span-5 space-y-6 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                
                {/* 1. Theme and Dimensions Layout */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                    <Layers size={14} className="text-emerald-650" />
                    Color Palette &amp; Grid Density
                  </h3>
                  
                  {/* Theme palette select */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase leading-none">Primary Color Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "emerald", label: "Emerald", colorBg: "bg-emerald-600" },
                        { id: "blue", label: "Blue", colorBg: "bg-blue-600" },
                        { id: "indigo", label: "Indigo", colorBg: "bg-indigo-600" },
                        { id: "amber", label: "Amber", colorBg: "bg-amber-600" },
                        { id: "rose", label: "Crimson", colorBg: "bg-rose-600" },
                        { id: "slate", label: "Slate", colorBg: "bg-slate-600" },
                        { id: "charcoal", label: "Charcoal", colorBg: "bg-neutral-800" },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setLayoutThemePrimaryColor(th.id as PrimaryColorOption)}
                          className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 text-[8px] font-black uppercase transition cursor-pointer select-none ${
                            layoutThemePrimaryColor === th.id ? "border-emerald-600 bg-white shadow-xs" : "border-slate-200 bg-white hover:border-slate-350"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full ${th.colorBg} shadow-xs block`} />
                          <span className="text-[7.5px] leading-none">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density selecting */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase leading-none">Rendering Density (A4 adjustment)</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 rounded-lg">
                      {[
                        { id: "compact", label: "Compact (A4-Ready)" },
                        { id: "normal", label: "Normal" },
                        { id: "relaxed", label: "Relaxed" },
                      ].map((den) => (
                        <button
                          key={den.id}
                          type="button"
                          onClick={() => setLayoutDensity(den.id as DensityOption)}
                          className={`w-full text-[9px] font-extrabold py-2 rounded transition uppercase tracking-tighter cursor-pointer ${
                            layoutDensity === den.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-650 hover:text-slate-900"
                          }`}
                        >
                          {den.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Overrides & Content Custom Labelings */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                    <Check size={14} className="text-emerald-650" />
                    Text &amp; Label Overrides
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase leading-none mb-1">Custom School Name Override</label>
                      <input
                        type="text"
                        placeholder="Leave blank to use default School Name"
                        value={layoutSchoolNameLabel}
                        onChange={(e) => setLayoutSchoolNameLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-emerald-655 text-xs bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase leading-none mb-1">Custom Motto Override</label>
                      <input
                        type="text"
                        placeholder="Leave blank to use default Motto"
                        value={layoutMottoLabel}
                        onChange={(e) => setLayoutMottoLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-emerald-655 text-xs bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase leading-none mb-1">Custom Title Bar Override</label>
                      <input
                        type="text"
                        placeholder="Leave blank to use default: e.g. 2nd TERM REPORT"
                        value={layoutReportTitleBarLabel}
                        onChange={(e) => setLayoutReportTitleBarLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-emerald-655 text-xs bg-white text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-500 uppercase leading-none mb-1">Tutor Remark Label</label>
                        <input
                          type="text"
                          value={layoutClassTeacherReportLabel}
                          onChange={(e) => setLayoutClassTeacherReportLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-emerald-655 text-[11px] bg-white text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-500 uppercase leading-none mb-1">Principal Remark Label</label>
                        <input
                          type="text"
                          value={layoutPrincipalReportLabel}
                          onChange={(e) => setLayoutPrincipalReportLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-emerald-655 text-[11px] bg-white text-slate-800 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Watermark controls */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                    <ShieldAlert size={14} className="text-emerald-650" />
                    Watermark Stamp Overlay
                  </h3>
                  
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="useWatermark"
                      checked={layoutUseWatermark}
                      onChange={(e) => setLayoutUseWatermark(e.target.checked)}
                      className="w-4 h-4 text-emerald-650 rounded bg-white accent-emerald-650"
                    />
                    <label id="lbl_useWatermark" htmlFor="useWatermark" className="text-xs text-slate-705 font-bold select-none cursor-pointer">
                      Superimpose Watermark stamp
                    </label>
                  </div>

                  {layoutUseWatermark && (
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-1 leading-none">Watermark text</label>
                      <input
                        type="text"
                        value={layoutWatermarkText}
                        onChange={(e) => setLayoutWatermarkText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-emerald-655 text-xs bg-white text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Show/Hide Features Checklist */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                    <Users size={14} className="text-emerald-650" />
                    Visible Components Checklist
                  </h3>

                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1 text-[11px] font-bold text-slate-650">
                    {[
                      { id: "passport", label: "Student Passport Avatar", val: layoutShowPassport, set: setLayoutShowPassport },
                      { id: "logo", label: "School Emblem Shield Logo", val: layoutShowLogo, set: setLayoutShowLogo },
                      { id: "motto", label: "School Motto Text Line", val: layoutShowMotto, set: setLayoutShowMotto },
                      { id: "address", label: "School Location Address", val: layoutShowAddress, set: setLayoutShowAddress },
                      { id: "contacts", label: "Contacts Info (Phone/Email)", val: layoutShowContactInfo, set: setLayoutShowContactInfo },
                      { id: "titleBar", label: "Big Term/Session Title Banner", val: layoutShowSessionTermBar, set: setLayoutShowSessionTermBar },
                      { id: "metricGrid", label: "Basic Student Details Matrix", val: layoutShowStudentBasicMetricGrid, set: setLayoutShowStudentBasicMetricGrid },
                      { id: "metricGridRegNo", label: "├─ Show Reg No", val: layoutShowStudentRegNo, set: setLayoutShowStudentRegNo },
                      { id: "metricGridNextTerm", label: "├─ Show Next Term Begins", val: layoutShowNextTermBegins, set: setLayoutShowNextTermBegins },
                      { id: "metricGridTermEnd", label: "├─ Show Term Ended", val: layoutShowTermEnded, set: setLayoutShowTermEnded },
                      { id: "metricGridAttendance", label: "├─ Show Attendance (Opened/Present)", val: layoutShowAttendance, set: setLayoutShowAttendance },
                      { id: "classStats", label: "Class Position & Section Average Cards", val: layoutShowClassStatistics, set: setLayoutShowClassStatistics },
                      { id: "statsClassPos", label: "├─ Show Position in Class", val: layoutShowPositionInClass, set: setLayoutShowPositionInClass },
                      { id: "statsSectionPos", label: "├─ Show Position in Section", val: layoutShowPositionInSection, set: setLayoutShowPositionInSection },
                      { id: "statsTotal", label: "├─ Show Overall Total Score", val: layoutShowOverallTotalScore, set: setLayoutShowOverallTotalScore },
                      { id: "statsAvg", label: "├─ Show Student Average %", val: layoutShowStudentAverageScore, set: setLayoutShowStudentAverageScore },
                      { id: "statsClassHigh", label: "├─ Show Class Highest Score", val: layoutShowClassHighestScore, set: setLayoutShowClassHighestScore },
                      { id: "statsClassLow", label: "├─ Show Class Lowest Score", val: layoutShowClassLowestScore, set: setLayoutShowClassLowestScore },
                      { id: "statsClassAvg", label: "├─ Show Class Average Score", val: layoutShowClassAverage, set: setLayoutShowClassAverage },
                      { id: "tableColsTitle", label: "Results Table Columns configuration", val: true, set: () => {} }, // Just a header pseudo-toggle
                      { id: "tablePrevTerms", label: "├─ Show Previous Terms' Scores", val: layoutShowTablePreviousTerms, set: setLayoutShowTablePreviousTerms },
                      { id: "tableSubjectPos", label: "├─ Show Subject Position", val: layoutShowTableSubjectPosition, set: setLayoutShowTableSubjectPosition },
                      { id: "tableClassAvg", label: "├─ Show Subject Class Average", val: layoutShowTableClassAverage, set: setLayoutShowTableClassAverage },
                      { id: "tableHighestLowest", label: "├─ Show Subject Highest/Lowest Score", val: layoutShowTableHighestLowest, set: setLayoutShowTableHighestLowest },
                      { id: "tableRemarks", label: "├─ Show Subject Remarks", val: layoutShowTableRemarks, set: setLayoutShowTableRemarks },
                      { id: "affective", label: "Affective Behaviors assessment block", val: layoutShowAffectiveTraits, set: setLayoutShowAffectiveTraits },
                      { id: "psychomotor", label: "Psychomotor Skills rating block", val: layoutShowPsychomotorSkills, set: setLayoutShowPsychomotorSkills },
                      { id: "gradingScale", label: "Grading Key guidelines (A1-F9 meaning)", val: layoutShowGradingScale, set: setLayoutShowGradingScale },
                      { id: "ratingKey", label: "Observe Key description (1-5 rating key)", val: layoutShowRatingKey, set: setLayoutShowRatingKey },
                      { id: "signature", label: "Principal's Signature scribble area", val: layoutShowSignatureArea, set: setLayoutShowSignatureArea },
                      { id: "teacherRemarks", label: "Class Tutor assessment remarks row", val: layoutShowTeacherRemarks, set: setLayoutShowTeacherRemarks },
                      { id: "principalRemarks", label: "Principal verdict assessment remarks row", val: layoutShowPrincipalRemarks, set: setLayoutShowPrincipalRemarks },
                      { id: "stamp", label: "Superimposed red 'APPROVED' stamp", val: layoutShowStamp, set: setLayoutShowStamp },
                      { id: "emptyRows", label: "Pad score grid with blank table lines", val: layoutShowEmptyRows, set: setLayoutShowEmptyRows },
                    ].map((feat) => (
                      <div key={feat.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`feat_${feat.id}`}
                          checked={feat.val}
                          onChange={(e) => feat.set(e.target.checked)}
                          className="w-4 h-4 text-emerald-650 rounded border-slate-300 accent-emerald-650"
                        />
                        <label id={`lbl_feat_${feat.id}`} htmlFor={`feat_${feat.id}`} className="select-none cursor-pointer font-bold">
                          {feat.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submitting state feedback */}
                {designerSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded font-bold uppercase tracking-wider text-[10px]">
                    {designerSuccess}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveLayout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  Apply Configuration &amp; Save Layout
                </button>
              </div>

              {/* RIGHT LIVE WYSIWYG PREVIEW COLUMN */}
              <div className="xl:col-span-span xl:col-span-7 space-y-4">
                <div className="bg-slate-205 bg-slate-200 border border-slate-300 rounded-xl p-3 text-center">
                  <span className="bg-slate-900 text-amber-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-xs inline-block">
                    Live Report Card Canvas Preview
                  </span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1.5 leading-tighter">
                    This interactive preview updates in real-time as you toggle values. Test downloading the PDF directly below!
                  </p>
                </div>

                <div className="border border-slate-300 rounded-xl shadow-lg bg-white overflow-hidden max-h-[850px] overflow-y-auto">
                  <ReportCard
                    studentId={db.students[0]?.id || "stud_seyi"}
                    session="2025/2026"
                    term="Term2"
                    db={{
                      ...db,
                      reportCardLayout: {
                        showPassport: layoutShowPassport,
                        showLogo: layoutShowLogo,
                        showMotto: layoutShowMotto,
                        showAddress: layoutShowAddress,
                        showContactInfo: layoutShowContactInfo,
                        showSessionTermBar: layoutShowSessionTermBar,
                        showStudentBasicMetricGrid: layoutShowStudentBasicMetricGrid,
                        showAttendance: layoutShowAttendance,
                        showNextTermBegins: layoutShowNextTermBegins,
                        showTermEnded: layoutShowTermEnded,
                        showStudentRegNo: layoutShowStudentRegNo,
                        showClassStatistics: layoutShowClassStatistics,
                        showPositionInClass: layoutShowPositionInClass,
                        showPositionInSection: layoutShowPositionInSection,
                        showOverallTotalScore: layoutShowOverallTotalScore,
                        showStudentAverageScore: layoutShowStudentAverageScore,
                        showClassHighestScore: layoutShowClassHighestScore,
                        showClassLowestScore: layoutShowClassLowestScore,
                        showClassAverage: layoutShowClassAverage,
                        showTablePreviousTerms: layoutShowTablePreviousTerms,
                        showTableRemarks: layoutShowTableRemarks,
                        showTableSubjectPosition: layoutShowTableSubjectPosition,
                        showTableClassAverage: layoutShowTableClassAverage,
                        showTableHighestLowest: layoutShowTableHighestLowest,
                        showAffectiveTraits: layoutShowAffectiveTraits,
                        showPsychomotorSkills: layoutShowPsychomotorSkills,
                        showGradingScale: layoutShowGradingScale,
                        showRatingKey: layoutShowRatingKey,
                        showSignatureArea: layoutShowSignatureArea,
                        showTeacherRemarks: layoutShowTeacherRemarks,
                        showPrincipalRemarks: layoutShowPrincipalRemarks,
                        showStamp: layoutShowStamp,
                        showEmptyRows: layoutShowEmptyRows,
                        schoolNameLabel: layoutSchoolNameLabel,
                        mottoLabel: layoutMottoLabel,
                        reportTitleBarLabel: layoutReportTitleBarLabel,
                        classTeacherReportLabel: layoutClassTeacherReportLabel,
                        principalReportLabel: layoutPrincipalReportLabel,
                        themePrimaryColor: layoutThemePrimaryColor,
                        layoutDensity,
                        paperSize: layoutPaperSize,
                        useWatermark: layoutUseWatermark,
                        watermarkText: layoutWatermarkText,
                      }
                    }}
                    hideControls={false}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCORE COLUMNS & PERIODS TAB */}
        {activeTab === "score-columns" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header description */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Academic Period & Score Sheet Editor</h2>
              <p className="text-xs text-slate-500 font-medium">Add new sessions, terms, or customize the score components (first test, second test, exam, etc.) dynamically.</p>
            </div>

            {/* Part 1: Sessions and Terms Creators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Session / Term Forms */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-3xs">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Add Custom Academic Session</h3>
                  <form onSubmit={handleAddSession} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newSessionInput}
                      onChange={(e) => setNewSessionInput(e.target.value)}
                      placeholder="e.g., 2026/2027"
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition"
                    >
                      Add Session
                    </button>
                  </form>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-3xs">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Add Custom Academic Term</h3>
                  <form onSubmit={handleAddTerm} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newTermInput}
                      onChange={(e) => setNewTermInput(e.target.value)}
                      placeholder="e.g., Term3 or Term4"
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition"
                    >
                      Add Term
                    </button>
                  </form>
                </div>

                {periodFeedback && (
                  <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-lg text-xs text-emerald-800 font-bold">
                    {periodFeedback}
                  </div>
                )}
              </div>

              {/* Existing Sessions and Terms Display */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b pb-2">Currently Configured Periods</h3>
                <div>
                  <span className="block text-[10px] text-slate-400 font-black uppercase mb-1.5">Registered Sessions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {db.sessions.map((sess) => (
                      <span key={sess} className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-1 rounded-md text-xs font-bold">
                        {sess}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400 font-black uppercase mb-1.5">Registered Terms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {db.terms.map((t) => (
                      <span key={t} className="bg-amber-50 text-amber-850 border border-amber-305 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: Dynamic Score Columns Editor */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score component creation form */}
                <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Configure Assessment Areas</h3>
                  
                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Assessment Label *</label>
                    <input
                      type="text"
                      required
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      placeholder="e.g., 3rd Test, Project, Presentation"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Weight Allocation / Max Mark *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={newColMaxMark}
                      onChange={(e) => setNewColMaxMark(parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold"
                    />
                  </div>

                  {colFeedback && (
                    <div className="bg-amber-50 border border-amber-205 p-2.5 rounded text-[11px] text-amber-800 font-bold">
                      {colFeedback}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!newColName.trim()) {
                        setColFeedback("Please provide a valid column label name.");
                        return;
                      }
                      const existingComps = getScoreComponents(db);
                      const customSlug = `custom_${Date.now()}`;
                      
                      const newComp: ScoreComponent = {
                        id: customSlug,
                        name: newColName.trim(),
                        maxMark: newColMaxMark,
                      };

                      const newCompsList = [...existingComps, newComp];
                      onUpdateDb({
                        ...db,
                        scoreComponents: newCompsList
                      });

                      setNewColName("");
                      setNewColMaxMark(10);
                      setColFeedback("A custom assessment column area has been added and saved!");
                      setTimeout(() => setColFeedback(""), 4500);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition uppercase"
                  >
                    Add Assessment Column
                  </button>
                </div>

                {/* Score components list & visualizer of relative weighting */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 uppercase">Assessment Areas Overview</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Below is the core calculation breakdown. Total sum should equal 100.</p>
                    </div>
                    {(() => {
                      const comps = getScoreComponents(db);
                      const totalMark = comps.reduce((sum, c) => sum + c.maxMark, 0);
                      const isExactly100 = totalMark === 100;
                      return (
                        <div className="text-right">
                          <span className={`text-md font-black block ${isExactly100 ? "text-emerald-700" : "text-amber-600"}`}>
                            {totalMark} Marks
                          </span>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase">
                            {isExactly100 ? "✓ Optimal Total (100)" : "⚠ Total is not 100"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    {getScoreComponents(db).map((comp) => {
                      const isDefault = ["test1", "test2", "exam"].includes(comp.id);
                      return (
                        <div key={comp.id} className="p-4 border rounded-xl bg-white flex items-center justify-between shadow-3xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-800 uppercase">{comp.name}</span>
                              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase">
                                KEY: {comp.id}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-405 font-bold uppercase block mt-0.5">
                              Core Max Points: {comp.maxMark} Weight Marks
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Edit Button for Marks allocation */}
                            <input
                              type="number"
                              value={comp.maxMark}
                              onChange={(e) => {
                                const newMark = parseInt(e.target.value) || 0;
                                const existing = getScoreComponents(db);
                                const updated = existing.map((x) => x.id === comp.id ? { ...x, maxMark: newMark } : x);
                                onUpdateDb({
                                  ...db,
                                  scoreComponents: updated
                                });
                              }}
                              className="w-16 text-center text-xs px-2 py-1 border rounded bg-white font-extrabold"
                              title="Modify maximum mark"
                            />

                            {!isDefault ? (
                              <button
                                onClick={() => {
                                  const existing = getScoreComponents(db);
                                  const updated = existing.filter((x) => x.id !== comp.id);
                                  
                                  onUpdateDb({
                                    ...db,
                                    scoreComponents: updated
                                  });
                                }}
                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded transition cursor-pointer"
                                title="Remove Assessment Area"
                              >
                                <Trash size={14} />
                              </button>
                            ) : (
                              <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-black tracking-widest uppercase">
                                STANDARD
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div> {/* closing Right Active Content Panel */}
      </div> {/* closing flex-col lg:flex-row outer column layout */}

      {/* Student Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-text animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b pb-3 mb-4">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-800 font-extrabold rounded text-[11px] uppercase">DEVELOPER ACCESS</span>
              Edit Student Registry Profile
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveStudent(editingStudent);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white uppercase font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Registration/Admission Number *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.regNo}
                  onChange={(e) => setEditingStudent({ ...editingStudent, regNo: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class Assignment *</label>
                <select
                  value={editingStudent.classId}
                  onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-semibold uppercase text-slate-800"
                >
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Passport Avatar URL (Image Link or Base64)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <img
                    src={editingStudent.passportUrl || DEFAULT_STUDENT_AVATAR}
                    className="w-11 h-11 rounded-xl border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                    alt="Upload Preview"
                  />
                  <input
                    type="text"
                    value={editingStudent.passportUrl || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, passportUrl: e.target.value })}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-500 text-[10px]"
                    placeholder="URL or Upload below"
                  />
                </div>
                <div className="mt-2 pl-14">
                  <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold px-3 py-1.5 rounded-md text-[10px] cursor-pointer">
                    <Upload size={12} />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setEditingStudent({ ...editingStudent, passportUrl: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class Teacher's Remark</label>
                <textarea
                  value={editingStudent.classTeacherReport || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, classTeacherReport: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-medium text-slate-800 resize-y"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Principal's Remark</label>
                <textarea
                  value={editingStudent.principalReport || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, principalReport: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-medium text-slate-800 resize-y"
                  rows={2}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-lg transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-text animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b pb-3 mb-4">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-800 font-extrabold rounded text-[11px] uppercase">DEVELOPER ACCESS</span>
              Edit Class Registry
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveClass(editingClass);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class Short ID (Cannot conflict) *</label>
                <input
                  type="text"
                  required
                  value={editingClass.id}
                  onChange={(e) => setEditingClass({ ...editingClass, id: e.target.value.toUpperCase().trim() })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 font-black bg-white text-slate-800 uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class Arm (e.g. A, B, Gold)</label>
                <input
                  type="text"
                  value={editingClass.arm || ""}
                  onChange={(e) => setEditingClass({ ...editingClass, arm: e.target.value.toUpperCase().trim() })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-extrabold text-slate-850 uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Class Description / Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-650 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Academic Section *</label>
                <input
                  type="text"
                  required
                  value={editingClass.section}
                  onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white text-slate-800"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-lg transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-text animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 border-b pb-3 mb-4">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-800 font-extrabold rounded text-[11px] uppercase">DEVELOPER ACCESS</span>
              Edit Subject Registry
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSubject(editingSubject);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Subject Unique ID Key *</label>
                <input
                  type="text"
                  required
                  value={editingSubject.id}
                  onChange={(e) => setEditingSubject({ ...editingSubject, id: e.target.value.toLowerCase().trim() })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-650 bg-white font-black text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase().trim() })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white font-black text-slate-800"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-lg transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
