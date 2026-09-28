import {test,expect} from '@playwright/test';
import {newNotebook} from '../../src/notebook';
test('meal creation, shopping, reload, editing, deletion and pantry matching',async({page},info)=>{
 await page.goto('./#recipes');await page.getByRole('button',{name:'献立づくり',exact:true}).click();
 await page.getByLabel('主食を選ぶ').selectOption('pea-rice');await page.getByLabel('主菜を選ぶ').selectOption('chicken-ginger');
 await page.getByLabel('献立の人数').selectOption('3');await page.getByLabel('献立の名前').fill('春の晩ごはん');
 await page.getByRole('button',{name:'献立を保存',exact:true}).click();await expect(page.locator('.saved-meal')).toContainText('春の晩ごはん');
 await page.getByRole('button',{name:'献立の材料を買い物へ'}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kinozen-notebook-v1')!).shopping.find((x:{name:string})=>x.name==='鶏もも肉').amount)).toBe(375);
 await page.reload();await page.getByRole('button',{name:'献立づくり',exact:true}).click();await page.getByRole('button',{name:'この献立を使う・編集'}).click();await expect(page.getByLabel('献立の人数')).toHaveValue('3');
 await page.screenshot({path:`.local/screenshots/${info.project.name}-meal.png`,fullPage:true});
 await page.getByLabel('献立の名前').fill('編集した献立');await page.getByRole('button',{name:'献立を保存',exact:true}).click();await expect(page.locator('.saved-meal')).toHaveCount(1);
 await page.getByRole('button',{name:'献立を削除',exact:true}).click();await expect(page.locator('.saved-meal')).toHaveCount(0);
 await page.getByRole('button',{name:'家にある食材',exact:true}).click();await page.getByRole('button',{name:'豆腐',exact:true}).click();await page.getByRole('button',{name:'しめじ',exact:true}).click();
 await expect(page.locator('.pantry-results article').filter({hasText:'豆腐のきのこあんかけ'})).toContainText('主な材料がそろっています');
});
test('self check never persists answers; lessons save notes and explain quiz answers',async({page},info)=>{
 await page.goto('./');await page.getByText('今日の自分を振り返る（6問）',{exact:true}).click();await page.getByLabel('寒さが気になる',{exact:true}).check();await page.getByLabel('15分以内',{exact:true}).check();
 await page.getByRole('button',{name:'今日の回答を振り返る'}).click();await expect(page.locator('.check-result')).toContainText('寒さが気になる');
 expect(await page.evaluate(()=>localStorage.getItem('kinozen-notebook-v1'))).not.toContain('寒さが気になる');
 await page.getByRole('button',{name:'小さな教室へ',exact:true}).click();await page.locator('.lesson-pills button').filter({hasText:'五性'}).click();await page.getByRole('button',{name:'学びを保存',exact:true}).click();await page.getByRole('button',{name:'読了にする',exact:true}).click();await page.getByLabel('学びのメモ').fill('提供温度と分類を分ける');
 await page.getByRole('button',{name:'伝統的な食材分類',exact:true}).click();await expect(page.locator('.academy-reading')).toContainText('正解です。');
 await page.screenshot({path:`.local/screenshots/${info.project.name}-academy.png`,fullPage:true});
 await page.reload();await page.locator('.lesson-pills button').filter({hasText:'五性'}).click();await expect(page.getByLabel('学びのメモ')).toHaveValue('提供温度と分類を分ける');
 await page.goto('./#today');await page.getByText('今日の自分を振り返る（6問）',{exact:true}).click();await expect(page.getByLabel('寒さが気になる',{exact:true})).not.toBeChecked();
});
test('calendar reuses a day and all expanded views fit a narrow phone',async({page})=>{
 await page.setViewportSize({width:320,height:850});await page.goto('./#notebook');
 const n=newNotebook();n.cooked=[{id:'a',recipeId:'lotus-soup',date:'2026-09-01',comment:'',again:false},{id:'b',recipeId:'pea-rice',date:'2026-09-01',comment:'',again:false}];
 await page.evaluate(value=>localStorage.setItem('kinozen-notebook-v1',JSON.stringify(value)),n);await page.reload();
 await page.getByRole('tab',{name:'暦と献立',exact:true}).click();await page.getByLabel('カレンダーの月').fill('2026-09');await page.getByRole('button',{name:'2026-09-01 2品',exact:true}).click();await page.getByRole('button',{name:'この日の料理を献立に保存'}).click();await expect(page.locator('.saved-meal')).toContainText('2026-09-01の食卓');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('./#recipes');for(const t of ['献立づくり','家にある食材']){await page.getByRole('button',{name:t,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto('./#learn');await page.getByRole('tab',{name:'季節の暦',exact:true}).click();await expect(page.locator('.feature-grid article')).toHaveCount(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
