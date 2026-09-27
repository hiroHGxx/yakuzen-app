import { test, expect, type Page } from '@playwright/test';
import { newNotebook, backupJSON } from '../../src/notebook';

async function soup(page: Page) {
 await page.goto('./#recipes');
 await page.getByRole('button',{name:'れんこんと鶏肉のやさしいスープのレシピを見る'}).click();
 return page.getByRole('dialog');
}

test('memo editing, dated journal, monthly filtering and reflection persist',async({page},testInfo)=>{
 const dialog=await soup(page);
 await dialog.getByRole('textbox',{name:'料理のひとことメモ'}).fill('次は生姜を少なめに。');
 await dialog.getByRole('button',{name:'メモを保存'}).click();
 await dialog.getByRole('button',{name:'日付と感想をつけて記録する'}).click();
 await dialog.getByLabel('つくった日',{exact:true}).fill('2026-08-15');
 await dialog.getByRole('textbox',{name:'その日の感想'}).fill('家族にも好評でした。');
 await dialog.getByRole('checkbox',{name:'またつくりたい'}).check();
 await dialog.getByRole('button',{name:'記録を保存',exact:true}).click();
 await page.keyboard.press('Escape');
 await page.goto('./#notebook');
 await expect(page.locator('.memo-card')).toContainText('生姜を少なめ');
 await page.getByRole('tab',{name:'つくった記録',exact:true}).click();
 await expect(page.locator('.journal-entry')).toContainText('家族にも好評');
 await page.getByRole('button',{name:'記録を編集'}).click();
 await page.getByRole('textbox',{name:'その日の感想'}).fill('次は小さな器に。');
 await page.getByRole('button',{name:'記録を保存',exact:true}).click();
 await page.reload();
 await page.getByRole('tab',{name:'つくった記録',exact:true}).click();
 await expect(page.locator('.journal-entry')).toContainText('次は小さな器に。');
 await page.getByLabel('記録の月').selectOption('2026-08');
 await page.getByRole('checkbox',{name:'またつくりたい'}).check();
 await expect(page.locator('.journal-entry')).toHaveCount(1);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`.local/screenshots/${testInfo.project.name}-journal-expanded.png`,fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'記録を追加'}).click();
 await page.getByLabel('記録する料理').selectOption('lotus-soup');
 await page.getByLabel('つくった日',{exact:true}).fill('2026-08-15');
 await page.getByRole('button',{name:'記録を保存',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('同じ日付で記録済み');
 await page.getByRole('button',{name:'キャンセル',exact:true}).click();
 await page.getByRole('tab',{name:'振り返り'}).click();
 await expect(page.locator('.reflection-favorites')).toContainText('1回、食卓に。');
 await page.locator('.reflection-favorites button').click();
 await expect(page.getByRole('textbox',{name:'料理のひとことメモ'})).toHaveValue('次は生姜を少なめに。');
 await page.getByRole('dialog').getByRole('button',{name:'削除',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'料理のひとことメモ'})).toHaveValue('');
 await page.keyboard.press('Escape');
 await page.getByRole('tab',{name:'つくった記録',exact:true}).click();
 await page.getByRole('button',{name:'れんこんと鶏肉のやさしいスープの記録を削除'}).click();
 await page.getByRole('button',{name:'この記録を削除',exact:true}).click();
 await expect(page.locator('.journal-entry')).toHaveCount(0);
});

test('shopping groups shared ingredients, custom additions and unit differences',async({page},testInfo)=>{
 const dialog=await soup(page);
 await dialog.getByRole('button',{name:'買い物リストに追加'}).click();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'梨と生姜の小さなコンポートのレシピを見る'}).click();
 await dialog.getByRole('button',{name:'買い物リストに追加'}).click();
 await page.keyboard.press('Escape');
 await page.goto('./#notebook');
 await page.getByRole('tab',{name:'買い物リスト'}).click();
 const ginger=page.locator('.shopping-aggregate').filter({has:page.getByRole('checkbox',{name:'生姜を購入済みにする'})});
 await expect(ginger.locator('.shopping-amount')).toHaveText('8 g');
 await ginger.locator('summary').click();
 await expect(ginger).toContainText('コンポート');
 await page.getByLabel('買い足すもの',{exact:true}).fill('生姜');
 await page.getByLabel('買い足す数量').fill('1');
 await page.getByLabel('買い足す単位').fill('個');
 await page.getByRole('button',{name:'追加',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'生姜を購入済みにする'})).toHaveCount(2);
 await ginger.filter({hasText:'8 g'}).getByRole('checkbox').check();
 await page.getByRole('button',{name:'チェック済みを削除'}).click();
 await expect(page.getByRole('checkbox',{name:'生姜を購入済みにする'})).toHaveCount(1);
 await page.getByRole('button',{name:'未購入リストをコピー'}).click();
 await expect(page.getByRole('status').filter({hasText:'未購入の買い物リストをコピーしました'}).or(page.getByLabel('コピー用の買い物リスト'))).toBeVisible();
 await page.screenshot({path:`.local/screenshots/${testInfo.project.name}-shopping-expanded.png`,fullPage:true,animations:'disabled'});
 await page.reload();await page.getByRole('tab',{name:'買い物リスト'}).click();
 await expect(page.locator('.shopping-aggregate').filter({has:page.getByRole('checkbox',{name:'生姜を購入済みにする'})})).toContainText('1 個');
});

test('cooking progress resumes from home after reload and can restart explicitly',async({page})=>{
 const dialog=await soup(page);
 await dialog.getByRole('button',{name:'人数を増やす'}).click();
 await dialog.getByRole('checkbox',{name:/鶏もも肉/}).check();
 await dialog.getByRole('button',{name:'調理の続きへ'}).click();
 await dialog.getByRole('button',{name:'完了して、次へ'}).click();
 await page.reload();await page.goto('./#today');
 await expect(page.locator('.personal-table')).toContainText('つくりかけ · 1/3工程');
 await page.locator('.personal-table button').click();
 await expect(dialog.getByRole('checkbox',{name:/鶏もも肉/})).toBeChecked();
 await dialog.getByRole('button',{name:'調理の続きへ'}).click();
 await expect(dialog.getByRole('button',{name:'工程2を見る'})).toHaveAttribute('aria-current','step');
 await dialog.getByRole('button',{name:'レシピに戻る'}).click();
 await dialog.getByRole('button',{name:'最初からつくる',exact:true}).click();
 await dialog.getByRole('button',{name:'進み具合を消して最初から'}).click();
 await expect(dialog.getByRole('checkbox',{name:/鶏もも肉/})).not.toBeChecked();
 await expect(dialog.locator('.stepper')).toContainText('2人分');
});

test('timer pauses, survives navigation and reload, completes and resets',async({page})=>{
 await page.clock.install();
 const dialog=await soup(page);
 await dialog.getByRole('button',{name:'調理をはじめる'}).click();
 await dialog.getByLabel('タイマーの分数').fill('1');
 await dialog.getByRole('button',{name:'開始',exact:true}).click();
 await expect(dialog.getByRole('timer')).toHaveText('01:00');
 await page.clock.runFor(10000);
 await dialog.getByRole('button',{name:'一時停止',exact:true}).click();
 await expect(dialog.getByRole('timer')).toHaveText('00:50');
 await page.keyboard.press('Escape');await page.goto('./#notebook');
 await page.clock.runFor(5000);
 await expect(page.getByRole('timer')).toHaveText('00:50');
 await page.reload();
 await expect(page.getByRole('timer')).toHaveText('00:50');
 await page.getByRole('button',{name:'再開',exact:true}).click();
 await page.clock.runFor(51000);
 await expect(page.getByRole('timer')).toHaveText('00:00');
 await expect(page.locator('.timer-status')).toContainText('時間になりました');
 await page.getByRole('button',{name:'タイマーをリセット'}).click();
 await expect(page.getByRole('timer')).toHaveCount(0);
});

test('backup export, preview, cancellation, rejection and restore preserve all personal data',async({page})=>{
 const notebook=newNotebook();notebook.saved=['lotus-soup'];notebook.notes={'lotus-soup':'復元するメモ'};
 notebook.cooked=[{id:'old',recipeId:'lotus-soup',date:'2026-08-20',comment:'復元する感想',again:true}];
 notebook.shopping=[{id:'x',recipeId:'custom',name:'お茶',amount:2,unit:'袋',checked:true}];
 notebook.drafts={'lotus-soup':{servings:4,prepared:['生姜'],finished:[0],step:1,updatedAt:1}};
 notebook.timer={durationMs:60000,remainingMs:20000,endsAt:null};
 notebook.meals=[{id:'meal-1',name:'復元する献立',recipeIds:['lotus-soup'],servings:3}];notebook.learning={nature:{saved:true,read:true,note:'復元する学び'}};
 await page.goto('./#notebook');
 const input=page.getByLabel('手帖のバックアップファイル');
 await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupJSON(notebook))});
 await expect(page.getByRole('region',{name:'復元内容の確認'})).toContainText('メモ 1件');
 await page.getByRole('button',{name:'復元をキャンセル'}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kinozen-notebook-v1')!).saved)).toEqual([]);
 await input.setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
 await expect(page.getByRole('alert')).toContainText('JSON');
 await expect(page.getByRole('button',{name:'この内容で置き換えて復元'})).toHaveCount(0);
 await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupJSON(notebook))});
 await page.getByRole('button',{name:'この内容で置き換えて復元'}).click();
 await expect(page.locator('.memo-card')).toContainText('復元するメモ');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'手帖を書き出す'}).click();
 const download=await downloadPromise;const stream=await download.createReadStream();
 const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(Buffer.from(chunk));
 expect(JSON.parse(Buffer.concat(chunks).toString()).data).toEqual(notebook);
 await page.reload();await expect(page.getByRole('timer')).toHaveText('00:20');
 await page.getByRole('button',{name:'手帖のデータを削除',exact:true}).click();
 await page.getByRole('button',{name:'すべて削除',exact:true}).click();
 await expect(page.getByRole('timer')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kinozen-notebook-v1')!))).toEqual(newNotebook());
});

test('expanded personal screens and editors fit 320px, and new dictionary entries link to recipes',async({page},testInfo)=>{
 await page.setViewportSize({width:320,height:850});
 const dialog=await soup(page);
 await dialog.getByRole('button',{name:'日付と感想をつけて記録する'}).click();
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.keyboard.press('Escape');
 await page.goto('./#notebook');
 for(const tab of ['保存したレシピ','買い物リスト','つくった記録','振り返り']) {
  await page.getByRole('tab',{name:tab,exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tab).toBe(true);
 }
 await page.goto('./#learn');await page.getByRole('tab',{name:'食材辞典'}).click();
 await expect(page.locator('.food-card')).toHaveCount(16);
 await page.getByRole('textbox',{name:'食材辞典を検索'}).fill('なす');
 await page.locator('.food-card').click();await page.getByRole('button',{name:'この食材のレシピを見る'}).click();
 await expect(page.locator('.recipe-card')).toHaveCount(1);
 await page.getByRole('button',{name:'なすの生姜蒸しのレシピを見る'}).click();
 await expect(dialog).toBeVisible();
 await page.screenshot({path:`.local/screenshots/${testInfo.project.name}-new-recipe.png`,animations:'disabled'});
});
