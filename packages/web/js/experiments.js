import { API_ENDPOINTS } from './config.js';

/**
 * Initialise le module Expériences
 */
export function init() {
    document.getElementById('refresh-experiments')?.addEventListener('click', refresh);
    document.getElementById('close-details')?.addEventListener('click', closeDetails);
    
    // Recherche
    document.querySelector('.btn-search')?.addEventListener('click', () => {
        const query = document.getElementById('search-experiments').value;
        console.log('Recherche:', query);
        // Implémenter la recherche
    });
}

/**
 * Rafraîchit la liste des expériences
 */
export async function refresh() {
    const container = document.getElementById('experiments-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Chargement des expériences...</div>';

    try {
        const response = await fetch(API_ENDPOINTS.experiments);
        if (response.ok) {
            const experiments = await response.json();
            renderExperiments(experiments);
        } else {
            // Demo data
            renderDemoData();
        }
    } catch (error) {
        console.error('Erreur chargement expériences:', error);
        renderDemoData();
    }
}

/**
 * Affiche la liste des expériences
 */
function renderExperiments(experiments) {
    const container = document.getElementById('experiments-list');
    container.innerHTML = '';

    if (experiments.length === 0) {
        container.innerHTML = '<p>Aucune expérience trouvée.</p>';
        return;
    }

    experiments.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'experiment-card';
        card.innerHTML = `
            <h3>${exp.title || 'Sans titre'}</h3>
            <span class="experiment-status status-${exp.status}">${getStatusLabel(exp.status)}</span>
            <p>${exp.description || 'Pas de description'}</p>
            <div class="experiment-meta">
                <small>Date: ${new Date(exp.createdAt || Date.now()).toLocaleDateString()}</small>
            </div>
        `;
        card.addEventListener('click', () => showDetails(exp));
        container.appendChild(card);
    });
}

function renderDemoData() {
    const demoData = [
        {
            _id: '1',
            title: "Mesure de la qualité de l'air",
            status: "active",
            description: "Surveillance des particules fines dans le centre-ville.",
            createdAt: new Date().toISOString()
        },
        {
            _id: '2',
            title: "Niveau sonore campus",
            status: "completed",
            description: "Analyse du bruit ambiant pendant les heures de cours.",
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            _id: '3',
            title: "Îlot de chaleur urbain",
            status: "pending",
            description: "Étude des variations de température dans les parcs.",
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];
    renderExperiments(demoData);
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
function showDetails(exp) {
    const detailsPanel = document.getElementById('experiment-details');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');
    
    title.textContent = exp.title;
    content.innerHTML = `
        <p><strong>Statut:</strong> ${getStatusLabel(exp.status)}</p>
        <p><strong>Description:</strong> ${exp.description}</p>
        <p><strong>Date de création:</strong> ${new Date(exp.createdAt).toLocaleString()}</p>
        <p><strong>ID:</strong> ${exp._id}</p>
    `;
    
    detailsPanel.classList.remove('hidden');
}

function closeDetails() {
    document.getElementById('experiment-details').classList.add('hidden');
}
