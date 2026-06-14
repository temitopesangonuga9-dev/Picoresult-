import React, { useState, useEffect, useRef } from "react";
import { Student } from "../types";
import { Database, DEFAULT_STUDENT_AVATAR } from "../data";
import { computeStudentReport, computeClassOverview, getRemarkColor, getScoreComponents } from "../utils";
import { Printer, MapPin, Phone, Mail, Loader2, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function oklchToRgb(l_val: number, c_val: number, h_val: number, a_val: number | string = 1): string {
  // Convert Hue from degrees to radians
  const h_rad = (h_val * Math.PI) / 180;
  const oka = c_val * Math.cos(h_rad);
  const okb = c_val * Math.sin(h_rad);

  const l_ = l_val + 0.3963377774 * oka + 0.2158037573 * okb;
  const m_ = l_val - 0.1055613458 * oka - 0.0638541728 * okb;
  const s_ = l_val - 0.0894841775 * oka - 1.291485548 * okb;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r_lin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSRGB = (c: number) => {
    return c <= 0.0031308
      ? 12.92 * c
      : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r_final = Math.round(Math.max(0, Math.min(1, toSRGB(r_lin))) * 255);
  const g_final = Math.round(Math.max(0, Math.min(1, toSRGB(g_lin))) * 255);
  const b_final = Math.round(Math.max(0, Math.min(1, toSRGB(b_lin))) * 255);

  if (a_val === 1 || a_val === "1") {
    return `rgb(${r_final}, ${g_final}, ${b_final})`;
  } else {
    return `rgba(${r_final}, ${g_final}, ${b_final}, ${a_val})`;
  }
}

function convertOklchColorExprToRgb(innerContent: string): string {
  try {
    const parts = innerContent.split("/");
    const colorPart = parts[0].trim();
    const opacityPart = parts[1] ? parts[1].trim() : "1";

    let alpha: number | string = 1;
    if (opacityPart.includes("var(")) {
      const match = opacityPart.match(/,\s*([0-9.]+)\s*\)/);
      if (match) {
        alpha = match[1];
      }
    } else {
      alpha = parseFloat(opacityPart);
      if (isNaN(alpha)) alpha = 1;
    }

    const colorParts = colorPart.split(/\s+/);
    if (colorParts.length < 3) return "rgba(0, 0, 0, 1)";

    const L_str = colorParts[0];
    const C_str = colorParts[1];
    const H_str = colorParts[2];

    if (L_str.includes("var(") || C_str.includes("var(") || H_str.includes("var(")) {
      return `rgba(100, 116, 139, ${alpha})`;
    }

    const L = L_str.endsWith("%") ? parseFloat(L_str) / 100 : parseFloat(L_str);
    const C = C_str.endsWith("%") ? parseFloat(C_str) / 100 : parseFloat(C_str);
    const H = parseFloat(H_str);

    return oklchToRgb(L, C, H, alpha);
  } catch (err) {
    return "rgba(0, 0, 0, 1)";
  }
}

function replaceOklchInString(cssText: string): string {
  let index = 0;
  while (true) {
    const oklchIndex = cssText.indexOf("oklch(", index);
    if (oklchIndex === -1) break;

    let parenCount = 1;
    let i = oklchIndex + 6;
    for (; i < cssText.length; i++) {
      if (cssText[i] === "(") parenCount++;
      else if (cssText[i] === ")") {
        parenCount--;
        if (parenCount === 0) {
          break;
        }
      }
    }

    if (parenCount !== 0) {
      index = oklchIndex + 6;
      continue;
    }

    const innerContent = cssText.substring(oklchIndex + 6, i);
    const rgbReplacement = convertOklchColorExprToRgb(innerContent);

    cssText = cssText.substring(0, oklchIndex) + rgbReplacement + cssText.substring(i + 1);
    index = oklchIndex + rgbReplacement.length;
  }
  return cssText;
}

interface ReportCardProps {
  studentId: string;
  session: string;
  term: string;
  db: Database;
  onBack?: () => void;
  hideControls?: boolean;
}

export default function ReportCard({ studentId, session, term, db, onBack, hideControls = false }: ReportCardProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth;
      // An A4 layout is defined as ~210mm wide which is 794px.
      // We scale it down with a safe cushion if the width is less than 810px.
      const targetWidth = 810;
      if (parentWidth > 50 && parentWidth < targetWidth) {
        setScale(parentWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    handleResize();
    const timer = setTimeout(handleResize, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Compute report statistics
  const { student, stats, subjectsReport } = computeStudentReport(studentId, session, term, db);
  const classOverview = computeClassOverview(student.classId, session, term, db);

  // Retrieve affective and psychomotor for this student
  const affective = db.affectiveTraits.find(
    (a) => a.studentId === studentId && a.session === session && a.term === term
  ) || {
    punctuality: 5, mentalAlertness: 5, behaviour: 5, reliability: 5, attentiveness: 5,
    respect: 5, neatness: 5, politeness: 5, honesty: 5, relationshipWithStaff: 5,
    relationshipWithStudents: 5, attitudeToSchool: 5, selfControl: 5
  };

  const psychomotor = db.psychomotorSkills.find(
    (p) => p.studentId === studentId && p.session === session && p.term === term
  ) || {
    spiritOfTeamwork: 5, initiatives: 5, organizationalAbility: 5, handwriting: 4,
    reading: 5, verbalFluencyDiction: 4, musicalSkills: 3, creativeArts: 4,
    physicalEducation: 4, generalReasoning: 5
  };

  // Safe layout settings lookup (fallback to default)
  const layout = db.reportCardLayout || {
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
    themePrimaryColor: "emerald" as const,
    layoutDensity: "normal" as const,
    paperSize: "A4" as const,
    useWatermark: true,
    watermarkText: "APPROVED",
  };

  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("data:image/svg+xml")) {
      if (url.includes(";base64,")) {
        return url;
      }
      try {
        let rawContent = "";
        if (url.includes(";utf8,")) {
          rawContent = url.substring(url.indexOf(";utf8,") + 6);
        } else if (url.includes(",")) {
          rawContent = url.substring(url.indexOf(",") + 1);
        } else {
          return url;
        }

        const decodedSvg = decodeURIComponent(rawContent);
        const base64 = btoa(unescape(encodeURIComponent(decodedSvg)));
        return "data:image/svg+xml;base64," + base64;
      } catch (e) {
        console.error("SVG conversion error:", e);
        return url;
      }
    }
    return url;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById(`report-sheeting-root-${studentId}`);
    if (!element) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced from 2.5 to prevent memory/allocation errors on mobile devices
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 810, // Anchor the layout dimension to standard desktop width before scaling
        onclone: (clonedDoc) => {
          // Process all <style> elements
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (style.innerHTML && style.innerHTML.includes("oklch(")) {
              style.innerHTML = replaceOklchInString(style.innerHTML);
            }
          });

          // Process all elements with style attributes
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl) {
              const styleAttr = htmlEl.getAttribute("style");
              if (styleAttr && styleAttr.includes("oklch(")) {
                htmlEl.setAttribute("style", replaceOklchInString(styleAttr));
              }
            }
          });

          // Fix cloned A4 root layout specifically for standard 1:1 single-page screenshotting
          const clonedElement = clonedDoc.getElementById(`report-sheeting-root-${studentId}`);
          if (clonedElement) {
            clonedElement.style.transform = "none";
            clonedElement.style.margin = "0";
            clonedElement.style.width = "210mm";
            clonedElement.style.height = "297mm";
            clonedElement.style.minHeight = "297mm";
            clonedElement.style.maxHeight = "297mm";
            clonedElement.style.padding = "6mm 8mm";
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.borderRadius = "0";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Fit the crisp rendering onto a single standard A4 page (210mm x 297mm)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");

      const studentName = student.fullName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      pdf.save(`${studentName}_ReportCard_${term}_${session.replace("/", "_")}.pdf`);
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      alert(`Error generating PDF file: ${error?.message || error?.toString()}. Please try the print option to download.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Theme primary coloring configuration
  const themeClasses = {
    emerald: {
      text: "text-emerald-900",
      bgHeader: "bg-emerald-900",
      bgTable: "bg-emerald-800",
      bgTableSub: "bg-emerald-50",
      border: "border-emerald-800",
      borderTable: "border-emerald-900",
      borderTableDeep: "border-emerald-950",
      accent: "text-amber-600",
      badge: "border-emerald-800 bg-emerald-50 text-emerald-800",
    },
    blue: {
      text: "text-blue-900",
      bgHeader: "bg-blue-900",
      bgTable: "bg-blue-800",
      bgTableSub: "bg-blue-50",
      border: "border-blue-800",
      borderTable: "border-blue-905",
      borderTableDeep: "border-blue-950",
      accent: "text-amber-600",
      badge: "border-blue-800 bg-blue-50 text-blue-800",
    },
    indigo: {
      text: "text-indigo-900",
      bgHeader: "bg-indigo-900",
      bgTable: "bg-indigo-800",
      bgTableSub: "bg-indigo-50",
      border: "border-indigo-800",
      borderTable: "border-indigo-900",
      borderTableDeep: "border-indigo-950",
      accent: "text-amber-600",
      badge: "border-indigo-800 bg-indigo-50 text-indigo-800",
    },
    amber: {
      text: "text-amber-950",
      bgHeader: "bg-amber-800",
      bgTable: "bg-amber-800",
      bgTableSub: "bg-amber-50",
      border: "border-amber-800",
      borderTable: "border-amber-900",
      borderTableDeep: "border-amber-950",
      accent: "text-amber-700",
      badge: "border-amber-800 bg-amber-50 text-amber-900",
    },
    rose: {
      text: "text-rose-950",
      bgHeader: "bg-rose-950",
      bgTable: "bg-rose-900",
      bgTableSub: "bg-rose-50",
      border: "border-rose-900",
      borderTable: "border-rose-950",
      borderTableDeep: "border-rose-950",
      accent: "text-emerald-700",
      badge: "border-rose-950 bg-rose-50 text-rose-900",
    },
    slate: {
      text: "text-slate-900",
      bgHeader: "bg-slate-800",
      bgTable: "bg-slate-700",
      bgTableSub: "bg-slate-50",
      border: "border-slate-800",
      borderTable: "border-slate-900",
      borderTableDeep: "border-slate-950",
      accent: "text-amber-600",
      badge: "border-slate-800 bg-slate-50 text-slate-800",
    },
    charcoal: {
      text: "text-neutral-900",
      bgHeader: "bg-neutral-900",
      bgTable: "bg-neutral-800",
      bgTableSub: "bg-neutral-100",
      border: "border-neutral-900",
      borderTable: "border-neutral-900",
      borderTableDeep: "border-neutral-950",
      accent: "text-amber-600",
      badge: "border-neutral-900 bg-neutral-100 text-neutral-800",
    }
  }[layout.themePrimaryColor || "emerald"];

  // Mapping density modifiers
  const density = {
    compact: {
      tblPad: "py-[2px] px-[4px] text-[8px]",
      tblText: "text-[8px] uppercase",
      secGap: "gap-1 mb-1 print:mb-0",
      boxPad: "p-2 print:p-1",
      genMargin: "mb-1 print:mb-0",
      fontHeading: "text-lg",
      heightClass: "min-h-0",
      innerGap: "space-y-0.5 text-[9px]",
    },
    normal: {
      tblPad: "py-[2px] px-[4px] text-[9px]",
      tblText: "text-[9px] uppercase",
      secGap: "gap-2 mb-2 print:mb-1",
      boxPad: "p-2 print:p-1",
      genMargin: "mb-2 print:mb-1",
      fontHeading: "text-xl",
      heightClass: "min-h-screen print:min-h-0",
      innerGap: "space-y-1 text-[10px]",
    },
    relaxed: {
      tblPad: "py-[4px] px-[4px] text-[10px]",
      tblText: "text-[10px] uppercase",
      secGap: "gap-4 mb-4 print:mb-2",
      boxPad: "p-3 print:p-2",
      genMargin: "mb-4 print:mb-2",
      fontHeading: "text-2xl",
      heightClass: "min-h-screen print:min-h-0",
      innerGap: "space-y-1 text-[11px]",
    }
  }[layout.layoutDensity || "normal"];

  const getReadableTerm = (t: string) => {
    if (t === "Term1") return "1st";
    if (t === "Term2") return "2nd";
    if (t === "Term3") return "3rd";
    return t;
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).replace(/ /g, "-");
    } catch {
      return dateStr;
    }
  };

  // Determine standard grid columns layout based on visible secondary blocks
  const botSectCount = (layout.showAffectiveTraits ? 1 : 0) + (layout.showPsychomotorSkills ? 1 : 0) + 1;
  const bottomGridStyle = botSectCount === 3 
    ? "grid-cols-1 md:grid-cols-3 print:grid-cols-3 items-stretch print:items-start" 
    : botSectCount === 2 
    ? "grid-cols-1 md:grid-cols-2 print:grid-cols-2 items-stretch print:items-start" 
    : "grid-cols-1 items-stretch print:items-start";

  return (
    <div className={hideControls ? "w-full max-w-5xl mx-auto p-0 bg-white printable-area" : `w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-50 ${density.heightClass} printable-area`}>
      {/* Control Panel (Hidden during printing) */}
      {!hideControls && (
        <div className="mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-200 pb-5 print:hidden">
          <div>
            <button
              onClick={onBack}
              className="w-full md:w-auto text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-gray-300 px-4 py-2 rounded-lg transition text-center"
              id="btn_back_to_portal"
            >
              &larr; Back to Portal
            </button>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={isGeneratingPdf}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer text-xs"
                id="btn_print_report"
              >
                <Printer size={16} />
                Print Report Sheet
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer text-xs min-w-[150px]"
                id="btn_download_pdf"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PDF (A4)
                  </>
                )}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold md:text-right">
              💡 Tip: Use <b>Download PDF</b> for high-fidelity direct file saving, or <b>Print</b> to print physically.
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Sheet Container Wrapper */}
      <div 
        ref={containerRef}
        className="w-full flex justify-center overflow-x-hidden py-2 print:py-0 print:overflow-visible"
      >
        <div 
          id={`report-sheeting-root-${studentId}`}
          className={`bg-white text-slate-900 border-2 ${themeClasses.border} a4-page-layout leading-tight select-text text-xs tracking-tight relative overflow-hidden`}
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
            marginBottom: scale < 1 ? `calc((297mm * ${scale}) - 297mm)` : undefined,
          }}
        >
        
        {/* Dynamic Watermark Overlay */}
        {layout.useWatermark && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0 overflow-hidden">
            <span className="text-[100px] font-black tracking-widest uppercase transform -rotate-30 border-8 border-slate-900 p-6 rounded-3xl">
              {layout.watermarkText || "APPROVED"}
            </span>
          </div>
        )}

        <div className="relative z-10 space-y-3">
          
          {/* HEADER SECTION */}
          {(layout.showLogo || layout.showMotto || layout.showAddress || layout.showContactInfo || layout.showPassport) && (
            <div className={`border-b-4 ${themeClasses.border} pb-4 mb-3`}>
              <div className="flex flex-row justify-between items-start gap-4">
                
                {/* School Logo */}
                {layout.showLogo && (
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className={`w-24 h-24 border-2 ${themeClasses.border} rounded-lg p-1 flex items-center justify-center relative bg-white`}>
                      <img
                        src={getSafeImageUrl(db.schoolSettings.logoUrl)}
                        alt="School Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                )}

                {/* School Details */}
                <div className="flex-1 text-left">
                  <h1 className={`text-[1.25rem] font-black ${themeClasses.text} tracking-tight leading-none uppercase`}>
                    {layout.schoolNameLabel || db.schoolSettings.schoolName}
                  </h1>
                  
                  {layout.showMotto && (
                    <p className={`text-[12px] font-semibold italic ${themeClasses.accent} mt-1`}>
                      Motto: {layout.mottoLabel || db.schoolSettings.motto}
                    </p>
                  )}
                  
                  <div className="mt-2 text-[11px] space-y-1 text-slate-700">
                    {layout.showAddress && (
                      <p className="flex items-center justify-start gap-1">
                        <MapPin size={11} className={`${themeClasses.text} shrink-0`} />
                        <span className="font-semibold">Address:</span> {db.schoolSettings.address}
                      </p>
                    )}
                    
                    {layout.showContactInfo && (
                      <div className="flex flex-wrap justify-start gap-x-4 gap-y-1">
                        <p className="flex items-center gap-1">
                          <Phone size={11} className={`${themeClasses.text} shrink-0`} />
                          <span className="font-semibold">Phone No:</span> {db.schoolSettings.phone}
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail size={11} className={`${themeClasses.text} shrink-0`} />
                          <span className="font-semibold">Email:</span> {db.schoolSettings.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Passport */}
                {layout.showPassport && (
                  <div className="flex-shrink-0">
                    <div className={`w-24 h-24 border-2 ${themeClasses.border} rounded bg-slate-100 overflow-hidden shadow-sm relative`}>
                      <img
                        src={getSafeImageUrl(student.passportUrl || DEFAULT_STUDENT_AVATAR)}
                        alt={student.fullName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* REPORT TITLE BAR */}
          {layout.showSessionTermBar && (
            <div className={`${themeClasses.bgHeader} text-white text-center font-extrabold uppercase py-2 text-[13px] tracking-widest rounded ${density.genMargin} animate-fade-in shadow-xs`}>
              {layout.reportTitleBarLabel || `${getReadableTerm(term)} TERM CUMULATIVE REPORT ${session}`}
            </div>
          )}

          {/* STUDENT DETAIL GRID */}
          {layout.showStudentBasicMetricGrid && (
            <div className={`border border-slate-300 rounded overflow-hidden grid grid-cols-4 divide-x divide-slate-300 ${density.genMargin} bg-slate-50 uppercase text-[11px]`}>
              <div className="p-2 space-y-1 text-slate-800">
                <p><span className="font-bold text-slate-500">Session:</span> <span className="font-extrabold text-slate-900">{session}/{term}</span></p>
                <p><span className="font-bold text-slate-500">Name of student:</span> <span className="font-black text-slate-950">{student.fullName}</span></p>
                <p><span className="font-bold text-slate-500">Class:</span> <span className="font-extrabold text-slate-900">{student.classId}</span></p>
              </div>
              <div className="p-2 space-y-1 text-slate-800">
                <p><span className="font-bold text-slate-500">Term:</span> <span className="font-extrabold text-slate-900">{getReadableTerm(term)}</span></p>
                {layout.showStudentRegNo !== false && (
                  <p><span className="font-bold text-slate-500">Reg. No:</span> <span className="font-extrabold text-slate-900">{student.regNo}</span></p>
                )}
                {layout.showNextTermBegins !== false && (
                  <p><span className="font-bold text-slate-500">Next term begins:</span> <span className="font-bold text-slate-900">{formatDateStr(student.nextTermBegins)}</span></p>
                )}
              </div>
              <div className="p-2 col-span-2 space-y-1 text-slate-800 bg-slate-50">
                {layout.showTermEnded !== false && (
                  <p><span className="font-bold text-slate-500">Term ended:</span> <span className="font-bold text-slate-900">{formatDateStr(student.termEnded)}</span></p>
                )}
                {layout.showAttendance !== false && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-205">
                    <div className="text-center">
                      <span className="block text-[8px] text-slate-500 font-bold leading-none">Days Opened</span>
                      <span className={`text-[11px] font-black ${themeClasses.text}`}>{student.daysSchoolOpened}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] text-slate-500 font-bold leading-none">Days Present</span>
                      <span className={`text-[11px] font-black ${themeClasses.text}`}>{student.daysPresent}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] text-slate-500 font-bold leading-none">Days Absent</span>
                      <span className="text-[11px] font-black text-red-650">{student.daysAbsent}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CLASS PERFORMANCE STATS */}
          {layout.showClassStatistics && (
            <div className={`grid grid-cols-2 ${density.secGap} uppercase text-[11px]`}>
              <div className={`border ${themeClasses.border} rounded p-2 space-y-1.5 bg-slate-50/40`}>
                {layout.showPositionInClass !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Position in entire class:</span>
                    <span className={`font-black ${themeClasses.text} text-xs`}>{stats.classRankStr}</span>
                  </div>
                )}
                {layout.showPositionInSection !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Position in class section:</span>
                    <span className="font-bold text-slate-900">{stats.classRankStr}</span>
                  </div>
                )}
                {layout.showOverallTotalScore !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Overall total score:</span>
                    <span className="font-bold text-slate-900">{stats.totalScore}</span>
                  </div>
                )}
                {layout.showStudentAverageScore !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Student&apos;s average score %:</span>
                    <span className={`font-black ${themeClasses.text} text-xs`}>{stats.averageScore}%</span>
                  </div>
                )}
                {layout.showClassHighestScore !== false && (
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-600">Highest average in class section:</span>
                    <span className="font-bold text-slate-900">{classOverview.highestAverage}%</span>
                  </div>
                )}
              </div>

              <div className={`border ${themeClasses.border} rounded p-2 space-y-1.5 bg-slate-50/40`}>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="font-bold text-slate-600">No. of students in class:</span>
                  <span className="font-bold text-slate-900">{stats.classSize}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="font-bold text-slate-600">No. of students in class section:</span>
                  <span className="font-bold text-slate-900">{stats.classSize}</span>
                </div>
                {layout.showClassAverage !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Class section average score %:</span>
                    <span className="font-bold text-slate-900">{classOverview.classAverage}%</span>
                  </div>
                )}
                {layout.showClassLowestScore !== false && (
                  <div className="flex justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-bold text-slate-600">Lowest average in class section:</span>
                    <span className="font-bold text-red-650">{classOverview.lowestAverage}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Overall Performance:</span>
                  <span className="font-black text-rose-700 text-xs">{stats.overallPerformance}</span>
                </div>
              </div>
            </div>
          )}

          {/* RESULTS SUBJECTS SCORE TABLE */}
          <div className={`border-2 ${themeClasses.borderTable} rounded overflow-x-auto ${density.genMargin} bg-white shadow-xs`}>
            <table className="w-full text-center border-collapse text-[10px] uppercase font-semibold leading-none">
              <thead>
                <tr className={`${themeClasses.bgHeader} text-white font-extrabold text-[10px] divide-x ${themeClasses.borderTableDeep} border-b ${themeClasses.borderTableDeep}`}>
                  <th className={`${density.tblPad} text-left w-1/4`}>SUBJECT</th>
                  {getScoreComponents(db).map(comp => (
                    <th key={comp.id} className={`${density.tblPad} text-center font-bold`}>{comp.name.toUpperCase()}<br/><span className="text-[8px] font-medium text-slate-100">({comp.maxMark})</span></th>
                  ))}
                  {layout.showTablePreviousTerms !== false && term === "Term2" && (
                    <th className={`${density.tblPad} text-center font-bold`}>1ST TERM<br/><span className="text-[8px] font-medium text-slate-100">({getScoreComponents(db).reduce((a, b) => a + b.maxMark, 0)})</span></th>
                  )}
                  {layout.showTablePreviousTerms !== false && term === "Term3" && (
                    <>
                      <th className={`${density.tblPad} text-center font-bold`}>1ST TERM<br/><span className="text-[8px] font-medium text-slate-100">({getScoreComponents(db).reduce((a, b) => a + b.maxMark, 0)})</span></th>
                      <th className={`${density.tblPad} text-center font-bold`}>2ND TERM<br/><span className="text-[8px] font-medium text-slate-100">({getScoreComponents(db).reduce((a, b) => a + b.maxMark, 0)})</span></th>
                    </>
                  )}
                  <th className={`${density.tblPad} text-center font-bold bg-neutral-900/50`}>TOTAL<br/><span className="text-[8px] font-medium text-slate-100">({getScoreComponents(db).reduce((a, b) => a + b.maxMark, 0) * (layout.showTablePreviousTerms !== false ? (term === 'Term1' ? 1 : term === 'Term2' ? 2 : 3) : 1)})</span></th>
                  <th className={`${density.tblPad} font-bold`}>GRADE</th>
                  {layout.showTableSubjectPosition !== false && <th className={`${density.tblPad} font-bold leading-tight`}>SUBJ<br/>POSITION</th>}
                  {layout.showTableClassAverage !== false && <th className={`${density.tblPad} font-bold leading-tight`}>CLASS<br/>AVG</th>}
                  {layout.showTableHighestLowest !== false && <th className={`${density.tblPad} font-bold leading-tight`}>HIGHEST<br/>SCORE</th>}
                  {layout.showTableHighestLowest !== false && <th className={`${density.tblPad} font-bold leading-tight`}>LOWEST<br/>SCORE</th>}
                  {layout.showTableRemarks !== false && <th className={`${density.tblPad} text-center w-24`}>REMARK</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectsReport.map((sr, idx) => (
                  <tr
                    key={sr.subjectId}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100/50 divide-x divide-slate-150`}
                  >
                    <td className={`${density.tblPad} text-left font-bold text-slate-800`}>{idx + 1}. {sr.subjectName}</td>
                    {getScoreComponents(db).map(comp => {
                      const val = comp.id === 'test1' ? sr.rawScore.test1 : comp.id === 'test2' ? sr.rawScore.test2 : comp.id === 'exam' ? sr.rawScore.exam : sr.rawScore.customScores?.[comp.id];
                      return (
                        <td key={comp.id} className={`${density.tblPad} font-medium text-slate-700`}>{val !== undefined && val !== null ? val : "-"}</td>
                      );
                    })}
                    {layout.showTablePreviousTerms !== false && term === "Term2" && (
                      <td className={`${density.tblPad} font-medium text-slate-650`}>{sr.firstTerm}</td>
                    )}
                    {layout.showTablePreviousTerms !== false && term === "Term3" && (
                      <>
                        <td className={`${density.tblPad} font-medium text-slate-650`}>{sr.firstTerm}</td>
                        <td className={`${density.tblPad} font-medium text-slate-650`}>{sr.rawScore.secondTerm || 0}</td>
                      </>
                    )}
                    <td className={`${density.tblPad} font-extrabold text-neutral-900 bg-slate-100/60 font-semibold text-center`}>{sr.total}</td>
                    <td className={`${density.tblPad} font-black text-red-700 text-center`}>{sr.grade}</td>
                    {layout.showTableSubjectPosition !== false && <td className={`${density.tblPad} font-bold text-slate-800`}>{sr.positionStr}</td>}
                    {layout.showTableClassAverage !== false && <td className={`${density.tblPad} font-medium text-slate-500`}>{sr.classAverage}</td>}
                    {layout.showTableHighestLowest !== false && <td className={`${density.tblPad} font-bold text-emerald-850`}>{sr.highestInClass}</td>}
                    {layout.showTableHighestLowest !== false && <td className={`${density.tblPad} font-medium text-slate-400`}>{sr.lowestInClass}</td>}
                    {layout.showTableRemarks !== false && <td className={`${density.tblPad} text-center py-0.5 px-1`}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getRemarkColor(sr.grade)}`}>
                        {sr.remark}
                      </span>
                    </td>}
                  </tr>
                ))}
                
                {/* Pad grid with clean empty rows for aesthetics */}
                {layout.showEmptyRows && subjectsReport.length < 6 &&
                  Array.from({ length: 6 - subjectsReport.length }).map((_, i) => (
                    <tr key={`empty_${i}`} className="bg-white divide-x divide-slate-100 h-5">
                      <td className={`${density.tblPad} text-left text-slate-300`}>{subjectsReport.length + i + 1}. </td>
                      {getScoreComponents(db).map(c => <td key={c.id} className={density.tblPad}></td>)}
                      {layout.showTablePreviousTerms !== false && term === "Term2" && <td className={density.tblPad}></td>}
                      {layout.showTablePreviousTerms !== false && term === "Term3" && (
                        <>
                          <td className={density.tblPad}></td>
                          <td className={density.tblPad}></td>
                        </>
                      )}
                      <td className={`${density.tblPad} bg-slate-50/20`}></td>
                      <td className={density.tblPad}></td>
                      {layout.showTableSubjectPosition !== false && <td className={density.tblPad}></td>}
                      {layout.showTableClassAverage !== false && <td className={density.tblPad}></td>}
                      {layout.showTableHighestLowest !== false && <td className={density.tblPad}></td>}
                      {layout.showTableHighestLowest !== false && <td className={density.tblPad}></td>}
                      {layout.showTableRemarks !== false && <td className={`${density.tblPad} px-1`}></td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* THREE-SECTION DETAILS GRID (AFFECTIVE, PSYCHOMOTOR, AND NOTES) */}
          <div className={`grid ${bottomGridStyle} ${density.secGap} uppercase`}>
            
            {/* Column 1: Affective Traits */}
            {layout.showAffectiveTraits && (
              <div className={`border ${themeClasses.border} rounded p-0 overflow-hidden bg-white text-[10px]`}>
                <div className={`${themeClasses.bgHeader} text-white text-center font-bold py-1 text-[11px]`}>
                  AFFECTIVE TRAITS
                </div>
                <table className="w-full text-left font-semibold">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-20 hover:bg-slate-50 text-slate-600">
                      <th className="py-1 px-2">TRAITS</th>
                      <th className="py-1 px-2 text-center w-12">RATING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Punctuality</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.punctuality}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Mental Alertness</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.mentalAlertness}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Behaviour</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.behaviour}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Reliability</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.reliability}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Attentiveness</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.attentiveness}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Respect</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.respect}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Neatness</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.neatness}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Politeness</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.politeness}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Honesty</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.honesty}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Staff Relationship</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.relationshipWithStaff}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Peer Relationship</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.relationshipWithStudents}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">School Attitude</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.attitudeToSchool}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Self Control</td><td className="py-0.5 text-center font-bold text-slate-800">{affective.selfControl}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Column 2: Psychomotor Skills */}
            {layout.showPsychomotorSkills && (
              <div className={`border ${themeClasses.border} rounded p-0 overflow-hidden bg-white text-[10px]`}>
                <div className={`${themeClasses.bgHeader} text-white text-center font-bold py-1 text-[11px]`}>
                  PSYCHOMOTOR SKILLS
                </div>
                <table className="w-full text-left font-semibold">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-20 hover:bg-slate-50 text-slate-600">
                      <th className="py-1 px-2">TRAITS &amp; SKILLS</th>
                      <th className="py-1 px-2 text-center w-12">RATING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="hover:bg-slate-50 bg-slate-100/30 text-rose-800 font-bold"><td className="py-0.5 pl-2" colSpan={2}>Traits</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Spirit of Teamwork</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.spiritOfTeamwork}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Initiatives</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.initiatives}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Organizational</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.organizationalAbility}</td></tr>
                    
                    <tr className="hover:bg-slate-50 bg-slate-100/30 text-rose-800 font-bold"><td className="py-0.5 pl-2" colSpan={2}>Psychomotor</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Handwriting</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.handwriting}</td></tr>
                    <tr className="hover:bg-slate-45"><td className="py-0.5 pl-2">Reading</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.reading}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Verbal Fluency</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.verbalFluencyDiction}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Musical Skills</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.musicalSkills}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Creative Arts</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.creativeArts}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">Physical Edu</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.physicalEducation}</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-0.5 pl-2">General Reasoning</td><td className="py-0.5 text-center font-bold text-slate-800">{psychomotor.generalReasoning}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Column 3: Keys, Scale & Stamp */}
            <div className="space-y-2">
              {/* Grading scale */}
              {layout.showGradingScale && (
                <div className={`border ${themeClasses.border} rounded p-0 overflow-hidden bg-white text-[9px] font-bold`}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`${themeClasses.bgHeader} text-white text-center font-bold`}>
                        <th className="py-0.5">SCORE</th>
                        <th className="py-0.5">GRADE</th>
                        <th className="py-0.5">POINT</th>
                        <th className="py-0.5">MEANING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-center">
                      <tr><td className="py-0.5">0% - &lt;40%</td><td className="font-extrabold text-red-650">F9</td><td>1</td><td className="text-red-650 font-bold">Fail</td></tr>
                      <tr><td className="py-0.5">40% - &lt;45%</td><td className="font-bold">E8</td><td>2</td><td>Pass</td></tr>
                      <tr><td className="py-0.5">45% - &lt;50%</td><td className="font-bold">D7</td><td>2</td><td>Pass</td></tr>
                      <tr><td className="py-0.5">50% - &lt;55%</td><td className="font-bold">C6</td><td>3</td><td>Credit</td></tr>
                      <tr><td className="py-0.5">55% - &lt;60%</td><td className="font-bold">C5</td><td>3</td><td>Credit</td></tr>
                      <tr><td className="py-0.5">60% - &lt;65%</td><td className="font-bold">C4</td><td>3</td><td>Credit</td></tr>
                      <tr><td className="py-0.5">65% - &lt;70%</td><td className="font-bold">B3</td><td>4</td><td>Good</td></tr>
                      <tr><td className="py-0.5">70% - &lt;75%</td><td className="font-bold">B2</td><td>4</td><td>Very good</td></tr>
                      <tr className="bg-emerald-50/50"><td className="py-0.5 font-bold">&gt;=75% - 100%</td><td className="font-black text-emerald-800">A1</td><td>5</td><td className="font-bold text-emerald-800">Excellent</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Rating Description Key */}
              {layout.showRatingKey && (
                <div className={`border ${themeClasses.border} rounded p-0 overflow-hidden bg-white text-[9px] font-semibold`}>
                  <table className="w-full">
                    <thead>
                      <tr className={`${themeClasses.bgHeader} text-white text-center font-bold`}>
                        <th className="py-0.5 w-8">KEY</th>
                        <th className="py-0.5 text-left pl-2">MEANING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-700">
                      <tr><td className="py-0.5 text-center font-bold bg-slate-100">5</td><td className="py-0.5 pl-2">Excellent observe level</td></tr>
                      <tr><td className="py-0.5 text-center font-bold bg-slate-100">4</td><td className="py-0.5 pl-2">High observe level</td></tr>
                      <tr><td className="py-0.5 text-center font-bold bg-slate-100">3</td><td className="py-0.5 pl-2">Acceptable observe level</td></tr>
                      <tr><td className="py-0.5 text-center font-bold bg-slate-100">2</td><td className="py-0.5 pl-2">Minimal observe level</td></tr>
                      <tr><td className="py-0.5 text-center font-bold bg-slate-100">1</td><td className="py-0.5 pl-2 text-red-750">No observe level</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stamp and Signature */}
              {layout.showSignatureArea && (
                <div className={`border border-dashed ${themeClasses.border} rounded p-2.5 text-center relative h-20 bg-slate-50/50 flex flex-col justify-between items-center select-none`}>
                  <span className="text-[7.5px] text-slate-400 block leading-none">Duly Certified Stamp &amp; Signature</span>
                  
                  {/* Stamp Overlay */}
                  {layout.showStamp && (
                    <div className="absolute right-2 bottom-1 opacity-70 transform rotate-6 border-2 border-red-500 rounded p-1 flex flex-col items-center justify-center font-extrabold text-red-500 select-none pointer-events-none scale-75">
                      <span className="text-[6px] leading-none">PROGRESS INTELLECTUAL</span>
                      <span className="text-[8px] uppercase leading-none my-0.5">APPROVED TERM REPORT</span>
                      <span className="text-[6px] font-bold leading-none">OKE-IGBO, ONDO STATE</span>
                    </div>
                  )}
                  
                  {/* Handwriting Scribble Signature or Uploaded Signature */}
                  {db.schoolSettings?.principalSignatureUrl ? (
                    <img src={db.schoolSettings.principalSignatureUrl} alt="Signature" className="h-10 object-contain mx-auto" referrerPolicy="no-referrer" />
                  ) : (
                    <svg className="w-20 h-6 text-blue-700 opacity-80" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10,25 Q35,5 45,28 T70,12 T90,30" />
                      <path d="M20,32 C40,32 50,30 80,26" />
                      <circle cx="45" cy="22" r="1.5" />
                    </svg>
                  )}
                  
                  <span className="text-[8.5px] font-bold text-slate-800 leading-none">School Principal Signature</span>
                </div>
              )}
            </div>

          </div>

          {/* TEACHER REPORTS & REMARKS */}
          {(layout.showTeacherRemarks || layout.showPrincipalRemarks) && (
            <div className={`border border-slate-300 rounded overflow-hidden divide-y divide-slate-300 bg-slate-50 uppercase text-[10px] font-bold`}>
              {layout.showTeacherRemarks && (
                <div className="p-2 grid grid-cols-4 items-center gap-1">
                  <span className="col-span-1 text-slate-500">{layout.classTeacherReportLabel || "Class teacher's report"}</span>
                  <span className={`col-span-3 ${themeClasses.text} font-black tracking-normal italic`}>
                    {student.classTeacherReport || "SEYI LOVES TO BE CORRECTED AND SHE ALWAYS TAKES TO CORRECTION."}
                  </span>
                </div>
              )}
              {layout.showPrincipalRemarks && (
                <div className="p-2 grid grid-cols-4 items-center gap-1">
                  <span className="col-span-1 text-slate-500">{layout.principalReportLabel || "Principal's report"}</span>
                  <span className={`col-span-3 ${themeClasses.text} font-black tracking-normal italic`}>
                    {student.principalReport || "SUPERB ACHIEVEMENT! CONTINUE TO EXCEL."}
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>

      <div className="mt-4 text-center print:hidden">
        <p className="text-[10px] md:text-[11px] text-slate-400 font-bold">
          GENERATED DYNAMICALLY BY {db.schoolSettings.schoolName.toUpperCase()} ACADEMIC SOFTWARE.
        </p>
      </div>
    </div>
  );
}
