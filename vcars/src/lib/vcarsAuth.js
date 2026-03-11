import AsyncStorage from '@react-native-async-storage/async-storage'
import { ensureDemoWorkspace } from './vcarsDemoSeed'

export const SESSION_KEY = '@vcars_session'
export const PROFILE_KEY = '@vcars_profile'

// MVP local auth (sin backend). Luego se reemplaza por Supabase/API.
// No es seguro para producción, sirve para organizar flujos por rol.
export const DEMO_USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    password: '1234',
    role: 'administrativo',
    label: 'Administrador',
  },
  {
    id: 'u_tech',
    username: 'tecnico',
    password: '1234',
    role: 'tecnico',
    label: 'Técnico',
  },
  {
    id: 'u_client',
    username: 'cliente',
    password: '1234',
    role: 'cliente',
    label: 'Cliente',
  },
]

export function findUser(username) {
  const u = String(username || '').trim().toLowerCase()
  return DEMO_USERS.find((x) => x.username === u) || null
}

export async function signIn({ username, password }) {
  const user = findUser(username)
  if (!user) return { ok: false, error: 'Usuario no existe' }
  if (String(password || '') !== user.password) return { ok: false, error: 'Contraseña incorrecta' }

  const session = {
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: new Date().toISOString(),
  }

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
  await AsyncStorage.setItem(PROFILE_KEY, user.role)
  await ensureDemoWorkspace(user.role)

  return { ok: true, session }
}

export async function signOut() {
  await AsyncStorage.removeItem(SESSION_KEY)
  await AsyncStorage.removeItem(PROFILE_KEY)
}

export async function getSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw)
    if (!s?.role) return null
    await ensureDemoWorkspace(s.role)
    return s
  } catch {
    return null
  }
}
