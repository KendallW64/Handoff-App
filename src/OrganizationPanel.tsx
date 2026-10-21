import {useState} from 'react';
import {localOrganization, validateOrganization, type OrganizationEntry} from './organization';
import type {UploadRecord} from './documents';

export type SavedOrganization = {entries: OrganizationEntry[]; model?: string};
function exportZip(entries: OrganizationEntry[], records: UploadRecord[], model?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./zip.worker.ts', import.meta.url), {type:'module'});
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(Error('ZIP creation took too long. Select fewer files.')); }, 60000);
    worker.onerror = () => { finish(); reject(Error('The ZIP could not be created. Select fewer files and try again.')); };
    worker.onmessage = event => {
      finish();
      if (event.data.error) { reject(Error(event.data.error)); return; }
      if (!(event.data.buffer instanceof ArrayBuffer)) { reject(Error('The ZIP worker returned an invalid archive.')); return; }
      const url=URL.createObjectURL(new Blob([event.data.buffer],{type:'application/zip'}));
      const link=document.createElement('a');link.href=url;link.download='handoff-organized-files.zip';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),60000);resolve();
    };
    worker.postMessage({entries,records,model});
  });
}
export function OrganizationPanel({records,plan,busy,aiEnabled,onChange,onAi}:{records:UploadRecord[];plan?:SavedOrganization;busy:boolean;aiEnabled:boolean;onChange:(plan:SavedOrganization)=>void;onAi:()=>void}) {
  const [exporting,setExporting]=useState(false),[error,setError]=useState('');
  const documents=records.map(record=>record.resource);
  let validation='';
  if (plan) { try { validateOrganization(plan.entries,documents); } catch(error){validation=error instanceof Error?error.message:'Review the file plan.';} }
  const change=(index:number,field:'folder'|'name',value:string)=>{
    if(!plan)return;
    onChange({...plan,entries:plan.entries.map((entry,i)=>i===index?{...entry,[field]:value}:entry)});
    setError('');
  };
  return <section className="organization-panel" aria-label="File organization">
    <div className="panel-heading"><div><h3>Give every file a place</h3><p>Create a folder and naming plan, review it, then download your originals in an organized ZIP.</p></div></div>
    <p className="subtle">Local suggestions use filenames and text keywords without sending anything to Google. AI suggestions use filenames, up to 4,000 extracted characters per file, and selected PDF/image originals (3 MB combined). Up to 20 files per plan; 50 MB total originals per ZIP. AI uses one shared daily request.</p>
    <div className="organization-actions">
      <button className="btn secondary" disabled={!records.length||busy||exporting} onClick={()=>{try{onChange({entries:localOrganization(documents)});setError('');}catch(error){setError(error instanceof Error?error.message:'Could not organize files.');}}}>Build folder plan</button>
      <button className="btn" disabled={!records.length||!aiEnabled||busy||exporting} onClick={()=>{setError('');onAi();}}>Suggest folders with Gemini</button>
    </div>
    {!records.length&&<p>Select uploaded files above to organize them. Built-in demo documents are not included in ZIP exports.</p>}
    {plan&&<><p className="subtle">{plan.model?'AI suggestion ('+plan.model+') · review and edit every destination.':'Local folder plan · review and edit every destination.'} Originals are unchanged; names apply only inside the downloaded archive.</p>
      <div className="organization-rows">{plan.entries.map((entry,index)=><article key={entry.id} className="organization-row">
        <b>{documents.find(doc=>doc.id===entry.id)?.title||'Unavailable source'}</b>
        <label>Folder<input aria-label={'Folder for '+(documents.find(doc=>doc.id===entry.id)?.title||entry.id)} value={entry.folder} maxLength={180} onChange={event=>change(index,'folder',event.target.value)}/></label>
        <label>Filename<input aria-label={'Filename for '+(documents.find(doc=>doc.id===entry.id)?.title||entry.id)} value={entry.name} maxLength={180} onChange={event=>change(index,'name',event.target.value)}/></label>
        <small>{entry.reason}</small><code>{entry.folder?entry.folder+'/':''}{entry.name}</code>
      </article>)}</div>
      {validation&&<p role="alert" className="notice">{validation}</p>}
      <button className="btn" disabled={!!validation||busy||exporting} onClick={async()=>{setExporting(true);setError('');try{await exportZip(validateOrganization(plan.entries,documents),records,plan.model);}catch(error){setError(error instanceof Error?error.message:'ZIP export failed.');}finally{setExporting(false);}}}>{exporting?'Creating ZIP…':'Download organized ZIP'}</button>
      <p className="subtle">Includes _handoff_manifest.json mapping original names to export paths, reasons, sizes, and SHA-256 checksums. No file content is uploaded to create the ZIP.</p>
    </>}
    {error&&<p role="alert" className="notice">{error}</p>}
  </section>;
}

