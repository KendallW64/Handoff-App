import type { Resource } from './data.ts';

export type OrganizationEntry = { id: string; folder: string; name: string; reason: string };
export function extension(name: string) { return name.match(/\.[^.]+$/)?.[0].toLowerCase() || ''; }
function safeSegment(raw: string) {
  const value = raw.normalize('NFKC');
  return !!value && value === value.trim() && value !== '.' && value !== '..' && value.length <= 180 &&
    !/[\/<>:"\\|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(value) &&
    !/[. ]$/.test(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value.split('.')[0].trim());
}
export function validateOrganization(value: unknown, documents: Resource[]): OrganizationEntry[] {
  if (!Array.isArray(value) || !documents.length || value.length !== documents.length || value.length > 20) throw Error('The plan must include each selected uploaded file exactly once (up to 20 files).');
  const ids = new Set<string>(), paths = new Set<string>();
  const entries = value.map(item => {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) || !documents.some(doc => doc.id === item.id)) throw Error('The plan contains a missing, repeated, or unknown file.');
    ids.add(item.id);
    if (typeof item.folder !== 'string' || item.folder.length > 180 || (item.folder && item.folder.split('/').some((part: string) => !safeSegment(part)))) throw Error('Use relative folder paths with safe names; no empty segments, backslashes, or dot segments.');
    if (typeof item.name !== 'string' || item.name.includes('/') || !safeSegment(item.name)) throw Error('Use a safe filename without slashes or reserved characters.');
    const original = documents.find(doc => doc.id === item.id)!;
    if (extension(item.name) !== extension(original.title)) throw Error('Keep each original file extension when renaming.');
    const path = (item.folder ? item.folder + '/' : '') + item.name;
    const normalized = path.normalize('NFKC').toLowerCase();
    if ((normalized === '_handoff_manifest.json' || normalized.startsWith('_handoff_manifest.json/')) || paths.has(normalized)) throw Error('Two files have the same destination, or use the reserved manifest name. Rename one before exporting.');
    paths.add(normalized);
    return { id: item.id, folder: item.folder, name: item.name, reason: typeof item.reason === 'string' ? item.reason.slice(0, 500) : '' };
  });
  for (const entry of entries) {
    const segments = entry.folder.split('/').filter(Boolean);
    for (let i = 1; i <= segments.length; i++) {
      if (paths.has(segments.slice(0, i).join('/').normalize('NFKC').toLowerCase())) throw Error('A destination file conflicts with a folder in this plan.');
    }
  }
  return entries;
}
const groups: [string, RegExp][] = [
  ['01_Finance', /\b(invoice|budget|expense|payment|revenue|payroll|financial|tax)\b/gi],
  ['02_People', /\b(employee|onboarding|recruitment|benefits|human resources|hiring|training)\b/gi],
  ['03_Legal', /\b(contract|agreement|nda|legal|liability|terms)\b/gi],
  ['04_Clients', /\b(client|customer|account|proposal|renewal)\b/gi],
  ['05_Projects', /\b(project|migration|milestone|deliverable|implementation|sprint)\b/gi],
  ['06_Marketing', /\b(marketing|campaign|brand|advertising|social media)\b/gi],
  ['07_Meetings', /\b(meeting|minutes|agenda|attendees)\b/gi],
  ['08_Policies', /\b(policy|procedure|runbook|checklist|guideline)\b/gi],
  ['09_Operations', /\b(operations|inventory|incident|support|maintenance)\b/gi],
];
export function localOrganization(documents: Resource[]): OrganizationEntry[] {
  const destinations = new Set<string>();
  const plan = documents.map(doc => {
    const scored = groups.map(([folder, pattern]) => ({folder, score: (doc.title.match(pattern)?.length || 0) * 3 + ((doc.inlineData ? '' : doc.text || '').slice(0, 12000).match(pattern)?.length || 0)})).sort((a, b) => b.score - a.score);
    const ext = extension(doc.title);
    const type = ['.xlsx', '.csv'].includes(ext) ? 'Spreadsheets' : ext === '.pptx' ? 'Presentations' : ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? 'Images' : ext === '.eml' ? 'Email' : 'Documents';
    const folder = (scored[0]?.score ? scored[0].folder : '10_General') + '/' + type;
    let base = doc.title.slice(0, doc.title.length - ext.length).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'document';
    if (!safeSegment(base + ext)) base = 'file_' + base;
    let name = base + ext, suffix = 2;
    while (destinations.has((folder + '/' + name).toLowerCase())) name = base + '_' + String(suffix++).padStart(2, '0') + ext;
    destinations.add((folder + '/' + name).toLowerCase());
    return {id: doc.id, folder, name, reason: scored[0]?.score ? 'Local rules matched filename/content keywords; review the category.' : 'No strong category match; placed in General for review.'};
  });
  return validateOrganization(plan, documents);
}

