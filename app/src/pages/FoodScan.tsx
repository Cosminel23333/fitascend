import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { forGrams, lookupBarcode, saveFood, type Food } from '../lib/food'
import { useI18n } from '../lib/i18n'

export type Filled = { name: string; description: string | null; kcal: number; protein: number | null; carbs: number | null; fat: number | null }
type Detector = { detect: (src: CanvasImageSource | ImageBitmap) => Promise<{ rawValue: string }[]> }

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const num = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(',', '.').trim() || NaN)
const opt = (v: FormDataEntryValue | null) => (String(v ?? '').trim() ? num(v) : null)
const okIn = (n: number | null, lo: number, hi: number) => n === null || (Number.isFinite(n) && n >= lo && n <= hi)

// the browser's own detector where it has one (Android Chrome), otherwise the zxing-wasm ponyfill (iPhone)
async function detector(): Promise<Detector> {
  const Native = (window as unknown as { BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector
  if (Native && (await Native.getSupportedFormats()).includes('ean_13')) return new Native({ formats: FORMATS })
  const { BarcodeDetector } = await import('barcode-detector/ponyfill')
  return new BarcodeDetector({ formats: FORMATS as never })
}

type State =
  | { s: 'idle' }
  | { s: 'camera' }
  | { s: 'busy' }
  | { s: 'found'; food: Food }
  | { s: 'missing'; code: string }

// barcode -> per-100 g values (or typed in once, for everyone, when no database has it) -> grams eaten -> fills the meal form
export default function FoodScan({ uid, onFill }: { uid: string; onFill: (f: Filled) => void }) {
  const { t } = useI18n()
  const [st, setSt] = useState<State>({ s: 'idle' })

  async function found(code: string) {
    setSt({ s: 'busy' })
    const food = await lookupBarcode(code)
    setSt(food ? { s: 'found', food } : { s: 'missing', code })
  }

  return (
    <div className="scan">
      {st.s === 'idle' && (
        <button type="button" className="btn ghost wide scan-btn" onClick={() => setSt({ s: 'camera' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
          {t('scan.barcode')}
        </button>
      )}
      {st.s === 'busy' && <p className="scan-msg" role="status"><span className="scan-spin" aria-hidden="true" /> {t('scan.looking')}</p>}
      {st.s === 'missing' && <NewFood code={st.code} onCancel={() => setSt({ s: 'idle' })} onSaved={(name, p, serving) => setSt({ s: 'found', food: saveFood(uid, st.code, name, p, serving) })} />}
      {st.s === 'found' && <Portion food={st.food} onCancel={() => setSt({ s: 'idle' })} onApply={f => { onFill(f); setSt({ s: 'idle' }) }} />}
      {st.s === 'camera' && <Camera onCode={found} onClose={() => setSt({ s: 'idle' })} />}
    </div>
  )
}

// a product no database knows: its label values, once; saved for the next scan by anyone using the app
function NewFood({ code, onSaved, onCancel }: { code: string; onSaved: (name: string, p: Food['per100'], serving: number | null) => void; onCancel: () => void }) {
  const { t } = useI18n()
  const [error, setError] = useState('')
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation() // nested in the meal sheet: must not submit the meal
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name')).trim().slice(0, 80)
    const kcal = num(f.get('kcal'))
    const p = { kcal, protein: opt(f.get('protein')), carbs: opt(f.get('carbs')), fat: opt(f.get('fat')) }
    const serving = opt(f.get('serving'))
    if (!name || !okIn(kcal, 0, 950) || !okIn(p.protein, 0, 100) || !okIn(p.carbs, 0, 100) || !okIn(p.fat, 0, 100) || !okIn(serving, 1, 3000)) return setError(t('today.invalid'))
    onSaved(name, p, serving)
  }
  return (
    <form className="scan-found form" onSubmit={submit}>
      <div className="scan-found-head">
        <b>{t('scan.newTitle')}</b>
        <small className="muted">{t('scan.newHint')} · {t('scan.code')} {code}</small>
      </div>
      <label className="field"><span>{t('scan.productName')}</span><input name="name" required maxLength={80} /></label>
      <label className="field"><span>kcal / 100 g</span><input name="kcal" inputMode="decimal" required /></label>
      <div className="row3">
        <label className="field"><span>{t('today.protein')}</span><input name="protein" inputMode="decimal" /></label>
        <label className="field"><span>{t('today.carbs')}</span><input name="carbs" inputMode="decimal" /></label>
        <label className="field"><span>{t('today.fat')}</span><input name="fat" inputMode="decimal" /></label>
      </div>
      <label className="field"><span>{t('scan.serving')}</span><input name="serving" inputMode="decimal" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="scan-btns">
        <button className="btn">{t('scan.saveProduct')}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>{t('scan.cancel')}</button>
      </div>
    </form>
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
        <b>{food.name}</b>
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
