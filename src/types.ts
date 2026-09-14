export type ShotResult = 'goal' | 'save' | 'post' | 'out'

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

export interface Shot {
  id: string
  matchId: string
  opponentPlayerNumber: number
  originX: number
  originY: number
  targetX: number
  targetY: number
  result: ShotResult
  goalkeeperId: string
  timestampCreated: string
  originZone: ShotZone
  goalZone: string
  shotDistance: 'six_m' | 'seven_m' | 'nine_m' | 'long'
  shotType: 'open_play' | 'seven_m'
}

export interface Match {
  id: string
  teamId: string
  rivalId: string
  rivalName: string
  date: string
  goalkeeperId: string
  shots: Shot[]
}
