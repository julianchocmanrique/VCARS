import AsyncStorage from '@react-native-async-storage/async-storage'
import { ensureDemoWorkspace } from './vcarsDemoSeed'

export const SESSION_KEY = '@vcars_session'
export const PROFILE_KEY = '@vcars_profile'

// Auth real via backend (vcars-api)
// Nota: mantenemos la estructura de roles que usa la app.
export const DEMO_USERS = [
  { id: 'u_admin', username: 'admin', password: '1234', role: 'administrativo', label: 'Administrador' },
  { id: 'u_tech', username: 'tecnico', password: '1234', role: 'tecnico', label: 'Técnico' },
  { id: 'u_client', username: 'cliente', password: '1234', role: 'cliente', label: 'Cliente' },
]

function roleFromApi(role) {
  // API: ADMIN | TECH | CLIENT
  if (role === 'TECH') return 'tecnico'
  if (role === 'CLIENT') return 'cliente'
  return 'administrativo'
}

export function findUser(username) {
  const u = String(username || '').trim().toLowerCase()
  return DEMO_USERS.find((x) => x.username === u) || null
}

export async function signIn({ username, password }) {
  const u = String(username || '').trim().toLowerCase()
  const p = String(password || '')

  try {
    // Lazy import para evitar ciclos
    const { API_URL } = await import('../config/api')

    const res = await fetch(`${String(API_URL).replace(/\/+$/, '')}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: u, password: p }),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || 'No se pudo iniciar sesión' }
    }

    const role = roleFromApi(json.user?.role)

    const session = {
      userId: json.user?.id,
      username: json.user?.username || u,
      role,
      token: json.token,
      createdAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
    await AsyncStorage.setItem(PROFILE_KEY, role)
    await ensureDemoWorkspace(role)

    return { ok: true, session }
  } catch (e) {
    // Si backend no responde, fallback a DEMO local para no bloquear.
    const user = findUser(u)
    if (!user) return { ok: false, error: 'No se pudo conectar al servidor' }
    if (p !== user.password) return { ok: false, error: 'Contraseña incorrecta' }

    const session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      token: null,
      createdAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
    await AsyncStorage.setItem(PROFILE_KEY, user.role)
    await ensureDemoWorkspace(user.role)

    return { ok: true, session }
  }
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
