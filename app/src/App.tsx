import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { I18nProvider, useI18n } from './lib/i18n'
import { pending, subscribe } from './lib/outbox'
import { useProfile, type Profile } from './lib/profile'
import { flushNow, startSync, supabase } from './lib/sync'
import logo from './assets/logo-splash.webp'
import Auth from './pages/Auth'
import Calculator from './pages/Calculator'
import Calendar from './pages/Calendar'
import HealthCard from './pages/HealthCard'
import ProfileForm from './pages/ProfileForm'
import Splash from './pages/Splash'
import Today from './pages/Today'
import Workout from './pages/Workout'

const tabs = ['today', 'workout', 'calendar', 'calculator', 'profile'] as const
type Tab = (typeof tabs)[number]

const fromHash = (): Tab => {
  const h = location.hash.slice(1) as Tab
  return tabs.includes(h) ? h : 'today'
}

const icons: Record<Tab, ReactNode> = {
  today: <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  workout: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  calendar: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4" />,
  calculator: <path d="M12 3c2.5 4 6 6.5 6 11a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5.3 2 1.3 3.2 2.5 3.7C11 8 11 5.5 12 3z" />,
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
}


function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    addEventListener('online', on)
    addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])
  return online
}

function SyncPill({ uid }: { uid: string }) {
  const { t } = useI18n()
  const online = useOnline()
  const count = useSyncExternalStore(subscribe, () => pending().filter(o => o.userId === uid).length)
  if (online && count === 0) return null
  return (
    <button className="sync-pill" onClick={() => void flushNow()}>
      {!online && t('sync.offline')}{!online && count > 0 && ' · '}{count > 0 && `${count} ${t('sync.pending')}`}
    </button>
  )
}

function Shell({ uid, profile, update }: { uid: string; profile: Profile; update: (p: Profile) => void }) {
  const { t, lang, setLang } = useI18n()
  const [tab, setTab] = useState(fromHash)
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(0) // bumps on every screen change to replay the logo flash
  const [home, setHome] = useState(0) // bumps when the current tab is tapped again: back to its first view

  useEffect(() => {
    const onHash = () => { setTab(fromHash()); setFlash(n => n + 1) }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  function logout() {
    if (pending().some(o => o.userId === uid) && !confirm(t('profile.unsentLogout'))) return
    void supabase.auth.signOut()
  }

  return (
    <>
      <main className="app">
        <SyncPill uid={uid} />
        {tab === 'today' && <Today uid={uid} profile={profile} update={update} />}
        {tab === 'calculator' && <Calculator profile={profile} onChange={update} />}
        {tab === 'workout' && <Workout uid={uid} />}
        {tab === 'calendar' && <Calendar uid={uid} profile={profile} update={update} home={home} />}
        {tab === 'profile' && (
          <>
            <header className="page-head"><h1>{profile.name || t('nav.profile')}</h1></header>
            {editing ? (
              <ProfileForm userId={uid} initial={profile} onSave={p => { update(p); setEditing(false) }} />
            ) : (
              <section className="card">
                <h2>{t('profile.data')}</h2>
                <p className="muted" style={{ margin: '0 0 12px' }}>
                  {profile.height_cm} cm · {profile.weight_kg.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')} kg{profile.body_fat_pct ? ` · ${profile.body_fat_pct.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB')}%` : ''} · {t(`lvl.${profile.level}`)}
                  <br />{t('onb.goal')}: <b style={{ color: 'var(--text)' }}>{t(`goal.${profile.goal}`)}</b> · {t(`act.${profile.activity}`)}
                </p>
                <button className="btn ghost" onClick={() => setEditing(true)}>{t('profile.edit')}</button>
              </section>
            )}
            <HealthCard />
            <section className="card">
              <h2>{t('profile.language')}</h2>
              <div className="seg">
                <button aria-pressed={lang === 'ro'} onClick={() => setLang('ro')}>Română</button>
                <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
              </div>
            </section>
            <button className="btn ghost wide" onClick={logout}>{t('profile.logout')}</button>
          </>
        )}
      </main>
      <nav className="nav">
        {tabs.map(k => (
          <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => {
            if (tab !== k) location.hash = k
            else { setHome(n => n + 1); scrollTo({ top: 0, behavior: 'smooth' }) }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[k]}</svg>
            {t(`nav.${k}`)}
          </button>
        ))}
      </nav>
      {flash > 0 && <Splash key={flash} mode="flash" onDone={() => setFlash(0)} />}
    </>
  )
}

function Loading({ text }: { text: string }) {
  return (
    <div className="auth">
      <img src={logo} alt="" className="auth-logo pulse" />
      <p className="muted">{text}</p>
    </div>
  )
}

function SignedIn({ uid }: { uid: string }) {
  const { t } = useI18n()
  const { profile, loading, offline, update } = useProfile(uid)
  if (!profile && loading) return <Loading text={t('common.loading')} />
  if (!profile && offline) return <Loading text={t('common.needNet')} />
  if (!profile) {
    return (
      <main className="app">
        <header className="page-head"><h1>{t('onb.title')}</h1></header>
        <p className="muted" style={{ marginTop: -8 }}>{t('onb.sub')}</p>
        <ProfileForm userId={uid} initial={null} onSave={update} />
      </main>
    )
  }
  return <Shell uid={uid} profile={profile} update={update} />
}

function Root() {
  const { t } = useI18n()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    // getSession reads the saved session, so this works offline too
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    startSync()
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <>
      <div className="sky" aria-hidden="true" />
      {session === undefined ? <Loading text={t('common.loading')} /> : session ? <SignedIn key={session.user.id} uid={session.user.id} /> : <Auth />}
      {intro && <Splash mode="intro" onDone={() => setIntro(false)} />}
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Root />
    </I18nProvider>
  )
}
