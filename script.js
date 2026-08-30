let questions = {};
let currentSubject = "Physics";
let currentQIndex = 0; 
let timerInterval;
let totalTime; 
let timeSpent = 0;
let testState = {}; 

let pendingTestId = "";
let pendingTestTime = 0;
let screenHistory = ['landing-screen']; 

window.onload = function() {
    generateGrids();
    createLeaves();
}

function createLeaves() {
    const container = document.getElementById('leaf-container');
    const leafShapes = ['🍁', '🍂'];
    for(let i=0; i<15; i++) {
        let leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.innerText = leafShapes[Math.floor(Math.random() * leafShapes.length)];
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 5 + 8) + 's, ' + (Math.random() * 3 + 2) + 's';
        leaf.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 2) + 's';
        leaf.style.fontSize = (Math.random() * 10 + 12) + 'px';
        container.appendChild(leaf);
    }
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
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(hideId).classList.remove('active-screen');
    
    document.getElementById(showId).classList.remove('hidden');
    document.getElementById(showId).classList.add('active-screen');

    if(showId !== screenHistory[screenHistory.length - 1]) {
        screenHistory.push(showId);
    }
    
    if(showId === 'landing-screen') {
        document.getElementById('universal-back').classList.add('hidden');
    } else {
        document.getElementById('universal-back').classList.remove('hidden');
    }
}

// -----------------------------------------------------
// THE SMART BACK BUTTON FIX (Restores Premium Theme)
// -----------------------------------------------------
function goBack() {
    if(screenHistory.length > 1) {
        let currentScreen = screenHistory.pop();
        let prevScreen = screenHistory[screenHistory.length - 1];
        
        document.getElementById(currentScreen).classList.add('hidden');
        document.getElementById(currentScreen).classList.remove('active-screen');
        
        document.getElementById(prevScreen).classList.remove('hidden');
        document.getElementById(prevScreen).classList.add('active-screen');
        
        // Fix for White Background Bug
        if(prevScreen !== 'nta-screen') {
            document.body.className = 'theme-premium';
            document.getElementById('floating-dock').classList.remove('hidden');
            document.getElementById('leaf-container').classList.remove('hidden');
            document.getElementById('science-bg').classList.remove('hidden');
        } else {
            document.body.className = 'theme-nta';
        }

        if(prevScreen === 'landing-screen') {
            document.getElementById('universal-back').classList.add('hidden');
        } else {
            document.getElementById('universal-back').classList.remove('hidden');
        }
    }
}

function openDaySelection() { switchScreen('dashboard-screen', 'day-selection-screen'); }
function openTestSelection() { switchScreen('dashboard-screen', 'test-selection-screen'); }
function openInfoModal() { document.getElementById('info-modal').classList.remove('hidden'); }
function closeInfoModal() { document.getElementById('info-modal').classList.add('hidden'); }
function guestLogin() { switchScreen('landing-screen', 'dashboard-screen'); }

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

// FETCH (Use Real JSON Later)
async function fetchQuestions(testId) {
    let fileName = testId.includes('day') ? 'data/jee_daily.json' : 'data/jee_full_tests.json';
    try {
        const response = await fetch(fileName);
        const database = await response.json();
        return database[testId] || null;
    } catch (e) {
        console.warn("Using local fallback data.");
        return {
            "Physics": [
                { id: "p1", type: "mcq", q: "The dimension of sqrt(μ₀/ε₀) is equal to that of:", options: ["Voltage", "Capacitance", "Inductance", "Resistance"], ans: 3 },
                { id: "p2", type: "numerical", q: "Three students measure g using a simple pendulum. The minimum percentage error is obtained by student no: (1, 2, or 3)?", ans: 1 }
            ],
            "Chemistry": [
                { id: "c1", type: "mcq", q: "On combustion 0.210 g of an organic compound gave 0.127 g H₂O and 0.307 g CO₂. The percentages of hydrogen and oxygen respectively are:", options: ["53.41, 39.6", "6.72, 53.41", "7.55, 43.85", "6.72, 39.87"], ans: 2 },
                { id: "c2", type: "numerical", q: "Mass of magnesium required to produce 220 mL of hydrogen gas at STP on reaction with excess of dil. HCl is (in mg):", ans: 236 }
            ],
            "Mathematics": [
                { id: "m1", type: "mcq", q: "The number of real roots of the equation x|x-2| + 3|x-3| + 1 = 0 is:", options: ["4", "2", "1", "3"], ans: 1 },
                { id: "m2", type: "numerical", q: "Let O be origin, A be z₁ = √3 + 2√2 i, B(z₂) be such that √3|z₂| = |z₁| and arg(z₂) = arg(z₁) + π/6. If area of triangle ABO is 11/x, find x:", ans: 3 }
            ]
        };
    }
}

async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    if(!questions) { alert("Data missing for " + testId); return; }
    
    testState = {};
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach((q, idx) => {
            testState[q.id] = { status: 'not-visited', selectedOpt: null, type: q.type, subject: sub };
        });
    });

    document.getElementById('floating-dock').classList.add('hidden'); 
    document.getElementById('universal-back').classList.add('hidden'); 
    document.getElementById('leaf-container').classList.add('hidden');
    document.getElementById('science-bg').classList.add('hidden');
    
    switchScreen(document.querySelector('.active-screen').id, 'nta-screen');
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
        totalTime--; 
        let h = Math.floor(totalTime / 3600), m = Math.floor((totalTime % 3600) / 60), s = totalTime % 60;
        display.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (totalTime <= 0) { clearInterval(timerInterval); calculateAndShowResult(); }
    }, 1000);
}

function switchSubject(subName) {
    if(!questions[subName]) return; 
    currentSubject = subName;
    currentQIndex = 0;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.innerText === subName));
    document.getElementById('current-subject-name').innerText = subName;
    buildPalette();
    loadQuestion(0);
}

function buildPalette() {
    const palette = document.getElementById('question-palette');
    palette.innerHTML = '';
    questions[currentSubject].forEach((q, idx) => {
        let btn = document.createElement('div');
        btn.className = `badge ${testState[q.id].status}`;
        btn.innerText = idx + 1;
        btn.onclick = () => loadQuestion(idx);
        palette.appendChild(btn);
    });
    updateCounts();
}

function updateCounts() {
    let counts = { 'answered': 0, 'not-answered': 0, 'not-visited': 0, 'marked': 0 };
    Object.values(testState).forEach(s => counts[s.status]++);
    Object.keys(counts).forEach(k => document.getElementById(`cnt-${k}`).innerText = counts[k]);
}

function loadQuestion(idx) {
    currentQIndex = idx;
    let q = questions[currentSubject][idx];
    if(testState[q.id].status === 'not-visited') testState[q.id].status = 'not-answered';
    
    document.getElementById('current-q-no').innerText = idx + 1;
    document.getElementById('q-text').innerText = q.q;
    
    const optArea = document.getElementById('options-area');
    const numArea = document.getElementById('numerical-area');
    const numInput = document.getElementById('num-answer');

    if(q.type === 'numerical') {
        optArea.classList.add('hidden');
        numArea.classList.remove('hidden');
        numInput.value = testState[q.id].selectedOpt !== null ? testState[q.id].selectedOpt : '';
    } else {
        numArea.classList.add('hidden');
        optArea.classList.remove('hidden');
        optArea.innerHTML = '';
        q.options.forEach((opt, oIdx) => {
            let isChecked = testState[q.id].selectedOpt === oIdx ? 'checked' : '';
            optArea.innerHTML += `<label class="opt-row"><input type="radio" name="opt" value="${oIdx}" ${isChecked} onchange="selectOption(${oIdx})"> ${opt}</label>`;
        });
    }
    buildPalette(); 
}

function selectOption(val) { testState[questions[currentSubject][currentQIndex].id].selectedOpt = val; }

function saveAndNext() {
    let q = questions[currentSubject][currentQIndex];
    if(q.type === 'numerical') {
        let val = document.getElementById('num-answer').value;
        if(val !== "") testState[q.id].selectedOpt = parseFloat(val);
    }
    if(testState[q.id].selectedOpt !== null) testState[q.id].status = 'answered';
    if(currentQIndex < questions[currentSubject].length - 1) loadQuestion(currentQIndex + 1);
    else buildPalette();
}

function markForReview() { testState[questions[currentSubject][currentQIndex].id].status = 'marked'; saveAndNext(); }

function clearResponse() {
    let q = questions[currentSubject][currentQIndex];
    testState[q.id].selectedOpt = null; testState[q.id].status = 'not-answered';
    loadQuestion(currentQIndex); 
}

function submitTestEarly() { if(confirm("Submit the test now?")) { clearInterval(timerInterval); calculateAndShowResult(); } }

function calculateAndShowResult() {
    let stats = { Physics: {p:0, t:0}, Chemistry: {p:0, t:0}, Mathematics: {p:0, t:0} };
    let totalPositive = 0, totalNegative = 0, totalQs = 0;

    Object.keys(questions).forEach(sub => {
        questions[sub].forEach(q => {
            totalQs++;
            stats[sub].t++;
            let state = testState[q.id];
            if(state.selectedOpt !== null) {
                if(state.selectedOpt === q.ans) { totalPositive += 4; stats[sub].p++; } 
                else if (q.type === 'mcq') { totalNegative += 1; }
            }
        });
    });

    let finalScore = totalPositive - totalNegative;
    let maxScore = totalQs * 4;
    
    switchScreen('nta-screen', 'analysis-screen');
    document.body.className = 'theme-premium';
    
    document.getElementById('floating-dock').classList.remove('hidden'); 
    document.getElementById('leaf-container').classList.remove('hidden');
    document.getElementById('science-bg').classList.remove('hidden');
    
    document.getElementById('final-score').innerText = `${finalScore} / ${maxScore}`;
    document.getElementById('positive-score').innerText = `+${totalPositive}`;
    document.getElementById('negative-score').innerText = `-${totalNegative}`;

    if (finalScore >= (maxScore / 2)) {
        document.getElementById('safe-zone-banner').classList.remove('hidden');
    } else {
        document.getElementById('safe-zone-banner').classList.add('hidden');
    }

    ['Physics', 'Chemistry', 'Mathematics'].forEach(sub => {
        let pct = stats[sub].t > 0 ? Math.round((stats[sub].p / stats[sub].t) * 100) : 0;
        let shortSub = sub === 'Mathematics' ? 'math' : (sub === 'Chemistry' ? 'chem' : 'phy');
        document.getElementById(`bar-${shortSub}`).style.width = `${pct}%`;
        document.getElementById(`pct-${shortSub}`).innerText = `${pct}%`;
    });
}

// --- AI BOT LOGIC ---
function toggleBot() { document.getElementById('bot-window').classList.toggle('hidden'); }
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
