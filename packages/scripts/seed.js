// packages/scripts/seed.js
require('dotenv').config({ path: '../../.env' }); // On va chercher le .env à la racine
const { MongoClient } = require('mongodb');
// On importe les constantes partagées
const { CLUSTERS, PROTOCOLS, SENSOR_TYPES } = require('@iot/shared/constants'); 

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'iot_platform';

// --- Fonctions de génération ---

function generateExperiments(count = 5) {
  const cities = ['Aix-en-Provence', 'Marseille', 'Toulon', 'Nice', 'Avignon'];
  const schools = ['Victor Hugo', 'Marie Curie', 'Jean Moulin', 'Albert Camus', 'Émile Zola'];
  const clusterIds = Object.keys(CLUSTERS).map(Number);
  const protocolIds = Object.keys(PROTOCOLS);

  // Coordonnées GPS réelles des villes [Longitude, Latitude]
  const cityCoordinates = {
    'Aix-en-Provence': [5.447427, 43.529742],
    'Marseille': [5.369780, 43.296482],
    'Toulon': [5.928000, 43.124228],
    'Nice': [7.265122, 43.710173],
    'Avignon': [4.808204, 43.949317]
  };

  return Array.from({ length: count }, (_, i) => {
    const clusterId = clusterIds[i % clusterIds.length];
    const protocolId = protocolIds[i % protocolIds.length];
    const city = cities[i % cities.length];
    
    return {
      id: `exp-${String(i + 1).padStart(3, '0')}`,
      title: `${PROTOCOLS[protocolId].name} - ${schools[i % schools.length]}`,
      city: city,
      school: `Lycée ${schools[i % schools.length]}`,
      cluster_id: clusterId,
      // On dénormalise les infos utiles pour éviter les jointures plus tard
      cluster_name: CLUSTERS[clusterId].label, 
      protocol_id: protocolId,
      protocol_name: PROTOCOLS[protocolId].name,
      location: {
        type: 'Point', // Format GeoJSON standard pour MongoDB
        coordinates: cityCoordinates[city] // [Longitude, Latitude]
      },
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      description: `Expérience "${PROTOCOLS[protocolId].name}" menée dans l'établissement.`,
      created_at: new Date(),
      updated_at: new Date()
    };
  });
}

function generateSensors(experiments) {
  const sensors = [];
  const sensorTypeKeys = Object.keys(SENSOR_TYPES);

  experiments.forEach((exp, expIndex) => {
    const sensorCount = 2 + Math.floor(Math.random() * 3); // 2 à 4 capteurs par expérience
    
    for (let i = 0; i < sensorCount; i++) {
      const typeKey = sensorTypeKeys[(expIndex + i) % sensorTypeKeys.length];
      sensors.push({
        id: `sensor-${exp.id}-${i + 1}`,
        name: `Capteur ${SENSOR_TYPES[typeKey].name} - ${exp.school}`,
        sensor_type_id: typeKey,
        experiment_id: exp.id,
        status: ['online', 'online', 'online', 'maintenance'][Math.floor(Math.random() * 4)],
        location: {
          building: `Bâtiment ${String.fromCharCode(65 + (i % 3))}`,
          room: `Salle ${100 + i * 10}`,
          indoor: true
        },
        // Métadonnées techniques (statiques)
        metadata: {
          manufacturer: 'Sensirion',
          model: `Model-${typeKey.toUpperCase()}`,
        },
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  return sensors;
}

function generateMeasurements(sensors, daysBack = 7) {
  const measurements = [];
  const now = Date.now();

  sensors.forEach(sensor => {
    // Une mesure par heure sur X jours
    for (let d = 0; d < daysBack * 24; d++) {
      const timestamp = new Date(now - d * 60 * 60 * 1000);
      let value = Math.random() * 100; // Valeur bidon simplifiée
      
      measurements.push({
        sensor_id: sensor.id,
        sensor_type_id: sensor.sensor_type_id,
        experiment_id: sensor.experiment_id, // Dénormalisation pour faciliter les requêtes par expérience
        timestamp,
        value: Math.round(value * 100) / 100,
        quality: { score: 1, status: 'good' }
      });
    }
  });
  return measurements;
}

// --- Exécution du Seed ---

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('📦 Connexion à MongoDB...');
    const db = client.db(dbName);

    // 1. Nettoyage
    console.log('🧹 Nettoyage des collections...');
    await db.collection('experiments').deleteMany({});
    await db.collection('sensor_devices').deleteMany({});
    await db.collection('sensor_types').deleteMany({});
    await db.collection('measurements').deleteMany({});

    // 2. Génération des données en mémoire
    const experiments = generateExperiments(5);
    const sensors = generateSensors(experiments);
    const measurements = generateMeasurements(sensors, 7); // 7 jours d'historique
    
    // Préparation des types de capteurs (données statiques)
    const sensorTypesData = Object.entries(SENSOR_TYPES).map(([id, data]) => ({
      id,
      ...data
    }));

    // 3. Insertion dans MongoDB (C'est là que l'on crée les collections !)
    await db.collection('sensor_types').insertMany(sensorTypesData);
    console.log(`✅ ${sensorTypesData.length} types de capteurs insérés`);

    await db.collection('experiments').insertMany(experiments);
    console.log(`✅ ${experiments.length} expériences insérées`);

    await db.collection('sensor_devices').insertMany(sensors);
    console.log(`✅ ${sensors.length} capteurs insérés`);

    await db.collection('measurements').insertMany(measurements);
    console.log(`✅ ${measurements.length} mesures insérées`);

    console.log('\n Base de données initialisée avec succès !');

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

seed();