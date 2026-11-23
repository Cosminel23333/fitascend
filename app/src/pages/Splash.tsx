import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import logo from '../assets/logo-splash.webp'

gsap.registerPlugin(useGSAP)

// intro: first open, full-screen red/gold warp tunnel (~1.7 s).
// flash: every screen change, only the logo tilted in 3D with a light bar sweeping to the top-right (~0.5 s).
export default function Splash({ mode, onDone }: { mode: 'intro' | 'flash'; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const intro = mode === 'intro'

  useGSAP((_, contextSafe) => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stopWarp = intro && !reduced ? warpTunnel(canvas.current!, 1.7) : () => {}
    const finish = contextSafe!(() => { stopWarp(); onDone() })
    const tl = gsap.timeline({ onComplete: finish })

    if (intro) {
      tl.from('.splash-nebula', { scale: 0.4, opacity: 0, duration: 0.7, ease: 'power2.out' })
        .to('.splash-nebula', { rotation: 25, duration: 1.7, ease: 'none' }, 0)
        .from('.splash-card', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, 0.1)
        .to('.splash-card', { scale: 1.06, duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.65)
        .fromTo('.splash-shine', { xPercent: -37, yPercent: 21 }, { xPercent: 37, yPercent: -21, duration: 0.45, ease: 'power2.inOut' }, 1.0)
        .to(root.current, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 1.45)
    } else {
      tl.fromTo('.splash-card', { rotationY: -22, rotationX: 12, scale: 0.88, opacity: 0 },
        { rotationY: 0, rotationX: 0, scale: 1, opacity: 1, duration: 0.22, ease: 'power3.out' })
        .fromTo('.splash-shine', { xPercent: -37, yPercent: 21 }, { xPercent: 37, yPercent: -21, duration: 0.34, ease: 'power2.inOut' }, 0.06)
        .to(root.current, { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0.4) // after the bar has left the logo
    }
    return stopWarp
  }, { scope: root })

  return (
    <div ref={root} className={`splash ${intro ? 'splash-intro' : 'splash-flash'}`} aria-hidden="true">
      {intro && <div className="splash-nebula" />}
      {intro && <canvas ref={canvas} className="splash-dust" />}
      <div className="splash-stage">
        <div className="splash-card">
          {/* clip-path keeps the light inside the rounded logo even while the card is rotated in 3D */}
          <div className="splash-clip">
            <img className="splash-logo" src={logo} alt="" decoding="sync" />
            <div className="splash-shine" />
          </div>
        </div>
      </div>
    </div>
  )
}

const colors = ['#FFE3A3', '#FFC76B', '#E9B45A', '#C4813F', '#FF7A45', '#EE4A1F', '#D6303A', '#B5305F']

// streaks of light flying from the centre towards the viewer, like the reference "hyperspace" clip
function warpTunnel(c: HTMLCanvasElement, seconds: number) {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const w = c.clientWidth
  const h = c.clientHeight
  c.width = w * dpr
  c.height = h * dpr
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  g.lineCap = 'round'
  const cx = w / 2
  const cy = h / 2
  const f = Math.max(w, h) * 0.35
  const count = Math.round(Math.min(560, (w * h) / 800))

  type S = { x: number; y: number; z: number; color: string }
  const reset = (s: S, z = 1) => {
    // keep the very centre clear so the logo stays readable
    const a = Math.random() * Math.PI * 2
    const r = 0.08 + Math.random() * 1.4
    s.x = Math.cos(a) * r
    s.y = Math.sin(a) * r
    s.z = z
    s.color = colors[(Math.random() * colors.length) | 0]
  }
  const stars: S[] = Array.from({ length: count }, () => {
    const s = { x: 0, y: 0, z: 0, color: '' }
    reset(s, 0.05 + Math.random() * 0.95)
    return s
  })

  let raf = 0
  let t = 0
  let last = performance.now()
  const frame = (now: number) => {
    // the first rAF timestamp can be earlier than performance.now(): a negative dt would make speed NaN
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05))
    last = now
    t += dt
    // speed rises fast, cruises, then eases off as the splash fades
    const k = t / seconds
    const speed = 0.35 + 1.5 * Math.sin(Math.min(k, 1) * Math.PI) ** 0.6
    g.clearRect(0, 0, w, h)
    g.globalCompositeOperation = 'lighter'
    for (const s of stars) {
      s.z -= speed * dt * 0.8
      if (s.z <= 0.03) { reset(s); continue }
      // the tail sits a fixed depth behind the head: long streaks at any frame rate, longer when faster
      const tz = Math.min(s.z + 0.05 + 0.14 * speed, 1)
      const x1 = cx + (s.x / tz) * f
      const y1 = cy + (s.y / tz) * f
      const x2 = cx + (s.x / s.z) * f
      const y2 = cy + (s.y / s.z) * f
      if (x2 < -50 || x2 > w + 50 || y2 < -50 || y2 > h + 50) { reset(s); continue }
      const near = 1 - s.z
      const width = 0.4 + near * 2.6
      const alpha = Math.min(near * 1.4, 1) * Math.min(t * 4, 1)
      g.strokeStyle = s.color
      g.globalAlpha = alpha * 0.28 // coloured glow
      g.lineWidth = width * 3.2
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
      g.globalAlpha = alpha // bright core
      g.lineWidth = width
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
    }
    if (t < seconds + 0.4) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
