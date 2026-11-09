import {test,expect} from '@playwright/test';
test('GitLab demo separates verified handbook content from browser-only activity and old demo storage',async({page})=>{
 await page.goto('./');await page.evaluate(()=>localStorage.setItem('handoff-demo-v1',JSON.stringify([{id:'h1',name:'Old invented person'}])));await page.reload();
 await page.getByRole('button',{name:'Explore the demo'}).click();await expect(page.getByText('GitLab · Public handbook',{exact:true})).toBeAttached();await expect(page.getByText(/No affiliation or endorsement/)).toBeVisible();await page.getByRole('button',{name:'Enter demo workspace'}).click();
 await expect(page.getByText('Counts below describe',{exact:false})).toBeVisible();
 await expect(page.getByRole('button',{name:'Handbook-first working Public handbook topic'})).toBeVisible();await expect(page.getByText('Old invented person')).toHaveCount(0);await expect(page.getByText('Jamie Davis')).toHaveCount(0);await expect(page.getByText(/Fictional records/)).toHaveCount(0);
 await page.getByRole('button',{name:'Open Remote onboarding review handoff'}).click();await page.getByRole('tab',{name:'Knowledge',exact:true}).click();await page.getByRole('button',{name:'Generate sample manual'}).click();await expect(page.getByText(/No specific employee/)).toBeVisible();await expect(page.getByText(/two full weeks/).first()).toBeVisible();
});
