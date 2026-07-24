import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMontoFlete() {
  const [montoFlete, setMontoFlete] = useState(0)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('configuracion_envio').select('monto_flete').single()
      if (data) setMontoFlete(Number(data.monto_flete))
    }
    cargar()
  }, [])

  return montoFlete
}
