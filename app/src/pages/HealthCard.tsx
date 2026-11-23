import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/sync'

// Profile card that creates the personal key the Apple Health Shortcut uses
export default function HealthCard() {
  const { t } = useI18n()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (token && !confirm(t('health.regenConfirm'))) return
    setError('')
    const { data, error } = await supabase.rpc('create_health_token')
    if (error) return setError(navigator.onLine ? `${t('auth.error')} (${error.message})` : t('health.needNet'))
    setToken(data as string)
    setCopied(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
    } catch {
      setCopied(false) // clipboard blocked: the key stays selectable on screen
    }
  }

  return (
    <section className="card">
      <h2>Apple Health</h2>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: 14 }}>{t('health.body')}</p>
      {token && (
        <>
          <code className="token">{token}</code>
          <p className="muted" style={{ fontSize: 13, margin: '8px 0 12px' }}>{t('health.keyHint')}</p>
          <button className="btn wide" onClick={copy} style={{ marginBottom: 8 }}>{copied ? `✓ ${t('health.copied')}` : t('health.copy')}</button>
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn ghost" onClick={generate}>{token ? t('health.regenerate') : t('health.generate')}</button>
    </section>
  )
}
