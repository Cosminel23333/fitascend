import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { forGrams, lookupBarcode, parseLabel, type Food, type Per100 } from '../lib/food'
import { useI18n } from '../lib/i18n'

export type Filled = { name: string; description: string | null; kcal: number; protein: number | null; carbs: number | null; fat: number | null }
type Detector = { detect: (src: CanvasImageSource | ImageBitmap) => Promise<{ rawValue: string }[]> }

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

// the browser's own detector where it has one (Android Chrome), otherwise the zxing-wasm ponyfill (iPhone)
async function detector(): Promise<Detector> {
  const Native = (window as unknown as { BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector
  if (Native && (await Native.getSupportedFormats()).includes('ean_13')) return new Native({ formats: FORMATS })
  const { BarcodeDetector } = await import('barcode-detector/ponyfill')
  return new BarcodeDetector({ formats: FORMATS as never })
}

// phone photos are 12 MP: shrink and grey them first, OCR is then fast enough on the phone
async function shrink(file: File, max = 1600) {
  const img = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k)
  c.height = Math.round(img.height * k)
  const g = c.getContext('2d')!
  g.filter = 'grayscale(1) contrast(1.3)'
  g.drawImage(img, 0, 0, c.width, c.height)
  return c
}

async function readLabel(file: File): Promise<Per100 | null> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['ron', 'eng'])
  try {
    const { data } = await worker.recognize(await shrink(file))
    return parseLabel(data.text)
  } finally {
    await worker.terminate()
  }
}

type State =
  | { s: 'idle' }
  | { s: 'camera' }
  | { s: 'busy'; text: string }
  | { s: 'found'; food: Food }
  | { s: 'missing'; code?: string; why: string }

// barcode or label photo -> per-100 g values -> grams eaten -> fills the meal form
export default function FoodScan({ onFill }: { onFill: (f: Filled) => void }) {
  const { t } = useI18n()
  const [st, setSt] = useState<State>({ s: 'idle' })
  const labelInput = useRef<HTMLInputElement>(null)

  async function found(code: string) {
    setSt({ s: 'busy', text: t('scan.looking') })
    const food = await lookupBarcode(code)
    setSt(food ? { s: 'found', food } : { s: 'missing', code, why: t('scan.notFound') })
  }

  async function label(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSt({ s: 'busy', text: t('scan.reading') })
    try {
      const per100 = await readLabel(file)
      setSt(per100 ? { s: 'found', food: { name: '', brand: null, per100, serving: null, source: t('scan.label') } } : { s: 'missing', why: t('scan.unreadable') })
    } catch {
      setSt({ s: 'missing', why: t('scan.needNet') })
    }
  }

  const buttons = (
    <div className="scan-btns">
      <button type="button" className="btn ghost" onClick={() => setSt({ s: 'camera' })}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
        {t('scan.barcode')}
      </button>
      <button type="button" className="btn ghost" onClick={() => labelInput.current?.click()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
        {t('scan.labelPhoto')}
      </button>
      <input ref={labelInput} type="file" accept="image/*" capture="environment" hidden onChange={label} />
    </div>
  )

  return (
    <div className="scan">
      {(st.s === 'idle' || st.s === 'missing') && buttons}
      {st.s === 'missing' && <p className="scan-msg" role="status">{st.why}{st.code && <small className="muted block">{t('scan.code')} {st.code}</small>}</p>}
      {st.s === 'busy' && <p className="scan-msg" role="status"><span className="scan-spin" aria-hidden="true" /> {st.text}</p>}
      {st.s === 'found' && <Portion food={st.food} onCancel={() => setSt({ s: 'idle' })} onApply={f => { onFill(f); setSt({ s: 'idle' }) }} />}
      {st.s === 'camera' && <Camera onCode={found} onClose={() => setSt({ s: 'idle' })} />}
    </div>
  )
}

function Portion({ food, onApply, onCancel }: { food: Food; onApply: (f: Filled) => void; onCancel: () => void }) {
  const { t, lang } = useI18n()
  const [grams, setGrams] = useState(String(food.serving ?? 100))
  const g = Number(grams.replace(',', '.'))
  const ok = Number.isFinite(g) && g > 0 && g <= 3000
  const p = food.per100
  const fmt = (v: number | null) => (v === null ? '–' : v.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB', { maximumFractionDigits: 1 }))
  const now = ok ? forGrams(p, g) : null
  return (
    <div className="scan-found">
      <div className="scan-found-head">
        <b>{food.name || t('scan.fromLabel')}</b>
        <small className="muted">{[food.brand, food.source].filter(Boolean).join(' · ')}</small>
      </div>
      <p className="muted scan-per">{t('scan.per100')}: <b>{fmt(p.kcal)} kcal</b> · P {fmt(p.protein)} · C {fmt(p.carbs)} · G {fmt(p.fat)}</p>
      <label className="field scan-grams">
        <span>{t('scan.grams')}</span>
        <input inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)} />
      </label>
      {now && <p className="scan-per">= <b>{now.kcal} kcal</b> · P {fmt(now.protein)} · C {fmt(now.carbs)} · G {fmt(now.fat)}</p>}
      <div className="scan-btns">
        <button type="button" className="btn" disabled={!ok} onClick={() => now && onApply({
          name: food.name, description: [food.brand, `${fmt(g)} g`].filter(Boolean).join(' · '), ...now,
        })}>{t('scan.apply')}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>{t('scan.cancel')}</button>
      </div>
    </div>
  )
}

function Camera({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const { t } = useI18n()
  const video = useRef<HTMLVideoElement>(null)
  const photo = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const det = useRef<Promise<Detector> | null>(null)
  det.current ??= detector()
  // the camera starts once; a re-render of the meal form must not restart it
  const cb = useRef({ onCode, t })
  useEffect(() => { cb.current = { onCode, t } })

  useEffect(() => {
    const { t } = cb.current
    let stream: MediaStream | null = null
    let timer = 0
    let alive = true
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      .then(async s => {
        if (!alive) return s.getTracks().forEach(tr => tr.stop())
        stream = s
        const v = video.current!
        v.srcObject = s
        await v.play()
        const d = await det.current!
        const tick = async () => {
          if (!alive) return
          if (v.readyState >= 2) {
            const [hit] = await d.detect(v).catch(() => [])
            if (hit && alive) { alive = false; navigator.vibrate?.(60); cb.current.onCode(hit.rawValue); return }
          }
          timer = window.setTimeout(tick, 200)
        }
        void tick()
      })
      .catch(() => setError(t('scan.noCamera')))
    if (!navigator.mediaDevices) setError(t('scan.noCamera'))
    return () => { alive = false; clearTimeout(timer); stream?.getTracks().forEach(tr => tr.stop()) }
  }, [])

  // no live camera (permission, old phone): a photo of the barcode works too
  async function fromPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const [hit] = await (await det.current!).detect(await createImageBitmap(file)).catch(() => [])
    if (hit) onCode(hit.rawValue)
    else setError(t('scan.noCodeInPhoto'))
  }

  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label={t('scan.barcode')}>
      <video ref={video} playsInline muted />
      <div className="camera-frame" aria-hidden="true"><i /></div>
      <p className="camera-hint">{error || t('scan.aim')}</p>
      <div className="camera-bar">
        <button type="button" className="btn ghost" onClick={() => photo.current?.click()}>{t('scan.photoOfCode')}</button>
        <button type="button" className="btn" onClick={onClose}>{t('scan.cancel')}</button>
      </div>
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={fromPhoto} />
    </div>
  )
}
