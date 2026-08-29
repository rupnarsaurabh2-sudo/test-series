let selectedExam = "";
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;

window.onload = function() { checkLoginStatus(); };

// --- SMOOTH SCREEN TRANSITION HELPER ---
function switchScreen(hideId, showId) {
    const hideEl = document.getElementById(hideId);
    const showEl = document.getElementById(showId);
    
    hideEl.classList.add('fade-out');
    
    setTimeout(() => {
        hideEl.classList.add('hidden');
        hideEl.classList.remove('fade-out');
        
        showEl.classList.remove('hidden');
        // Force reflow
        void showEl.offsetWidth;
        showEl.classList.remove('fade-out');
    }, 400); // 400ms ka smooth paani jaisa transition
}

function checkLoginStatus() {
    const savedName = localStorage.getItem('userName');
    const savedExam = localStorage.getItem('userExam');
    if (savedName && savedExam) {
        document.getElementById('hero-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        document.getElementById('user-name-display').innerText = savedName;
        document.getElementById('target-exam-display').innerText = savedExam;
        document.getElementById('saved-score').innerText = localStorage.getItem('lastScore') || 0;
    }
}

// Modal logic
function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal').classList.add('hidden'); }
function selectExam(exam) {
    selectedExam = exam;
    document.querySelectorAll('.exam-select-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    document.getElementById('exam-warning').classList.add('hidden');
}
function saveProfile() {
    const name = document.getElementById('username-input').value;
    if (name.trim() === "") return alert("Please enter your name.");
    if (selectedExam === "") return document.getElementById('exam-warning').classList.remove('hidden');
    localStorage.setItem('userName', name);
    localStorage.setItem('userExam', selectedExam);
    closeLoginModal();
    checkLoginStatus();
}
function logout() { localStorage.clear(); location.reload(); }

/* --- QUIZ & TIMER LOGIC --- */

// Dashboard se 'Pre-Start' screen par bhejna
function showPreStartScreen() {
    switchScreen('dashboard-section', 'pre-start-screen');
}

// Pre-start se Quiz start karna aur Timer chalana
async function startDailyQuiz() {
    try {
        const response = await fetch('data/jee_daily.json'); // Apne data folder ke hisaab se path check kar lena
        const database = await response.json();
        currentQuestions = database["day_1"]; 
        
        // Change Theme to Nature Warm Sky
        document.body.classList.add('quiz-active');
        
        // Show Live Score
        document.getElementById('logout-btn').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('logout-btn').classList.add('hidden');
            document.getElementById('score-display').classList.remove('hidden');
        }, 400);

        // Smooth switch to Quiz
        switchScreen('pre-start-screen', 'quiz-screen');
        
        loadQuestion();
        startTimer(15 * 60); // 15 Minutes (900 seconds)
        
    } catch (error) {
        alert("JSON load nahi hua. GitHub repo aur file path check karo.");
    }
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer-display');
    
    clearInterval(timerInterval); // Reset existing timer if any
    
    timerInterval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert("Time's Up! Test is automatically submitting.");
            endQuiz();
        }
    }, 1000);
}

function loadQuestion() {
    let q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('q-counter').innerText = `Q: ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    
    let optionsHtml = '';
    q.options.forEach((opt, index) => {
        optionsHtml += `<button class="option-btn" onclick="checkAnswer(${index}, this)">${opt}</button>`;
    });
    
    document.getElementById('options-container').innerHTML = optionsHtml;
    
    // Smoothly hide next and hint buttons
    const nextBtn = document.getElementById('next-btn');
    const hintBox = document.getElementById('hint-box');
    
    nextBtn.classList.add('fade-out');
    hintBox.classList.add('fade-out');
    setTimeout(() => {
        nextBtn.classList.add('hidden');
        hintBox.classList.add('hidden');
        nextBtn.classList.remove('fade-out');
        hintBox.classList.remove('fade-out');
    }, 400);
}

function checkAnswer(selectedIndex, buttonElement) {
    let q = currentQuestions[currentQuestionIndex];
    let correctIndex = q.answer;
    
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
    
    if(selectedIndex === correctIndex) {
        buttonElement.classList.add('correct');
        score += 4;
    } else {
        buttonElement.classList.add('wrong');
        score -= 1;
        
        // Show Hint smoothly
        const hintBox = document.getElementById('hint-box');
        document.getElementById('hint-text').innerText = q.hint;
        hintBox.classList.remove('hidden');
    }
    
    document.getElementById('live-score').innerText = score;
    document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if(currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    clearInterval(timerInterval);
    localStorage.setItem('lastScore', score);
    document.getElementById('score-text').innerText = score;
    document.getElementById('score-display').classList.add('hidden');
    
    switchScreen('quiz-screen', 'result-screen');
}
