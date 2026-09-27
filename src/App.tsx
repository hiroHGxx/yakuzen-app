import { Planner, Pantry, SeasonalFeatures, JournalCalendar } from './TableExperience';
import { Academy, SelfCheck, FoodStudy } from './LearningExperience';
import './experience.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, Clock3, CloudSun, CookingPot, Flower2, Search, SlidersHorizontal, Sprout, Sun, Trash2, Wheat, X } from 'lucide-react';
import { NotebookPage, PersonalTable } from './NotebookPage';
import { KitchenTimer } from './KitchenTimer';
import './notebook.css';
import { RecipeDetail } from './RecipeDetail';
import { Today, ThemeReading } from './Today';
import { feelingThemes, type FeelingTheme } from './themes';
import { asset, foodEntries, lessons, quiz, recipes, type Recipe } from './data';
import { emptyNotebook, filterRecipes, getSeasonalTerm, readNotebook, seasonalTerms, storageKey, type Notebook } from './lib';

type Page = 'today' | 'recipes' | 'learn' | 'notebook';
type LearnTab = '読みもの' | '食材辞典' | '季節の暦' | 'クイズ';
type ModalState = { type: 'recipe'; recipe: Recipe; theme?: FeelingTheme } | { type: 'food'; index: number } | { type: 'lesson'; index: number } | { type: 'about' | 'privacy' | 'weather' | 'reset' } | null;
const navItems = [{ id: 'today', label: '今日', en: 'TODAY', icon: Sun }, { id: 'recipes', label: 'つくる', en: 'RECIPES', icon: CookingPot }, { id: 'learn', label: '学ぶ', en: 'JOURNAL', icon: BookOpen }, { id: 'notebook', label: '手帖', en: 'MY NOTEBOOK', icon: Bookmark }] as const;
const seasonCopy: Record<string, { heading: string; text: string; mood: string; ingredients: number[] }> = {
  春: { heading: '春の芽吹きを、食卓に。', text: 'やわらかな陽ざしと、新しい季節。\nみずみずしい緑を、ひと皿に添えて。', mood: '芽吹きの季節', ingredients: [5, 2, 3] },
  夏: { heading: '夏の彩りを、食卓に。', text: '光をたっぷり浴びた、夏の食材。\n色も香りも楽しむ、いつものごはん。', mood: '光あふれる季節', ingredients: [4, 1, 2] },
  秋: { heading: '秋の実りを、食卓に。', text: '少しずつ深まる秋、移ろう季節に。\n旬のおいしさで、わたしをもてなす。', mood: '実りを味わう季節', ingredients: [0, 1, 2] },
  冬: { heading: '冬のぬくもりを、食卓に。', text: '湯気の向こうに、ほっとする時間。\nゆっくり煮込んだ、今日のひと皿。', mood: 'ぬくもりを楽しむ季節', ingredients: [0, 5, 2] },
};

function currentPage(): Page {
  const hash = window.location.hash.slice(1);
  return navItems.some(item => item.id === hash) ? hash as Page : 'today';
}

function FoodDrawing({ kind, className = '' }: { kind: string; className?: string }) {
  return <svg className={`food-drawing ${className}`} viewBox="0 0 120 100" fill="none" aria-hidden="true">
    {kind === 'rice' ? <g><path d="M22 49h77c-3 34-70 39-77 0Z" fill="#ded8bd"/><ellipse cx="61" cy="47" rx="39" ry="12" fill="#f0e9d6"/>{[35,48,61,74,87].map((x,i)=><ellipse key={x} cx={x} cy={44+i%2*5} rx="7" ry="3" fill="#fffdf3"/>)}</g>
    : kind === 'tofu' ? <g><path d="m22 38 48-13 30 17-47 17Z" fill="#fcf8e9"/><path d="m22 38 31 21v27L22 68Z" fill="#ddd8c3"/><path d="m53 59 47-17v28L53 86Z" fill="#eeead7"/></g>
    : kind === 'egg' ? <g><ellipse cx="43" cy="52" rx="24" ry="32" fill="#e3cfb2" transform="rotate(-18 43 52)"/><ellipse cx="78" cy="57" rx="25" ry="28" fill="#faf7e9"/><ellipse cx="78" cy="59" rx="13" ry="15" fill="#dbab54"/></g>
    : kind === 'carrot' ? <g><path d="m44 28 41 16-53 49Z" fill="#cb9155"/><path d="m56 30 3-22m12 27L88 14m-26 8L45 6" stroke="#849167" strokeWidth="7" strokeLinecap="round"/><path d="m47 46 12 4m-20 9 10 4" stroke="#e5b57d" strokeWidth="3"/></g>
    : kind === 'eggplant' ? <g><path d="M77 22c38 31-3 73-43 60-23-11-3-29 14-32 15-2 9-31 29-28Z" fill="#8f7d92"/><path d="m63 26 18-13 16 11-11 3 3 11-16-7-13 11Z" fill="#7f8e63"/><path d="m81 16 4-12" stroke="#6f8057" strokeWidth="5"/></g>
    : kind === 'sweetpotato' ? <g transform="rotate(-25 60 50)"><ellipse cx="59" cy="49" rx="44" ry="23" fill="#ab7781"/><ellipse cx="82" cy="49" rx="19" ry="23" fill="#d9b960"/><path d="m28 48 7-4m7 19 8-2" stroke="#c59b9c" strokeWidth="3"/></g>
    : kind === 'cabbage' ? <g><circle cx="60" cy="51" r="37" fill="#a8b68b"/><path d="M60 85C18 69 27 23 52 24M61 85c43-21 36-51 12-62M60 83V27M28 49l31 23 33-20M37 29l23 24 22-22" stroke="#d3dbbc" strokeWidth="3"/></g>
    : kind === 'onion' ? <g><path d="M57 12c2 18-34 25-33 48 1 35 72 35 73 0 0-23-36-30-34-48Z" fill="#d8bd8d"/><path d="M59 24c-29 21-24 44 0 59m3-59c27 19 24 44 0 59m-1-57v56" stroke="#f0dcaf" strokeWidth="2"/></g>
    : kind === 'tomato' || kind === 'apple' ? <g><path d="M59 29c-32-15-46 13-34 39 10 22 23 18 35 16 17 4 35-3 38-26 4-31-20-40-39-29Z" fill={kind === 'tomato' ? '#c4826b' : '#b67768'}/><path d="M58 32 62 14" stroke="#7b7b53" strokeWidth="4"/>{kind === 'tomato' ? <path d="m60 29-20-4 12 13-1 10 10-10 14 5-9-13 15-8Z" fill="#84936c"/> : <path d="M65 25c12-18 24-14 26-12-5 14-13 18-26 12Z" fill="#8b9b6c"/>}<path d="M34 45q-5 10 1 19" stroke="#e4b49b" strokeWidth="4" strokeLinecap="round"/></g>
    : kind === 'lotus' ? <g transform="rotate(-18 60 50)"><ellipse cx="60" cy="52" rx="39" ry="30" fill="#e3d4b6" stroke="#bda984" strokeWidth="1.5"/><ellipse cx="60" cy="48" rx="39" ry="30" fill="#f2e8d2" stroke="#cbbb96" strokeWidth="1.5"/>{[[60, 48, 6, 5], [42, 36, 7, 5], [63, 30, 6, 5], [80, 40, 5, 7], [78, 59, 7, 5], [57, 66, 6, 5], [39, 55, 5, 7]].map(([cx, cy, rx, ry], index) => <ellipse key={index} cx={cx} cy={cy} rx={rx} ry={ry} fill="#bcaa83" opacity=".6"/>)}</g>
    : kind === 'pear' ? <g><path d="M57 29c-4-10 2-17 6-20" stroke="#7d7350" strokeWidth="3"/><path d="M61 22c13-19 26-13 26-13S82 25 61 22" fill="#85915c"/><path d="M57 28c-21-1-34 19-29 38 5 22 48 29 61 5 12-24-8-48-32-43Z" fill="#c7b774"/><path d="M39 48c-7 18-1 24 2 27" stroke="#e3d29b" strokeWidth="4" strokeLinecap="round"/>{[42, 54, 66, 78].map((cx, index) => <circle key={cx} cx={cx} cy={49 + index * 5} r="1" fill="#988847"/>)}</g>
    : kind === 'ginger' ? <g transform="rotate(-15 60 50)"><path d="M24 65c-10-13 3-22 16-18-7-17 0-27 11-23 6 2 6 12 8 17 7-8 8-23 20-21 15 2 10 19 1 25 14-2 23 10 15 20-7 9-18 1-24 7-15 15-33 8-47-7Z" fill="#d9bd91" stroke="#b49465" strokeWidth="1.3"/><path d="m42 48 6 15m12-19 6 21m8-18 9 10M49 31l4 1M77 28l5 3" stroke="#b39469" strokeWidth="1.5" strokeLinecap="round"/></g>
    : kind === 'mushroom' ? <g><path d="m51 53-6 31h17L59 53m15 2 5 24h12l-7-28" fill="#e3d8c5" stroke="#b4a38b"/><path d="M23 50c4-40 58-40 63 0-15 8-48 10-63 0Z" fill="#ab8966"/><path d="M66 52c2-28 38-30 42-2-8 8-31 10-42 2Z" fill="#c1a07e"/><path d="M35 35c8-8 15-10 24-9" stroke="#cfb698" strokeWidth="3" strokeLinecap="round"/></g>
    : kind === 'pumpkin' ? <g><path d="m59 28 5-16 8 2-5 17" fill="#77805b"/><ellipse cx="61" cy="55" rx="41" ry="30" fill="#ba8649"/><ellipse cx="60" cy="55" rx="26" ry="31" fill="#d49c54"/><ellipse cx="60" cy="55" rx="11" ry="31" fill="#e4b36d"/></g>
    : <g><path d="M36 86 74 24m-27 44L31 38m25 15 32-9" stroke="#6f8057" strokeWidth="3"/><path d="M72 53C46 31 69 10 84 9c12 19 6 35-12 44ZM45 69C18 66 16 45 23 29c18 3 28 17 22 40ZM58 63c6-27 29-31 45-20-5 21-20 30-45 20Z" fill="#829363" opacity=".9"/></g>}
  </svg>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  return <dialog ref={dialog} className={`modal ${wide ? 'modal-wide' : ''}`} aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><button className="icon-button modal-close" aria-label="閉じる" onClick={onClose}><X size={21}/></button>{children}</div>
  </dialog>;
}

function RecipeCard({ recipe, saved, onSave, onOpen }: { recipe: Recipe; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className="recipe-card">
    <div className="recipe-photo"><button className="photo-link" onClick={onOpen} aria-label={`${recipe.title.replace('\n', '')}のレシピを見る`}><img src={asset(recipe.image)} alt={recipe.title.replace('\n', '')} loading="lazy" width="768" height="512"/></button><button className={`save-button ${saved ? 'is-saved' : ''}`} aria-label={`${recipe.title.replace('\n', '')}を${saved ? '保存解除' : '保存'}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'}/></button><span className="photo-category">{recipe.category}</span></div>
    <div className="recipe-card-body"><div className="recipe-card-meta"><span>{recipe.tags[0]}</span><span><Clock3 size={13}/>{recipe.minutes}分</span></div><button className="recipe-title-link" onClick={onOpen}><h3>{recipe.title.replace('\n', '')}</h3><ArrowUpRight size={18}/></button><p>{recipe.subtitle}</p></div>
  </article>;
}


function QuizPanel() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const question = quiz[index];
  return <section className="quiz-panel"><span className="eyebrow">A LITTLE DISCOVERY</span><Flower2 className="quiz-flower" size={44}/>{done ? <><h2>今日の学びを、ひとつ。</h2><p>{quiz.length}問中 {score}問正解。食卓で思い出してみてくださいね。</p><button className="button" onClick={() => { setIndex(0); setAnswer(null); setScore(0); setDone(false); }}>もう一度楽しむ<ArrowRight size={17}/></button></> : <><p className="quiz-progress">QUESTION {String(index + 1).padStart(2, '0')} / {String(quiz.length).padStart(2, '0')}</p><h2>{question.question}</h2><div className="quiz-choices">{question.choices.map((choice, choiceIndex) => <button key={choice} disabled={answer !== null} className={answer !== null && choiceIndex === question.answer ? 'correct' : answer === choiceIndex ? 'incorrect' : ''} onClick={() => { setAnswer(choiceIndex); if (choiceIndex === question.answer) setScore(value => value + 1); }}><span>{String(choiceIndex + 1).padStart(2, '0')}</span>{choice}{answer !== null && choiceIndex === question.answer && <Check size={18}/>}</button>)}</div>{answer !== null && <div className="quiz-answer" role="status"><strong>{answer === question.answer ? '正解です。' : '答えは「' + question.choices[question.answer] + '」です。'}</strong><p>{question.explanation}</p><button className="button" onClick={() => { if (index === quiz.length - 1) setDone(true); else { setIndex(value => value + 1); setAnswer(null); } }}>{index === quiz.length - 1 ? '結果を見る' : '次の問いへ'}<ArrowRight size={16}/></button></div>}</>}</section>;
}

function WeatherPanel() {
  const cities = [{ name: '札幌', lat: 43.06, lon: 141.35 }, { name: '仙台', lat: 38.27, lon: 140.87 }, { name: '東京', lat: 35.68, lon: 139.69 }, { name: '名古屋', lat: 35.18, lon: 136.91 }, { name: '大阪', lat: 34.69, lon: 135.5 }, { name: '福岡', lat: 33.59, lon: 130.4 }, { name: '那覇', lat: 26.21, lon: 127.68 }];
  const [cityIndex, setCityIndex] = useState(2);
  const [result, setResult] = useState<{ city: string; temperature: number; time: string } | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function fetchWeather() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 12000);
    const city = cities[cityIndex];
    setLoading(true); setStatus(''); setResult(null);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m&timezone=Asia%2FTokyo`, { signal: abort.signal });
      if (!response.ok) throw new Error('天気を取得できませんでした');
      const data = await response.json();
      if (!Number.isFinite(data.current?.temperature_2m) || typeof data.current?.time !== 'string') throw new Error('気温のデータがありません');
      setResult({ city: city.name, temperature: Math.round(data.current.temperature_2m), time: data.current.time.slice(11, 16) });
    } catch { if (controller.current === abort) setStatus('天気を取得できませんでした。時間をおいてもう一度お試しください。'); }
    finally { clearTimeout(timeout); if (controller.current === abort) setLoading(false); }
  }
  return <div className="text-modal"><span className="eyebrow">WEATHER & TABLE</span><h2>空模様から、ひと皿を。</h2><p>地域の気温を、料理選びの小さなきっかけに。</p><label className="field-label" htmlFor="weather-city">お住まいの近くの都市</label><select id="weather-city" value={cityIndex} disabled={loading} onChange={event => { setCityIndex(Number(event.target.value)); setResult(null); setStatus(''); }}>{cities.map((city, index) => <option key={city.name} value={index}>{city.name}</option>)}</select><p className="small-note">「天気を見る」を押すとOpen-Meteoに接続します。選択した都市の座標と通信に必要なIPアドレス等が送信されます。現在地の取得・保存は行いません。</p><button className="button" disabled={loading} onClick={fetchWeather}><CloudSun size={18}/>{loading ? '空模様を確認中…' : '天気を見る'}</button>{status && <p role="alert" className="error-note">{status}</p>}{result && <div className="weather-result" role="status"><span>{result.city} / {result.time}時点（日本時間）</span><strong>{result.temperature}°<span>C</span></strong><p>{result.temperature < 18 ? '肌寒い日には、湯気の立つスープを。お気に入りの器で楽しみませんか。' : result.temperature > 27 ? '暑い日には、短い時間でつくれるひと皿を。トマトと卵のスープは10分で。' : '過ごしやすい気温の日。季節の食材をひとつ、いつもの献立に加えてみませんか。'}</p></div>}<p className="small-note">気温は予報モデルによる推定値です。データ：<a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>（<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>）</p></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('すべて');
  const [quick, setQuick] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [recipeTheme, setRecipeTheme] = useState<FeelingTheme | null>(null);
  const [learnTab, setLearnTab] = useState<LearnTab>('読みもの');
  const [academyTarget,setAcademyTarget]=useState('balance');
  const [kitchenTab, setKitchenTab] = useState('レシピ');
  const [exploreTab, setExploreTab] = useState('自分チェック');
  const [foodQuery, setFoodQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [notebook, setNotebook] = useState<Notebook>(() => { try { return readNotebook(localStorage.getItem(storageKey), recipes.map(recipe => recipe.id)); } catch { return emptyNotebook; } });
  const term = getSeasonalTerm();
  const copy = seasonCopy[term.season];
  const filtered = filterRecipes(recipes, query, category, quick, seasonFilter ? term.season : '').filter(recipe => !recipeTheme || recipeTheme.dishes.some(dish => dish.id === recipe.id));
  useEffect(() => { const handler = () => { setPage(currentPage()); setModal(null); window.scrollTo({ top: 0 }); }; window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(notebook)); setStorageError(false); } catch { setStorageError(true); } }, [notebook]);
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timeout); }, [notice]);
  useEffect(() => { document.title = `${navItems.find(item => item.id === page)?.label} | 季の膳`; }, [page]);
  function navigate(target: Page) { if (page === target) window.scrollTo({ top: 0, behavior: 'smooth' }); else window.location.hash = target; }
  function saveRecipe(recipe: Recipe) { const saved = notebook.saved.includes(recipe.id); setNotebook(value => ({ ...value, saved: saved ? value.saved.filter(id => id !== recipe.id) : [...value.saved, recipe.id] })); setNotice(saved ? '手帖からレシピを外しました' : 'レシピを手帖に保存しました'); }
  function openRecipe(recipe: Recipe, theme?: FeelingTheme) { setModal({ type: 'recipe', recipe, theme }); }
  function searchRecipes(text = '', onlyQuick = false, targetCategory = 'すべて') { setKitchenTab('レシピ'); setRecipeTheme(null); setQuery(text); setQuick(onlyQuick); setCategory(targetCategory); setSeasonFilter(false); setModal(null); navigate('recipes'); }
  function openLearn(tab: LearnTab) { setLearnTab(tab); navigate('learn'); }
  const recipeCard = (recipe: Recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={notebook.saved.includes(recipe.id)} onSave={() => saveRecipe(recipe)} onOpen={() => openRecipe(recipe, page === 'recipes' ? recipeTheme ?? undefined : undefined)}/>;
  return <>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); window.scrollTo({ top: 0 }); }}>本文へスキップ</a>
    <aside className="sidebar"><a className="brand" href="#today" aria-label="季の膳 ホーム"><Sprout size={37} strokeWidth={1.15}/><span className="brand-name">季の膳</span><span className="brand-roman">KI NO ZEN</span></a><p className="brand-tagline">季節と暮らす、薬膳の手帖。</p><nav aria-label="メインナビゲーション">{navItems.map(item => <a className={`nav-item ${page === item.id ? 'selected' : ''}`} key={item.id} href={`#${item.id}`} aria-current={page === item.id ? 'page' : undefined}><item.icon size={21} strokeWidth={1.5}/><span>{item.label}<small>{item.en}</small></span>{item.id === 'notebook' && notebook.saved.length > 0 && <span className="nav-count">{notebook.saved.length}</span>}{page === item.id && <span className="nav-dot"/>}</a>)}</nav><div className="sidebar-bottom"><div className="sidebar-season"><Wheat size={48} strokeWidth={.85}/><span>季節を知ると、<br/>ごはんが、もっと楽しい。</span></div><button onClick={() => setModal({ type: 'about' })}>季の膳について<ArrowUpRight size={13}/></button><span className="sidebar-preview">PREVIEW EDITION</span></div></aside>
    <header className="mobile-header"><a className="mobile-brand" href="#today"><Sprout size={25} strokeWidth={1.3}/><span>季の膳</span><small>KI NO ZEN</small></a><button className="icon-button" aria-label="レシピを探す" onClick={() => searchRecipes()}><Search size={21}/></button></header>
    <main id="main-content" className="main-shell" tabIndex={-1}>
      <header className="topbar"><div className="topbar-date"><span>{new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric' }).format(new Date())}</span><span className="topbar-divider"/><span>{copy.mood}</span></div><div className="topbar-actions"><button onClick={() => setModal({ type: 'weather' })}><CloudSun size={18}/><span>空模様と食卓</span></button><button className="icon-button" aria-label="レシピを検索" onClick={() => searchRecipes()}><Search size={19}/></button></div></header>
      {storageError && <div className="storage-warning" role="alert">このブラウザでは保存できません。手帖の内容は画面を閉じると失われます。</div>}

      {page === 'today' && <Today personal={<><section className="rich-entry"><span className="eyebrow">YOUR TABLE, YOUR PACE</span><h2>今日の食卓と、わたしの学び。</h2><div className="chip-row">{['自分チェック','季節の特集'].map(t=><button className={`chip ${exploreTab===t?'selected':''}`} key={t} onClick={()=>setExploreTab(t)}>{t}</button>)}<button className="chip" onClick={()=>{setKitchenTab('献立づくり');navigate('recipes');}}>献立をつくる →</button><button className="chip" onClick={()=>openLearn('読みもの')}>薬膳を学ぶ →</button></div><details className="home-discovery"><summary>{exploreTab==='自分チェック'?'今日の自分を振り返る（6問）':'四季の食卓をひらく'}</summary>{exploreTab==='自分チェック'?<SelfCheck onLearn={id=>{setAcademyTarget(id??'balance');openLearn('読みもの');}} onSearch={searchRecipes}/>:<SeasonalFeatures onOpen={openRecipe} onFood={name=>{setFoodQuery(name);openLearn('食材辞典');}} onLearn={()=>openLearn('読みもの')}/>}</details></section><PersonalTable notebook={notebook} onOpen={openRecipe}/></>} selected={selectedFeeling} onSelect={setSelectedFeeling} term={term} onSearch={searchRecipes} onSeason={() => { searchRecipes(); setSeasonFilter(true); }} onLearn={() => openLearn('読みもの')} onNotebook={() => navigate('notebook')} onFilter={theme => { searchRecipes(); setRecipeTheme(theme); }} renderRecipe={(recipe, theme) => <RecipeCard key={recipe.id} recipe={recipe} saved={notebook.saved.includes(recipe.id)} onSave={() => saveRecipe(recipe)} onOpen={() => openRecipe(recipe, theme)}/>}/>}
      {page === 'recipes' && <div className="page-enter"><div className="page-heading"><span className="eyebrow">FROM YOUR KITCHEN</span><h1>今日のひと皿を、見つける。</h1><p>旬の食材から、冷蔵庫の中から。いまの気分で選びましょう。</p></div><div className="experience-tabs">{['レシピ','献立づくり','家にある食材'].map(t=><button className={kitchenTab===t?'selected':''} aria-pressed={kitchenTab===t} key={t} onClick={()=>setKitchenTab(t)}>{t}</button>)}</div>{kitchenTab==='献立づくり'&&<Planner notebook={notebook} update={setNotebook} onOpen={openRecipe} notify={setNotice}/>} {kitchenTab==='家にある食材'&&<Pantry onOpen={openRecipe}/>} {kitchenTab==='レシピ'&&<>{recipeTheme && <div className="theme-filter-banner"><span>いまの自分から：{recipeTheme.label} · 料理の候補</span><button className="text-button" onClick={() => setRecipeTheme(null)}>テーマを外す<X size={15}/></button></div>}<section className="search-panel"><label className="search-field"><Search size={21}/><input aria-label="レシピや食材を検索" placeholder="食材や料理名で探す（例：れんこん、生姜）" value={query} onChange={event => setQuery(event.target.value)}/>{query && <button className="icon-button" aria-label="検索をクリア" onClick={() => setQuery('')}><X size={18}/></button>}</label><div className="popular-ingredients"><span>食材から</span>{['れんこん', 'しめじ', '梨', '生姜', 'かぼちゃ'].map(name => <button key={name} onClick={() => setQuery(name)}>{name}</button>)}</div><div className="filter-row"><div className="chip-row" aria-label="料理の種類">{['すべて', 'ごはん', '汁もの', 'おかず', '甘いもの'].map(name => <button className={`chip ${category === name ? 'selected' : ''}`} key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div><div className="filter-toggles"><SlidersHorizontal size={15}/><label><input type="checkbox" checked={quick} onChange={event => setQuick(event.target.checked)}/>15分以内</label><label><input type="checkbox" checked={seasonFilter} onChange={event => setSeasonFilter(event.target.checked)}/>{term.season}のおすすめ</label></div></div></section><div className="result-heading"><span><strong>{filtered.length}</strong> のレシピ</span><span>すべて身近な食材で</span></div>{filtered.length ? <div className="recipe-grid all-recipes">{filtered.map(recipeCard)}</div> : <div className="empty-state"><Search size={36} strokeWidth={1}/><h2>ぴったりのひと皿は、まだありません。</h2><p>食材をひとつにするか、絞り込みを変えてみてください。</p><button className="button button-outline" onClick={() => { setQuery(''); setCategory('すべて'); setQuick(false); setSeasonFilter(false); setRecipeTheme(null); }}>すべてのレシピを見る</button></div>}<p className="small-note recipe-preview-note">公開プレビューとして{recipes.length}品を掲載しています。レシピ・解説は国際薬膳師による監修と試作の確認前です。</p></>}</div>}
      {page === 'learn' && <div className="page-enter"><div className="page-heading"><span className="eyebrow">A JOURNAL OF SEASONAL LIVING</span><h1>知るほど、食卓が豊かになる。</h1><p>季節のこと、食材のこと。暮らしの中に、少しずつ。</p></div><div className="tabs" role="tablist" aria-label="学びの種類">{(['読みもの', '食材辞典', '季節の暦', 'クイズ'] as LearnTab[]).map(tab => <button key={tab} role="tab" aria-selected={learnTab === tab} className={learnTab === tab ? 'selected' : ''} onClick={() => setLearnTab(tab)}>{tab}</button>)}</div>
        {learnTab === '読みもの' && <><Academy key={academyTarget} initialId={academyTarget} notebook={notebook} update={setNotebook}/><div className="theme-library">{feelingThemes.map(theme => <ThemeReading key={theme.id} theme={theme}/>)}</div><div className="lesson-grid">{lessons.map((lesson, index) => <button className={`lesson-card lesson-${index}`} key={lesson.title} onClick={() => setModal({ type: 'lesson', index })}><div className="lesson-art">{index === 0 ? <Sprout size={76} strokeWidth={.8}/> : index === 1 ? <Sun size={76} strokeWidth={.8}/> : index === 2 ? <Flower2 size={76} strokeWidth={.8}/> : <BookOpen size={76} strokeWidth={.8}/>}<span>0{index + 1}</span></div><div><span className="eyebrow">{lesson.label}</span><h2>{lesson.title}</h2><p>{lesson.paragraphs[0]}</p><span className="lesson-bottom"><span><Clock3 size={13}/>{lesson.time}分で読む</span><ArrowUpRight size={19}/></span></div></button>)}</div></>}
        {learnTab === '食材辞典' && <><label className="search-field food-search"><Search size={19}/><input aria-label="食材辞典を検索" placeholder="食材の名前で探す" value={foodQuery} onChange={event => setFoodQuery(event.target.value)}/>{foodQuery && <button className="icon-button" aria-label="食材検索をクリア" onClick={() => setFoodQuery('')}><X size={17}/></button>}</label><div className="food-grid">{foodEntries.map((food, index) => `${food.name}${food.reading}`.includes(foodQuery.trim()) && <button className="food-card" key={food.name} onClick={() => setModal({ type: 'food', index })}><FoodDrawing kind={food.icon}/><span className="food-season">{food.season}</span><h2>{food.name}</h2><span className="food-reading">{food.reading}</span><p>{food.description}</p><span className="text-button">食材を知る<ArrowUpRight size={15}/></span></button>)}</div>{!foodEntries.some(food => `${food.name}${food.reading}`.includes(foodQuery.trim())) && <div className="empty-state"><Sprout size={35}/><h2>その食材は、まだ手帖にありません。</h2><button className="text-button" onClick={() => setFoodQuery('')}>すべての食材を見る<ArrowRight size={16}/></button></div>}</>}
        {learnTab === '季節の暦' && <><SeasonalFeatures onOpen={openRecipe} onFood={name=>{setFoodQuery(name);setLearnTab('食材辞典');}} onLearn={()=>setLearnTab('読みもの')}/><section className="calendar-intro"><div><span className="eyebrow">NOW IN SEASON</span><h2>{term.name}<small>{term.reading}</small></h2><p>{copy.heading}<br/>{copy.text}</p><button className="text-button" onClick={() => { setRecipeTheme(null); setSeasonFilter(true); setQuery(''); setCategory('すべて'); setQuick(false); navigate('recipes'); }}>{term.season}のレシピを見る<ArrowRight size={16}/></button></div><Wheat size={130} strokeWidth={.65}/></section><p className="small-note">日付は一般的な目安で、年によって前後します。日本時間を基準に表示しています。</p><div className="calendar-grid">{seasonalTerms.map((item, index) => <button key={item.name} className={term.name === item.name ? 'current' : ''} onClick={() => { setModal({ type: 'lesson', index: 1 }); }}><span>{String(index + 1).padStart(2, '0')}<span>{item.season}</span></span><h3>{item.name}</h3><small>{item.reading}</small><p>{item.range}</p>{term.name === item.name && <span className="now-label">いまの季節</span>}</button>)}</div></>}
        {learnTab === 'クイズ' && <QuizPanel/>}
      </div>}
      {page === 'notebook' && <details className="rich-panel"><summary>食卓カレンダー・献立・学びの手帖をひらく</summary><JournalCalendar notebook={notebook} update={setNotebook} onOpen={openRecipe} notify={setNotice}/><Planner notebook={notebook} update={setNotebook} onOpen={openRecipe} notify={setNotice}/><Academy key={academyTarget} initialId={academyTarget} notebook={notebook} update={setNotebook}/></details>}
      {page === 'notebook' && <NotebookPage notebook={notebook} update={setNotebook} recipeCard={recipeCard} onOpen={openRecipe} onSearch={() => searchRecipes()} onReset={() => setModal({ type: 'reset' })} notify={setNotice}/>}
      {!modal && <KitchenTimer notebook={notebook} update={setNotebook} compact/>}
      <footer className="footer"><div className="footer-brand"><Sprout size={19} strokeWidth={1.2}/><span>季の膳</span><small>季節をひとさじ、わたしの食卓へ。</small></div><div className="footer-links"><button onClick={() => setModal({ type: 'about' })}>このアプリについて</button><button onClick={() => setModal({ type: 'privacy' })}>プライバシー</button><span>© {new Date().getFullYear()} KI NO ZEN</span></div><p>食と暮らしの知識を楽しむアプリです。診断・治療・疾病予防を目的としたものではありません。体調に不安がある場合は医療機関にご相談ください。</p><p className="preview-disclosure">PREVIEW · レシピ・解説は監修確認前です。料理写真はAI生成イメージです。</p></footer>
    </main>
    <nav className="mobile-nav" aria-label="モバイルナビゲーション">{navItems.map(item => <a key={item.id} className={page === item.id ? 'selected' : ''} href={`#${item.id}`} aria-current={page === item.id ? 'page' : undefined}><item.icon size={21} strokeWidth={1.5}/><span>{item.label}</span></a>)}</nav>
    {notice && !modal && <div className="toast" role="status"><Check size={17}/>{notice}</div>}
    {modal && <Modal key={modal.type === 'recipe' ? modal.recipe.id : modal.type === 'food' || modal.type === 'lesson' ? `${modal.type}-${modal.index}` : modal.type} title={modal.type === 'recipe' ? modal.recipe.title.replace('\n', '') : modal.type === 'food' ? foodEntries[modal.index].name : modal.type === 'lesson' ? lessons[modal.index].title : modal.type === 'weather' ? '空模様と食卓' : modal.type === 'reset' ? '手帖のデータを削除' : modal.type === 'privacy' ? 'プライバシー' : '季の膳について'} wide={modal.type === 'recipe'} onClose={() => setModal(null)}>
      {modal.type === 'recipe' && <>{modal.theme && <div className="recipe-context"><span className="eyebrow">{modal.theme.label} / この料理を選んだ理由</span><p>{modal.theme.dishes.find(dish => dish.id === modal.recipe.id)?.reason}</p><ThemeReading theme={modal.theme}/></div>}<RecipeDetail recipe={modal.recipe} notebook={notebook} update={setNotebook} onSave={() => saveRecipe(modal.recipe)} onNotify={setNotice} onFood={index => setModal({ type: 'food', index })}/></>}
      {modal.type === 'food' && <div className="text-modal food-modal"><span className="eyebrow">INGREDIENT NOTES</span><FoodDrawing kind={foodEntries[modal.index].icon}/><h2>{foodEntries[modal.index].name}<small>{foodEntries[modal.index].reading}</small></h2><span className="season-pill">季節の目安：{foodEntries[modal.index].season}</span><p>{foodEntries[modal.index].description}</p><h3>台所のひと工夫</h3><p>{foodEntries[modal.index].tip}</p><FoodStudy name={foodEntries[modal.index].name}/><h3>一緒に楽しみたい食材</h3><p>{foodEntries[modal.index].match}</p><button className="button" onClick={() => searchRecipes(foodEntries[modal.index].name)}>この食材のレシピを見る<ArrowRight size={16}/></button><p className="small-note">旬には地域や品種による違いがあります。食材解説は監修確認前のプレビューです。</p></div>}
      {modal.type === 'lesson' && <article className="text-modal article-modal"><span className="eyebrow">{lessons[modal.index].label}</span><Sprout size={48} strokeWidth={1} className="article-icon"/><h2>{lessons[modal.index].title}</h2><span className="article-time"><Clock3 size={14}/>{lessons[modal.index].time}分で読む</span>{lessons[modal.index].paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{modal.index === 1 && <p className="small-note">参考：<a href="https://eco.mtk.nao.ac.jp/koyomi/" target="_blank" rel="noreferrer">国立天文台 暦計算室</a></p>}<p className="small-note">食文化としての入門解説です。監修者による出典・内容の確認後に正式版へ更新します。</p><button className="button button-outline" onClick={() => { setModal(null); openLearn('クイズ'); }}>小さなクイズを楽しむ<ArrowRight size={16}/></button></article>}
      {modal.type === 'weather' && <WeatherPanel/>}
      {modal.type === 'about' && <div className="text-modal"><span className="eyebrow">OUR PHILOSOPHY</span><Sprout className="article-icon" size={44} strokeWidth={1}/><h2>季節をひとさじ、<br/>わたしの食卓へ。</h2><p>季の膳は、季節と暮らしに合わせて今日のひと皿を選ぶ、食の手帖です。身近な食材から、薬膳の食文化に親しむきっかけを届けます。</p><h3>いまは、公開プレビューです。</h3><p>薬膳の食文化を学び、日々の食卓で楽しむアプリとして準備を進めています。現在の{recipes.length}品のレシピと解説は、監修者による内容確認・試作前のサンプルです。資格の正式名称・認定団体・担当者情報は、確認後に掲載します。</p><h3>食と暮らしを楽しむために。</h3><p>このアプリは診断・治療・疾病予防を目的とせず、食材による効果や安全性を個人に保証するものではありません。体調の不安、食物アレルギー、食事制限などは医療専門職へ相談してください。</p><p>料理写真はAIで生成したイメージです。実際の調理結果とは異なる場合があります。いま感じていることを読みものや料理選びの入口にし、季節・食材・好み・調理時間でも探せる機能を提供し、病歴や体質の判定は行いません。</p><h3>参考にした公的情報</h3><ul className="source-links"><li><a href="https://www.caa.go.jp/policies/policy/representation/extravagant_advertisement" target="_blank" rel="noreferrer">消費者庁：健康増進法と健康食品の表示</a></li><li><a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000179749_00004.html" target="_blank" rel="noreferrer">厚生労働省：医療機器プログラムについて</a></li><li><a href="https://eco.mtk.nao.ac.jp/koyomi/" target="_blank" rel="noreferrer">国立天文台：暦計算室</a></li></ul></div>}
      {modal.type === 'privacy' && <div className="text-modal"><span className="eyebrow">YOUR PRIVACY</span><h2>あなたの手帖は、<br/>あなたのブラウザに。</h2><h3>保存するもの</h3><p>お気に入りのレシピ、買い物リスト、メモ・感想、つくった日付、調理途中とタイマー、献立、学びの保存・読了・メモを、この端末のブラウザの保存領域（localStorage）に記録します。運営者のサーバーへの送信や、端末間の同期は行いません。</p><h3>収集しないもの</h3><p>氏名、メールアドレス、病歴、服薬情報、正確な現在地は入力不要です。自分チェックの回答と「いまの自分」の選択は画面内でのみ使用し、保存・送信しません。ページの再読み込みでリセットされます。広告やアクセス解析の仕組みは組み込んでいません。</p><h3>外部への通信</h3><p>サイトの配信元であるGitHub Pagesには、アクセスに伴うIPアドレスなどが送信されます。天気機能はボタンを押した場合のみOpen-Meteoへ接続し、選択都市の座標と通信に必要な情報を送信します。外部リンク先にはそれぞれのプライバシーポリシーが適用されます。</p><h3>データを消すには</h3><p>手帖の「手帖のデータを削除」から、このアプリの保存データを削除できます。ブラウザのサイトデータを消去した場合も記録は消え、復元できません。共有端末での利用にご注意ください。</p><p className="small-note">運営者情報と問い合わせ先は、正式版の公開時に掲載予定です。現時点ではアカウント登録や有料サービスを提供していません。</p></div>}
      {modal.type === 'reset' && <div className="text-modal"><span className="eyebrow">RESET NOTEBOOK</span><h2>手帖を、白紙に戻しますか？</h2><p>保存したレシピ、買い物リスト、メモ、つくった記録、調理途中とタイマー、献立・学習記録を、このブラウザからすべて削除します。この操作は取り消せません。</p><div className="dialog-actions"><button className="button button-outline" onClick={() => setModal(null)}>残しておく</button><button className="button danger" onClick={() => { setNotebook({ ...emptyNotebook, notes: {}, drafts: {} }); setModal(null); setNotice('手帖のデータを削除しました'); }}><Trash2 size={16}/>すべて削除</button></div></div>}
      {notice && <div className="modal-toast" role="status"><Check size={17}/>{notice}</div>}
    </Modal>}
  </>;
}
