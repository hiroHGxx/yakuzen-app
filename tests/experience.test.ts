import test from 'node:test';
import assert from 'node:assert/strict';
import { newNotebook, backupJSON, parseBackup, readNotebook } from '../src/notebook';
import { recipes } from '../src/data';
import { academy, foodTradition, foodLens } from '../src/academy';
const ids=recipes.map(r=>r.id);
test('meal and learning records migrate, roundtrip and reject corrupt imports',()=>{
 const n=newNotebook();n.meals=[{id:'meal',name:'夕食',recipeIds:['pea-rice','chicken-ginger'],servings:3}];n.learning={nature:{note:'温度とは違う',read:true,saved:true}};
 assert.deepEqual(parseBackup(backupJSON(n)),n);
 const old=JSON.parse(backupJSON(n));old.version=2;delete old.data.meals;delete old.data.learning;assert.deepEqual(parseBackup(JSON.stringify(old)).meals,[]);
 const bad=JSON.parse(backupJSON(n));bad.data.meals[0].recipeIds=['missing'];assert.throws(()=>parseBackup(JSON.stringify(bad)));
 const badLearning=JSON.parse(backupJSON(n));badLearning.data.learning.unknown={note:'x'};assert.throws(()=>parseBackup(JSON.stringify(badLearning)));
 assert.deepEqual(readNotebook(JSON.stringify({meals:[{...n.meals[0],servings:99}]}),ids).meals,[]);
});
test('six lessons have explanations and sources; sixteen foods have an editorial learning path',()=>{
 assert.equal(academy.length,6);assert.equal(Object.keys(foodTradition).length+Object.keys(foodLens).length,16);
 for(const l of academy){assert.ok(l.source.startsWith('https://'));assert.ok(l.choices[l.answer]);assert.ok(l.explanation.length>15);}
});
