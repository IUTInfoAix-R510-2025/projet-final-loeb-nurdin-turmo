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

   const sensors = await db.collection('sensor_devices')
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

 // POST /api/experiments - Créer une nouvelle expérience
 fastify.post('/', async (request, reply) => {
  try {
   const db = getDB();
   const experimentData = request.body;

   // Validation basique
   if (!experimentData.id || !experimentData.title) {
    reply.code(400);
    return {
     success: false,
     error: 'Missing required fields: id and title'
    };
   }

   // Vérifier si l'ID existe déjà
   const existingExperiment = await db.collection('experiments').findOne({ id: experimentData.id });
   if (existingExperiment) {
    reply.code(409);
    return {
     success: false,
     error: 'Experiment with this ID already exists'
    };
   }

   // Ajouter les timestamps
   const newExperiment = {
    ...experimentData,
    created_at: new Date(),
    updated_at: new Date()
   };

   await db.collection('experiments').insertOne(newExperiment);

   reply.code(201);
   return {
    success: true,
    message: 'Experiment created successfully',
    data: newExperiment
   };
  } catch (error) {
   reply.code(500);
   return {
    success: false,
    error: error.message
   };
  }
 });

 // PUT /api/experiments/:id - Modifier une expérience
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

   const result = await db.collection('experiments').findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: 'after' }
   );

   if (!result) {
    reply.code(404);
    return {
     success: false,
     error: 'Experiment not found'
    };
   }

   return {
    success: true,
    message: 'Experiment updated successfully',
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

 // DELETE /api/experiments/:id - Supprimer une expérience
 fastify.delete('/:id', async (request, reply) => {
  try {
   const db = getDB();
   const { id } = request.params;

   const result = await db.collection('experiments').deleteOne({ id });

   if (result.deletedCount === 0) {
    reply.code(404);
    return {
     success: false,
     error: 'Experiment not found'
    };
   }

   return {
    success: true,
    message: 'Experiment deleted successfully'
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
