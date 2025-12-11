const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'iot_platform';

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    
    db = client.db(dbName);
    
    // Test de la connexion
    await db.command({ ping: 1 });
    console.log('✅ Connecté à MongoDB:', dbName);
    
    return db;
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('🔌 Connexion MongoDB fermée');
  }
}

module.exports = { connectDB, getDB, closeDB };