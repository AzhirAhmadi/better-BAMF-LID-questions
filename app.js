class BAMFQuiz {
    constructor() {
        this.questionsDE = [];
        this.questionsEN = [];
        this.currentQuestionIndex = 0;
        this.currentMode = 'quiz';
        this.userAnswers = [];
        this.stats = { correct: 0, wrong: 0 };
        this.translationStates = {
            question: false,
            options: {},
            answer: false
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadQuestions();
            this.setupEventListeners();
            this.populateQuestionSelector();
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
        // Mode selector
        document.getElementById('mode-select').addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            this.resetTranslationStates();
            this.showQuestion();
        });

        // Question selector
        document.getElementById('question-select').addEventListener('change', (e) => {
            const questionNumber = parseInt(e.target.value);
            if (questionNumber) {
                this.goToQuestion(questionNumber);
            }
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
        return this.questionsDE; // Always use German questions as primary
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

        // Show German question with translation button
        this.displayQuestionText(question);
        
        // Update question selector
        document.getElementById('question-select').value = question.number;

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

        const englishQuestion = this.questionsEN[this.currentQuestionIndex];

        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option-container';
            
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            
            optionEl.innerHTML = `
                <div class="option" tabindex="0">
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">
                        ${option}
                        <div class="translation-overlay" id="option-translation-${index}">
                            ${englishQuestion.options[index]}
                        </div>
                    </div>
                    <button class="translate-btn" id="option-translate-btn-${index}">
                        EN
                    </button>
                </div>
            `;

            const optionDiv = optionEl.querySelector('.option');
            const translateBtn = optionEl.querySelector(`#option-translate-btn-${index}`);
            
            // Set up translate button
            translateBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleOptionTranslation(index);
            };
            
            // Set initial state
            this.updateOptionTranslationState(index);

            // Add click handler to the option div
            optionDiv.addEventListener('click', () => {
                if (this.currentMode === 'quiz') {
                    this.selectOption(index);
                }
            });

            // Add keyboard handler
            optionDiv.addEventListener('keypress', (e) => {
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
                    optionDiv.classList.add('correct');
                }
            }

            optionsContainer.appendChild(optionEl);
        });
    }

    toggleOptionTranslation(index) {
        this.translationStates.options[index] = !this.translationStates.options[index];
        this.updateOptionTranslationState(index);
    }

    updateOptionTranslationState(index) {
        const isTranslated = this.translationStates.options[index] || false;
        const translateBtn = document.getElementById(`option-translate-btn-${index}`);
        const translationEl = document.getElementById(`option-translation-${index}`);
        
        if (translateBtn) {
            translateBtn.className = isTranslated ? 'translate-btn active' : 'translate-btn';
            translateBtn.textContent = isTranslated ? 'DE' : 'EN';
        }
        
        if (translationEl) {
            if (isTranslated) {
                translationEl.classList.add('show');
            } else {
                translationEl.classList.remove('show');
            }
        }
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
        const translateBtn = document.getElementById('question-translate-btn');
        const englishQuestion = this.questionsEN[this.currentQuestionIndex];
        
        // Always show German first
        questionTextEl.innerHTML = `
            ${question.questionText}
            <div class="translation-overlay" id="question-translation">
                ${englishQuestion.questionText}
            </div>
        `;
        
        // Show translate button and set up click handler
        translateBtn.style.display = 'block';
        translateBtn.className = this.translationStates.question ? 'translate-btn active' : 'translate-btn';
        translateBtn.textContent = this.translationStates.question ? 'DE' : 'EN';
        
        // Remove old event listeners and add new one
        translateBtn.onclick = () => {
            this.toggleQuestionTranslation();
        };
        
        // Show/hide translation based on state
        const translationEl = document.getElementById('question-translation');
        if (this.translationStates.question) {
            translationEl.classList.add('show');
        } else {
            translationEl.classList.remove('show');
        }
    }

    toggleQuestionTranslation() {
        this.translationStates.question = !this.translationStates.question;
        const translateBtn = document.getElementById('question-translate-btn');
        const translationEl = document.getElementById('question-translation');
        
        translateBtn.className = this.translationStates.question ? 'translate-btn active' : 'translate-btn';
        translateBtn.textContent = this.translationStates.question ? 'DE' : 'EN';
        
        if (this.translationStates.question) {
            translationEl.classList.add('show');
        } else {
            translationEl.classList.remove('show');
        }
    }

    showAnswerOnly(question) {
        const optionsContainer = document.getElementById('options');
        const englishQuestion = this.questionsEN[this.currentQuestionIndex];
        
        optionsContainer.innerHTML = `
            <div class="answer-display">
                <div class="answer-label">Correct Answer</div>
                <div class="answer-text">
                    ${question.correctAnswer}
                    <div class="translation-overlay" id="answer-translation">
                        ${englishQuestion.correctAnswer}
                    </div>
                </div>
                <button class="translate-btn" id="answer-translate-btn">EN</button>
            </div>
        `;
        
        // Set up translate button for answer
        const answerTranslateBtn = document.getElementById('answer-translate-btn');
        answerTranslateBtn.onclick = () => {
            this.toggleAnswerTranslation();
        };
        
        // Set initial state
        this.updateAnswerTranslationState();
        
        // Hide feedback in answers-only mode
        const feedbackEl = document.getElementById('feedback');
        feedbackEl.style.display = 'none';
    }

    toggleAnswerTranslation() {
        this.translationStates.answer = !this.translationStates.answer;
        this.updateAnswerTranslationState();
    }

    updateAnswerTranslationState() {
        const translateBtn = document.getElementById('answer-translate-btn');
        const translationEl = document.getElementById('answer-translation');
        
        if (translateBtn) {
            translateBtn.className = this.translationStates.answer ? 'translate-btn active' : 'translate-btn';
            translateBtn.textContent = this.translationStates.answer ? 'DE' : 'EN';
        }
        
        if (translationEl) {
            if (this.translationStates.answer) {
                translationEl.classList.add('show');
            } else {
                translationEl.classList.remove('show');
            }
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.resetTranslationStates();
            this.showQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.resetTranslationStates();
            this.showQuestion();
        }
    }

    showRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * this.currentQuestions.length);
        this.currentQuestionIndex = randomIndex;
        this.resetTranslationStates();
        this.showQuestion();
    }

    populateQuestionSelector() {
        const selector = document.getElementById('question-select');
        selector.innerHTML = '<option value="">Select Question...</option>';
        
        for (let i = 1; i <= this.questionsDE.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Question ${i}`;
            selector.appendChild(option);
        }
    }

    goToQuestion(questionNumber) {
        const index = this.questionsDE.findIndex(q => q.number === questionNumber);
        if (index >= 0) {
            this.currentQuestionIndex = index;
            this.resetTranslationStates();
            this.showQuestion();
        }
    }

    resetTranslationStates() {
        this.translationStates = {
            question: false,
            options: {},
            answer: false
        };
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