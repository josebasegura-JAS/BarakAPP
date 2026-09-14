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

export function saveTeams(teams: Team[]) {
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
}

export function loadMatches(): Match[] {
  const raw = localStorage.getItem(KEYS.matches)
  if (!raw) return []
  const matches = JSON.parse(raw) as Array<Omit<Match, 'shots'> & { shots: Array<Record<string, unknown>> }>
  return matches.map(match => ({ ...match, shots: match.shots.map(rawShot => {
    const originX = Number(rawShot.originX ?? 50)
    const originY = Number(rawShot.originY ?? 70)
    const targetX = Number(rawShot.targetX ?? rawShot.goalX ?? 50)
    const targetY = Number(rawShot.targetY ?? rawShot.goalY ?? 50)
    const legacyResult = String(rawShot.result)
    return {
      id: String(rawShot.id), matchId: String(rawShot.matchId), goalkeeperId: String(rawShot.goalkeeperId),
      opponentPlayerNumber: Number(rawShot.opponentPlayerNumber ?? rawShot.shooterNumber),
      originX, originY, targetX, targetY,
      result: legacyResult === 'post_out' || legacyResult === 'blocked' ? 'out' : legacyResult,
      timestampCreated: String(rawShot.timestampCreated ?? new Date().toISOString()),
      originZone: String(rawShot.originZone ?? rawShot.zone ?? 'central'),
      goalZone: String(rawShot.goalZone ?? `${targetY < 50 ? 'high' : 'low'}_${targetX < 33.33 ? 'left' : targetX < 66.66 ? 'center' : 'right'}`),
      shotDistance: String(rawShot.shotDistance ?? (originY < 43 ? 'six_m' : originY < 58 ? 'seven_m' : originY < 82 ? 'nine_m' : 'long')),
      shotType: String(rawShot.shotType ?? (originY >= 43 && originY < 58 ? 'seven_m' : 'open_play')),
    } as Match['shots'][number]
  }) }))
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
