class BAMFQuiz {
    constructor() {
        this.questionsDE = [];
        this.questionsEN = [];
        this.currentQuestionIndex = 0;
        this.currentMode = 'quiz';
        this.currentLanguage = 'de';
        this.userAnswers = [];
        this.stats = { correct: 0, wrong: 0 };
        
        this.init();
    }

    async init() {
        try {
            await this.loadQuestions();
            this.setupEventListeners();
            this.loadUserProgress();
            this.showQuestion();
            this.updateStats();
        } catch (error) {
            console.error('Failed to initialize quiz:', error);
            this.showError('Failed to load questions. Please try refreshing the page.');
        }
    }

    async loadQuestions() {
        try {
            // Load German questions
            const responseDE = await fetch('./bamf-questions.json');
            if (!responseDE.ok) {
                throw new Error(`HTTP error loading German questions! status: ${responseDE.status}`);
            }
            const dataDE = await responseDE.json();
            this.questionsDE = dataDE.questions || [];
            
            // Load English questions
            const responseEN = await fetch('./bamf-questions-en.json');
            if (!responseEN.ok) {
                throw new Error(`HTTP error loading English questions! status: ${responseEN.status}`);
            }
            const dataEN = await responseEN.json();
            this.questionsEN = dataEN.questions || [];
            
            if (this.questionsDE.length === 0 || this.questionsEN.length === 0) {
                throw new Error('No questions found in data files');
            }
            
            console.log(`Loaded ${this.questionsDE.length} German questions and ${this.questionsEN.length} English questions`);
        } catch (error) {
            console.error('Error loading questions:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Language selector
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.showQuestion();
        });

        // Mode selector
        document.getElementById('mode-select').addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            this.showQuestion();
        });

        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });

        // Random question button
        document.getElementById('random-question').addEventListener('click', () => {
            this.showRandomQuestion();
        });

        // Reset progress button
        document.getElementById('reset-progress').addEventListener('click', () => {
            this.resetProgress();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousQuestion();
            if (e.key === 'ArrowRight') this.nextQuestion();
            if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                this.selectOption(optionIndex);
            }
        });
    }

    get currentQuestions() {
        return this.currentLanguage === 'en' || this.currentLanguage === 'both' ? this.questionsEN : this.questionsDE;
    }

    showQuestion() {
        if (this.currentQuestions.length === 0) return;

        const question = this.currentQuestions[this.currentQuestionIndex];
        if (!question) return;

        // Update question number and progress
        document.getElementById('question-number').textContent = `Question ${question.number}`;
        document.getElementById('progress-text').textContent = `Question ${this.currentQuestionIndex + 1} of ${this.currentQuestions.length}`;
        
        const progressPercentage = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercentage}%`;

        // Show question text based on language mode
        this.displayQuestionText(question);

        // Show options
        this.showOptions(question);

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('next-btn').disabled = this.currentQuestionIndex === this.currentQuestions.length - 1;

        // Update question card mode styling
        const questionCard = document.getElementById('question-card');
        questionCard.className = this.currentMode === 'answers' ? 'question-card answers-only-mode' : 'question-card';

        // Handle different modes
        const feedbackEl = document.getElementById('feedback');
        if (this.currentMode === 'quiz') {
            feedbackEl.style.display = 'none';
        } else if (this.currentMode === 'answers') {
            this.showAnswerOnly(question);
        } else {
            this.showCorrectAnswer(question);
        }
    }

    showOptions(question) {
        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option';
            optionEl.setAttribute('tabindex', '0');
            
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            
            if (this.currentLanguage === 'both') {
                // Show both German and English options
                const germanQuestion = this.questionsDE[this.currentQuestionIndex];
                const englishQuestion = this.questionsEN[this.currentQuestionIndex];
                
                optionEl.innerHTML = `
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">
                        <div class="bilingual-text">
                            <div class="text-german">
                                <div class="text-label">Deutsch</div>
                                <div>${germanQuestion.options[index]}</div>
                            </div>
                            <div class="text-english">
                                <div class="text-label">English</div>
                                <div>${englishQuestion.options[index]}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Show single language option
                optionEl.innerHTML = `
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">${option}</div>
                `;
            }

            // Add click handler
            optionEl.addEventListener('click', () => {
                if (this.currentMode === 'quiz') {
                    this.selectOption(index);
                }
            });

            // Add keyboard handler
            optionEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (this.currentMode === 'quiz') {
                        this.selectOption(index);
                    }
                }
            });

            // Show correct answer in study mode
            if (this.currentMode === 'study') {
                if (option === question.correctAnswer) {
                    optionEl.classList.add('correct');
                }
            }

            optionsContainer.appendChild(optionEl);
        });
    }

    selectOption(selectedIndex) {
        if (this.currentMode !== 'quiz') return;

        const question = this.currentQuestions[this.currentQuestionIndex];
        const selectedOption = question.options[selectedIndex];
        const isCorrect = selectedOption === question.correctAnswer;

        // Save user answer
        this.userAnswers[this.currentQuestionIndex] = {
            questionNumber: question.number,
            selectedOption,
            isCorrect,
            timestamp: new Date()
        };

        // Update stats
        if (isCorrect) {
            this.stats.correct++;
        } else {
            this.stats.wrong++;
        }

        // Update option styling
        const options = document.querySelectorAll('.option');
        options.forEach((optionEl, index) => {
            optionEl.style.pointerEvents = 'none'; // Disable further clicks
            
            if (index === selectedIndex) {
                optionEl.classList.add(isCorrect ? 'correct' : 'wrong', 'selected');
            }
            
            // Show correct answer
            if (question.options[index] === question.correctAnswer) {
                optionEl.classList.add('correct');
            }
        });

        // Show feedback
        this.showFeedback(isCorrect, question.correctAnswer);
        this.updateStats();
        this.saveUserProgress();

        // Auto-advance after 2 seconds
        setTimeout(() => {
            if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
                this.nextQuestion();
            }
        }, 2000);
    }

    showFeedback(isCorrect, correctAnswer) {
        const feedbackEl = document.getElementById('feedback');
        feedbackEl.style.display = 'block';
        feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
        
        feedbackEl.innerHTML = `
            <div class="feedback-text">${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</div>
            <div class="feedback-answer">Correct answer: ${correctAnswer}</div>
        `;
    }

    showCorrectAnswer(question) {
        const feedbackEl = document.getElementById('feedback');
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'feedback correct';
        
        feedbackEl.innerHTML = `
            <div class="feedback-text">✓ Correct Answer</div>
            <div class="feedback-answer">${question.correctAnswer}</div>
        `;
    }

    displayQuestionText(question) {
        const questionTextEl = document.getElementById('question-text');
        
        if (this.currentLanguage === 'both') {
            // Show both German and English
            const germanQuestion = this.questionsDE[this.currentQuestionIndex];
            const englishQuestion = this.questionsEN[this.currentQuestionIndex];
            
            questionTextEl.innerHTML = `
                <div class="bilingual-text">
                    <div class="text-german">
                        <div class="text-label">Deutsch</div>
                        <div>${germanQuestion.questionText}</div>
                    </div>
                    <div class="text-english">
                        <div class="text-label">English</div>
                        <div>${englishQuestion.questionText}</div>
                    </div>
                </div>
            `;
        } else {
            // Show single language
            questionTextEl.textContent = question.questionText;
        }
    }

    showAnswerOnly(question) {
        const optionsContainer = document.getElementById('options');
        
        if (this.currentLanguage === 'both') {
            // Show both German and English answers
            const germanQuestion = this.questionsDE[this.currentQuestionIndex];
            const englishQuestion = this.questionsEN[this.currentQuestionIndex];
            
            optionsContainer.innerHTML = `
                <div class="answer-display">
                    <div class="answer-label">Correct Answer</div>
                    <div class="bilingual-text">
                        <div class="text-german">
                            <div class="text-label">Deutsch</div>
                            <div class="answer-text">${germanQuestion.correctAnswer}</div>
                        </div>
                        <div class="text-english">
                            <div class="text-label">English</div>
                            <div class="answer-text">${englishQuestion.correctAnswer}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Show single language answer
            optionsContainer.innerHTML = `
                <div class="answer-display">
                    <div class="answer-label">Correct Answer</div>
                    <div class="answer-text">${question.correctAnswer}</div>
                </div>
            `;
        }
        
        // Hide feedback in answers-only mode
        const feedbackEl = document.getElementById('feedback');
        feedbackEl.style.display = 'none';
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    }

    showRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * this.currentQuestions.length);
        this.currentQuestionIndex = randomIndex;
        this.showQuestion();
    }

    updateStats() {
        document.getElementById('correct-count').textContent = this.stats.correct;
        document.getElementById('wrong-count').textContent = this.stats.wrong;
        
        const total = this.stats.correct + this.stats.wrong;
        const accuracy = total > 0 ? Math.round((this.stats.correct / total) * 100) : 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            this.userAnswers = [];
            this.stats = { correct: 0, wrong: 0 };
            this.currentQuestionIndex = 0;
            this.updateStats();
            this.showQuestion();
            this.saveUserProgress();
        }
    }

    saveUserProgress() {
        const progressData = {
            currentQuestionIndex: this.currentQuestionIndex,
            userAnswers: this.userAnswers,
            stats: this.stats,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('bamf-quiz-progress', JSON.stringify(progressData));
        } catch (error) {
            console.warn('Could not save progress to localStorage:', error);
        }
    }

    loadUserProgress() {
        try {
            const savedProgress = localStorage.getItem('bamf-quiz-progress');
            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                this.currentQuestionIndex = progressData.currentQuestionIndex || 0;
                this.userAnswers = progressData.userAnswers || [];
                this.stats = progressData.stats || { correct: 0, wrong: 0 };
            }
        } catch (error) {
            console.warn('Could not load progress from localStorage:', error);
        }
    }

    showError(message) {
        const questionText = document.getElementById('question-text');
        questionText.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 2rem;">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                    Reload Page
                </button>
            </div>
        `;
    }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BAMFQuiz();
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}