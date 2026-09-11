import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore'
import type { Match, Rival, Team } from './types'

// Firebase Web configuration is public client configuration, not an admin credential.
// Environment variables can override these values for another Firebase project.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDPPoYUGsnjAboG-N_RoYL3NCXJ23RU7Bg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'barakapp-38886.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'barakapp-38886',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'barakapp-38886.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '976158903397',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:976158903397:web:29d5625cd245926918ca8c',
}

export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

const app = firebaseEnabled ? initializeApp(config) : null
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null
const CLUB_ID = 'barakaldo'

export type CloudState = { teams: Team[]; matches: Match[]; rivals: Rival[] }

export function observeAuth(callback: (user: User | null) => void) {
  if (!auth) return () => undefined
  return onAuthStateChanged(auth, callback)
}

export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase no está configurado.')
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signOut() {
  if (auth) await firebaseSignOut(auth)
}

async function readCollection<T>(name: string): Promise<T[]> {
  if (!db) throw new Error('Firestore no está configurado.')
  const snap = await getDocs(collection(db, 'clubs', CLUB_ID, name))
  return snap.docs.map(item => item.data() as T)
}

export async function loadCloudState(): Promise<CloudState | null> {
  if (!db) throw new Error('Firestore no está configurado.')
  const [teams, matches, rivals] = await Promise.all([
    readCollection<Team>('teams'),
    readCollection<Match>('matches'),
    readCollection<Rival>('rivals'),
  ])
  if (!teams.length && !matches.length && !rivals.length) return null
  return { teams, matches, rivals }
}

async function syncCollection<T extends { id: string }>(name: string, items: T[]) {
  if (!db) throw new Error('Firestore no está configurado.')
  const ref = collection(db, 'clubs', CLUB_ID, name)
  const existing = await getDocs(ref)
  const wanted = new Set(items.map(item => item.id))
  await Promise.all(existing.docs.filter(item => !wanted.has(item.id)).map(item => deleteDoc(item.ref)))
  await Promise.all(items.map(item => setDoc(doc(ref, item.id), item)))
}

export async function saveCloudState(state: CloudState) {
  await Promise.all([
    syncCollection('teams', state.teams),
    syncCollection('matches', state.matches),
    syncCollection('rivals', state.rivals),
  ])
}
