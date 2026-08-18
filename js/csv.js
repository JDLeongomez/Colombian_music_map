// Minimal RFC4180-ish CSV parser: quoted fields, "" escaping, CRLF/LF rows.
// Returns an array of objects keyed by the header row.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
      continue;
    }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  // Drop rows where every field is blank — spreadsheet apps often leave a
  // trailing all-empty line (or a trailing comma on every row) on save.
  const nonEmpty = rows.filter(r => r.some(field => field !== ''));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map(h => h.trim());
  return nonEmpty.slice(1).map(cols => {
    const obj = {};
    header.forEach((key, idx) => { obj[key] = (cols[idx] ?? '').trim(); });
    return obj;
  });
}
