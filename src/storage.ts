import type { Match, Rival, Team } from './types'
import { demoTeams } from './demo'

const KEYS = {
  teams: 'barakapp_teams',
  matches: 'barakapp_matches',
  rivals: 'barakapp_rivals',
}

export function loadTeams(): Team[] {
  const raw = localStorage.getItem(KEYS.teams)
  if (!raw) {
    localStorage.setItem(KEYS.teams, JSON.stringify(demoTeams))
    return demoTeams
  }
  return JSON.parse(raw) as Team[]
}

export function loadMatches(): Match[] {
  const raw = localStorage.getItem(KEYS.matches)
  return raw ? (JSON.parse(raw) as Match[]) : []
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(KEYS.matches, JSON.stringify(matches))
}

export function loadRivals(): Rival[] {
  const raw = localStorage.getItem(KEYS.rivals)
  return raw ? (JSON.parse(raw) as Rival[]) : []
}

export function saveRivals(rivals: Rival[]) {
  localStorage.setItem(KEYS.rivals, JSON.stringify(rivals))
}
