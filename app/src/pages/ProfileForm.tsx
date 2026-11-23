import { useState, type FormEvent } from 'react'
import { activityFactor, goalFactor, type Activity, type Goal, type Sex } from '../lib/calories'
import { useI18n } from '../lib/i18n'
import type { Level, Profile } from '../lib/profile'

const activities = Object.keys(activityFactor) as Activity[]
const goals = Object.keys(goalFactor) as Goal[]
const levels: Level[] = ['beginner', 'intermediate', 'advanced']

export default function ProfileForm({ userId, initial, onSave }: { userId: string; initial: Profile | null; onSave: (p: Profile) => void }) {
  const { t } = useI18n()
  const [sex, setSex] = useState<Sex>(initial?.sex ?? 'm')
  const [level, setLevel] = useState<Level>(initial?.level ?? 'beginner')
  const [error, setError] = useState('')

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const num = (k: string) => Number(String(f.get(k)).replace(',', '.'))
    const bf = String(f.get('body_fat_pct')).trim()
    const p: Profile = {
      ...initial, // keeps fields this form doesn't show, like the supplement list
      user_id: userId,
      name: String(f.get('name')).trim() || null,
      sex,
      birth_date: String(f.get('birth_date')),
      height_cm: num('height_cm'),
      weight_kg: num('weight_kg'),
      body_fat_pct: bf ? num('body_fat_pct') : null,
      activity: f.get('activity') as Activity,
      goal: f.get('goal') as Goal,
      level,
    }
    // same limits as the database checks, so a bad value never reaches the queue
    const bad = !(p.height_cm >= 100 && p.height_cm <= 250) || !(p.weight_kg >= 30 && p.weight_kg <= 300)
      || (p.body_fat_pct !== null && !(p.body_fat_pct >= 3 && p.body_fat_pct <= 60))
    if (bad) return setError(t('onb.invalid'))
    onSave(p)
  }

  return (
    <form className="card form" onSubmit={submit}>
      <label className="field">
        <span>{t('onb.name')}</span>
        <input name="name" defaultValue={initial?.name ?? ''} autoComplete="given-name" />
      </label>
      <div className="field">
        <span>{t('onb.sex')}</span>
        <div className="seg">
          <button type="button" aria-pressed={sex === 'm'} onClick={() => setSex('m')}>{t('onb.male')}</button>
          <button type="button" aria-pressed={sex === 'f'} onClick={() => setSex('f')}>{t('onb.female')}</button>
        </div>
      </div>
      <label className="field">
        <span>{t('onb.birth')}</span>
        <input name="birth_date" type="date" required defaultValue={initial?.birth_date} max={new Date().toISOString().slice(0, 10)} />
      </label>
      <div className="row2">
        <label className="field">
          <span>{t('onb.height')}</span>
          <input name="height_cm" inputMode="decimal" required defaultValue={initial?.height_cm} />
        </label>
        <label className="field">
          <span>{t('onb.weight')}</span>
          <input name="weight_kg" inputMode="decimal" required defaultValue={initial?.weight_kg} />
        </label>
      </div>
      <label className="field">
        <span>{t('onb.bodyFat')}</span>
        <input name="body_fat_pct" inputMode="decimal" defaultValue={initial?.body_fat_pct ?? ''} />
        <small className="muted">{t('onb.bodyFatHint')}</small>
      </label>
      <label className="field">
        <span>{t('onb.activity')}</span>
        <select name="activity" defaultValue={initial?.activity ?? 'moderate'}>
          {activities.map(a => <option key={a} value={a}>{t(`act.${a}`)}</option>)}
        </select>
      </label>
      <label className="field">
        <span>{t('onb.goal')}</span>
        <select name="goal" defaultValue={initial?.goal ?? 'maintain'}>
          {goals.map(g => <option key={g} value={g}>{t(`goal.${g}`)}</option>)}
        </select>
      </label>
      <div className="field">
        <span>{t('onb.level')}</span>
        <div className="seg">
          {levels.map(l => <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>{t(`lvl.${l}`)}</button>)}
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn wide">{t('onb.save')}</button>
    </form>
  )
}
