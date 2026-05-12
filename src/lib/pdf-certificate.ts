import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export type CertificateData = {
  certificateNo: string;
  ownerName: string;
  grams: number;
  vaultName: string;
  vaultLocation: string;
  issuedAt: string;
};

export async function downloadCertificatePDF(data: CertificateData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(20, 20, 24);
  doc.rect(0, 0, W, H, "F");

  // Gold border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(3);
  doc.rect(24, 24, W - 48, H - 48);
  doc.setLineWidth(0.5);
  doc.rect(34, 34, W - 68, H - 68);

  // Header
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("AMIRA GOLD", W / 2, 90, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "normal");
  doc.text("CERTIFICATE OF OWNERSHIP", W / 2, 112, { align: "center" });

  // Divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 60, 124, W / 2 + 60, 124);

  // Body
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(13);
  doc.text("This certifies that", W / 2, 170, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text(data.ownerName, W / 2, 200, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(240, 240, 240);
  doc.text("is the rightful owner of", W / 2, 230, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(212, 175, 55);
  doc.text(`${data.grams.toFixed(4)} g`, W / 2, 280, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(240, 240, 240);
  doc.text("of 99.99% LBMA-grade investment gold", W / 2, 305, { align: "center" });
  doc.text(`Securely stored at ${data.vaultName} — ${data.vaultLocation}`, W / 2, 325, { align: "center" });

  // Details box
  const boxY = 380;
  doc.setDrawColor(60, 60, 65);
  doc.setLineWidth(0.5);
  doc.rect(80, boxY, W - 160, 110);

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text("CERTIFICATE NO.", 100, boxY + 22);
  doc.text("ISSUED", 100, boxY + 62);
  doc.text("VAULT", W / 2 + 20, boxY + 22);
  doc.text("FORM", W / 2 + 20, boxY + 62);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(240, 240, 240);
  doc.text(data.certificateNo, 100, boxY + 40);
  doc.text(new Date(data.issuedAt).toLocaleDateString(), 100, boxY + 80);
  doc.text(`${data.vaultName}, ${data.vaultLocation}`, W / 2 + 20, boxY + 40);
  doc.text("Allocated", W / 2 + 20, boxY + 80);

  // QR code
  const qrPayload = JSON.stringify({
    cert: data.certificateNo,
    grams: data.grams,
    vault: data.vaultName,
    issued: data.issuedAt,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200, color: { dark: "#D4AF37", light: "#141418" } });
  doc.addImage(qrDataUrl, "PNG", W / 2 - 50, 520, 100, 100);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Scan to verify", W / 2, 638, { align: "center" });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Amira Gold — Trusted custody, transparent reserves.", W / 2, H - 70, { align: "center" });
  doc.text("amiragold.com", W / 2, H - 56, { align: "center" });

  doc.save(`amira-gold-${data.certificateNo}.pdf`);
}
