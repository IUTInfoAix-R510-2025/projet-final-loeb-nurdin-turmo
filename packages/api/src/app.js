// packages/api/src/app.js
require('dotenv').config({ path: '../../.env' });
const fastify = require('fastify')({ logger: true });
const { connectDB } = require('./services/database');

const PORT = process.env.API_PORT || 3000;

async function buildServer() {
  // Plugin CORS
  await fastify.register(require('@fastify/cors'), {
    origin: true  // Autorise toutes les origines en dev
  });

  // Routes API
  await fastify.register(require('./routes/experiments'), { prefix: '/api/experiments' });
  await fastify.register(require('./routes/sensor'), { prefix: '/api/sensors' });
  await fastify.register(require('./routes/measurements'), { prefix: '/api/sensors/measurements' });

  // Health check
  fastify.get('/api/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    };
  });

  // Route pour récupérer les constantes partagées (utile pour le frontend)
  fastify.get('/api/config', async (request, reply) => {
    const { CLUSTERS, PROTOCOLS, SENSOR_TYPES, SENSOR_STATUS } = require('@iot/shared');
    return {
      success: true,
      data: { CLUSTERS, PROTOCOLS, SENSOR_TYPES, SENSOR_STATUS }
    };
  });

  return fastify;
}

// Démarrage
async function start() {
  try {
    await connectDB();
    const server = await buildServer();

    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Serveur Fastify démarré sur http://localhost:${PORT}`);
  } catch (error) {
    console.error('Erreur de démarrage:', error);
    process.exit(1);
  }
}

start();