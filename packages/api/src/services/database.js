const { MongoClient } = require('mongodb');

let db = null;

async function connectDB() {
  // TODO: Implémenter la connexion à MongoDB Atlas
  // Utilisez les variables d'environnement pour les credentials
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = { connectDB, getDB };