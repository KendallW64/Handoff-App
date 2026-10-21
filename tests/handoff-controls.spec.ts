import {test,expect} from '@playwright/test';
test('handoff name and nearby arrow open the handoff, with Delete in a separate cell',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Enter demo workspace'}).click();
 const name=page.getByRole('button',{name:'Alex Morgan Senior Cloud Consultant'});
 const arrow=page.getByRole('button',{name:'Open Alex Morgan handoff'});
 const remove=page.getByRole('button',{name:'Delete Alex Morgan handoff'});
 const a=await arrow.boundingBox(),d=await remove.boundingBox();
 expect(a).toBeTruthy();expect(d).toBeTruthy();expect(d!.x-(a!.x+a!.width)).toBeGreaterThan(48);
 await name.getByText('Alex Morgan',{exact:true}).click();
 await expect(page.getByRole('heading',{name:/Alex Morgan/})).toBeVisible();
 await page.getByRole('button',{name:'All handoffs',exact:true}).click();
 await page.getByRole('button',{name:'Open Alex Morgan handoff'}).click();
 await expect(page.getByRole('heading',{name:/Alex Morgan/})).toBeVisible();
});
