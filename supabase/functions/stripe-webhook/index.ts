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
      const { data: pedido } = await supabaseAdmin
        .from('pedidos')
        .update({
          estado: nuevoEstado,
          nombre_cliente: session.customer_details?.name ?? null,
          email_cliente: session.customer_details?.email ?? null,
        })
        .eq('stripe_session_id', session.id)
        .neq('estado', 'pagado')
        .select('producto_id, color')
        .maybeSingle()

      if (nuevoEstado === 'pagado' && pedido?.producto_id) {
        await supabaseAdmin.rpc('descontar_stock', {
          p_producto_id: pedido.producto_id,
          p_cantidad: 1,
          p_color: pedido.color,
        })
      }
    } else if (tipo === 'cotizacion') {
      await supabaseAdmin
        .from('cotizaciones')
        .update({ anticipo_estado: nuevoEstado })
        .eq('stripe_session_id', session.id)
        .neq('anticipo_estado', 'pagado')
    } else if (tipo === 'carrito') {
      const { data: orden } = await supabaseAdmin
        .from('carrito_ordenes')
        .update({
          estado: nuevoEstado,
          nombre_cliente: session.customer_details?.name ?? null,
          email_cliente: session.customer_details?.email ?? null,
        })
        .eq('stripe_session_id', session.id)
        .neq('estado', 'pagado')
        .select('items')
        .maybeSingle()

      if (nuevoEstado === 'pagado' && orden?.items) {
        for (const item of orden.items) {
          await supabaseAdmin.rpc('descontar_stock', {
            p_producto_id: item.producto_id,
            p_cantidad: item.cantidad,
            p_color: item.color,
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
