import {test,expect} from '@playwright/test';
test('handoff name and nearby arrow open the handoff, with Delete in a separate cell',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Enter demo workspace'}).click();
 const name=page.getByRole('button',{name:'Handbook-first working Public handbook topic'});
 const arrow=page.getByRole('button',{name:'Open Handbook-first working handoff'});
 const remove=page.getByRole('button',{name:'Delete Handbook-first working handoff'});
 const a=await arrow.boundingBox(),d=await remove.boundingBox();
 expect(a).toBeTruthy();expect(d).toBeTruthy();expect(d!.x-(a!.x+a!.width)).toBeGreaterThan(48);
 await name.getByText('Handbook-first working',{exact:true}).click();
 await expect(page.getByRole('heading',{name:/Handbook-first working/})).toBeVisible();
 await page.getByRole('button',{name:'All handoffs',exact:true}).click();
 await page.getByRole('button',{name:'Open Handbook-first working handoff'}).click();
 await expect(page.getByRole('heading',{name:/Handbook-first working/})).toBeVisible();
});
