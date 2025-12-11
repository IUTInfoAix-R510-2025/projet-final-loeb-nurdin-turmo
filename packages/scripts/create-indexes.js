// packages/scripts/create-indexes.js
require('dotenv').config({ path: '../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'iot_platform';

async function createIndexes() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log('📊 Création des index...');

    // TODO: Définissez les index pour chaque collection

    // Index géospatial pour les coordonnées des expériences
    await db.collection('experiments').createIndex(
      { 'location': '2dsphere' }
    );
    console.log('✅ Index géospatial sur experiments.location');

    // Index sur le cluster pour le filtrage
    await db.collection('experiments').createIndex({ cluster_id: 1 });
    console.log('✅ Index sur experiments.cluster_id');

    // Index composé pour les capteurs
    await db.collection('sensor_devices').createIndex({
      experiment_id: 1,
      status: 1
    });
    console.log('✅ Index composé sur sensor_devices');

    // Index composé pour les mesures (requêtes temporelles)
    await db.collection('measurements').createIndex({
      experiment_id: 1,
      timestamp: -1
    });
    await db.collection('measurements').createIndex({
      sensor_id: 1,
      timestamp: -1
    });
    console.log('✅ Index composés sur measurements');

    // Optionnel : Index TTL pour purge automatique (90 jours)
    // await db.collection('measurements').createIndex(
    //   { timestamp: 1 },
    //   { expireAfterSeconds: 90 * 24 * 60 * 60 }
    // );

    console.log('\n🎉 Tous les index ont été créés !');

  } finally {
    await client.close();
  }
}

createIndexes().catch(console.error);