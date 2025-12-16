import { router } from './router.js';
import * as MapModule from './map.js';
import * as ExperimentsModule from './experiments.js';
import * as SensorsModule from './sensors.js';
import * as DataModule from './data.js';

/**
 * Gestion du thème sombre
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Appliquer le thème sauvegardé
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    
    // Basculer le thème
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

/**
 * Point d'entrée principal de l'application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Application SteamCity démarrée');

    // Initialiser le thème
    initTheme();

    // Initialiser les modules
    MapModule.init();
    ExperimentsModule.init();
    SensorsModule.init();
    DataModule.init();

    // Configurer le routage
    router.on('map', () => {
        console.log('Vue Carte active');
        MapModule.refresh();
    });

    router.on('experiments', (params = []) => {
        console.log('Vue Expériences active', params);
        ExperimentsModule.refresh(params[0]); // Passer l'ID si présent
    });

    router.on('sensors', () => {
        console.log('Vue Capteurs active');
        SensorsModule.refresh();
    });

    router.on('data', () => {
        console.log('Vue Données active');
        DataModule.refresh();
    });

    // Gérer l'URL initiale
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        router.navigate(hash, false);
    } else {
        router.navigate('map', false);
    }
});
