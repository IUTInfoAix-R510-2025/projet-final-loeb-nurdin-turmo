import { API_ENDPOINTS } from './config.js';

let map = null;
let markers = [];

/**
 * Initialise la carte Leaflet
 */
export function init() {
    // Coordonnées par défaut (Paris/France ou local)
    // On peut ajuster selon la localisation du projet (Aix-Marseille vu le footer)
    const defaultCenter = [43.529742, 5.447427]; // Aix-en-Provence
    const defaultZoom = 13;

    // Initialiser la carte si le conteneur existe
    if (document.getElementById('map')) {
        map = L.map('map').setView(defaultCenter, defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Gestionnaires d'événements pour les contrôles de la carte
        document.getElementById('refresh-map')?.addEventListener('click', refresh);
        document.getElementById('toggle-filters')?.addEventListener('click', toggleFilters);
        document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    }
}

/**
 * Rafraîchit les données de la carte
 */
export async function refresh() {
    if (!map) return;

    // Invalider la taille de la carte pour s'assurer qu'elle s'affiche correctement
    // après avoir été cachée (display: none)
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    try {
        // Charger les expériences depuis l'API
        // Note: En production, utiliser fetchAPI de api.js
        // Pour l'instant, on simule ou on tente l'appel
        const response = await fetch(API_ENDPOINTS.experiments);
        if (response.ok) {
            const experiments = await response.json();
            displayExperiments(experiments);
        } else {
            console.warn('Impossible de charger les expériences pour la carte');
            // Données de démonstration si l'API échoue
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
    // Nettoyer les marqueurs existants
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    experiments.forEach(exp => {
        if (exp.location && exp.location.coordinates) {
            const [lng, lat] = exp.location.coordinates; // GeoJSON est [lng, lat]
            
            // Déterminer la couleur en fonction du statut
            let color = '#3498db'; // blue
            if (exp.status === 'active') color = '#27ae60'; // green
            if (exp.status === 'pending') color = '#f39c12'; // orange

            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
                <strong>${exp.title}</strong><br>
                Statut: ${exp.status}<br>
                <button onclick="window.location.hash='#experiments'">Voir détails</button>
            `);

            markers.push(marker);
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
            status: "active",
            location: { coordinates: [5.447427, 43.529742] }
        },
        {
            title: "Bruit - Campus",
            status: "completed",
            location: { coordinates: [5.439, 43.525] }
        },
        {
            title: "Température - Parc Jourdan",
            status: "pending",
            location: { coordinates: [5.452, 43.526] }
        }
    ];
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
    const status = document.getElementById('filter-status').value;
    const location = document.getElementById('filter-location').value;
    
    console.log(`Filtres appliqués: Statut=${status}, Lieu=${location}`);
    // Ici, on rechargerait les données avec les filtres
    refresh();
}
