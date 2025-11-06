// Motor de flujo de estatus extendido
// Encapsula reglas de validación, ruteo central y acciones derivadas
const TIMEOUT_SECONDS = 300; // 5 minutos

const transitions = {
  // estatus gestionados por GTR
  gtr: {
    null: ['nuevo','derivado','sin_gestionar','gestionada'],
    nuevo: ['derivado','sin_gestionar'],
    derivado: ['en_gestion','sin_gestionar'],
    sin_gestionar: ['derivado'],
    gestionada: ['gestionada']
  },
  // estatus gestionados por Asesor (estado comercial / wizard)
  asesor: {
    null: ['En Gestión','Terminado','Devuelto a GTR'],
    'En Gestión': ['En Gestión','Terminado','Devuelto a GTR'],
    Terminado: ['Terminado']
  }
};

function normalize(val) {
  if (val === undefined || val === null) return null;
  return String(val).trim();
}

function validateTransition({ tipo, current, nuevo }) {
  tipo = String(tipo);
  nuevo = normalize(nuevo);
  current = normalize(current);
  if (!transitions[tipo]) return { valid: false, reason: 'tipo no soportado' };
  const rules = transitions[tipo];
  if (current && rules[current]) {
    if (rules[current].includes(nuevo)) return { valid: true };
    return { valid: false, reason: `transición ${current} -> ${nuevo} no permitida para ${tipo}` };
  }
  const allowedValues = new Set(Object.values(rules).flat());
  if (allowedValues.has(nuevo)) return { valid: true };
  return { valid: false, reason: `estado ${nuevo} no permitido para tipo ${tipo}` };
}

function applyRules({ cliente, tipo, nuevo, meta }) {
  // Devuelve campos a actualizar y acciones derivadas
  const updated = {};
  const actions = [];

  if (tipo === 'gtr') {
    // Seguimiento (visible solo en GTR)
    updated.seguimiento_status = nuevo;
    if (nuevo === 'derivado') {
      updated.derivado_at = new Date();
      actions.push('start_derivado_timeout');
    }
    if (nuevo === 'en_gestion') {
      updated.opened_at = new Date();
      actions.push('mark_in_gestion');
    }
    if (nuevo === 'sin_gestionar') {
      actions.push('mark_sin_gestionar');
    }
    if (nuevo === 'gestionada') {
      actions.push('mark_gestionada');
    }
  }

  if (tipo === 'asesor') {
    // Estado comercial (categoría/subcategoria)
    if (meta && meta.categoria) updated.estatus_comercial_categoria = meta.categoria;
    if (meta && meta.subcategoria) updated.estatus_comercial_subcategoria = meta.subcategoria;
    if (meta && meta.wizard_data_json) updated.wizard_data_json = JSON.stringify(meta.wizard_data_json);
    if (nuevo === 'Terminado') {
      actions.push('mark_finalized');
      // Si la categoría es venta cerrada, enviar a calidad
      if (meta && meta.categoria === 'Venta Cerrada') actions.push('send_to_quality');
    }
  }

  return { updated, actions };
}

// Función centralizada para decidir ruteo por estado (por ejemplo, used by controllers)
function routeByStatus(status) {
  // Normaliza y devuelve acción esperada
  const s = normalize(status);
  if (!s) return { route: 'unknown' };
  if (s === 'nuevo') return { route: 'gtr:queue' };
  if (s === 'derivado') return { route: 'gtr:to_asesor' };
  if (s === 'en_gestion') return { route: 'asesor:open_wizard' };
  if (s === 'sin_gestionar') return { route: 'gtr:return_from_timeout' };
  if (s === 'gestionada') return { route: 'done' };
  return { route: 'unknown' };
}

// Evaluar seguimiento para un cliente concreto (timeout, acciones automáticas)
function routeBySeguimiento(clienteRow) {
  // clienteRow expected to have: seguimiento_status, derivado_at, opened_at, asesor_asignado, id
  const now = new Date();
  const status = normalize(clienteRow.seguimiento_status);
  if (status === 'derivado') {
    const derivadoAt = clienteRow.derivado_at ? new Date(clienteRow.derivado_at) : null;
    const openedAt = clienteRow.opened_at ? new Date(clienteRow.opened_at) : null;
    if (derivadoAt) {
      const elapsed = (now - derivadoAt) / 1000;
      if (!openedAt && elapsed >= TIMEOUT_SECONDS) {
        return { action: 'timeout_sin_gestionar', clienteId: clienteRow.id, asesorId: clienteRow.asesor_asignado };
      }
    }
  }
  return { action: 'none' };
}

module.exports = { validateTransition, applyRules, routeByStatus, routeBySeguimiento, TIMEOUT_SECONDS };
