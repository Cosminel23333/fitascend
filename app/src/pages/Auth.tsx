import { useState, type FormEvent } from 'react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/sync'

export default function Auth() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const creds = { email: String(f.get('email')).trim(), password: String(f.get('password')) }
    setBusy(true)
    setError('')
    const { error } = mode === 'login' ? await supabase.auth.signInWithPassword(creds) : await supabase.auth.signUp(creds)
    setBusy(false)
    if (!error) return
    if (!navigator.onLine || error.name === 'AuthRetryableFetchError') setError(t('auth.offline'))
    else if (error.code === 'invalid_credentials') setError(t('auth.badLogin'))
    else if (error.code === 'weak_password') setError(t('auth.weak'))
    else if (error.code === 'user_already_exists' || error.code === 'email_exists') setError(t('auth.exists'))
    else setError(`${t('auth.error')} (${error.message})`)
  }

  return (
    <div className="auth">
      <img src="./logo.svg" alt="FitAscend" className="auth-logo" />
      <h1>FitAscend</h1>
      <p className="muted">{t('auth.tagline')}</p>
      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>{t('auth.email')}</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <input name="password" type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn wide" disabled={busy}>{mode === 'login' ? t('auth.login') : t('auth.signup')}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
          {mode === 'login' ? t('auth.toSignup') : t('auth.toLogin')}
        </button>
      </form>
    </div>
  )
}
