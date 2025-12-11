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

  // POST /api/sensors/measurements - Créer une nouvelle mesure
  fastify.post('/', async (request, reply) => {
    try {
      const db = getDB();
      const measurementData = request.body;

      // Validation basique
      if (!measurementData.sensor_id || measurementData.value === undefined) {
        reply.code(400);
        return {
          success: false,
          error: 'Missing required fields: sensor_id and value'
        };
      }

      // Ajouter le timestamp si absent
      const newMeasurement = {
        ...measurementData,
        timestamp: measurementData.timestamp ? new Date(measurementData.timestamp) : new Date()
      };

      await db.collection('measurements').insertOne(newMeasurement);

      reply.code(201);
      return {
        success: true,
        message: 'Measurement created successfully',
        data: newMeasurement
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // PUT /api/sensors/measurements/:id - Modifier une mesure
  fastify.put('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      const updateData = request.body;

      // Ne pas permettre de modifier l'_id
      delete updateData._id;

      const { ObjectId } = require('mongodb');
      const result = await db.collection('measurements').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        reply.code(404);
        return {
          success: false,
          error: 'Measurement not found'
        };
      }

      return {
        success: true,
        message: 'Measurement updated successfully',
        data: result
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // DELETE /api/sensors/measurements/:id - Supprimer une mesure
  fastify.delete('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;

      const { ObjectId } = require('mongodb');
      const result = await db.collection('measurements').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        reply.code(404);
        return {
          success: false,
          error: 'Measurement not found'
        };
      }

      return {
        success: true,
        message: 'Measurement deleted successfully'
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
