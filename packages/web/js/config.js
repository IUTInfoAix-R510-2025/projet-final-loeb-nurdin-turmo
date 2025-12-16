// Configuration centralisée de l'application web

// URL de l'API
export const API_BASE_URL = 'http://localhost:3000/api';

// Endpoints de l'API
export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  config: `${API_BASE_URL}/config`,
  experiments: `${API_BASE_URL}/experiments`,
  sensors: `${API_BASE_URL}/sensors`,
  measurements: `${API_BASE_URL}/sensors/measurements`
};

// Clusters thématiques SteamCity
export const CLUSTERS = {
  1: { id: 1, label: 'Governance and citizenship', color: 'blue', icon: '' },
  2: { id: 2, label: 'Environmental quality', color: 'green', icon: '' },
  3: { id: 3, label: 'Mobility', color: 'red', icon: '' },
  4: { id: 4, label: 'Energy savings', color: 'yellow', icon: '' },
  5: { id: 5, label: 'AI and technologies', color: 'purple', icon: '' }
};

// Protocoles expérimentaux SteamCity
export const PROTOCOLS = {
  'city-detective': { name: 'City Detective Challenge', category: 'Data Analysis' },
  'data-storytelling': { name: 'Data Storytelling', category: 'Data Analysis' },
  'open-data-explorer': { name: 'Open Data Explorer', category: 'Data Analysis' },
  'sound-mapping': { name: 'Sound Mapping', category: 'Sound' },
  'noise-pollution': { name: 'Noise Pollution Investigation', category: 'Sound' },
  'soundscape-ecology': { name: 'Soundscape Ecology', category: 'Sound' },
  'air-quality-monitoring': { name: 'Air Quality Monitoring', category: 'Air Quality' },
  'pollution-sources': { name: 'Pollution Sources Investigation', category: 'Air Quality' },
  'energy-audit': { name: 'Energy Audit', category: 'Energy' },
  'renewable-energy': { name: 'Renewable Energy Assessment', category: 'Energy' },
  'energy-consumption': { name: 'Energy Consumption Patterns', category: 'Energy' },
  'light-pollution': { name: 'Light Pollution Study', category: 'Light' },
  'natural-lighting': { name: 'Natural Lighting Optimization', category: 'Light' },
  'urban-biodiversity': { name: 'Urban Biodiversity Survey', category: 'Biodiversity' },
  'pollinator-watch': { name: 'Pollinator Watch', category: 'Biodiversity' },
  'mobility-patterns': { name: 'Mobility Patterns Analysis', category: 'Mobility' },
  'active-transport': { name: 'Active Transport Promotion', category: 'Mobility' },
  'iot-basics': { name: 'IoT Basics', category: 'IoT' },
  'urban-heat-island': { name: 'Urban Heat Island Effect', category: 'Temperature' },
  'ai-image-recognition': { name: 'AI Image Recognition', category: 'AI' },
  'ml-prediction': { name: 'Machine Learning Prediction', category: 'AI' },
  'chatbot-development': { name: 'Chatbot Development', category: 'AI' },
  'ai-data-analysis': { name: 'AI-Assisted Data Analysis', category: 'AI' },
  'computer-vision': { name: 'Computer Vision for Cities', category: 'AI' }
};

// Types de capteurs supportés
export const SENSOR_TYPES = {
  temperature: { name: 'Température', icon: '', unit: '°C', range: [-40, 85], precision: 0.1 },
  humidity: { name: 'Humidité', icon: '', unit: '%', range: [0, 100], precision: 0.5 },
  co2: { name: 'CO2', icon: '', unit: 'ppm', range: [0, 10000], precision: 1 },
  noise: { name: 'Niveau sonore', icon: '', unit: 'dB', range: [0, 140], precision: 0.1 },
  pm25: { name: 'PM2.5', icon: '', unit: 'μg/m³', range: [0, 500], precision: 0.1 },
  pm10: { name: 'PM10', icon: '', unit: 'μg/m³', range: [0, 1000], precision: 0.1 },
  light: { name: 'Luminosité', icon: '', unit: 'lux', range: [0, 100000], precision: 1 },
  pressure: { name: 'Pression', icon: '', unit: 'hPa', range: [800, 1200], precision: 0.1 },
  motion: { name: 'Mouvement', icon: '', unit: 'bool', type: 'boolean' },
  door: { name: 'Ouverture', icon: '', unit: 'bool', type: 'boolean' }
};

// Statuts des capteurs
export const SENSOR_STATUS = {
  online: { label: 'En ligne', color: '#27ae60' },
  offline: { label: 'Hors ligne', color: '#e74c3c' },
  maintenance: { label: 'Maintenance', color: '#f39c12' }
};

// Configuration de la carte (Leaflet)
export const MAP_CONFIG = {
  defaultCenter: [46.2044, 6.1432], // Genève
  defaultZoom: 13,
  minZoom: 3,
  maxZoom: 18,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Configuration générale de l'application
export const APP_CONFIG = {
  appName: 'Projet IoT - SteamCity',
  refreshInterval: 30000, // 30 secondes pour le rafraîchissement automatique des données
  chartColors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
  maxDataPoints: 100 // Nombre maximum de points sur les graphiques
};
