import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resources,initialHandoffs,manual} from '../src/data.ts';
const root=new URL('../docs/demo-sources/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
test('every built-in source is a verbatim quotation from the pinned official handbook snapshot',()=>{
 assert.equal(resources.length,manifest.sources.length);
 for(const doc of resources){const source=manifest.sources.find(s=>s.id===doc.id);assert.ok(source);const raw=readFileSync(new URL(source.file,root));
 assert.equal(createHash('sha256').update(raw).digest('hex'),source.sha256);
 for(const quote of source.quotes)assert.ok(raw.toString('utf8').includes(quote));
 assert.equal(doc.text,source.quotes.join('\n\n'));assert.ok(source.revisionUrl.includes(manifest.revision));assert.ok(source.revisionUrl.startsWith('https://gitlab.com/gitlab-com/content-sites/handbook/'));
 }
});
test('initial demo has no invented employees, dates, approvals or generated activity',()=>{
 assert.equal(initialHandoffs.length,3);
 for(const h of initialHandoffs){assert.equal(h.type,'Public-document review');assert.equal(h.due,'Not specified');assert.equal(h.generated,false);assert.equal(h.approved,false);
 assert.ok(h.selected.every(id=>resources.some(r=>r.id===id)));assert.match(manual(h)[0].body,/No specific employee/);
 }
});
