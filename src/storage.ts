import type { Match, Rival, Team } from './types'
import { demoTeams } from './demo'
import { saveCloudState, supabaseEnabled } from './supabase'

const KEYS = {
  teams: 'barakapp_teams',
  matches: 'barakapp_matches',
  rivals: 'barakapp_rivals',
}

let syncTimer: number | undefined
let cloudSyncEnabled = false

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function scheduleCloudSync() {
  if (!cloudSyncEnabled || !supabaseEnabled) return
  if (syncTimer) window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const state = {
      teams: read<Team[]>(KEYS.teams, []),
      matches: read<Match[]>(KEYS.matches, []),
      rivals: read<Rival[]>(KEYS.rivals, []),
    }
    void saveCloudState(state).catch(error => {
      console.error('[BarakAPP] No se pudo sincronizar con Supabase:', error)
    })
  }, 250)
}

export function enableCloudSync() {
  cloudSyncEnabled = true
}

export function disableCloudSync() {
  cloudSyncEnabled = false
  if (syncTimer) window.clearTimeout(syncTimer)
}

export function loadTeams(): Team[] {
  const teams = read<Team[]>(KEYS.teams, [])
  if (teams.length) return teams
  localStorage.setItem(KEYS.teams, JSON.stringify(demoTeams))
  return demoTeams
}

export function saveTeams(teams: Team[]) {
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
  scheduleCloudSync()
}

export function loadMatches(): Match[] {
  return read<Match[]>(KEYS.matches, [])
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(KEYS.matches, JSON.stringify(matches))
  scheduleCloudSync()
}

export function loadRivals(): Rival[] {
  return read<Rival[]>(KEYS.rivals, [])
}

export function saveRivals(rivals: Rival[]) {
  localStorage.setItem(KEYS.rivals, JSON.stringify(rivals))
  scheduleCloudSync()
}

export function replaceLocalState(state: { teams: Team[]; matches: Match[]; rivals: Rival[] }) {
  localStorage.setItem(KEYS.teams, JSON.stringify(state.teams))
  localStorage.setItem(KEYS.matches, JSON.stringify(state.matches))
  localStorage.setItem(KEYS.rivals, JSON.stringify(state.rivals))
}
