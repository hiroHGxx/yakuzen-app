import { useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, CookingPot, Leaf, Search, Sprout } from 'lucide-react';
import { asset, recipes, type Recipe } from './data';
import { feelingThemes, type FeelingTheme } from './themes';
import './today.css';

export function ThemeReading({ theme }: { theme: FeelingTheme }) {
  return <details className="theme-reading">
    <summary><BookOpen size={17}/>薬膳の考え方を読む<span>＋</span></summary>
    <div><h3>{theme.concept}</h3><p>{theme.explanation}</p><p>{theme.practice}</p>
      <p className="small-note">伝統理論の参考資料：<a href={theme.source.url} target="_blank" rel="noreferrer">{theme.source.title}</a><br/>参考資料は掲載料理の効果を裏づけるものではありません。料理の選定・解説は編集上の提案で、監修確認前です。</p>
    </div>
  </details>;
}

type TodayProps = {
  selected: string | null;
  onSelect: (id: string | null) => void;
  renderRecipe: (recipe: Recipe, theme?: FeelingTheme) => ReactNode;
  onSearch: (query: string) => void;
  onSeason: () => void;
  onLearn: () => void;
  onNotebook: () => void;
  onFilter: (theme: FeelingTheme) => void;
  term: { name: string; season: string; range: string };
};

export function Today({ selected, onSelect, renderRecipe, onSearch, onSeason, onLearn, onNotebook, onFilter, term }: TodayProps) {
  const [ingredient, setIngredient] = useState('');
  const theme = feelingThemes.find(item => item.id === selected);
  const seasonalRecipe = recipes.find(recipe => recipe.seasons.includes(term.season)) ?? recipes[0];
  return <div className="page-enter today-redesign">
    <section className="feeling-hero">
      <div className="feeling-intro"><span className="eyebrow">A TABLE FOR THE WAY YOU FEEL.</span>
        <h1>いまのわたしに、<br/>今日のひと皿。</h1>
        <p>自分に耳をすませることから、薬膳は身近に。<br/>いま感じていることを、食事選びのきっかけに。</p>
        <span className="feeling-signature"><Sprout size={20} strokeWidth={1.2}/>自分を知る。食を選ぶ。暮らしを楽しむ。</span>
      </div>
      <div className="feeling-photo"><img src={asset('soup')} width="1536" height="1024" alt="生姜を添えたれんこんと鶏肉のスープ" fetchPriority="high"/><span>ひと呼吸、ひとさじ。<small>KI NO ZEN · DAILY TABLE</small></span></div>
    </section>
    <section className="feeling-selector" aria-labelledby="feeling-title">
      <div className="section-heading"><div><span className="eyebrow">01 / LISTEN TO YOURSELF</span><h2 id="feeling-title">いまの自分から、選ぶ。</h2></div><span className="optional-label">選ばずに探しても、大丈夫。</span></div>
      <div className="feeling-options">{feelingThemes.map((item, index) => <button key={item.id} aria-pressed={selected === item.id} className={`feeling-option ${selected === item.id ? 'selected' : ''}`} onClick={() => onSelect(selected === item.id ? null : item.id)}><span className="feeling-number">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.caption}</small></span>{selected === item.id ? <Check size={17}/> : <ArrowRight size={17}/>}</button>)}</div>
      <p className="selection-note">診断ではなく、読みものと料理を選ぶための入口です。選択内容は保存・送信しません。</p>
    </section>
    {theme && <section className="theme-result" aria-labelledby="theme-result-title">
      <div className="theme-heading" aria-live="polite"><span className="eyebrow">YOUR TABLE / {theme.label}</span><h2 id="theme-result-title">{theme.title}</h2><p>{theme.introduction}</p></div>
      <ThemeReading key={theme.id} theme={theme}/>
      <div className="theme-dishes">{theme.dishes.map(dish => {
        const recipe = recipes.find(item => item.id === dish.id)!;
        return <div key={dish.id}>{renderRecipe(recipe, theme)}<p className="dish-reason"><span>この料理を選んだ理由</span>{dish.reason}</p></div>;
      })}</div>
      <div className="theme-next"><button className="button button-outline" onClick={() => onFilter(theme)}>この中から食材・時間で絞る<ArrowRight size={16}/></button><button className="text-button" onClick={() => onSearch('')}>別の料理も見る<ArrowRight size={16}/></button></div>
      <p className="small-note">状態の改善を目的とした献立ではありません。不調が強い・続く場合は、食事だけで対処せず医療機関へご相談ください。</p>
    </section>}
    <section className="other-entries" aria-labelledby="other-title">
      <div className="section-heading"><div><span className="eyebrow">02 / FIND YOUR OWN WAY</span><h2 id="other-title">食卓への入口は、ほかにも。</h2></div></div>
      <div className="entry-grid"><div className="ingredient-entry"><CookingPot size={27} strokeWidth={1.2}/><span className="eyebrow">IN YOUR KITCHEN</span><h3>家にある食材から。</h3><p>冷蔵庫の中の、いつもの食材で。</p><form onSubmit={event => { event.preventDefault(); onSearch(ingredient.trim()); }}><label className="search-field"><Search size={17}/><input aria-label="家にある食材" value={ingredient} onChange={event => setIngredient(event.target.value)} placeholder="例：れんこん、生姜"/></label><button className="button" type="submit" aria-label="家にある食材で探す"><ArrowRight size={18}/></button></form><div className="ingredient-shortcuts">{['れんこん', '生姜', 'かぼちゃ'].map(name => <button key={name} onClick={() => onSearch(name)}>{name}</button>)}</div></div>
        <button className="season-entry" onClick={onSeason}><img src={asset(seasonalRecipe.image)} alt="" width="1536" height="1024" loading="lazy"/><div><span className="eyebrow">NOW IN SEASON / {term.name}</span><h3>季節のおいしさから。</h3><p>{term.range} · {term.season}の食卓</p><span className="text-button">季節のレシピを見る<ArrowRight size={16}/></span></div></button></div>
    </section>
    <section className="today-links"><button onClick={onLearn}><BookOpen size={24} strokeWidth={1.2}/><span><strong>薬膳の言葉を、少しずつ。</strong><small>食材辞典・読みもの・季節の暦</small></span><ArrowRight size={17}/></button><button onClick={onNotebook}><Leaf size={24} strokeWidth={1.2}/><span><strong>わたしの食卓手帖。</strong><small>保存した料理・買い物リスト</small></span><ArrowRight size={17}/></button></section>
    <p className="small-note today-preview">国際薬膳師による内容確認・試作前の公開プレビューです。料理写真はAI生成イメージです。</p>
  </div>;
}
