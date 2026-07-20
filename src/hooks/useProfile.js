import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProfile(session) {
  const [profile, setProfile] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setCargando(false)
      return
    }

    setCargando(true)
    supabase
      .from('profiles')
      .select('role, permisos')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setCargando(false)
      })
  }, [session?.user?.id])

  return { profile, cargando }
}
