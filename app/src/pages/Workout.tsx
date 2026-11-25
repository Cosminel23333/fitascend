import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { paceMinPerKm } from '../lib/calories'
import { localDay } from '../lib/day'
import { detailsUrl, equipmentName, imageUrl, loadExercises, muscleName, search, type Exercise } from '../lib/exercises'
import { useI18n } from '../lib/i18n'
import { progress, suggest, type HistSet, type Session } from '../lib/progress'
import { loadHistory, useCustomExercises, useWorkouts, type Workout as W, type WSet } from '../lib/workouts'
import Sheet from './Sheet'

const activities = ['run', 'walk', 'cycle', 'swim', 'elliptical', 'row', 'other'] as const
type Ex = Pick<Exercise, 'id' | 'n'>
type Open = null | { type: 'search'; workoutId: string } | { type: 'detail'; ex: Exercise } | { type: 'cardio' | 'hiit'; workout?: W }

const num = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(',', '.').trim() || NaN)
const optNum = (v: FormDataEntryValue | null) => (String(v ?? '').trim() ? num(v) : null)
const okRange = (n: number | null, lo: number, hi: number) => n === null || (Number.isFinite(n) && n >= lo && n <= hi)

// embedded: shown under the day page of the calendar instead of as its own screen
export default function Workout({ uid, day = localDay(), embedded = false }: { uid: string; day?: string; embedded?: boolean }) {
  const { t, lang } = useI18n()
  const { workouts, sets, status, saveWorkout, removeWorkout, addSet, removeSet } = useWorkouts(uid, day)
  const custom = useCustomExercises(uid)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [drafts, setDrafts] = useState<Record<string, Ex[]>>({}) // exercises picked but without sets yet
  const [open, setOpen] = useState<Open>(null)
  const close = () => setOpen(null)

  useEffect(() => { void loadExercises().then(setLibrary) }, [])
  const all = useMemo(() => [...custom.list, ...library], [custom.list, library])
  const lookup = (id: string) => all.find(e => e.id === id)

  const locale = lang === 'ro' ? 'ro-RO' : 'en-GB'
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const isToday = day === localDay()

  function startStrength() {
    const w = saveWorkout({ kind: 'strength' })
    setOpen({ type: 'search', workoutId: w.id })
  }

  function pick(workoutId: string, ex: Ex) {
    setDrafts(d => ({ ...d, [workoutId]: [...(d[workoutId] ?? []).filter(x => x.id !== ex.id), ex] }))
    close()
  }

  return (
    <>
      {embedded ? <h2 className="section-title">{t('workout.title')}</h2> : (
        <header className="page-head">
          <h1>{t('workout.title')}</h1>
          {isToday && <span className="date">{new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
        </header>
      )}
      {status === 'offline' && !embedded && <span className="chip">{t('today.offline')}</span>}

      <section className="card">
        <h2>{workouts.length ? t('workout.addAnother') : isToday ? t('workout.empty') : t('workout.emptyDay')}</h2>
        <div className="kind-btns">
          <button className="btn" onClick={startStrength}>+ {t('workout.strength')}</button>
          <button className="btn ghost" onClick={() => setOpen({ type: 'cardio' })}>+ Cardio</button>
          <button className="btn ghost" onClick={() => setOpen({ type: 'hiit' })}>+ HIIT</button>
        </div>
      </section>

      {workouts.map(w => w.kind === 'strength' ? (
        <StrengthCard key={w.id} day={day} sets={sets.filter(s => s.workout_id === w.id)} drafts={drafts[w.id] ?? []} time={time(w.created_at)}
          onAddExercise={() => setOpen({ type: 'search', workoutId: w.id })}
          onDetail={id => { const ex = lookup(id); if (ex) setOpen({ type: 'detail', ex }) }}
          onAddSet={(ex, reps, kg) => addSet(w.id, ex, reps, kg)}
          onRemoveSet={removeSet}
          onDelete={() => { if (confirm(t('workout.confirmDelete'))) removeWorkout(w.id) }} />
      ) : (
        <button key={w.id} className="card workout-row" onClick={() => setOpen({ type: w.kind as 'cardio' | 'hiit', workout: w })}>
          <div className="card-head">
            <h2>{w.kind === 'cardio' ? t(`cardio.${(w.title ?? 'other') as (typeof activities)[number]}`) : (w.title || 'HIIT')}</h2>
            <small className="muted">{time(w.created_at)}</small>
          </div>
          <div className="stats-line">
            {w.distance_km != null && <span><b>{w.distance_km.toLocaleString(locale)}</b> km</span>}
            {w.duration_min != null && <span><b>{w.duration_min}</b> min</span>}
            {w.rounds != null && <span><b>{w.rounds}</b> {t('workout.rounds').toLowerCase()}</span>}
            {w.kind === 'cardio' && <Pace km={w.distance_km} min={w.duration_min} cycling={w.title === 'cycle'} />}
          </div>
          {w.notes && <small className="muted block">{w.notes}</small>}
        </button>
      ))}

      {open?.type === 'search' && (
        <SearchSheet all={all} onClose={close}
          onPick={ex => pick(open.workoutId, ex)}
          onDetail={ex => setOpen({ type: 'detail', ex })}
          onAddCustom={name => pick(open.workoutId, custom.add(name))} />
      )}
      {open?.type === 'detail' && <DetailSheet ex={open.ex} onClose={close} />}
      {(open?.type === 'cardio' || open?.type === 'hiit') && (
        <SessionSheet kind={open.type} workout={open.workout} onClose={close}
          onSave={w => { saveWorkout(w); close() }}
          onDelete={open.workout ? () => { removeWorkout(open.workout!.id); close() } : undefined} />
      )}
    </>
  )
}

function Pace({ km, min, cycling }: { km: number | null; min: number | null; cycling: boolean }) {
  const { t } = useI18n()
  if (!km || !min) return null
  if (cycling) return <span>{t('workout.speed')} <b>{(km / (min / 60)).toFixed(1)}</b> km/h</span>
  const p = paceMinPerKm(km, min)!
  return <span>{t('workout.pace')} <b>{Math.floor(p)}:{String(Math.round((p % 1) * 60)).padStart(2, '0')}</b> /km</span>
}

function StrengthCard({ day, sets, drafts, time, onAddExercise, onDetail, onAddSet, onRemoveSet, onDelete }: {
  day: string; sets: WSet[]; drafts: Ex[]; time: string
  onAddExercise: () => void; onDetail: (id: string) => void
  onAddSet: (ex: Ex, reps: number, kg: number) => void; onRemoveSet: (id: string) => void; onDelete: () => void
}) {
  const { t, lang } = useI18n()
  // exercises in the order they were first logged, then the ones just picked
  const groups: Ex[] = []
  for (const s of sets) if (!groups.some(g => g.id === s.exercise_id)) groups.push({ id: s.exercise_id, n: s.exercise_name })
  for (const d of drafts) if (!groups.some(g => g.id === d.id)) groups.push(d)
  const volume = sets.reduce((v, s) => v + s.reps * s.weight_kg, 0)

  return (
    <section className="card">
      <div className="card-head">
        <h2>{t('workout.strength')} · {time}</h2>
        {volume > 0 && <small className="muted">{t('workout.volume')} {Math.round(volume).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')} kg</small>}
      </div>
      {groups.map(g => (
        <ExerciseBlock key={g.id} ex={g} day={day} sets={sets.filter(s => s.exercise_id === g.id).sort((a, b) => a.set_no - b.set_no)}
          onDetail={() => onDetail(g.id)} onAddSet={(r, kg) => onAddSet(g, r, kg)} onRemoveSet={onRemoveSet} />
      ))}
      <button className="btn wide" style={{ marginTop: 12 }} onClick={onAddExercise}>+ {t('workout.addExercise')}</button>
      <button className="link" style={{ marginTop: 6 }} onClick={onDelete}>{t('workout.deleteWorkout')}</button>
    </section>
  )
}

function ExerciseBlock({ ex, day, sets, onDetail, onAddSet, onRemoveSet }: {
  ex: Ex; day: string; sets: WSet[]; onDetail: () => void; onAddSet: (reps: number, kg: number) => void; onRemoveSet: (id: string) => void
}) {
  const { t, lang } = useI18n()
  const [error, setError] = useState('')
  const last = sets[sets.length - 1]
  const fmtKg = (n: number) => n.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')
  const hist = useHistory(ex.id)
  const f = useFmt()
  const ok = hist && hist !== 'error' ? hist : null
  const prev = ok?.sessions.filter(s => s.day < day).pop()
  const hint = prev ? suggest(prev.top) : undefined
  const fill = last ?? hint
  const block = useRef<HTMLDivElement>(null)
  // a block that mounts without sets was just picked: bring it up from the bottom of the page
  useEffect(() => { if (!sets.length) block.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, [])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const reps = num(f.get('reps'))
    const kg = String(f.get('kg')).trim() ? num(f.get('kg')) : 0
    if (!okRange(reps, 1, 1000) || !Number.isInteger(reps) || !okRange(kg, 0, 1000)) return setError(t('today.invalid'))
    setError('')
    onAddSet(reps, Math.round(kg * 100) / 100)
  }

  return (
    <div className="exercise" ref={block}>
      <button className="exercise-name" onClick={onDetail}>{ex.n} <span aria-hidden="true">ⓘ</span></button>
      {prev && hint && (
        <p className="progress-last">
          {t('workout.lastTime')} ({f.date(prev.day)}): {prev.sets.map(f.set).join(', ')}
          <br /><b>{t('workout.tryToday')}: {f.set(hint)}</b>
          {ok?.record && <> · {t('workout.record')} {f.set(ok.record)}</>}
        </p>
      )}
      {sets.length > 0 && (
        <ol className="sets">
          {sets.map(s => (
            <li key={s.id}>
              <span className="muted">{t('workout.set')} {s.set_no}</span>
              <b>{s.reps} × {fmtKg(s.weight_kg)} kg</b>
              <button className="icon-btn small" aria-label={`${t('today.delete')} ${t('workout.set')} ${s.set_no}`} onClick={() => onRemoveSet(s.id)}>✕</button>
            </li>
          ))}
        </ol>
      )}
      {/* key resets the inputs after each add, or once the suggestion arrives: last set's values, else the suggestion */}
      <form className="set-form" onSubmit={submit} key={last?.id ?? (hint ? 'hint' : 'first')}>
        <input name="reps" inputMode="numeric" placeholder={t('workout.reps')} aria-label={t('workout.reps')} defaultValue={fill?.reps ?? ''} />
        <span className="muted">×</span>
        <input name="kg" inputMode="decimal" placeholder="kg" aria-label="kg" defaultValue={fill ? String(fill.weight_kg).replace('.', lang === 'ro' ? ',' : '.') : ''} />
        <button className="btn">+ {t('workout.addSet')}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}

function SearchSheet({ all, onPick, onDetail, onAddCustom, onClose }: {
  all: Exercise[]; onPick: (ex: Ex) => void; onDetail: (ex: Exercise) => void; onAddCustom: (name: string) => void; onClose: () => void
}) {
  const { t, lang } = useI18n()
  const [q, setQ] = useState('')
  const results = useMemo(() => search(all, q), [all, q])

  return (
    <Sheet title={t('workout.addExercise')} onClose={onClose}>
      <div className="field">
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('workout.search')} aria-label={t('workout.search')} autoFocus enterKeyHint="search" />
      </div>
      <ul className="list results">
        {results.map(e => (
          <li key={e.id} className="result">
            <button className="list-main" onClick={() => onPick(e)}>
              <span>
                <b>{e.n}</b>
                <small className="muted block">
                  {e.custom ? t('workout.own') : [e.m.map(m => muscleName(m, lang)).join(', '), equipmentName(e.q, lang)].filter(Boolean).join(' · ')}
                </small>
              </span>
              <span className="plus" aria-hidden="true">+</span>
            </button>
            {!e.custom && <button className="icon-btn" aria-label={`${t('workout.details')} ${e.n}`} onClick={() => onDetail(e)}>i</button>}
          </li>
        ))}
      </ul>
      {q.trim() && (
        <>
          {results.length === 0 && <p className="muted">{t('workout.noResults')}</p>}
          <button className="btn ghost wide" style={{ marginTop: 10 }} onClick={() => onAddCustom(q.trim().slice(0, 60))}>
            + {t('workout.addCustom')} „{q.trim()}”
          </button>
        </>
      )}
    </Sheet>
  )
}

function DetailSheet({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const { t, lang } = useI18n()
  const [frame, setFrame] = useState<0 | 1>(0)
  const [steps, setSteps] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)

  // the two photos (start / end position) alternate like a short animation
  useEffect(() => {
    if (ex.i < 2) return
    const id = setInterval(() => setFrame(f => (f ? 0 : 1)), 900)
    return () => clearInterval(id)
  }, [ex])

  useEffect(() => {
    if (ex.custom) return
    fetch(detailsUrl(ex.id)).then(r => r.json()).then(d => setSteps(d.instructions ?? [])).catch(() => setFailed(true))
  }, [ex])

  return (
    <Sheet title={ex.n} onClose={onClose}>
      {!ex.custom && ex.i > 0 && (
        <div className="ex-photo">
          <img src={imageUrl(ex.id, 0)} alt={ex.n} style={{ opacity: frame ? 0 : 1 }} onError={() => setFailed(true)} />
          {ex.i > 1 && <img src={imageUrl(ex.id, 1)} alt="" style={{ opacity: frame ? 1 : 0 }} />}
        </div>
      )}
      <dl className="ex-facts">
        {ex.m.length > 0 && <><dt>{t('workout.muscles')}</dt><dd>{ex.m.map(m => muscleName(m, lang)).join(', ')}</dd></>}
        {ex.s.length > 0 && <><dt>{t('workout.secondary')}</dt><dd>{ex.s.map(m => muscleName(m, lang)).join(', ')}</dd></>}
        {ex.q && <><dt>{t('workout.equipment')}</dt><dd>{equipmentName(ex.q, lang)}</dd></>}
      </dl>
      <Progress exId={ex.id} />
      {!ex.custom && (
        <>
          <h3 className="ex-h">{t('workout.howTo')} {lang === 'ro' && <small className="muted">(în engleză)</small>}</h3>
          {failed ? <p className="muted">{t('workout.needNet')}</p>
            : steps === null ? <p className="muted">{t('common.loading')}</p>
            : <ol className="ex-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
        </>
      )}
    </Sheet>
  )
}

function useHistory(exId: string) {
  const [p, setP] = useState<ReturnType<typeof progress> | 'error' | null>(null)
  useEffect(() => { loadHistory(exId).then(s => setP(progress(s)), () => setP('error')) }, [exId])
  return p
}

function useFmt() {
  const { t, lang } = useI18n()
  const locale = lang === 'ro' ? 'ro-RO' : 'en-GB'
  const kg = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 })
  const set = (s: HistSet) => (s.weight_kg > 0 ? `${s.reps} × ${kg(s.weight_kg)} kg` : `${s.reps} ${t('workout.repsShort')}`)
  const date = (d: string) => new Date(`${d}T12:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return { kg, set, date }
}

function Progress({ exId }: { exId: string }) {
  const { t } = useI18n()
  const p = useHistory(exId)
  const { kg, set, date } = useFmt()

  let body
  if (p === 'error') body = <p className="muted">{t('workout.historyNeedNet')}</p>
  else if (p === null) body = <p className="muted">{t('common.loading')}</p>
  else if (!p.record) body = <p className="muted">{t('workout.noHistory')}</p>
  else {
    // today's sets are on the card already: "last time" is the session before today
    const last = p.sessions.filter(s => s.day < localDay()).pop()
    const weighted = p.bestE1rm > 0
    body = (
      <>
        <div className="stats-line">
          <span>{t('workout.record')} <b>{set(p.record)}</b></span>
          {weighted && <span>{t('workout.e1rm')} <b>~{kg(p.bestE1rm)}</b> kg</span>}
        </div>
        {last && (
          <p className="progress-last">
            {t('workout.lastTime')} ({date(last.day)}): {last.sets.map(set).join(', ')}
            <br /><b>{t('workout.tryToday')}: {set(suggest(last.top))}</b>
          </p>
        )}
        {p.sessions.length > 1 && <Chart sessions={p.sessions} label={t(weighted ? 'workout.chartE1rm' : 'workout.chartReps')} date={date} fmt={kg} />}
        <details className="progress-all">
          <summary>{t('workout.allSessions')} ({p.sessions.length})</summary>
          <ul>{[...p.sessions].reverse().map(s => <li key={s.day}><span className="muted">{date(s.day)}</span> {s.sets.map(set).join(', ')}</li>)}</ul>
        </details>
      </>
    )
  }
  return <><h3 className="ex-h">{t('workout.progress')}</h3>{body}</>
}

// one line, best of each session; tap a point to read it (the last one is shown first)
function Chart({ sessions, label, date, fmt }: { sessions: Session[]; label: string; date: (d: string) => string; fmt: (n: number) => string }) {
  const [sel, setSel] = useState(sessions.length - 1)
  const W = 300, H = 130, L = 34, R = 10, T = 26, B = 20
  const ys = sessions.map(s => s.best)
  const lo = Math.min(...ys), hi = Math.max(...ys)
  const pad = (hi - lo) * 0.1 || 1
  const x = (i: number) => L + (i * (W - L - R)) / (sessions.length - 1)
  const y = (v: number) => T + ((hi + pad - v) * (H - T - B)) / (hi - lo + 2 * pad)
  const s = sessions[sel]
  return (
    <figure className="chart">
      <figcaption className="muted">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${sessions.map(s => `${date(s.day)} ${fmt(s.best)}`).join(', ')}`}>
        {[...new Set([hi, lo])].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="chart-axis">{fmt(v)}</text>
          </g>
        ))}
        <text x={L} y={H - 4} className="chart-axis">{date(sessions[0].day)}</text>
        <text x={W - R} y={H - 4} textAnchor="end" className="chart-axis">{date(sessions[sessions.length - 1].day)}</text>
        <polyline points={sessions.map((s, i) => `${x(i)},${y(s.best)}`).join(' ')} className="chart-line" />
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

function SessionSheet({ kind, workout, onSave, onDelete, onClose }: {
  kind: 'cardio' | 'hiit'; workout?: W; onSave: (w: Partial<W> & Pick<W, 'kind'>) => void; onDelete?: () => void; onClose: () => void
}) {
  const { t, lang } = useI18n()
  const [error, setError] = useState('')
  const dec = (n: number | null | undefined) => (n == null ? '' : lang === 'ro' ? String(n).replace('.', ',') : String(n))

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const distance = optNum(f.get('distance'))
    const duration = optNum(f.get('duration'))
    const rounds = optNum(f.get('rounds'))
    if (!okRange(distance, 0, 1000) || !okRange(duration, 0, 1440) || !okRange(rounds, 0, 1000)) return setError(t('today.invalid'))
    onSave({
      ...workout,
      kind,
      title: String(f.get('title') ?? '').trim().slice(0, 60) || null,
      distance_km: kind === 'cardio' ? distance : null,
      duration_min: duration,
      rounds: kind === 'hiit' && rounds !== null ? Math.round(rounds) : null,
      notes: String(f.get('notes') ?? '').trim() || null,
    })
  }

  return (
    <Sheet title={kind === 'cardio' ? 'Cardio' : 'HIIT'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {kind === 'cardio' ? (
          <label className="field">
            <span>{t('workout.activity')}</span>
            <select name="title" defaultValue={workout?.title ?? 'run'}>
              {activities.map(a => <option key={a} value={a}>{t(`cardio.${a}`)}</option>)}
            </select>
          </label>
        ) : (
          <label className="field"><span>{t('workout.name')}</span><input name="title" defaultValue={workout?.title ?? ''} maxLength={60} placeholder="Tabata, EMOM…" /></label>
        )}
        <div className="row2">
          {kind === 'cardio'
            ? <label className="field"><span>{t('workout.distance')}</span><input name="distance" inputMode="decimal" defaultValue={dec(workout?.distance_km)} /></label>
            : <label className="field"><span>{t('workout.rounds')}</span><input name="rounds" inputMode="numeric" defaultValue={workout?.rounds ?? ''} /></label>}
          <label className="field"><span>{t('workout.duration')}</span><input name="duration" inputMode="decimal" defaultValue={dec(workout?.duration_min)} /></label>
        </div>
        <label className="field"><span>{t('workout.notes')}</span><textarea name="notes" rows={2} defaultValue={workout?.notes ?? ''} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide">{t('onb.save')}</button>
        {onDelete && <button type="button" className="btn ghost wide danger" onClick={onDelete}>{t('today.delete')}</button>}
      </form>
    </Sheet>
  )
}
