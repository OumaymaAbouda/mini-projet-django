// Dashboard with sidebar auto-close
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const brandTitle = document.getElementById('brandTitle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent');
    let autoHideTimeout;

    // Fonction pour toggle le sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('visible');
        sidebarOverlay.classList.toggle('visible');

        if (sidebar.classList.contains('visible')) {
            // Arrêter le timeout précédent
            clearTimeout(autoHideTimeout);
            // Définir un nouveau timeout pour fermer après 2 minutes (120000ms)
            autoHideTimeout = setTimeout(() => {
                if (sidebar.classList.contains('visible')) {
                    toggleSidebar();
                }
            }, 120000); // 2 minutes = 120000ms
        } else {
            clearTimeout(autoHideTimeout);
        }
    }

    // Click sur le bouton menu
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
    });

    // Click sur le logo/titre
    brandTitle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
    });

    // Click sur l'overlay pour fermer
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Click dans le sidebar pour reset le timer
    sidebar.addEventListener('click', function(e) {
        e.stopPropagation();
        if (sidebar.classList.contains('visible')) {
            clearTimeout(autoHideTimeout);
            autoHideTimeout = setTimeout(() => {
                if (sidebar.classList.contains('visible')) {
                    toggleSidebar();
                }
            }, 120000);
        }
    });

    // Fermer le sidebar quand on clique en dehors (mobile)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('visible')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && !brandTitle.contains(e.target)) {
                toggleSidebar();
            }
        }
    });

    // Initialiser les graphiques
    initializeCharts();

    // Animer les barres de progression
    animateProgressBars();
});

// Initialiser les graphiques avec données réelles
function initializeCharts() {
    // Weekly Calories Chart
    const caloriesCtx = document.getElementById('caloriesChart');
    if (caloriesCtx) {
        // Utiliser les données de Django si disponibles
        let weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let weeklyCalories = [0, 0, 0, 0, 0, 0, 0];

        // Vérifier si les données sont disponibles globalement
        if (typeof weeklyCaloriesData !== 'undefined' && Object.keys(weeklyCaloriesData).length > 0) {
            // Convertir l'objet en arrays
            weeklyLabels = Object.keys(weeklyCaloriesData);
            weeklyCalories = Object.values(weeklyCaloriesData);
        } else {
            // Fallback : récupérer depuis les barres de progression
            const progressBars = document.querySelectorAll('.progress-day');
            if (progressBars.length > 0) {
                weeklyLabels = [];
                weeklyCalories = [];

                progressBars.forEach((bar) => {
                    const label = bar.querySelector('.progress-label').textContent;
                    const calories = parseInt(bar.querySelector('.progress-calories').textContent) || 0;
                    weeklyLabels.push(label);
                    weeklyCalories.push(calories);
                });
            }
        }

        // Créer le graphique
        new Chart(caloriesCtx, {
            type: 'line',
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: 'Calories',
                    data: weeklyCalories,
                    borderColor: '#FF8C00',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FF8C00',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Calories: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#6B7280',
                            callback: function(value) {
                                return value + ' kcal';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Calories',
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                }
            }
        });
    }

    // Nutrition Chart
    const nutritionCtx = document.getElementById('nutritionChart');
    if (nutritionCtx) {
        // Récupérer les données réelles depuis le template
        let protein = 30;
        let carbs = 50;
        let fat = 20;

        try {
            // Essayer de récupérer depuis les éléments HTML
            const proteinElement = document.getElementById('proteinValue');
            const carbsElement = document.getElementById('carbsValue');
            const fatElement = document.getElementById('fatValue');

            if (proteinElement) {
                protein = parseFloat(proteinElement.textContent) || protein;
            }
            if (carbsElement) {
                carbs = parseFloat(carbsElement.textContent) || carbs;
            }
            if (fatElement) {
                fat = parseFloat(fatElement.textContent) || fat;
            }
        } catch (e) {
            console.log('Using default nutrition data');
        }

        // Créer le graphique
        new Chart(nutritionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [protein, carbs, fat],
                    backgroundColor: [
                        '#FF8C00',
                        '#8B5CF6',
                        '#10B981'
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Animer les barres de progression
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');

    progressBars.forEach(bar => {
        const currentHeight = bar.style.height;
        bar.style.height = '0%';

        setTimeout(() => {
            bar.style.height = currentHeight;
        }, 300);
    });
}