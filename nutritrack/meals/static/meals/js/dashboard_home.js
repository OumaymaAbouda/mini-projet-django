// dashboard.js

class Dashboard {
    constructor(data) {
        this.data = data;
        this.initializeCharts();
        this.initializeChatbot();
        this.initializeEventListeners();
        this.animateStats();
    }

    initializeCharts() {
        // Weekly Calories Chart
        const caloriesCtx = document.getElementById('caloriesChart');
        if (caloriesCtx) {
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            // S'assurer que les données sont un tableau
            let caloriesData = this.data.weeklyCalories;
            if (!Array.isArray(caloriesData)) {
                caloriesData = [1800, 2000, 2200, 1900, 2100, 2300, 1800];
            }
            // S'assurer qu'on a exactement 7 valeurs
            while (caloriesData.length < 7) {
                caloriesData.push(0);
            }
            caloriesData = caloriesData.slice(0, 7);

            new Chart(caloriesCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Calories',
                        data: caloriesData,
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
            const nutrition = this.data.nutrition || {};
            const protein = parseFloat(nutrition.protein) || 0;
            const carbs = parseFloat(nutrition.carbs) || 0;
            const fat = parseFloat(nutrition.fat) || 0;

            // S'assurer que la somme des pourcentages est valide
            const total = protein + carbs + fat;
            const proteinVal = total > 0 ? protein : 30;
            const carbsVal = total > 0 ? carbs : 50;
            const fatVal = total > 0 ? fat : 20;

            new Chart(nutritionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fat'],
                    datasets: [{
                        data: [proteinVal, carbsVal, fatVal],
                        backgroundColor: ['#10B981', '#FF8C00', '#8B5CF6'],
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

    initializeChatbot() {
        const chatbot = document.getElementById('chatbot');
        const chatIcon = document.getElementById('chat-icon');
        const closeChat = document.getElementById('close-chat');
        const userInput = document.getElementById('userInput');
        const chatWindow = document.getElementById('chat');

        // Initial welcome message (only once)
        const hasWelcomeMessage = chatWindow.querySelector('.bot-message');
        if (!hasWelcomeMessage) {
            setTimeout(() => {
                this.addChatMessage(this.getWelcomeMessage(), 'bot');
            }, 300);
        }

        // Hide suggestions when user types
        userInput.addEventListener('input', () => {
            const suggestions = document.getElementById('chatSuggestions');
            if (suggestions && userInput.value.trim().length > 0) {
                suggestions.style.opacity = '0';
                suggestions.style.maxHeight = '0';
                suggestions.style.padding = '0 15px';
            } else if (suggestions && chatWindow.querySelectorAll('.message').length <= 1) {
                suggestions.style.opacity = '1';
                suggestions.style.maxHeight = '100px';
                suggestions.style.padding = '12px 15px';
            }
        });

        // Show suggestions initially if chat is empty
        const suggestions = document.getElementById('chatSuggestions');
        if (suggestions) {
            const hasMessages = chatWindow.querySelectorAll('.message').length > 1;
            if (!hasMessages) {
                suggestions.style.display = 'flex';
                suggestions.style.opacity = '1';
                suggestions.style.transition = 'all 0.3s ease';
            }
        }

        // Toggle chat
        chatIcon.addEventListener('click', () => {
            chatbot.classList.toggle('visible');
            if (chatbot.classList.contains('visible')) {
                userInput.focus();
            }
        });

        closeChat.addEventListener('click', () => {
            chatbot.classList.remove('visible');
        });

        // Send message on Enter or button click
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }

        // Close chat when clicking outside or pressing Escape
        document.addEventListener('click', (e) => {
            if (!chatbot.contains(e.target) && !chatIcon.contains(e.target)) {
                chatbot.classList.remove('visible');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatbot.classList.contains('visible')) {
                chatbot.classList.remove('visible');
            }
        });
    }

    getWelcomeMessage() {
        const user = this.data.user || {};
        const userName = user.name || 'there';
        const streak = user.streak || 0;
        
        let welcomeMsg = `Hello ${userName}! 👋 I'm your Fitness AI assistant. `;
        
        if (streak > 0) {
            welcomeMsg += `I see you're on a ${streak}-day streak - amazing work! 🔥 `;
        }
        
        welcomeMsg += `How can I help you today?`;
        
        return welcomeMsg;
    }

    addChatMessage(text, sender) {
        const chatWindow = document.getElementById('chat');
        if (!chatWindow) return;

        // Remove typing indicator if exists
        const typingIndicator = chatWindow.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Format text with line breaks
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedText;
        
        chatWindow.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            chatWindow.scrollTo({
                top: chatWindow.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    showTypingIndicator() {
        const chatWindow = document.getElementById('chat');
        if (!chatWindow) return;

        // Remove existing typing indicator
        const existing = chatWindow.querySelector('.typing-indicator');
        if (existing) existing.remove();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatWindow.appendChild(typingDiv);
        
        chatWindow.scrollTo({
            top: chatWindow.scrollHeight,
            behavior: 'smooth'
        });
    }

    sendChatMessage() {
        const userInput = document.getElementById('userInput');
        if (!userInput) return;
        
        const message = userInput.value.trim();

        if (!message) return;

        // Disable input while processing
        userInput.disabled = true;

        // Hide suggestions after sending message
        const suggestions = document.getElementById('chatSuggestions');
        if (suggestions) {
            suggestions.style.opacity = '0';
            suggestions.style.maxHeight = '0';
            suggestions.style.padding = '0 15px';
            setTimeout(() => {
                suggestions.style.display = 'none';
            }, 300);
        }

        // Add user message
        this.addChatMessage(message, 'user');
        userInput.value = '';
        userInput.disabled = false;

        // Show typing indicator
        this.showTypingIndicator();

        // Simulate bot response with realistic delay
        const typingDelay = 500 + Math.random() * 1000; // 500-1500ms
        setTimeout(() => {
            let response = this.getBotResponse(message);
            this.addChatMessage(response, 'bot');
            userInput.focus();
        }, typingDelay);
    }

    getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        const user = this.data.user || {};
        const userName = user.name || 'there';
        const calories = user.calories || 0;
        const streak = user.streak || 0;
        const workoutsToday = user.workoutsToday || 0;
        const caloriesBurned = user.caloriesBurned || 0;

        // Greetings (multilingual support)
        if (this.matchesPattern(lowerMessage, ['hi', 'hello', 'hey', 'salut', 'bonjour', 'bonsoir'])) {
            const greetings = [
                `Hello ${userName}! 👋 How's your fitness journey going today?`,
                `Hi ${userName}! Ready to crush your fitness goals? 💪`,
                `Hey ${userName}! Great to see you! What can I help you with?`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Help command
        if (this.matchesPattern(lowerMessage, ['help', 'aide', 'assist', 'what can you do'])) {
            return `I can help you with:
• 📊 **Stats & Progress**: Check your calories, streak, workouts
• 🏋️ **Workout Advice**: Get exercise tips and routines
• 🥗 **Nutrition Tips**: Learn about healthy eating
• 💪 **Motivation**: Get encouragement and tips
• 📈 **Goals**: Set and track fitness goals

Try asking: "How many calories did I eat today?" or "Give me workout tips"`;
        }

        // Calories queries
        if (this.matchesPattern(lowerMessage, ['calor', 'cal', 'eat', 'food', 'meal', 'mange'])) {
            if (calories === 0) {
                return `You haven't logged any calories today yet. Start tracking your meals to see your daily intake! 📝`;
            }
            
            const advice = this.getCalorieAdvice(calories);
            return `📊 **Today's Calories**: ${calories} kcal\n${advice}`;
        }

        // Streak queries
        if (this.matchesPattern(lowerMessage, ['streak', 'day', 'consist', 'série', 'jour'])) {
            if (streak === 0) {
                return `Start your streak today! Log a meal or complete a workout to begin your fitness journey! 🌟`;
            }
            
            const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⭐' : '💪';
            return `${streakEmoji} **${streak}-Day Streak!**\n${this.getStreakAdvice(streak)}`;
        }

        // Workout queries
        if (this.matchesPattern(lowerMessage, ['workout', 'exercise', 'train', 'gym', 'entraîne'])) {
            if (workoutsToday === 0) {
                return `You haven't logged any workouts today. Ready to get active? Check out the workout plan! 💪`;
            }
            
            return `🏋️ **Workouts Today**: ${workoutsToday}\n${this.getWorkoutAdvice(workoutsToday)}\n💪 Keep up the great work!`;
        }

        // Calories burned
        if (this.matchesPattern(lowerMessage, ['burn', 'burned', 'active', 'brûlé'])) {
            if (caloriesBurned === 0) {
                return `You haven't burned any calories from workouts today. Time to get moving! 🏃`;
            }
            
            return `🔥 **Calories Burned Today**: ${caloriesBurned} kcal\nGreat job staying active! 💪`;
        }

        // Nutrition advice
        if (this.matchesPattern(lowerMessage, ['nutrition', 'diet', 'macro', 'protein', 'carbs', 'fat', 'healthy'])) {
            const nutrition = this.data.nutrition || {};
            return `🥗 **Nutrition Tips**:

• **Protein**: ${nutrition.protein || 30}% - Essential for muscle repair
• **Carbs**: ${nutrition.carbs || 50}% - Your body's main energy source
• **Fat**: ${nutrition.fat || 20}% - Important for hormone production

💡 **Quick Tips**:
• Include protein in every meal
• Choose whole grains over refined carbs
• Add healthy fats (avocado, nuts, olive oil)
• Stay hydrated with water
• Eat colorful fruits and vegetables`;
        }

        // Progress queries
        if (this.matchesPattern(lowerMessage, ['progress', 'stat', 'how am i', 'summary', 'progrès'])) {
            return `📊 **Your Progress Summary**:

• 🔥 Streak: ${streak} days
• 📝 Calories today: ${calories} kcal
• 🏋️ Workouts today: ${workoutsToday}
• 💪 Calories burned: ${caloriesBurned} kcal

${this.getMotivationalMessage(streak, workoutsToday)}`;
        }

        // Motivation
        if (this.matchesPattern(lowerMessage, ['motivat', 'encourag', 'tip', 'advice', 'conseil'])) {
            return this.getRandomAdvice();
        }

        // Meal suggestions
        if (this.matchesPattern(lowerMessage, ['meal idea', 'recipe', 'what to eat', 'meal suggestion'])) {
            return this.getMealSuggestion();
        }

        // Goal setting
        if (this.matchesPattern(lowerMessage, ['goal', 'target', 'objective', 'but'])) {
            return `🎯 **Setting Fitness Goals**:

1. **Be Specific**: "I want to lose 10 pounds" not just "lose weight"
2. **Make it Measurable**: Track your progress daily
3. **Set Realistic Targets**: Start small, build up gradually
4. **Set a Timeline**: Give yourself a deadline
5. **Track Progress**: Use this app to monitor your journey

What fitness goal would you like to work towards? 💪`;
        }

        // Thank you
        if (this.matchesPattern(lowerMessage, ['thank', 'thanks', 'merci', 'appreciate'])) {
            return `You're welcome! I'm always here to help you on your fitness journey. Keep up the great work! 💪🌟`;
        }

        // Default response with suggestions
        return `I'm here to help with your fitness journey! 💪

You can ask me about:
• Your daily stats and progress
• Workout tips and advice
• Nutrition and meal ideas
• Motivation and goal setting

Try: "How many calories did I eat today?" or "Give me workout tips"`;
    }

    matchesPattern(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    }

    getCalorieAdvice(calories) {
        if (calories === 0) return "Start logging your meals to track your intake! 📝";
        if (calories < 1200) return "⚠️ Your intake is quite low. Make sure you're eating enough to fuel your body!";
        if (calories < 1500) return "💡 Consider adding a healthy snack to meet your energy needs.";
        if (calories <= 2500) return "✅ Great calorie intake! You're on track for a balanced day.";
        return "📊 You've consumed more calories today. Consider balancing with exercise or making healthier choices for your next meal.";
    }

    getStreakAdvice(streak) {
        if (streak < 3) return "Great start! Consistency is key. Try to reach 7 days for habit formation! 🌟";
        if (streak < 7) return "You're building momentum! Aim for a full week streak! 💪";
        if (streak < 14) return "Excellent consistency! You're forming strong habits! ⭐";
        if (streak < 30) return "Amazing dedication! You're becoming a fitness champion! 🔥";
        return "Outstanding commitment! You're an inspiration! 🌟💪";
    }

    getWorkoutAdvice(workouts) {
        if (workouts === 0) return "No workouts logged today. Ready to get moving?";
        if (workouts === 1) return "Good start! Consider adding another workout session this week.";
        if (workouts <= 3) return "Great frequency! You're on the right track!";
        return "Excellent workout consistency! Remember to include rest days for recovery!";
    }

    getMotivationalMessage(streak, workouts) {
        if (streak >= 7 && workouts >= 3) {
            return "🌟 You're crushing it! Keep up this amazing consistency!";
        }
        if (streak >= 3) {
            return "💪 You're building great habits! Keep going!";
        }
        return "🚀 Every journey starts with a single step. You've got this!";
    }

    getRandomAdvice() {
        const adviceList = [
            "💡 **Hydration Tip**: Drink water throughout the day for better metabolism and energy!",
            "💡 **Sleep Matters**: Get 7-8 hours of quality sleep for optimal recovery and performance!",
            "💡 **Balance is Key**: Combine cardio and strength training for best results!",
            "💡 **Track Consistently**: Log your meals daily to stay aware of your nutrition!",
            "💡 **Protein Power**: Add protein to every meal for muscle maintenance and satiety!",
            "💡 **Move Daily**: Aim for 10,000 steps daily for general fitness and health!",
            "💡 **Warm Up**: Always start with a 5-minute warm-up before workouts to prevent injury!",
            "💡 **Fuel Right**: Eat a balanced meal 1-2 hours before exercising for optimal energy!",
            "💡 **Recovery Time**: Rest days are just as important as workout days!",
            "💡 **Consistency Wins**: Small daily actions lead to big results over time!"
        ];
        return adviceList[Math.floor(Math.random() * adviceList.length)];
    }

    getMealSuggestion() {
        const meals = [
            "🍳 **Breakfast**: Greek yogurt with berries, granola, and a drizzle of honey",
            "🥗 **Lunch**: Grilled chicken salad with mixed greens, quinoa, and olive oil dressing",
            "🐟 **Dinner**: Baked salmon with roasted vegetables (broccoli, sweet potato, carrots)",
            "🥑 **Snack**: Apple slices with almond butter or a handful of mixed nuts",
            "🍲 **Meal Prep**: Chicken stir-fry with brown rice and mixed vegetables",
            "🥤 **Smoothie**: Spinach, banana, protein powder, and almond milk"
        ];
        return `🍽️ **Healthy Meal Ideas**:\n\n${meals.slice(0, 3).join('\n\n')}\n\n💡 Try meal prepping on weekends to stay on track during the week!`;
    }

    initializeEventListeners() {
        // Logout confirmation
        const logoutForms = document.querySelectorAll('.logout-form-sidebar');
        logoutForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                if (!confirm('Are you sure you want to logout?')) {
                    e.preventDefault();
                }
            });
        });

        // Chart filter change
        const chartFilter = document.querySelector('.chart-filter');
        if (chartFilter) {
            chartFilter.addEventListener('change', (e) => {
                // Here you would typically fetch new data based on the filter
                console.log('Filter changed to:', e.target.value);
            });
        }
    }

    animateStats() {
        // Animate stat numbers
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const finalValue = parseInt(stat.textContent);
            let currentValue = 0;
            const increment = finalValue / 50; // 50 frames

            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    clearInterval(timer);
                    currentValue = finalValue;
                }
                stat.textContent = Math.floor(currentValue);
            }, 20);
        });

        // Animate progress bars
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';

            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    }
}

// Initialize dashboard when DOM is loaded
let dashboardInstance = null;
document.addEventListener('DOMContentLoaded', function() {
    if (typeof dashboardData !== 'undefined') {
        dashboardInstance = new Dashboard(dashboardData);
    }
});

// Export for use in HTML
window.sendMessage = function() {
    if (typeof dashboardInstance !== 'undefined' && dashboardInstance) {
        dashboardInstance.sendChatMessage();
    } else {
        // Fallback: try to get or create dashboard instance
        if (typeof dashboardData !== 'undefined') {
            dashboardInstance = new Dashboard(dashboardData);
            dashboardInstance.sendChatMessage();
        }
    }
};

// Quick message function for suggestion buttons
window.sendQuickMessage = function(text) {
    const userInput = document.getElementById('userInput');
    if (!userInput) return;
    
    // Set the message in the input
    userInput.value = text;
    
    // Trigger the send
    if (typeof dashboardInstance !== 'undefined' && dashboardInstance) {
        dashboardInstance.sendChatMessage();
    } else {
        // Fallback: try to get or create dashboard instance
        if (typeof dashboardData !== 'undefined') {
            if (!dashboardInstance) {
                dashboardInstance = new Dashboard(dashboardData);
            }
            dashboardInstance.sendChatMessage();
        }
    }
};