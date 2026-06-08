type CellValue = string | number | boolean | null | undefined;

interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  summary?: { label: string; value: string; color?: string }[];
  headers: string[];
  rows: CellValue[][];
}

export function exportPdf({ title, subtitle, summary, headers, rows }: ExportPdfOptions) {
  const date = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  const summaryHtml = summary?.length
    ? `<div class="summary">${summary.map((s) => `
        <div class="summary-card">
          <div class="s-label">${s.label}</div>
          <div class="s-value" style="${s.color ? `color:${s.color}` : ''}">${s.value}</div>
        </div>`).join('')}
      </div>`
    : '';

  const thead = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;
  const tbody = rows.map((r) =>
    `<tr>${r.map((c) => `<td>${c ?? '—'}</td>`).join('')}</tr>`,
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1e293b;background:#fff;padding:32px}
    .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;border-bottom:2px solid #e2e8f0;padding-bottom:20px}
    .header-left h1{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
    .header-left p{font-size:12px;color:#64748b;margin-top:4px}
    .header-right{text-align:right}
    .header-right .date{font-size:11px;color:#94a3b8;margin-bottom:2px}
    .header-right .count{font-size:11px;font-weight:600;color:#475569}
    .logo{font-size:18px;font-weight:800;color:#e53935}
    .summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
    .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 18px;min-width:130px}
    .s-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px}
    .s-value{font-size:20px;font-weight:800;color:#1e293b}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    thead tr{background:#1e293b}
    th{color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:10px 12px;text-align:left}
    td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:11.5px;color:#374151;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:nth-child(even) td{background:#f8fafc}
    .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
    @media print{body{padding:12px}@page{margin:14mm;size:A4 landscape}}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo">GYM</div>
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="header-right">
      <div class="date">${date}</div>
      <div class="count">${rows.length} registro${rows.length !== 1 ? 's' : ''}</div>
    </div>
  </div>
  ${summaryHtml}
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
  <div class="footer">
    <span>Generado automáticamente desde el sistema de gestión del gimnasio</span>
    <span>${date}</span>
  </div>
  <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),200)})</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Permití las ventanas emergentes para exportar el PDF.'); return; }
  w.document.write(html);
  w.document.close();
}

// Keep CSV for programmatic use if needed
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
