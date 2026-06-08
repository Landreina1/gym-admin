type CellValue = string | number | boolean | null | undefined;

function escape(v: CellValue): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function downloadCsv(filename: string, rows: CellValue[][]) {
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  // BOM so Excel opens UTF-8 correctly (for accented chars, ñ, etc.)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
