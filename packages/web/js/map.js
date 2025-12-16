import { API_ENDPOINTS, CLUSTERS } from './config.js';

let map = null;
let markersLayer = {}; // Stocke les marqueurs par cluster
let allExperiments = []; // Stocke toutes les expériences

// Couleurs des clusters
const CLUSTER_COLORS = {
    1: '#3498db', // Blue - Governance
    2: '#27ae60', // Green - Environmental
    3: '#e74c3c', // Red - Mobility
    4: '#f39c12', // Orange - Energy
    5: '#9b59b6'  // Purple - AI & Tech
};

/**
 * Ajuste la luminosité d'une couleur hexadécimale
 * @param {string} color - Couleur hex (#rrggbb)
 * @param {number} amount - Montant à ajuster (positif = plus clair, négatif = plus foncé)
 * @returns {string} Couleur ajustée
 */
function adjustColor(color, amount) {
    const clamp = (val) => Math.min(255, Math.max(0, val));
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/**
 * Initialise la carte Leaflet
 */
export function init() {
    const defaultCenter = [43.529742, 5.447427]; // Aix-en-Provence
    const defaultZoom = 10;

    if (document.getElementById('map')) {
        map = L.map('map').setView(defaultCenter, defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Initialiser les layers pour chaque cluster
        for (let clusterId in CLUSTER_COLORS) {
            markersLayer[clusterId] = L.layerGroup().addTo(map);
        }

        // Gestionnaires d'événements
        document.getElementById('refresh-map')?.addEventListener('click', refresh);
        document.getElementById('toggle-filters')?.addEventListener('click', toggleFilters);
        document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
        
        // Gestionnaires pour les checkboxes de la légende
        initLegendFilters();
    }
}

/**
 * Initialise les filtres de la légende
 */
function initLegendFilters() {
    for (let i = 1; i <= 5; i++) {
        const checkbox = document.getElementById(`cluster-${i}`);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                toggleClusterVisibility(i, e.target.checked);
            });
        }
    }
}

/**
 * Affiche/Masque un cluster
 */
function toggleClusterVisibility(clusterId, visible) {
    if (markersLayer[clusterId]) {
        if (visible) {
            map.addLayer(markersLayer[clusterId]);
        } else {
            map.removeLayer(markersLayer[clusterId]);
        }
    }
}

/**
 * Rafraîchit les données de la carte
 */
export async function refresh() {
    if (!map) return;

    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    try {
        console.log('Chargement des expériences depuis:', API_ENDPOINTS.experiments);
        const response = await fetch(API_ENDPOINTS.experiments);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Données reçues:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur API inconnue');
        }
        
        allExperiments = result.data || [];
        console.log(`${allExperiments.length} expérience(s) chargée(s)`);
        
        if (allExperiments.length === 0) {
            console.warn('Aucune expérience trouvée. Avez-vous exécuté le script seed ?');
            alert('Aucune expérience trouvée dans la base de données. Veuillez exécuter : npm run seed');
            return;
        }
        
        displayExperiments(allExperiments);
    } catch (error) {
        console.error('Erreur lors du chargement de la carte:', error);
        alert(`Erreur de connexion à l'API: ${error.message}\n\nAssurez-vous que l'API est démarrée (npm run dev:api)`);
    }
}

/**
 * Affiche les marqueurs des expériences sur la carte
 */
function displayExperiments(experiments) {
    // Nettoyer tous les marqueurs existants
    for (let clusterId in markersLayer) {
        markersLayer[clusterId].clearLayers();
    }

    let validMarkersCount = 0;

    experiments.forEach(exp => {
        if (exp.location && exp.location.coordinates) {
            // GeoJSON utilise [longitude, latitude]
            // Leaflet utilise [latitude, longitude]
            const [lng, lat] = exp.location.coordinates;
            
            // Vérifier que les coordonnées sont valides
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Déterminer la couleur selon le cluster
                const clusterId = exp.cluster_id || 1;
                const color = CLUSTER_COLORS[clusterId] || '#95a5a6';
                const clusterName = CLUSTERS[clusterId]?.label || 'Unknown';

                // CORRECTION: Inverser lat/lng pour Leaflet
                const marker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });

                marker.bindPopup(`
                    <div style="min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <strong style="font-size: 16px; color: #2c3e50;">${exp.title || 'Sans titre'}</strong><br>
                        <span style="color: ${color}; font-weight: 600;">${clusterName}</span><br>
                        <span style="color: #7f8c8d; font-size: 13px;">${exp.school || ''} ${exp.city ? '- ' + exp.city : ''}</span><br>
                        <button onclick="window.location.hash='experiments/${exp.id || exp._id}'" 
                                style="margin-top: 10px; padding: 8px 16px; background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)}); 
                                color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; 
                                font-size: 13px; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                            Voir détails
                        </button>
                    </div>
                `);

                // Ajouter au layer du cluster correspondant
                if (markersLayer[clusterId]) {
                    markersLayer[clusterId].addLayer(marker);
                    validMarkersCount++;
                }
            } else {
                console.warn(`Coordonnées invalides pour l'expérience "${exp.title}":`, lat, lng);
            }
        } else {
            console.warn(`Pas de coordonnées pour l'expérience "${exp.title || exp.id}"`);
        }
    });

    console.log(`${validMarkersCount} marqueur(s) affiché(s) sur ${experiments.length} expérience(s)`);

    // Ajuster la vue de la carte pour afficher tous les marqueurs
    if (validMarkersCount > 0) {
        adjustMapBounds();
    } else {
        alert('Aucune expérience avec coordonnées GPS trouvée.');
    }
}

/**
 * Ajuste la vue de la carte pour afficher tous les marqueurs visibles
 */
function adjustMapBounds() {
    try {
        const bounds = L.latLngBounds([]);
        let hasMarkers = false;
        
        // Collecter les coordonnées de tous les marqueurs visibles
        for (let clusterId in markersLayer) {
            if (map.hasLayer(markersLayer[clusterId])) {
                markersLayer[clusterId].eachLayer(marker => {
                    bounds.extend(marker.getLatLng());
                    hasMarkers = true;
                });
            }
        }
        
        // Ajuster la vue si on a au moins un marqueur
        if (hasMarkers && bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        }
    } catch (error) {
        console.warn('Impossible d\'ajuster les bounds de la carte:', error);
    }
}

/**
 * Affiche/Masque le panneau de filtres
 */
function toggleFilters() {
    const panel = document.getElementById('filters-panel');
    panel.classList.toggle('hidden');
}

/**
 * Applique les filtres sélectionnés
 */
function applyFilters() {
    const location = document.getElementById('filter-location').value.toLowerCase();
    
    let filteredExperiments = allExperiments;
    
    // Filtre par lieu (ville ou école)
    if (location) {
        filteredExperiments = filteredExperiments.filter(exp => 
            (exp.city && exp.city.toLowerCase().includes(location)) ||
            (exp.school && exp.school.toLowerCase().includes(location)) ||
            (exp.title && exp.title.toLowerCase().includes(location))
        );
    }
    
    displayExperiments(filteredExperiments);
}