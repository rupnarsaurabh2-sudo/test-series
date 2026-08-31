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

// 1. MAGICAL HEAVENLY LEAVES
function createLeaves() {
    const container = document.getElementById('leaf-container');
    const leafShapes = ['🍁', '🍂', '✨', '🍃'];
    for(let i=0; i<20; i++) {
        let leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.innerText = leafShapes[Math.floor(Math.random() * leafShapes.length)];
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 6 + 7) + 's, ' + (Math.random() * 3 + 2) + 's';
        leaf.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 2) + 's';
        leaf.style.fontSize = (Math.random() * 12 + 14) + 'px';
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

// 2. GLITCH-FREE SMART NAVIGATION
function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(hideId).classList.remove('active-screen');
    
    document.getElementById(showId).classList.remove('hidden');
    document.getElementById(showId).classList.add('active-screen');

    if(showId !== screenHistory[screenHistory.length - 1]) {
        screenHistory.push(showId);
    }
    updateSystemUI(showId);
}

function goBack() {
    if(screenHistory.length > 1) {
        let currentScreen = screenHistory.pop();
        let prevScreen = screenHistory[screenHistory.length - 1];
        
        document.getElementById(currentScreen).classList.add('hidden');
        document.getElementById(currentScreen).classList.remove('active-screen');
        
        document.getElementById(prevScreen).classList.remove('hidden');
        document.getElementById(prevScreen).classList.add('active-screen');
        
        updateSystemUI(prevScreen);
    }
}

// THIS LOCKS THE THEME SO IT NEVER BREAKS
function updateSystemUI(activeScreenId) {
    if(activeScreenId === 'landing-screen' || activeScreenId === 'nta-screen' || activeScreenId === 'analysis-screen') {
        document.getElementById('universal-back').classList.add('hidden');
    } else {
        document.getElementById('universal-back').classList.remove('hidden');
    }

    if(activeScreenId === 'nta-screen') {
        document.body.className = 'theme-nta';
        document.getElementById('floating-dock').classList.add('hidden');
        document.getElementById('leaf-container').classList.add('hidden');
        document.getElementById('science-bg').classList.add('hidden');
    } else {
        document.body.className = 'theme-premium';
        document.getElementById('floating-dock').classList.remove('hidden');
        document.getElementById('leaf-container').classList.remove('hidden');
        document.getElementById('science-bg').classList.remove('hidden');
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

// 3. DUMMY FETCH (Replace with your actual JSON)
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
                { id: "p1", type: "mcq", q: "The dimension of sqrt(μ₀/ε₀) is equal to that of:", options: ["Voltage", "Capacitance", "Inductance", "Resistance"], ans: 3, hint: "Check the units of permeability and permittivity." },
                { id: "p2", type: "numerical", q: "A particle of mass 10g moves in a straight line with retardation 2x. Loss of KE is (10/x)^-n. The value of n is:", ans: 2, hint: "Apply Work-Energy Theorem: dK = F dx" }
            ],
            "Chemistry": [
                { id: "c1", type: "mcq", q: "Mass of magnesium required to produce 220 mL of hydrogen gas at STP on reaction with excess of dil. HCl is:", options: ["235.7 mg", "0.24 mg", "236 mg", "2.444 g"], ans: 2, hint: "Use mole concept: 1 mole gas at STP = 22.4 L" }
            ],
            "Mathematics": [
                { id: "m1", type: "mcq", q: "The number of real roots of the equation x|x-2| + 3|x-3| + 1 = 0 is:", options: ["4", "2", "1", "3"], ans: 1, hint: "Open modulus based on critical points 2 and 3." }
            ]
        };
    }
}

// 4. TEST ENGINE
async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    if(!questions) { alert("Data missing for " + testId); return; }
    
    testState = {};
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach((q, idx) => {
            testState[q.id] = { status: 'not-visited', selectedOpt: null, type: q.type, subject: sub };
        });
    });

    switchScreen(document.querySelector('.active-screen').id, 'nta-screen');
    
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
        timeSpent++;
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
    
    let m = Math.floor(timeSpent / 60);
    let s = timeSpent % 60;
    document.getElementById('time-taken').innerText = `${m}m ${s}s`;

    switchScreen('nta-screen', 'analysis-screen');
    
    document.getElementById('final-score').innerText = `${finalScore} / ${maxScore}`;
    document.getElementById('positive-score').innerText = `+${totalPositive}`;
    document.getElementById('negative-score').innerText = `-${totalNegative}`;

    if (finalScore >= (maxScore / 2)) {
        document.getElementById('safe-zone-banner').classList.remove('hidden');
    } else {
        document.getElementById('safe-zone-banner').classList.add('hidden');
    }

    // Trigger Graph Animation
    setTimeout(() => {
        ['Physics', 'Chemistry', 'Mathematics'].forEach(sub => {
            let pct = stats[sub].t > 0 ? Math.round((stats[sub].p / stats[sub].t) * 100) : 0;
            let shortSub = sub === 'Mathematics' ? 'math' : (sub === 'Chemistry' ? 'chem' : 'phy');
            document.getElementById(`bar-${shortSub}`).style.width = `${pct}%`;
            document.getElementById(`pct-${shortSub}`).innerText = `${pct}%`;
        });
    }, 500); // Small delay to let the screen render first
}

// 5. VIEW SOLUTIONS (Review Engine)
function openReviewScreen() {
    switchScreen('analysis-screen', 'review-screen');
    const container = document.getElementById('review-content');
    container.innerHTML = '';

    Object.keys(questions).forEach(sub => {
        if(questions[sub].length > 0) {
            container.innerHTML += `<h2 class="sub-title">${sub}</h2>`;
            questions[sub].forEach((q, i) => {
                let state = testState[q.id];
                let isCorrect = state.selectedOpt === q.ans;
                let html = `<div class="review-item">
                                <div class="review-q">Q${i+1}. ${q.q}</div>`;

                if(q.type === 'numerical') {
                    html += `<div class="review-opt ${isCorrect ? 'opt-correct' : (state.selectedOpt!==null ? 'opt-wrong':'')}">
                                Your Answer: ${state.selectedOpt !== null ? state.selectedOpt : 'Not Attempted'}
                             </div>
                             <div class="review-opt opt-correct">Correct Answer: ${q.ans}</div>`;
                } else {
                    q.options.forEach((opt, oIdx) => {
                        let optClass = 'review-opt';
                        if(oIdx === q.ans) optClass += ' opt-correct';
                        else if(oIdx === state.selectedOpt) optClass += ' opt-wrong';
                        html += `<div class="${optClass}">${opt}</div>`;
                    });
                }
                
                if(q.hint) {
                    html += `<div class="review-hint">💡 Hint: ${q.hint}</div>`;
                }
                html += `</div>`;
                container.innerHTML += html;
            });
        }
    });
}

function closeReviewScreen() { switchScreen('review-screen', 'analysis-screen'); }

// 6. AI BOT LOGIC
function toggleBot() { document.getElementById('bot-window').classList.toggle('hidden'); }
function botReply(response) {
    const chatArea = document.getElementById('bot-chat-area');
    const optionsDiv = document.getElementById('bot-options');
    const inputField = document.getElementById('bot-input');
    if(optionsDiv) optionsDiv.remove();
    chatArea.innerHTML += `<div class="user-msg">${response}</div>`;
    setTimeout(() => {
        if(response === 'Yes') {
            chatArea.innerHTML += `<div class="bot-msg">Great! Ask anything about the test patterns.</div>`;
            inputField.disabled = false;
            document.getElementById('bot-send-btn').disabled = false;
        } else {
            chatArea.innerHTML += `<div class="bot-msg">No problem! Explore the free Daily PYQs.</div>`;
        }
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 600);
}

// ========================================================
// FIREBASE BACKEND & LEADERBOARD LOGIC (PASTED AT THE END)
// ========================================================

const firebaseConfig = {
    apiKey: "AIzaSyD-CNz9PBUbIn0jflol8LJc1f_ZErwVyiU",
    authDomain: "rankersvault-5e76f.firebaseapp.com",
    projectId: "rankersvault-5e76f",
    storageBucket: "rankersvault-5e76f.firebasestorage.app",
    messagingSenderId: "56527682160",
    appId: "1:56527682160:web:a88fdbea88af7d30b1d2b5",
    databaseURL: "https://rankersvault-5e76f-default-rtdb.firebaseio.com"
};

// Initialize Firebase only if it hasn't been initialized yet
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
let currentUser = "Guest User";

// OVERWRITE LOGIN FUNCTION: Ask for name before starting
function guestLogin() { 
    let userName = prompt("Enter your Name for the Leaderboard:");
    if (userName && userName.trim() !== "") {
        currentUser = userName;
        document.getElementById('student-name').innerText = currentUser;
    }
    switchScreen('landing-screen', 'dashboard-screen'); 
}

// OVERWRITE RESULT FUNCTION: Push to Firebase automatically
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
    
    let m = Math.floor(timeSpent / 60);
    let s = timeSpent % 60;
    let timeString = `${m}m ${s}s`;
    document.getElementById('time-taken').innerText = timeString;

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

    setTimeout(() => {
        ['Physics', 'Chemistry', 'Mathematics'].forEach(sub => {
            let pct = stats[sub].t > 0 ? Math.round((stats[sub].p / stats[sub].t) * 100) : 0;
            let shortSub = sub === 'Mathematics' ? 'math' : (sub === 'Chemistry' ? 'chem' : 'phy');
            document.getElementById(`bar-${shortSub}`).style.width = `${pct}%`;
            document.getElementById(`pct-${shortSub}`).innerText = `${pct}%`;
        });
    }, 500);

    // --- PUSH TO FIREBASE ---
    if (pendingTestId) {
        let userRecord = {
            name: currentUser,
            score: finalScore,
            time: timeString,
            timestamp: Date.now()
        };
        db.ref('leaderboards/' + pendingTestId).push(userRecord)
          .then(() => console.log("Data successfully sent to Founder Terminal."))
          .catch(err => console.error("Firebase Error: ", err));
    }
}
