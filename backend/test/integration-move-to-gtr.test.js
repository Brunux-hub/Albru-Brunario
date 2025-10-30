const request = require('supertest');
const { expect } = require('chai');

// This test assumes the backend server is configured and the DB is reachable via env vars.
// It will create a new client, call PUT to move it to GTR and then verify the historial contains an entry 'moved_to_gtr'.

describe('Integración: mover cliente a GTR', function() {
  const app = require('../server'); // server exports the express app and starts the server
  let createdClientId = null;
  const testPhone = `999000${Date.now().toString().slice(-6)}`;

  it('Crea un cliente de prueba', async function() {
    const payload = {
      nombre: 'Test Integration Client',
      telefono: testPhone,
      dni: `TI${Date.now()}`,
      wizard_completado: 0
    };

    const res = await request(app)
      .post('/api/clientes')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).to.be.oneOf([200,201]);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('cliente');
    createdClientId = res.body.cliente && res.body.cliente.id;
    expect(createdClientId).to.be.a('number');
  });

  it('Mueve el cliente a GTR via PUT y marca moved_to_gtr', async function() {
    expect(createdClientId).to.be.a('number');

    const res = await request(app)
      .put(`/api/clientes/${createdClientId}`)
      .send({ moveToGtr: true, usuario_id: 9999, observaciones_asesor: 'Test moved to GTR' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('success', true);

    // Consultar historial y buscar entrada moved_to_gtr para este cliente
    const histRes = await request(app)
      .get('/api/historial?limit=50')
      .set('Accept', 'application/json');

    expect(histRes.status).to.equal(200);
    expect(histRes.body).to.have.property('success', true);
    const found = (histRes.body.historial || []).some(h => h.cliente_id === createdClientId && (h.accion === 'moved_to_gtr' || (h.accion || '').includes('moved_to_gtr')));
    expect(found).to.equal(true);
  });
});
