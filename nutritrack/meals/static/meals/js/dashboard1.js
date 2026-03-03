/// dashboard1.js - Version complète corrigée
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const brandTitle = document.getElementById('brandTitle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    let autoHideTimeout;

    // Fonction pour toggle le sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('visible');
        sidebarOverlay.classList.toggle('visible');

        if (sidebar.classList.contains('visible')) {
            clearTimeout(autoHideTimeout);
            autoHideTimeout = setTimeout(() => {
                if (sidebar.classList.contains('visible')) {
                    toggleSidebar();
                }
            }, 120000);
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
    if (brandTitle) {
        brandTitle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

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

    // Fermer le sidebar sur mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('visible')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                toggleSidebar();
            }
        }
    });

    // Initialiser les graphiques
    initializeCharts();

    // Animer les barres de progression
    animateProgressBars();

    // Initialiser les données d'activité hebdomadaire
    initializeWeeklyActivity();
});

// Initialiser les graphiques
function initializeCharts() {
    // Weekly Calories Chart
    const caloriesCtx = document.getElementById('caloriesChart');
    if (caloriesCtx) {
        let weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let weeklyCalories = [0, 0, 0, 0, 0, 0, 0];

        // Utiliser les données de la page si disponibles
        if (weeklyCaloriesData && Object.keys(weeklyCaloriesData).length > 0) {
            weeklyLabels = Object.keys(weeklyCaloriesData);
            weeklyCalories = Object.values(weeklyCaloriesData);
        }

        // S'assurer d'avoir 7 jours
        while (weeklyLabels.length < 7) {
            weeklyLabels.push(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weeklyLabels.length]);
        }
        while (weeklyCalories.length < 7) {
            weeklyCalories.push(0);
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
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
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
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            color: '#6B7280',
                            callback: function(value) {
                                return value + ' kcal';
                            }
                        }
                    },
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#6B7280' }
                    }
                }
            }
        });
    }

    // Nutrition Chart
    const nutritionCtx = document.getElementById('nutritionChart');
    if (nutritionCtx) {
        let protein = proteinPercent || 30;
        let carbs = carbsPercent || 50;
        let fat = fatPercent || 20;

        // Normaliser à 100%
        const total = protein + carbs + fat;
        if (total > 0) {
            protein = (protein / total) * 100;
            carbs = (carbs / total) * 100;
            fat = (fat / total) * 100;
        }

        // Créer le graphique
        new Chart(nutritionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [protein, carbs, fat],
                    backgroundColor: ['#FF8C00', '#8B5CF6', '#10B981'],
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialiser l'activité hebdomadaire avec exercices
function initializeWeeklyActivity() {
    const weeklyBars = document.getElementById('weeklyBars');
    if (!weeklyBars) return;

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Vérifier si les barres existent déjà
    const existingBars = weeklyBars.querySelectorAll('.progress-day');
    if (existingBars.length === 0) {
        // Créer les barres si elles n'existent pas
        weekDays.forEach(day => {
            const calories = weeklyCaloriesData && weeklyCaloriesData[day] ? weeklyCaloriesData[day] : 0;
            const workouts = weeklyWorkoutsData && weeklyWorkoutsData[day] ? weeklyWorkoutsData[day] : 0;

            createActivityBar(day, calories, workouts);
        });
    }
}

// Créer une barre d'activité
function createActivityBar(day, calories, workouts) {
    const weeklyBars = document.getElementById('weeklyBars');
    const dayDiv = document.createElement('div');
    dayDiv.className = 'progress-day';

    // Calculer les pourcentages
    const caloriesPercent = Math.min((calories / 2000) * 100, 100);
    const workoutsPercent = Math.min((workouts / 5) * 100, 100);

    dayDiv.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill"
                 data-calories="${calories}"
                 style="height: ${caloriesPercent}%"></div>
            ${workouts > 0 ? `<div class="workout-indicator" style="width: ${workoutsPercent}%"></div>` : ''}
        </div>
        <div class="progress-label">${day}</div>
        <div class="progress-calories">${calories}</div>
        <div class="progress-workouts">${workouts} ex</div>
    `;

    weeklyBars.appendChild(dayDiv);
}

// Animer les barres de progression
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');

    progressBars.forEach(bar => {
        const targetHeight = bar.getAttribute('data-calories') || 0;
        const maxCalories = 2000;
        const heightPercent = Math.min((targetHeight / maxCalories) * 100, 100);

        bar.style.height = '0%';

        setTimeout(() => {
            bar.style.height = heightPercent + '%';
        }, 300);
    });
}

// Fonction pour calculer l'activité totale de la semaine
function calculateWeeklyActivity() {
    let totalCalories = 0;
    let totalWorkouts = 0;

    const progressDays = document.querySelectorAll('.progress-day');

    progressDays.forEach(day => {
        const calories = parseInt(day.querySelector('.progress-calories').textContent) || 0;
        const workouts = parseInt(day.querySelector('.progress-workouts').textContent) || 0;

        totalCalories += calories;
        totalWorkouts += workouts;
    });

    return {
        totalCalories: totalCalories,
        totalWorkouts: totalWorkouts,
        avgCalories: Math.round(totalCalories / 7),
        avgWorkouts: (totalWorkouts / 7).toFixed(1)
    };
}