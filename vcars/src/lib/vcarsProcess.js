const ADMIN = 'administrativo';
const TECH = 'tecnico';
const CLIENT = 'cliente';

export const VCARS_PROCESS = [
  {
    key: 'recepcion',
    title: 'Recepción (Ingreso)',
    shortTitle: 'Recepción',
    advanceRoles: [ADMIN, TECH],
    editableRoles: [ADMIN, TECH],
    visibleRoles: [ADMIN, TECH, CLIENT],
  },
  {
    key: 'cotizacion_interna',
    title: 'Diagnóstico / Cotización interna',
    shortTitle: 'Diagnóstico',
    advanceRoles: [TECH, ADMIN],
    editableRoles: [TECH, ADMIN],
    visibleRoles: [ADMIN, TECH],
  },
  {
    key: 'cotizacion_formal',
    title: 'Cotización al cliente (Admin)',
    shortTitle: 'Cotización cliente',
    advanceRoles: [ADMIN],
    editableRoles: [ADMIN],
    visibleRoles: [ADMIN],
  },
  {
    key: 'aprobacion',
    title: 'Autorización del cliente',
    shortTitle: 'Autorización',
    advanceRoles: [ADMIN, CLIENT],
    editableRoles: [ADMIN, CLIENT],
    visibleRoles: [ADMIN, CLIENT],
  },
  {
    key: 'trabajo',
    title: 'Ejecución (Taller)',
    shortTitle: 'Ejecución',
    advanceRoles: [TECH, ADMIN],
    editableRoles: [TECH, ADMIN],
    visibleRoles: [ADMIN, TECH, CLIENT],
  },
  {
    key: 'entrega',
    title: 'Entrega / Cierre (Admin)',
    shortTitle: 'Entrega',
    advanceRoles: [ADMIN],
    editableRoles: [ADMIN],
    visibleRoles: [ADMIN, CLIENT],
  },
];

export const VCARS_STEPS = VCARS_PROCESS;
export const VCARS_STEP_TITLES = VCARS_PROCESS.map(step => step.title);
export const VCARS_STEP_KEYS = VCARS_PROCESS.map(step => step.key);

const LEGACY_TITLE_MAP = {
  Recepcion: VCARS_PROCESS[0].title,
  'Recepcion y orden de servicio': VCARS_PROCESS[0].title,
  'Cotizacion detallada': VCARS_PROCESS[1].title,
  Cotizacion: VCARS_PROCESS[2].title,
  'Aprobacion del cliente': VCARS_PROCESS[3].title,
  'Ejecucion en taller': VCARS_PROCESS[4].title,
  'Entrega del vehiculo': VCARS_PROCESS[5].title,
};

function normalizeRole(profile) {
  if (profile === TECH || profile === CLIENT) {
    return profile;
  }

  return ADMIN;
}

export function getStepAt(stepIndex) {
  return VCARS_PROCESS[
    Math.max(0, Math.min(stepIndex, VCARS_PROCESS.length - 1))
  ];
}

export function getStepTitle(stepIndex) {
  return getStepAt(stepIndex).title;
}

export function normalizeStepTitle(title) {
  const raw = String(title || '').trim();
  if (!raw) {
    return VCARS_PROCESS[0].title;
  }

  return LEGACY_TITLE_MAP[raw] || raw;
}

export function stepIndexFromTitle(title) {
  const normalized = normalizeStepTitle(title);
  const idx = VCARS_STEP_TITLES.findIndex(
    stepTitle => stepTitle === normalized,
  );
  return idx >= 0 ? idx : 0;
}

export function getStepMeta(stepIndexOrTitle) {
  if (typeof stepIndexOrTitle === 'number') {
    return getStepAt(stepIndexOrTitle);
  }

  return getStepAt(stepIndexFromTitle(stepIndexOrTitle));
}

export function allowedStepIndices(profile) {
  const role = normalizeRole(profile);
  return VCARS_PROCESS.map((step, index) => ({step, index}))
    .filter(({step}) => step.visibleRoles.includes(role))
    .map(({index}) => index);
}

export function editableStepIndices(profile) {
  const role = normalizeRole(profile);
  return VCARS_PROCESS.map((step, index) => ({step, index}))
    .filter(({step}) => step.editableRoles.includes(role))
    .map(({index}) => index);
}

export function canRoleViewStep(profile, stepIndexOrTitle) {
  const role = normalizeRole(profile);
  return getStepMeta(stepIndexOrTitle).visibleRoles.includes(role);
}

export function canRoleEditStep(profile, stepIndexOrTitle) {
  const role = normalizeRole(profile);
  return getStepMeta(stepIndexOrTitle).editableRoles.includes(role);
}

export function canRoleAdvanceStep(profile, stepIndexOrTitle) {
  const role = normalizeRole(profile);
  return getStepMeta(stepIndexOrTitle).advanceRoles.includes(role);
}

export function getVisibleSteps(profile) {
  return allowedStepIndices(profile).map(index => ({
    ...VCARS_PROCESS[index],
    index,
  }));
}
