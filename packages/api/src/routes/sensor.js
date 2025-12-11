// packages/api/src/routes/sensor.js
const { getDB } = require('../services/database');

async function routes(fastify, options) {
  // GET /api/sensors - Liste tous les capteurs
  fastify.get('/', async (request, reply) => {
    try {
      const db = getDB();
      const { experiment_id, type, status } = request.query;
      
      // Construction du filtre
      const filter = {};
      if (experiment_id) filter.experiment_id = experiment_id;
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      const sensors = await db.collection('sensors').find(filter).toArray();
      
      return {
        success: true,
        count: sensors.length,
        data: sensors
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // GET /api/sensors/:id - Récupère un capteur par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      
      const sensor = await db.collection('sensors').findOne({ id });
      
      if (!sensor) {
        reply.code(404);
        return {
          success: false,
          error: 'Sensor not found'
        };
      }
      
      return {
        success: true,
        data: sensor
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // GET /api/sensors/:id/measurements - Récupère les mesures d'un capteur
  fastify.get('/:id/measurements', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      const { limit = 100, start_date, end_date } = request.query;
      
      // Construction du filtre
      const filter = { sensor_id: id };
      if (start_date || end_date) {
        filter.timestamp = {};
        if (start_date) filter.timestamp.$gte = new Date(start_date);
        if (end_date) filter.timestamp.$lte = new Date(end_date);
      }
      
      const measurements = await db.collection('measurements')
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      return {
        success: true,
        count: measurements.length,
        data: measurements
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

module.exports = routes;
