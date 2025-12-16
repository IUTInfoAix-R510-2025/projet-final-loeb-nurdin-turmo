import { API_ENDPOINTS, SENSOR_TYPES, CLUSTERS } from './config.js';

/**
 * Initialise le module Expériences
 */
export function init() {
    document.getElementById('refresh-experiments')?.addEventListener('click', refresh);
    document.getElementById('close-details')?.addEventListener('click', closeDetails);
    
    // Recherche
    document.querySelector('.btn-search')?.addEventListener('click', () => {
        applyFilters();
    });
    
    // Recherche en temps réel
    document.getElementById('search-experiments')?.addEventListener('input', (e) => {
        if (e.target.value.length > 2 || e.target.value.length === 0) {
            applyFilters();
        }
    });
    
    // Recherche avec Enter
    document.getElementById('search-experiments')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Filtres par cluster
    initClusterFilters();
}

let allExperiments = []; // Stocke toutes les expériences pour le filtrage
let currentFilters = {
    cluster: 'all',
    search: ''
};

/**
 * Initialise les filtres par cluster
 */
function initClusterFilters() {
    const clusterButtons = document.querySelectorAll('.cluster-filter');
    clusterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Retirer la classe active de tous les boutons
            clusterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            e.currentTarget.classList.add('active');
            
            // Mettre à jour le filtre et appliquer
            currentFilters.cluster = e.currentTarget.dataset.cluster;
            applyFilters();
        });
    });
}

/**
 * Rafraîchit la liste des expériences
 */
export async function refresh() {
    const container = document.getElementById('experiments-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">⏳ Chargement des expériences...</div>';

    try {
        console.log('🔍 Chargement des expériences depuis:', API_ENDPOINTS.experiments);
        const response = await fetch(API_ENDPOINTS.experiments);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Données reçues:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur API inconnue');
        }
        
        allExperiments = result.data || [];
        console.log(`📊 ${allExperiments.length} expérience(s) chargée(s)`);
        
        if (allExperiments.length === 0) {
            container.innerHTML = `
                <div class="no-data error">
                    ⚠️ Aucune expérience trouvée dans la base de données.<br><br>
                    Veuillez exécuter le script seed :<br>
                    <code>npm run seed</code>
                </div>
            `;
            return;
        }
        
        applyFilters(); // Appliquer les filtres actuels
    } catch (error) {
        console.error('❌ Erreur chargement expériences:', error);
        container.innerHTML = `
            <div class="no-data error">
                ❌ Erreur de connexion à l'API<br>
                <strong>${error.message}</strong><br><br>
                Assurez-vous que l'API est démarrée :<br>
                <code>npm run dev:api</code><br><br>
                Et que le fichier .env est configuré correctement.
            </div>
        `;
    }
}

/**
 * Applique tous les filtres (recherche + cluster)
 */
function applyFilters() {
    const searchInput = document.getElementById('search-experiments');
    currentFilters.search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filtered = [...allExperiments];
    
    // Filtre par cluster
    if (currentFilters.cluster !== 'all') {
        const clusterId = parseInt(currentFilters.cluster);
        filtered = filtered.filter(exp => exp.cluster_id === clusterId);
    }
    
    // Filtre par recherche (nom, ville, école)
    if (currentFilters.search) {
        filtered = filtered.filter(exp => 
            (exp.title && exp.title.toLowerCase().includes(currentFilters.search)) ||
            (exp.description && exp.description.toLowerCase().includes(currentFilters.search)) ||
            (exp.city && exp.city.toLowerCase().includes(currentFilters.search)) ||
            (exp.school && exp.school.toLowerCase().includes(currentFilters.search)) ||
            (exp.protocol && exp.protocol.toLowerCase().includes(currentFilters.search))
        );
    }
    
    renderExperiments(filtered);
}

/**
 * Affiche la liste des expériences
 */
function renderExperiments(experiments) {
    const container = document.getElementById('experiments-list');
    container.innerHTML = '';

    // Afficher le nombre de résultats
    const countDiv = document.createElement('div');
    countDiv.className = 'experiments-count';
    countDiv.textContent = `${experiments.length} expérience(s) trouvée(s)`;
    container.parentElement.insertBefore(countDiv, container);
    
    // Supprimer l'ancien compteur s'il existe
    const oldCount = container.parentElement.querySelector('.experiments-count:not(:last-of-type)');
    if (oldCount && oldCount !== countDiv) {
        oldCount.remove();
    }

    if (experiments.length === 0) {
        container.innerHTML = '<div class="no-data">Aucune expérience trouvée. Essayez de modifier vos critères de recherche.</div>';
        return;
    }

    experiments.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'experiment-card';
        
        // Récupérer les informations du cluster
        const clusterInfo = CLUSTERS[exp.cluster_id];
        const clusterColor = getClusterColor(exp.cluster_id);
        
        card.innerHTML = `
            <div class="experiment-card-header">
                <h3>${exp.title || 'Sans titre'}</h3>
                <span class="experiment-status status-${exp.status}">${getStatusLabel(exp.status)}</span>
            </div>
            ${clusterInfo ? `<div class="experiment-cluster" style="color: ${clusterColor};">
                ${clusterInfo.icon} ${clusterInfo.label}
            </div>` : ''}
            <p class="experiment-description">${exp.description || 'Pas de description'}</p>
            ${exp.school ? `<p class="experiment-school">🏫 ${exp.school}</p>` : ''}
            ${exp.city ? `<p class="experiment-city">📍 ${exp.city}</p>` : ''}
            ${exp.protocol_name || exp.protocol ? `<p class="experiment-protocol">🔬 ${exp.protocol_name || exp.protocol}</p>` : ''}
            <div class="experiment-meta">
                <small>📅 ${new Date(exp.created_at || exp.createdAt || Date.now()).toLocaleDateString()}</small>
            </div>
        `;
        card.addEventListener('click', () => showDetails(exp));
        container.appendChild(card);
    });
}

/**
 * Récupère la couleur d'un cluster
 */
function getClusterColor(clusterId) {
    const colors = {
        1: '#3498db', // Blue - Governance
        2: '#27ae60', // Green - Environmental
        3: '#e74c3c', // Red - Mobility
        4: '#f39c12', // Orange - Energy
        5: '#9b59b6'  // Purple - AI & Tech
    };
    return colors[clusterId] || '#95a5a6';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'En cours',
        'completed': 'Terminé',
        'pending': 'En attente'
    };
    return labels[status] || status;
}

/**
 * Affiche les détails d'une expérience
 */
async function showDetails(exp) {
    const detailsPanel = document.getElementById('experiment-details');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');
    const sensorsContainer = document.getElementById('associated-sensors');
    
    // Afficher le panneau
    detailsPanel.classList.remove('hidden');
    
    // Mettre à jour le titre
    title.textContent = exp.title;
    
    // Afficher les informations principales
    const clusterInfo = CLUSTERS[exp.cluster_id];
    const clusterColor = getClusterColor(exp.cluster_id);
    
    content.innerHTML = `
        <div class="detail-section">
            <p><strong>Statut:</strong> <span class="experiment-status status-${exp.status}">${getStatusLabel(exp.status)}</span></p>
            ${clusterInfo ? `<p><strong>Cluster:</strong> <span style="color: ${clusterColor};">${clusterInfo.icon} ${clusterInfo.label}</span></p>` : ''}
            ${exp.protocol_name || exp.protocol ? `<p><strong>Protocole:</strong> 🔬 ${exp.protocol_name || exp.protocol}</p>` : ''}
            ${exp.school ? `<p><strong>École:</strong> 🏫 ${exp.school}</p>` : ''}
            ${exp.city ? `<p><strong>Ville:</strong> 📍 ${exp.city}</p>` : ''}
            <p><strong>Description:</strong></p>
            <p class="detail-description">${exp.description || 'Pas de description'}</p>
            ${exp.methodology ? `<p><strong>Méthodologie:</strong></p><p class="detail-methodology">${exp.methodology}</p>` : ''}
            ${exp.hypotheses || exp.hypothesis ? `<p><strong>Hypothèse:</strong></p><p class="detail-methodology">${exp.hypotheses || exp.hypothesis}</p>` : ''}
            ${exp.conclusions ? `<p><strong>Conclusions:</strong></p><p class="detail-methodology">${exp.conclusions}</p>` : ''}
            <p><strong>Date de création:</strong> ${new Date(exp.created_at || exp.createdAt || Date.now()).toLocaleString()}</p>
            <p class="detail-id"><strong>ID:</strong> ${exp.id || exp._id}</p>
        </div>
    `;
    
    // Charger les capteurs associés
    await loadAssociatedSensors(exp.id || exp._id, sensorsContainer);
}

/**
 * Charge et affiche les capteurs associés à une expérience
 */
async function loadAssociatedSensors(experimentId, container) {
    container.innerHTML = '<p class="loading-message">⏳ Chargement des capteurs...</p>';
    
    try {
        // Appel à l'API pour récupérer les capteurs
        const response = await fetch(`${API_ENDPOINTS.experiments}/${experimentId}/sensors`);
        
        if (response.ok) {
            const result = await response.json();
            const sensors = result.data || result;
            
            if (sensors.length === 0) {
                container.innerHTML = '<p class="no-data">Aucun capteur associé à cette expérience.</p>';
                return;
            }
            
            renderAssociatedSensors(sensors, container);
        } else {
            // Si l'API ne fonctionne pas, essayer une requête directe sur /api/sensors/devices
            const fallbackResponse = await fetch(`${API_ENDPOINTS.sensors}/devices?experiment_id=${experimentId}`);
            
            if (fallbackResponse.ok) {
                const result = await fallbackResponse.json();
                const sensors = result.data || result;
                
                if (sensors.length === 0) {
                    container.innerHTML = '<p class="no-data">Aucun capteur associé à cette expérience.</p>';
                } else {
                    renderAssociatedSensors(sensors, container);
                }
            } else {
                container.innerHTML = '<p class="no-data error">❌ Erreur lors du chargement des capteurs.</p>';
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des capteurs:', error);
        container.innerHTML = `<p class="no-data error">❌ Erreur: ${error.message}</p>`;
    }
}

/**
 * Affiche la liste des capteurs associés
 */
function renderAssociatedSensors(sensors, container) {
    if (sensors.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun capteur associé.</p>';
        return;
    }
    
    container.innerHTML = '<div class="sensors-grid"></div>';
    const grid = container.querySelector('.sensors-grid');
    
    sensors.forEach(sensor => {
        const sensorCard = document.createElement('div');
        sensorCard.className = 'sensor-card';
        
        const sensorType = SENSOR_TYPES[sensor.type || sensor.sensor_type_id];
        const statusColor = getStatusColor(sensor.status);
        
        sensorCard.innerHTML = `
            <div class="sensor-card-header">
                <span class="sensor-icon">${sensorType?.icon || '📡'}</span>
                <h4 class="sensor-name">${sensor.name || sensor.id}</h4>
            </div>
            <div class="sensor-card-body">
                <p class="sensor-type"><strong>Type:</strong> ${sensorType?.name || sensor.type || sensor.sensor_type_id}</p>
                <p class="sensor-status">
                    <strong>Statut:</strong> 
                    <span style="color: ${statusColor};">● ${getSensorStatusLabel(sensor.status)}</span>
                </p>
                ${sensor.location ? `<p class="sensor-location">📍 ${typeof sensor.location === 'string' ? sensor.location : sensor.location.building || sensor.location.room || 'Non spécifié'}</p>` : ''}
                ${sensor.last_reading ? `
                    <p class="sensor-reading">
                        <strong>Dernière mesure:</strong> 
                        ${sensor.last_reading.value} ${sensorType?.unit || ''}
                        <br>
                        <small>${new Date(sensor.last_reading.timestamp).toLocaleString()}</small>
                    </p>
                ` : ''}
            </div>
            <div class="sensor-card-footer">
                <button class="btn-small btn-primary" onclick="window.location.hash='sensors/${sensor.id || sensor._id}'">
                    Voir détails →
                </button>
            </div>
        `;
        
        grid.appendChild(sensorCard);
    });
}

/**
 * Récupère la couleur du statut du capteur
 */
function getStatusColor(status) {
    const colors = {
        'online': '#27ae60',
        'offline': '#e74c3c',
        'maintenance': '#f39c12'
    };
    return colors[status] || '#95a5a6';
}

/**
 * Récupère le label du statut du capteur
 */
function getSensorStatusLabel(status) {
    const labels = {
        'online': 'En ligne',
        'offline': 'Hors ligne',
        'maintenance': 'Maintenance'
    };
    return labels[status] || status;
}

function closeDetails() {
    document.getElementById('experiment-details').classList.add('hidden');
}