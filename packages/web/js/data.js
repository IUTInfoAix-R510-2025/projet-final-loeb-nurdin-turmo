import { API_ENDPOINTS } from './config.js';

let timeChart = null;
let distributionChart = null;

export function init() {
    document.getElementById('refresh-data')?.addEventListener('click', refresh);
    document.getElementById('apply-data-filters')?.addEventListener('click', refresh);
}

export async function refresh() {
    // Simuler le chargement des données
    const tbody = document.getElementById('measurements-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="loading-message">Chargement...</td></tr>';

    try {
        // En production: fetch(API_ENDPOINTS.measurements)
        // Ici on simule
        setTimeout(() => {
            renderDemoData();
        }, 500);
    } catch (error) {
        console.error('Erreur chargement données:', error);
    }
}

function renderDemoData() {
    const data = generateDemoData();
    
    updateTable(data);
    updateCharts(data);
    updateStats(data);
}

function generateDemoData() {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
        data.push({
            timestamp: new Date(now - i * 3600000), // -1h par point
            sensorId: i % 2 === 0 ? 'S001' : 'S002',
            type: i % 2 === 0 ? 'Température' : 'CO2',
            value: i % 2 === 0 ? 20 + Math.random() * 5 : 400 + Math.random() * 50,
            unit: i % 2 === 0 ? '°C' : 'ppm'
        });
    }
    return data;
}

function updateTable(data) {
    const tbody = document.getElementById('measurements-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.timestamp.toLocaleString()}</td>
            <td>${row.sensorId}</td>
            <td>${row.type}</td>
            <td>${row.value.toFixed(2)}</td>
            <td>${row.unit}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateCharts(data) {
    const ctxTime = document.getElementById('time-chart')?.getContext('2d');
    const ctxDist = document.getElementById('distribution-chart')?.getContext('2d');

    if (ctxTime) {
        if (timeChart) timeChart.destroy();
        
        // Filtrer pour un type de données pour le graphe (ex: Température)
        const tempData = data.filter(d => d.type === 'Température').reverse();
        
        timeChart = new Chart(ctxTime, {
            type: 'line',
            data: {
                labels: tempData.map(d => d.timestamp.toLocaleTimeString()),
                datasets: [{
                    label: 'Température (°C)',
                    data: tempData.map(d => d.value),
                    borderColor: '#3498db',
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (ctxDist) {
        if (distributionChart) distributionChart.destroy();
        
        // Histogramme simple
        distributionChart = new Chart(ctxDist, {
            type: 'bar',
            data: {
                labels: ['< 21°C', '21-23°C', '> 23°C'],
                datasets: [{
                    label: 'Distribution Température',
                    data: [
                        data.filter(d => d.type === 'Température' && d.value < 21).length,
                        data.filter(d => d.type === 'Température' && d.value >= 21 && d.value <= 23).length,
                        data.filter(d => d.type === 'Température' && d.value > 23).length
                    ],
                    backgroundColor: ['#3498db', '#2ecc71', '#e74c3c']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function updateStats(data) {
    const values = data.filter(d => d.type === 'Température').map(d => d.value);
    if (values.length === 0) return;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    document.getElementById('stat-mean').textContent = avg.toFixed(2);
    document.getElementById('stat-min').textContent = min.toFixed(2);
    document.getElementById('stat-max').textContent = max.toFixed(2);
    
    // Ecart-type simplifié
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    document.getElementById('stat-std').textContent = stdDev.toFixed(2);
}
