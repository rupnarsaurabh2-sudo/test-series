let selectedExam = "";
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

window.onload = function() {
    checkLoginStatus();
};

function checkLoginStatus() {
    const savedName = localStorage.getItem('userName');
    const savedExam = localStorage.getItem('userExam');
    
    if (savedName && savedExam) {
        document.getElementById('hero-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        
        document.getElementById('logout-btn').classList.remove('hidden');
        document.getElementById('user-name-display').innerText = savedName;
        document.getElementById('target-exam-display').innerText = savedExam;
        
        let oldScore = localStorage.getItem('lastScore') || 0;
        document.getElementById('saved-score').innerText = oldScore;
    }
}

function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal').classList.add('hidden'); }

function selectExam(exam) {
    selectedExam = exam;
    let buttons = document.querySelectorAll('.exam-select-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
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

function logout() {
    localStorage.clear();
    location.reload();
}

/* --- QUIZ LOGIC --- */

async function startDailyQuiz() {
    try {
        const response = await fetch('jee_daily.json');
        const database = await response.json();
        currentQuestions = database["day_1"]; 
        
        // UI SWITCH MAGIC
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('logout-btn').classList.add('hidden'); // Hide logout during quiz
        document.getElementById('score-display').classList.remove('hidden'); // Show live score
        document.getElementById('quiz-screen').classList.remove('hidden');
        
        // ADD MOISTURE WARM LIGHT THEME
        document.body.classList.add('quiz-active');
        
        loadQuestion();
    } catch (error) {
        alert("JSON fetch error! GitHub par data folder set nahi hai.");
    }
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
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('hint-box').classList.add('hidden');
}

function checkAnswer(selectedIndex, buttonElement) {
    let q = currentQuestions[currentQuestionIndex];
    let correctIndex = q.answer;
    let allButtons = document.querySelectorAll('.option-btn');
    
    allButtons.forEach(btn => btn.disabled = true);
    
    if(selectedIndex === correctIndex) {
        buttonElement.classList.add('correct');
        score += 4;
    } else {
        buttonElement.classList.add('wrong');
        score -= 1;
        document.getElementById('hint-box').classList.remove('hidden');
        document.getElementById('hint-text').innerText = q.hint;
    }
    
    document.getElementById('live-score').innerText = score;
    document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if(currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        localStorage.setItem('lastScore', score);
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('score-display').classList.add('hidden');
        document.getElementById('score-text').innerText = score;
    }
}
