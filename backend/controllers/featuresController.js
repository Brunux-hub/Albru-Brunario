const pool = require('../config/database');

// GET /api/features
const getFeatures = async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'albru';

    // Comprobar si existe la columna estatus_wizard en clientes
    const [colEstatus] = await pool.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estatus_wizard' LIMIT 1", [dbName]);

    // Comprobar si existe la tabla historial_estados
    const [tableHist] = await pool.query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'historial_estados' LIMIT 1", [dbName]);

    return res.json({
      success: true,
      features: {
        hasEstatusWizard: Boolean(colEstatus && colEstatus.length > 0),
        hasHistorialEstados: Boolean(tableHist && tableHist.length > 0)
      }
    });
  } catch (e) {
    console.error('Error getFeatures', e);
    return res.status(500).json({ success: false, message: 'Error interno', error: e.message });
  }
};

module.exports = { getFeatures };
