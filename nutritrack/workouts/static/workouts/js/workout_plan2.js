class WorkoutPlan {
    constructor(data) {
        this.data = data;
        this.completedExercises = new Set();
        this.timerInterval = null;
        this.totalTime = 0;
        this.timeLeft = 0;
        this.isTimerRunning = false;
        this.currentTimerButton = null;
        this.init();
    }

    init() {
        this.loadCompletedExercisesFromDB();
        this.setupEventListeners();
        this.setupTimerModal();
        this.setupCompletionModal();
        this.updateProgress();
    }

    // --- 1. CHARGEMENT BASE DE DONNÉES ---
    async loadCompletedExercisesFromDB() {
        try {
            const response = await fetch('/workouts/api/completed-exercises/');
            const result = await response.json();

            if (result.success) {
                result.completed_exercises.forEach(ex => {
                    this.completedExercises.add(ex.exercise_id);
                    const btn = document.querySelector(`.done-btn[data-exercise="${ex.exercise_id}"]`);
                    if (btn) this.markExerciseCompletedUI(btn, false);
                });
                this.updateProgress();
            }
        } catch (error) {
            console.error('Erreur chargement DB:', error);
        }
    }

    // --- 2. ÉVÉNEMENTS ---
    setupEventListeners() {
        document.body.addEventListener('click', (e) => {
            const doneBtn = e.target.closest('.done-btn');
            if (doneBtn) this.handleExerciseToggle(e, doneBtn);

            const timerBtn = e.target.closest('.timer-btn');
            if (timerBtn) this.openTimerModalFromButton(e, timerBtn);

            if (e.target.id === 'downloadPlanBtn') this.downloadPlan();
            if (e.target.id === 'resetProgressBtn') this.resetProgress();
        });

        document.getElementById('closeTimerBtn')?.addEventListener('click', () => this.closeTimerModal());
    }

    async handleExerciseToggle(e, btn) {
        e.preventDefault();
        const exerciseId = btn.dataset.exercise;
        const isCompleted = btn.classList.contains('completed');
        const dayNumber = btn.dataset.day;

        if (isCompleted) {
            // Désélectionner
            this.unmarkExerciseCompletedUI(btn);
            this.completedExercises.delete(exerciseId);
            this.showToast('Exercise unmarked');
            await this.apiCall('/workouts/api/unmark-completed/', { exercise_id: exerciseId });
        } else {
            // Sélectionner (Mark Done)
            this.markExerciseCompletedUI(btn);
            this.completedExercises.add(exerciseId);

            // Animation et Popup
            this.showConfetti(btn);
            this.showCompletionModal();

            // Sauvegarde DB
            const card = btn.closest('.exercise-card');
            const name = card.querySelector('.exercise-title').textContent;
            await this.apiCall('/workouts/api/mark-completed/', {
                exercise_id: exerciseId,
                exercise_name: name,
                workout_day: dayNumber
            });
        }
        this.updateProgress();
    }

    // --- 3. UI HELPERS (Styles CSS) ---
    markExerciseCompletedUI(btn) {
        btn.classList.add('completed');
        btn.innerHTML = '<i class="fas fa-check-circle"></i><span>Completed</span>';

        const card = btn.closest('.exercise-card');
        if (card) card.classList.add('completed');

        this.checkDayCompletion(btn);
    }

    unmarkExerciseCompletedUI(btn) {
        btn.classList.remove('completed');
        btn.innerHTML = '<i class="far fa-circle"></i><span>Mark Done</span>';

        const card = btn.closest('.exercise-card');
        if (card) card.classList.remove('completed');

        this.checkDayCompletion(btn);
    }

    checkDayCompletion(btn) {
        const dayCard = btn.closest('.day-card');
        if (!dayCard) return;

        const total = dayCard.querySelectorAll('.done-btn').length;
        const done = dayCard.querySelectorAll('.done-btn.completed').length;

        if (total > 0 && total === done) dayCard.classList.add('completed');
        else dayCard.classList.remove('completed');
    }

    // --- 4. ANIMATIONS & MODALS ---
    showConfetti(btn) {
        const card = btn.closest('.exercise-card');
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        for (let i = 0; i < 5; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.appendChild(piece);
        }

        card.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1000);
    }

    setupCompletionModal() {
        this.completionModal = document.getElementById('completionModal');
        this.completionModal?.addEventListener('click', (e) => {
            if(e.target === this.completionModal) this.completionModal.classList.remove('active');
        });
    }

    showCompletionModal() {
        if (this.completionModal) {
            this.completionModal.classList.add('active');
            setTimeout(() => this.completionModal.classList.remove('active'), 2500);
        }
    }

    // --- 5. TIMER LOGIC ---
    setupTimerModal() {
        this.timerModal = document.getElementById('timerModal');
        this.timerMinutes = document.getElementById('timerMinutes');
        this.timerSeconds = document.getElementById('timerSeconds');
        this.timerProgress = document.querySelector('.timer-progress');

        this.timerModal?.addEventListener('click', (e) => {
            if (e.target === this.timerModal) this.closeTimerModal();
        });
    }

    openTimerModalFromButton(e, btn) {
        e.preventDefault();
        const minutes = parseInt(btn.dataset.time) || 1;
        const name = btn.dataset.exercise || 'Exercise';

        this.stopTimerCompletely();
        this.currentTimerButton = btn;

        this.totalTime = minutes * 60;
        this.timeLeft = this.totalTime;

        document.getElementById('timerExerciseName').textContent = name;
        this.updateTimerDisplay();

        // UI Button Running State
        btn.classList.add('running');
        btn.innerHTML = '<i class="fas fa-stopwatch"></i><span>Running...</span>';

        this.timerModal.classList.add('active');
        this.startTimer();
    }

    startTimer() {
        if (this.isTimerRunning) return;
        this.isTimerRunning = true;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.timerComplete();
        }, 1000);
    }

    updateTimerDisplay() {
        if (this.timeLeft < 0) this.timeLeft = 0;
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');

        if (this.timerMinutes) this.timerMinutes.textContent = m;
        if (this.timerSeconds) this.timerSeconds.textContent = s;

        if (this.timerProgress && this.totalTime > 0) {
            const circumference = 2 * Math.PI * 90;
            const offset = circumference * (1 - (this.timeLeft / this.totalTime));
            this.timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
            this.timerProgress.style.strokeDashoffset = offset;
        }
    }

    timerComplete() {
        this.stopTimerCompletely();
        this.showToast('⏰ Timer Finished!');
        this.playBeep();
        setTimeout(() => this.closeTimerModal(), 2000);
    }

    stopTimerCompletely() {
        this.isTimerRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    closeTimerModal() {
        this.stopTimerCompletely();
        if (this.currentTimerButton) {
            this.currentTimerButton.classList.remove('running');
            this.currentTimerButton.innerHTML = '<i class="fas fa-play"></i><span>Start Timer</span>';
            this.currentTimerButton = null;
        }
        if (this.timerModal) this.timerModal.classList.remove('active');
    }

    playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
    }

    // --- 6. UTILS ---
    updateProgress() {
        const total = document.querySelectorAll('.done-btn').length;
        const completed = this.completedExercises.size;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = `${percent}%`;

        const txt = document.getElementById('progressPercentage');
        if (txt) txt.textContent = `${percent}% Complete`;

        const count = document.getElementById('exercisesCompleted');
        if (count) count.textContent = completed;
    }

    async apiCall(url, data) {
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("API Error", e);
        }
    }

    showToast(msg) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    downloadPlan() { this.showToast('Download started...'); }

    resetProgress() {
        if(confirm("Reset all progress?")) {
            window.location.href = '/workouts/clear-progress/';
        }
    }
}