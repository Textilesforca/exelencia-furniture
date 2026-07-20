import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import BlueprintDivider from '../components/BlueprintDivider'
import ProductCard from '../components/ProductCard'
import { sampleProducts } from '../data/products'

export default function Home() {
  const destacados = sampleProducts.slice(0, 3)

  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-6 py-6">
        <BlueprintDivider label="Piezas destacadas" />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid sm:grid-cols-3 gap-6">
        {destacados.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-10">
        <Step
          numero="01"
          titulo="Levantamiento"
          texto="Medimos tu espacio y escuchamos cómo lo usas antes de dibujar nada."
        />
        <Step
          numero="02"
          titulo="Plano y material"
          texto="Aprobamos contigo dimensiones, madera y acabado en un plano acotado."
        />
        <Step
          numero="03"
          titulo="Taller y entrega"
          texto="Construimos en taller propio y entregamos con instalación incluida."
        />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <p className="font-display text-3xl text-parchment mb-6">¿Tienes un espacio en mente?</p>
        <Link
          to="/contacto"
          className="inline-block bg-brass text-ink font-body font-medium px-8 py-3 rounded-sm hover:bg-walnut2 transition-colors"
        >
          Cuéntanos tu proyecto
        </Link>
      </section>
    </>
  )
}

function Step({ numero, titulo, texto }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="font-mono text-xs text-brass">{numero}</p>
      <h3 className="font-display text-xl text-parchment mt-2">{titulo}</h3>
      <p className="text-sm text-muted mt-2">{texto}</p>
    </div>
  )
}
