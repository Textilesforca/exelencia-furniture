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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Falta token de autorización.' }, 401)

  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) return jsonResponse({ error: 'Token inválido.' }, 401)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, permisos')
    .eq('id', userData.user.id)
    .single()

  const autorizado = profile?.role === 'admin' || profile?.permisos?.cotizaciones === true
  if (!autorizado) {
    return jsonResponse({ error: 'No tienes permiso para generar links de pago.' }, 403)
  }

  const body = await req.json()
  const { cotizacion_id, monto } = body

  if (!cotizacion_id) return jsonResponse({ error: 'Falta cotizacion_id.' }, 400)

  const montoNumero = Number(monto)
  if (!montoNumero || montoNumero <= 0) {
    return jsonResponse({ error: 'El monto debe ser mayor a 0.' }, 400)
  }

  const { data: cotizacion, error: cotizacionError } = await supabaseAdmin
    .from('cotizaciones')
    .select('id, nombre')
    .eq('id', cotizacion_id)
    .single()

  if (cotizacionError || !cotizacion) return jsonResponse({ error: 'Cotización no encontrada.' }, 404)

  const montoCentavos = Math.round(montoNumero * 100)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: montoCentavos,
          product_data: {
            name: `Anticipo — ${cotizacion.nombre}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}&tipo=cotizacion`,
    cancel_url: `${SITE_URL}/pago/cancelado?tipo=cotizacion`,
    metadata: { tipo: 'cotizacion', cotizacion_id: cotizacion.id },
  })

  const { error: updateError } = await supabaseAdmin
    .from('cotizaciones')
    .update({
      anticipo_monto: montoNumero,
      anticipo_estado: 'pendiente',
      stripe_session_id: session.id,
    })
    .eq('id', cotizacion.id)

  if (updateError) return jsonResponse({ error: updateError.message }, 500)

  return jsonResponse({ url: session.url })
})
