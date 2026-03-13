import { API_URL } from '../config/api'

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '')
  const p = String(path || '').replace(/^\/+/, '')
  return `${b}/${p}`
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import { SESSION_KEY } from './vcarsAuth'

async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const url = joinUrl(API_URL, path)

  // Cargar token (si existe)
  let token = null
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY)
    const s = raw ? JSON.parse(raw) : null
    token = s?.token || null
  } catch {
    token = null
  }

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { ok: false, error: text || 'Respuesta no-JSON del servidor' }
  }

  if (!res.ok) {
    const msg = json?.error || `Error HTTP ${res.status}`
    throw new Error(msg)
  }

  if (json && json.ok === false) {
    throw new Error(json.error || 'Error del servidor')
  }

  return json
}

function buildQuery(params = {}) {
  const parts = []
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  })
  return parts.length ? `?${parts.join('&')}` : ''
}

export async function listVehicles({ take = 50, plate } = {}) {
  // Nota: en algunos runtimes de React Native (iOS) URLSearchParams puede no estar completo.
  const q = buildQuery({ take, plate })
  const json = await apiFetch(`vehicles${q}`)
  return json.vehicles || []
}

export async function getVehicleByPlate(plate) {
  const p = String(plate || '').trim().toUpperCase()
  const json = await apiFetch(`vehicles/${encodeURIComponent(p)}`)
  return json.vehicle
}

export async function createCustomer({ name, email, phone } = {}) {
  const json = await apiFetch('customers', {
    method: 'POST',
    body: { name, email: email || '', phone: phone || '' },
  })
  return json.customer
}

export async function createVehicle({ plate, brand, model, color, year, customer } = {}) {
  const json = await apiFetch('vehicles', {
    method: 'POST',
    body: {
      plate,
      brand: brand || '',
      model: model || '',
      color: color || '',
      year: year || '',
      customer,
    },
  })
  return json.vehicle
}

export async function createEntry({ vehicleId, receivedBy, notes, mileageKm, fuelLevel } = {}) {
  const json = await apiFetch(`vehicles/${vehicleId}/entries`, {
    method: 'POST',
    body: {
      receivedBy: receivedBy || '',
      notes: notes || '',
      mileageKm: typeof mileageKm === 'number' ? mileageKm : undefined,
      fuelLevel: fuelLevel || '',
    },
  })
  return json.entry
}

// Helper de alto nivel: crea (cliente + vehículo) y luego crea el ingreso
export async function createIngreso({
  plate,
  customerName,
  customerPhone,
  vehicleModel,
  receivedBy,
} = {}) {
  const vehicle = await createVehicle({
    plate,
    model: vehicleModel || '',
    customer: {
      name: customerName,
      phone: customerPhone || '',
      email: '',
    },
  })

  const entry = await createEntry({
    vehicleId: vehicle.id,
    receivedBy,
    notes: '',
  })

  return { vehicle, entry }
}
