import { API_ENDPOINTS, SENSOR_TYPES } from './config.js';

let allExperiments = [];
let allSensors = [];
let selectedExperiment = null;
let selectedSensors = [];
let currentChart = null;
let currentPeriod = '24h';
let currentMeasurements = [];

/**
 * Initialise le module Données/Analyse
 */
export function init() {
    // Boutons d'action
    document.getElementById('refresh-data')?.addEventListener('click', loadExperiments);
    document.getElementById('compare-btn')?.addEventListener('click', compareData);
    document.getElementById('export-csv-btn')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-json-btn')?.addEventListener('click', () => exportData('json'));
    
    // Sélecteur d'expérience
    document.getElementById('experiment-select')?.addEventListener('change', onExperimentChange);
    
    // Boutons de période
    document.querySelectorAll('.data-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.data-period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPeriod = e.target.dataset.period;
            if (selectedSensors.length > 0) {
                compareData();
            }
        });
    });
    
    // Charger les données initiales
    loadExperiments();
}

/**
 * Charge la liste des expériences
 */
async function loadExperiments() {
    try {
        const response = await fetch(API_ENDPOINTS.experiments);
        const result = await response.json();
        
        if (result.success) {
            allExperiments = result.data || [];
            renderExperimentSelect();
        }
    } catch (error) {
        console.error('❌ Erreur chargement expériences:', error);
        showError('Impossible de charger les expériences');
    }
}

/**
 * Affiche le sélecteur d'expériences
 */
function renderExperimentSelect() {
    const select = document.getElementById('experiment-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Sélectionner une expérience --</option>';
    allExperiments.forEach(exp => {
        const option = document.createElement('option');
        option.value = exp.id;
        option.textContent = `${exp.school} - ${exp.cluster_name || exp.cluster_id}`;
        select.appendChild(option);
    });
}

/**
 * Gère le changement d'expérience
 */
async function onExperimentChange(e) {
    const experimentId = e.target.value;
    selectedExperiment = experimentId;
    selectedSensors = [];
    
    if (!experimentId) {
        document.getElementById('sensors-selection').innerHTML = '';
        clearComparison();
        return;
    }
    
    await loadSensorsForExperiment(experimentId);
}

/**
 * Charge les capteurs d'une expérience
 */
async function loadSensorsForExperiment(experimentId) {
    try {
        const response = await fetch(`${API_ENDPOINTS.experiments}/${experimentId}/sensors`);
        const result = await response.json();
        
        if (result.success) {
            allSensors = result.data || [];
            renderSensorsSelection();
        }
    } catch (error) {
        console.error('❌ Erreur chargement capteurs:', error);
        showError('Impossible de charger les capteurs');
    }
}

/**
 * Affiche les capteurs disponibles pour sélection
 */
function renderSensorsSelection() {
    const container = document.getElementById('sensors-selection');
    if (!container) return;
    
    if (allSensors.length === 0) {
        container.innerHTML = '<div class="no-data">Aucun capteur disponible pour cette expérience</div>';
        return;
    }
    
    container.innerHTML = `
        <h4>Sélectionner les capteurs à comparer :</h4>
        <div class="sensors-checkboxes">
            ${allSensors.map(sensor => {
                const typeInfo = SENSOR_TYPES[sensor.sensor_type_id] || { name: sensor.sensor_type_id, icon: '📊' };
                return `
                    <div class="sensor-checkbox-item">
                        <input type="checkbox" 
                               id="sensor-${sensor.id}" 
                               value="${sensor.id}"
                               data-type="${sensor.sensor_type_id}">
                        <label for="sensor-${sensor.id}">
                            ${typeInfo.icon} ${sensor.name || sensor.id}
                        </label>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Ajouter les event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', onSensorSelectionChange);
    });
}

/**
 * Gère le changement de sélection des capteurs
 */
function onSensorSelectionChange(e) {
    const sensorId = e.target.value;
    
    if (e.target.checked) {
        if (!selectedSensors.includes(sensorId)) {
            selectedSensors.push(sensorId);
        }
    } else {
        selectedSensors = selectedSensors.filter(id => id !== sensorId);
    }
    
    // Activer/désactiver le bouton de comparaison
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        compareBtn.disabled = selectedSensors.length === 0;
    }
}

/**
 * Compare les données des capteurs sélectionnés
 */
async function compareData() {
    if (selectedSensors.length === 0) {
        showError('Veuillez sélectionner au moins un capteur');
        return;
    }
    
    const container = document.getElementById('comparison-results');
    container.innerHTML = '<div class="loading-message">⏳ Chargement des données...</div>';
    
    try {
        // Calculer les dates selon la période
        const dates = getPeriodDates(currentPeriod);
        
        // Charger les données pour chaque capteur
        const datasets = [];
        const allMeasurements = [];
        
        console.log('📊 Chargement des mesures pour', selectedSensors.length, 'capteur(s)', dates);
        
        for (const sensorId of selectedSensors) {
            const sensor = allSensors.find(s => s.id === sensorId);
            const typeInfo = SENSOR_TYPES[sensor?.sensor_type_id] || { name: 'Inconnu', unit: '' };
            
            const response = await fetch(
                `${API_ENDPOINTS.measurements}?sensor_id=${sensorId}&start_date=${dates.start}&end_date=${dates.end}&limit=500`
            );
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                const measurements = result.data.sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                
                allMeasurements.push({
                    sensorId,
                    sensor,
                    measurements,
                    typeInfo
                });
                
                // Préparer le dataset pour Chart.js
                const color = getColorForIndex(datasets.length);
                datasets.push({
                    label: `${typeInfo.icon} ${sensor.name || sensorId}`,
                    data: measurements.map(m => ({
                        x: new Date(m.timestamp),
                        y: m.value
                    })),
                    borderColor: color,
                    backgroundColor: color + '20',
                    tension: 0.4,
                    fill: false
                });
            }
        }
        
        if (datasets.length === 0) {
            container.innerHTML = '<div class="no-data">Aucune donnée disponible pour la période sélectionnée</div>';
            return;
        }
        
        console.log('✅ Données chargées:', datasets.length, 'séries');
        
        // Sauvegarder pour l'export
        currentMeasurements = allMeasurements;
        
        // Créer la structure HTML pour le graphique
        container.innerHTML = `
            <div class="chart-container comparison-chart">
                <h3>📈 Graphique comparatif</h3>
                <canvas id="comparison-chart"></canvas>
            </div>
        `;
        
        // Afficher le graphique
        renderComparisonChart(datasets);
        
        // Afficher les statistiques
        renderStatistics(allMeasurements);
        
        // Activer les boutons d'export
        document.getElementById('export-csv-btn').disabled = false;
        document.getElementById('export-json-btn').disabled = false;
        
    } catch (error) {
        console.error('❌ Erreur comparaison:', error);
        container.innerHTML = `<div class="no-data error">❌ Erreur: ${error.message}</div>`;
    }
}

/**
 * Affiche le graphique comparatif
 */
function renderComparisonChart(datasets) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas) return;
    
    // Détruire l'ancien graphique
    if (currentChart) {
        currentChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'DD/MM',
                            week: 'DD/MM',
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date et heure'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valeur'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Affiche les statistiques des données
 */
function renderStatistics(allMeasurements) {
    const container = document.getElementById('statistics-summary');
    if (!container) return;
    
    container.innerHTML = `
        <h3>📊 Statistiques</h3>
        <div class="stats-grid">
            ${allMeasurements.map(({ sensor, measurements, typeInfo }) => {
                const values = measurements.map(m => m.value);
                const stats = calculateStatistics(values);
                
                return `
                    <div class="stat-card">
                        <h4>${typeInfo.icon} ${sensor.name || sensor.id}</h4>
                        <div class="stat-rows">
                            <div class="stat-row">
                                <span class="stat-label">Mesures:</span>
                                <span class="stat-value">${stats.count}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Moyenne:</span>
                                <span class="stat-value">${stats.avg.toFixed(2)} ${typeInfo.unit}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Minimum:</span>
                                <span class="stat-value">${stats.min.toFixed(2)} ${typeInfo.unit}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Maximum:</span>
                                <span class="stat-value">${stats.max.toFixed(2)} ${typeInfo.unit}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Écart-type:</span>
                                <span class="stat-value">${stats.stdDev.toFixed(2)} ${typeInfo.unit}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Calcule les statistiques (moyenne, min, max, écart-type)
 */
function calculateStatistics(values) {
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Écart-type
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return { count, avg, min, max, stdDev };
}

/**
 * Exporte les données au format CSV ou JSON
 */
async function exportData(format) {
    if (currentMeasurements.length === 0) {
        showError('Aucune donnée à exporter');
        return;
    }
    
    try {
        const exportData = [];
        
        // Collecter toutes les données
        currentMeasurements.forEach(({ sensorId, sensor, measurements, typeInfo }) => {
            measurements.forEach(m => {
                exportData.push({
                    sensor_id: sensorId,
                    sensor_name: sensor.name,
                    sensor_type: typeInfo.name,
                    timestamp: m.timestamp,
                    value: m.value,
                    unit: typeInfo.unit
                });
            });
        });
        
        if (format === 'csv') {
            downloadCSV(exportData);
        } else {
            downloadJSON(exportData);
        }
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        showError('Erreur lors de l\'export des données');
    }
}

/**
 * Télécharge les données en CSV
 */
function downloadCSV(data) {
    // Créer l'en-tête
    const headers = ['sensor_id', 'sensor_name', 'sensor_type', 'timestamp', 'value', 'unit'];
    let csv = headers.join(',') + '\n';
    
    // Ajouter les lignes
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${value}"`;
        });
        csv += values.join(',') + '\n';
    });
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_donnees_${Date.now()}.csv`;
    link.click();
}

/**
 * Télécharge les données en JSON
 */
function downloadJSON(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_donnees_${Date.now()}.json`;
    link.click();
}

/**
 * Retourne les dates de début et fin selon la période
 */
function getPeriodDates(period) {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
        case '24h':
            start.setHours(start.getHours() - 24);
            break;
        case '7d':
            start.setDate(start.getDate() - 7);
            break;
        case '30d':
            start.setDate(start.getDate() - 30);
            break;
        case '90d':
            start.setDate(start.getDate() - 90);
            break;
        default:
            start.setHours(start.getHours() - 24);
    }
    
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

/**
 * Retourne une couleur selon l'index
 */
function getColorForIndex(index) {
    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
    ];
    return colors[index % colors.length];
}

/**
 * Efface la comparaison
 */
function clearComparison() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    document.getElementById('comparison-results').innerHTML = '';
    document.getElementById('statistics-summary').innerHTML = '';
    document.getElementById('export-csv-btn').disabled = true;
    document.getElementById('export-json-btn').disabled = true;
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
    const container = document.getElementById('comparison-results');
    if (container) {
        container.innerHTML = `<div class="no-data error">❌ ${message}</div>`;
    }
}

/**
 * Rafraîchit la vue
 */
export async function refresh() {
    clearComparison();
    selectedSensors = [];
    await loadExperiments();
}
