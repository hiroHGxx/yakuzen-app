import { test, expect } from '@playwright/test';

async function openSoup(page: import('@playwright/test').Page) {
  await page.goto('./#recipes');
  await page.getByRole('button', { name: 'れんこんと鶏肉のやさしいスープのレシピを見る' }).click();
  return page.getByRole('dialog');
}

test('preparation and cooking keep portions and progress, and record only on request', async ({ page }, testInfo) => {
  const dialog = await openSoup(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ animations: 'disabled', path: `.local/screenshots/${testInfo.project.name}-rich-detail.png` });
  await dialog.getByRole('button', { name: '人数を増やす' }).click();
  await dialog.getByRole('checkbox', { name: /鶏もも肉/ }).check();
  await expect(dialog.getByRole('checkbox', { name: /鶏もも肉/ })).toBeChecked();
  await dialog.getByRole('button', { name: '人数を増やす' }).click();
  await expect(dialog.getByRole('checkbox', { name: /鶏もも肉/ })).not.toBeChecked();
  await dialog.getByRole('button', { name: '人数を減らす' }).click();
  await dialog.getByRole('checkbox', { name: /鶏もも肉/ }).check();
  await dialog.getByRole('button', { name: '調理の続きへ' }).click();
  await expect(dialog.locator('.cooking-step h2')).toBeFocused();
  await dialog.getByText('材料と分量を確認する').click();
  await expect(dialog.locator('.ingredient-list li').filter({ hasText: '鶏もも肉' })).toContainText('225 g');
  await dialog.getByRole('button', { name: '完了して、次へ' }).click();
  await expect(dialog.getByRole('button', { name: '工程2を見る' })).toHaveAttribute('aria-current', 'step');
  await dialog.getByRole('button', { name: 'レシピに戻る' }).click();
  await expect(dialog.getByRole('button', { name: '調理の続きへ' })).toBeFocused();
  await expect(dialog.getByRole('checkbox', { name: /鶏もも肉/ })).toBeChecked();
  await expect(dialog.getByRole('button', { name: '手順1を未完了にする' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: '調理の続きへ' }).click();
  await expect(dialog.getByRole('button', { name: '工程2を見る' })).toHaveAttribute('aria-current', 'step');
  await page.screenshot({ animations: 'disabled', path: `.local/screenshots/${testInfo.project.name}-cooking.png` });
  await dialog.getByRole('button', { name: '完了して、次へ' }).click();
  await expect(dialog.locator('.cooking-step')).toContainText('75℃');
  await dialog.getByRole('button', { name: 'この工程を終える' }).click();
  await expect(dialog.locator('.cooking-finish')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kinozen-notebook-v1')!).cooked)).toEqual([]);
  await dialog.getByRole('button', { name: '今日つくった、と記録する' }).click();
  await expect(dialog.getByRole('button', { name: '今日の「つくった」を記録済み' })).toBeDisabled();
  await page.screenshot({ animations: 'disabled', path: `.local/screenshots/${testInfo.project.name}-cooking-finish.png` });
  await page.keyboard.press('Escape');
  await page.reload();
  await page.goto('./#notebook');
  await page.getByRole('tab', { name: 'つくった記録' }).click();
  await expect(page.locator('.cooked-list article')).toHaveCount(1);
});

test('jumping to the last step does not skip unfinished steps; reopening preserves checks', async ({ page }) => {
  const dialog = await openSoup(page);
  await dialog.getByRole('button', { name: '調理をはじめる' }).click();
  await dialog.getByRole('button', { name: '工程3を見る' }).click();
  await dialog.getByRole('button', { name: 'この工程を終える' }).click();
  await expect(dialog.locator('.cooking-finish')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: '工程1を見る' })).toHaveAttribute('aria-current', 'step');
  await expect(dialog.getByRole('button', { name: '前へ', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'れんこんと鶏肉のやさしいスープのレシピを見る' }).click();
  await expect(dialog.getByRole('button', { name: '調理の続きへ' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '手順3を未完了にする' })).toHaveAttribute('aria-pressed', 'true');
});

test('all twelve recipes fit narrow screens in detail and cooking views', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./#recipes');
  for (let index = 0; index < 12; index++) {
    await page.locator('.photo-link').nth(index).click();
    const dialog = page.getByRole('dialog');
    await page.evaluate(() => document.fonts.ready);
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: '調理をはじめる' }).click();
    await dialog.getByText('材料と分量を確認する').click();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
  }
});
