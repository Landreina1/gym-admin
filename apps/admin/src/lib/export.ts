import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type CellValue = string | number | boolean | null | undefined;

interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  summary?: { label: string; value: string; color?: string }[];
  headers: string[];
  rows: CellValue[][];
  filename?: string;
}

function localDateStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function fmtDateLong(): string {
  return new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function drawPageHeader(doc: jsPDF, title: string, dateLabel: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const cx = margin + 9;
  const cy = 17;

  // Red circle logo
  doc.setFillColor(229, 57, 53);
  doc.circle(cx, cy, 8, 'F');

  // "GE" initials centered in circle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GE', cx, cy, { align: 'center', baseline: 'middle' });

  // Brand name
  const textX = cx + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('GYM EL CUBA', textX, cy - 2.5);

  // Document title below brand
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(title, textX, cy + 3.5);

  // Date top-right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(dateLabel, pageW - margin, cy, { align: 'right', baseline: 'middle' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 27, pageW - margin, 27);
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const y = pageH - 8;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, y - 3.5, pageW - margin, y - 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generado automáticamente desde el sistema de gestión de Gym El Cuba', margin, y);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageW - margin, y, { align: 'right' });
}

export function exportPdf({ title, headers, rows, filename }: ExportPdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const dateStr = localDateStr();
  const dateLabel = fmtDateLong();
  const outputFilename = filename ?? `${title.replace(/\s+/g, '_')}_${dateStr}.pdf`;

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => (c === null || c === undefined ? '—' : String(c)))),
    startY: 30,
    margin: { left: 14, right: 14, bottom: 16 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      textColor: [55, 65, 81],
      lineColor: [241, 245, 249],
      lineWidth: 0.2,
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: () => {
      drawPageHeader(doc, title, dateLabel);
    },
  });

  // Add footers after table is complete so we know the total page count
  // pages array is 1-indexed with an empty slot at index 0
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  doc.save(outputFilename);
}

export function downloadCsv(filename: string, rows: CellValue[][]) {
  const escape = (v: CellValue): string => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
