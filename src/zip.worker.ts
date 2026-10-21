import {zipSync, strToU8} from 'fflate';
import {validateOrganization, type OrganizationEntry} from './organization.ts';
import type {UploadRecord} from './documents';
self.onmessage = async (event: MessageEvent<{entries: OrganizationEntry[]; records: UploadRecord[]; model?: string}>) => {
  try {
    const {entries, records, model} = event.data;
    const plan = validateOrganization(entries, records.map(record => record.resource));
    if (records.reduce((sum, record) => sum + record.original.size, 0) > 50 * 1024 * 1024) throw Error('This ZIP exceeds the 50 MB export limit. Select fewer files.');
    const files: Record<string, Uint8Array> = Object.create(null);
    const manifest = [];
    for (const entry of plan) {
      const record = records.find(record => record.id === entry.id)!;
      const bytes = new Uint8Array(await record.original.arrayBuffer());
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      const path = (entry.folder ? entry.folder + '/' : '') + entry.name;
      files[path] = bytes;
      manifest.push({originalName: record.resource.title, exportedPath: path, bytes: bytes.length, sha256, reason: entry.reason});
    }
    files['_handoff_manifest.json'] = strToU8(JSON.stringify({createdAt: new Date().toISOString(), planner: model ? 'Gemini: ' + model : 'Local rules / user edits', files: manifest}, null, 2));
    const zip = zipSync(files, {level: 3});
    const buffer=zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength) as ArrayBuffer;
    self.postMessage({buffer}, {transfer: [buffer]});
  } catch (error) { self.postMessage({error: error instanceof Error ? error.message : 'Could not export ZIP.'}); }
};

