import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateOrganization,localOrganization} from '../src/organization.ts';
const docs=[
 {id:'upload_invoice',title:'Invoice FINAL.txt',category:'Uploaded file',origin:'upload',text:'Invoice payment due Friday.'},
 {id:'upload_notes',title:'Meeting Notes.txt',category:'Uploaded file',origin:'upload',text:'Meeting agenda and attendees.'}
];
const plan=()=>docs.map((doc,i)=>({id:doc.id,folder:i?'Meetings':'Finance',name:i?'meeting_notes.txt':'invoice_final.txt',reason:'Content classification'}));
test('local organization proposes relative folders and consistent names without modifying originals',()=>{
 const before=JSON.stringify(docs);const result=localOrganization(docs);
 assert.equal(result.length,2);assert.match(result[0].folder,/Finance/);assert.equal(result[0].name,'invoice_final.txt');assert.match(result[1].folder,/Meetings/);
 assert.equal(JSON.stringify(docs),before);assert.deepEqual(validateOrganization(result,docs),result);
});
test('organization requires exactly one entry per selected file and original extensions',()=>{
 assert.throws(()=>validateOrganization(plan().slice(1),docs));
 assert.throws(()=>validateOrganization([plan()[0],plan()[0]],docs));
 assert.throws(()=>validateOrganization([{...plan()[0],id:'another-file'},plan()[1]],docs));
 assert.throws(()=>validateOrganization([{...plan()[0],name:'renamed.pdf'},plan()[1]],docs));
});
test('ZIP paths reject traversal, absolute paths, control characters, reserved names and Unicode equivalents',()=>{
 for(const folder of ['../outside','/absolute','Finance/..','Finance//Bad','C:/drive','Finance\\Bad','\uff0e\uff0e/Bad','Finance/CON','Finance\u0000Bad',' Finance']){
  assert.throws(()=>validateOrganization([{...plan()[0],folder},plan()[1]],docs),folder);
 }
 for(const name of ['../bad.txt','bad/name.txt','CON.txt','CON .txt','bad\\name.txt','bad\u202efile.txt','bad.txt ']){
  assert.throws(()=>validateOrganization([{...plan()[0],name},plan()[1]],docs),name);
 }
});
test('organization detects case-insensitive collisions and file/folder conflicts',()=>{
 assert.throws(()=>validateOrganization([{...plan()[0],folder:'Finance',name:'same.txt'},{...plan()[1],folder:'finance',name:'SAME.txt'}],docs));
 assert.throws(()=>validateOrganization([{...plan()[0],folder:'',name:'Finance.txt'},{...plan()[1],folder:'Finance.txt',name:'notes.txt'}],docs));
});
test('duplicate source filenames get unique local destinations',()=>{
 const result=localOrganization([docs[0],{...docs[0],id:'upload_copy'}]);assert.notEqual(result[0].name,result[1].name);
});

