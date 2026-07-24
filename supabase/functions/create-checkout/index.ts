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
  const { producto_id, color, nombre_cliente, email_cliente, metodo_envio } = body
  const esFlete = metodo_envio === 'flete'

  if (!producto_id) return jsonResponse({ error: 'Falta producto_id.' }, 400)

  const { data: producto, error: productoError } = await supabaseAdmin
    .from('productos')
    .select('id, nombre, precio_desde, imagen, stock, colores')
    .eq('id', producto_id)
    .single()

  if (productoError || !producto) return jsonResponse({ error: 'Producto no encontrado.' }, 404)
  if (!producto.precio_desde || producto.precio_desde <= 0) {
    return jsonResponse({ error: 'Este producto no tiene un precio válido para compra directa.' }, 400)
  }

  const tieneColores = Array.isArray(producto.colores) && producto.colores.length > 0
  const stockDisponible = tieneColores
    ? Number(producto.colores.find((c: { nombre: string }) => c.nombre === color)?.stock ?? 0)
    : Number(producto.stock ?? 0)

  if (stockDisponible <= 0) {
    return jsonResponse({ error: `"${producto.nombre}" no tiene existencias disponibles.` }, 400)
  }

  const montoCentavos = Math.round(Number(producto.precio_desde) * 100)

  let montoFlete = 0
  if (esFlete) {
    const { data: config } = await supabaseAdmin.from('configuracion_envio').select('monto_flete').single()
    montoFlete = Number(config?.monto_flete ?? 0)
  }

  const lineItems = [
    {
      price_data: {
        currency: 'usd',
        unit_amount: montoCentavos,
        product_data: {
          name: producto.nombre,
          images: producto.imagen ? [producto.imagen] : undefined,
        },
      },
      quantity: 1,
    },
  ]

  if (montoFlete > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(montoFlete * 100),
        product_data: { name: 'Servicio de flete' },
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: email_cliente || undefined,
    billing_address_collection: 'required',
    success_url: `${SITE_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}&tipo=producto`,
    cancel_url: `${SITE_URL}/pago/cancelado?tipo=producto`,
    metadata: { tipo: 'producto', producto_id: producto.id },
  })

  const { error: insertError } = await supabaseAdmin.from('pedidos').insert({
    producto_id: producto.id,
    producto_nombre: producto.nombre,
    monto: producto.precio_desde,
    color: tieneColores ? color || null : null,
    nombre_cliente: nombre_cliente || null,
    email_cliente: email_cliente || null,
    stripe_session_id: session.id,
    estado: 'pendiente',
    metodo_envio: esFlete ? 'flete' : 'tienda',
    monto_flete: montoFlete,
  })

  if (insertError) return jsonResponse({ error: insertError.message }, 500)

  return jsonResponse({ url: session.url })
})
