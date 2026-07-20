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
  const { producto_id, nombre_cliente, email_cliente } = body

  if (!producto_id) return jsonResponse({ error: 'Falta producto_id.' }, 400)

  const { data: producto, error: productoError } = await supabaseAdmin
    .from('productos')
    .select('id, nombre, precio_desde, imagen')
    .eq('id', producto_id)
    .single()

  if (productoError || !producto) return jsonResponse({ error: 'Producto no encontrado.' }, 404)
  if (!producto.precio_desde || producto.precio_desde <= 0) {
    return jsonResponse({ error: 'Este producto no tiene un precio válido para compra directa.' }, 400)
  }

  const montoCentavos = Math.round(Number(producto.precio_desde) * 100)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          unit_amount: montoCentavos,
          product_data: {
            name: producto.nombre,
            images: producto.imagen ? [producto.imagen] : undefined,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email_cliente || undefined,
    success_url: `${SITE_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}&tipo=producto`,
    cancel_url: `${SITE_URL}/pago/cancelado?tipo=producto`,
    metadata: { tipo: 'producto', producto_id: producto.id },
  })

  const { error: insertError } = await supabaseAdmin.from('pedidos').insert({
    producto_id: producto.id,
    producto_nombre: producto.nombre,
    monto: producto.precio_desde,
    nombre_cliente: nombre_cliente || null,
    email_cliente: email_cliente || null,
    stripe_session_id: session.id,
    estado: 'pendiente',
  })

  if (insertError) return jsonResponse({ error: insertError.message }, 500)

  return jsonResponse({ url: session.url })
})
