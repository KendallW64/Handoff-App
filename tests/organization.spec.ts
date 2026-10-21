import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {unzipSync,strFromU8} from 'fflate';
import {createHash} from 'node:crypto';
test('select all, review destinations and download original bytes in organized ZIP',async({page})=>{
 await page.goto('./');
 await page.getByRole('button',{name:'Use my own files'}).click();
 await page.getByLabel('Upload files').setInputFiles([
 {name:'Invoice April.txt',mimeType:'text/plain',buffer:Buffer.from('Invoice total $25 due Friday.')},
 {name:'Team Notes.md',mimeType:'text/markdown',buffer:Buffer.from('# Meeting\nReview onboarding Monday.')}
 ]);
 await expect(page.getByLabel('Include Team Notes.md')).toBeVisible();
 await page.getByRole('button',{name:'Select all files',exact:true}).click();
 await expect(page.getByLabel('Include Invoice April.txt')).toBeChecked();
 await expect(page.getByLabel('Include Team Notes.md')).toBeChecked();
 await page.getByRole('button',{name:'Build folder plan',exact:true}).click();
 await page.getByLabel('Folder for Invoice April.txt',{exact:true}).fill('Finance/Invoices');
 await page.getByLabel('Filename for Invoice April.txt',{exact:true}).fill('april_invoice.txt');
 await page.getByLabel('Folder for Team Notes.md',{exact:true}).fill('../escape');
 await expect(page.getByRole('button',{name:'Download organized ZIP'})).toBeDisabled();
 await page.getByLabel('Folder for Team Notes.md',{exact:true}).fill('Meetings');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download organized ZIP'}).click();
 const download=await downloadPromise;
 const archive=unzipSync(await readFile((await download.path())!));
 expect(strFromU8(archive['Finance/Invoices/april_invoice.txt'])).toBe('Invoice total $25 due Friday.');
 const manifest=JSON.parse(strFromU8(archive['_handoff_manifest.json']));
 expect(manifest.files).toHaveLength(2);
 expect(manifest.files[0].sha256).toBe(createHash('sha256').update('Invoice total $25 due Friday.').digest('hex'));
 await expect(page.getByLabel('Include Invoice April.txt')).toBeVisible();
 await page.getByRole('button',{name:'Clear file selection'}).click();
 await expect(page.getByLabel('Include Invoice April.txt')).not.toBeChecked();
 await expect(page.getByRole('button',{name:'Download organized ZIP'})).toHaveCount(0);
});
test('Gemini organization uses consent and previews, then reviews returned destinations',async({page})=>{
 await page.route('**/api/generate',async route=>{
 const body=route.request().postDataJSON();
 expect(body.mode).toBe('organize');expect(body.contentConsent).toBe(true);
 expect(body.uploadedDocuments[0].text).toHaveLength(4000);
 await route.fulfill({json:{provider:'gemini',model:'mock-test',entries:[{id:body.sourceIds[0],folder:'Finance',name:'invoice.txt',reason:'Invoice details.'}]}});
 });
 await page.goto('./');await page.getByRole('button',{name:'Use my own files'}).click();
 await page.getByLabel('Upload files').setInputFiles({name:'invoice.txt',mimeType:'text/plain',buffer:Buffer.from('Invoice '.repeat(1000))});
 await expect(page.getByLabel('Include invoice.txt')).toBeVisible();
 await page.getByRole('button',{name:'Select all files',exact:true}).click();
 await expect(page.getByRole('button',{name:'Suggest folders with Gemini'})).toBeDisabled();
 await page.getByLabel('I am authorized to send').check();
 await page.getByRole('button',{name:'Suggest folders with Gemini'}).click();
 await expect(page.getByLabel('Folder for invoice.txt',{exact:true})).toHaveValue('Finance');
 await expect(page.getByText('AI suggestion (mock-test)',{exact:false})).toBeVisible();
});
