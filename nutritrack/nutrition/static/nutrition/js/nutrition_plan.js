/**
 * Nutrition Plan Application - SIMPLIFIED VERSION
 * Cette version utilise des liens HTML au lieu de JavaScript complexe
 */

// Fonctionnalités basiques uniquement
class SimpleNutritionPlan {
    constructor() {
        this.init();
    }

    init() {
        this.highlightToday();
        this.setupAnimations();
        this.setupMealClick();
    }

    highlightToday() {
        const today = new Date().getDay();
        const dayCards = document.querySelectorAll('.day-card');

        dayCards.forEach(card => {
            const dayNum = parseInt(card.dataset.day);
            if (dayNum === today) {
                card.classList.add('today');

                // Scroll to today's card
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 1000);
            }
        });
    }

    setupAnimations() {
        // Add staggered animation delays
        const dayCards = document.querySelectorAll('.day-card');
        dayCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    setupMealClick() {
        // Meal completion functionality (optional)
        document.addEventListener('click', (e) => {
            const mealCard = e.target.closest('.meal-card');
            if (mealCard) {
                this.toggleMealComplete(mealCard);
            }
        });
    }

    toggleMealComplete(mealCard) {
        const isCompleted = mealCard.classList.contains('completed');

        if (isCompleted) {
            mealCard.classList.remove('completed');
            mealCard.style.boxShadow = '';
        } else {
            mealCard.classList.add('completed');
            mealCard.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Auto-hide Django messages
    setTimeout(() => {
        document.querySelectorAll('.django-messages .toast').forEach(toast => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        });
    }, 5000);

    // Initialize simple features
    window.nutritionPlan = new SimpleNutritionPlan();
});