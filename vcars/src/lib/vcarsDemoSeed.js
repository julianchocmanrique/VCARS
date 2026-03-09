import AsyncStorage from '@react-native-async-storage/async-storage'
import { VCARS_STEP_TITLES } from './vcarsProcess'

const PROFILE_KEY = '@vcars_profile'
const ENTRIES_KEY = '@vcars_entries'
const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const STORAGE_MAP_KEY = '@vcars_orden_servicio_map'

// Client company demo identity (MVP)
const CLIENT_COMPANY_KEY = '@vcars_client_company'

function nowIso() {
  return new Date().toISOString()
}

function mkEntry({
  id,
  placa,
  cliente,
  telefono,
  vehiculo,
  empresa,
  stepIndex,
  status,
}) {
  const paso = VCARS_STEP_TITLES[Math.max(0, Math.min(stepIndex, VCARS_STEP_TITLES.length - 1))]
  return {
    id,
    placa,
    cliente,
    telefono,
    vehiculo,
    empresa,
    paso,
    stepIndex,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

function mkWizardForm(entry) {
  // minimal form to make wizard feel populated
  return {
    placa: entry.placa,
    propietario: entry.cliente,
    telefono: entry.telefono,
    marca: entry.vehiculo,
    empresa: entry.empresa || '',
    fechaEntrada: nowIso().slice(0, 10),
    fechaEntrega: '',
    fallaCliente: 'Revisión general y ruido en frenos',
    diagnosticoTecnico: 'Pastillas gastadas. Revisión de discos y líquido.',
    trabajosSugeridos: 'Cambio pastillas + limpieza + revisión',
    repuestosNecesarios: 'Pastillas delanteras, líquido de frenos',
    combustible: '50%',
  }
}

export const DEMO_PROFILES = [
  {
    id: 'demo-admin',
    label: 'Demo ADMIN — Taller',
    profile: 'administrativo',
  },
  {
    id: 'demo-tech',
    label: 'Demo TÉCNICO — Taller',
    profile: 'tecnico',
  },
  {
    id: 'demo-client-company',
    label: 'Demo CLIENTE — Empresa (Viralco)',
    profile: 'cliente',
    company: {
      companyName: 'Viralco',
      plates: ['VIR123', 'VIR456', 'VIR789'],
    },
  },
  {
    id: 'demo-client-personal',
    label: 'Demo CLIENTE — Particular',
    profile: 'cliente',
    company: {
      companyName: 'Particular',
      plates: ['ABC123'],
    },
  },
  {
    id: 'demo-admin-full',
    label: 'Demo ADMIN — Full dataset',
    profile: 'administrativo',
  },
]

export async function seedDemoProfile(demoId) {
  const demo = DEMO_PROFILES.find((d) => d.id === demoId) || DEMO_PROFILES[0]

  // Seed entries: a mix of active + done
  const entries = [
    mkEntry({
      id: 'os-1001',
      placa: 'ABC123',
      cliente: 'Juan Pérez',
      telefono: '3001234567',
      vehiculo: 'Mazda 3 · 2018',
      empresa: 'Particular',
      stepIndex: 1,
      status: 'active',
    }),
    mkEntry({
      id: 'os-1002',
      placa: 'VIR123',
      cliente: 'Viralco SAS',
      telefono: '6011112222',
      vehiculo: 'NPR · 2020',
      empresa: 'Viralco',
      stepIndex: 2,
      status: 'active',
    }),
    mkEntry({
      id: 'os-0999',
      placa: 'DEF456',
      cliente: 'María Gómez',
      telefono: '3112223344',
      vehiculo: 'Kia Rio · 2016',
      empresa: 'Particular',
      stepIndex: 5,
      status: 'done',
    }),
  ]

  // Wizard map: populate for 1–2 entries so "Continuar" feels real
  const map = {
    'os-1001': {
      form: mkWizardForm(entries[0]),
      step: 1,
      completed: [0],
    },
    'os-1002': {
      form: mkWizardForm(entries[1]),
      step: 2,
      completed: [0, 1],
    },
  }

  await AsyncStorage.multiSet([
    [PROFILE_KEY, demo.profile],
    [ENTRIES_KEY, JSON.stringify(entries)],
    [CURRENT_ENTRY_KEY, JSON.stringify(entries[0])],
    [STORAGE_MAP_KEY, JSON.stringify(map)],
  ])

  if (demo.company) {
    await AsyncStorage.setItem(CLIENT_COMPANY_KEY, JSON.stringify(demo.company))
  }

  return demo
}
