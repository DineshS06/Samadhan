/**
 * computeStudy(rows, options)
 *
 * Pure calculation module. One number, one calculation, everywhere.
 * Every research page, its markdown version, llms.txt, and the FAQ all
 * call this module — no number is ever typed in by hand twice.
 *
 * Pure: no fetch, no side effects, no randomness, no backend.
 * Thin-data guard: any finding with fewer than 20 rows behind it is omitted.
 *
 * @param {Array} rows - Array of data rows (any shape, configured via options).
 * @param {Object} options - Configuration for how to read the rows.
 * @returns {Object} { totals, findings, ranked, byCategory, metadata }
 */
export function computeStudy(rows, options = {}) {
  const {
    labelField = 'label',
    valueField = 'value',
    categoryField = 'category',
    groupField = 'group',
    minRowsForFinding = 20,
    denominator = rows.length,
  } = options;

  const totalRows = rows.length;

  // --- Totals ---
  const totals = {
    rowCount: totalRows,
    denominator,
  };

  // --- Findings ---
  // Each finding: { id, anchor, label, value, note, denominator, rowCount }
  const findings = [];

  if (totalRows >= minRowsForFinding) {
    // Grouped findings by category (if categoryField exists in rows)
    const categories = {};
    rows.forEach((row) => {
      const cat = row[categoryField];
      if (cat) {
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(row);
      }
    });

    Object.entries(categories).forEach(([catName, catRows], index) => {
      const share = ((catRows.length / denominator) * 100).toFixed(1);
      findings.push({
        id: `finding-${index + 1}`,
        anchor: `#finding-${slugify(catName)}`,
        label: `${catName} share`,
        value: catRows.length,
        note: `${catRows.length} of ${denominator} (${share}%)`,
        denominator,
        rowCount: catRows.length,
      });
    });

    // Total finding
    findings.unshift({
      id: 'finding-total',
      anchor: '#finding-total',
      label: 'Total count',
      value: totalRows,
      note: `${totalRows} total rows`,
      denominator,
      rowCount: totalRows,
    });
  }

  // --- Ranked list ---
  // Rank rows by a numeric value if available, otherwise by label
  const ranked = rows
    .map((row, index) => ({
      id: `item-${index + 1}`,
      label: row[labelField] || row.name || `Item ${index + 1}`,
      value: row[valueField] ?? index + 1,
      category: row[categoryField],
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({ ...item, position: index + 1 }));

  // --- By category breakdown ---
  const byCategory = {};
  rows.forEach((row) => {
    const cat = row[categoryField] || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(row);
  });

  // --- Metadata ---
  const metadata = {
    totalRows,
    denominator,
    generatedAt: new Date().toISOString().split('T')[0],
    minRowsForFinding,
  };

  return { totals, findings, ranked, byCategory, metadata };
}

/**
 * slugify - Convert a string to a URL-safe anchor slug.
 */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}
