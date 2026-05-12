import { jsPDF } from "jspdf";

export type ReserveVault = {
  name: string;
  location: string;
  capacity_grams: number;
};

export type AuditEntry = {
  auditor_name: string;
  auditor_firm: string | null;
  vault_name?: string | null;
  grams_verified: number;
  audit_date: string;
  notes?: string | null;
};

export function downloadReservesReportPDF(opts: {
  totalGrams: number;
  vaults: ReserveVault[];
  audits: AuditEntry[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(20, 20, 24);
  doc.rect(0, 0, W, H, "F");

  // Border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2);
  doc.rect(24, 24, W - 48, H - 48);

  // Title
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("AMIRA GOLD", W / 2, 70, { align: "center" });

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Proof of Reserves Report", W / 2, 92, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated ${new Date().toLocaleString()}`, W / 2, 108, { align: "center" });

  doc.setDrawColor(212, 175, 55);
  doc.line(W / 2 - 80, 118, W / 2 + 80, 118);

  // Total
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 160);
  doc.text("TOTAL GOLD UNDER CUSTODY", W / 2, 150, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(212, 175, 55);
  doc.text(`${opts.totalGrams.toLocaleString()} g`, W / 2, 188, { align: "center" });

  // Vault table
  let y = 230;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(212, 175, 55);
  doc.text("Vault Breakdown", 50, y);
  y += 8;
  doc.setDrawColor(80, 80, 90);
  doc.line(50, y, W - 50, y);
  y += 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("VAULT", 54, y);
  doc.text("LOCATION", 230, y);
  doc.text("CAPACITY", W - 130, y);
  y += 6;
  doc.line(50, y, W - 50, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(235, 235, 235);
  doc.setFontSize(10);
  for (const v of opts.vaults) {
    if (y > H - 200) { doc.addPage(); y = 60; }
    doc.text(v.name.slice(0, 32), 54, y);
    doc.text(v.location.slice(0, 32), 230, y);
    doc.text(`${Number(v.capacity_grams).toLocaleString()} g`, W - 130, y);
    y += 16;
  }

  // Audit log
  y += 12;
  if (y > H - 240) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(212, 175, 55);
  doc.text("Recent Independent Audits", 50, y);
  y += 8;
  doc.setDrawColor(80, 80, 90);
  doc.line(50, y, W - 50, y);
  y += 16;

  doc.setFontSize(9);
  doc.setTextColor(235, 235, 235);
  for (const a of opts.audits) {
    if (y > H - 90) { doc.addPage(); y = 60; }
    doc.setFont("helvetica", "bold");
    doc.text(`${a.auditor_firm ?? "Independent"} — ${a.auditor_name}`, 54, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 170);
    doc.text(`${new Date(a.audit_date).toLocaleDateString()}`, W - 120, y);
    y += 12;
    doc.setTextColor(200, 200, 200);
    doc.text(`Vault: ${a.vault_name ?? "—"}  ·  Verified: ${Number(a.grams_verified).toLocaleString()} g`, 54, y);
    y += 12;
    if (a.notes) {
      const noteLines = doc.splitTextToSize(a.notes, W - 110);
      doc.setTextColor(160, 160, 160);
      doc.text(noteLines, 54, y);
      y += noteLines.length * 11;
    }
    y += 10;
    doc.setDrawColor(50, 50, 60);
    doc.line(54, y, W - 54, y);
    y += 14;
    doc.setTextColor(235, 235, 235);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Amira Gold — Independently audited proof of reserves.", W / 2, H - 40, { align: "center" });

  doc.save(`amira-gold-proof-of-reserves-${new Date().toISOString().slice(0, 10)}.pdf`);
}