import { API_URL } from '../config/api'

async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { ok: false, error: text || 'Invalid JSON response' }
  }

  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }

  if (json && json.ok === false) {
    throw new Error(json.error || 'Request failed')
  }

  return json
}

export async function createVehicleWithCustomer({
  plate,
  brand,
  model,
  year,
  color,
  customerName,
  customerPhone,
  customerEmail,
}) {
  const data = await apiFetch('/vehicles', {
    method: 'POST',
    body: {
      plate,
      brand,
      model,
      year,
      color,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
    },
  })
  return data.vehicle
}

export async function createEntry({ vehicleId, receivedBy, notes, mileageKm, fuelLevel }) {
  const data = await apiFetch(`/vehicles/${vehicleId}/entries`, {
    method: 'POST',
    body: { receivedBy, notes, mileageKm, fuelLevel },
  })
  return data.entry
}

export async function listVehicles({ take = 50, plate } = {}) {
  const qs = new URLSearchParams()
  if (take) qs.set('take', String(take))
  if (plate) qs.set('plate', String(plate))
  const data = await apiFetch(`/vehicles?${qs.toString()}`)
  return data.vehicles || []
}

export async function getVehicleByPlate(plate) {
  const data = await apiFetch(`/vehicles/${encodeURIComponent(String(plate || '').trim())}`)
  return data.vehicle
}
