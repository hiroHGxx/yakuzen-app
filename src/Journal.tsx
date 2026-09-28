import { useEffect, useRef, useState } from 'react';
import { Check, Heart, Pencil, Trash2 } from 'lucide-react';
import { recipes, type Recipe } from './data';
import { todayISO } from './lib';
import { validDate, type JournalEntry, type Notebook } from './notebook';
export type UpdateNotebook = (updater: (value: Notebook) => Notebook) => void;

export function RecipeMemo({ recipe, notebook, update, notify }: { recipe: Recipe; notebook: Notebook; update: UpdateNotebook; notify: (message: string) => void }) {
  const saved = notebook.notes[recipe.id] ?? '';
  const [draft, setDraft] = useState(saved);
  useEffect(() => setDraft(saved), [saved, recipe.id]);
  return <section className="personal-memo"><div className="journal-label"><Pencil size={18}/><h3>次のわたしへの、ひとこと。</h3></div><p>味の好みや、次につくるときの工夫を。</p><label><span className="sr-only">料理のひとことメモ</span><textarea aria-label="料理のひとことメモ" maxLength={1000} rows={3} value={draft} placeholder="次は生姜を少なめに。お気に入りの器で。" onChange={event => setDraft(event.target.value)}/></label><div className="memo-actions"><span>{draft.length} / 1000</span><button className="text-button" disabled={!saved && !draft} onClick={() => { setDraft(''); update(value => { const notes = { ...value.notes }; delete notes[recipe.id]; return { ...value, notes }; }); notify('料理のメモを削除しました'); }}><Trash2 size={15}/>削除</button><button className="button" disabled={draft.trim() === saved} onClick={() => { update(value => { const notes = { ...value.notes }; if (draft.trim()) notes[recipe.id] = draft.trim(); else delete notes[recipe.id]; return { ...value, notes }; }); notify('料理のメモを保存しました'); }}><Check size={16}/>メモを保存</button></div></section>;
}

export function JournalForm({ notebook, update, initialRecipeId, entry, onDone, onCancel }: { notebook: Notebook; update: UpdateNotebook; initialRecipeId?: string; entry?: JournalEntry; onDone: () => void; onCancel: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'nearest' }); }, []);
  const [recipeId, setRecipeId] = useState(entry?.recipeId ?? initialRecipeId ?? recipes[0].id);
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [comment, setComment] = useState(entry?.comment ?? '');
  const [again, setAgain] = useState(entry?.again ?? false);
  const [error, setError] = useState('');
  return <form className="journal-form" onSubmit={event => {
    event.preventDefault();
    if (!validDate(date) || date > todayISO() || date < '1900-01-01') { setError('今日までの有効な日付を選んでください。'); return; }
    if (notebook.cooked.some(item => item.id !== entry?.id && item.recipeId === recipeId && item.date === date)) { setError('この料理は同じ日付で記録済みです。既存の記録から編集してください。'); return; }
    const saved: JournalEntry = { id: entry?.id ?? crypto.randomUUID(), recipeId, date, comment: comment.trim(), again };
    update(value => ({ ...value, cooked: [...value.cooked.filter(item => item.id !== saved.id), saved] }));
    onDone();
  }}><span className="eyebrow">食卓の記憶</span><h3 ref={heading} tabIndex={-1}>{entry ? 'あの日の記録を、整える。' : 'つくった日のことを、残す。'}</h3><div className="journal-fields"><label>料理<select aria-label="記録する料理" disabled={!!initialRecipeId} value={recipeId} onChange={event => { setRecipeId(event.target.value); setError(''); }}>{recipes.map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.title.replace('\n', '')}</option>)}</select></label><label>つくった日<input aria-label="つくった日" type="date" required min="1900-01-01" max={todayISO()} value={date} onChange={event => { setDate(event.target.value); setError(''); }}/></label></div><label>その日の感想<textarea aria-label="その日の感想" maxLength={1000} rows={3} value={comment} onChange={event => setComment(event.target.value)} placeholder="家族にも好評。次は少し薄味にしてみよう。"/></label><label className="again-check"><input type="checkbox" checked={again} onChange={event => setAgain(event.target.checked)}/><Heart size={16}/>またつくりたい</label>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button button-outline" onClick={onCancel}>キャンセル</button><button className="button" type="submit">記録を保存</button></div></form>;
}
