import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return jsonResponse({ error: 'Solo un administrador puede hacer esto.' }, 403)
  }

  const body = await req.json()

  if (body.action === 'create') {
    const { email, password, role, permisos } = body
    if (!email || !password) return jsonResponse({ error: 'Faltan email o password.' }, 400)

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) return jsonResponse({ error: createError.message }, 400)

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role ?? 'usuario',
        permisos: permisos ?? { productos: false, cotizaciones: false },
      })
      .eq('id', created.user.id)

    if (updateError) return jsonResponse({ error: updateError.message }, 400)
    return jsonResponse({ data: { id: created.user.id, email } })
  }

  if (body.action === 'delete') {
    const { userId } = body
    if (!userId) return jsonResponse({ error: 'Falta userId.' }, 400)
    if (userId === userData.user.id) {
      return jsonResponse({ error: 'No puedes eliminar tu propia cuenta.' }, 409)
    }

    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (target?.role === 'admin') {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if ((count ?? 0) <= 1) {
        return jsonResponse({ error: 'No puedes eliminar al único administrador.' }, 409)
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) return jsonResponse({ error: deleteError.message }, 400)
    return jsonResponse({ data: { deleted: userId } })
  }

  return jsonResponse({ error: 'Acción no reconocida.' }, 400)
})
