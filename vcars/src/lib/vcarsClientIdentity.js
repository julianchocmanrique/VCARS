import AsyncStorage from '@react-native-async-storage/async-storage'

export const CLIENT_IDENTITY_KEY = '@vcars_client_identity'

export async function getClientIdentity() {
  const raw = await AsyncStorage.getItem(CLIENT_IDENTITY_KEY)
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    if (!v || !Array.isArray(v.plates)) return null
    return v
  } catch {
    return null
  }
}

export async function setClientIdentity(identity) {
  const safe = {
    type: identity?.type === 'empresa' ? 'empresa' : 'personal',
    name: String(identity?.name || '').slice(0, 80),
    plates: Array.isArray(identity?.plates)
      ? identity.plates.map((p) => String(p || '').trim().toUpperCase()).filter(Boolean).slice(0, 40)
      : [],
  }
  await AsyncStorage.setItem(CLIENT_IDENTITY_KEY, JSON.stringify(safe))
  return safe
}

export function isPlateAllowed(identity, plate) {
  const p = String(plate || '').trim().toUpperCase()
  if (!identity || !Array.isArray(identity.plates)) return false
  return identity.plates.includes(p)
}
