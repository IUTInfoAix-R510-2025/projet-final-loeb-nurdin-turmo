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
        const response = await fetch(API_ENDPOINTS.experiments);
        if (response.ok) {
            const result = await response.json();
            allExperiments = result.data || result;
            displayExperiments(allExperiments);
        } else {
            console.warn('Impossible de charger les expériences pour la carte');
            displayDemoData();
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la carte:', error);
        displayDemoData();
    }
}

/**
 * Affiche les marqueurs des expériences sur la carte
 * @param {Array} experiments - Liste des expériences
 */
function displayExperiments(experiments) {
    // Nettoyer tous les marqueurs existants
    for (let clusterId in markersLayer) {
        markersLayer[clusterId].clearLayers();
    }

    experiments.forEach(exp => {
        if (exp.location && exp.location.coordinates) {
            const [lng, lat] = exp.location.coordinates;
            
            // Déterminer la couleur selon le cluster
            const clusterId = exp.cluster_id || 1;
            const color = CLUSTER_COLORS[clusterId] || '#95a5a6';
            const clusterName = CLUSTERS[clusterId]?.label || 'Unknown';

            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <strong>${exp.title || 'Sans titre'}</strong><br>
                    <span style="color: ${color};">● ${clusterName}</span><br>
                    ${exp.school || ''} ${exp.city ? '- ' + exp.city : ''}<br>
                    <button onclick="window.location.hash='experiments/${exp.id || exp._id}'">
                        Voir détails
                    </button>
                </div>
            `);

            // Ajouter au layer du cluster correspondant
            if (markersLayer[clusterId]) {
                markersLayer[clusterId].addLayer(marker);
            }
        }
    });
}

/**
 * Affiche des données de démonstration si l'API n'est pas disponible
 */
function displayDemoData() {
    const demoExperiments = [
        {
            title: "Qualité de l'air - Centre Ville",
            cluster_id: 2,
            school: "Lycée Victor Hugo",
            city: "Aix-en-Provence",
            location: { coordinates: [5.447427, 43.529742] }
        },
        {
            title: "Bruit - Campus",
            cluster_id: 2,
            school: "Collège Marie Curie",
            city: "Marseille",
            location: { coordinates: [5.439, 43.525] }
        },
        {
            title: "Mobilité urbaine",
            cluster_id: 3,
            school: "Lycée Thiers",
            city: "Marseille",
            location: { coordinates: [5.452, 43.526] }
        },
        {
            title: "Consommation énergétique",
            cluster_id: 4,
            school: "École Jules Ferry",
            city: "Aix-en-Provence",
            location: { coordinates: [5.445, 43.532] }
        },
        {
            title: "IA et reconnaissance d'images",
            cluster_id: 5,
            school: "Lycée Vauvenargues",
            city: "Aix-en-Provence",
            location: { coordinates: [5.450, 43.528] }
        }
    ];
    allExperiments = demoExperiments;
    displayExperiments(demoExperiments);
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