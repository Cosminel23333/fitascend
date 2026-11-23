import { useEffect, useState } from 'react'
import { ageOn, bmr, macros, targetKcal, tdee, waterTargetMl, type Activity, type Goal, type Sex } from './calories'
import { pending } from './outbox'
import { save, supabase } from './sync'

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Profile = {
  user_id: string
  name: string | null
  sex: Sex
  birth_date: string
  height_cm: number
  weight_kg: number
  body_fat_pct: number | null
  activity: Activity
  goal: Goal
  level: Level
  supplements?: string[]
}

export function targets(p: Profile) {
  const total = tdee(bmr({ sex: p.sex, weightKg: p.weight_kg, heightCm: p.height_cm, age: ageOn(p.birth_date), bodyFatPct: p.body_fat_pct }), p.activity)
  const kcal = targetKcal(total, p.goal, p.sex)
  return { kcal, macros: macros(kcal, p.weight_kg, p.goal), waterMl: waterTargetMl(p.weight_kg) }
}

// the profile is the one record kept on the phone (a few hundred bytes): every screen needs it, even offline
const cacheKey = (uid: string) => `fitascend-profile-${uid}`
const readCache = (uid: string): Profile | null => {
  try { return JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null') } catch { return null }
}

export function useProfile(uid: string) {
  const [profile, setProfile] = useState<Profile | null>(() => readCache(uid))
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle().then(({ data, error }) => {
      if (!alive) return
      const unsent = pending().some(o => o.table === 'profiles' && o.userId === uid)
      if (error) setOffline(true)
      else if (!unsent) {
        setProfile(data as Profile | null)
        try { localStorage.setItem(cacheKey(uid), JSON.stringify(data)) } catch { /* ignore */ }
      }
      setLoading(false)
    })
    return () => { alive = false }
  }, [uid])

  const update = (p: Profile) => {
    setProfile(p)
    try { localStorage.setItem(cacheKey(uid), JSON.stringify(p)) } catch { /* ignore */ }
    save({ op: 'upsert', table: 'profiles', row: { ...p, updated_at: new Date().toISOString() }, userId: uid })
  }

  return { profile, loading, offline, update }
}
