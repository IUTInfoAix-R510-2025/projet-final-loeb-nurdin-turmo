// packages/api/src/routes/experiments.js
const { getDB } = require('../services/database');

async function routes(fastify, options) {
  // GET /api/experiments - Liste toutes les expériences
  fastify.get('/', async (request, reply) => {
    try {
      const db = getDB();
      const experiments = await db.collection('experiments').find({}).toArray();
      
      return {
        success: true,
        count: experiments.length,
        data: experiments
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // GET /api/experiments/:id - Récupère une expérience par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      
      const experiment = await db.collection('experiments').findOne({ id });
      
      if (!experiment) {
        reply.code(404);
        return {
          success: false,
          error: 'Experiment not found'
        };
      }
      
      return {
        success: true,
        data: experiment
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // GET /api/experiments/:id/sensors - Récupère les capteurs d'une expérience
  fastify.get('/:id/sensors', async (request, reply) => {
    try {
      const db = getDB();
      const { id } = request.params;
      
      const sensors = await db.collection('sensors')
        .find({ experiment_id: id })
        .toArray();
      
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
}

module.exports = routes;
