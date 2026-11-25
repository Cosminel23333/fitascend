import { useEffect, useState } from 'react'
import { loadExercises, muscleName, type Exercise } from '../lib/exercises'
import { useI18n } from '../lib/i18n'
import { byExercise, progress, type HistSet, type Session } from '../lib/progress'
import { videoFor } from '../lib/videos'
import { loadSets } from '../lib/workouts'

export function useHistory(exId: string) {
  const [p, setP] = useState<ReturnType<typeof progress> | 'error' | null>(null)
  useEffect(() => { loadSets(exId).then(s => setP(progress(s)), () => setP('error')) }, [exId])
  return p
}

export function useFmt() {
  const { t, lang } = useI18n()
  const locale = lang === 'ro' ? 'ro-RO' : 'en-GB'
  const kg = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 })
  const set = (s: HistSet) => (s.weight_kg > 0 ? `${s.reps} × ${kg(s.weight_kg)} kg` : `${s.reps} ${t('workout.repsShort')}`)
  const date = (d: string) => new Date(`${d}T12:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return { kg, set, date }
}

type Item = ReturnType<typeof byExercise>[number]

// every exercise the user has trained; tapping one opens its chart and how-to clip
export default function ProgressPage({ onBack }: { onBack: () => void }) {
  const { t, lang } = useI18n()
  const f = useFmt()
  const [items, setItems] = useState<Item[] | 'error' | null>(null)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [open, setOpen] = useState<Item | null>(null)

  useEffect(() => { loadSets().then(rows => setItems(byExercise(rows)), () => setItems('error')) }, [])
  useEffect(() => { void loadExercises().then(setLibrary) }, [])
  useEffect(() => { scrollTo(0, 0) }, [open])

  if (open) return <ExerciseProgress item={open} muscles={library.find(e => e.id === open.id)?.m ?? []} onBack={() => setOpen(null)} />

  return (
    <>
      <button className="link back" onClick={onBack}>‹ {t('workout.title')}</button>
      <header className="page-head pr-head">
        <h1>{t('pr.title')}</h1>
        <span className="date">{t('pr.sub')}</span>
      </header>
      {items === null && <p className="muted">{t('common.loading')}</p>}
      {items === 'error' && <p className="muted">{t('workout.historyNeedNet')}</p>}
      {Array.isArray(items) && items.length === 0 && <section className="card"><p className="muted" style={{ margin: 0 }}>{t('pr.empty')}</p></section>}
      {Array.isArray(items) && items.length > 0 && (
        <ul className="pr-list">
          {items.map(it => {
            const ex = library.find(e => e.id === it.id)
            const last = it.sessions[it.sessions.length - 1]
            return (
              <li key={it.id}>
                <button className="pr-item" onClick={() => setOpen(it)}>
                  <span className="pr-item-main">
                    <b>{it.name}</b>
                    <small className="muted">{ex?.m.map(m => muscleName(m, lang)).join(', ') || t('workout.own')}</small>
                  </span>
                  <span className="pr-item-side">
                    {it.record && <b>{f.set(it.record)}</b>}
                    <small className="muted">{it.sessions.length} {t('pr.sessions')} · {f.date(last.day)}</small>
                  </span>
                  {videoFor(it.id, it.name) && <span className="pr-play" aria-label={t('pr.hasVideo')}>▶</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function ExerciseProgress({ item, muscles, onBack }: { item: Item; muscles: string[]; onBack: () => void }) {
  const { t, lang } = useI18n()
  const f = useFmt()
  const video = videoFor(item.id, item.name)
  const weighted = item.bestE1rm > 0
  return (
    <>
      <button className="link back" onClick={onBack}>‹ {t('pr.title')}</button>
      <header className="pr-hero">
        <h1>{item.name}</h1>
        {muscles.length > 0 && <span className="muted">{muscles.map(m => muscleName(m, lang)).join(' · ')}</span>}
      </header>
      {video && (
        <div className="pr-video">
          <video src={video} autoPlay muted loop playsInline preload="auto" aria-label={`${t('workout.howTo')}: ${item.name}`} />
        </div>
      )}
      <div className="pr-stats">
        {item.record && <div><small>{t('workout.record')}</small><b>{f.set(item.record)}</b></div>}
        {weighted && <div><small>{t('workout.e1rm')}</small><b>~{f.kg(item.bestE1rm)} kg</b></div>}
        <div><small>{t('pr.sessionsTitle')}</small><b>{item.sessions.length}</b></div>
      </div>
      <section className="card">
        {item.sessions.length > 1
          ? <Chart sessions={item.sessions} label={t(weighted ? 'workout.chartE1rm' : 'workout.chartReps')} date={f.date} fmt={f.kg} />
          : <p className="muted" style={{ margin: 0 }}>{t('pr.oneSession')}</p>}
      </section>
      <section className="card">
        <h2>{t('workout.allSessions')}</h2>
        <ul className="pr-sessions">
          {[...item.sessions].reverse().map(s => <li key={s.day}><span className="muted">{f.date(s.day)}</span><span>{s.sets.map(f.set).join(', ')}</span></li>)}
        </ul>
      </section>
    </>
  )
}

// one line, best of each session, drawn in on open; tap a point to read it (the last one is shown first)
function Chart({ sessions, label, date, fmt }: { sessions: Session[]; label: string; date: (d: string) => string; fmt: (n: number) => string }) {
  const [sel, setSel] = useState(sessions.length - 1)
  const W = 300, H = 150, L = 34, R = 10, T = 26, B = 20
  const ys = sessions.map(s => s.best)
  const lo = Math.min(...ys), hi = Math.max(...ys)
  const pad = (hi - lo) * 0.1 || 1
  const x = (i: number) => L + (i * (W - L - R)) / (sessions.length - 1)
  const y = (v: number) => T + ((hi + pad - v) * (H - T - B)) / (hi - lo + 2 * pad)
  const s = sessions[sel]
  const pts = sessions.map((s, i) => `${x(i)},${y(s.best)}`).join(' ')
  return (
    <figure className="chart">
      <figcaption className="muted">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${sessions.map(s => `${date(s.day)} ${fmt(s.best)}`).join(', ')}`}>
        <defs>
          <linearGradient id="prArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EE4A1F" stopOpacity="0.28" />
            <stop offset="1" stopColor="#EE4A1F" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...new Set([hi, lo])].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="chart-axis">{fmt(v)}</text>
          </g>
        ))}
        <text x={L} y={H - 4} className="chart-axis">{date(sessions[0].day)}</text>
        <text x={W - R} y={H - 4} textAnchor="end" className="chart-axis">{date(sessions[sessions.length - 1].day)}</text>
        <polygon points={`${x(0)},${H - B} ${pts} ${x(sessions.length - 1)},${H - B}`} fill="url(#prArea)" className="chart-area" />
        <polyline points={pts} pathLength={1} className="chart-line" />
        <text x={Math.min(Math.max(x(sel), L + 30), W - R - 30)} y={y(s.best) - 10} textAnchor="middle" className="chart-tip">
          {fmt(s.best)} · {date(s.day)}
        </text>
        {sessions.map((s, i) => (
          <g key={s.day} onClick={() => setSel(i)}>
            <circle cx={x(i)} cy={y(s.best)} r={i === sel ? 5 : 4} className="chart-dot" />
            <circle cx={x(i)} cy={y(s.best)} r={16} fill="transparent" />
          </g>
        ))}
      </svg>
    </figure>
  )
}
