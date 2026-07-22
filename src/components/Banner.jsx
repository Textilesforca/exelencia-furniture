import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ImageCarousel from './ImageCarousel'

export default function Banner() {
  const [slides, setSlides] = useState([])

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

  if (slides.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <div className="max-w-sm sm:max-w-md mx-auto">
        <ImageCarousel imagenes={slides} />
      </div>
    </section>
  )
}
