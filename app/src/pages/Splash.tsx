import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import logo from '../assets/logo-splash.webp'

gsap.registerPlugin(useGSAP)

// intro: first open of the app (~1.5 s). flash: every screen change (~0.35 s).
export default function Splash({ mode, onDone }: { mode: 'intro' | 'flash'; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const intro = mode === 'intro'

  useGSAP((_, contextSafe) => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stopDust = reduced ? () => {} : cosmicDust(canvas.current!, intro ? 1.3 : 0.3, intro ? 170 : 110)
    const finish = contextSafe!(() => { stopDust(); onDone() })
    const tl = gsap.timeline({ onComplete: finish })

    if (intro) {
      tl.from('.splash-glow', { scale: 0.3, opacity: 0, duration: 0.6, ease: 'power2.out' })
        .from('.splash-logo', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, 0)
        .to('.splash-logo', { scale: 1.07, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '+=0.05')
        .to('.splash-glow', { scale: 1.25, opacity: 0.6, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '<')
        .to(root.current, { opacity: 0, duration: 0.3, ease: 'power1.in' }, '+=0.05')
    } else {
      tl.fromTo('.splash-logo', { scale: 0.85, opacity: 0 }, { scale: 1.06, opacity: 1, duration: 0.14, ease: 'power2.out' })
        .fromTo('.splash-glow', { scale: 0.6, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 0.14 }, 0)
        .to('.splash-logo', { scale: 1, duration: 0.08 })
        .to(root.current, { opacity: 0, duration: 0.13, ease: 'power1.in' })
    }
    return stopDust
  }, { scope: root })

  return (
    <div ref={root} className={`splash ${intro ? 'splash-intro' : 'splash-flash'}`} aria-hidden="true">
      <canvas ref={canvas} className="splash-dust" />
      <div className="splash-glow" />
      <img className="splash-logo" src={logo} alt="" decoding="sync" />
    </div>
  )
}

const colors = ['#D6303A', '#FF4D2E', '#EE4A1F', '#FF7A45', '#C4813F', '#E9B45A', '#FFC76B', '#FFE3A3']

// red/gold dust and twinkling stars thrown out from the logo, drawn on a canvas (cheap on phones)
function cosmicDust(c: HTMLCanvasElement, seconds: number, perSecond: number) {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const w = c.clientWidth
  const h = c.clientHeight
  c.width = w * dpr
  c.height = h * dpr
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  const cx = w / 2
  const cy = h / 2
  const edge = Math.min(w, h, 900) * 0.16

  type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; star: boolean }
  const ps: P[] = []
  const spawn = () => {
    const a = Math.random() * Math.PI * 2
    const r = edge * (0.7 + Math.random() * 0.5)
    const speed = 40 + Math.random() * 150
    ps.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 20,
      life: 0,
      max: 0.6 + Math.random() * 1.0,
      size: 0.9 + Math.random() * 2.3,
      color: colors[(Math.random() * colors.length) | 0],
      star: Math.random() < 0.2,
    })
  }
  for (let i = 0; i < perSecond * 0.6; i++) spawn() // opening burst

  let raf = 0
  let t = 0
  let last = performance.now()
  let owed = 0
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    t += dt
    if (t < seconds) for (owed += perSecond * dt; owed >= 1; owed--) spawn()
    g.clearRect(0, 0, w, h)
    g.globalCompositeOperation = 'lighter'
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      p.life += dt
      if (p.life >= p.max) { ps.splice(i, 1); continue }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.97
      p.vy = p.vy * 0.97 - 12 * dt // dust floats upwards
      const k = p.life / p.max
      const alpha = Math.min(k * 6, 1) * (1 - k)
      g.globalAlpha = alpha
      g.fillStyle = p.color
      if (p.star) {
        const s = p.size * 3.2 * (0.7 + 0.3 * Math.sin(p.life * 22)) // twinkle
        g.beginPath()
        g.moveTo(p.x, p.y - s); g.lineTo(p.x + s * 0.22, p.y - s * 0.22); g.lineTo(p.x + s, p.y)
        g.lineTo(p.x + s * 0.22, p.y + s * 0.22); g.lineTo(p.x, p.y + s); g.lineTo(p.x - s * 0.22, p.y + s * 0.22)
        g.lineTo(p.x - s, p.y); g.lineTo(p.x - s * 0.22, p.y - s * 0.22)
        g.closePath()
        g.fill()
      } else {
        g.globalAlpha = alpha * 0.3
        g.beginPath(); g.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2); g.fill() // soft halo
        g.globalAlpha = alpha
        g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill()
      }
    }
    if (t < seconds || ps.length) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
