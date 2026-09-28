import { test, expect, type Page } from '@playwright/test';

// 金継ぎ診断（2026-09-28）で直した読みやすさの床が戻らないことを確かめる
const smallestText = (page: Page) => page.evaluate(() => {
  const found: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || !node.textContent?.trim()) continue;
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (box.width < 2 || box.height < 2 || style.visibility === 'hidden' || !element.checkVisibility()) continue;
    if (parseFloat(style.fontSize) < 12) found.push(`${element.className || element.tagName} ${style.fontSize} 「${node.textContent.trim().slice(0, 12)}」`);
  }
  return found;
});

test('every visible text on the four screens is at least 12px', async ({ page }) => {
  for (const route of ['today', 'recipes', 'learn', 'notebook']) {
    await page.goto(`./#${route}`);
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await smallestText(page), route).toEqual([]);
  }
});

test('self check choices are large enough to tap and theme readings are distinguishable', async ({ page }) => {
  await page.goto('./#today');
  await page.getByText('今日の自分を振り返る（6問）').click();
  const sizes = await page.locator('.check-questions input').evaluateAll(inputs => inputs.map(input => { const box = input.getBoundingClientRect(); return Math.min(box.width, box.height); }));
  expect(sizes.length).toBeGreaterThan(0);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(24);
  await page.goto('./#learn');
  const labels = await page.locator('.theme-library .theme-reading summary').allTextContents();
  expect(labels).toHaveLength(3);
  expect(new Set(labels).size).toBe(3);
});

test('text fields on phones are 16px so iOS Safari does not zoom on focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'iOSのフォーカス時拡大はスマホ幅だけの問題');
  const fontSizes = async (selector: string) => page.locator(selector).evaluateAll(fields => fields.filter(field => (field as HTMLElement).offsetParent).map(field => parseFloat(getComputedStyle(field).fontSize)));
  await page.goto('./#today');
  expect(await fontSizes('.ingredient-entry input')).toEqual([16]);
  await page.goto('./#recipes');
  expect(Math.min(...await fontSizes('.search-field input'))).toBeGreaterThanOrEqual(16);
  await page.goto('./#learn');
  const learning = await fontSizes('.rich-panel textarea, .rich-panel input:not([type=checkbox]):not([type=radio])');
  expect(learning.length).toBeGreaterThan(0);
  expect(Math.min(...learning)).toBeGreaterThanOrEqual(16);
});
