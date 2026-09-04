let questions = {};
let currentSubject = "Physics";
let currentQIndex = 0; 
let timerInterval;
let totalTime; 
let timeSpent = 0;
let testState = {}; 
let testControls = {}; 
let userPurchases = {}; 

let pendingTestId = "";
let pendingTestTime = 0;
let screenHistory = ['landing-screen']; 

let currentUserEmail = "";
let currentUid = "";
let activeExamTarget = "main"; 

const firebaseConfig = {
    apiKey: "AIzaSyD-CNz9PBUbIn0jflol8LJc1f_ZErwVyiU",
    authDomain: "rankersvault-5e76f.firebaseapp.com",
    projectId: "rankersvault-5e76f",
    databaseURL: "https://rankersvault-5e76f-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();
const auth = firebase.auth();

window.onload = function() {
    createGoldenRain(); // Naya backend visual effect
    listenToAuthChanges(); 
    listenToTestControls(); 
};

// ========================================================
// 1. VISUAL EFFECTS (GOLDEN RAIN)
// ========================================================
function createGoldenRain() {
    const container = document.getElementById('leaf-container');
    if(!container) return;
    for(let i=0; i<35; i++) {
        let drop = document.createElement('div');
        drop.className = 'gold-drop';
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        drop.style.animationDelay = (Math.random() * 3) + 's';
        container.appendChild(drop);
    }
}

// ========================================================
// 2. BULLETPROOF AUTHENTICATION
// ========================================================
function listenToAuthChanges() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUid = user.uid;
            currentUserEmail = user.email;
            let displayName = user.email.split('@')[0].toUpperCase();
            
            document.getElementById('student-name').innerText = displayName;
            document.getElementById('dash-student-name').innerText = displayName;
            if(document.getElementById('sidebar-name')) document.getElementById('sidebar-name').innerText = displayName;
            if(document.getElementById('sidebar-username')) document.getElementById('sidebar-username').innerText = currentUserEmail;

            fetchUserPurchases();
            closeAuthModal();
            
            if(document.getElementById('landing-screen').classList.contains('active-screen')) {
                switchScreen('landing-screen', 'exam-selection-screen');
            }
        } else {
            currentUid = ""; currentUserEmail = ""; userPurchases = {};
            let active = document.querySelector('.active-screen');
            if(active && active.id !== 'landing-screen') switchScreen(active.id, 'landing-screen');
        }
    });
}

function openAuthModal() { 
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-modal').classList.remove('hidden'); 
}
function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

function showError(msg) {
    let errBox = document.getElementById('auth-error');
    errBox.innerText = msg;
    errBox.style.display = 'block';
}

function submitSignUp() {
    let email = document.getElementById('auth-email').value.trim();
    let pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { showError("⚠️ Email and Password required!"); return; }
    
    document.getElementById('auth-error').style.display = 'none'; // clear old error
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            db.ref('users/' + userCredential.user.uid + '/profile').set({ email: email, joinDate: Date.now() });
        })
        .catch((error) => showError("❌ Sign Up Error: " + error.message));
}

function submitLogin() {
    let email = document.getElementById('auth-email').value.trim();
    let pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { showError("⚠️ Email and Password required!"); return; }
    
    document.getElementById('auth-error').style.display = 'none'; // clear old error

    auth.signInWithEmailAndPassword(email, pass)
        .catch((error) => showError("❌ Login Error: " + error.message));
}

function performLogout() { auth.signOut().catch((error) => alert(error.message)); }

// ========================================================
// 3. DASHBOARD & DATA FETCHING
// ========================================================
function fetchUserPurchases() {
    if(!currentUid) return;
    db.ref('users/' + currentUid + '/purchased').on('value', snap => {
        userPurchases = snap.val() || {};
        let isPro = userPurchases['all'] || userPurchases['main'] || userPurchases['advanced'] || userPurchases['neet'] || userPurchases['mhtcet'];
        let tgBanner = document.getElementById('pro-benefits-section');
        
        if(tgBanner) {
            if(isPro) { tgBanner.classList.remove('hidden'); updateCertificateData(); } 
            else { tgBanner.classList.add('hidden'); }
        }
        if(document.getElementById('test-selection-screen').classList.contains('active-screen')){ generateGrids(); }
    });
}

function updateCertificateData() {
    let name = currentUserEmail.split('@')[0].toUpperCase();
    document.getElementById('cert-name').innerText = name;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let d = new Date();
    document.getElementById('cert-month').innerText = monthNames[d.getMonth()] + " " + d.getFullYear();
    
    if(db && currentUid) {
        db.ref('users').once('value').then(usersSnap => {
            let totalStudents = 500 + usersSnap.numChildren();
            db.ref('users/' + currentUid + '/history').once('value').then(histSnap => {
                let history = histSnap.val();
                let maxScore = 0; let userRank = totalStudents; let perfTag = "GOOD";
                if (history) {
                    Object.values(history).forEach(test => { if (test.score > maxScore) maxScore = test.score; });
                    if (maxScore > 200) { userRank = Math.floor(Math.random()*20)+1; perfTag = "BEST"; } 
                    else if (maxScore > 100) { userRank = Math.floor(Math.random()*100)+50; perfTag = "BETTER"; } 
                    else if (maxScore > 0) { userRank = Math.floor(Math.random()*200)+150; perfTag = "GOOD"; }
                } else { userRank = totalStudents - 10; }
                document.getElementById('cert-rank').innerText = `${userRank} / ${totalStudents}`;
                document.getElementById('cert-perf').innerText = perfTag;
            });
        });
    }
}

function openDashboard(examType) {
    activeExamTarget = examType;
    let titleMap = { 'main': 'JEE MAIN', 'advanced': 'JEE ADVANCED', 'neet': 'NEET UG', 'mhtcet': 'MHT CET' };
    document.getElementById('dashboard-header-title').innerText = titleMap[examType] + " VAULT";
    document.getElementById('dash-target-title').innerText = `TARGET: ${titleMap[examType]} | SECURE`;
    
    if(examType === 'main') document.getElementById('daily-challenge-card').classList.remove('hidden');
    else document.getElementById('daily-challenge-card').classList.add('hidden');
    
    switchScreen('exam-selection-screen', 'dashboard-screen');
    document.getElementById('side-menu').classList.add('hidden');
    generateGrids();
}

function triggerPayment(amount, planType) {
    if(!currentUid) { alert("Please login first!"); return; }
    closePremiumModal();
    alert(`Initiating ₹${amount/100} payment for ${planType.toUpperCase()}...`);
    db.ref('users/' + currentUid + '/purchased/' + planType).set(true).then(() => {
        alert("Payment Successful! Welcome to Pro Vault.");
        generateGrids(); 
    }).catch(e => alert(e));
}

function listenToTestControls() {
    if(db){ db.ref('test_controls').on('value', (snapshot) => { testControls = snapshot.val() || {}; generateGrids(); }); }
}

function generateGrids() {
    const dayGrid = document.getElementById('days-grid');
    if(dayGrid && activeExamTarget === 'main') {
        dayGrid.innerHTML = '';
        for(let i=1; i<=75; i++) {
            let isGloballyLive = testControls[`day_${i}`] === true; 
            let btn = document.createElement('button');
            btn.className = isGloballyLive ? 'day-unlocked' : 'day-locked';
            btn.innerText = isGloballyLive ? `Day ${i}` : `Day ${i} 🔒`;
            btn.onclick = () => {
                if(isGloballyLive) showAllTheBest(`day_${i}`, 15);
                else alert("Relax bro! This Daily PYQ is locked by the Founder.");
            };
            dayGrid.appendChild(btn);
        }
    }
    const testGrid = document.getElementById('tests-grid');
    if(!testGrid) return;
    testGrid.innerHTML = '';
    let prefix = activeExamTarget === 'main' ? 'full_test_' : (activeExamTarget + '_test_');
    let hasPro = userPurchases['all'] === true; let hasTarget = userPurchases[activeExamTarget] === true; let isPremiumUser = hasPro || hasTarget;

    for(let i=1; i<=10; i++) {
        let testKey = prefix + i; let isGloballyLive = testControls[testKey] === true || testControls[`full_test_${i}`] === true; let isDemoTest = (i === 1); 
        let canAccess = false;
        if(isGloballyLive) { if(isDemoTest || isPremiumUser) canAccess = true; }

        let btn = document.createElement('button');
        btn.className = canAccess ? 'day-unlocked' : 'day-locked';
        btn.innerText = canAccess ? `Test ${i}` : `Test ${i} 🔒`;
        btn.onclick = () => {
            if(!isGloballyLive) alert("Relax bro! This test is currently locked by the Founder.");
            else if(!canAccess) document.getElementById('premium-modal').classList.remove('hidden');
            else showAllTheBest(testKey, 150);
        };
        testGrid.appendChild(btn);
    }
}

// System Navigations
function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden'); document.getElementById(hideId).classList.remove('active-screen');
    document.getElementById(showId).classList.remove('hidden'); document.getElementById(showId).classList.add('active-screen');
    if(showId !== screenHistory[screenHistory.length - 1]) screenHistory.push(showId);
    updateSystemUI(showId); if(showId === 'test-selection-screen' || showId === 'day-selection-screen') generateGrids();
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
    if(activeScreenId === 'nta-screen') { document.body.className = 'theme-nta'; document.getElementById('leaf-container').classList.add('hidden'); } 
    else { document.body.className = 'theme-premium'; document.getElementById('leaf-container').classList.remove('hidden'); }
}
function toggleSidebar() { document.getElementById('side-menu').classList.toggle('hidden'); }
function closePremiumModal() { document.getElementById('premium-modal').classList.add('hidden'); }
function openDaySelection() { switchScreen('dashboard-screen', 'day-selection-screen'); }
function openTestSelection() { switchScreen('dashboard-screen', 'test-selection-screen'); }
function showAllTheBest(testId, timeInMins) { pendingTestId = testId; pendingTestTime = timeInMins; startTest(pendingTestId, pendingTestTime); }

async function fetchQuestions(testId) {
    let fileName = '';
    if (activeExamTarget === 'main') fileName = testId.includes('day') ? 'data/jee_daily.json' : 'data/jee_full_tests.json';
    else if (activeExamTarget === 'advanced') fileName = 'data/advanced_full_tests.json';
    else if (activeExamTarget === 'neet') fileName = 'data/neet_full_tests.json';
    else if (activeExamTarget === 'mhtcet') fileName = 'data/mhtcet_full_tests.json';
    try {
        const response = await fetch(fileName); const database = await response.json();
        if (!database[testId]) { alert(`Error: Test missing.`); return null; } return database[testId];
    } catch (e) { alert(`Test load failed! Check JSON data files.`); return null; }
}

async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId); if(!questions) return; 
    testState = {}; Object.keys(questions).forEach(sub => { questions[sub].forEach((q, idx) => { testState[q.id] = { status: 'not-visited', selectedOpt: null, type: q.type, subject: sub }; }); });
    switchScreen(document.querySelector('.active-screen').id, 'nta-screen');
    totalTime = timeInMins * 60; timeSpent = 0; startTimer(); switchSubject(Object.keys(questions)[0] || 'Physics'); 
}
function startTimer() {
    clearInterval(timerInterval); const display = document.getElementById('time-left');
    timerInterval = setInterval(() => {
        totalTime--; timeSpent++;
        let h = Math.floor(totalTime / 3600), m = Math.floor((totalTime % 3600) / 60), s = totalTime % 60;
        display.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (totalTime <= 0) { clearInterval(timerInterval); calculateAndShowResult(); }
    }, 1000);
}
function switchSubject(subName) {
    if(!questions[subName]) return; currentSubject = subName; currentQIndex = 0;
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.toggle('active', btn.innerText === subName); if(!questions[btn.innerText]) btn.style.display = 'none'; else btn.style.display = 'inline-block'; });
    buildPalette(); loadQuestion(0);
}
function buildPalette() {
    const palette = document.getElementById('question-palette'); palette.innerHTML = '';
    questions[currentSubject].forEach((q, idx) => { let btn = document.createElement('div'); btn.className = `badge ${testState[q.id].status}`; btn.innerText = idx + 1; btn.onclick = () => loadQuestion(idx); palette.appendChild(btn); });
    updateCounts();
}
function updateCounts() { let counts = { 'answered': 0, 'not-answered': 0, 'not-visited': 0, 'marked': 0 }; Object.values(testState).forEach(s => counts[s.status]++); Object.keys(counts).forEach(k => document.getElementById(`cnt-${k}`).innerText = counts[k]); }

function loadQuestion(idx) {
    currentQIndex = idx; let q = questions[currentSubject][idx]; if(testState[q.id].status === 'not-visited') testState[q.id].status = 'not-answered';
    document.getElementById('current-q-no').innerText = idx + 1; document.getElementById('q-text').innerText = q.q;
    const optArea = document.getElementById('options-area'); const numArea = document.getElementById('numerical-area'); const numInput = document.getElementById('num-answer');
    if(q.type === 'numerical') { optArea.classList.add('hidden'); numArea.classList.remove('hidden'); numInput.value = testState[q.id].selectedOpt !== null ? testState[q.id].selectedOpt : ''; } 
    else { numArea.classList.add('hidden'); optArea.classList.remove('hidden'); optArea.innerHTML = ''; q.options.forEach((opt, oIdx) => { let isChecked = testState[q.id].selectedOpt === oIdx ? 'checked' : ''; optArea.innerHTML += `<label class="opt-row"><input type="radio" name="opt" value="${oIdx}" ${isChecked} onchange="selectOption(${oIdx})"> ${opt}</label>`; }); }
    buildPalette(); 
}
function selectOption(val) { testState[questions[currentSubject][currentQIndex].id].selectedOpt = val; }
function saveAndNext() {
    let q = questions[currentSubject][currentQIndex]; if(q.type === 'numerical') { let val = document.getElementById('num-answer').value; if(val !== "") testState[q.id].selectedOpt = parseFloat(val); }
    if(testState[q.id].selectedOpt !== null) testState[q.id].status = 'answered';
    if(currentQIndex < questions[currentSubject].length - 1) loadQuestion(currentQIndex + 1); else buildPalette();
}
function markForReview() { testState[questions[currentSubject][currentQIndex].id].status = 'marked'; saveAndNext(); }
function clearResponse() { testState[questions[currentSubject][currentQIndex].id].selectedOpt = null; testState[questions[currentSubject][currentQIndex].id].status = 'not-answered'; loadQuestion(currentQIndex); }
function submitTestEarly() { if(confirm("Submit the test now?")) { clearInterval(timerInterval); calculateAndShowResult(); } }

function calculateAndShowResult() {
    let totalPositive = 0, totalNegative = 0, totalQs = 0;
    Object.keys(questions).forEach(sub => { questions[sub].forEach(q => { totalQs++; let state = testState[q.id]; if(state.selectedOpt !== null) { if(state.selectedOpt === q.ans) { totalPositive += 4; } else if (q.type === 'mcq') { totalNegative += 1; } } }); });
    let finalScore = totalPositive - totalNegative;
    document.getElementById('final-score').innerText = `${finalScore} / ${totalQs * 4}`;
    document.getElementById('time-taken').innerText = `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`;
    switchScreen('nta-screen', 'analysis-screen');
    if (pendingTestId && db && currentUid) {
        db.ref('users/' + currentUid + '/history/' + pendingTestId).set({ score: finalScore, timestamp: Date.now() }).then(() => updateCertificateData());
    }
}
