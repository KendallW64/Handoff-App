import {test,expect} from '@playwright/test';
test('BOM-marked UTF-16 LE/BE CSV files import readable content',async({page})=>{
 const text='Customer,Amount\nCafé,25';
 const le=Buffer.concat([Buffer.from([255,254]),Buffer.from(text,'utf16le')]);
 const be=Buffer.from(le);for(let i=0;i<be.length;i+=2){const b=be[i];be[i]=be[i+1];be[i+1]=b;}
 await page.goto('./');await page.getByRole('button',{name:'Use my own files'}).click();
 await expect(page.getByLabel('Upload files')).toBeEnabled();
 await page.getByLabel('Upload files').setInputFiles([{name:'le.csv',mimeType:'text/csv',buffer:le},{name:'be.csv',mimeType:'text/csv',buffer:be}]);
 await expect(page.getByLabel('Include be.csv')).toBeVisible();
 for(const name of ['le.csv','be.csv']){
 await page.locator('.resource-row').filter({has:page.getByText(name,{exact:true})}).getByRole('button',{name:'Read source'}).click();
 await expect(page.getByRole('dialog')).toContainText('Café,25');
 await page.getByRole('button',{name:'Close source'}).click();
 }
});
test('too many summary files fail preflight without making a request or using quota',async({page})=>{
 let calls=0;await page.route('**/api/generate',async r=>{calls++;await r.fulfill({status:500,json:{error:'Must not be sent'}})});
 await page.goto('./');await page.getByRole('button',{name:'Use my own files'}).click();await expect(page.getByLabel('Upload files')).toBeEnabled();
 await page.getByLabel('Upload files').setInputFiles(Array.from({length:9},(_,i)=>({name:i+'.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic document '+i)})));
 await expect(page.getByLabel('Include 8.txt')).toBeVisible();await page.getByRole('button',{name:'Select all files',exact:true}).click();await page.getByLabel('I am authorized to send').check();
 await page.getByRole('button',{name:'Generate document summary',exact:true}).click();await expect(page.getByRole('alert')).toContainText('up to 8 uploaded files');expect(calls).toBe(0);
 // The same selection remains valid for a local organization plan.
 await page.getByRole('button',{name:'Build folder plan',exact:true}).click();await expect(page.getByRole('button',{name:'Download organized ZIP'})).toBeEnabled();
});
test('browser distinguishes connection failure from deadline without retrying',async({page})=>{
 let calls=0;
 await page.route('**/api/generate',async route=>{calls++;await route.abort('failed');});
 await page.goto('./');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Enter demo workspace'}).click();await page.getByRole('button',{name:'Ask Handoff',exact:true}).click();await page.getByRole('checkbox',{name:'Use Gemini AI'}).check();
 await page.getByRole('button',{name:'What are the migration steps?'}).click();await expect(page.getByRole('alert')).toContainText('connection failed');expect(calls).toBe(1);await expect(page.locator('.answer')).toHaveCount(0);
});
