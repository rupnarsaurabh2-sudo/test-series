// ========================================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ========================================================
let questions = {};
let currentSubject = "Physics";
let currentQIndex = 0; 
let timerInterval;
let totalTime; 
let timeSpent = 0;
let testState = {}; 
let testControls = {}; 

let pendingTestId = "";
let pendingTestTime = 0;
let screenHistory = ['landing-screen']; 

let currentExamTarget = 'JEE'; // Default
let hasPremium = false; // Premium flag

window.onload = function() {
    createLeaves();
    checkAutoLogin();
    checkPremiumStatus();
    listenToTestControls(); 
};

// ========================================================
// 2. FIREBASE & PREMIUM LOGIC
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

if (typeof firebase !== 'undefined' && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

let currentUser = "Scholar";
let currentUsername = "scholar";

function checkPremiumStatus() {
    hasPremium = localStorage.getItem("vault_premium") === "true";
}

function openPremiumModal() { document.getElementById('premium-modal').classList.remove('hidden'); }
function closePremiumModal() { document.getElementById('premium-modal').classList.add('hidden'); }

// DUMMY PAYMENT GATEWAY - In future, connect Razorpay/PhonePe here
function activatePremium() {
    alert("Payment Successful! Welcome to Ranker's Premium 👑");
    hasPremium = true;
    localStorage.setItem("vault_premium", "true");
    closePremiumModal();
    generateGrids(); // Refresh grids to unlock premium tests
}

// ========================================================
// 3. TARGET EXAM & GRIDS (FREE vs PREMIUM)
// ========================================================
function setExamTarget(examName) {
    currentExamTarget = examName;
    document.getElementById('side-menu').classList.add('hidden');
    switchScreen('exam-selection-screen', 'dashboard-screen'); 
}

function listenToTestControls() {
    if(db) {
        db.ref('test_controls').on('value', (snapshot) => {
            testControls = snapshot.val() || {};
            generateGrids();
        });
    } else { generateGrids(); }
}

function generateGrids() {
    const dayGrid = document.getElementById('days-grid');
    if(dayGrid) {
        dayGrid.innerHTML = '';
        for(let i=1; i<=75; i++) {
            let isUnlocked = testControls[`day_${i}`] === true; // Founder control
            let isFree = (i === 1); // Only Day 1 is free
            
            let btn = document.createElement('button');
            if(isUnlocked && (isFree || hasPremium)) {
                btn.className = 'day-unlocked';
                btn.innerText = `Day ${i}`;
                btn.onclick = () => showAllTheBest(`day_${i}`, currentExamTarget === 'NEET' ? 20 : 15);
            } else if (isUnlocked && !hasPremium && !isFree) {
                btn.className = 'day-unlocked';
                btn.style.background = 'rgba(212,175,55,0.2)';
                btn.innerText = `Day ${i} 👑`;
                btn.onclick = () => openPremiumModal();
            } else {
                btn.className = 'day-locked';
                btn.innerText = `Day ${i} 🔒`;
                btn.onclick = () => alert("Locked by Founder. Keep revising!");
            }
            dayGrid.appendChild(btn);
        }
    }

    const testGrid = document.getElementById('tests-grid');
    if(testGrid) {
        testGrid.innerHTML = '';
        for(let i=1; i<=10; i++) {
            let isUnlocked = testControls[`full_test_${i}`] === true;
            let isFree = (i === 1);
            
            let btn = document.createElement('button');
            if(isUnlocked && (isFree || hasPremium)) {
                btn.className = 'day-unlocked';
                btn.innerText = `Test ${i}`;
                btn.onclick = () => showAllTheBest(`full_test_${i}`, currentExamTarget === 'NEET' ? 200 : 180);
            } else if (isUnlocked && !hasPremium && !isFree) {
                btn.className = 'day-unlocked';
                btn.style.background = 'rgba(212,175,55,0.2)';
                btn.innerText = `Test ${i} 👑`;
                btn.onclick = () => openPremiumModal();
            } else {
                btn.className = 'day-locked';
                btn.innerText = `Test ${i} 🔒`;
                btn.onclick = () => alert("Full Test locked by Founder.");
            }
            testGrid.appendChild(btn);
        }
    }
}

// ... [Keep checkAutoLogin, submitAuth, performLogout, updateUserUI, toggleSidebar, switchScreen, goBack, updateSystemUI exactly same as before] ...

function checkAutoLogin() {
    let savedUser = localStorage.getItem("vault_username");
    if(savedUser) {
        currentUser = savedUser; currentUsername = savedUser;
        updateUserUI(); switchScreen('landing-screen', 'exam-selection-screen');
    }
}
function openAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }
function togglePassword() {
    let passInput = document.getElementById('reg-pass'); let eyeIcon = document.getElementById('eye-icon');
    if(passInput.type === "password") { passInput.type = "text"; eyeIcon.innerText = "🙈"; } 
    else { passInput.type = "password"; eyeIcon.innerText = "👁️"; }
}
function submitAuth() {
    let username = document.getElementById('reg-username').value;
    if (!username) return alert("Please enter a username.");
    currentUser = username; currentUsername = username.toLowerCase().replace(/\s+/g, '');
    localStorage.setItem("vault_username", currentUsername);
    updateUserUI();
    if(db) db.ref('users/' + currentUsername).update({ username: currentUsername, lastLogin: Date.now() });
    closeAuthModal(); switchScreen('landing-screen', 'exam-selection-screen'); 
}
function performLogout() { localStorage.removeItem("vault_username"); location.reload(); }
function updateUserUI() {
    document.getElementById('student-name').innerText = currentUsername;
    document.getElementById('dash-student-name').innerText = currentUsername;
}
function toggleSidebar() { document.getElementById('side-menu').classList.toggle('hidden'); }
function openDashboard(examType) { if (examType === 'main') { switchScreen('exam-selection-screen', 'dashboard-screen'); document.getElementById('side-menu').classList.add('hidden'); } }
function createLeaves() {
    const container = document.getElementById('leaf-container'); const leafShapes = ['🍁', '🍂', '✨', '🍃'];
    for(let i=0; i<20; i++) {
        let leaf = document.createElement('div'); leaf.className = 'leaf';
        leaf.innerText = leafShapes[Math.floor(Math.random() * leafShapes.length)];
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 6 + 7) + 's, ' + (Math.random() * 3 + 2) + 's';
        leaf.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 2) + 's';
        leaf.style.fontSize = (Math.random() * 12 + 14) + 'px';
        container.appendChild(leaf);
    }
}
function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden'); document.getElementById(hideId).classList.remove('active-screen');
    document.getElementById(showId).classList.remove('hidden'); document.getElementById(showId).classList.add('active-screen');
    if(showId !== screenHistory[screenHistory.length - 1]) screenHistory.push(showId);
    updateSystemUI(showId);
}
function goBack() {
    if(screenHistory.length > 1) {
        let currentScreen = screenHistory.pop(); let prevScreen = screenHistory[screenHistory.length - 1];
        document.getElementById(currentScreen).classList.add('hidden'); document.getElementById(currentScreen).classList.remove('active-screen');
        document.getElementById(prevScreen).classList.remove('hidden'); document.getElementById(prevScreen).classList.add('active-screen');
        updateSystemUI(prevScreen);
    }
}
function updateSystemUI(activeScreenId) {
    const noBackScreens = ['landing-screen', 'exam-selection-screen', 'nta-screen', 'analysis-screen'];
    if(noBackScreens.includes(activeScreenId)) document.getElementById('universal-back').classList.add('hidden');
    else document.getElementById('universal-back').classList.remove('hidden');
    if(activeScreenId === 'nta-screen') { document.body.className = 'theme-nta'; document.getElementById('floating-dock').classList.add('hidden'); document.getElementById('leaf-container').classList.add('hidden'); } 
    else { document.body.className = 'theme-premium'; document.getElementById('floating-dock').classList.remove('hidden'); document.getElementById('leaf-container').classList.remove('hidden'); }
}
function openDaySelection() { switchScreen('dashboard-screen', 'day-selection-screen'); }
function openTestSelection() { switchScreen('dashboard-screen', 'test-selection-screen'); }
function showAllTheBest(testId, timeInMins) { pendingTestId = testId; pendingTestTime = timeInMins; document.getElementById('all-best-modal').classList.remove('hidden'); }
function closeAllBestModal() { document.getElementById('all-best-modal').classList.add('hidden'); }
function confirmStartTest() { closeAllBestModal(); startTest(pendingTestId, pendingTestTime); }

// ========================================================
// 4. TEST ENGINE (DYNAMIC JEE/NEET)
// ========================================================
async function fetchQuestions(testId) {
    let fileName = "";
    if (currentExamTarget === 'NEET') {
        fileName = testId.includes('day') ? 'data/neet_daily.json' : 'data/neet_full_tests.json';
    } else {
        fileName = testId.includes('day') ? 'data/jee_daily.json' : 'data/jee_full_tests.json';
    }
    
    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error("HTTP Status " + response.status);
        const database = await response.json();
        if (!database[testId]) { alert(`Test missing in ${fileName}.`); return null; }
        return database[testId];
    } catch (e) {
        alert(`Error loading ${fileName}. Check file names and JSON structure.`); return null; 
    }
}

async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    if(!questions) return; 
    
    testState = {};
    let subjects = Object.keys(questions);
    
    // Dynamically build NTA tabs
    const tabsContainer = document.querySelector('.nta-tabs');
    tabsContainer.innerHTML = '';
    subjects.forEach(sub => {
        tabsContainer.innerHTML += `<button class="tab-btn" onclick="switchSubject('${sub}')">${sub}</button>`;
        questions[sub].forEach((q, idx) => {
            testState[q.id] = { status: 'not-visited', selectedOpt: null, type: q.type, subject: sub };
        });
    });

    switchScreen(document.querySelector('.active-screen').id, 'nta-screen');
    totalTime = timeInMins * 60;
    timeSpent = 0;
    startTimer();
    switchSubject(subjects[0]); // Start with first subject (Physics)
}

function startTimer() {
    clearInterval(timerInterval);
    const display = document.getElementById('time-left');
    timerInterval = setInterval(() => {
        totalTime--; timeSpent++;
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
    currentQIndex = idx; let q = questions[currentSubject][idx];
    if(testState[q.id].status === 'not-visited') testState[q.id].status = 'not-answered';
    
    document.getElementById('current-q-no').innerText = idx + 1;
    document.getElementById('q-text').innerText = q.q;
    
    const optArea = document.getElementById('options-area');
    const numArea = document.getElementById('numerical-area');
    const numInput = document.getElementById('num-answer');

    if(q.type === 'numerical') {
        optArea.classList.add('hidden'); numArea.classList.remove('hidden');
        numInput.value = testState[q.id].selectedOpt !== null ? testState[q.id].selectedOpt : '';
    } else {
        numArea.classList.add('hidden'); optArea.classList.remove('hidden'); optArea.innerHTML = '';
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
    if(q.type === 'numerical') { let val = document.getElementById('num-answer').value; if(val !== "") testState[q.id].selectedOpt = parseFloat(val); }
    if(testState[q.id].selectedOpt !== null) testState[q.id].status = 'answered';
    if(currentQIndex < questions[currentSubject].length - 1) loadQuestion(currentQIndex + 1);
    else buildPalette();
}
function markForReview() { testState[questions[currentSubject][currentQIndex].id].status = 'marked'; saveAndNext(); }
function clearResponse() { let q = questions[currentSubject][currentQIndex]; testState[q.id].selectedOpt = null; testState[q.id].status = 'not-answered'; loadQuestion(currentQIndex); }
function submitTestEarly() { if(confirm("Submit the test now?")) { clearInterval(timerInterval); calculateAndShowResult(); } }

function calculateAndShowResult() {
    let stats = {};
    Object.keys(questions).forEach(sub => { stats[sub] = {p:0, t:0}; });
    
    let totalPositive = 0, totalNegative = 0, totalQs = 0;

    Object.keys(questions).forEach(sub => {
        questions[sub].forEach(q => {
            totalQs++; stats[sub].t++;
            let state = testState[q.id];
            if(state.selectedOpt !== null) {
                if(state.selectedOpt === q.ans) { totalPositive += 4; stats[sub].p++; } 
                else if (q.type === 'mcq') { totalNegative += 1; }
            }
        });
    });

    let finalScore = totalPositive - totalNegative;
    let maxScore = totalQs * 4;
    
    let m = Math.floor(timeSpent / 60); let s = timeSpent % 60; let timeString = `${m}m ${s}s`;
    document.getElementById('time-taken').innerText = timeString;

    switchScreen('nta-screen', 'analysis-screen');
    document.getElementById('final-score').innerText = `${finalScore} / ${maxScore}`;
    document.getElementById('positive-score').innerText = `+${totalPositive}`;
    document.getElementById('negative-score').innerText = `-${totalNegative}`;
    
    if (finalScore >= (maxScore / 2)) document.getElementById('safe-zone-banner').classList.remove('hidden');
    else document.getElementById('safe-zone-banner').classList.add('hidden');

    // Dynamically build subject analysis bars
    const graphBox = document.querySelector('.graph-box');
    if(graphBox) {
        graphBox.innerHTML = '<h3 style="color: #d4af37; margin-bottom: 20px; font-size: 22px;">Subject-wise Accuracy</h3>';
        Object.keys(stats).forEach(sub => {
            let pct = stats[sub].t > 0 ? Math.round((stats[sub].p / stats[sub].t) * 100) : 0;
            graphBox.innerHTML += `
            <div class="bar-container">
                <div class="bar-label">${sub.substring(0,4)}</div>
                <div class="bar-bg"><div class="bar-fill" style="width: ${pct}%;"></div></div>
                <div class="bar-pct">${pct}%</div>
            </div>`;
        });
    }

    if (pendingTestId && db) {
        let userRecord = { name: currentUser, username: currentUsername, score: finalScore, time: timeString, timestamp: Date.now() };
        db.ref('leaderboards/' + pendingTestId).push(userRecord).catch(err => console.error(err));
        db.ref('users/' + currentUsername + '/history/' + pendingTestId).set(userRecord);
    }
}

// ... [Keep openReviewScreen, closeReviewScreen, and Bot Logic exactly same as before] ...
function openReviewScreen() {
    switchScreen('analysis-screen', 'review-screen'); const container = document.getElementById('review-content'); container.innerHTML = '';
    Object.keys(questions).forEach(sub => {
        if(questions[sub].length > 0) {
            container.innerHTML += `<h2 class="sub-title">${sub}</h2>`;
            questions[sub].forEach((q, i) => {
                let state = testState[q.id]; let isCorrect = state.selectedOpt === q.ans;
                let html = `<div class="review-item"><div class="review-q">Q${i+1}. ${q.q}</div>`;
                if(q.type === 'numerical') { html += `<div class="review-opt ${isCorrect ? 'opt-correct' : (state.selectedOpt!==null ? 'opt-wrong':'')}">Your Answer: ${state.selectedOpt !== null ? state.selectedOpt : 'Not Attempted'}</div><div class="review-opt opt-correct">Correct Answer: ${q.ans}</div>`; } 
                else {
                    q.options.forEach((opt, oIdx) => {
                        let optClass = 'review-opt';
                        if(oIdx === q.ans) optClass += ' opt-correct'; else if(oIdx === state.selectedOpt) optClass += ' opt-wrong';
                        html += `<div class="${optClass}">${opt}</div>`;
                    });
                }
                if(q.hint) html += `<div class="review-hint">💡 Hint: ${q.hint}</div>`; html += `</div>`; container.innerHTML += html;
            });
        }
    });
}
function closeReviewScreen() { switchScreen('review-screen', 'analysis-screen'); }
function toggleBot() { document.getElementById('bot-window').classList.toggle('hidden'); }
const botResponses = { "Features?": "Ranker's Vault packs 3 main weapons...", "NTA Timer?": "Exactly like the real D-Day!", "Who are you?": "I am Saurav...", "Daily PYQs?": "75 Days Challenge..." };
function botReply(userText) { /* ...Bot Logic... */ }
