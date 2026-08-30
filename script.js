let currentTestType = "";
let questions = {};
let currentSubject = "Physics";
let currentQIndex = 0; 
let timerInterval;
let totalTime; 
let timeSpent = 0;
let testState = {}; 

let pendingTestId = "";
let pendingTestTime = 0;

window.onload = function() {
    // Generate Grids automatically
    generateGrids();
}

function generateGrids() {
    const dayGrid = document.getElementById('days-grid');
    if(dayGrid) {
        dayGrid.innerHTML = '';
        for(let i=1; i<=75; i++) {
            let btn = document.createElement('button');
            btn.className = 'day-unlocked';
            btn.innerText = `Day ${i}`;
            btn.onclick = () => showAllTheBest(`day_${i}`, 15);
            dayGrid.appendChild(btn);
        }
    }

    const testGrid = document.getElementById('tests-grid');
    if(testGrid) {
        testGrid.innerHTML = '';
        for(let i=1; i<=10; i++) {
            let btn = document.createElement('button');
            btn.className = 'day-unlocked';
            btn.innerText = `Test ${i}`;
            btn.onclick = () => showAllTheBest(`full_test_${i}`, 150);
            testGrid.appendChild(btn);
        }
    }
}

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

function openDaySelection() { switchScreen('dashboard-screen', 'day-selection-screen'); }
function openTestSelection() { switchScreen('dashboard-screen', 'test-selection-screen'); }

function showAllTheBest(testId, timeInMins) {
    pendingTestId = testId;
    pendingTestTime = timeInMins;
    document.getElementById('all-best-modal').classList.remove('hidden');
}

function closeAllBestModal() { document.getElementById('all-best-modal').classList.add('hidden'); }

function confirmStartTest() {
    closeAllBestModal();
    startTest(pendingTestId, pendingTestTime);
}

// --- DUMMY FETCH (Replace with your actual JSON later) ---
async function fetchQuestions(testId) {
    // For now, returning dummy data to show the UI works perfectly
    // Jab tu pure 1500 questions dega, hum yahan se fetch lagayenge.
    return {
        "Physics": [
            { id: "p1", q: "Dummy Physics Q1", options: ["A", "B", "C", "D"], ans: 0 }
        ],
        "Chemistry": [
            { id: "c1", q: "Dummy Chem Q1", options: ["A", "B", "C", "D"], ans: 1 }
        ],
        "Mathematics": [
            { id: "m1", q: "Dummy Math Q1", options: ["A", "B", "C", "D"], ans: 2 }
        ]
    };
}

// UI Modals
function openInfoModal() { document.getElementById('info-modal').classList.remove('hidden'); }
function closeInfoModal() { document.getElementById('info-modal').classList.add('hidden'); }
function openLogin() { alert("Proceeding as Guest."); guestLogin(); }

function guestLogin() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('clouds').classList.add('hidden');
    document.getElementById('science-bg').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.body.className = 'theme-sky'; 
}

// --- AI BOT LOGIC ---
function toggleBot() {
    document.getElementById('bot-window').classList.toggle('hidden');
}
function botReply(response) {
    const chatArea = document.getElementById('bot-chat-area');
    const optionsDiv = document.getElementById('bot-options');
    const inputField = document.getElementById('bot-input');
    
    if(optionsDiv) optionsDiv.remove();
    chatArea.innerHTML += `<div class="user-msg">${response}</div>`;
    
    setTimeout(() => {
        if(response === 'Yes') {
            chatArea.innerHTML += `<div class="bot-msg">Great! You can ask me anything about the test patterns. Type below!</div>`;
            inputField.disabled = false;
            document.getElementById('bot-send-btn').disabled = false;
        } else {
            chatArea.innerHTML += `<div class="bot-msg">No problem! Explore the free Daily PYQs.</div>`;
        }
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 600);
}

// --- TEST ENGINE LOGIC ---
async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    if(!questions) return; 
    
    testState = {};
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach((q, idx) => {
            testState[q.id] = { status: 'not-visited', selectedOpt: null, globalIdx: idx, subject: sub };
        });
    });

    document.getElementById('day-selection-screen').classList.add('hidden');
    document.getElementById('test-selection-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('ai-bot-container').classList.add('hidden'); 
    document.getElementById('nta-screen').classList.remove('hidden');
    document.body.className = 'theme-nta';
    
    totalTime = timeInMins * 60;
    timeSpent = 0;
    startTimer();
    switchSubject('Physics'); 
}

function startTimer() {
    clearInterval(timerInterval);
    const display = document.getElementById('time-left');
    timerInterval = setInterval(() => {
        totalTime--; timeSpent++;
        let h = Math.floor(totalTime / 3600);
        let m = Math.floor((totalTime % 3600) / 60);
        let s = totalTime % 60;
        display.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (totalTime <= 0) {
            clearInterval(timerInterval);
            calculateAndShowResult();
        }
    }, 1000);
}

function switchSubject(subName) {
    if(!questions[subName]) return; 
    currentSubject = subName;
    currentQIndex = 0;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === subName);
    });
    document.getElementById('current-subject-name').innerText = subName;
    buildPalette();
    loadQuestion(0);
}

function buildPalette() {
    const palette = document.getElementById('question-palette');
    palette.innerHTML = '';
    questions[currentSubject].forEach((q, idx) => {
        let btn = document.createElement('div');
        let state = testState[q.id].status;
        btn.className = `badge ${state}`;
        btn.innerText = idx + 1;
        btn.onclick = () => loadQuestion(idx);
        palette.appendChild(btn);
    });
    updateCounts();
}

function updateCounts() {
    let ans=0, notAns=0, notVis=0, mark=0;
    Object.values(testState).forEach(s => {
        if(s.status === 'answered') ans++;
        else if(s.status === 'not-answered') notAns++;
        else if(s.status === 'not-visited') notVis++;
        else if(s.status === 'marked') mark++;
    });
    document.getElementById('cnt-answered').innerText = ans;
    document.getElementById('cnt-not-answered').innerText = notAns;
    document.getElementById('cnt-not-visited').innerText = notVis;
    document.getElementById('cnt-marked').innerText = mark;
}

function loadQuestion(idx) {
    currentQIndex = idx;
    let q = questions[currentSubject][idx];
    if(testState[q.id].status === 'not-visited') {
        testState[q.id].status = 'not-answered';
    }
    document.getElementById('current-q-no').innerText = idx + 1;
    document.getElementById('q-text').innerText = q.q;
    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';
    q.options.forEach((opt, oIdx) => {
        let isChecked = testState[q.id].selectedOpt === oIdx ? 'checked' : '';
        optArea.innerHTML += `<label class="opt-row"><input type="radio" name="opt" value="${oIdx}" ${isChecked} onchange="selectOption(${oIdx})"> ${opt}</label>`;
    });
    buildPalette(); 
}

function selectOption(oIdx) { testState[questions[currentSubject][currentQIndex].id].selectedOpt = oIdx; }

function saveAndNext() {
    let qId = questions[currentSubject][currentQIndex].id;
    if(testState[qId].selectedOpt !== null) testState[qId].status = 'answered';
    moveToNext();
}

function markForReview() { testState[questions[currentSubject][currentQIndex].id].status = 'marked'; moveToNext(); }

function clearResponse() {
    let qId = questions[currentSubject][currentQIndex].id;
    testState[qId].selectedOpt = null; testState[qId].status = 'not-answered';
    loadQuestion(currentQIndex); 
}

function moveToNext() {
    if(currentQIndex < questions[currentSubject].length - 1) loadQuestion(currentQIndex + 1);
    else { alert("Section End. Select next subject."); buildPalette(); }
}

function submitTestEarly() {
    if(confirm("Submit the test now?")) { clearInterval(timerInterval); calculateAndShowResult(); }
}

function calculateAndShowResult() {
    let finalScore = 0, positive = 0, negative = 0, totalQuestions = 0;
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach(q => {
            totalQuestions++;
            let state = testState[q.id];
            if(state.selectedOpt !== null) {
                if(state.selectedOpt === q.ans) { positive += 4; } 
                else { negative += 1; }
            }
        });
    });

    finalScore = positive - negative;
    let maxPossibleScore = totalQuestions * 4;
    
    document.getElementById('nta-screen').classList.add('hidden');
    document.getElementById('analysis-screen').classList.remove('hidden');
    document.getElementById('ai-bot-container').classList.remove('hidden'); 
    document.body.className = 'theme-forest';
    
    document.getElementById('final-score').innerHTML = `${finalScore} <span style="font-size:20px; color:#718096;">/${maxPossibleScore}</span>`;
    document.getElementById('positive-score').innerText = `+${positive}`;
    document.getElementById('negative-score').innerText = `-${negative}`;
}
