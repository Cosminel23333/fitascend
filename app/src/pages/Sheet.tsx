import { useEffect, type ReactNode } from 'react'

// bottom sheet used for every input form
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
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
