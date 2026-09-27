import test from 'node:test';
import assert from 'node:assert/strict';
import { addIngredients, filterRecipes, getSeasonalTerm, readNotebook, todayISO, newNotebook } from '../src/lib.ts';
import { recipes } from '../src/data.ts';

test('ingredient search matches all requested ingredients and combines category/time filters', () => {
  assert.deepEqual(filterRecipes(recipes, 'れんこん、鶏肉', 'すべて', false).map(recipe => recipe.id), ['lotus-soup']);
  assert.deepEqual(filterRecipes(recipes, '生姜', 'すべて', true).map(recipe => recipe.id), ['pear-compote', 'eggplant-ginger']);
  assert.equal(filterRecipes(recipes, '梨', '汁もの', false).length, 0);
  assert.equal(filterRecipes(recipes, '架空の食材', 'すべて', false).length, 0);
  assert.deepEqual(filterRecipes(recipes, '', 'すべて', false, '夏').map(recipe => recipe.id), ['tomato-egg', 'pea-rice', 'eggplant-ginger', 'mackerel-tomato', 'pumpkin-simmer', 'corn-rice']);
});

test('shopping amounts scale and adding the same recipe replaces rather than duplicates', () => {
  const first = addIngredients([], recipes[0], 4);
  assert.equal(first.find(item => item.name === '米')?.amount, 2);
  const withSoup = addIngredients(first, recipes[1], 2);
  const updated = addIngredients(withSoup.map(item => ({ ...item, checked: true })), recipes[0], 1);
  assert.equal(updated.filter(item => item.recipeId === recipes[0].id).length, recipes[0].ingredients.length);
  assert.equal(updated.find(item => item.name === '米')?.amount, .5);
  assert.equal(updated.find(item => item.name === '米')?.checked, false);
  assert.equal(updated.find(item => item.recipeId === recipes[1].id)?.checked, true);
});

test('notebook tolerates corrupt local storage and filters outdated recipe IDs', () => {
  const ids = recipes.map(recipe => recipe.id);
  assert.deepEqual(readNotebook('{broken', ids), newNotebook());
  assert.deepEqual(readNotebook('null', ids), newNotebook());
  assert.deepEqual(readNotebook(JSON.stringify({ saved: ['mushroom-rice', 'missing', 'mushroom-rice', 5], shopping: [{ id: 'bad' }], cooked: [{ recipeId: 'mushroom-rice', date: 'bad' }] }), ids), { ...newNotebook(), saved: ['mushroom-rice'] });
});

test('season boundaries use Japan time, including the previous winter solstice in January', () => {
  assert.equal(getSeasonalTerm(new Date('2026-09-22T14:59:00Z')).name, '白露');
  assert.equal(getSeasonalTerm(new Date('2026-09-22T15:00:00Z')).name, '秋分');
  assert.equal(getSeasonalTerm(new Date('2027-01-01T03:00:00Z')).name, '冬至');
  assert.equal(getSeasonalTerm(new Date('2027-01-05T03:00:00Z')).name, '小寒');
  assert.equal(todayISO(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
});
