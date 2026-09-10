import type { Match, Team } from './types'

export const demoTeams: Team[] = [
  {
    id: 'team-senior',
    name: 'Barakaldo Senior',
    category: 'Liga Vasca',
    season: '2026/27',
    goalkeepers: [
      { id: 'gk-1', number: 1, name: 'A. Gómez' },
      { id: 'gk-16', number: 16, name: 'D. Martín' },
      { id: 'gk-99', number: 99, name: 'B. Sánchez' },
    ],
    players: [
      { id: 'p4', number: 4, name: 'Jugador 4' },
      { id: 'p6', number: 6, name: 'Jugador 6' },
      { id: 'p8', number: 8, name: 'Jugador 8' },
      { id: 'p10', number: 10, name: 'Jugador 10' },
      { id: 'p14', number: 14, name: 'Jugador 14' },
    ],
  },
  {
    id: 'team-cadete',
    name: 'Barakaldo Cadete',
    category: 'Cadete',
    season: '2026/27',
    goalkeepers: [
      { id: 'gk-c1', number: 1, name: 'Portero 1' },
      { id: 'gk-c12', number: 12, name: 'Portero 12' },
    ],
    players: [
      { id: 'cp5', number: 5, name: 'Jugador 5' },
      { id: 'cp7', number: 7, name: 'Jugador 7' },
      { id: 'cp11', number: 11, name: 'Jugador 11' },
    ],
  },
]

export const demoMatches: Match[] = []
