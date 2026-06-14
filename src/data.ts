import { Admin, Student, Class, Subject, Teacher, Score, AffectiveTraits, PsychomotorSkills, SubjectAssignment, ClassTeacherAssignment, SchoolSettings, ReportCardLayout, ScoreComponent } from "./types";

export interface Database {
  admins: Admin[];
  students: Student[];
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
  scores: Score[];
  affectiveTraits: AffectiveTraits[];
  psychomotorSkills: PsychomotorSkills[];
  subjectAssignments: SubjectAssignment[];
  classTeacherAssignments: ClassTeacherAssignment[];
  sessions: string[];
  terms: string[];
  schoolSettings: SchoolSettings;
  reportCardLayout: ReportCardLayout;
  scoreComponents?: ScoreComponent[];
}

const STORAGE_KEY = "progress_intellectual_db_v1";

// Helper for generating standard format usernames
export const generateUsername = (fullName: string): string => {
  const clean = fullName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "");
  return `${clean}@schoolname.edu.ng`.replace("schoolname", "progressintellectual");
};

// Beautiful base64 styled avatar or high quality SVG string for student passport
export const DEFAULT_STUDENT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="%23e0f2fe"/>
  <circle cx="50" cy="35" r="20" fill="%230284c7"/>
  <path d="M50,15 A15,15 0 0,0 35,30 A5,5 0 0,0 35,32 A15,15 0 0,1 50,20 A15,15 0 0,1 65,32 A5,5 0 0,0 65,30 A15,15 0 0,0 50,15 Z" fill="%230369a1"/>
  <path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 L80,100 L20,100 Z" fill="%230f172a"/>
  <path d="M43,55 L43,62 L40,65 L50,75 L60,65 L57,62 L57,55 Z" fill="%23f8fafc"/>
  <polygon points="50,62 44,70 50,78 56,70" fill="%23ef4444"/>
  <rect x="49" y="75" width="2" height="25" fill="%23ef4444"/>
  <circle cx="45" cy="32" r="2" fill="%23ffffff"/>
  <circle cx="55" cy="32" r="2" fill="%23ffffff"/>
  <path d="M47,43 Q50,45 53,43" stroke="%23ffffff" stroke-width="1.5" fill="none"/>
</svg>`;

export const DEFAULT_TEACHER_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="%23fef3c7"/>
  <circle cx="50" cy="35" r="20" fill="%23d97706"/>
  <path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 L80,100 L20,100 Z" fill="%231e293b"/>
  <rect x="45" y="55" width="10" height="12" fill="%23f8fafc"/>
  <polygon points="40,55 50,72 60,55" fill="%231e293b"/>
  <circle cx="45" cy="32" r="2" fill="%23ffffff"/>
  <circle cx="55" cy="32" r="2" fill="%23ffffff"/>
  <rect x="42" y="28" width="16" height="4" rx="1" fill="%23334155" opacity="0.8"/>
  <path d="M46,42 Q50,45 54,42" stroke="%23ffffff" stroke-width="1.5" fill="none"/>
</svg>`;

export const DEFAULT_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="white" rx="30"/>
  <path d="M50 30 L350 30 L350 250 C350 330 200 380 200 380 C200 380 50 330 50 250 Z" 
        fill="%23f0fdf4" stroke="%23047857" stroke-width="10"/>
  <path d="M80 60 L320 60 L320 240 C320 300 200 345 200 345 C200 345 80 300 80 240 Z" 
        fill="white" stroke="%23047857" stroke-width="4"/>
  <line x1="80" y1="240" x2="320" y2="60" stroke="%23047857" stroke-width="5" />
  
  <text x="200" y="50" font-family="'Inter', sans-serif" font-weight="950" font-size="20" fill="%23dc2626" text-anchor="middle">INTELLECTUAL</text>
  
  <g transform="rotate(-90 75 140)">
     <text x="75" y="140" font-family="'Inter', sans-serif" font-weight="900" font-size="16" fill="%23dc2626" text-anchor="middle" letter-spacing="3">PROGRESS</text>
  </g>
  <g transform="rotate(90 325 140)">
     <text x="325" y="140" font-family="'Inter', sans-serif" font-weight="900" font-size="16" fill="%23dc2626" text-anchor="middle" letter-spacing="3">SCHOOLS</text>
  </g>
  
  <path d="M120 120 C135 110 150 110 160 120 C170 110 185 110 200 120 L200 165 C185 155 170 155 160 165 C150 155 135 155 120 165 Z" 
        fill="white" stroke="%23047857" stroke-width="3" stroke-linejoin="round"/>
  <line x1="160" y1="120" x2="160" y2="165" stroke="%23047857" stroke-width="3"/>
  
  <g transform="translate(10, -10)">
    <polygon points="215,225 255,210 295,225 255,240" fill="%23047857" />
    <path d="M235 233 L235 250 C235 258 275 258 275 250 L275 233" fill="%23047857" />
    <path d="M220 270 L280 270 C285 270 285 280 280 280 L220 280 C215 280 215 270 220 270 Z" 
          fill="none" stroke="%23047857" stroke-width="3"/>
    <path d="M275 270 C278 273 278 277 275 280" fill="none" stroke="%23047857" stroke-width="3"/>
  </g>
  
  <text x="200" y="325" font-family="'Inter', sans-serif" font-weight="950" font-size="24" fill="%23dc2626" text-anchor="middle">OKE-IGBO</text>

  <path d="M40 355 L55 342 L345 342 L360 355 L345 368 L55 368 Z" fill="white" stroke="%23047857" stroke-width="4" stroke-linejoin="round"/>
  <text x="200" y="360" font-family="'Inter', sans-serif" font-weight="900" font-size="11" fill="%23dc2626" text-anchor="middle" letter-spacing="0.5">GODLINESS AND EXCELLENCE</text>
</svg>`;

export const getInitialSchoolSettings = (): SchoolSettings => {
  return {
    schoolName: "Progress Intellectual Schools, Oke-Igbo",
    motto: "Godliness and Excellence",
    address: "Progress College Road, Off Surulere Street, Oke Igbo, Ondo State",
    phone: "08107385362",
    email: "info@progresschools.com",
    logoUrl: DEFAULT_SCHOOL_LOGO,
  };
};

export const getInitialReportCardLayout = (): ReportCardLayout => {
  return {
    showPassport: true,
    showLogo: true,
    showMotto: true,
    showAddress: true,
    showContactInfo: true,
    showSessionTermBar: true,
    showStudentBasicMetricGrid: true,
    showAttendance: true,
    showNextTermBegins: true,
    showTermEnded: true,
    showStudentRegNo: true,
    showClassStatistics: true,
    showPositionInClass: true,
    showPositionInSection: true,
    showOverallTotalScore: true,
    showStudentAverageScore: true,
    showClassHighestScore: true,
    showClassLowestScore: true,
    showClassAverage: true,
    showTablePreviousTerms: true,
    showTableRemarks: true,
    showTableSubjectPosition: true,
    showTableClassAverage: true,
    showTableHighestLowest: true,
    showAffectiveTraits: true,
    showPsychomotorSkills: true,
    showGradingScale: true,
    showRatingKey: true,
    showSignatureArea: true,
    showTeacherRemarks: true,
    showPrincipalRemarks: true,
    showStamp: true,
    showEmptyRows: true,

    schoolNameLabel: "",
    mottoLabel: "",
    reportTitleBarLabel: "",
    classTeacherReportLabel: "Class teacher's report",
    principalReportLabel: "Principal's report",

    themePrimaryColor: "emerald",
    layoutDensity: "normal",
    paperSize: "A4",
    useWatermark: true,
    watermarkText: "APPROVED",
  };
};

const INITIAL_CLASSES: Class[] = [
  { id: "JS 1", name: "Junior Secondary 1", section: "Junior" },
  { id: "JS 2", name: "Junior Secondary 2", section: "Junior" },
  { id: "JS 3", name: "Junior Secondary 3", section: "Junior" },
  { id: "SS 1", name: "Senior Secondary 1", section: "Senior Science" },
  { id: "SS 2", name: "Senior Secondary 2", section: "Senior Science" },
  { id: "SS 3", name: "Senior Secondary 3", section: "Senior Science" },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: "physics", name: "Physics", code: "PHY" },
  { id: "math", name: "Mathematics", code: "MTH" },
  { id: "geo", name: "Geography", code: "GEO" },
  { id: "fmath", name: "Further Mathematics", code: "FMT" },
  { id: "eng", name: "English Language", code: "ENG" },
  { id: "citizenship", name: "Citizenship & Heritage Studies", code: "CHS" },
  { id: "chem", name: "Chemistry", code: "CHM" },
  { id: "bio", name: "Biology", code: "BIO" },
];

const INITIAL_TEACHERS: Teacher[] = [
  { id: "teach_seyi", fullName: "Mr. Seyi Adewole", username: "seyiadewole@progressintellectual.edu.ng", subjectIds: ["physics", "fmath"] },
  { id: "teach_temi", fullName: "Mrs. Temitope Sangonuga", username: "temitopesangonuga@progressintellectual.edu.ng", subjectIds: ["math", "chem"] },
  { id: "teach_biodun", fullName: "Mr. Abiodun Oke", username: "abiodunoke@progressintellectual.edu.ng", subjectIds: ["geo", "citizenship"] },
  { id: "teach_alicia", fullName: "Miss Alicia Benson", username: "aliciabenson@progressintellectual.edu.ng", subjectIds: ["eng", "bio"] },
];

export const getInitialDatabase = (): Database => {
  const session = "2025/2026";
  const term = "Term2";
  
  const admins: Admin[] = [
    { id: "admin_super", fullName: "Super Admin", username: "admin", password: "password", role: "super_admin" }
  ];

  // Create the primary student matching the report card exactly
  const primaryStudent: Student = {
    id: "stud_rukayat",
    fullName: "OJO OLUWASEYIFUNMI RUKAYAT",
    username: "ojooluwaseyifunmirukayat@progressintellectual.edu.ng",
    regNo: "1084/539482",
    classId: "SS 2",
    passportUrl: DEFAULT_STUDENT_AVATAR,
    session: session,
    term: term,
    nextTermBegins: "2026-04-27",
    termEnded: "2026-07-24",
    daysSchoolOpened: 118,
    daysPresent: 107,
    daysAbsent: 11,
    classTeacherReport: "SEYI LOVES TO BE CORRECTED AND SHE ALWAYS TAKES TO CORRECTION",
    principalReport: "SUPERB ACHIEVEMENT! CONTINUE TO INSPIRE OTHERS.",
  };

  // Generate scores for RUKAYAT (should match the table)
  // Physics: Test1 (20) + Test2 (18.5) + Exam (59) = 97.5 (2nd Term). 1st Term = 85. Total = 182.5
  // Math: Test1 (20) + Test2 (18) + Exam (57) = 95 (2nd Term). 1st Term = 86.5. Total = 181.5
  // Geography: Test1 (20) + Test2 (20) + Exam (60) = 100 (2nd Term). 1st Term = 90.5. Total = 190.5
  // Further Math: Test1 (20) + Test2 (20) + Exam (59) = 99 (2nd Term). 1st Term = 91.5. Total = 190.5
  // English: Test1 (20) + Test2 (20) + Exam (46) = 86 (2nd Term). 1st Term = 78.5. Total = 164.5
  // Citizenship: Test1 (20) + Test2 (16.5) + Exam (60) = 96.5 (2nd Term). 1st Term = 91.5. Total = 188
  // Chemistry: Test1 (20) + Test2 (20) + Exam (54) = 94 (2nd Term). 1st Term = 86. Total = 180
  // Biology: Test1 (20) + Test2 (20) + Exam (57) = 97 (2nd Term). 1st Term = 95.5. Total = 192.5
  const primaryScores: Score[] = [
    { studentId: "stud_rukayat", subjectId: "physics", session, term, test1: 20, test2: 18.5, exam: 59, firstTerm: 85, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "math", session, term, test1: 20, test2: 18, exam: 57, firstTerm: 86.5, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "geo", session, term, test1: 20, test2: 20, exam: 60, firstTerm: 90.5, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "fmath", session, term, test1: 20, test2: 20, exam: 59, firstTerm: 91.5, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "eng", session, term, test1: 20, test2: 20, exam: 46, firstTerm: 78.5, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "citizenship", session, term, test1: 20, test2: 16.5, exam: 60, firstTerm: 91.5, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "chem", session, term, test1: 20, test2: 20, exam: 54, firstTerm: 86, secondTerm: 0 },
    { studentId: "stud_rukayat", subjectId: "bio", session, term, test1: 20, test2: 20, exam: 57, firstTerm: 95.5, secondTerm: 0 },
  ];

  const primaryAffective: AffectiveTraits = {
    studentId: "stud_rukayat",
    session,
    term,
    punctuality: 4,
    mentalAlertness: 4,
    behaviour: 5,
    reliability: 5,
    attentiveness: 5,
    respect: 5,
    neatness: 4,
    politeness: 5,
    honesty: 5,
    relationshipWithStaff: 4,
    relationshipWithStudents: 4,
    attitudeToSchool: 5,
    selfControl: 5,
  };

  const primaryPsychomotor: PsychomotorSkills = {
    studentId: "stud_rukayat",
    session,
    term,
    spiritOfTeamwork: 4,
    initiatives: 4,
    organizationalAbility: 3,
    handwriting: 3,
    reading: 4,
    verbalFluencyDiction: 3,
    musicalSkills: 2,
    creativeArts: 3,
    physicalEducation: 1,
    generalReasoning: 4,
  };

  // Let's create another 64 mock students in SS2 to satisfy the details (65 students in entire class).
  // This will allow ranking and highest/lowest score calculations to match the statistics perfectly.
  // We'll give these students random but realistic scores that aggregate to an overall class average of 56.06 (out of 100, or 112.12 out of 200).
  // Wait, let's look at the image again: "No of students in class: 65", "No of students in class section: 65".
  // "Class section average score: 56.06" -> wait, is this out of 100? Yes, standard average percentages!
  // "Lowest average in class section: 31.6" (which corresponds to 31.6% average score, or 63.2/200 total).
  // "Highest average in class section: 91.88" (which corresponds to Rukayat's 1470/1600 = 91.875%).
  // Let's generate these mock students!
  const mockStudents: Student[] = [];
  const mockScores: Score[] = [];
  const mockAffectives: AffectiveTraits[] = [];
  const mockPsychomotors: PsychomotorSkills[] = [];

  const NamesList = [
    "Adebayo Babajide", "Salami Oluwaseun", "Oshodi Temitope", "Alao Kehinde", "Lawal Taiwo",
    "Balogun Tunde", "Okeke Chukwuemeka", "Nwachukwu Chioma", "Ubah Emeka", "Eze Ngozi",
    "Ibrahim Musa", "Garba Usman", "Abubakar Amina", "Bello Aisha", "Yusuf Fatima",
    "Fadeyi Sunday", "Akinyemi Gabriel", "Sanni Kunle", "Afolabi Funke", "Oyinlola Gboyega",
    "Ajayi Christianah", "Fagbemi James", "Oni Yemi", "Folarin Victoria", "Daramola Segun",
    "Olawale David", "Odugbemi Daniel", "Popoola Blessing", "Adewale Grace", "Jimoh Bashiru",
    "Amadi Chidi", "Nwosu Chinedu", "Okon Bassey", "Effiong Anietie", "Akpan Iniobong",
    "Salako Rasheed", "Adesina Kazeem", "Sowemimo Dele", "Adekoya Funmi", "Bakare Ganiyu",
    "Raji Saheed", "Mustapha Idris", "Olatunji Kolawole", "Olawuyi Samuel", "Adeniyi Esther",
    "Fashola Gbolahan", "Oyeneyin Biodun", "Folayan Festus", "Kuponiyi Joseph", "Awosika Nike",
    "Adebolu Sunday", "Longe Femi", "Osinubi Gbenga", "Aleshinloye Sola", "Olukoya Toyin",
    "Oduwole Jumoke", "Adebisi Mary", "Suleiman Ibrahim", "Okafor Ifeanyi", "Chukwuma Nonso",
    "Nnaji Chijioke", "Egwuonwu Ifeoma", "Mbachu Ugochi", "Nwankwo Kingsley"
  ];

  // We need 64 mock students
  for (let i = 0; i < 64; i++) {
    const id = `stud_mock_${i}`;
    const name = NamesList[i] ? NamesList[i].toUpperCase() : `MOCK STUDENT ${i + 1}`;
    const regNum = `1084/${500000 + i}`;
    
    mockStudents.push({
      id,
      fullName: name,
      username: generateUsername(name),
      regNo: regNum,
      classId: "SS 2",
      passportUrl: DEFAULT_STUDENT_AVATAR,
      session: session,
      term: term,
      nextTermBegins: "2026-04-27",
      termEnded: "2026-07-24",
      daysSchoolOpened: 118,
      daysPresent: Math.floor(Math.random() * 20) + 98,
      daysAbsent: Math.floor(Math.random() * 5),
      classTeacherReport: "Good academic performance. Keep it up.",
      principalReport: "A very good result. Encourage her further.",
    });

    // We adjust their average scores depending on index to range between 31.6% and 82.0% (so Rukayat at 91.88% is highest)
    // We want the entire class average percentage to center around 56.06%.
    // To achieve that, we can space them out linearly between 31.6% and 80.0%.
    const targetPercentage = 31.6 + ((80.0 - 31.6) * i) / 63;
    // Let's generate scores for each of the 8 subjects
    INITIAL_SUBJECTS.forEach((subj) => {
      // Scale scores around the target percentage
      const randomOffset = (Math.random() - 0.5) * 12; // Some variation per subject
      const subjPercentage = Math.min(Math.max(targetPercentage + randomOffset, 5), 98);
      
      // Calculate individual scores:
      // Test 1: out of 20
      // Test 2: out of 20
      // Exam: out of 60
      // 1st Term: out of 100
      const test1 = Math.round((subjPercentage * 20) / 100);
      const test2 = Math.round((subjPercentage * 20) / 100 * 0.9);
      const exam = Math.round((subjPercentage * 60) / 100);
      const firstTerm = Math.round(subjPercentage);
      const secondTerm = Math.round(subjPercentage * 0.98);

      mockScores.push({
        studentId: id,
        subjectId: subj.id,
        session,
        term,
        test1,
        test2,
        exam,
        firstTerm,
        secondTerm,
      });
    });

    mockAffectives.push({
      studentId: id,
      session,
      term,
      punctuality: Math.floor(Math.random() * 3) + 3,
      mentalAlertness: Math.floor(Math.random() * 3) + 3,
      behaviour: Math.floor(Math.random() * 2) + 4,
      reliability: Math.floor(Math.random() * 3) + 3,
      attentiveness: Math.floor(Math.random() * 3) + 3,
      respect: Math.floor(Math.random() * 2) + 4,
      neatness: Math.floor(Math.random() * 3) + 3,
      politeness: Math.floor(Math.random() * 2) + 4,
      honesty: Math.floor(Math.random() * 2) + 4,
      relationshipWithStaff: Math.floor(Math.random() * 3) + 3,
      relationshipWithStudents: Math.floor(Math.random() * 3) + 3,
      attitudeToSchool: Math.floor(Math.random() * 3) + 3,
      selfControl: Math.floor(Math.random() * 3) + 3,
    });

    mockPsychomotors.push({
      studentId: id,
      session,
      term,
      spiritOfTeamwork: Math.floor(Math.random() * 3) + 3,
      initiatives: Math.floor(Math.random() * 3) + 3,
      organizationalAbility: Math.floor(Math.random() * 3) + 3,
      handwriting: Math.floor(Math.random() * 3) + 3,
      reading: Math.floor(Math.random() * 3) + 3,
      verbalFluencyDiction: Math.floor(Math.random() * 3) + 3,
      musicalSkills: Math.floor(Math.random() * 4) + 1,
      creativeArts: Math.floor(Math.random() * 3) + 3,
      physicalEducation: Math.floor(Math.random() * 4) + 1,
      generalReasoning: Math.floor(Math.random() * 3) + 3,
    });
  }

  // Create standard subject assignments for classes and teachers
  const subjectAssignments: SubjectAssignment[] = [];
  INITIAL_CLASSES.forEach((cls) => {
    INITIAL_SUBJECTS.forEach((subj) => {
      // Assign physical/fmath to seyi, math/chem to temi, geo/citizenship to biodun, eng/bio to alicia
      let teacherId = "teach_alicia";
      if (subj.id === "physics" || subj.id === "fmath") teacherId = "teach_seyi";
      else if (subj.id === "math" || subj.id === "chem") teacherId = "teach_temi";
      else if (subj.id === "geo" || subj.id === "citizenship") teacherId = "teach_biodun";

      subjectAssignments.push({
        id: `sa_${cls.id}_${subj.id}`,
        classId: cls.id,
        subjectId: subj.id,
        teacherId,
      });
    });
  });

  // Assign class teachers: Seyi Adewole is class teacher for SS 2
  const classTeacherAssignments: ClassTeacherAssignment[] = [
    { id: "cta_ss2", classId: "SS 2", teacherId: "teach_seyi" },
    { id: "cta_ss1", classId: "SS 1", teacherId: "teach_temi" },
    { id: "cta_ss3", classId: "SS 3", teacherId: "teach_biodun" },
  ];

  return {
    admins,
    students: [primaryStudent, ...mockStudents],
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    teachers: INITIAL_TEACHERS,
    scores: [...primaryScores, ...mockScores],
    affectiveTraits: [primaryAffective, ...mockAffectives],
    psychomotorSkills: [primaryPsychomotor, ...mockPsychomotors],
    subjectAssignments,
    classTeacherAssignments,
    sessions: ["2025/2026", "2026/2027"],
    terms: ["Term1", "Term2", "Term3"],
    schoolSettings: getInitialSchoolSettings(),
    reportCardLayout: getInitialReportCardLayout(),
  };
};

export const getDatabase = (): Database => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.schoolSettings) {
        parsed.schoolSettings = getInitialSchoolSettings();
        saveDatabase(parsed);
      }
      if (!parsed.reportCardLayout) {
        parsed.reportCardLayout = getInitialReportCardLayout();
        saveDatabase(parsed);
      }
      if (!parsed.admins) {
        parsed.admins = [
          { id: "admin_super", fullName: "Super Admin", username: "admin", password: "password", role: "super_admin" }
        ];
        saveDatabase(parsed);
      }
      // Ensure existing scores have secondTerm property
      parsed.scores = parsed.scores.map((sc: any) => ({
        ...sc,
        secondTerm: sc.secondTerm !== undefined ? sc.secondTerm : 0,
      }));
      return parsed as Database;
    } catch (e) {
      console.error("Error parsing database, re-seeding", e);
    }
  }
  const seeded = getInitialDatabase();
  saveDatabase(seeded);
  return seeded;
};

export const saveDatabase = (db: Database) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};
