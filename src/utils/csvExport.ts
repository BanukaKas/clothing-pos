export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
): void {
  if (!rows || !rows.length) {
    return;
  }

  let keys: (keyof T)[];
  let headerLabels: string[];

  if (headers && headers.length) {
    keys = headers.map(h => h.key);
    headerLabels = headers.map(h => h.label);
  } else {
    keys = Object.keys(rows[0]) as (keyof T)[];
    headerLabels = keys.map(k => String(k));
  }

  const csvRows: string[] = [];
  // Add header row
  csvRows.push(headerLabels.map(escapeCSVCell).join(','));

  // Add data rows
  for (const row of rows) {
    const values = keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });
    csvRows.push(values.map(escapeCSVCell).join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSVCell(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
