import { normalizeStepTitle } from './vcarsProcess'

// Convierte la data del backend (vcars-api) a la forma que hoy esperan las pantallas (legacy)
export function apiVehicleToLegacyEntry(vehicle) {
  if (!vehicle) return null

  const plate = vehicle.plate || vehicle.placa || ''
  const customerName = vehicle.customer?.name || ''
  const customerPhone = vehicle.customer?.phone || ''
  const model = vehicle.model || ''

  // Tomamos la última entrada si viene incluida (el API la incluye en /vehicles/:plate)
  const lastEntry = Array.isArray(vehicle.entries) && vehicle.entries.length
    ? vehicle.entries[0]
    : null

  const paso = normalizeStepTitle('Recepcion y orden de servicio')

  return {
    id: vehicle.id,
    placa: plate,
    cliente: customerName,
    telefono: customerPhone,
    vehiculo: model,
    paso,
    fecha: lastEntry?.createdAt || vehicle.updatedAt || vehicle.createdAt,
    updatedAt: lastEntry?.createdAt || vehicle.updatedAt || vehicle.createdAt,
    backend: {
      vehicleId: vehicle.id,
      entryId: lastEntry?.id || null,
    },
  }
}
