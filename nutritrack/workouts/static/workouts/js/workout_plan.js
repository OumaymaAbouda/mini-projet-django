// Workout Plan Class - VERSION FINALE CORRIGÉE
class WorkoutPlan {
    constructor(data) {
        this.data = data;
        this.completedExercises = new Set();
        this.timerInterval = null;
        this.totalTime = 0;
        this.timeLeft = 0;
        this.isTimerRunning = false;
        this.currentTimerButton = null;
        this.listenersAttached = false; // Flag pour éviter d'attacher les listeners plusieurs fois
        this.init();
    }

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.setupTimerModal();
        this.setupCompletionModal();
        this.updateProgress();
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('fitnesshub_workout_progress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                this.completedExercises = new Set(progress.completedExercises || []);

                this.completedExercises.forEach(exerciseId => {
                    const button = document.querySelector(`.done-btn[data-exercise="${exerciseId}"]`);
                    if (button) {
                        this.markExerciseCompleted(button, false);
                    }
                });
            } catch (e) {
                console.error('Error loading progress:', e);
                localStorage.removeItem('fitnesshub_workout_progress');
            }
        }
    }

    saveProgress() {
        const progress = {
            completedExercises: Array.from(this.completedExercises),
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('fitnesshub_workout_progress', JSON.stringify(progress));
    }

    setupEventListeners() {
        // Control buttons (ne doivent être attachés qu'une fois)
        if (!this.listenersAttached) {
            document.getElementById('resetProgressBtn')?.addEventListener('click', () => this.resetProgress());
            document.getElementById('regenerateBtn')?.addEventListener('click', () => this.regeneratePlan());

            // Close timer modal
            document.getElementById('closeTimerBtn')?.addEventListener('click', () => this.closeTimerModal());
            
            this.listenersAttached = true;
        }
        
        // Réattacher les listeners pour les boutons d'exercices (peuvent être recréés)
        this.reattachEventListeners();
    }

    reattachEventListeners() {
        // Done buttons - réattacher les listeners
        document.querySelectorAll('.done-btn').forEach(btn => {
            // Vérifier si le listener n'est pas déjà attaché
            if (!btn.dataset.listenerAttached) {
                btn.addEventListener('click', (e) => this.handleExerciseComplete(e));
                btn.dataset.listenerAttached = 'true';
            }
        });

        // Timer buttons - OUVRE DIRECTEMENT LE POPUP
        document.querySelectorAll('.timer-btn').forEach(btn => {
            // Vérifier si le listener n'est pas déjà attaché
            if (!btn.dataset.listenerAttached) {
                btn.addEventListener('click', (e) => this.openTimerModalFromButton(e));
                btn.dataset.listenerAttached = 'true';
            }
        });
    }

    handleExerciseComplete(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const exerciseId = button.dataset.exercise;
        const dayNumber = button.dataset.day;
        const isCompleted = button.classList.contains('completed');

        if (isCompleted) {
            this.unmarkExerciseCompleted(button, exerciseId);
            // Supprimer l'exercice de la base de données
            this.unlogExerciseFromServer(button);
            this.showToast('Exercise unmarked');
        } else {
            this.markExerciseCompleted(button, exerciseId);
            this.showCompletionAnimation(button, exerciseId);
            this.showCompletionModal(exerciseId, dayNumber);
            // Nouvelle logique : enregistrer l'exercice complété dans la base
            this.logExerciseToServer(button);
        }

        this.updateProgress();
        this.saveProgress();
    }

    markExerciseCompleted(button, exerciseId, animate = true) {
        button.classList.add('completed');
        button.innerHTML = '<i class="fas fa-check-circle"></i><span>Completed</span>';

        const card = button.closest('.exercise-card');
        card.classList.add('completed');

        if (exerciseId) {
            this.completedExercises.add(exerciseId);
        }

        // Update day completion status
        const dayCard = button.closest('.day-card');
        const exercisesInDay = dayCard.querySelectorAll('.done-btn').length;
        const completedInDay = dayCard.querySelectorAll('.done-btn.completed').length;

        if (exercisesInDay > 0 && completedInDay === exercisesInDay) {
            dayCard.classList.add('completed');
        }
    }

    unmarkExerciseCompleted(button, exerciseId) {
        button.classList.remove('completed');
        button.innerHTML = '<i class="far fa-circle"></i><span>Mark Done</span>';

        const card = button.closest('.exercise-card');
        card.classList.remove('completed');

        if (exerciseId) {
            this.completedExercises.delete(exerciseId);
        }

        // Update day completion status
        const dayCard = button.closest('.day-card');
        dayCard.classList.remove('completed');
    }

    showCompletionAnimation(button, exerciseId) {
        const card = button.closest('.exercise-card');

        // Create confetti effect
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.innerHTML = `
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
        `;

        card.appendChild(confetti);

        // Scale animation
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = '';
            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }, 300);
    }

    setupTimerModal() {
        this.timerModal = document.getElementById('timerModal');
        this.timerExerciseName = document.getElementById('timerExerciseName');
        this.timerMinutes = document.getElementById('timerMinutes');
        this.timerSeconds = document.getElementById('timerSeconds');
        this.timerProgress = document.querySelector('.timer-progress');
        this.timerInfoText = document.getElementById('timerInfoText');

        // Close modal when clicking outside
        this.timerModal?.addEventListener('click', (e) => {
            if (e.target === this.timerModal) {
                this.closeTimerModal();
            }
        });
    }

    openTimerModalFromButton(event) {
        event.preventDefault();

        const button = event.currentTarget;
        const timeMinutes = parseInt(button.dataset.time) || 1;
        const exerciseName = button.dataset.exercise || 'Exercise';

        // Stop any existing timer
        this.stopTimerCompletely();

        // Save current button
        this.currentTimerButton = button;

        // Set timer values
        this.totalTime = timeMinutes * 60;
        this.timeLeft = this.totalTime;

        // Update display
        this.timerExerciseName.textContent = exerciseName;
        this.timerInfoText.textContent = `${timeMinutes} minute timer for ${exerciseName}`;
        this.updateTimerDisplay();

        // Update button state TEMPORAIREMENT
        if (button) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.classList.add('running');
            button.innerHTML = '<i class="fas fa-stopwatch"></i><span>Timer Running</span>';
        }

        // Show modal
        this.timerModal.classList.add('active');

        // Start timer IMMÉDIATEMENT
        this.startTimer();
    }

    startTimer() {
        if (this.isTimerRunning || this.timeLeft <= 0) return;

        this.isTimerRunning = true;

        // Start interval
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    stopTimerCompletely() {
        // Stop the timer
        this.isTimerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimerButton() {
        if (this.currentTimerButton) {
            this.currentTimerButton.classList.remove('running');
            if (this.currentTimerButton.dataset.originalText) {
                this.currentTimerButton.innerHTML = this.currentTimerButton.dataset.originalText;
            } else {
                this.currentTimerButton.innerHTML = '<i class="fas fa-play"></i><span>Start Timer</span>';
            }
            delete this.currentTimerButton.dataset.originalText;
            this.currentTimerButton = null;
        }
    }

    closeTimerModal() {
        // Arrêter le timer
        this.stopTimerCompletely();

        // Reset le bouton à l'état normal
        this.resetTimerButton();

        // Fermer la modale
        this.timerModal.classList.remove('active');

        this.showToast('Timer closed');
    }

    updateTimerDisplay() {
        if (this.timeLeft < 0) {
            this.timeLeft = 0;
        }

        // Calculate minutes and seconds
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;

        // Update time text
        this.timerMinutes.textContent = minutes.toString().padStart(2, '0');
        this.timerSeconds.textContent = seconds.toString().padStart(2, '0');

        // Update progress circle
        if (this.timerProgress && this.totalTime > 0) {
            const radius = 90;
            const circumference = 2 * Math.PI * radius;
            const progress = this.timeLeft / this.totalTime;
            const offset = circumference * (1 - progress);

            this.timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
            this.timerProgress.style.strokeDashoffset = offset;

            // Change color when time is low
            if (this.timeLeft <= 10) {
                this.timerProgress.style.stroke = '#ef4444';
            } else {
                this.timerProgress.style.stroke = '#8b5cf6';
            }
        }
    }

    timerComplete() {
        // Stop the timer
        this.stopTimerCompletely();

        // Set time to 0
        this.timeLeft = 0;
        this.updateTimerDisplay();

        // Play sound
        this.playBeep();

        // Show completion message
        this.showToast('⏰ Timer completed!');

        // Auto-close after delay
        setTimeout(() => {
            this.resetTimerButton();
            this.timerModal.classList.remove('active');
        }, 2000);
    }

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Audio not supported
        }
    }

    setupCompletionModal() {
        this.completionModal = document.getElementById('completionModal');
        this.completionMessage = document.getElementById('completionMessage');

        // Close when clicking outside
        this.completionModal?.addEventListener('click', (e) => {
            if (e.target === this.completionModal) {
                this.completionModal.classList.remove('active');
            }
        });
    }

    showCompletionModal(exerciseId, dayNumber, isTimer = false) {
        let message = isTimer
            ? 'Timer completed! Keep up the great work!'
            : this.getMotivationalMessage();

        this.completionMessage.textContent = message;
        this.completionModal.classList.add('active');

        // Auto-close after 3 seconds
        setTimeout(() => {
            this.completionModal.classList.remove('active');
        }, 3000);
    }

    getMotivationalMessage() {
        const totalExercises = document.querySelectorAll('.done-btn').length;
        const completedExercises = this.completedExercises.size;
        const percentage = Math.round((completedExercises / totalExercises) * 100);

        if (percentage === 0) return 'Start your first exercise!';
        if (percentage < 25) return 'Great start! Keep going!';
        if (percentage < 50) return 'You\'re making progress!';
        if (percentage < 75) return 'More than halfway there!';
        if (percentage < 100) return 'Almost there! Finish strong!';
        return 'Amazing! You completed the entire plan!';
    }

    updateProgress() {
        const allExercises = document.querySelectorAll('.done-btn');
        const completedExercises = document.querySelectorAll('.done-btn.completed');

        const total = allExercises.length;
        const completed = completedExercises.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        // Update percentage
        const percentageDisplay = document.getElementById('progressPercentage');
        if (percentageDisplay) {
            percentageDisplay.textContent = `${percentage}% Complete`;
        }

        // Update progress message
        const progressMessage = document.getElementById('progressMessage');
        if (progressMessage) {
            progressMessage.textContent = this.getMotivationalMessage();
        }

        // Update milestones
        document.querySelectorAll('.milestone').forEach(milestone => {
            const milestonePercent = parseInt(milestone.dataset.percent);
            milestone.classList.toggle('active', percentage >= milestonePercent);
        });

        // Update stats
        this.updateStats();
    }

    updateStats() {
        const completedExercises = document.querySelectorAll('.done-btn.completed');
        const completedCount = completedExercises.length;

        // Calculate total minutes
        let totalMinutes = 0;
        completedExercises.forEach(btn => {
            const timeElement = btn.closest('.exercise-card')?.querySelector('.detail-item:nth-child(3) .detail-value');
            if (timeElement) {
                totalMinutes += parseInt(timeElement.textContent) || 0;
            }
        });

        // Calculate completed days
        let completedDays = 0;
        document.querySelectorAll('.day-card').forEach(day => {
            const exercises = day.querySelectorAll('.done-btn');
            const completed = day.querySelectorAll('.done-btn.completed');
            if (exercises.length > 0 && exercises.length === completed.length) {
                completedDays++;
            }
        });

        // Update UI
        const daysCompleted = document.getElementById('daysCompleted');
        const exercisesCompleted = document.getElementById('exercisesCompleted');
        const totalMinutesElement = document.getElementById('totalMinutes');
        const caloriesBurnedElement = document.getElementById('caloriesBurned');

        if (daysCompleted) daysCompleted.textContent = completedDays;
        if (exercisesCompleted) exercisesCompleted.textContent = completedCount;
        if (totalMinutesElement) totalMinutesElement.textContent = totalMinutes;
        if (caloriesBurnedElement) caloriesBurnedElement.textContent = Math.round(totalMinutes * 5);
    }

    // --- Enregistrement minimal dans la base Django ---
    getCsrfToken() {
        // Essayer de récupérer depuis un meta tag (si présent)
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // Sinon, chercher dans les cookies
        const name = 'csrftoken';
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        
        // Essayer de récupérer depuis un input hidden (si présent dans un formulaire)
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) {
            return csrfInput.value;
        }
        
        return null;
    }

    logExerciseToServer(button) {
        const exerciseCard = button.closest('.exercise-card');
        if (!exerciseCard) return;

        const title = exerciseCard.querySelector('.exercise-title')?.textContent?.trim() || '';
        
        // Extraire tous les détails de l'exercice
        const detailItems = exerciseCard.querySelectorAll('.detail-item');
        let sets = 0;
        let reps = 0;
        let timeMinutes = 0;
        let restSeconds = 0;
        
        // Sets (1er detail-item)
        if (detailItems[0]) {
            const setsValue = detailItems[0].querySelector('.detail-value')?.textContent?.trim();
            sets = parseInt(setsValue) || 0;
        }
        
        // Reps (2ème detail-item)
        if (detailItems[1]) {
            const repsValue = detailItems[1].querySelector('.detail-value')?.textContent?.trim();
            reps = parseInt(repsValue) || 0;
        }
        
        // Time (3ème detail-item)
        if (detailItems[2]) {
            const timeText = detailItems[2].querySelector('.detail-value')?.textContent?.trim();
            const timeMatch = timeText.match(/(\d+)/);
            timeMinutes = timeMatch ? parseInt(timeMatch[1]) : 0;
        }
        
        // Rest (4ème detail-item)
        if (detailItems[3]) {
            const restText = detailItems[3].querySelector('.detail-value')?.textContent?.trim();
            const restMatch = restText.match(/(\d+)/);
            restSeconds = restMatch ? parseInt(restMatch[1]) : 0;
        }
        
        // Extraire la catégorie depuis le badge
        const category = exerciseCard.querySelector('.exercise-badge')?.textContent?.trim() || '';
        
        // Extraire le jour depuis le bouton
        const dayNumber = button.dataset.day || '';

        if (!title) {
            console.error('Cannot log exercise: missing title');
            return;
        }

        const payload = {
            name: title,
            time_minutes: timeMinutes,
            sets: sets,
            reps: reps,
            rest_seconds: restSeconds,
            category: category,
            day: dayNumber ? `Day ${dayNumber}` : '',
        };

        console.log('Logging exercise to server:', payload);

        fetch('/workouts/log_exercise/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken(),
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === 'ok') {
                    console.log('Exercise logged successfully in ExerciseLog:', data);
                    this.showToast(`✅ ${title} enregistré dans ExerciseLog`);
                } else {
                    console.error('Error from server:', data);
                    this.showToast('Erreur lors de la sauvegarde du workout');
                }
            })
            .catch((error) => {
                console.error('Error logging exercise:', error);
                this.showToast('Erreur réseau, progression locale seulement');
            });
    }

    unlogExerciseFromServer(button) {
        const exerciseCard = button.closest('.exercise-card');
        if (!exerciseCard) return;

        const title = exerciseCard.querySelector('.exercise-title')?.textContent?.trim() || '';
        
        if (!title) {
            console.error('Cannot unlog exercise: missing title');
            return;
        }

        const payload = {
            name: title,
        };

        console.log('Unlogging exercise from server:', payload);

        fetch('/workouts/unlog_exercise/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken(),
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === 'ok') {
                    console.log('Exercise unlogged successfully:', data);
                    // Pas besoin de toast pour la suppression, c'est déjà fait dans handleExerciseComplete
                } else {
                    console.error('Error from server:', data);
                }
            })
            .catch((error) => {
                console.error('Error unlogging exercise:', error);
                // Pas d'affichage d'erreur pour ne pas perturber l'utilisateur
            });
    }

    resetAllExercisesFromServer() {
        console.log('Resetting all exercises from server...');

        fetch('/workouts/reset_all_exercises/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken(),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === 'ok') {
                    console.log('All exercises reset successfully:', data);
                } else {
                    console.error('Error from server:', data);
                }
            })
            .catch((error) => {
                console.error('Error resetting exercises:', error);
                // Pas d'affichage d'erreur pour ne pas perturber l'utilisateur
            });
    }

    showToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;

        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    downloadPlan() {
        const planData = {
            goal: this.data.goal,
            generated: new Date().toISOString(),
            totalDays: this.data.totalDays,
            totalExercises: this.data.totalExercises,
            completedExercises: Array.from(this.completedExercises),
            progressPercentage: Math.round((this.completedExercises.size / this.data.totalExercises) * 100),
            days: []
        };

        document.querySelectorAll('.day-card').forEach(day => {
            const dayData = {
                day: day.querySelector('.day-info h2').textContent,
                date: day.querySelector('.day-calories').textContent.replace('📅 ', ''),
                exercises: []
            };

            day.querySelectorAll('.exercise-card').forEach(exercise => {
                const exerciseData = {
                    name: exercise.querySelector('.exercise-title').textContent,
                    category: exercise.querySelector('.exercise-badge').textContent,
                    sets: exercise.querySelectorAll('.detail-item')[0]?.querySelector('.detail-value')?.textContent || '',
                    reps: exercise.querySelectorAll('.detail-item')[1]?.querySelector('.detail-value')?.textContent || '',
                    time: exercise.querySelectorAll('.detail-item')[2]?.querySelector('.detail-value')?.textContent || '',
                    rest: exercise.querySelectorAll('.detail-item')[3]?.querySelector('.detail-value')?.textContent || '',
                    completed: exercise.querySelector('.done-btn').classList.contains('completed')
                };
                dayData.exercises.push(exerciseData);
            });

            planData.days.push(dayData);
        });

        const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitnesshub-workout-plan-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('📁 Workout plan downloaded successfully!');
    }

    shareProgress() {
        const completedExercises = this.completedExercises.size;
        const totalExercises = this.data.totalExercises;
        const percentage = Math.round((completedExercises / totalExercises) * 100);

        const shareText = `🏋️ I've completed ${percentage}% of my FitnessHub workout plan!\n` +
                        `✅ ${completedExercises}/${totalExercises} exercises completed\n` +
                        `🎯 Goal: ${this.data.goal}\n` +
                        `🔥 #FitnessHub #WorkoutJourney`;

        if (navigator.share) {
            navigator.share({
                title: 'My FitnessHub Progress',
                text: shareText,
                url: window.location.href
            }).catch(error => {
                console.log('Share error:', error);
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('📋 Progress copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed: ', err);
            this.showToast('❌ Failed to copy to clipboard');
        });
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
            this.completedExercises.clear();
            localStorage.removeItem('fitnesshub_workout_progress');

            // Reset all done buttons
            document.querySelectorAll('.done-btn.completed').forEach(btn => {
                this.unmarkExerciseCompleted(btn, btn.dataset.exercise);
            });

            // Reset all timer buttons
            document.querySelectorAll('.timer-btn.running').forEach(btn => {
                btn.classList.remove('running');
                if (btn.dataset.originalText) {
                    btn.innerHTML = btn.dataset.originalText;
                    delete btn.dataset.originalText;
                } else {
                    btn.innerHTML = '<i class="fas fa-play"></i><span>Start Timer</span>';
                }
            });

            // Reset day cards
            document.querySelectorAll('.day-card.completed').forEach(card => {
                card.classList.remove('completed');
            });

            // Supprimer tous les exercices de la base de données
            this.resetAllExercisesFromServer();

            this.updateProgress();
            this.showToast('🔄 Progress reset successfully!');
        }
    }

    regeneratePlan() {
        if (confirm('Do you want to generate a new workout plan? Your current progress will be saved locally.')) {
            this.showToast('🔄 Regenerating workout plan...');
            
            // Envoyer une requête pour générer un nouveau plan
            fetch('/workouts/regenerate_plan/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
            })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === 'ok') {
                    console.log('New plan generated:', data);
                    // Mettre à jour la page avec le nouveau plan
                    this.updatePlanWithNewData(data.plan);
                    // Mettre à jour les stats avec les valeurs du serveur
                    if (data.total_exercises !== undefined && data.total_minutes !== undefined) {
                        this.updateWeeklyStatsFromServer(data.total_exercises, data.total_minutes);
                    } else {
                        this.updateWeeklyStats(data.plan);
                    }
                    this.showToast('✅ Nouveau plan généré avec succès!');
                } else {
                    console.error('Error from server:', data);
                    this.showToast('Erreur lors de la génération du plan');
                }
            })
            .catch((error) => {
                console.error('Error regenerating plan:', error);
                this.showToast('Erreur réseau, rechargement de la page...');
                // En cas d'erreur, recharger la page
                setTimeout(() => {
                    window.location.href = '/workouts/plan_workout/';
                }, 1500);
            });
        }
    }

    updatePlanWithNewData(newPlan) {
        const workoutDaysSection = document.querySelector('.workout-days');
        if (!workoutDaysSection) return;

        // Sauvegarder la progression actuelle
        const currentCompleted = new Set(this.completedExercises);

        // Vider la section
        workoutDaysSection.innerHTML = '';

        // Recréer tous les jours avec le nouveau plan
        newPlan.forEach((day, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const dayCard = this.createDayCard(day, dayNumber);
            workoutDaysSection.appendChild(dayCard);
        });

        // Réinitialiser la progression (nouveau plan = nouveau start)
        this.completedExercises.clear();
        this.saveProgress();
        
        // Réattacher les event listeners pour les nouveaux éléments
        this.reattachEventListeners();
        
        // Mettre à jour l'affichage
        this.updateProgress();
        
        // Mettre à jour les statistiques hebdomadaires
        this.updateWeeklyStats(newPlan);
    }

    createDayCard(day, dayNumber) {
        const dayCard = document.createElement('article');
        dayCard.className = 'day-card workout-day';
        dayCard.setAttribute('data-day', dayNumber);

        const categoriesCount = new Set(day.exercises.map(ex => ex.category)).size;

        dayCard.innerHTML = `
            <div class="day-header">
                <div class="day-title">
                    <div class="day-number">${dayNumber}</div>
                    <div class="day-info">
                        <h2>${day.day}</h2>
                        <p class="day-calories">
                            <i class="far fa-calendar"></i> ${day.date}
                        </p>
                    </div>
                </div>

                <div class="day-stats">
                    <div class="stat">
                        <span class="stat-value">${day.total_time}</span>
                        <span class="stat-label">Minutes</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${day.exercises.length}</span>
                        <span class="stat-label">Exercises</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${categoriesCount}</span>
                        <span class="stat-label">Categories</span>
                    </div>
                </div>
            </div>

            <div class="exercises-grid">
                ${day.exercises.map(ex => this.createExerciseCard(ex, dayNumber)).join('')}
            </div>
        `;

        return dayCard;
    }

    createExerciseCard(exercise, dayNumber) {
        const exerciseId = exercise.id || `${exercise.name.toLowerCase().replace(/ /g, '-')}-${dayNumber}`;
        // Utiliser le chemin statique passé depuis le template, ou fallback sur le chemin par défaut
        const staticUrl = typeof STATIC_IMAGES_URL !== 'undefined' ? STATIC_IMAGES_URL : '/static/workouts/images/';
        
        return `
            <div class="exercise-card" data-exercise-id="${exerciseId}">
                <div class="exercise-image-container">
                    <img src="${staticUrl}${exercise.image}"
                         alt="${exercise.name}"
                         class="exercise-image"
                         onerror="this.src='https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop'">
                    <div class="exercise-badge">
                        <i class="fas fa-dumbbell"></i>
                        ${exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                    </div>
                </div>

                <div class="exercise-content">
                    <div class="exercise-header">
                        <h3 class="exercise-title">${exercise.name}</h3>
                    </div>

                    <div class="exercise-details">
                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-redo"></i>
                            </div>
                            <div class="detail-info">
                                <span class="detail-label">Sets</span>
                                <span class="detail-value">${exercise.sets}</span>
                            </div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-sync-alt"></i>
                            </div>
                            <div class="detail-info">
                                <span class="detail-label">Reps</span>
                                <span class="detail-value">${exercise.reps}</span>
                            </div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-stopwatch"></i>
                            </div>
                            <div class="detail-info">
                                <span class="detail-label">Time</span>
                                <span class="detail-value">${exercise.time} min</span>
                            </div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-bed"></i>
                            </div>
                            <div class="detail-info">
                                <span class="detail-label">Rest</span>
                                <span class="detail-value">${exercise.rest}s</span>
                            </div>
                        </div>
                    </div>

                    <div class="exercise-actions">
                        <button class="action-btn done-btn"
                                data-exercise="${exerciseId}"
                                data-day="${dayNumber}">
                            <i class="far fa-circle"></i>
                            <span>Mark Done</span>
                        </button>

                        <button class="action-btn timer-btn"
                                data-time="${exercise.time}"
                                data-exercise="${exercise.name}">
                            <i class="fas fa-play"></i>
                            <span>Start Timer</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateWeeklyStats(plan) {
        const totalExercises = plan.reduce((sum, day) => sum + day.exercises.length, 0);
        const totalMinutes = plan.reduce((sum, day) => sum + day.total_time, 0);
        this.updateWeeklyStatsFromServer(totalExercises, totalMinutes);
    }

    updateWeeklyStatsFromServer(totalExercises, totalMinutes) {
        // S'assurer que les valeurs sont toujours définies (au moins 0)
        totalExercises = totalExercises || 0;
        totalMinutes = totalMinutes || 0;
        
        // Mettre à jour les statistiques dans le footer de la sidebar si elles existent
        const totalExercisesElement = document.querySelector('.sidebar-footer p:last-child');
        if (totalExercisesElement) {
            totalExercisesElement.innerHTML = `<i class="fas fa-fire"></i> ${totalExercises} exercises`;
        }
        
        // Mettre à jour les stats dans la section weekly stats si elles existent
        const weeklyStatsSection = document.querySelector('.weekly-stats');
        if (weeklyStatsSection) {
            const statCards = weeklyStatsSection.querySelectorAll('.stat-card');
            
            // Total Exercises (première carte) - toujours afficher une valeur
            if (statCards[0]) {
                const pElement = statCards[0].querySelector('p');
                if (pElement) {
                    pElement.textContent = totalExercises;
                }
            }
            
            // Total Time (deuxième carte) - toujours afficher une valeur
            if (statCards[1]) {
                const pElement = statCards[1].querySelector('p');
                if (pElement) {
                    pElement.textContent = `${totalMinutes} minutes`;
                }
            }
            
            // Goal Focus (troisième carte) - reste inchangé
            // Program Duration (quatrième carte) - reste inchangé
        }
    }

    cleanup() {
        // Arrêter tous les timers
        this.stopTimerCompletely();

        // Réinitialiser tous les boutons de timer
        this.resetTimerButton();
    }
}

// Initialize when page loads (comportement d'origine)
document.addEventListener('DOMContentLoaded', function() {
    // Check if workout plan data exists
    const workoutPlanData = window.workoutPlanData || {
        goal: document.querySelector('.goal-display h3')?.textContent?.replace('Goal: ', '') || 'Fitness',
        totalExercises: parseInt(document.querySelector('.sidebar-footer p:nth-child(2)')?.textContent?.match(/\d+/) || '0'),
        totalDays: document.querySelectorAll('.day-card').length,
        days: []
    };

    // Initialize workout plan
    const workoutPlan = new WorkoutPlan(workoutPlanData);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Store instance globally for cleanup
    window.workoutPlanInstance = workoutPlan;

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (window.workoutPlanInstance) {
            window.workoutPlanInstance.cleanup();
        }
    });
});