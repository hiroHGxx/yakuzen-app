import { RecipeStudy } from './LearningExperience';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCheck, Clock3, CookingPot, Minus, Plus, ShoppingBasket, Sprout, Utensils } from 'lucide-react';
import { asset, foodEntries, type Recipe } from './data';
import { addIngredients, formatAmount, todayISO, type Notebook } from './lib';
import { JournalForm, RecipeMemo } from './Journal';
import { KitchenTimer } from './KitchenTimer';
import type { CookingDraft } from './notebook';
import './recipe-detail.css';

export function RecipeDetail({ recipe, notebook, update, onSave, onNotify, onFood }: { recipe: Recipe; notebook: Notebook; update: (updater: (value: Notebook) => Notebook) => void; onSave: () => void; onNotify: (message: string) => void; onFood: (index: number) => void }) {
  const draft = notebook.drafts[recipe.id] ?? { servings: 2, prepared: [], finished: [], step: 0, updatedAt: 0 };
  const { servings, prepared, finished, step: stepIndex } = draft;
  function changeDraft(change: (value: CookingDraft) => CookingDraft) {
    update(value => ({ ...value, drafts: { ...value.drafts, [recipe.id]: { ...change(value.drafts[recipe.id] ?? { servings: 2, prepared: [], finished: [], step: 0, updatedAt: 0 }), updatedAt: Date.now() } } }));
  }
  const setServings = (fn: (value: number) => number) => changeDraft(value => ({ ...value, servings: fn(value.servings), prepared: [] }));
  const setPrepared = (fn: string[] | ((value: string[]) => string[])) => changeDraft(value => ({ ...value, prepared: typeof fn === 'function' ? fn(value.prepared) : fn }));
  const setFinished = (fn: number[] | ((value: number[]) => number[])) => changeDraft(value => ({ ...value, finished: typeof fn === 'function' ? fn(value.finished) : fn }));
  const setStepIndex = (fn: number | ((value: number) => number)) => changeDraft(value => ({ ...value, step: typeof fn === 'function' ? fn(value.step) : fn }));
  const [cooking, setCooking] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [complete, setComplete] = useState(false);
  const cookingHeading = useRef<HTMLHeadingElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const wasCooking = useRef(false);
  useEffect(() => {
    if (cooking) {
      cookingHeading.current?.focus({ preventScroll: true });
      cookingHeading.current?.closest('.cooking-view')?.scrollIntoView({ block: 'start' });
    } else if (wasCooking.current) startButton.current?.focus();
    wasCooking.current = cooking;
  }, [cooking, stepIndex, complete]);
  function recordCooked() {
    update(value => {
      const drafts = { ...value.drafts }; delete drafts[recipe.id];
      return { ...value, drafts, cooked: value.cooked.some(entry => entry.recipeId === recipe.id && entry.date === todayISO()) ? value.cooked : [...value.cooked, { id: crypto.randomUUID(), recipeId: recipe.id, date: todayISO(), comment: '', again: false }] };
    });
    onNotify('今日の「つくった」を手帖に記録しました');
  }
  function startCooking() {
    if (!notebook.drafts[recipe.id]) changeDraft(value => value);
    setComplete(finished.length === recipe.steps.length);
    setCooking(true);
  }
  const todayEntry = notebook.cooked.find(entry => entry.recipeId === recipe.id && entry.date === todayISO());
  const journal = journalOpen ? <JournalForm key={todayEntry?.id ?? 'new'} notebook={notebook} update={update} initialRecipeId={recipe.id} entry={todayEntry} onCancel={() => setJournalOpen(false)} onDone={() => { setJournalOpen(false); update(value => { const drafts = { ...value.drafts }; delete drafts[recipe.id]; return { ...value, drafts }; }); onNotify('つくった記録を保存しました'); }}/> : <button className="text-button journal-detail-link" onClick={() => setJournalOpen(true)}>{todayEntry ? '今日の感想・またつくりたいを編集' : '日付と感想をつけて記録する'}<ArrowRight size={16}/></button>;
  const saved = notebook.saved.includes(recipe.id);
  const cooked = notebook.cooked.some(entry => entry.recipeId === recipe.id && entry.date === todayISO());
  if (cooking) return <section className="cooking-view">
    <div className="cooking-top"><button className="text-button" onClick={() => setCooking(false)}><ArrowLeft size={16}/>レシピに戻る</button><span>{servings}人分</span></div>
    <p className="cooking-recipe-name">{recipe.title.replace('\n', '')}</p>
    <div className="cooking-progress" aria-label={`全${recipe.steps.length}工程中${finished.length}工程完了`}>{recipe.steps.map((_, index) => <button key={index} aria-label={`工程${index + 1}を見る`} aria-current={!complete && stepIndex === index ? 'step' : undefined} className={finished.includes(index) ? 'done' : ''} onClick={() => { setStepIndex(index); setComplete(false); }}>{finished.includes(index) ? <Check size={16}/> : String(index + 1).padStart(2, '0')}</button>)}</div>
    {complete ? <div className="cooking-finish"><Sprout size={45} strokeWidth={1}/><span className="eyebrow">READY FOR YOUR TABLE</span><h2 ref={cookingHeading} tabIndex={-1}>おつかれさま。<br/>さあ、食卓へ。</h2><p>好みの器に盛りつけて、食卓へ。<br/>つくった日のことを、手帖に残しましょう。</p><button className="button full-width" disabled={cooked} onClick={recordCooked}><CheckCheck size={18}/>{cooked ? '今日の「つくった」を記録済み' : '今日つくった、と記録する'}</button>{journal}<button className="text-button" onClick={() => { setStepIndex(0); setComplete(false); }}>手順を振り返る<ArrowRight size={16}/></button></div>
    : <><div className="cooking-step" aria-live="polite"><span className="eyebrow">COOKING / {String(stepIndex + 1).padStart(2, '0')} OF {String(recipe.steps.length).padStart(2, '0')}</span><h2 ref={cookingHeading} tabIndex={-1}>ひとつずつ、ていねいに。</h2><p>{recipe.steps[stepIndex]}</p></div>
      <details className="cooking-ingredients"><summary>材料と分量を確認する<span>{servings}人分</span></summary><ul className="ingredient-list">{recipe.ingredients.map(ingredient => <li key={ingredient.name}><span>{ingredient.name}</span><span>{formatAmount(ingredient.amount * servings / 2)} {ingredient.unit}</span></li>)}</ul></details>
      <div className="cooking-actions"><button className="button button-outline" disabled={stepIndex === 0} onClick={() => setStepIndex(value => value - 1)}><ArrowLeft size={16}/>前へ</button><button className="button" onClick={() => { const done = finished.includes(stepIndex) ? finished : [...finished, stepIndex]; setFinished(done); if (stepIndex < recipe.steps.length - 1) setStepIndex(value => value + 1); else if (done.length === recipe.steps.length) setComplete(true); else setStepIndex(recipe.steps.findIndex((_, index) => !done.includes(index))); }}><Check size={17}/>{stepIndex === recipe.steps.length - 1 ? 'この工程を終える' : '完了して、次へ'}</button></div>
      <KitchenTimer notebook={notebook} update={update}/>
      {stepIndex < recipe.steps.length - 1 && <p className="cooking-next">次の工程<span>{recipe.steps[stepIndex + 1]}</span></p>}</>}
    <p className="small-note cooking-footnote">加熱状態を確かめながら、ご自身のペースで。<br/>工程と材料のチェックは、このブラウザに保存します。</p>
  </section>;
  return <>
    <div className="recipe-cover"><img className="detail-photo" src={asset(recipe.image)} alt={recipe.title.replace('\n', '')}/><span className="recipe-cover-label">KI NO ZEN / SEASONAL KITCHEN</span><span className="recipe-cover-season">{recipe.seasons.join('・')}の食卓</span></div>
    <div className="detail-body"><div className="eyebrow">SEASONAL RECIPE <span>季節のひと皿</span></div><h2>{recipe.title.replace('\n', '')}</h2><p className="detail-subtitle">{recipe.subtitle}</p>
      <div className="detail-meta"><span><Clock3 size={16}/>{recipe.minutes}分</span><span><Utensils size={16}/>{recipe.category}</span><button className={`text-button ${saved ? 'active' : ''}`} onClick={onSave}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/>{saved ? '保存済み' : '手帖に保存'}</button></div>
      <div className="recipe-story"><span className="eyebrow">味わう、今日のひと皿</span><p>{recipe.note}</p><div>{recipe.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
      <RecipeStudy recipe={recipe}/><div className="cooking-invitation"><div><span className="eyebrow">LET’S COOK</span><h3>台所で、ひとつずつ。</h3><p>全{recipe.steps.length}工程。材料をそろえたら、調理モードへ。</p></div><button ref={startButton} className="button" onClick={startCooking}><CookingPot size={18}/>{notebook.drafts[recipe.id] ? '調理の続きへ' : '調理をはじめる'}<ArrowRight size={17}/></button></div>
      {notebook.drafts[recipe.id] && <div className="resume-note"><p>前回の続き：{finished.length}/{recipe.steps.length}工程・{servings}人分</p>{restartConfirm ? <div className="form-actions"><button className="text-button" onClick={() => setRestartConfirm(false)}>続きから使う</button><button className="text-button" onClick={() => { changeDraft(() => ({ servings: 2, prepared: [], finished: [], step: 0, updatedAt: Date.now() })); setComplete(false); setRestartConfirm(false); }}>進み具合を消して最初から</button></div> : <button className="text-button" onClick={() => setRestartConfirm(true)}>最初からつくる</button>}</div>}
      <div className="ingredient-heading"><h3>材料</h3><div className="stepper"><button aria-label="人数を減らす" disabled={servings === 1} onClick={() => { setServings(value => value - 1); setPrepared([]); }}><Minus size={15}/></button><span>{servings}人分</span><button aria-label="人数を増やす" disabled={servings === 6} onClick={() => { setServings(value => value + 1); setPrepared([]); }}><Plus size={15}/></button></div></div>
      <p className="ingredient-help">用意した材料にチェック。 <span>{prepared.length} / {recipe.ingredients.length}</span></p>
      <ul className="ingredient-list preparation-list">{recipe.ingredients.map(ingredient => <li key={ingredient.name} className={prepared.includes(ingredient.name) ? 'prepared' : ''}><label><input type="checkbox" checked={prepared.includes(ingredient.name)} onChange={() => setPrepared(value => value.includes(ingredient.name) ? value.filter(name => name !== ingredient.name) : [...value, ingredient.name])}/><span>{ingredient.name}</span><span>{formatAmount(ingredient.amount * servings / 2)} {ingredient.unit}</span></label></li>)}</ul>
      <button className="button button-outline full-width" onClick={() => { update(value => ({ ...value, shopping: addIngredients(value.shopping, recipe, servings) })); onNotify(`${servings}人分の材料を買い物リストに追加しました`); }}><ShoppingBasket size={17}/>買い物リストに追加</button>
      <p className="small-note">同じレシピを追加すると、選んだ人数分で更新します。調味料や水など、家にあるものはリストから削除できます。</p>
      <h3 className="method-heading">つくり方</h3><ol className="method-list">{recipe.steps.map((step, index) => <li className={finished.includes(index) ? 'completed' : ''} key={step}><button aria-label={`手順${index + 1}を${finished.includes(index) ? '未完了' : '完了'}にする`} aria-pressed={finished.includes(index)} onClick={() => setFinished(value => value.includes(index) ? value.filter(item => item !== index) : [...value, index])}>{finished.includes(index) ? <Check size={17}/> : String(index + 1).padStart(2, '0')}</button><p>{step}</p></li>)}</ol>
      <aside className="recipe-note"><Sprout size={24}/><div><h4>あなたのペースで、つくりましょう。</h4><p>人数を変えたときも、加熱時間はそのまま倍にせず、火の通りや鍋の大きさを確かめながら。材料の量は目安にしてください。</p></div></aside>
      <button className={`button full-width ${cooked ? 'button-outline' : ''}`} disabled={cooked} onClick={recordCooked}><CheckCheck size={18}/>{cooked ? '今日の「つくった」を記録済み' : '今日つくった、と記録する'}</button>
      {journal}<RecipeMemo recipe={recipe} notebook={notebook} update={update} notify={onNotify}/>
      <h3 className="method-heading">この食材を、もう少し知る</h3><div className="chip-row">{foodEntries.map((food, index) => recipe.ingredients.some(ingredient => ingredient.name.includes(food.name)) && <button key={food.name} className="chip" onClick={() => onFood(index)}>{food.name}<ArrowUpRight size={14}/></button>)}</div>
      <div className="detail-disclaimer"><p>アレルゲンの目安：{recipe.allergens.length ? recipe.allergens.join('・') : '指定材料に主要なアレルゲンの記載なし'}。網羅的な表示ではありません。だしや調味料を含め、使用する商品の表示を必ず確認してください。</p><p>レシピは監修・試作確認前のプレビューです。人数による分量変更は単純換算です。炊飯器の容量や加熱状態に合わせて調整してください。写真はAI生成のイメージです。</p></div>
    </div>
  </>;
}
