import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PaymentReportRow {
  name: string;
  amount: number;
  method: string;
  reference: string;
}

// Paleta corporativa (azules + gris) — minimalista
const NAVY: [number, number, number] = [30, 58, 95];      // #1e3a5f
const SLATE: [number, number, number] = [51, 65, 85];      // #334155
const GRAYTX: [number, number, number] = [100, 116, 139];  // #64748b
const LINE: [number, number, number] = [226, 232, 240];    // #e2e8f0
const PIE_COLORS = ['#1e3a5f', '#3b6ea5', '#6b98c4', '#9db8d2', '#c4d3e3', '#8aa0b8'];

function money(n: number) {
  return `$${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

// ── Bar chart → dataURL ────────────────────────────────────────────────────────
function barChartDataUrl(data: { label: string; value: number }[]): string {
  const scale = 2;
  const w = 360, h = 250;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);

  const pad = { l: 32, r: 14, t: 14, b: 54 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.value), 1);

  // gridlines + y labels
  const steps = 4;
  ctx.textAlign = 'right';
  for (let i = 0; i <= steps; i++) {
    const v = Math.round((max * i) / steps);
    const y = pad.t + plotH - (plotH * i) / steps;
    ctx.strokeStyle = '#eef2f6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Helvetica';
    ctx.fillText(String(v), pad.l - 6, y + 3);
  }

  const n = data.length || 1;
  const slot = plotW / n;
  const bw = Math.min(48, slot * 0.55);
  data.forEach((d, i) => {
    const cx = pad.l + slot * i + slot / 2;
    const x = cx - bw / 2;
    const bh = (d.value / max) * plotH;
    const y = pad.t + plotH - bh;
    ctx.fillStyle = '#1e3a5f';
    roundRectTop(ctx, x, y, bw, bh, 4); ctx.fill();
    // value on top
    ctx.fillStyle = '#334155'; ctx.font = 'bold 11px Helvetica'; ctx.textAlign = 'center';
    ctx.fillText(String(d.value), cx, y - 5);
    // label (wrap up to 2 words per line)
    ctx.fillStyle = '#64748b'; ctx.font = '9px Helvetica';
    const words = d.label.split(' ');
    const lines = words.length > 1 ? [words.slice(0, 1).join(' '), words.slice(1).join(' ')] : [d.label];
    lines.forEach((ln, li) => ctx.fillText(ln, cx, pad.t + plotH + 14 + li * 11));
  });

  return c.toDataURL('image/png');
}

// ── Donut chart + legend → dataURL ─────────────────────────────────────────────
function donutChartDataUrl(data: { label: string; value: number }[]): string {
  const scale = 2;
  const w = 360, h = 250;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 82, cy = h / 2, r = 66, inner = 40;

  let start = -Math.PI / 2;
  data.forEach((d, i) => {
    const ang = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + ang);
    ctx.closePath();
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
    ctx.fill();
    start += ang;
  });
  // donut hole
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  // center total
  ctx.fillStyle = '#334155'; ctx.textAlign = 'center'; ctx.font = 'bold 13px Helvetica';
  ctx.fillText(money(total).replace(/\.00$/, ''), cx, cy - 1);
  ctx.fillStyle = '#94a3b8'; ctx.font = '8px Helvetica';
  ctx.fillText('TOTAL', cx, cy + 11);

  // legend
  const lx = 172;
  let ly = cy - (data.length * 20) / 2 + 6;
  data.forEach((d, i) => {
    const pct = Math.round((d.value / total) * 100);
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
    ctx.beginPath(); ctx.arc(lx, ly - 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155'; ctx.font = 'bold 10px Helvetica';
    ctx.fillText(d.label, lx + 10, ly);
    ctx.fillStyle = '#64748b'; ctx.font = '9px Helvetica';
    ctx.fillText(`${money(d.value)}  ·  ${pct}%`, lx + 10, ly + 11);
    ly += 22;
  });

  return c.toDataURL('image/png');
}

export async function exportPaymentsReport(rows: PaymentReportRow[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  // Aggregate by method
  const byMethod = new Map<string, { count: number; total: number }>();
  rows.forEach((r) => {
    const cur = byMethod.get(r.method) ?? { count: 0, total: 0 };
    byMethod.set(r.method, { count: cur.count + 1, total: cur.total + r.amount });
  });
  const methods = Array.from(byMethod.entries()).map(([label, v]) => ({ label, ...v }));
  const totalPagos = rows.length;
  const totalRecaudado = rows.reduce((s, r) => s + r.amount, 0);

  // ── Header ──
  try {
    const img = await loadImage('/logo.png');
    const logo = imageToDataUrl(img);
    doc.addImage(logo, 'PNG', margin, 12, 18, 18);
  } catch {
    doc.setFillColor(...NAVY); doc.circle(margin + 9, 21, 9, 'F');
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  doc.text('GYM EL CUBA', margin + 22, 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAYTX);
  doc.text('Sistema de gestión', margin + 22, 25.5);

  // Centered title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...SLATE);
  doc.text('INFORME DE PAGOS', pageW / 2, 20, { align: 'center' });

  // Date + time top-right
  const dt = new Date().toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAYTX);
  doc.text(dt, pageW - margin, 15, { align: 'right' });

  // Divider
  doc.setDrawColor(...LINE); doc.setLineWidth(0.4);
  doc.line(margin, 33, pageW - margin, 33);

  // ── Sección 1 ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Resumen de pagos por método', margin, 43);

  // chart titles
  const colW = (pageW - margin * 2 - 8) / 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...SLATE);
  doc.text('Cantidad de pagos por método', margin, 50);
  doc.text('Monto recaudado por método', margin + colW + 8, 50);

  // charts
  const chartY = 53;
  const chartH = colW * (250 / 360);
  if (methods.length > 0) {
    const bar = barChartDataUrl(methods.map((m) => ({ label: m.label, value: m.count })));
    const donut = donutChartDataUrl(methods.map((m) => ({ label: m.label, value: m.total })));
    doc.addImage(bar, 'PNG', margin, chartY, colW, chartH);
    doc.addImage(donut, 'PNG', margin + colW + 8, chartY, colW, chartH);
  } else {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...GRAYTX);
    doc.text('Sin pagos registrados para mostrar.', margin, chartY + 10);
  }

  // ── Sección 2 ──
  const sec2Y = chartY + chartH + 10;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Detalle de pagos', margin, sec2Y);

  autoTable(doc, {
    head: [['Nombre y Apellido', 'Monto', 'Método de pago', 'Referencia / Observación']],
    body: rows.map((r) => [r.name, money(r.amount), r.method, r.reference]),
    startY: sec2Y + 3,
    margin: { left: margin, right: margin, bottom: 20 },
    styles: {
      font: 'helvetica', fontSize: 9,
      cellPadding: { top: 3.2, bottom: 3.2, left: 5, right: 5 },
      textColor: SLATE, lineColor: LINE, lineWidth: 0.15, overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    alternateRowStyles: { fillColor: [247, 249, 251] },
    columnStyles: {
      1: { halign: 'right', cellWidth: 26 },
      2: { cellWidth: 38 },
    },
  });

  // ── Pie / totales ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? sec2Y + 10;
  let ty = finalY + 8;
  if (ty > pageH - 26) { doc.addPage(); ty = 24; }

  doc.setDrawColor(...LINE); doc.setLineWidth(0.4);
  doc.line(pageW - margin - 78, ty - 4, pageW - margin, ty - 4);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAYTX);
  doc.text('Total de pagos:', pageW - margin - 78, ty + 2);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...SLATE);
  doc.text(String(totalPagos), pageW - margin, ty + 2, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAYTX);
  doc.text('Total recaudado:', pageW - margin - 78, ty + 8.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(money(totalRecaudado), pageW - margin, ty + 8.5, { align: 'right' });

  // ── Footer en todas las páginas ──
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...GRAYTX);
    doc.text('Generado automáticamente desde el sistema de gestión de Gym El Cuba', margin, pageH - 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const n = new Date();
  const dateStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  doc.save(`Informe_Pagos_Gym_El_Cuba_${dateStr}.pdf`);
}
