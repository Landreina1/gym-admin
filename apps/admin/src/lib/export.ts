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

const NAVY: [number, number, number] = [30, 58, 95];
const SLATE: [number, number, number] = [51, 65, 85];
const GRAY: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const MUTED: [number, number, number] = [148, 163, 184];

function localDateStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function imageToDataUrl(img: HTMLImageElement): string {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || 200;
  c.height = img.naturalHeight || 200;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

export async function exportPdf({ title, headers, rows, filename }: ExportPdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const dateStr = localDateStr();
  const dateTime = new Date().toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const outputFilename = filename ?? `${title.replace(/\s+/g, '_')}_${dateStr}.pdf`;

  // Precargar el logo (se dibuja en cada página desde didDrawPage, que es síncrono)
  let logo: string | null = null;
  try { logo = imageToDataUrl(await loadImage('/logo.png')); } catch { logo = null; }

  function header() {
    if (logo) {
      doc.addImage(logo, 'PNG', margin, 8, 15, 15);
    } else {
      doc.setFillColor(...NAVY); doc.circle(margin + 7, 15, 7, 'F');
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
    doc.text('GYM EL CUBA', margin + 20, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
    doc.text('Sistema de gestión', margin + 20, 19);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...SLATE);
    doc.text(title.toUpperCase(), pageW / 2, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(dateTime, pageW - margin, 12, { align: 'right' });

    doc.setDrawColor(...LINE); doc.setLineWidth(0.4);
    doc.line(margin, 25, pageW - margin, 25);
  }

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => (c === null || c === undefined ? '—' : String(c)))),
    startY: 30,
    margin: { left: margin, right: margin, bottom: 16, top: 30 },
    styles: {
      font: 'helvetica', fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      textColor: SLATE, lineColor: LINE, lineWidth: 0.15, overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold',
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
    },
    alternateRowStyles: { fillColor: [247, 249, 251] },
    didDrawPage: () => header(),
  });

  // Total de registros al final
  const finalY = (doc as any).lastAutoTable?.finalY ?? 30;
  let ty = finalY + 7;
  if (ty > pageH - 16) { doc.addPage(); ty = 34; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY);
  doc.text(`Total de registros: ${rows.length}`, pageW - margin, ty, { align: 'right' });

  // Pie de página en todas las páginas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text('Generado automáticamente desde el sistema de gestión de Gym El Cuba', margin, pageH - 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 7, { align: 'right' });
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
