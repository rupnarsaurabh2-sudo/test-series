let currentTestType = "";
let questions = [];
let currentSubject = "Physics";
let currentQIndex = 0; 
let timerInterval;
let totalTime; 
let timeSpent = 0;
let testState = {}; 

async function fetchQuestions(testId) {
    let fileName = testId.includes('day') ? 'data/jee_daily.json' : 'data/jee_full_tests.json';
    try {
        const response = await fetch(fileName);
        const database = await response.json();
        if(!database[testId]) {
            alert(`Oops! ${testId} ka data abhi upload nahi hua hai.`);
            return null;
        }
        return database[testId];
    } catch (error) {
        alert("JSON load error! Make sure you are running via a server (Vercel) and 'data' folder exists.");
        return null;
    }
}

// UI Navigation Modals
function openInfoModal() { document.getElementById('info-modal').classList.remove('hidden'); }
function closeInfoModal() { document.getElementById('info-modal').classList.add('hidden'); }
function openLogin() { alert("Login Integration Pending. Proceeding as Guest."); guestLogin(); }

function guestLogin() {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('clouds').classList.add('hidden');
    document.getElementById('science-bg').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.body.className = 'theme-sky'; 
}

// --- AI BOT LOGIC ---
function toggleBot() {
    const botWindow = document.getElementById('bot-window');
    botWindow.classList.toggle('hidden');
}

function botReply(response) {
    const chatArea = document.getElementById('bot-chat-area');
    const optionsDiv = document.getElementById('bot-options');
    const inputField = document.getElementById('bot-input');
    const sendBtn = document.getElementById('bot-send-btn');
    
    if(optionsDiv) optionsDiv.remove();
    chatArea.innerHTML += `<div class="user-msg">${response}</div>`;
    
    setTimeout(() => {
        if(response === 'Yes') {
            chatArea.innerHTML += `<div class="bot-msg">Great! You can ask me anything about the test patterns, interface, or pricing. Feel free to type your question below.</div>`;
            inputField.disabled = false;
            sendBtn.disabled = false;
            inputField.focus();
        } else {
            chatArea.innerHTML += `<div class="bot-msg">No problem! Feel free to explore the free Daily 10 PYQs. I am right here if you need me.</div>`;
        }
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 600); // 600ms delay gives a realistic typing feel
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

    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('ai-bot-container').classList.add('hidden'); // Hide bot during exam
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
            alert("Time's Up! Auto-submitting test.");
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
    else { alert("Section End. Please select a different subject tab from above."); buildPalette(); }
}

function submitTestEarly() {
    if(confirm("Are you sure you want to submit the test right now?")) { clearInterval(timerInterval); calculateAndShowResult(); }
}

function calculateAndShowResult() {
    let finalScore = 0, correct = 0, totalAttempted = 0, totalQuestions = 0;
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach(q => {
            totalQuestions++;
            let state = testState[q.id];
            if(state.selectedOpt !== null) {
                totalAttempted++;
                if(state.selectedOpt === q.ans) { finalScore += 4; correct++; } 
                else { finalScore -= 1; }
            }
        });
    });

    let accuracy = totalAttempted > 0 ? Math.round((correct/totalAttempted)*100) : 0;
    let maxPossibleScore = totalQuestions * 4;
    
    document.getElementById('nta-screen').classList.add('hidden');
    document.getElementById('analysis-screen').classList.remove('hidden');
    document.getElementById('ai-bot-container').classList.remove('hidden'); // Bring bot back
    document.body.className = 'theme-forest';
    
    document.getElementById('final-score').innerHTML = `${finalScore} <span style="font-size:20px; color:#718096;">/${maxPossibleScore}</span>`;
    document.getElementById('final-accuracy').innerText = `${accuracy}%`;
    document.getElementById('final-time').innerText = `${Math.floor(timeSpent/60)}m ${timeSpent%60}s`;
}
