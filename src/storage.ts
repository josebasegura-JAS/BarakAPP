import type { Category, Match, Rival, Team } from './types'
import { demoTeams } from './demo'
import { firebaseEnabled, saveCloudState } from './firebase'

const KEYS = {
  categories: 'barakapp_categories',
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

function categoryIdFromName(name: string) {
  return `cat-${name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

function normalizeTeams(teams: Team[]): Team[] {
  return teams.map(team => {
    const categoryId = team.categoryId || categoryIdFromName(team.category)
    return {
      ...team,
      categoryId,
      active: team.active !== false,
      goalkeepers: (team.goalkeepers ?? []).map(goalkeeper => ({
        ...goalkeeper,
        teamId: goalkeeper.teamId || team.id,
        categoryId: goalkeeper.categoryId || categoryId,
        active: goalkeeper.active !== false,
      })),
      players: team.players ?? [],
    }
  })
}

function categoriesFromTeams(teams: Team[]): Category[] {
  const map = new Map<string, Category>()
  for (const team of normalizeTeams(teams)) {
    const id = team.categoryId || categoryIdFromName(team.category)
    if (!map.has(id)) map.set(id, { id, name: team.category, active: true })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function normalizeCategories(categories: Category[], teams: Team[]): Category[] {
  const defaults = categoriesFromTeams(teams)
  const map = new Map(defaults.map(category => [category.id, category]))
  for (const category of categories) {
    map.set(category.id, { ...category, active: category.active !== false })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function scheduleCloudSync() {
  if (!cloudSyncEnabled || !firebaseEnabled) return
  if (syncTimer) window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const teams = normalizeTeams(read<Team[]>(KEYS.teams, []))
    const state = {
      categories: normalizeCategories(read<Category[]>(KEYS.categories, []), teams),
      teams,
      matches: read<Match[]>(KEYS.matches, []),
      rivals: read<Rival[]>(KEYS.rivals, []),
    }
    void saveCloudState(state).catch(error => {
      console.error('[BarakAPP] No se pudo sincronizar con Firestore:', error)
    })
  }, 350)
}

export function enableCloudSync() {
  cloudSyncEnabled = true
}

export function disableCloudSync() {
  cloudSyncEnabled = false
  if (syncTimer) window.clearTimeout(syncTimer)
}

export function loadCategories(): Category[] {
  const teams = loadTeams()
  const categories = normalizeCategories(read<Category[]>(KEYS.categories, []), teams)
  localStorage.setItem(KEYS.categories, JSON.stringify(categories))
  return categories
}

export function saveCategories(categories: Category[]) {
  const normalized = normalizeCategories(categories, loadTeams())
  localStorage.setItem(KEYS.categories, JSON.stringify(normalized))
  scheduleCloudSync()
}

export function loadTeams(): Team[] {
  const stored = read<Team[]>(KEYS.teams, [])
  const teams = normalizeTeams(stored.length ? stored : demoTeams)
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
  return teams
}

export function saveTeams(teams: Team[]) {
  localStorage.setItem(KEYS.teams, JSON.stringify(normalizeTeams(teams)))
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

export function replaceLocalState(state: { categories?: Category[]; teams: Team[]; matches: Match[]; rivals: Rival[] }) {
  const teams = normalizeTeams(state.teams)
  localStorage.setItem(KEYS.teams, JSON.stringify(teams))
  localStorage.setItem(KEYS.matches, JSON.stringify(state.matches))
  localStorage.setItem(KEYS.rivals, JSON.stringify(state.rivals))
  const categories = normalizeCategories(state.categories ?? [], teams)
  localStorage.setItem(KEYS.categories, JSON.stringify(categories))
}
