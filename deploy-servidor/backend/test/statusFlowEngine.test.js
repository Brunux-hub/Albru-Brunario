const assert = require('assert');
const engine = require('../services/statusFlowEngine');

describe('statusFlowEngine', () => {
  it('permite gtr -> derivado', () => {
    const v = engine.validateTransition({ tipo: 'gtr', current: null, nuevo: 'derivado' });
    assert.strictEqual(v.valid, true);
  });

  it('bloquea transicion no permitida en el rol asesor', () => {
    const v = engine.validateTransition({ tipo: 'asesor', current: 'En Gestión', nuevo: 'Pendiente datos' });
    assert.strictEqual(v.valid, false);
  });
});
