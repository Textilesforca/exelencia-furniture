import { useEffect } from 'react'

export default function ImageLightbox({ open, src, alt, onClose }) {
  useEffect(() => {
    if (!open) return

    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-6"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 font-mono text-xs uppercase tracking-widest text-parchment hover:text-brass transition-colors"
      >
        Cerrar ✕
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-sm"
      />
    </div>
  )
}
