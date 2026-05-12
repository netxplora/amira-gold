import { jsPDF } from "jspdf";

export type JewelryReceiptData = {
  orderId: string;
  createdAt: string;
  status: string;
  goldRatePerGram: number;
  subtotal: number;
  shipping: number;
  total: number;
  delivery: { name: string; phone: string | null; address: string; country: string | null; tracking?: string | null };
  courier?: string | null;
  items: { name: string; sku: string; purity: string; weight: number; qty: number; unit: number }[];
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function downloadJewelryReceiptPDF(d: JewelryReceiptData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(20, 20, 24);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2);
  doc.rect(24, 24, W - 48, H - 48);

  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AMIRA GOLD", W / 2, 64, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(220, 220, 220);
  doc.text("Jewelry Order Receipt", W / 2, 84, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text(`Order #${d.orderId.slice(0, 8).toUpperCase()}`, 50, 120);
  doc.text(`Date: ${new Date(d.createdAt).toLocaleString()}`, 50, 134);
  doc.text(`Status: ${d.status.toUpperCase()}`, 50, 148);
  doc.text(`Gold rate: ${fmt(d.goldRatePerGram)}/g`, 50, 162);

  // Delivery box
  doc.setDrawColor(60, 60, 65);
  doc.rect(W / 2, 110, W / 2 - 50, 70);
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(9);
  doc.text("DELIVER TO", W / 2 + 10, 124);
  doc.setTextColor(235, 235, 235);
  doc.setFontSize(10);
  doc.text(d.delivery.name, W / 2 + 10, 140);
  const addrLines = doc.splitTextToSize(d.delivery.address, W / 2 - 70);
  doc.text(addrLines, W / 2 + 10, 154);
  if (d.delivery.country) doc.text(d.delivery.country, W / 2 + 10, 154 + addrLines.length * 12);

  // Items table
  let y = 210;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.text("Items", 50, y);
  y += 8;
  doc.setDrawColor(80, 80, 90);
  doc.line(50, y, W - 50, y);
  y += 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("ITEM", 54, y);
  doc.text("PURITY", 280, y);
  doc.text("QTY", 360, y);
  doc.text("AMOUNT", W - 100, y);
  y += 6;
  doc.line(50, y, W - 50, y);
  y += 14;

  doc.setFontSize(10);
  doc.setTextColor(235, 235, 235);
  for (const it of d.items) {
    if (y > H - 200) { doc.addPage(); y = 60; }
    doc.text(`${it.name.slice(0, 36)}`, 54, y);
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(8);
    doc.text(`${it.sku} · ${it.weight}g`, 54, y + 12);
    doc.setFontSize(10);
    doc.setTextColor(235, 235, 235);
    doc.text(it.purity, 280, y);
    doc.text(String(it.qty), 360, y);
    doc.text(fmt(it.unit * it.qty), W - 100, y);
    y += 28;
  }

  // Totals
  y += 10;
  doc.setDrawColor(80, 80, 90);
  doc.line(W - 220, y, W - 50, y);
  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text("Subtotal", W - 220, y); doc.text(fmt(d.subtotal), W - 50, y, { align: "right" });
  y += 14;
  doc.text("Shipping", W - 220, y); doc.text(fmt(d.shipping), W - 50, y, { align: "right" });
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(12);
  doc.text("TOTAL", W - 220, y); doc.text(fmt(d.total), W - 50, y, { align: "right" });

  if (d.delivery.tracking) {
    y += 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(`Tracking: ${d.delivery.tracking}`, 50, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Thank you for shopping with Amira Gold.", W / 2, H - 50, { align: "center" });

  doc.save(`amira-jewelry-receipt-${d.orderId.slice(0, 8)}.pdf`);
}