import { createClient, type Session } from '@supabase/supabase-js'
import type { Match, Rival, Team } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = Boolean(url && anonKey)
export const supabase = supabaseEnabled ? createClient(url!, anonKey!) : null

export type CloudState = {
  teams: Team[]
  matches: Match[]
  rivals: Rival[]
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signIn(email: string, password: string): Promise<Session> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('No se ha podido crear la sesión.')
  return data.session
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function loadCloudState(): Promise<CloudState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return (data?.state ?? null) as CloudState | null
}

export async function saveCloudState(state: CloudState) {
  if (!supabase) return
  const { error } = await supabase.rpc('save_current_club_state', { new_state: state })
  if (error) throw error
}
