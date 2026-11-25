import { useEffect, useState } from 'react'
import { localDay, mergeOps } from '../lib/day'
import { useI18n } from '../lib/i18n'
import { monthGrid, monthRange } from '../lib/month'
import { pending } from '../lib/outbox'
import type { Profile } from '../lib/profile'
import { supabase } from '../lib/sync'
import Today from './Today'
import Workout from './Workout'

type Mark = 'workout' | 'meal' | 'water' | 'other'
const marks: Mark[] = ['workout', 'meal', 'water', 'other']
type Row = { id: string; day: string; created_at: string; kind?: string }

export default function Calendar({ uid, profile, update, home }: { uid: string; profile: Profile; update: (p: Profile) => void; home: number }) {
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => { setSelected(null) }, [home]) // the Calendar tab tapped again

  useEffect(() => { scrollTo(0, 0) }, [selected])

  if (selected) return <DayView uid={uid} profile={profile} update={update} day={selected} onBack={() => setSelected(null)} />
  return <MonthView uid={uid} ym={ym} setYm={setYm} onPick={setSelected} />
}

function useMonthMarks(uid: string, y: number, m: number) {
  const [byDay, setByDay] = useState<Map<string, Set<Mark>>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading')

  useEffect(() => {
    let alive = true
    const { from, to } = monthRange(y, m)
    const inMonth = (r: Row) => r.day >= from && r.day <= to
    setStatus('loading')
    Promise.all([
      supabase.from('entries').select('id, day, kind, created_at').gte('day', from).lte('day', to),
      supabase.from('workouts').select('id, day, created_at').gte('day', from).lte('day', to),
    ]).then(([e, w]) => {
      if (!alive) return
      if (e.error || w.error) return setStatus('offline')
      const map = new Map<string, Set<Mark>>()
      const add = (day: string, mark: Mark) => map.set(day, (map.get(day) ?? new Set()).add(mark))
      for (const r of mergeOps(e.data as Row[], pending(), uid, 'entries', inMonth)) {
        add(r.day, r.kind === 'meal' ? 'meal' : r.kind === 'water' ? 'water' : 'other')
      }
      for (const r of mergeOps(w.data as Row[], pending(), uid, 'workouts', inMonth)) add(r.day, 'workout')
      setByDay(map)
      setStatus('ok')
    })
    return () => { alive = false }
  }, [uid, y, m])

  return { byDay, status }
}

function MonthView({ uid, ym, setYm, onPick }: {
  uid: string; ym: { y: number; m: number }; setYm: (v: { y: number; m: number }) => void; onPick: (day: string) => void
}) {
  const { t, lang } = useI18n()
  const { byDay, status } = useMonthMarks(uid, ym.y, ym.m)
  const locale = lang === 'ro' ? 'ro-RO' : 'en-GB'
  const today = localDay()
  const now = new Date()
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth()
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  // 2026-11-23 is a Monday: gives localized short weekday names starting Monday
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 23 + i).toLocaleDateString(locale, { weekday: 'short' }))
  const workoutDays = [...byDay.values()].filter(s => s.has('workout')).length
  const shift = (d: number) => { const x = new Date(ym.y, ym.m + d, 1); setYm({ y: x.getFullYear(), m: x.getMonth() }) }

  return (
    <>
      <header className="page-head"><h1>{t('nav.calendar')}</h1></header>
      <section className="card">
        <div className="month-head">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label={t('cal.prev')}>‹</button>
          <h2 className="month-title">{title}</h2>
          <button className="icon-btn" onClick={() => shift(1)} disabled={isCurrent} aria-label={t('cal.next')}>›</button>
        </div>
        <div className="cal-grid" role="grid">
          {weekdays.map(w => <span key={w} className="cal-wd">{w.replace('.', '')}</span>)}
          {monthGrid(ym.y, ym.m).map((day, i) => {
            if (!day) return <span key={`b${i}`} />
            const set = byDay.get(day)
            const future = day > today
            return (
              <button key={day} className="cal-day" disabled={future} aria-current={day === today ? 'date' : undefined}
                aria-label={new Date(day + 'T12:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                onClick={() => onPick(day)}>
                <span>{Number(day.slice(8))}</span>
                <i className="dots">{marks.filter(k => set?.has(k)).map(k => <b key={k} className={`dot dot-${k}`} />)}</i>
              </button>
            )
          })}
        </div>
        {status === 'offline' && <p className="muted" style={{ marginBottom: 0 }}>{t('cal.offline')}</p>}
        {status === 'ok' && <p className="muted" style={{ marginBottom: 0, fontSize: 14 }}><b style={{ color: 'var(--text)' }}>{workoutDays}</b> {t('cal.workoutDays')}</p>}
      </section>
      <section className="card legend">
        {marks.map(k => <span key={k}><b className={`dot dot-${k}`} /> {t(`cal.${k}`)}</span>)}
      </section>
    </>
  )
}

function DayView({ uid, profile, update, day, onBack }: { uid: string; profile: Profile; update: (p: Profile) => void; day: string; onBack: () => void }) {
  const { t } = useI18n()
  return (
    <>
      <button className="link back" onClick={onBack}>‹ {t('nav.calendar')}</button>
      <Today uid={uid} profile={profile} update={update} day={day} />
      <Workout uid={uid} day={day} embedded />
    </>
  )
}
