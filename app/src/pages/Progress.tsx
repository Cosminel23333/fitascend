import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { localDay } from '../lib/day'
import { loadExercises, muscleName, type Exercise } from '../lib/exercises'
import { useI18n } from '../lib/i18n'
import { byExercise, muscleSets, progress, weekly, type HistRow, type HistSet, type Session } from '../lib/progress'
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

// three.js is big: its own chunk, fetched only when this page shows the figure
const Body3D = lazy(() => import('./Body3D'))

// every exercise the user has trained; tapping one opens its chart and how-to clip
export default function ProgressPage({ onBack }: { onBack: () => void }) {
  const { t, lang } = useI18n()
  const f = useFmt()
  const [rows, setRows] = useState<HistRow[] | 'error' | null>(null)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [open, setOpen] = useState<Item | null>(null)
  const items = useMemo(() => (Array.isArray(rows) ? byExercise(rows) : rows), [rows])

  useEffect(() => { loadSets().then(setRows, () => setRows('error')) }, [])
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
      {Array.isArray(rows) && rows.length > 0 && <Overview rows={rows} library={library} />}
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

// whole-training view: weekly volume or frequency, and the muscles worked this week
function Overview({ rows, library }: { rows: HistRow[]; library: Exercise[] }) {
  const { t, lang } = useI18n()
  const f = useFmt()
  const [view, setView] = useState<'volume' | 'days'>('volume')
  const today = localDay()
  const weeks = useMemo(() => weekly(rows, today), [rows, today])
  const load = useMemo(() => muscleSets(rows, id => library.find(e => e.id === id), today), [rows, library, today])
  const top = Object.entries(load).sort((a, b) => b[1] - a[1])
  // no WebGL or the model failed to load: the flat map still shows the week
  const [flat, setFlat] = useState(false)
  const fail = useCallback(() => setFlat(true), [])
  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>{t('pr.weekly')}</h2>
          <div className="seg seg-small">
            <button aria-pressed={view === 'volume'} onClick={() => setView('volume')}>{t('pr.volume')}</button>
            <button aria-pressed={view === 'days'} onClick={() => setView('days')}>{t('pr.frequency')}</button>
          </div>
        </div>
        <Bars key={view} data={weeks.map(w => ({ key: w.week, v: view === 'volume' ? w.volume : w.days }))}
          label={t(view === 'volume' ? 'pr.volumeLabel' : 'pr.daysLabel')}
          fmt={view === 'volume' ? n => `${f.kg(Math.round(n))} kg` : n => `${n} ${t(n === 1 ? 'pr.day' : 'pr.days')}`}
          date={f.date} />
      </section>
      <section className="card">
        <h2>{t('pr.muscles')}</h2>
        {flat ? <MuscleMap load={load} name={m => muscleName(m, lang)} /> : (
          <>
            <Suspense fallback={<div className="body3d" />}><Body3D load={load} onFail={fail} /></Suspense>
            <small className="muted body3d-credit">{t('pr.modelCredit')}</small>
          </>
        )}
        {top.length > 0
          ? <ul className="pr-muscles">{top.map(([m, n]) => <li key={m}><span>{muscleName(m, lang)}</span><b>{f.kg(n)} {t('pr.setsShort')}</b></li>)}</ul>
          : <p className="muted" style={{ margin: '12px 0 0' }}>{t('pr.noMuscles')}</p>}
      </section>
      <h2 className="section-title">{t('pr.exercises')}</h2>
    </>
  )
}

// one bar per week, oldest first; tap a bar to read it (this week is shown first)
function Bars({ data, label, fmt, date }: { data: { key: string; v: number }[]; label: string; fmt: (n: number) => string; date: (d: string) => string }) {
  const { t } = useI18n()
  const [sel, setSel] = useState(data.length - 1)
  const W = 300, H = 140, T = 26, B = 20
  const max = Math.max(...data.map(d => d.v), 1)
  const bw = W / data.length
  const h = (v: number) => ((H - T - B) * v) / max
  const s = data[sel]
  return (
    <figure className="chart">
      <figcaption className="muted">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${data.map(d => `${date(d.key)} ${fmt(d.v)}`).join(', ')}`}>
        <line x1={0} x2={W} y1={H - B} y2={H - B} className="chart-grid" />
        {data.map((d, i) => (
          <g key={d.key} onClick={() => setSel(i)}>
            <rect x={i * bw + 5} y={H - B - h(d.v)} width={bw - 10} height={h(d.v)} rx={4} className={i === sel ? 'wk-bar on' : 'wk-bar'}
              style={{ animationDelay: `${i * 40}ms` }} />
            <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
          </g>
        ))}
        <text x={Math.min(Math.max(sel * bw + bw / 2, 44), W - 44)} y={Math.max(H - B - h(s.v) - 8, 12)} textAnchor="middle" className="chart-tip">{fmt(s.v)}</text>
        <text x={0} y={H - 4} className="chart-axis">{date(data[0].key)}</text>
        <text x={W} y={H - 4} textAnchor="end" className="chart-axis">{t('pr.thisWeek')}</text>
      </svg>
    </figure>
  )
}

// stylised front and back figure in the clips' hologram look; each region glows with this week's sets
type Shape = { m?: string; e?: [number, number, number, number]; r?: [number, number, number, number]; p?: string }
// left half only: drawn again mirrored; shapes on the centre line go in `mid`
const FRONT: { side: Shape[]; mid: Shape[] } = {
  mid: [{ e: [50, 16, 8.5, 9.5] }, { m: 'neck', r: [46, 24, 8, 7] }, { m: 'abdominals', r: [43, 54, 14, 30] }, { r: [41, 84, 18, 12] }],
  side: [
    { m: 'traps', p: 'M40 33 L46 28.5 L46 33.5 Z' }, { m: 'shoulders', e: [33, 38, 7, 6.5] }, { m: 'chest', e: [42.5, 46, 8, 6.5] },
    { m: 'biceps', e: [27, 56, 4.5, 9] }, { m: 'forearms', e: [23.5, 77, 4, 11] }, { e: [22, 92, 3, 3.5] }, { m: 'abdominals', e: [39, 66, 3, 9] },
    { m: 'abductors', e: [37, 97, 3.5, 7] }, { m: 'adductors', e: [46.5, 104, 3, 9] }, { m: 'quadriceps', e: [41, 119, 6.5, 19] },
    { m: 'calves', e: [41.5, 162, 4.5, 15] }, { e: [41.5, 184, 5, 3] },
  ],
}
const BACK: typeof FRONT = {
  mid: [{ e: [50, 16, 8.5, 9.5] }, { m: 'neck', r: [46, 24, 8, 6] }, { m: 'traps', p: 'M50 28 L37 36 L44 46 L50 50 L56 46 L63 36 Z' },
    { m: 'middle back', r: [44.5, 47, 11, 17] }, { m: 'lower back', r: [44, 66, 12, 15] }],
  side: [
    { m: 'shoulders', e: [33, 38, 7, 6.5] }, { m: 'lats', e: [38.5, 59, 5.5, 12] }, { m: 'triceps', e: [27, 56, 4.5, 9] },
    { m: 'forearms', e: [23.5, 77, 4, 11] }, { e: [22, 92, 3, 3.5] }, { m: 'glutes', e: [43.5, 93, 7, 8] },
    { m: 'hamstrings', e: [41.5, 120, 6.5, 18] }, { m: 'calves', e: [41.5, 157, 5.5, 13] }, { e: [41.5, 184, 5, 3] },
  ],
}

function MuscleMap({ load, name }: { load: Record<string, number>; name: (m: string) => string }) {
  const { t } = useI18n()
  const draw = (sh: Shape, k: string) => {
    const n = sh.m ? load[sh.m] ?? 0 : 0
    // 8 sets a week lights a muscle fully
    const style = n > 0 ? { fillOpacity: 0.3 + 0.7 * Math.min(n / 8, 1) } : undefined
    const cls = !sh.m ? 'mm-skin' : n > 0 ? 'mm-on' : 'mm-off'
    const title = sh.m ? <title>{`${name(sh.m)}: ${n}`}</title> : null
    if (sh.e) return <ellipse key={k} cx={sh.e[0]} cy={sh.e[1]} rx={sh.e[2]} ry={sh.e[3]} className={cls} style={style}>{title}</ellipse>
    if (sh.r) return <rect key={k} x={sh.r[0]} y={sh.r[1]} width={sh.r[2]} height={sh.r[3]} rx={4} className={cls} style={style}>{title}</rect>
    return <path key={k} d={sh.p} className={cls} style={style}>{title}</path>
  }
  const figure = (f: typeof FRONT, label: string) => (
    <figure>
      <svg viewBox="0 0 100 192" aria-hidden="true">
        {f.side.map((s, i) => draw(s, `l${i}`))}
        <g transform="translate(100 0) scale(-1 1)">{f.side.map((s, i) => draw(s, `r${i}`))}</g>
        {f.mid.map((s, i) => draw(s, `m${i}`))}
      </svg>
      <figcaption className="muted">{label}</figcaption>
    </figure>
  )
  return <div className="mm">{figure(FRONT, t('pr.front'))}{figure(BACK, t('pr.back'))}</div>
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
