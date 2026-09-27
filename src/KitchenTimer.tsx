import { useEffect, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw } from 'lucide-react';
import { timerRemaining, type Notebook } from './notebook';
import type { UpdateNotebook } from './Journal';

export function KitchenTimer({ notebook, update, compact = false }: { notebook: Notebook; update: UpdateNotebook; compact?: boolean }) {
  const [minutes, setMinutes] = useState(5);
  const [now, setNow] = useState(Date.now());
  const timer = notebook.timer;
  useEffect(() => {
    setNow(Date.now());
    if (!timer?.endsAt) return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [timer]);
  const remaining = timer ? timerRemaining(timer, now) : 0;
  const seconds = Math.ceil(remaining / 1000);
  const ended = !!timer && remaining === 0;
  if (compact && !timer) return null;
  return <section className={`kitchen-timer ${compact ? 'timer-compact' : ''}`} aria-label="キッチンタイマー"><div className="timer-label"><Clock3 size={18}/><span>キッチンタイマー</span></div>{timer ? <><div className="timer-readout" role="timer" aria-label="残り時間">{String(Math.floor(seconds / 60)).padStart(2, '0')}<span>:</span>{String(seconds % 60).padStart(2, '0')}</div><p className="timer-status" role="status">{ended ? '時間になりました。火の通りを確認しましょう。' : timer.endsAt ? '計測中' : '一時停止中'}</p><div className="timer-controls">{!ended && <button className="text-button" onClick={() => update(value => value.timer ? ({ ...value, timer: value.timer.endsAt ? { ...value.timer, remainingMs: timerRemaining(value.timer), endsAt: null } : { ...value.timer, endsAt: Date.now() + value.timer.remainingMs } }) : value)}>{timer.endsAt ? <Pause size={16}/> : <Play size={16}/>}{timer.endsAt ? '一時停止' : '再開'}</button>}<button className="text-button" onClick={() => update(value => ({ ...value, timer: null }))}><RotateCcw size={16}/>タイマーをリセット</button></div></> : <form className="timer-start" onSubmit={event => { event.preventDefault(); const durationMs = minutes * 60000; if (minutes >= 1 && minutes <= 599 && Number.isInteger(minutes)) update(value => ({ ...value, timer: { durationMs, remainingMs: durationMs, endsAt: Date.now() + durationMs } })); }}><label><input aria-label="タイマーの分数" type="number" min={1} max={599} step={1} required value={minutes} onChange={event => setMinutes(Number(event.target.value))}/> 分</label><button className="button" type="submit"><Play size={15}/>開始</button></form>}{!compact && <p className="small-note">同時に使えるタイマーは1つです。画面を閉じた間の通知・音はありません。戻ると残り時間を再計算します。</p>}</section>;
}
