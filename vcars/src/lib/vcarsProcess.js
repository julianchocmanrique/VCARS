// VCARS process definition (MVP) — keeps Wizard/Detalle in sync
// NOTE: keep strings stable; use helper to map legacy titles.

export const VCARS_STEPS = [
  { key: 'recepcion', title: 'Recepción (Ingreso)' },
  { key: 'cotizacion_interna', title: 'Diagnóstico / Cotización interna' },
  { key: 'cotizacion_formal', title: 'Cotización al cliente (Admin)' },
  { key: 'aprobacion', title: 'Autorización del cliente' },
  { key: 'trabajo', title: 'Ejecución (Taller)' },
  { key: 'entrega', title: 'Entrega / Cierre (Admin)' },
];

export const VCARS_STEP_TITLES = VCARS_STEPS.map(s => s.title);

// Role permissions aligned with real workshop process
export const TECH_ALLOWED = new Set([0, 1, 4]);
export const CLIENT_ALLOWED = new Set([0, 3, 5]);

const LEGACY_TITLE_MAP = {
  'Recepcion y orden de servicio': VCARS_STEPS[0].title,
  'Recepcion': VCARS_STEPS[0].title,
  'Cotizacion detallada': VCARS_STEPS[1].title,
  'Cotizacion': VCARS_STEPS[2].title,
  'Aprobacion del cliente': VCARS_STEPS[3].title,
  'Ejecucion en taller': VCARS_STEPS[4].title,
  'Entrega del vehiculo': VCARS_STEPS[5].title,
};

export function normalizeStepTitle(title) {
  const raw = (title || '').toString().trim();
  if (!raw) return '';
  return LEGACY_TITLE_MAP[raw] || raw;
}

export function stepIndexFromTitle(title) {
  const normalized = normalizeStepTitle(title);
  const idx = VCARS_STEP_TITLES.findIndex(t => t === normalized);
  return Math.max(0, idx);
}

export function allowedStepIndices(profile) {
  if (profile === 'tecnico') return VCARS_STEPS.map((_, i) => i).filter(i => TECH_ALLOWED.has(i));
  if (profile === 'cliente') return VCARS_STEPS.map((_, i) => i).filter(i => CLIENT_ALLOWED.has(i));
  return VCARS_STEPS.map((_, i) => i);
}
