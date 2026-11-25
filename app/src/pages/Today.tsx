import { useEffect, useState, type FormEvent } from 'react'
import { localDay, useDay, type Entry } from '../lib/day'
import { useI18n } from '../lib/i18n'
import { setSaved, targets, type Profile, type SavedMeal } from '../lib/profile'
import { supabase } from '../lib/sync'
import FoodScan, { type Filled } from './FoodScan'
import Sheet from './Sheet'

type Single = 'sleep' | 'steps' | 'screen' | 'weight'
type Open = null | { type: 'meal'; entry?: Entry } | { type: 'water' } | { type: 'single'; kind: Single } | { type: 'supps' } | { type: 'saved' }

const num = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(',', '.').trim() || NaN)
const inRange = (n: number, lo: number, hi: number) => Number.isFinite(n) && n >= lo && n <= hi

export default function Today({ uid, profile, update, day = localDay() }: { uid: string; profile: Profile; update: (p: Profile) => void; day?: string }) {
  const { t, lang } = useI18n()
  const { rows, status, put, remove, setSingle } = useDay(uid, day)
  const [open, setOpen] = useState<Open>(null)
  const close = () => setOpen(null)

  const locale = lang === 'ro' ? 'ro-RO' : 'en-GB'
  const fmt = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d })
  const fmtMin = (m: number) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}`
  const isToday = day === localDay()
  const [y, mo, d] = day.split('-').map(Number)
  const date = new Date(y, mo - 1, d).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

  const tg = targets(profile)
  const meals = rows.filter(r => r.kind === 'meal')
  const macro = (k: string) => meals.reduce((s, m) => s + (Number(m.data?.[k]) || 0), 0)
  const eaten = meals.reduce((s, m) => s + (m.value ?? 0), 0)
  const waters = rows.filter(r => r.kind === 'water')
  const water = waters.reduce((s, w) => s + (w.value ?? 0), 0)
  const single = (k: Single) => rows.find(r => r.kind === k)
  const fromHealth = (k: Single) => single(k)?.data?.source === 'health'
  const weightEntry = single('weight')
  // a past day without its own weight shows the last one logged up to that day (the profile holds today's)
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  useEffect(() => {
    if (isToday) return
    supabase.from('entries').select('value').eq('kind', 'weight').lte('day', day).order('day', { ascending: false }).limit(1)
      .then(({ data }) => setLastWeight((data?.[0]?.value as number | undefined) ?? null))
  }, [day, isToday])
  const shownWeight = weightEntry?.value ?? (isToday ? profile.weight_kg : lastWeight ?? profile.weight_kg)
  const weightNote = weightEntry ? undefined : !isToday && lastWeight !== null ? t('today.lastKnown') : t('today.fromProfile')
  const supps = profile.supplements ?? []
  const suppTaken = (name: string) => rows.find(r => r.kind === 'supplement' && r.data?.name === name)
  const saved = profile.saved_meals ?? []
  const isSaved = (name: string) => saved.some(s => s.name.toLowerCase() === name.toLowerCase())
  const addSaved = (s: SavedMeal) => put({ kind: 'meal', value: s.kcal, data: { name: s.name, description: s.description, protein: s.protein, carbs: s.carbs, fat: s.fat } })

  const r = 54
  const circ = 2 * Math.PI * r
  const macroRows = [
    { key: 'protein', label: t('today.protein'), g: macro('protein'), target: tg.macros.protein, color: 'var(--orange)' },
    { key: 'carbs', label: t('today.carbs'), g: macro('carbs'), target: tg.macros.carbs, color: 'var(--magenta)' },
    { key: 'fat', label: t('today.fat'), g: macro('fat'), target: tg.macros.fat, color: 'var(--ochre)' },
  ]

  return (
    <>
      <header className="page-head">
        <h1>{isToday ? t('today.title') : date.charAt(0).toUpperCase() + date.slice(1)}</h1>
        {isToday && <span className="date">{date}</span>}
      </header>
      {status === 'offline' && <span className="chip">{t('today.offline')}</span>}

      <section className="card">
        <h2>{t('today.calories')}</h2>
        <div className="cal">
          <div className="ring-wrap">
            <svg className="ring" viewBox="0 0 128 128" aria-hidden="true">
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#EE4A1F" />
                  <stop offset="1" stopColor="#B5305F" />
                </linearGradient>
              </defs>
              <circle className="track" cx="64" cy="64" r={r} />
              <circle className="fill" cx="64" cy="64" r={r} strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(eaten / tg.kcal, 1))}
                style={eaten > tg.kcal ? { stroke: 'var(--red)' } : undefined} />
            </svg>
            <div className="ring-label">
              <b>{fmt(eaten)}</b>
              <span>{t('today.of')} {fmt(tg.kcal)} kcal</span>
            </div>
          </div>
          <div className="macros">
            {macroRows.map(m => (
              <div key={m.key}>
                <div className="macro-row"><span>{m.label}</span><span>{fmt(m.g)}/{m.target} g</span></div>
                <div className="bar"><i style={{ width: `${Math.min(m.g / m.target, 1) * 100}%`, background: m.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        {meals.length > 0 && (
          <ul className="list">
            {meals.map(m => (
              <li key={m.id}>
                <button className="list-main" onClick={() => setOpen({ type: 'meal', entry: m })}>
                  <span>
                    <b>{String(m.data?.name ?? '')}</b>
                    <small className="muted block">
                      {new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      {m.data?.description ? ` · ${m.data.description}` : ''}
                    </small>
                  </span>
                  <b>{fmt(m.value ?? 0)} <small className="muted">kcal</small></b>
                </button>
              </li>
            ))}
          </ul>
        )}
        {saved.length > 0 && (
          <>
            <div className="card-head" style={{ marginTop: 16 }}>
              <h2>{t('today.savedMeals')}</h2>
              <button className="link" onClick={() => setOpen({ type: 'saved' })}>{t('today.edit')}</button>
            </div>
            <div className="checks">
              {saved.map(s => (
                <button key={s.name} className="check" onClick={() => addSaved(s)} aria-label={`${t('today.add')} ${s.name}, ${fmt(s.kcal)} kcal`}>
                  <span className="box" aria-hidden="true">+</span>{s.name} <small className="muted">{fmt(s.kcal)}</small>
                </button>
              ))}
            </div>
          </>
        )}
        <button className="btn wide" style={{ marginTop: 16 }} onClick={() => setOpen({ type: 'meal' })}>+ {t('today.addMeal')}</button>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{t('today.water')}</h2>
          <button className="icon-btn" disabled={!waters.length} onClick={() => remove(waters[waters.length - 1].id)} aria-label={t('today.undoWater')} title={t('today.undoWater')}>↺</button>
        </div>
        <div className="water">
          <div className="glass" role="img" aria-label={`${water} / ${tg.waterMl} ml`}>
            <div className="liquid" style={{ height: `${Math.min(water / tg.waterMl, 1) * 100}%` }} />
          </div>
          <div className="water-info">
            <div className="value">{fmt(water / 1000, 2)} L</div>
            <div className="muted" style={{ fontSize: 13 }}>{t('today.of')} {fmt(tg.waterMl / 1000, 2)} L · {Math.round((water / tg.waterMl) * 100)}%</div>
            <div className="water-btns">
              <button className="btn" onClick={() => put({ kind: 'water', value: 250, data: null })}>+250 ml</button>
              <button className="btn ghost" onClick={() => put({ kind: 'water', value: 500, data: null })}>+500 ml</button>
              <button className="btn ghost" onClick={() => setOpen({ type: 'water' })} aria-label={t('today.otherAmount')}>+ …</button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid2">
        <StatButton label={t('today.sleep')} onClick={() => setOpen({ type: 'single', kind: 'sleep' })}
          value={single('sleep') ? fmtMin(single('sleep')!.value!) : '—'} unit={single('sleep') ? 'min' : ''}
          note={fromHealth('sleep') ? t('today.fromHealth') : undefined} />
        <StatButton label={t('today.steps')} onClick={() => setOpen({ type: 'single', kind: 'steps' })}
          value={single('steps') ? fmt(single('steps')!.value!) : '—'}
          note={fromHealth('steps') ? t('today.fromHealth') : undefined} />
        <StatButton label={t('today.screen')} onClick={() => setOpen({ type: 'single', kind: 'screen' })}
          value={single('screen') ? fmtMin(single('screen')!.value!) : '—'} unit={single('screen') ? 'min' : ''} />
        <StatButton label={t('today.weight')} onClick={() => setOpen({ type: 'single', kind: 'weight' })}
          value={fmt(shownWeight, 1)} unit="kg" note={weightNote} />
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h2>{t('today.supplements')}</h2>
          <button className="link" onClick={() => setOpen({ type: 'supps' })}>{t('today.edit')}</button>
        </div>
        {supps.length === 0 ? (
          <button className="btn ghost" onClick={() => setOpen({ type: 'supps' })}>+ {t('today.addSupplement')}</button>
        ) : (
          <div className="checks">
            {supps.map(name => {
              const taken = suppTaken(name)
              return (
                <button key={name} className="check" aria-pressed={!!taken}
                  onClick={() => (taken ? remove(taken.id) : put({ kind: 'supplement', value: null, data: { name } }))}>
                  <span className="box" aria-hidden="true">{taken ? '✓' : ''}</span>{name}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {open?.type === 'meal' && <MealSheet uid={uid} entry={open.entry} isSaved={isSaved} onClose={close} onDelete={id => { remove(id); close() }}
        onSave={(e, keep) => {
          put(e)
          const meal = { ...(e.data as Omit<SavedMeal, 'kcal'>), kcal: e.value ?? 0 }
          // touch the profile only when the saved list changes
          if (keep || isSaved(meal.name)) update({ ...profile, saved_meals: setSaved(saved, meal, keep) })
          close()
        }} />}
      {open?.type === 'saved' && (
        <Sheet title={t('today.savedMeals')} onClose={close}>
          {saved.length === 0 ? <p className="muted">{t('today.savedEmpty')}</p> : (
            <ul className="list">
              {saved.map(s => (
                <li key={s.name} className="list-row">
                  <span>{s.name} <small className="muted">{fmt(s.kcal)} kcal</small></span>
                  <button className="icon-btn" aria-label={`${t('today.delete')} ${s.name}`}
                    onClick={() => update({ ...profile, saved_meals: setSaved(saved, s, false) })}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
      {open?.type === 'water' && (
        <NumberSheet title={t('today.water')} label="ml" min={1} max={5000} onClose={close}
          onSave={ml => { put({ kind: 'water', value: ml, data: null }); close() }} />
      )}
      {open?.type === 'single' && (open.kind === 'sleep' || open.kind === 'screen') && (
        <DurationSheet title={t(`today.${open.kind}`)} initial={single(open.kind)?.value ?? null} onClose={close}
          onSave={m => { setSingle(open.kind, m); close() }}
          onDelete={single(open.kind) ? () => { remove(single(open.kind)!.id); close() } : undefined} />
      )}
      {open?.type === 'single' && open.kind === 'steps' && (
        <NumberSheet title={t('today.steps')} label={t('today.steps')} min={0} max={200000} initial={single('steps')?.value ?? undefined} onClose={close}
          onSave={n => { setSingle('steps', n); close() }}
          onDelete={single('steps') ? () => { remove(single('steps')!.id); close() } : undefined} />
      )}
      {open?.type === 'single' && open.kind === 'weight' && (
        <NumberSheet title={t('today.weight')} label="kg" min={30} max={300} decimal initial={shownWeight} onClose={close}
          hint={t('today.weightHint')}
          onSave={kg => { setSingle('weight', kg); if (isToday) update({ ...profile, weight_kg: kg }); close() }}
          onDelete={weightEntry ? () => { remove(weightEntry.id); close() } : undefined} />
      )}
      {open?.type === 'supps' && <SuppSheet list={supps} onClose={close} onChange={list => update({ ...profile, supplements: list })} />}
    </>
  )
}

function StatButton({ label, value, unit, note, onClick }: { label: string; value: string; unit?: string; note?: string; onClick: () => void }) {
  return (
    <button className="card stat stat-btn" onClick={onClick}>
      <h2>{label}</h2>
      <span className="value">{value}</span>{unit && <span className="unit">{unit}</span>}
      {note && <small className="muted block">{note}</small>}
    </button>
  )
}

function MealSheet({ uid, entry, isSaved, onSave, onDelete, onClose }: {
  uid: string
  entry?: Entry
  isSaved: (name: string) => boolean
  onSave: (e: Pick<Entry, 'kind' | 'value' | 'data'> & Partial<Pick<Entry, 'id' | 'created_at'>>, keep: boolean) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [error, setError] = useState('')
  const [scanned, setScanned] = useState<Filled | null>(null) // from a barcode or a label photo
  const d: Record<string, unknown> = scanned ?? entry?.data ?? {}
  const [keep, setKeep] = useState(() => isSaved(String(d.name ?? '')))

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const kcal = num(f.get('kcal'))
    const opt = (k: string) => (String(f.get(k)).trim() ? num(f.get(k)) : null)
    const macros = { protein: opt('protein'), carbs: opt('carbs'), fat: opt('fat') }
    if (!inRange(kcal, 0, 10000) || Object.values(macros).some(v => v !== null && !inRange(v, 0, 1000))) return setError(t('today.invalid'))
    onSave({
      id: entry?.id,
      created_at: entry?.created_at,
      kind: 'meal',
      value: kcal,
      data: { name: String(f.get('name')).trim(), description: String(f.get('description')).trim() || null, ...macros },
    }, keep)
  }

  return (
    <Sheet title={entry ? t('today.editMeal') : t('today.addMeal')} onClose={onClose}>
      <FoodScan uid={uid} onFill={setScanned} />
      {/* key: a scan refills every field */}
      <form className="form" onSubmit={submit} key={scanned ? JSON.stringify(scanned) : 'typed'}>
        <label className="field"><span>{t('today.mealName')}</span><input name="name" required defaultValue={String(d.name ?? '')} /></label>
        <label className="field"><span>{t('today.mealDesc')}</span><textarea name="description" rows={2} defaultValue={String(d.description ?? '')} /></label>
        <label className="field"><span>kcal</span><input name="kcal" inputMode="decimal" required defaultValue={scanned?.kcal ?? entry?.value ?? ''} /></label>
        <div className="row3">
          <label className="field"><span>{t('today.protein')} (g)</span><input name="protein" inputMode="decimal" defaultValue={String(d.protein ?? '')} /></label>
          <label className="field"><span>{t('today.carbs')} (g)</span><input name="carbs" inputMode="decimal" defaultValue={String(d.carbs ?? '')} /></label>
          <label className="field"><span>{t('today.fat')} (g)</span><input name="fat" inputMode="decimal" defaultValue={String(d.fat ?? '')} /></label>
        </div>
        <button type="button" className="check" aria-pressed={keep} onClick={() => setKeep(k => !k)}>
          <span className="box" aria-hidden="true">{keep ? '✓' : ''}</span>{t('today.keepMeal')}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide">{t('onb.save')}</button>
        {entry && <button type="button" className="btn ghost wide danger" onClick={() => onDelete(entry.id)}>{t('today.delete')}</button>}
      </form>
    </Sheet>
  )
}

function NumberSheet({ title, label, min, max, decimal, initial, hint, onSave, onDelete, onClose }: {
  title: string; label: string; min: number; max: number; decimal?: boolean; initial?: number; hint?: string
  onSave: (n: number) => void; onDelete?: () => void; onClose: () => void
}) {
  const { t, lang } = useI18n()
  const [error, setError] = useState('')
  // only decimals get a comma: "8.432" steps would parse back as 8.432
  const shown = initial === undefined ? '' : decimal && lang === 'ro' ? String(initial).replace('.', ',') : String(initial)
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const n = num(new FormData(e.currentTarget).get('n'))
    if (!inRange(n, min, max)) return setError(`${t('today.range')} ${min}–${max}`)
    onSave(decimal ? Math.round(n * 10) / 10 : Math.round(n))
  }
  return (
    <Sheet title={title} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>{label}</span>
          <input name="n" inputMode={decimal ? 'decimal' : 'numeric'} required defaultValue={shown} autoFocus />
          {hint && <small className="muted">{hint}</small>}
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide">{t('onb.save')}</button>
        {onDelete && <button type="button" className="btn ghost wide danger" onClick={onDelete}>{t('today.delete')}</button>}
      </form>
    </Sheet>
  )
}

function DurationSheet({ title, initial, onSave, onDelete, onClose }: {
  title: string; initial: number | null; onSave: (minutes: number) => void; onDelete?: () => void; onClose: () => void
}) {
  const { t } = useI18n()
  const [error, setError] = useState('')
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const h = num(f.get('h') || '0')
    const m = num(f.get('m') || '0')
    const total = h * 60 + m
    if (!inRange(h, 0, 24) || !inRange(m, 0, 59) || !inRange(total, 1, 1440)) return setError(t('today.invalid'))
    onSave(Math.round(total))
  }
  return (
    <Sheet title={title} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="row2">
          <label className="field"><span>{t('today.hours')}</span><input name="h" inputMode="numeric" defaultValue={initial ? Math.floor(initial / 60) : ''} autoFocus /></label>
          <label className="field"><span>{t('today.minutes')}</span><input name="m" inputMode="numeric" defaultValue={initial ? initial % 60 : ''} /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide">{t('onb.save')}</button>
        {onDelete && <button type="button" className="btn ghost wide danger" onClick={onDelete}>{t('today.delete')}</button>}
      </form>
    </Sheet>
  )
}

function SuppSheet({ list, onChange, onClose }: { list: string[]; onChange: (l: string[]) => void; onClose: () => void }) {
  const { t } = useI18n()
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('name') as HTMLInputElement
    const name = input.value.trim()
    if (name && !list.includes(name)) onChange([...list, name])
    input.value = ''
  }
  return (
    <Sheet title={t('today.supplements')} onClose={onClose}>
      {list.length > 0 && (
        <ul className="list">
          {list.map(s => (
            <li key={s} className="list-row">
              <span>{s}</span>
              <button className="icon-btn" aria-label={`${t('today.delete')} ${s}`} onClick={() => onChange(list.filter(x => x !== s))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <form className="form" onSubmit={add} style={{ marginTop: 12 }}>
        <label className="field"><span>{t('today.addSupplement')}</span><input name="name" placeholder={t('today.suppPlaceholder')} maxLength={40} /></label>
        <button className="btn wide">+ {t('today.add')}</button>
      </form>
    </Sheet>
  )
}
