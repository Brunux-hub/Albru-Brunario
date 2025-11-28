const pool = require('../config/database');

async function getDashboard(req, res) {
  try {
    // Demo data. In production, replace with real queries aggregating from clientes/ventas tables.
    const dashboard = {
      totalClientes: 2487,
      clientesActivos: 1856,
      ventasMes: 67,
      ingresosMes: 101000,
      horasSemana: [60,63,55,60,62,30],
      metas: { ventas: { actual: 67, meta: 70 }, ingresos: { actual: 101000, meta: 120000 }, conversion: { actual: 18.3, meta: 20 } },
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({ success: false, message: 'Error al obtener dashboard', error: error.message });
  }
}

async function getTopAsesores(req, res) {
  try {
    // Demo top list
    const top = [
      { id: 1, nombre: 'ANA', ventas: 5, ingresos: 4200 },
      { id: 2, nombre: 'SASKYA', ventas: 4, ingresos: 3650 },
      { id: 3, nombre: 'JUAN', ventas: 3, ingresos: 2850 }
    ];
    res.json({ success: true, top });
  } catch (error) {
    console.error('Error en getTopAsesores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener top asesores', error: error.message });
  }
}

module.exports = { getDashboard, getTopAsesores };
