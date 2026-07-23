import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Falta la firma de Stripe.', { status: 400 })
  }

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    return new Response(`Firma inválida: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
    const session = event.data.object
    const nuevoEstado = event.type === 'checkout.session.completed' ? 'pagado' : 'cancelado'
    const tipo = session.metadata?.tipo

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (tipo === 'producto') {
      await supabaseAdmin
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('stripe_session_id', session.id)
        .neq('estado', 'pagado')
    } else if (tipo === 'cotizacion') {
      await supabaseAdmin
        .from('cotizaciones')
        .update({ anticipo_estado: nuevoEstado })
        .eq('stripe_session_id', session.id)
        .neq('anticipo_estado', 'pagado')
    } else if (tipo === 'carrito') {
      await supabaseAdmin
        .from('carrito_ordenes')
        .update({ estado: nuevoEstado })
        .eq('stripe_session_id', session.id)
        .neq('estado', 'pagado')
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
