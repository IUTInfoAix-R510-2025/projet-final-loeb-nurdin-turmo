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
      
      const sensors = await db.collection('sensor_devices').find(filter).toArray(); // Récupère les capteurs
      
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

  // GET /api/sensors/devices - Liste tous les capteurs (alias de /)
  fastify.get('/devices', async (request, reply) => {
    try {
      const db = getDB();
      const { experiment_id, type, status } = request.query;
      
      // Construction du filtre
      const filter = {};
      if (experiment_id) filter.experiment_id = experiment_id;
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      const sensors = await db.collection('sensor_devices').find(filter).toArray();
      
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

  // GET /api/sensors/types - Liste tous les types de capteurs
  fastify.get('/types', async (request, reply) => {
    try {
      const db = getDB();
      
      const sensorTypes = await db.collection('sensor_types').find({}).toArray();
      
      return {
        success: true,
        count: sensorTypes.length,
        data: sensorTypes
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
      
      const sensor = await db.collection('sensor_devices').findOne({ id });
      
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

  // POST /api/sensors - Créer un nouveau capteur
  fastify.post('/', async (request, reply) => {
    try {
      const db = getDB();
      const sensorData = request.body;

      // Validation basique
      if (!sensorData.id || !sensorData.experiment_id || !sensorData.type) {
        reply.code(400);
        return {
          success: false,
          error: 'Missing required fields: id, experiment_id, and type'
        };
      }

      // Vérifier si l'ID existe déjà
      const existingSensor = await db.collection('sensor_devices').findOne({ id: sensorData.id });
      if (existingSensor) {
        reply.code(409);
        return {
          success: false,
          error: 'Sensor with this ID already exists'
        };
      }

      // Ajouter les timestamps
      const newSensor = {
        ...sensorData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await db.collection('sensor_devices').insertOne(newSensor);

      reply.code(201);
      return {
        success: true,
        message: 'Sensor created successfully',
        data: newSensor
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // PUT /api/sensors/:id - Modifier un capteur
  fastify.put('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      const updateData = request.body;

      // Ne pas permettre de modifier l'ID
      delete updateData.id;
      delete updateData._id;

      // Mettre à jour le timestamp
      updateData.updated_at = new Date();

      const result = await db.collection('sensor_devices').findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        reply.code(404);
        return {
          success: false,
          error: 'Sensor not found'
        };
      }

      return {
        success: true,
        message: 'Sensor updated successfully',
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

  // DELETE /api/sensors/:id - Supprimer un capteur
  fastify.delete('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;

      const result = await db.collection('sensor_devices').deleteOne({ id });

      if (result.deletedCount === 0) {
        reply.code(404);
        return {
          success: false,
          error: 'Sensor not found'
        };
      }

      return {
        success: true,
        message: 'Sensor deleted successfully'
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
