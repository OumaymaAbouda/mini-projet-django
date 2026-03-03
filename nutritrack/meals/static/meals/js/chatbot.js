// chatbot.js - Version corrigée (sans doublons)
document.addEventListener('DOMContentLoaded', function() {
    const chatbot = document.getElementById('chatbot');
    const chatIcon = document.getElementById('chat-icon');
    const userInput = document.getElementById('userInput');
    const sendButton = document.querySelector('.chat-inputs button');
    const chatWindow = document.getElementById('chat');
    const closeChat = document.getElementById('close-chat');
    const suggestions = document.querySelectorAll('#suggestions button');

    // Initialiser le chatbot
    initChatbot();

    function initChatbot() {
        // Vérifier si le message de bienvenue existe déjà
        const hasWelcomeMessage = chatWindow.querySelector('.bot-message');

        // Toggle chat visibility
        function toggleChat() {
            chatbot.classList.toggle('visible');
            if (chatbot.classList.contains('visible')) {
                setTimeout(() => userInput.focus(), 300);
                // Ajouter le message de bienvenue seulement la première fois
                if (!hasWelcomeMessage) {
                    setTimeout(() => {
                        addMessage("👋 Welcome to FitnessHub! I'm your AI assistant. I can help you track calories, check workouts, and give fitness advice. How can I assist you today?", 'bot');
                    }, 500);
                }
            }
        }

        // Event listeners
        chatIcon.addEventListener('click', toggleChat);
        closeChat.addEventListener('click', toggleChat);

        // Send message when button is clicked
        sendButton.addEventListener('click', function() {
            sendMessage();
        });

        // Send message on Enter key
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Suggestion buttons
        if (suggestions.length > 0) {
            suggestions.forEach(button => {
                button.addEventListener('click', function() {
                    const message = this.textContent;
                    userInput.value = message;
                    sendMessage();
                });
            });
        }

        // Close when clicking outside (except on chat icon)
        document.addEventListener('click', function(e) {
            if (chatbot.classList.contains('visible') &&
                !chatbot.contains(e.target) &&
                !chatIcon.contains(e.target)) {
                toggleChat();
            }
        });
    }
});

// Fonction globale pour les messages rapides
function sendQuickMessage(text) {
    const input = document.getElementById('userInput');
    input.value = text;
    sendMessage();
}

// Send message function
function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Simulate typing delay
    setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response, 'bot');
    }, 800);
}

// Add message to chat
function addMessage(text, sender) {
    const chatWindow = document.getElementById('chat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    chatWindow.appendChild(messageDiv);

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Bot responses avec conseils personnalisés
function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Récupérer les données utilisateur
    const userStats = getUserStats();

    // Réponses contextuelles
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hello! 👋 I'm your FitnessHub AI. Today you've logged ${userStats.caloriesToday} calories and have a ${userStats.streakDays}-day streak. How can I help you?`;
    }

    if (lowerMessage.includes('calori') || lowerMessage.includes('cal') || lowerMessage.includes('eat')) {
        return `Today's calories: ${userStats.caloriesToday} kcal. ${getCalorieAdvice(userStats.caloriesToday)}`;
    }

    if (lowerMessage.includes('streak') || lowerMessage.includes('day') || lowerMessage.includes('consist')) {
        return `Streak: ${userStats.streakDays} days! ${getStreakAdvice(userStats.streakDays)}`;
    }

    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('train')) {
        return `Workouts this week: ${userStats.workoutsWeek}. ${getWorkoutAdvice(userStats.workoutsWeek)}`;
    }

    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('macro')) {
        const protein = document.getElementById('proteinValue')?.textContent || "30%";
        const carbs = document.getElementById('carbsValue')?.textContent || "50%";
        const fat = document.getElementById('fatValue')?.textContent || "20%";
        return `Your macros: Protein ${protein}, Carbs ${carbs}, Fat ${fat}. For fitness goals, aim for balanced nutrition.`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
        return "I can help with:\n• Calorie tracking\n• Workout planning\n• Nutrition advice\n• Streak motivation\n• Goal setting\n• Meal suggestions\n• Exercise tips";
    }

    if (lowerMessage.includes('advice') || lowerMessage.includes('tip')) {
        return getRandomAdvice();
    }

    if (lowerMessage.includes('meal') || lowerMessage.includes('food')) {
        return "Healthy meal ideas:\n• Breakfast: Greek yogurt with berries\n• Lunch: Grilled chicken salad\n• Dinner: Salmon with roasted vegetables\n• Snack: Apple with almond butter";
    }

    // Default response
    return "I'm here to support your fitness journey! Ask me about calories, workouts, nutrition, or fitness tips.";
}

// Helper functions
function getUserStats() {
    // Récupérer depuis les éléments de la page
    const welcomeStats = document.querySelectorAll('.welcome-stat-value');

    return {
        caloriesToday: welcomeStats[0] ? parseInt(welcomeStats[0].textContent) || 0 : 0,
        streakDays: welcomeStats[1] ? parseInt(welcomeStats[1].textContent) || 0 : 0,
        workoutsWeek: welcomeStats[2] ? parseInt(welcomeStats[2].textContent) || 0 : 0,
        goalProgress: welcomeStats[3] ? parseFloat(welcomeStats[3].textContent) || 0 : 0
    };
}

function getCalorieAdvice(calories) {
    if (calories === 0) return "You haven't logged any calories today. Start tracking your meals!";
    if (calories < 1200) return "Your calorie intake is low. Make sure to eat enough for energy.";
    if (calories > 2500) return "You've consumed more calories than average. Consider balancing with exercise.";
    return "Good calorie intake for the day! Keep tracking for consistency.";
}

function getStreakAdvice(streak) {
    if (streak === 0) return "Start your streak today by logging a meal or workout!";
    if (streak < 3) return "Great start! Try to reach 7 days for habit formation.";
    if (streak < 7) return "Good consistency! Aim for a full week streak.";
    if (streak < 14) return "Excellent! You're building strong habits.";
    return "Amazing consistency! You're a fitness champion!";
}

function getWorkoutAdvice(workouts) {
    if (workouts === 0) return "No workouts logged this week. Start with 3 sessions per week.";
    if (workouts <= 2) return "Good start! Aim for 3-4 workouts weekly.";
    if (workouts <= 4) return "Great frequency! You're on the right track.";
    return "Excellent workout consistency! Remember to include rest days.";
}

function getRandomAdvice() {
    const adviceList = [
        "💡 Drink water throughout the day for better metabolism.",
        "💡 Get 7-8 hours of sleep for optimal recovery.",
        "💡 Combine cardio and strength training for best results.",
        "💡 Track your meals consistently to stay aware.",
        "💡 Add protein to every meal for muscle maintenance.",
        "💡 Take 10,000 steps daily for general fitness.",
        "💡 Start with a 5-minute warm-up before workouts.",
        "💡 Eat a balanced meal 1-2 hours before exercising."
    ];
    return adviceList[Math.floor(Math.random() * adviceList.length)];
}