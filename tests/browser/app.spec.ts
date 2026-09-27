import { test, expect } from '@playwright/test';

test('home renders all photography without horizontal page overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /季節をひとさじ、\s*わたしの食卓へ。/ })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `.local/screenshots/${testInfo.project.name}-home.png`, fullPage: true, animations: 'disabled' });
  expect(errors).toEqual([]);
});

test('recipe search, servings, saved recipes, shopping and cooked history persist', async ({ page }, testInfo) => {
  await page.goto('./#recipes');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.length === 6 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: `.local/screenshots/${testInfo.project.name}-recipes.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('textbox', { name: 'レシピや食材を検索' }).fill('れんこん 鶏肉');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'れんこんと鶏肉のやさしいスープのレシピを見る' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: `.local/screenshots/${testInfo.project.name}-recipe-detail.png`, animations: 'disabled' });
  await dialog.getByRole('button', { name: '手帖に保存' }).click();
  await expect(dialog.getByRole('status')).toHaveText('レシピを手帖に保存しました');
  await dialog.getByRole('button', { name: '人数を増やす' }).click();
  await expect(dialog.locator('.ingredient-list li').filter({ hasText: '鶏もも肉' })).toContainText('225 g');
  await dialog.getByRole('button', { name: '買い物リストに追加' }).click();
  await dialog.getByRole('button', { name: '今日つくった、と記録する' }).click();
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click();
  await page.goto('./#notebook');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.getByRole('tab', { name: '買い物リスト' }).click();
  await expect(page.locator('.shopping-item')).toHaveCount(7);
  await page.screenshot({ path: `.local/screenshots/${testInfo.project.name}-shopping.png`, fullPage: true, animations: 'disabled' });
  await page.locator('.shopping-item').filter({ hasText: '鶏もも肉' }).getByRole('checkbox').check();
  await page.reload();
  await page.getByRole('tab', { name: '買い物リスト' }).click();
  await expect(page.locator('.shopping-item').filter({ hasText: '鶏もも肉' }).getByRole('checkbox')).toBeChecked();
  await page.getByRole('button', { name: 'チェック済みを削除' }).click();
  await expect(page.locator('.shopping-item')).toHaveCount(6);
  await page.getByRole('tab', { name: 'つくった記録' }).click();
  await expect(page.locator('.cooked-list article')).toHaveCount(1);
  await page.getByRole('button', { name: '手帖のデータを削除', exact: true }).click();
  await page.getByRole('button', { name: '残しておく' }).click();
  await expect(page.locator('.cooked-list article')).toHaveCount(1);
  await page.getByRole('button', { name: '手帖のデータを削除', exact: true }).click();
  await page.getByRole('button', { name: 'すべて削除', exact: true }).click();
  await expect(page.getByRole('heading', { name: '今日のひと皿が、思い出に。' })).toBeVisible();
});

test('filter empty state can recover and dictionary links to matching recipes', async ({ page }) => {
  await page.goto('./#recipes');
  await page.getByRole('textbox', { name: 'レシピや食材を検索' }).fill('存在しない食材');
  await expect(page.locator('.recipe-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'すべてのレシピを見る' }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(6);
  await page.getByRole('checkbox', { name: '15分以内' }).check();
  await expect(page.locator('.recipe-card')).toHaveCount(3);
  await page.goto('./#learn');
  await page.getByRole('tab', { name: '食材辞典' }).click();
  await page.getByRole('textbox', { name: '食材辞典を検索' }).fill('なし');
  await expect(page.locator('.food-card')).toHaveCount(1);
  await page.locator('.food-card').click();
  await page.getByRole('button', { name: 'この食材のレシピを見る' }).click();
  await expect(page).toHaveURL(/#recipes$/);
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await expect(page.locator('.recipe-card h3')).toHaveText('梨と生姜の小さなコンポート');
});

test('learning quiz completes and modal Escape closes', async ({ page }, testInfo) => {
  await page.goto('./#learn');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.local/screenshots/${testInfo.project.name}-learn.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('tab', { name: 'クイズ' }).click();
  await page.getByRole('button', { name: '02 24' }).click();
  await page.getByRole('button', { name: '次の問いへ' }).click();
  await page.getByRole('button', { name: '02 塩からい味' }).click();
  await page.getByRole('button', { name: '次の問いへ' }).click();
  await page.getByRole('button', { name: '02 弱火でやさしく温める' }).click();
  await page.getByRole('button', { name: '結果を見る' }).click();
  await expect(page.getByText('3問中 3問正解。')).toBeVisible();
  await page.getByRole('button', { name: 'このアプリについて' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('narrow mobile and tablet layouts keep every screen within the viewport', async ({ page }) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['today', 'recipes', 'learn', 'notebook']) {
      await page.goto(`./#${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
    }
  }
});

test('weather only requests after consent action and handles unavailable network', async ({ page }) => {
  let requests = 0;
  await page.route('https://api.open-meteo.com/**', async route => { requests++; await route.fulfill({ json: { current: { temperature_2m: 16.1, time: '2026-09-27T15:00' } } }); });
  await page.goto('./');
  await page.getByRole('button', { name: '空模様と食卓' }).click();
  expect(requests).toBe(0);
  await page.getByRole('button', { name: '天気を見る', exact: true }).click();
  await expect(page.locator('.weather-result')).toContainText('16°C');
  expect(requests).toBe(1);
  await page.unroute('https://api.open-meteo.com/**');
  await page.route('https://api.open-meteo.com/**', route => route.abort());
  await page.getByRole('button', { name: '天気を見る', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('天気を取得できませんでした');
});
