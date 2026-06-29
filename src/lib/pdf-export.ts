import jsPDF from "jspdf";
import type { AuditResult } from "./audit-types";

export function exportAuditPdf(audit: AuditResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const primary: [number, number, number] = [37, 99, 235];
  const ink: [number, number, number] = [20, 28, 48];
  const muted: [number, number, number] = [110, 120, 140];
  const success: [number, number, number] = [22, 163, 96];
  const warning: [number, number, number] = [217, 119, 6];
  const critical: [number, number, number] = [220, 38, 38];

  function ensure(h: number) {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function setColor(c: [number, number, number]) {
    doc.setTextColor(c[0], c[1], c[2]);
  }

  // Header
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Storelens Audit Report", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(audit.storeName + " — " + audit.url, margin, 58);
  doc.setFontSize(9);
  doc.text("Generated " + new Date(audit.scannedAt).toLocaleString(), margin, 74);
  y = 120;

  // Overall score box
  ensure(120);
  doc.setDrawColor(220, 226, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageW - margin * 2, 110, 12, 12, "FD");
  setColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  doc.text(String(audit.overallScore), margin + 24, y + 70);
  doc.setFontSize(11);
  setColor(muted);
  doc.text("Overall Score", margin + 24, y + 88);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(ink);
  doc.text(`Grade ${audit.grade} — ${audit.health}`, margin + 160, y + 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(muted);
  doc.text(`${audit.totalIssues} issues found • ${audit.criticalIssues} critical • ${audit.warnings} warnings`, margin + 160, y + 64);
  doc.text(`Estimated conversion uplift potential: ${audit.conversionPotential}%`, margin + 160, y + 80);
  y += 130;

  // Category scores
  ensure(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setColor(ink);
  doc.text("Category Scores", margin, y);
  y += 18;

  for (const cat of audit.categories) {
    ensure(46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(ink);
    doc.text(cat.label, margin, y);
    doc.text(`${cat.score}/100`, pageW - margin, y, { align: "right" });
    y += 6;
    // bar
    doc.setFillColor(232, 237, 245);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 4, 4, "F");
    const w = ((pageW - margin * 2) * cat.score) / 100;
    const c = cat.score >= 80 ? success : cat.score >= 60 ? warning : critical;
    doc.setFillColor(c[0], c[1], c[2]);
    doc.roundedRect(margin, y, w, 8, 4, 4, "F");
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(muted);
    doc.text(
      `Weight ${cat.weight}% • Industry benchmark ${cat.benchmark} • ${cat.passed} passed, ${cat.warnings} warnings, ${cat.failed} critical`,
      margin,
      y,
    );
    y += 18;
  }

  // Priority recommendations
  doc.addPage();
  y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(ink);
  doc.text("Priority Recommendations", margin, y);
  y += 22;

  const recommendations = audit.categories
    .flatMap((c) => c.checks.filter((k) => k.status !== "pass" && k.status !== "info"))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
      return (order[a.priority || "low"] ?? 3) - (order[b.priority || "low"] ?? 3);
    })
    .slice(0, 25);

  for (const r of recommendations) {
    ensure(90);
    doc.setDrawColor(225, 230, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, pageW - margin * 2, 0, 10, 10);
    setColor(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(r.title, margin, y + 4);
    const prio = (r.priority || "low").toUpperCase();
    const prioColor = r.priority === "critical" || r.priority === "high" ? critical : r.priority === "medium" ? warning : muted;
    setColor(prioColor);
    doc.setFontSize(9);
    doc.text(prio, pageW - margin, y + 4, { align: "right" });
    y += 16;
    setColor(muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const why = doc.splitTextToSize("Why: " + (r.why || ""), pageW - margin * 2);
    doc.text(why, margin, y);
    y += why.length * 12 + 2;
    setColor(ink);
    const fix = doc.splitTextToSize("Fix: " + (r.recommendation || ""), pageW - margin * 2);
    doc.text(fix, margin, y);
    y += fix.length * 12 + 2;
    setColor(muted);
    doc.setFontSize(9);
    doc.text(
      `Impact ${r.impact || "—"}  •  Difficulty ${r.difficulty || "—"}  •  Time ${r.timeEstimate || "—"}`,
      margin,
      y,
    );
    y += 18;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    setColor(muted);
    doc.text(`Storelens • ${audit.url}`, margin, pageH - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 20, { align: "right" });
  }

  const filename = `storelens-${audit.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(filename);
}
