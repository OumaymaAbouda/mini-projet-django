// static/js/home.js
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar functionality
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const logo = document.getElementById('logo');

    // Toggle sidebar on menu button click
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            updateMainContentMargin();
        });
    }

    // Toggle sidebar on logo hover (desktop only)
    if (logo && window.innerWidth >= 1024) {
        let hoverTimer;

        logo.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
            sidebar.classList.add('active');
            updateMainContentMargin();
        });

        logo.addEventListener('mouseleave', function() {
            hoverTimer = setTimeout(() => {
                sidebar.classList.remove('active');
                updateMainContentMargin();
            }, 500);
        });

        // Keep sidebar open when hovering over it
        sidebar.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
        });

        sidebar.addEventListener('mouseleave', function() {
            hoverTimer = setTimeout(() => {
                sidebar.classList.remove('active');
                updateMainContentMargin();
            }, 500);
        });
    }

    // Update main content margin based on sidebar state
    function updateMainContentMargin() {
        const mainContent = document.querySelector('.main-content');
        if (sidebar.classList.contains('active') && window.innerWidth >= 1024) {
            mainContent.style.marginLeft = '280px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    }

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', function(event) {
        if (window.innerWidth < 1024 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Initialize Charts
    initializeCharts();

    // Animate progress bars
    animateProgressBars();

    // Auto-hide messages
    autoHideMessages();

    // Chatbot functionality
    initializeChatbot();

    // Real-time stats updates
    initializeLiveStats();
});

// Initialize Charts
function initializeCharts() {
    // Calorie Chart
    const calorieCtx = document.getElementById('calorieChart');
    if (calorieCtx) {
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let calorieData = [2100, 1800, 2400, 2200, 1900, 2700, 2000];

        // Use actual data if available
        if (typeof dashboardData !== 'undefined' && dashboardData.weekly_calories_data) {
            calorieData = daysOfWeek.map(day => dashboardData.weekly_calories_data[day] || 0);
        }

        new Chart(calorieCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: daysOfWeek,
                datasets: [{
                    label: 'Calories',
                    data: calorieData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
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
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: '#10b981',
                        borderWidth: 1,
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
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    // Nutrition Chart
    const nutritionCtx = document.getElementById('nutritionChart');
    if (nutritionCtx) {
        let protein = 35, carbs = 45, fat = 20;

        // Use actual data if available
        if (typeof dashboardData !== 'undefined') {
            protein = dashboardData.protein_percent || 35;
            carbs = dashboardData.carbs_percent || 45;
            fat = dashboardData.fat_percent || 20;
        }

        new Chart(nutritionCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [protein, carbs, fat],
                    backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }
}

// Animate progress bars
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 1.5s ease-in-out';
            bar.style.width = width;
        }, 300);
    });
}

// Auto-hide messages
function autoHideMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    });
}

// Initialize Live Stats
function initializeLiveStats() {
    function updateLiveStats() {
        const statsToUpdate = {
            'totalCalories': document.getElementById('totalCalories')?.textContent || 0,
            'streakDays': document.getElementById('streakDays')?.textContent || 0,
            'workoutsCompleted': document.getElementById('workoutsCompleted')?.textContent || 0
        };

        Object.entries(statsToUpdate).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
                const target = parseInt(value) || 0;
                if (current !== target) {
                    animateValue(element, current, target, 1000);
                }
            }
        });
    }

    // Update stats every 30 seconds
    setInterval(updateLiveStats, 30000);
}

// Animate number value
function animateValue(element, start, end, duration) {
    if (start === end) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Chatbot functionality
function initializeChatbot() {
    const chatbot = document.getElementById("chatbot");
    const chatIcon = document.getElementById("chat-icon");
    const userInput = document.getElementById("userInput");
    const chatWindow = document.getElementById("chat");

    if (!chatbot || !chatIcon) return;

    let voiceEnabled = true;

    function toggleChat() {
        chatbot.classList.toggle("visible");
        if (chatbot.classList.contains("visible")) {
            setTimeout(() => userInput?.focus(), 300);
        }
    }

    chatIcon.addEventListener("click", toggleChat);
    document.getElementById("close-chat")?.addEventListener("click", toggleChat);

    document.addEventListener("click", (e) => {
        if (!chatbot.contains(e.target) && !chatIcon.contains(e.target)) {
            chatbot.classList.remove("visible");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") chatbot.classList.remove("visible");
    });

    userInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    window.sendMessage = function() {
        if (!userInput || !chatWindow) return;

        const message = userInput.value.trim().toLowerCase();
        if (!message) return;

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-message';
        userMsg.textContent = userInput.value;
        chatWindow.appendChild(userMsg);

        userInput.value = '';

        // Bot response
        setTimeout(() => {
            let response = "I'm here to help with FitnessHub! You can ask about your stats, nutrition, or workouts.";

            if (message.includes('stat') || message.includes('progress')) {
                response = `Your current stats:\n• Meals: ${document.getElementById('totalMeals')?.textContent || 0}\n• Today's Calories: ${document.getElementById('totalCalories')?.textContent || 0}\n• Streak: ${document.getElementById('streakDays')?.textContent || 0} days\n• Workouts: ${document.getElementById('workoutsCompleted')?.textContent || 0}`;
            } else if (message.includes('nutrition') || message.includes('food') || message.includes('meal')) {
                response = "Nutrition tips:\n1. Eat balanced meals\n2. Stay hydrated\n3. Include protein in every meal\n4. Choose whole foods\n5. Track your macros";
            } else if (message.includes('workout') || message.includes('exercise')) {
                response = "Workout advice:\n1. Stay consistent\n2. Warm up properly\n3. Include strength training\n4. Don't forget cardio\n5. Rest and recover";
            } else if (message.includes('hi') || message.includes('hello')) {
                response = "Hello! I'm your Fitness AI assistant. How can I help you today?";
            }

            const botMsg = document.createElement('div');
            botMsg.className = 'message bot-message';
            botMsg.textContent = response;
            chatWindow.appendChild(botMsg);

            chatWindow.scrollTop = chatWindow.scrollHeight;

            // Voice response
            if (voiceEnabled && 'speechSynthesis' in window) {
                const speech = new SpeechSynthesisUtterance(response);
                speech.rate = 1.0;
                speech.pitch = 1.0;
                window.speechSynthesis.speak(speech);
            }
        }, 500);
    };

    window.sendQuickMessage = function(text) {
        if (userInput) {
            userInput.value = text;
            sendMessage();
        }
    };

    window.toggleVoice = function() {
        voiceEnabled = !voiceEnabled;
        const button = document.getElementById('toggle-voice');
        if (button) {
            button.innerHTML = `<i class="fas fa-volume-${voiceEnabled ? 'up' : 'mute'}"></i> Voice: ${voiceEnabled ? 'ON' : 'OFF'}`;
        }
    };

    // Initialize chatbot suggestions
    const suggestionsContainer = document.getElementById("suggestions");
    if (suggestionsContainer) {
        ['Show me my stats', 'Nutrition tips', 'Workout advice'].forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.onclick = () => sendQuickMessage(option);
            suggestionsContainer.appendChild(button);
        });
    }
}

// Handle responsive behavior
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    if (window.innerWidth >= 1024) {
        if (sidebar.classList.contains('active')) {
            mainContent.style.marginLeft = '280px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    } else {
        mainContent.style.marginLeft = '0';
        mainContent.style.transform = 'translateX(0)';
    }
});