import { API_ENDPOINTS } from './config.js';

export function init() {
    document.getElementById('refresh-sensors')?.addEventListener('click', refresh);
}

export async function refresh() {
    const container = document.getElementById('sensors-list');
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Chargement des capteurs...</div>';

    try {
        const response = await fetch(API_ENDPOINTS.sensors);
        if (response.ok) {
            const sensors = await response.json();
            renderSensors(sensors);
            updateStats(sensors);
        } else {
            renderDemoData();
        }
    } catch (error) {
        console.error('Erreur chargement capteurs:', error);
        renderDemoData();
    }
}

function renderSensors(sensors) {
    const container = document.getElementById('sensors-list');
    container.innerHTML = '';

    if (sensors.length === 0) {
        container.innerHTML = '<p>Aucun capteur trouvé.</p>';
        return;
    }

    sensors.forEach(sensor => {
        const item = document.createElement('div');
        item.className = 'sensor-item';
        item.innerHTML = `
            <div class="sensor-info">
                <h4>${sensor.type} (${sensor.model || 'Inconnu'})</h4>
                <div class="sensor-meta">
                    ID: ${sensor._id} | Loc: ${sensor.location ? 'Défini' : 'Non défini'}
                </div>
            </div>
            <div class="sensor-status">
                <span class="status-badge ${sensor.active ? 'active' : 'inactive'}">
                    ${sensor.active ? 'Actif' : 'Inactif'}
                </span>
            </div>
            <div class="sensor-actions">
                <button class="btn btn-secondary btn-sm">Voir données</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateStats(sensors) {
    document.getElementById('total-sensors').textContent = sensors.length;
    document.getElementById('active-sensors').textContent = sensors.filter(s => s.active).length;
    document.getElementById('inactive-sensors').textContent = sensors.filter(s => !s.active).length;
}

function renderDemoData() {
    const demoSensors = [
        { _id: 'S001', type: 'Température', model: 'DHT22', active: true, location: {} },
        { _id: 'S002', type: 'Qualité Air', model: 'MQ135', active: true, location: {} },
        { _id: 'S003', type: 'Son', model: 'KY-037', active: false, location: {} },
        { _id: 'S004', type: 'Humidité', model: 'DHT11', active: true, location: {} }
    ];
    renderSensors(demoSensors);
    updateStats(demoSensors);
}
