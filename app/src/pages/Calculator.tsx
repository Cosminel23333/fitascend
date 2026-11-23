import { ageOn, bmr, goalFactor, macros, targetKcal, tdee, waterTargetMl, type Goal } from '../lib/calories'
import { useI18n } from '../lib/i18n'
import type { Profile } from '../lib/profile'

const goals = Object.keys(goalFactor) as Goal[]

export default function Calculator({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const { t, lang } = useI18n()
  const fmt = (n: number) => Math.round(n).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')
  const base = bmr({ sex: profile.sex, weightKg: profile.weight_kg, heightCm: profile.height_cm, age: ageOn(profile.birth_date), bodyFatPct: profile.body_fat_pct })
  const total = tdee(base, profile.activity)
  const kcal = targetKcal(total, profile.goal, profile.sex)
  const m = macros(kcal, profile.weight_kg, profile.goal)

  return (
    <>
      <header className="page-head"><h1>{t('calc.title')}</h1></header>

      <div className="grid2" style={{ marginBottom: 14 }}>
        <section className="card stat">
          <h2>{t('calc.bmr')}</h2>
          <span className="value">{fmt(base)}</span><span className="unit">kcal</span>
          <small className="muted block">{profile.body_fat_pct ? t('calc.formulaKatch') : t('calc.formulaMifflin')}</small>
        </section>
        <section className="card stat">
          <h2>{t('calc.tdee')}</h2>
          <span className="value">{fmt(total)}</span><span className="unit">kcal</span>
        </section>
      </div>

      <section className="card">
        <h2>{t('calc.pickGoal')}</h2>
        <div className="goals" role="radiogroup">
          {goals.map(g => (
            <button key={g} role="radio" aria-checked={profile.goal === g} className="goal" onClick={() => onChange({ ...profile, goal: g })}>
              <span>{t(`goal.${g}`)}</span>
              <b>{fmt(targetKcal(total, g, profile.sex))} <small>{t('calc.perDay')}</small></b>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('calc.macros')} · {fmt(kcal)} kcal</h2>
        <div className="grid3">
          <div><b className="big" style={{ color: 'var(--orange)' }}>{m.protein} g</b><small className="muted block">{t('today.protein')}</small></div>
          <div><b className="big" style={{ color: 'var(--magenta)' }}>{m.carbs} g</b><small className="muted block">{t('today.carbs')}</small></div>
          <div><b className="big" style={{ color: 'var(--ochre)' }}>{m.fat} g</b><small className="muted block">{t('today.fat')}</small></div>
        </div>
      </section>

      <section className="card stat">
        <h2>{t('calc.water')}</h2>
        <span className="value">{(waterTargetMl(profile.weight_kg) / 1000).toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')}</span><span className="unit">L</span>
      </section>
    </>
  )
}
