/**
 * Gestionnaire de routage simple pour l'application SPA
 */
export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    /**
     * Initialise les écouteurs d'événements pour la navigation
     */
    init() {
        // Gérer les clics sur les liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                this.navigate(route);
            });
        });

        // Gérer l'historique du navigateur (boutons retour/avant)
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.navigate(e.state.route, false);
            } else {
                // Par défaut, aller à la carte
                this.navigate('map', false);
            }
        });
    }

    /**
     * Enregistre une route et sa fonction de callback
     * @param {string} name - Nom de la route
     * @param {Function} callback - Fonction à exécuter lors de l'activation de la route
     */
    on(name, callback) {
        this.routes[name] = callback;
    }

    /**
     * Navigue vers une route spécifique
     * @param {string} routeName - Nom de la route cible
     * @param {boolean} addToHistory - Si vrai, ajoute l'état à l'historique du navigateur
     */
    navigate(routeName, addToHistory = true) {
        // Vérifier si la route existe
        const section = document.getElementById(`${routeName}-view`);
        if (!section) {
            console.error(`Route inconnue: ${routeName}`);
            return;
        }

        // Mettre à jour l'interface utilisateur
        // 1. Masquer toutes les sections
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.remove('active');
        });

        // 2. Afficher la section cible
        section.classList.add('active');

        // 3. Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === routeName) {
                link.classList.add('active');
            }
        });

        // 4. Mettre à jour l'historique
        if (addToHistory) {
            window.history.pushState({ route: routeName }, '', `#${routeName}`);
        }

        this.currentRoute = routeName;

        // 5. Exécuter le callback associé si présent
        if (this.routes[routeName]) {
            this.routes[routeName]();
        }
    }
}

// Instance unique du routeur
export const router = new Router();
