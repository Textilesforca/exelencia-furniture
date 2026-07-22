import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Banner() {
  const [slides, setSlides] = useState([])
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('tipo', 'inicio')
        .order('orden', { ascending: true })
      setSlides(data ?? [])
    }
    cargar()
  }, [])

  useEffect(() => {
    if (slides.length < 2) return
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % slides.length)
    }, 6000)
    return () => clearInterval(intervalo)
  }, [slides.length])

  if (slides.length === 0) return null

  const slide = slides[indice]

  function anterior() {
    setIndice((i) => (i - 1 + slides.length) % slides.length)
  }

  function siguiente() {
    setIndice((i) => (i + 1) % slides.length)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <div className="relative overflow-hidden rounded-sm border border-brass/40 bg-surface">
        <div className="relative">
          <img src={slide.imagen} alt="" className="w-full h-auto" />

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={anterior}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndice(i)}
                    aria-label={`Ir a la imagen ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === indice ? 'w-6 bg-brass' : 'w-1.5 bg-parchment/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
