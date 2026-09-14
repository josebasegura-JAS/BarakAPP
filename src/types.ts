export type ShotResult = 'goal' | 'save' | 'post_out' | 'blocked'

export type ShotZone =
  | 'ext_left'
  | 'lat_left'
  | 'central'
  | 'lat_right'
  | 'ext_right'
  | 'pivot'
  | 'seven_m'

export interface Category {
  id: string
  name: string
  active: boolean
}

export interface Team {
  id: string
  name: string
  category: string
  categoryId?: string
  season: string
  active: boolean
  goalkeepers: Goalkeeper[]
  players: Player[]
}

export interface Player {
  id: string
  number: number
  name: string
}

export interface Goalkeeper extends Player {
  teamId?: string
  categoryId?: string
  active?: boolean
}

export interface Rival {
  id: string
  name: string
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
