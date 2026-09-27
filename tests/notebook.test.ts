import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, foodEntries } from '../src/data.ts';
import { addIngredients, backupJSON, groupShopping, newNotebook, parseBackup, readNotebook, timerRemaining, validDate } from '../src/notebook.ts';
import { existsSync } from 'node:fs';
const ids = recipes.map(recipe => recipe.id);

test('old notebooks upgrade without losing favorites, shopping checks or cooking dates', () => {
  const old = { saved: ['lotus-soup'], shopping: addIngredients([],recipes[1],3).map(item => ({...item, checked:true})), cooked:[{recipeId:'lotus-soup',date:'2026-09-26'}] };
  const result=readNotebook(JSON.stringify(old),ids);
  assert.deepEqual(result.saved,old.saved); assert.deepEqual(result.shopping,old.shopping);
  assert.deepEqual(result.cooked,[{id:'lotus-soup-2026-09-26',recipeId:'lotus-soup',date:'2026-09-26',comment:'',again:false}]);
  assert.deepEqual(result.notes,{}); assert.deepEqual(result.drafts,{}); assert.equal(result.timer,null);
});
test('all notebook data survives export and import; malformed backups fail without partial restoration',()=>{
 const notebook = newNotebook(); notebook.saved=['lotus-soup']; notebook.notes={'lotus-soup':'生姜を少なめに。'};
 notebook.shopping=[{id:'custom-1',recipeId:'custom',name:'お茶',amount:1,unit:'袋',checked:false}];
 notebook.cooked=[{id:'entry-1',recipeId:'lotus-soup',date:'2026-09-26',comment:'おいしかった',again:true}];
 notebook.drafts={'lotus-soup':{servings:3,prepared:['生姜'],finished:[0],step:1,updatedAt:1}};
 notebook.timer={durationMs:60000,remainingMs:45000,endsAt:null};
 assert.deepEqual(parseBackup(backupJSON(notebook)),notebook);
 const invalid=JSON.parse(backupJSON(notebook)); invalid.data.cooked[0].date='2026-02-30';
 assert.throws(()=>parseBackup(JSON.stringify(invalid)));
 assert.throws(()=>parseBackup('{broken')); assert.throws(()=>parseBackup(JSON.stringify({app:'other',version:2,data:notebook})));
 const future=JSON.parse(backupJSON(notebook));future.version=4;assert.throws(()=>parseBackup(JSON.stringify(future)));
 const wrong=JSON.parse(backupJSON(notebook));wrong.data.timer.durationMs=-1;assert.throws(()=>parseBackup(JSON.stringify(wrong)));
});
test('shopping combines matching names and units while retaining all sources and partial purchased state',()=>{
 const items=[{id:'a',recipeId:'lotus-soup',name:'生姜',amount:5,unit:'g',checked:true},{id:'b',recipeId:'pear-compote',name:'生姜',amount:3,unit:'g',checked:false},{id:'c',recipeId:'custom',name:'生姜',amount:1,unit:'個',checked:false}];
 const groups=groupShopping(items); assert.equal(groups.length,2);assert.equal(groups[0].amount,8);assert.equal(groups[0].checked,false);assert.equal(groups[0].items.length,2);assert.equal(groups[1].amount,1);
 assert.equal(groupShopping(items.filter(item=>!item.checked))[0].amount,3);
});
test('corrupt drafts, dates, duplicates and timer values are sanitized',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);
 const result=readNotebook(JSON.stringify({ cooked:[{recipeId:'lotus-soup',date:'2026-09-26'},{recipeId:'lotus-soup',date:'2026-09-26'}],drafts:{'lotus-soup':{servings:3,prepared:['生姜','missing','生姜'],finished:[0,99,0,-1],step:200}},timer:{durationMs:60000,remainingMs:100000,endsAt:null} }),ids);
 assert.equal(result.cooked.length,1);assert.deepEqual(result.drafts['lotus-soup'].prepared,['生姜']);assert.deepEqual(result.drafts['lotus-soup'].finished,[0]);assert.equal(result.drafts['lotus-soup'].step,0);assert.equal(result.timer,null);
 assert.equal(readNotebook(JSON.stringify({timer:{durationMs:60000,remainingMs:60000,endsAt:1e100}}),ids).timer,null);
});
test('timer uses the deadline across page reloads and respects pause',()=>{
 assert.equal(timerRemaining({durationMs:60000,remainingMs:60000,endsAt:90000},50000),40000);
 assert.equal(timerRemaining({durationMs:60000,remainingMs:20000,endsAt:null},50000),20000);
 assert.equal(timerRemaining({durationMs:60000,remainingMs:60000,endsAt:90000},100000),0);
});
test('expanded catalog has complete recipes, distinct photos and searchable dictionary ingredients',()=>{
 assert.equal(recipes.length,24);assert.equal(foodEntries.length,16);assert.equal(new Set(ids).size,24);assert.equal(new Set(recipes.map(recipe=>recipe.image)).size,24);
 for (const recipe of recipes) {assert.ok(recipe.steps.length>=3);assert.ok(recipe.ingredients.length>=4);assert.ok(existsSync(`public/images/${recipe.image}.webp`));assert.ok(recipe.ingredients.every(item=>item.amount>0));}
 for(const food of foodEntries) assert.ok(recipes.some(recipe=>recipe.ingredients.some(item=>item.name.includes(food.name))),food.name);
});
