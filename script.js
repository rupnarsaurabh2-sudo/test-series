let selectedExam = "";
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let activeDayToPlay = 1; // Konsa din chal raha hai

window.onload = function() { checkLoginStatus(); };

function switchScreen(hideId, showId) {
    const hideEl = document.getElementById(hideId);
    const showEl = document.getElementById(showId);
    hideEl.classList.add('fade-out');
    setTimeout(() => {
        hideEl.classList.add('hidden');
        hideEl.classList.remove('fade-out');
        showEl.classList.remove('hidden');
        void showEl.offsetWidth;
        showEl.classList.remove('fade-out');
    }, 400); 
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
        
        // Ensure account creation time exists
        if(!localStorage.getItem('accountCreatedTime')) {
            localStorage.setItem('accountCreatedTime', Date.now());
        }
    }
}

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
    
    // Yahan hum pehli baar account banne ka time save kar rahe hain
    if(!localStorage.getItem('accountCreatedTime')) {
        localStorage.setItem('accountCreatedTime', Date.now());
    }
    
    closeLoginModal();
    checkLoginStatus();
}

function logout() { localStorage.clear(); location.reload(); }

/* --- 30-DAY TIMELINE LOGIC --- */
function openDaySelection() {
    switchScreen('dashboard-section', 'day-selection-screen');
    
    const grid = document.getElementById('days-grid');
    grid.innerHTML = ''; // Clear purana grid
    
    const createdTime = parseInt(localStorage.getItem('accountCreatedTime'));
    const hoursPassed = (Date.now() - createdTime) / (1000 * 60 * 60);
    const unlockedDays = Math.floor(hoursPassed / 24) + 1; // Har 24 ghante mein ek aur khulega
    
    for(let i = 1; i <= 30; i++) {
        let btn = document.createElement('button');
        let isCompleted = localStorage.getItem(`completed_day_${i}`);
        
        if (isCompleted) {
            btn.className = 'day-btn day-completed';
            btn.innerHTML = `Day ${i} <br> <span style="font-size:12px;">✅ Done</span>`;
            btn.onclick = () => alert("You have already completed this test!");
        } 
        else if (i <= unlockedDays) {
            btn.className = 'day-btn day-unlocked';
            btn.innerText = `Day ${i}`;
            btn.onclick = () => setupPreStart(i);
        } 
        else {
            btn.className = 'day-btn day-locked';
            btn.innerHTML = `Day ${i} <br> <span style="font-size:12px;">🔒 Locked</span>`;
            btn.onclick = () => alert(`This test will unlock in ${Math.ceil((i - (hoursPassed/24)) * 24)} hours.`);
        }
        grid.appendChild(btn);
    }
}

function setupPreStart(dayNumber) {
    activeDayToPlay = dayNumber;
    document.getElementById('selected-day-title').innerText = `Challenge: Day ${dayNumber}`;
    switchScreen('day-selection-screen', 'pre-start-screen');
}

/* --- QUIZ & TIMER LOGIC --- */
async function startDailyQuiz() {
    try {
        const response = await fetch('data/jee_daily.json'); 
        const database = await response.json();
        const dayKey = `day_${activeDayToPlay}`;
        
        if(!database[dayKey] || database[dayKey].length === 0) {
            return alert("Is din ke questions abhi upload nahi hue hain bhai! JSON check kar.");
        }
        
        currentQuestions = database[dayKey]; 
        currentQuestionIndex = 0;
        score = 0;
        
        document.body.classList.add('quiz-active');
        
        document.getElementById('logout-btn').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('logout-btn').classList.add('hidden');
            document.getElementById('score-display').classList.remove('hidden');
            document.getElementById('live-score').innerText = '0';
        }, 400);

        switchScreen('pre-start-screen', 'quiz-screen');
        
        loadQuestion();
        startTimer(15 * 60); 
        
    } catch (error) {
        alert("JSON load nahi hua. GitHub repo aur file path check karo.");
    }
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer-display');
    clearInterval(timerInterval);
    
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
    // Mark this day as completed
    localStorage.setItem(`completed_day_${activeDayToPlay}`, true);
    
    document.getElementById('score-text').innerText = score;
    document.getElementById('score-display').classList.add('hidden');
    document.body.classList.remove('quiz-active'); // Remove nature theme
    
    switchScreen('quiz-screen', 'result-screen');
}

function returnToTimeline() {
    switchScreen('result-screen', 'day-selection-screen');
    openDaySelection(); // Re-render grid to show the new completed badge
}
