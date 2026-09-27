import { recipes, type Recipe } from './data';

export type ShoppingItem = { id: string; recipeId: string; name: string; amount: number; unit: string; checked: boolean };
export type JournalEntry = { id: string; recipeId: string; date: string; comment: string; again: boolean };
export type CookingDraft = { servings: number; prepared: string[]; finished: number[]; step: number; updatedAt: number };
export type KitchenTimer = { durationMs: number; remainingMs: number; endsAt: number | null };
export type Notebook = { saved: string[]; shopping: ShoppingItem[]; cooked: JournalEntry[]; notes: Record<string, string>; drafts: Record<string, CookingDraft>; timer: KitchenTimer | null };
export const emptyNotebook: Notebook = { saved: [], shopping: [], cooked: [], notes: {}, drafts: {}, timer: null };
// Keep the existing key so the first public preview upgrades without losing data.
export const storageKey = 'kinozen-notebook-v1';
export const newNotebook = (): Notebook => ({ saved: [], shopping: [], cooked: [], notes: {}, drafts: {}, timer: null });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
export const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function readNotebook(raw: string | null, recipeIds: string[]): Notebook {
  const result = newNotebook();
  if (!raw) return result;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value)) return result;
    if (Array.isArray(value.saved)) result.saved = [...new Set(value.saved.filter((id): id is string => typeof id === 'string' && recipeIds.includes(id)))];
    if (Array.isArray(value.shopping)) {
      const ids = new Set<string>();
      for (const item of value.shopping) if (object(item) && text(item.id, 150) && !ids.has(item.id as string) && typeof item.recipeId === 'string' && (recipeIds.includes(item.recipeId) || item.recipeId === 'custom') && text(item.name, 100) && (item.name as string).trim() && text(item.unit, 40) && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0 && item.amount <= 100000 && typeof item.checked === 'boolean') {
        ids.add(item.id as string);
        result.shopping.push({ id: item.id as string, recipeId: item.recipeId, name: item.name as string, unit: item.unit as string, amount: item.amount, checked: item.checked });
      }
    }
    if (Array.isArray(value.cooked)) {
      const days = new Set<string>();
      const ids = new Set<string>();
      for (const item of value.cooked) if (object(item) && typeof item.recipeId === 'string' && recipeIds.includes(item.recipeId) && validDate(item.date)) {
        const key = `${item.recipeId}-${item.date}`;
        if (days.has(key)) continue;
        let id = text(item.id, 150) && item.id ? item.id as string : key;
        if (ids.has(id)) id = key;
        if (ids.has(id)) continue;
        ids.add(id); days.add(key);
        result.cooked.push({ id, recipeId: item.recipeId, date: item.date, comment: text(item.comment, 1000) ? item.comment as string : '', again: item.again === true });
      }
    }
    if (object(value.notes)) for (const id of recipeIds) if (text(value.notes[id], 1000) && value.notes[id]) result.notes[id] = value.notes[id] as string;
    if (object(value.drafts)) for (const id of recipeIds) {
      const draft = value.drafts[id];
      const recipe = recipes.find(item => item.id === id);
      if (!object(draft) || !recipe || !Number.isInteger(draft.servings) || Number(draft.servings) < 1 || Number(draft.servings) > 6) continue;
      result.drafts[id] = {
        servings: Number(draft.servings),
        prepared: Array.isArray(draft.prepared) ? [...new Set(draft.prepared.filter((name): name is string => typeof name === 'string' && recipe.ingredients.some(item => item.name === name)))] : [],
        finished: Array.isArray(draft.finished) ? [...new Set(draft.finished.filter((step): step is number => Number.isInteger(step) && step >= 0 && step < recipe.steps.length))] : [],
        step: Number.isInteger(draft.step) && Number(draft.step) >= 0 && Number(draft.step) < recipe.steps.length ? Number(draft.step) : 0,
        updatedAt: typeof draft.updatedAt === 'number' && Number.isFinite(draft.updatedAt) ? draft.updatedAt : 0,
      };
    }
    const timer = value.timer;
    if (object(timer) && typeof timer.durationMs === 'number' && Number.isFinite(timer.durationMs) && timer.durationMs >= 1000 && timer.durationMs <= 599 * 60000 && typeof timer.remainingMs === 'number' && Number.isFinite(timer.remainingMs) && timer.remainingMs >= 0 && timer.remainingMs <= timer.durationMs && (timer.endsAt === null || (typeof timer.endsAt === 'number' && Number.isFinite(timer.endsAt) && timer.endsAt > 0 && timer.endsAt <= Date.now() + 599 * 60000))) result.timer = { durationMs: timer.durationMs, remainingMs: timer.remainingMs, endsAt: timer.endsAt };
    return result;
  } catch { return result; }
}

export function addIngredients(items: ShoppingItem[], recipe: Recipe, servings: number) {
  return [...items.filter(item => item.recipeId !== recipe.id), ...recipe.ingredients.map((ingredient, index) => ({ ...ingredient, id: `${recipe.id}-${index}`, recipeId: recipe.id, amount: ingredient.amount * servings / 2, checked: false }))];
}
export function groupShopping(items: ShoppingItem[]) {
  const groups = new Map<string, { key: string; name: string; unit: string; amount: number; checked: boolean; items: ShoppingItem[] }>();
  for (const item of items) {
    const key = JSON.stringify([item.name.trim().normalize('NFKC'), item.unit.trim().normalize('NFKC')]);
    const group = groups.get(key);
    if (group) { group.amount += item.amount; group.items.push(item); group.checked = group.checked && item.checked; }
    else groups.set(key, { key, name: item.name, unit: item.unit, amount: item.amount, checked: item.checked, items: [item] });
  }
  return [...groups.values()];
}
export const timerRemaining = (timer: KitchenTimer, now = Date.now()) => Math.max(0, timer.endsAt === null ? timer.remainingMs : timer.endsAt - now);
export function backupJSON(notebook: Notebook) {
  return JSON.stringify({ app: 'kinozen', version: 2, exportedAt: new Date().toISOString(), data: notebook }, null, 2);
}
export function parseBackup(raw: string): Notebook {
  if (raw.length > 2 * 1024 * 1024) throw new Error('ファイルが大きすぎます。2MB以内の手帖ファイルを選んでください。');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('JSONファイルを読み取れませんでした。'); }
  if (!object(value) || value.app !== 'kinozen' || value.version !== 2 || !object(value.data)) throw new Error('季の膳から書き出した対応形式のファイルを選んでください。');
  const data = value.data;
  if (!Array.isArray(data.saved) || !Array.isArray(data.shopping) || !Array.isArray(data.cooked) || !object(data.notes) || !object(data.drafts)) throw new Error('手帖のデータ形式が正しくありません。');
  const result = readNotebook(JSON.stringify(data), recipes.map(recipe => recipe.id));
  // Reject malformed backups, rather than silently restoring only part of a user's records.
  for (const key of ['saved', 'shopping', 'cooked', 'notes', 'drafts', 'timer'] as const) {
    const canonical = (v: unknown): string => JSON.stringify(v, (_key, item) => object(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
    if (canonical(result[key]) !== canonical(data[key])) throw new Error('未対応の料理や不正な値が含まれています。現在の手帖は変更していません。');
  }
  return result;
}
