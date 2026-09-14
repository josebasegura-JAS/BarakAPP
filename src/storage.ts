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

function categoriesFromTeams(teams: Team[]): Category[] {
  const names = [...new Set(teams.map(team => team.category.trim()).filter(Boolean))]
  return names.sort((a, b) => a.localeCompare(b, 'es')).map(name => ({ id: categoryIdFromName(name), name }))
}

function scheduleCloudSync() {
  if (!cloudSyncEnabled || !firebaseEnabled) return
  if (syncTimer) window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const teams = read<Team[]>(KEYS.teams, [])
    const state = {
      categories: read<Category[]>(KEYS.categories, categoriesFromTeams(teams)),
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
  const stored = read<Category[]>(KEYS.categories, [])
  if (stored.length) return stored
  const categories = categoriesFromTeams(loadTeams())
  localStorage.setItem(KEYS.categories, JSON.stringify(categories))
  return categories
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories))
  scheduleCloudSync()
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

export function replaceLocalState(state: { categories?: Category[]; teams: Team[]; matches: Match[]; rivals: Rival[] }) {
  localStorage.setItem(KEYS.teams, JSON.stringify(state.teams))
  localStorage.setItem(KEYS.matches, JSON.stringify(state.matches))
  localStorage.setItem(KEYS.rivals, JSON.stringify(state.rivals))
  const categories = state.categories?.length ? state.categories : categoriesFromTeams(state.teams)
  localStorage.setItem(KEYS.categories, JSON.stringify(categories))
}
