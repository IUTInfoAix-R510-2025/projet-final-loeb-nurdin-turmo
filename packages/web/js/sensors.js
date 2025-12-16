import { API_ENDPOINTS, SENSOR_TYPES } from './config.js';

let allSensors = [];
let currentFilters = {
    type: 'all',
    status: 'all',
    experiment: 'all'
};
let currentChart = null;
let currentSensorId = null;

/**
 * Initialise le module Capteurs
 */
export function init() {
    document.getElementById('refresh-sensors')?.addEventListener('click', refresh);
    document.getElementById('close-sensor-details')?.addEventListener('click', closeSensorDetails);
    
    // Filtres
    initFilters();
    
    // Boutons de période pour le graphique
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = e.target.dataset.period;
            if (currentSensorId) {
                loadMeasurements(currentSensorId, period);
            }
        });
    });
}

/**
 * Initialise les filtres
 */
function initFilters() {
    // Filtre par type
    document.getElementById('filter-type')?.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        applyFilters();
    });
    
    // Filtre par statut
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
    });
    
    // Recherche par expérience
    document.getElementById('filter-experiment')?.addEventListener('input', (e) => {
        currentFilters.experiment = e.target.value.toLowerCase();
        applyFilters();
    });
}

/**
 * Rafraîchit la liste des capteurs
 */
export async function refresh() {
    const container = document.getElementById('sensors-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">⏳ Chargement des capteurs...</div>';

    try {
        const response = await fetch(API_ENDPOINTS.sensors);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur API');
        }
        
        allSensors = result.data || [];
        console.log(`📊 ${allSensors.length} capteur(s) chargé(s)`);
        
        applyFilters();
        updateStats(allSensors);
    } catch (error) {
        console.error('❌ Erreur chargement capteurs:', error);
        container.innerHTML = `
            <div class="no-data error">
                ❌ Erreur de chargement: ${error.message}<br>
                Assurez-vous que l'API est démarrée.
            </div>
        `;
    }
}

/**
 * Applique les filtres à la liste des capteurs
 */
function applyFilters() {
    let filtered = [...allSensors];
    
    // Filtre par type
    if (currentFilters.type !== 'all') {
        filtered = filtered.filter(s => s.sensor_type_id === currentFilters.type);
    }
    
    // Filtre par statut
    if (currentFilters.status !== 'all') {
        // Mapper les statuts : online/offline -> active/inactive
        const statusMap = {
            'active': 'online',
            'inactive': 'offline',
            'maintenance': 'maintenance'
        };
        const targetStatus = statusMap[currentFilters.status] || currentFilters.status;
        filtered = filtered.filter(s => s.status === targetStatus);
    }
    
    // Filtre par expérience
    if (currentFilters.experiment !== 'all' && currentFilters.experiment !== '') {
        filtered = filtered.filter(s => 
            s.experiment_id?.toLowerCase().includes(currentFilters.experiment)
        );
    }
    
    renderSensors(filtered);
}

/**
 * Affiche la liste des capteurs
 */
function renderSensors(sensors) {
    const container = document.getElementById('sensors-list');
    
    if (sensors.length === 0) {
        container.innerHTML = '<div class="no-data">📡 Aucun capteur trouvé avec ces filtres.</div>';
        return;
    }
    
    container.innerHTML = sensors.map(sensor => {
        const statusColor = getStatusColor(sensor.status);
        const statusIcon = getStatusIcon(sensor.status);
        const typeInfo = SENSOR_TYPES[sensor.sensor_type_id] || { label: sensor.sensor_type_id, unit: '', icon: '📊' };
        
        // Formater la localisation
        let locationText = 'Non défini';
        if (sensor.location) {
            if (typeof sensor.location === 'object') {
                locationText = `${sensor.location.building || ''} ${sensor.location.room || ''}`.trim() || 'Non défini';
            } else {
                locationText = sensor.location;
            }
        }
        
        return `
            <div class="sensor-card" onclick="window.showSensorDetails('${sensor.id || sensor._id}')">
                <div class="sensor-card-header">
                    <div class="sensor-type">
                        <span class="sensor-icon">${typeInfo.icon || '📊'}</span>
                        <div>
                            <h4>${typeInfo.label || sensor.sensor_type_id}</h4>
                            <small>${sensor.id || sensor._id}</small>
                        </div>
                    </div>
                    <div class="sensor-status-indicator">
                        <span class="status-dot" style="background: ${statusColor};" title="${sensor.status}">
                            ${statusIcon}
                        </span>
                    </div>
                </div>
                <div class="sensor-card-body">
                    <div class="sensor-info-row">
                        <span>📍 ${locationText}</span>
                    </div>
                    <div class="sensor-info-row">
                        <span>🔬 ${sensor.experiment_id || 'Aucune expérience'}</span>
                    </div>
                    <div class="sensor-info-row">
                        <span>📛 ${sensor.name || 'Sans nom'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Rendre la fonction globale pour les cards
    window.showSensorDetails = (sensorId) => {
        const sensor = allSensors.find(s => s.id === sensorId || s._id === sensorId);
        if (sensor) {
            showSensorDetails(sensor);
        }
    };
}

/**
 * Met à jour les statistiques
 */
function updateStats(sensors) {
    document.getElementById('total-sensors').textContent = sensors.length;
    const active = sensors.filter(s => s.status === 'online').length;
    const inactive = sensors.filter(s => s.status === 'offline' || s.status === 'maintenance').length;
    document.getElementById('active-sensors').textContent = active;
    document.getElementById('inactive-sensors').textContent = inactive;
}

/**
 * Retourne la couleur selon le statut
 */
function getStatusColor(status) {
    const colors = {
        'online': '#27ae60',
        'active': '#27ae60',
        'offline': '#e74c3c',
        'inactive': '#95a5a6',
        'maintenance': '#f39c12'
    };
    return colors[status] || '#95a5a6';
}

/**
 * Retourne l'icône selon le statut
 */
function getStatusIcon(status) {
    const icons = {
        'online': '●',
        'active': '●',
        'offline': '✕',
        'inactive': '○',
        'maintenance': '⚠'
    };
    return icons[status] || '?';
}

/**
 * Affiche les détails d'un capteur
 */
async function showSensorDetails(sensor) {
    currentSensorId = sensor.id || sensor._id;
    const detailsPanel = document.getElementById('sensor-details');
    const title = document.getElementById('sensor-detail-title');
    const content = document.getElementById('sensor-detail-content');
    
    // Afficher le panneau
    detailsPanel.classList.remove('hidden');
    
    const typeInfo = SENSOR_TYPES[sensor.sensor_type_id] || { label: sensor.sensor_type_id, unit: '', icon: '📊' };
    const statusColor = getStatusColor(sensor.status);
    
    // Formater la localisation
    let locationText = 'Non définie';
    if (sensor.location) {
        if (typeof sensor.location === 'object') {
            locationText = `${sensor.location.building || ''} ${sensor.location.room || ''}`.trim() || 'Non définie';
        } else {
            locationText = sensor.location;
        }
    }
    
    // Mettre à jour le titre
    title.textContent = `${typeInfo.icon} ${typeInfo.label} - ${sensor.id || sensor._id}`;
    
    // Afficher les informations
    content.innerHTML = `
        <div class="sensor-detail-info">
            <div class="info-row">
                <strong>Statut:</strong>
                <span class="status-badge" style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px;">
                    ${sensor.status}
                </span>
            </div>
            <div class="info-row">
                <strong>Nom:</strong> ${sensor.name || 'Sans nom'}
            </div>
            <div class="info-row">
                <strong>Type:</strong> ${typeInfo.label}
            </div>
            <div class="info-row">
                <strong>Expérience:</strong> ${sensor.experiment_id || 'Aucune'}
            </div>
            <div class="info-row">
                <strong>Localisation:</strong> ${locationText}
            </div>
            <div class="info-row">
                <strong>Unité de mesure:</strong> ${typeInfo.unit}
            </div>
            ${sensor.metadata ? `
            <div class="info-row">
                <strong>Fabricant:</strong> ${sensor.metadata.manufacturer || 'N/A'}
            </div>
            <div class="info-row">
                <strong>Modèle:</strong> ${sensor.metadata.model || 'N/A'}
            </div>
            ` : ''}lass="info-row">
                <strong>Unité de mesure:</strong> ${typeInfo.unit}
            </div>
        </div>
        
        <div class="measurements-section">
            <div class="measurements-header">
                <h4>📈 Historique des mesures</h4>
                <div class="period-selector">
                    <button class="period-btn active" data-period="24h">24h</button>
                    <button class="period-btn" data-period="7d">7 jours</button>
                    <button class="period-btn" data-period="30d">30 jours</button>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="measurements-chart"></canvas>
            </div>
            <div id="measurements-stats" class="measurements-stats">
                <!-- Stats chargées dynamiquement -->
            </div>
        </div>
    `;
    
    // Réinitialiser les event listeners des boutons de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = e.target.dataset.period;
            loadMeasurements(currentSensorId, period);
        });
    });
    
    // Charger les mesures par défaut (24h)
    loadMeasurements(currentSensorId, '24h');
}

/**
 * Charge les mesures d'un capteur
 */
async function loadMeasurements(sensorId, period = '24h') {
    try {
        // Calculer les dates
        const endDate = new Date();
        const startDate = new Date();
        
        switch(period) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
        }
        
        const url = `${API_ENDPOINTS.sensors}/${sensorId}/measurements?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&limit=1000`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Erreur chargement mesures');
        
        const result = await response.json();
        
        if (result.success && result.data) {
            renderChart(result.data, period);
            renderStats(result.data);
        }
    } catch (error) {
        console.error('Erreur chargement mesures:', error);
        document.getElementById('measurements-chart').parentElement.innerHTML = 
            '<p class="error">Erreur de chargement des mesures</p>';
    }
}

/**
 * Affiche le graphique des mesures
 */
function renderChart(measurements, period) {
    const ctx = document.getElementById('measurements-chart');
    if (!ctx) return;
    
    // Détruire le graphique existant
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Trier par date
    const sorted = measurements.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Préparer les données
    const labels = sorted.map(m => {
        const date = new Date(m.timestamp);
        if (period === '24h') {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        }
    });
    
    const values = sorted.map(m => m.value);
    
    // Créer le graphique
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mesures',
                data: values,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temps'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valeur'
                    }
                }
            }
        }
    });
}

/**
 * Affiche les statistiques des mesures
 */
function renderStats(measurements) {
    const statsContainer = document.getElementById('measurements-stats');
    if (!statsContainer || measurements.length === 0) return;
    
    const values = measurements.map(m => m.value);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    const max = Math.max(...values).toFixed(2);
    
    statsContainer.innerHTML = `
        <div class="stat-box">
            <div class="stat-value">${measurements.length}</div>
            <div class="stat-label">Mesures</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${avg}</div>
            <div class="stat-label">Moyenne</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${min}</div>
            <div class="stat-label">Minimum</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${max}</div>
            <div class="stat-label">Maximum</div>
        </div>
    `;
}

/**
 * Ferme le panneau de détails
 */
function closeSensorDetails() {
    document.getElementById('sensor-details')?.classList.add('hidden');
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    currentSensorId = null;
}
