export interface Admin {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: "super_admin" | "sub_admin";
}

export interface Student {
  id: string;
  fullName: string;
  username: string; // e.g., fullname@progressintellectual.edu.ng
  regNo: string; // e.g., 1084/539482
  classId: string; // e.g., SS 2
  passportUrl: string; // base64 or placeholder url
  session: string; // e.g., "2025/2026"
  term: string; // e.g., "Term2"
  nextTermBegins: string; // e.g., "2026-04-27"
  termEnded: string; // e.g., "2026-07-24"
  daysSchoolOpened: number;
  daysPresent: number;
  daysAbsent: number;
  classTeacherReport: string;
  principalReport: string;
  password?: string;
}

export interface Class {
  id: string; // e.g., "SS 2", "SS 1", "JS 3"
  name: string; // e.g., "Senior Secondary 2"
  section: string; // e.g., "Science", "Arts", "Commercial"
  arm?: string; // e.g., "A", "B", "Gold"
}

export interface Subject {
  id: string; // e.g., "math", "phys", "eng"
  name: string; // e.g., "Mathematics"
  code: string; // e.g., "MTH"
}

export interface SubjectAssignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface ClassTeacherAssignment {
  id: string;
  classId: string;
  teacherId: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  username: string;
  subjectIds: string[]; // subjects they can teach
  passportUrl?: string; // base64 or placeholder url
}

export interface Score {
  studentId: string;
  subjectId: string;
  session: string;
  term: string;
  test1: number; // Max 20
  test2: number; // Max 20
  exam: number; // Max 60
  firstTerm: number; // Max 100 (from previous term)
  secondTerm: number; // Max 100 (from previous term, used in Term 3)
  customScores?: Record<string, number>; // Flexible map for newly added custom score inputs!
}

export interface ScoreComponent {
  id: string; // "test1", "test2", "exam", or custom slugs like "custom_project"
  name: string; // e.g. "1st Test", "2nd Test", "Exam", "Attendance"
  maxMark: number; // e.g., 20, 20, 60
}

export interface SchoolSettings {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  principalSignatureUrl?: string;
  themeColor?: string;
}

export interface ReportCardLayout {
  showPassport: boolean;
  showLogo: boolean;
  showMotto: boolean;
  showAddress: boolean;
  showContactInfo: boolean;
  showSessionTermBar: boolean;
  showStudentBasicMetricGrid: boolean;
  showAttendance: boolean; // new
  showNextTermBegins: boolean; // new
  showTermEnded: boolean; // new
  showStudentRegNo: boolean; // new
  showClassStatistics: boolean; // this wraps the overall stats
  showPositionInClass: boolean; // new
  showPositionInSection: boolean; // new
  showOverallTotalScore: boolean; // new
  showStudentAverageScore: boolean; // new
  showClassHighestScore: boolean; // new
  showClassLowestScore: boolean; // new
  showClassAverage: boolean; // new
  showTablePreviousTerms: boolean; // new
  showTableRemarks: boolean; // new
  showTableSubjectPosition: boolean; // new
  showTableClassAverage: boolean; // new
  showTableHighestLowest: boolean; // new
  showAffectiveTraits: boolean;
  showPsychomotorSkills: boolean;
  showGradingScale: boolean;
  showRatingKey: boolean;
  showSignatureArea: boolean;
  showTeacherRemarks: boolean;
  showPrincipalRemarks: boolean;
  showStamp: boolean;
  showEmptyRows: boolean;

  schoolNameLabel: string;
  mottoLabel: string;
  reportTitleBarLabel: string;
  classTeacherReportLabel: string;
  principalReportLabel: string;

  themePrimaryColor: "emerald" | "blue" | "indigo" | "amber" | "rose" | "slate" | "charcoal";
  layoutDensity: "compact" | "normal" | "relaxed";
  paperSize: "A4" | "Letter";
  useWatermark: boolean;
  watermarkText: string;
}

export interface AffectiveTraits {
  studentId: string;
  session: string;
  term: string;
  // Ratings of 1 to 5
  punctuality: number;
  mentalAlertness: number;
  behaviour: number;
  reliability: number;
  attentiveness: number;
  respect: number;
  neatness: number;
  politeness: number;
  honesty: number;
  relationshipWithStaff: number;
  relationshipWithStudents: number;
  attitudeToSchool: number;
  selfControl: number;
}

export interface PsychomotorSkills {
  studentId: string;
  session: string;
  term: string;
  // Ratings of 1 to 5
  spiritOfTeamwork: number;
  initiatives: number;
  organizationalAbility: number;
  handwriting: number;
  reading: number;
  verbalFluencyDiction: number;
  musicalSkills: number;
  creativeArts: number;
  physicalEducation: number;
  generalReasoning: number;
}
