export type ShotResult = 'goal' | 'save' | 'post_out' | 'blocked'

export type ShotZone =
  | 'ext_left'
  | 'lat_left'
  | 'central'
  | 'lat_right'
  | 'ext_right'
  | 'pivot'
  | 'seven_m'

export interface Team {
  id: string
  name: string
  category: string
  season: string
  goalkeepers: Goalkeeper[]
  players: Player[]
}

export interface Player {
  id: string
  number: number
  name: string
}

export interface Goalkeeper extends Player {}

export interface Rival {
  id: string
  name: string
}

export interface Exclusion {
  id: string
  team: 'home' | 'away'
  playerNumber: number
  playerName?: string
  startedAtMatchSeconds: number
  durationSeconds: number
}

export interface Shot {
  id: string
  matchId: string
  shooterNumber: number
  zone: ShotZone
  originX?: number
  originY?: number
  goalX: number
  goalY: number
  result: ShotResult
  goalkeeperId: string
  matchSeconds: number
  period: 1 | 2
}

export interface MatchEvent {
  id: string
  type: 'shot' | 'score' | 'exclusion' | 'card' | 'note'
  label: string
  matchSeconds: number
  period: 1 | 2
  createdAt: string
}

export interface Match {
  id: string
  teamId: string
  rivalId: string
  rivalName: string
  date: string
  venue: 'home' | 'away'
  status: 'draft' | 'live' | 'finished'
  period: 1 | 2
  periodLengthMinutes: number
  clockSeconds: number
  scoreHome: number
  scoreAway: number
  goalkeeperId: string
  exclusions: Exclusion[]
  shots: Shot[]
  events: MatchEvent[]
}
