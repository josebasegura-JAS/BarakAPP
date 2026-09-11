import type { Match, Rival, Team } from './types'
import { demoTeams } from './demo'

const KEYS = {
  teams: 'barakapp_teams',
  matches: 'barakapp_matches',
  rivals: 'barakapp_rivals',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadTeams(): Team[] {
  const teams = read<Team[]>(KEYS.teams, [])
  if (teams.length) return teams
  localStorage.setItem(KEYS.teams, JSON.stringify(demoTeams))
  return demoTeams
}

export function saveTeams(teams: Team[]) {
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
}

export function loadMatches(): Match[] {
  return read<Match[]>(KEYS.matches, [])
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(KEYS.matches, JSON.stringify(matches))
}

export function loadRivals(): Rival[] {
  return read<Rival[]>(KEYS.rivals, [])
}

export function saveRivals(rivals: Rival[]) {
  localStorage.setItem(KEYS.rivals, JSON.stringify(rivals))
}

export function replaceLocalState(state: { teams: Team[]; matches: Match[]; rivals: Rival[] }) {
  saveTeams(state.teams)
  saveMatches(state.matches)
  saveRivals(state.rivals)
}
