// Module API - Fonctions d'appel à l'API REST
import { API_BASE_URL, API_ENDPOINTS } from './config.js';

/**
 * Classe de gestion des erreurs API
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Fonction utilitaire pour gérer les requêtes HTTP
 * @param {string} url - URL de la requête
 * @param {Object} options - Options de la requête (method, body, headers)
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function fetchAPI(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const config = { ...defaultOptions, ...options };

  // Ajouter le body si présent
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Récupérer les données
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Vérifier le statut de la réponse
    if (!response.ok) {
      throw new APIError(
        data.error || `Erreur HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Erreur de connexion à l'API: ${error.message}`,
      0,
      null
    );
  }
}

/**
 * Construction d'URL avec paramètres de requête
 * @param {string} baseUrl - URL de base
 * @param {Object} params - Paramètres de requête
 * @returns {string} - URL complète
 */
function buildURL(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
}

// ==================== API HEALTH & CONFIG ====================

/**
 * Vérifier l'état de santé de l'API
 * @returns {Promise<Object>} - Statut de l'API
 */
export async function checkHealth() {
  return await fetchAPI(API_ENDPOINTS.health);
}

/**
 * Récupérer la configuration partagée (CLUSTERS, PROTOCOLS, etc.)
 * @returns {Promise<Object>} - Configuration
 */
export async function getConfig() {
  return await fetchAPI(API_ENDPOINTS.config);
}

// ==================== API EXPERIMENTS ====================

/**
 * Récupérer toutes les expériences
 * @returns {Promise<Object>} - Liste des expériences
 */
export async function getAllExperiments() {
  return await fetchAPI(API_ENDPOINTS.experiments);
}

/**
 * Récupérer une expérience par ID
 * @param {string} id - ID de l'expérience
 * @returns {Promise<Object>} - Détails de l'expérience
 */
export async function getExperimentById(id) {
  const url = `${API_ENDPOINTS.experiments}/${id}`;
  return await fetchAPI(url);
}

/**
 * Récupérer les capteurs associés à une expérience
 * @param {string} experimentId - ID de l'expérience
 * @returns {Promise<Object>} - Liste des capteurs
 */
export async function getExperimentSensors(experimentId) {
  const url = `${API_ENDPOINTS.experiments}/${experimentId}/sensors`;
  return await fetchAPI(url);
}

/**
 * Créer une nouvelle expérience
 * @param {Object} experimentData - Données de l'expérience
 * @returns {Promise<Object>} - Expérience créée
 */
export async function createExperiment(experimentData) {
  return await fetchAPI(API_ENDPOINTS.experiments, {
    method: 'POST',
    body: experimentData
  });
}

/**
 * Mettre à jour une expérience
 * @param {string} id - ID de l'expérience
 * @param {Object} experimentData - Données à mettre à jour
 * @returns {Promise<Object>} - Expérience mise à jour
 */
export async function updateExperiment(id, experimentData) {
  const url = `${API_ENDPOINTS.experiments}/${id}`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: experimentData
  });
}

/**
 * Supprimer une expérience
 * @param {string} id - ID de l'expérience
 * @returns {Promise<Object>} - Résultat de la suppression
 */
export async function deleteExperiment(id) {
  const url = `${API_ENDPOINTS.experiments}/${id}`;
  return await fetchAPI(url, {
    method: 'DELETE'
  });
}

// ==================== API SENSORS ====================

/**
 * Récupérer tous les capteurs avec filtres optionnels
 * @param {Object} filters - Filtres { experiment_id, type, status }
 * @returns {Promise<Object>} - Liste des capteurs
 */
export async function getAllSensors(filters = {}) {
  const url = buildURL(API_ENDPOINTS.sensors, filters);
  return await fetchAPI(url);
}

/**
 * Récupérer un capteur par ID
 * @param {string} id - ID du capteur
 * @returns {Promise<Object>} - Détails du capteur
 */
export async function getSensorById(id) {
  const url = `${API_ENDPOINTS.sensors}/${id}`;
  return await fetchAPI(url);
}

/**
 * Récupérer les mesures d'un capteur
 * @param {string} sensorId - ID du capteur
 * @param {Object} params - Paramètres { limit, start_date, end_date }
 * @returns {Promise<Object>} - Liste des mesures
 */
export async function getSensorMeasurements(sensorId, params = {}) {
  const url = buildURL(`${API_ENDPOINTS.sensors}/${sensorId}/measurements`, params);
  return await fetchAPI(url);
}

/**
 * Créer un nouveau capteur
 * @param {Object} sensorData - Données du capteur
 * @returns {Promise<Object>} - Capteur créé
 */
export async function createSensor(sensorData) {
  return await fetchAPI(API_ENDPOINTS.sensors, {
    method: 'POST',
    body: sensorData
  });
}

/**
 * Mettre à jour un capteur
 * @param {string} id - ID du capteur
 * @param {Object} sensorData - Données à mettre à jour
 * @returns {Promise<Object>} - Capteur mis à jour
 */
export async function updateSensor(id, sensorData) {
  const url = `${API_ENDPOINTS.sensors}/${id}`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: sensorData
  });
}

/**
 * Supprimer un capteur
 * @param {string} id - ID du capteur
 * @returns {Promise<Object>} - Résultat de la suppression
 */
export async function deleteSensor(id) {
  const url = `${API_ENDPOINTS.sensors}/${id}`;
  return await fetchAPI(url, {
    method: 'DELETE'
  });
}

// ==================== API MEASUREMENTS ====================

/**
 * Récupérer toutes les mesures avec filtres optionnels
 * @param {Object} filters - Filtres { sensor_id, limit, start_date, end_date }
 * @returns {Promise<Object>} - Liste des mesures
 */
export async function getAllMeasurements(filters = {}) {
  const url = buildURL(API_ENDPOINTS.measurements, filters);
  return await fetchAPI(url);
}

/**
 * Récupérer les statistiques des mesures d'un capteur
 * @param {string} sensorId - ID du capteur
 * @returns {Promise<Object>} - Statistiques
 */
export async function getMeasurementStats(sensorId) {
  const url = buildURL(`${API_ENDPOINTS.measurements}/stats`, { sensor_id: sensorId });
  return await fetchAPI(url);
}

/**
 * Créer une nouvelle mesure
 * @param {Object} measurementData - Données de la mesure
 * @returns {Promise<Object>} - Mesure créée
 */
export async function createMeasurement(measurementData) {
  return await fetchAPI(API_ENDPOINTS.measurements, {
    method: 'POST',
    body: measurementData
  });
}

/**
 * Créer plusieurs mesures en batch
 * @param {Array<Object>} measurementsData - Tableau de mesures
 * @returns {Promise<Object>} - Résultat de la création
 */
export async function createMeasurementsBatch(measurementsData) {
  return await fetchAPI(`${API_ENDPOINTS.measurements}/batch`, {
    method: 'POST',
    body: measurementsData
  });
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Récupérer les mesures d'une expérience (tous ses capteurs)
 * @param {string} experimentId - ID de l'expérience
 * @param {Object} params - Paramètres de requête
 * @returns {Promise<Object>} - Mesures groupées par capteur
 */
export async function getExperimentMeasurements(experimentId, params = {}) {
  // 1. Récupérer les capteurs de l'expérience
  const sensorsResponse = await getExperimentSensors(experimentId);
  const sensors = sensorsResponse.data || [];
  
  // 2. Récupérer les mesures de chaque capteur
  const measurementsPromises = sensors.map(sensor => 
    getSensorMeasurements(sensor.id, params)
  );
  
  const measurementsResponses = await Promise.all(measurementsPromises);
  
  // 3. Regrouper les résultats
  const result = {};
  sensors.forEach((sensor, index) => {
    result[sensor.id] = {
      sensor: sensor,
      measurements: measurementsResponses[index].data || []
    };
  });
  
  return {
    success: true,
    experimentId: experimentId,
    sensors: sensors.length,
    data: result
  };
}

/**
 * Récupérer les statistiques globales de la plateforme
 * @returns {Promise<Object>} - Statistiques globales
 */
export async function getGlobalStats() {
  try {
    const [experimentsRes, sensorsRes] = await Promise.all([
      getAllExperiments(),
      getAllSensors()
    ]);
    
    const experiments = experimentsRes.data || [];
    const sensors = sensorsRes.data || [];
    
    // Calculer les statistiques
    const activeSensors = sensors.filter(s => s.status === 'active').length;
    const inactiveSensors = sensors.filter(s => s.status === 'inactive').length;
    const activeExperiments = experiments.filter(e => e.status === 'active').length;
    
    return {
      success: true,
      data: {
        totalExperiments: experiments.length,
        activeExperiments: activeExperiments,
        totalSensors: sensors.length,
        activeSensors: activeSensors,
        inactiveSensors: inactiveSensors
      }
    };
  } catch (error) {
    throw new APIError('Impossible de récupérer les statistiques globales', 0, error);
  }
}

/**
 * Rechercher des expériences par critères
 * @param {Object} criteria - Critères de recherche { title, location, cluster_id, protocol }
 * @returns {Promise<Object>} - Expériences filtrées
 */
export async function searchExperiments(criteria = {}) {
  const response = await getAllExperiments();
  let experiments = response.data || [];
  
  // Filtrer côté client (peut être optimisé avec des requêtes serveur)
  if (criteria.title) {
    const searchTerm = criteria.title.toLowerCase();
    experiments = experiments.filter(exp => 
      exp.title.toLowerCase().includes(searchTerm) ||
      (exp.description && exp.description.toLowerCase().includes(searchTerm))
    );
  }
  
  if (criteria.location) {
    const searchTerm = criteria.location.toLowerCase();
    experiments = experiments.filter(exp => 
      exp.location && exp.location.toLowerCase().includes(searchTerm)
    );
  }
  
  if (criteria.cluster_id) {
    experiments = experiments.filter(exp => 
      exp.cluster_id === parseInt(criteria.cluster_id)
    );
  }
  
  if (criteria.protocol) {
    experiments = experiments.filter(exp => 
      exp.protocol === criteria.protocol
    );
  }
  
  if (criteria.status) {
    experiments = experiments.filter(exp => 
      exp.status === criteria.status
    );
  }
  
  return {
    success: true,
    count: experiments.length,
    data: experiments
  };
}

/**
 * Exporter des données en CSV
 * @param {Array<Object>} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }
  
  // Récupérer les en-têtes
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  // Créer et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporter des données en JSON
 * @param {Object} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export function exportToJSON(data, filename = 'export.json') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exporter la classe d'erreur pour une utilisation externe
export { APIError };
