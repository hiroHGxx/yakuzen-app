import type { Recipe } from './data';

export const seasonalTerms = [
  { name: '小寒', reading: 'しょうかん', date: 105, range: '1.5 — 1.19', season: '冬' },
  { name: '大寒', reading: 'だいかん', date: 120, range: '1.20 — 2.3', season: '冬' },
  { name: '立春', reading: 'りっしゅん', date: 204, range: '2.4 — 2.18', season: '春' },
  { name: '雨水', reading: 'うすい', date: 219, range: '2.19 — 3.5', season: '春' },
  { name: '啓蟄', reading: 'けいちつ', date: 306, range: '3.6 — 3.20', season: '春' },
  { name: '春分', reading: 'しゅんぶん', date: 321, range: '3.21 — 4.4', season: '春' },
  { name: '清明', reading: 'せいめい', date: 405, range: '4.5 — 4.19', season: '春' },
  { name: '穀雨', reading: 'こくう', date: 420, range: '4.20 — 5.4', season: '春' },
  { name: '立夏', reading: 'りっか', date: 505, range: '5.5 — 5.20', season: '夏' },
  { name: '小満', reading: 'しょうまん', date: 521, range: '5.21 — 6.5', season: '夏' },
  { name: '芒種', reading: 'ぼうしゅ', date: 606, range: '6.6 — 6.20', season: '夏' },
  { name: '夏至', reading: 'げし', date: 621, range: '6.21 — 7.6', season: '夏' },
  { name: '小暑', reading: 'しょうしょ', date: 707, range: '7.7 — 7.22', season: '夏' },
  { name: '大暑', reading: 'たいしょ', date: 723, range: '7.23 — 8.6', season: '夏' },
  { name: '立秋', reading: 'りっしゅう', date: 807, range: '8.7 — 8.22', season: '秋' },
  { name: '処暑', reading: 'しょしょ', date: 823, range: '8.23 — 9.7', season: '秋' },
  { name: '白露', reading: 'はくろ', date: 908, range: '9.8 — 9.22', season: '秋' },
  { name: '秋分', reading: 'しゅうぶん', date: 923, range: '9.23 — 10.7', season: '秋' },
  { name: '寒露', reading: 'かんろ', date: 1008, range: '10.8 — 10.22', season: '秋' },
  { name: '霜降', reading: 'そうこう', date: 1023, range: '10.23 — 11.6', season: '秋' },
  { name: '立冬', reading: 'りっとう', date: 1107, range: '11.7 — 11.21', season: '冬' },
  { name: '小雪', reading: 'しょうせつ', date: 1122, range: '11.22 — 12.6', season: '冬' },
  { name: '大雪', reading: 'たいせつ', date: 1207, range: '12.7 — 12.21', season: '冬' },
  { name: '冬至', reading: 'とうじ', date: 1222, range: '12.22 — 1.4', season: '冬' },
];

export function getSeasonalTerm(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const day = Number(parts.find(part => part.type === 'day')?.value);
  return [...seasonalTerms].reverse().find(term => term.date <= month * 100 + day) ?? seasonalTerms[23];
}

export function filterRecipes(recipes: Recipe[], query: string, category: string, quick: boolean, season = '') {
  const words = query.trim().normalize('NFKC').toLowerCase().split(/[\s、,]+/).filter(Boolean);
  return recipes.filter(recipe => {
    const text = `${recipe.title.replace('\n', '')} ${recipe.ingredients.map(ingredient => ingredient.name).join(' ')} ${recipe.tags.join(' ')}`.normalize('NFKC').toLowerCase();
    return words.every(word => text.includes(word)) && (category === 'すべて' || recipe.category === category) && (!quick || recipe.minutes <= 15) && (!season || recipe.seasons.includes(season));
  });
}

export type ShoppingItem = { id: string; recipeId: string; name: string; amount: number; unit: string; checked: boolean };
export type JournalEntry = { recipeId: string; date: string };
export type Notebook = { saved: string[]; shopping: ShoppingItem[]; cooked: JournalEntry[] };
export const emptyNotebook: Notebook = { saved: [], shopping: [], cooked: [] };
export const storageKey = 'kinozen-notebook-v1';

export function readNotebook(raw: string | null, recipeIds: string[]): Notebook {
  if (!raw) return { saved: [], shopping: [], cooked: [] };
  try {
    const value = JSON.parse(raw);
    return {
      saved: Array.isArray(value.saved) ? [...new Set<string>(value.saved.filter((id: unknown) => typeof id === 'string' && recipeIds.includes(id)))] : [],
      shopping: Array.isArray(value.shopping) ? value.shopping.filter((item: ShoppingItem) => item && typeof item.id === 'string' && recipeIds.includes(item.recipeId) && typeof item.name === 'string' && typeof item.unit === 'string' && Number.isFinite(item.amount) && item.amount > 0 && typeof item.checked === 'boolean') : [],
      cooked: Array.isArray(value.cooked) ? value.cooked.filter((item: JournalEntry) => item && recipeIds.includes(item.recipeId) && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && !Number.isNaN(Date.parse(item.date))) : [],
    };
  } catch { return { saved: [], shopping: [], cooked: [] }; }
}

export function addIngredients(items: ShoppingItem[], recipe: Recipe, servings: number) {
  const otherItems = items.filter(item => item.recipeId !== recipe.id);
  return [...otherItems, ...recipe.ingredients.map((ingredient, index) => ({ ...ingredient, id: `${recipe.id}-${index}`, recipeId: recipe.id, amount: ingredient.amount * servings / 2, checked: false }))];
}

export function formatAmount(amount: number) {
  return Number(amount.toFixed(2)).toString();
}

export function todayISO(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
