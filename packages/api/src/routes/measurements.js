// packages/api/src/routes/measurements.js
const { getDB } = require('../services/database');

async function routes(fastify, options) {
  // GET /api/sensors/measurements - Liste toutes les mesures
  fastify.get('/', async (request, reply) => {
    try {
      const db = getDB();
      const { sensor_id, limit = 1000, start_date, end_date } = request.query;
      
      // Construction du filtre
      const filter = {};
      if (sensor_id) filter.sensor_id = sensor_id;
      
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

  // GET /api/sensors/measurements/stats - Statistiques sur les mesures
  fastify.get('/stats', async (request, reply) => {
    try {
      const db = getDB();
      const { sensor_id } = request.query;
      
      if (!sensor_id) {
        reply.code(400);
        return {
          success: false,
          error: 'sensor_id is required'
        };
      }
      
      const stats = await db.collection('measurements').aggregate([
        { $match: { sensor_id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            firstTimestamp: { $min: '$timestamp' },
            lastTimestamp: { $max: '$timestamp' }
          }
        }
      ]).toArray();
      
      return {
        success: true,
        data: stats[0] || {}
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
