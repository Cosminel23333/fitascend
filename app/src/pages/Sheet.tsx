import { useEffect, useRef, type ReactNode } from 'react'

// bottom sheet used for every input form
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const backdrop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  // iOS draws the keyboard over fixed layers without resizing them: follow the visible area instead,
  // and freeze the page behind so the swipe scrolls the sheet
  useEffect(() => {
    const vv = window.visualViewport
    const el = backdrop.current!
    const fit = () => { if (vv) { el.style.top = `${vv.offsetTop}px`; el.style.height = `${vv.height}px` } }
    fit()
    vv?.addEventListener('resize', fit)
    vv?.addEventListener('scroll', fit)
    document.documentElement.classList.add('sheet-open')
    return () => {
      vv?.removeEventListener('resize', fit)
      vv?.removeEventListener('scroll', fit)
      document.documentElement.classList.remove('sheet-open')
    }
  }, [])

  return (
    <div className="sheet-backdrop" ref={backdrop} onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="✕" onClick={onClose}>✕</button>
        </header>
        {children}
      </div>
    </div>
  )
}
