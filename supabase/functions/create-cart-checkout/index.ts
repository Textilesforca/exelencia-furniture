import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})

const SITE_URL = Deno.env.get('SITE_URL')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.json()
  const { items, nombre_cliente, email_cliente } = body

  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: 'El carrito está vacío.' }, 400)
  }

  const productoIds = [...new Set(items.map((i) => i.producto_id))]

  const { data: productos, error: productosError } = await supabaseAdmin
    .from('productos')
    .select('id, nombre, precio_desde, imagen, stock, colores')
    .in('id', productoIds)

  if (productosError || !productos) {
    return jsonResponse({ error: 'No se pudieron validar los productos del carrito.' }, 500)
  }

  const productosPorId = Object.fromEntries(productos.map((p) => [p.id, p]))

  const cantidadTotalPorClave = {}
  for (const item of items) {
    const cantidad = Math.max(1, Math.round(Number(item.cantidad) || 1))
    const clave = `${item.producto_id}::${item.color || ''}`
    cantidadTotalPorClave[clave] = (cantidadTotalPorClave[clave] || 0) + cantidad
  }

  const lineItems = []
  const itemsValidados = []

  for (const item of items) {
    const producto = productosPorId[item.producto_id]
    if (!producto) return jsonResponse({ error: 'Uno de los productos del carrito ya no está disponible.' }, 404)
    if (!producto.precio_desde || producto.precio_desde <= 0) {
      return jsonResponse({ error: `"${producto.nombre}" no tiene un precio válido para compra.` }, 400)
    }

    const tieneColores = Array.isArray(producto.colores) && producto.colores.length > 0
    const stockDisponible = tieneColores
      ? Number(producto.colores.find((c: { nombre: string }) => c.nombre === item.color)?.stock ?? 0)
      : Number(producto.stock ?? 0)
    const clave = `${item.producto_id}::${item.color || ''}`

    if (stockDisponible < cantidadTotalPorClave[clave]) {
      const etiqueta = item.color ? `${producto.nombre} (${item.color})` : producto.nombre
      return jsonResponse({ error: `"${etiqueta}" no tiene suficientes existencias disponibles.` }, 400)
    }

    const cantidad = Math.max(1, Math.round(Number(item.cantidad) || 1))
    const montoCentavos = Math.round(Number(producto.precio_desde) * 100)

    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: montoCentavos,
        product_data: {
          name: item.color ? `${producto.nombre} (${item.color})` : producto.nombre,
          images: producto.imagen ? [producto.imagen] : undefined,
        },
      },
      quantity: cantidad,
    })

    itemsValidados.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      color: item.color || null,
      cantidad,
      precio: producto.precio_desde,
    })
  }

  const montoTotal = itemsValidados.reduce((suma, i) => suma + i.cantidad * Number(i.precio), 0)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: email_cliente || undefined,
    success_url: `${SITE_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}&tipo=carrito`,
    cancel_url: `${SITE_URL}/pago/cancelado?tipo=carrito`,
    metadata: { tipo: 'carrito' },
  })

  const { error: insertError } = await supabaseAdmin.from('carrito_ordenes').insert({
    items: itemsValidados,
    monto: montoTotal,
    nombre_cliente: nombre_cliente || null,
    email_cliente: email_cliente || null,
    stripe_session_id: session.id,
    estado: 'pendiente',
  })

  if (insertError) return jsonResponse({ error: insertError.message }, 500)

  return jsonResponse({ url: session.url })
})
