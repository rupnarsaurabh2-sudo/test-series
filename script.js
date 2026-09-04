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

const firebaseConfig = {
    apiKey: "AIzaSyD-CNz9PBUbIn0jflol8LJc1f_ZErwVyiU",
    authDomain: "rankersvault-5e76f.firebaseapp.com",
    projectId: "rankersvault-5e76f",
    storageBucket: "rankersvault-5e76f.firebasestorage.app",
    messagingSenderId: "56527682160",
    appId: "1:56527682160:web:a88fdbea88af7d30b1d2b5",
    databaseURL: "https://rankersvault-5e76f-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();
const auth = firebase.auth();
let activeExamTarget = "main"; 

window.onload = function() {
    createLeaves();
    listenToAuthChanges(); 
    listenToTestControls(); 
};

// ========================================================
// 1. SECURE AUTHENTICATION
// ========================================================
function listenToAuthChanges() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUid = user.uid;
            currentUserEmail = user.email;
            let displayName = user.email.split('@')[0];
            
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
            currentUid = "";
            currentUserEmail = "";
            userPurchases = {};
            
            let active = document.querySelector('.active-screen');
            if(active && active.id !== 'landing-screen') {
                switchScreen(active.id, 'landing-screen');
            }
        }
    });
}

function openAuthModal() { 
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-modal').classList.remove('hidden'); 
}
function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

function togglePassword() {
    let passInput = document.getElementById('auth-pass');
    let eyeIcon = document.getElementById('eye-icon');
    if(passInput.type === "password") { passInput.type = "text"; eyeIcon.innerText = "🙈"; } 
    else { passInput.type = "password"; eyeIcon.innerText = "👁️"; }
}

function showError(msg) {
    let errBox = document.getElementById('auth-error');
    errBox.innerText = msg;
    errBox.style.display = 'block';
}

function submitSignUp() {
    let email = document.getElementById('auth-email').value.trim();
    let pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { showError("Email and Password required!"); return; }
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            db.ref('users/' + userCredential.user.uid + '/profile').set({ email: email, joinDate: Date.now() });
        })
        .catch((error) => showError(error.message));
}

function submitLogin() {
    let email = document.getElementById('auth-email').value.trim();
    let pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { showError("Email and Password required!"); return; }
    
    auth.signInWithEmailAndPassword(email, pass)
        .catch((error) => showError(error.message));
}

function performLogout() { 
    auth.signOut().catch((error) => alert(error.message));
}

function fetchUserPurchases() {
    if(!currentUid) return;
    db.ref('users/' + currentUid + '/purchased').on('value', snap => {
        userPurchases = snap.val() || {};
        
        let isPro = userPurchases['all'] || userPurchases['main'] || userPurchases['advanced'] || userPurchases['neet'] || userPurchases['mhtcet'];
        let tgBanner = document.getElementById('pro-benefits-section');
        
        if(tgBanner) {
            if(isPro) {
                tgBanner.classList.remove('hidden');
                updateCertificateData(); // Naya UI populate karne ke liye call kiya
            } else {
                tgBanner.classList.add('hidden');
            }
        }

        if(document.getElementById('test-selection-screen').classList.contains('active-screen')){
            generateGrids();
        }
    });
}

// ========================================================
// 1.5 CERTIFICATE CALCULATION LOGIC
// ========================================================
function updateCertificateData() {
    let name = currentUserEmail.split('@')[0].toUpperCase();
    document.getElementById('cert-name').innerText = name;
    
    // 1. Set current month dynamically
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let d = new Date();
    document.getElementById('cert-month').innerText = monthNames[d.getMonth()] + " " + d.getFullYear();
    
    // 2. Fetch User's Max Score and Total Users to Calculate Rank & Status
    if(db && currentUid) {
        db.ref('users').once('value').then(usersSnap => {
            let totalRealUsers = usersSnap.numChildren();
            let basePopulation = 500; // Base total students to make rank look good
            let totalStudents = basePopulation + totalRealUsers;
            
            // Check current user's history for scores
            db.ref('users/' + currentUid + '/history').once('value').then(histSnap => {
                let history = histSnap.val();
                let maxScore = 0;
                let userRank = totalStudents; // default worst rank
                let perfTag = "GOOD";
                let perfClass = "perf-good";

                if (history) {
                    // Find max score out of all tests attempted
                    Object.values(history).forEach(test => {
                        if (test.score > maxScore) maxScore = test.score;
                    });

                    // Algorithm for Rank and Performance Tag based on Max Score
                    if (maxScore > 200) { 
                        userRank = Math.floor(Math.random() * 20) + 1; // Top 20 
                        perfTag = "BEST"; 
                        perfClass = "perf-best";
                    } else if (maxScore > 100) { 
                        userRank = Math.floor(Math.random() * 100) + 50; 
                        perfTag = "BETTER"; 
                        perfClass = "perf-better";
                    } else if (maxScore > 0) {
                        userRank = Math.floor(Math.random() * 200) + 150; 
                        perfTag = "GOOD"; 
                        perfClass = "perf-good";
                    }
                } else {
                    // New Pro user who hasn't given test yet
                    userRank = totalStudents - 10; 
                }

                document.getElementById('cert-rank').innerText = `${userRank} / ${totalStudents}`;
                let badge = document.getElementById('cert-perf');
                badge.innerText = perfTag;
                badge.className = `perf-badge ${perfClass}`;
            });
        });
    }
}

// ========================================================
// 2. DASHBOARD & UI DYNAMICS
// ========================================================
function toggleSidebar() { document.getElementById('side-menu').classList.toggle('hidden'); }

function openDashboard(examType) {
    activeExamTarget = examType;
    let titleMap = {
        'main': 'JEE MAIN VAULT',
        'advanced': 'JEE ADVANCED VAULT',
        'neet': 'NEET UG VAULT',
        'mhtcet': 'MHT CET VAULT'
    };
    
    document.getElementById('dashboard-header-title').innerText = titleMap[examType];
    document.getElementById('dash-target-title').innerText = `Target: ${titleMap[examType]} | System Ready`;
    
    if(examType === 'main') {
        document.getElementById('daily-challenge-card').classList.remove('hidden');
    } else {
        document.getElementById('daily-challenge-card').classList.add('hidden');
    }

    let nPhy = document.getElementById('notes-phy-title');
    let nChem = document.getElementById('notes-chem-title');
    let nMathBio = document.getElementById('notes-mathbio-title');
    let ntaTabMathBio = document.getElementById('nta-tab-mathbio');
    let analysisLabel = document.getElementById('analysis-mathbio-label');

    if(examType === 'main' || examType === 'mhtcet') {
        nPhy.innerText = 'Physics Notes'; nChem.innerText = 'Chemistry Notes';
        nMathBio.innerText = 'Mathematics Notes'; ntaTabMathBio.innerText = 'Mathematics'; analysisLabel.innerText = 'Maths';
    } else if (examType === 'advanced') {
        nPhy.innerText = 'Adv. Physics Notes'; nChem.innerText = 'Adv. Chemistry Notes';
        nMathBio.innerText = 'Adv. Mathematics Notes'; ntaTabMathBio.innerText = 'Mathematics'; analysisLabel.innerText = 'Maths';
    } else if (examType === 'neet') {
        nPhy.innerText = 'Physics Notes'; nChem.innerText = 'Chemistry Notes';
        nMathBio.innerText = 'Biology Notes'; ntaTabMathBio.innerText = 'Biology'; analysisLabel.innerText = 'Biology';
    }
    
    switchScreen('exam-selection-screen', 'dashboard-screen');
    document.getElementById('side-menu').classList.add('hidden');
    generateGrids();
}

function openPremiumModal() {
    document.getElementById('modal-target-name').innerText = activeExamTarget.toUpperCase() + " Pack";
    document.getElementById('premium-modal').classList.remove('hidden');
}
function closePremiumModal() { document.getElementById('premium-modal').classList.add('hidden'); }

// ========================================================
// 3. SECURE RAZORPAY PAYMENT
// ========================================================
function triggerPayment(amount, planType) { startRazorpayPayment(amount, planType); }

async function startRazorpayPayment(amountInPaise, planType) {
    if(!currentUid) { alert("Please login first!"); return; }
    closePremiumModal();
    alert(`Initiating ₹${amountInPaise/100} payment for ${planType.toUpperCase()}...`);
    
    try {
        const response = await fetch('/api/createOrder', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountInPaise, currency: "INR" }) 
        });

        if (!response.ok) { alert("Backend API Error!"); return; }
        const orderData = await response.json();
        if (!orderData.id) { alert("Razorpay Error!"); return; }

        var options = {
            "key": "rzp_test_TXaJFc0u3LxNqI", 
            "amount": orderData.amount, 
            "currency": orderData.currency,
            "name": "Ranker's Vault Pro",
            "description": `${planType.toUpperCase()} Access Unlock`,
            "order_id": orderData.id,
            "config": {
                "display": {
                    "blocks": { "upi_block": { "name": "Pay via QR / UPI", "instruments": [ {"method": "upi"} ] } },
                    "sequence": ["block.upi_block"],
                    "preferences": { "show_default_blocks": true }
                }
            },
            "handler": function (response){
                db.ref('users/' + currentUid + '/purchased/' + planType).set(true)
                .then(() => {
                    alert("Payment Successful! Welcome to Pro Vault.");
                    generateGrids(); 
                })
                .catch((error) => console.error("Firebase update failed:", error));
            },
            "prefill": { "email": currentUserEmail, "contact": "9000000000" },
            "theme": { "color": "#10b981" }
        };
        
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){ alert("Payment Failed! " + response.error.description); });
        rzp.open();
        
    } catch (error) {
        console.error("Payment error:", error);
    }
}

// ========================================================
// 4. GRIDS (75 Days & Pro Tests)
// ========================================================
function listenToTestControls() {
    if(db){
        db.ref('test_controls').on('value', (snapshot) => {
            testControls = snapshot.val() || {};
            generateGrids();
        });
    }
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
    document.getElementById('grid-exam-title').innerText = `10 Full Length Tests (${activeExamTarget.toUpperCase()})`;

    let hasPro = userPurchases['all'] === true;
    let hasTarget = userPurchases[activeExamTarget] === true;
    let isPremiumUser = hasPro || hasTarget;

    for(let i=1; i<=10; i++) {
        let testKey = prefix + i;
        let isGloballyLive = testControls[testKey] === true || testControls[`full_test_${i}`] === true;
        let isDemoTest = (i === 1); 
        
        let canAccess = false;
        if(isGloballyLive) {
            if(isDemoTest || isPremiumUser) canAccess = true;
        }

        let btn = document.createElement('button');
        btn.className = canAccess ? 'day-unlocked' : 'day-locked';
        btn.innerText = canAccess ? `Test ${i}` : `Test ${i} 🔒`;
        
        btn.onclick = () => {
            if(!isGloballyLive) {
                alert("Relax bro! This test is currently locked by the Founder.");
            } else if(!canAccess) {
                openPremiumModal();
            } else {
                showAllTheBest(testKey, 150);
            }
        };
        testGrid.appendChild(btn);
    }
}

// ========================================================
// 5. NTA ENGINE
// ========================================================
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

function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(hideId).classList.remove('active-screen');
    document.getElementById(showId).classList.remove('hidden');
    document.getElementById(showId).classList.add('active-screen');
    if(showId !== screenHistory[screenHistory.length - 1]) screenHistory.push(showId);
    updateSystemUI(showId);
    if(showId === 'test-selection-screen' || showId === 'day-selection-screen') generateGrids();
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

function updateSystemUI(activeScreenId) {
    const noBackScreens = ['landing-screen', 'exam-selection-screen', 'nta-screen', 'analysis-screen'];
    if(noBackScreens.includes(activeScreenId)) document.getElementById('universal-back').classList.add('hidden');
    else document.getElementById('universal-back').classList.remove('hidden');

    const navMenuBtn = document.getElementById('nav-menu-btn');
    if (navMenuBtn) {
        if(activeScreenId === 'landing-screen') navMenuBtn.classList.add('hidden');
        else navMenuBtn.classList.remove('hidden');
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
function showAllTheBest(testId, timeInMins) {
    pendingTestId = testId;
    pendingTestTime = timeInMins;
    document.getElementById('all-best-modal').classList.remove('hidden');
}
function closeAllBestModal() { document.getElementById('all-best-modal').classList.add('hidden'); }
function confirmStartTest() { closeAllBestModal(); startTest(pendingTestId, pendingTestTime); }

async function fetchQuestions(testId) {
    let fileName = '';
    if (activeExamTarget === 'main') { fileName = testId.includes('day') ? 'data/jee_daily.json' : 'data/jee_full_tests.json'; }
    else if (activeExamTarget === 'advanced') { fileName = 'data/advanced_full_tests.json'; }
    else if (activeExamTarget === 'neet') { fileName = 'data/neet_full_tests.json'; }
    else if (activeExamTarget === 'mhtcet') { fileName = 'data/mhtcet_full_tests.json'; }

    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error("HTTP Status " + response.status);
        const database = await response.json();
        if (!database[testId]) { alert(`Error: Test '${testId}' is missing in ${fileName}.`); return null; }
        return database[testId];
    } catch (e) {
        console.error("JSON Error:", e);
        alert(`Bhai, test load nahi hua! JSON Data file GitHub me add nahi hai.`);
        return null; 
    }
}

async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    if(!questions) return; 
    
    testState = {};
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach((q, idx) => { testState[q.id] = { status: 'not-visited', selectedOpt: null, type: q.type, subject: sub }; });
    });

    switchScreen(document.querySelector('.active-screen').id, 'nta-screen');
    totalTime = timeInMins * 60;
    timeSpent = 0;
    startTimer();
    switchSubject(Object.keys(questions)[0] || 'Physics'); 
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === subName);
        if(!questions[btn.innerText]) btn.style.display = 'none';
        else btn.style.display = 'inline-block';
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
    let stats = { Physics: {p:0, t:0}, Chemistry: {p:0, t:0}, Mathematics: {p:0, t:0}, Biology: {p:0, t:0} };
    let totalPositive = 0, totalNegative = 0, totalQs = 0;

    Object.keys(questions).forEach(sub => {
        if(!stats[sub]) stats[sub] = {p:0, t:0};
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
    let timeString = `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`;
    document.getElementById('time-taken').innerText = timeString;

    switchScreen('nta-screen', 'analysis-screen');
    
    document.getElementById('final-score').innerText = `${finalScore} / ${maxScore}`;
    document.getElementById('positive-score').innerText = `+${totalPositive}`;
    document.getElementById('negative-score').innerText = `-${totalNegative}`;

    if (finalScore >= (maxScore / 2)) { document.getElementById('safe-zone-banner').classList.remove('hidden'); } 
    else { document.getElementById('safe-zone-banner').classList.add('hidden'); }

    setTimeout(() => {
        ['Physics', 'Chemistry', 'Mathematics', 'Biology'].forEach(sub => {
            if(stats[sub]) {
                let pct = stats[sub].t > 0 ? Math.round((stats[sub].p / stats[sub].t) * 100) : 0;
                let shortSub = sub === 'Mathematics' ? 'math' : (sub === 'Chemistry' ? 'chem' : (sub === 'Physics' ? 'phy' : 'math'));
                let bar = document.getElementById(`bar-${shortSub}`);
                let pctText = document.getElementById(`pct-${shortSub}`);
                if(bar) bar.style.width = `${pct}%`;
                if(pctText) pctText.innerText = `${pct}%`;
            }
        });
    }, 500);

    if (pendingTestId && db && currentUid) {
        let userRecord = { name: currentUserEmail.split('@')[0], username: currentUserEmail, score: finalScore, time: timeString, timestamp: Date.now() };
        db.ref('leaderboards/' + pendingTestId).push(userRecord).catch(err => console.error(err));
        db.ref('users/' + currentUid + '/history/' + pendingTestId).set(userRecord).then(() => {
            // Update certificate globally when test finishes
            updateCertificateData(); 
        });
    }
}

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
                let html = `<div class="review-item"><div class="review-q">Q${i+1}. ${q.q}</div>`;

                if(q.type === 'numerical') {
                    html += `<div class="review-opt ${isCorrect ? 'opt-correct' : (state.selectedOpt!==null ? 'opt-wrong':'')}">Your Answer: ${state.selectedOpt !== null ? state.selectedOpt : 'Not Attempted'}</div><div class="review-opt opt-correct">Correct Answer: ${q.ans}</div>`;
                } else {
                    q.options.forEach((opt, oIdx) => {
                        let optClass = 'review-opt';
                        if(oIdx === q.ans) optClass += ' opt-correct';
                        else if(oIdx === state.selectedOpt) optClass += ' opt-wrong';
                        html += `<div class="${optClass}">${opt}</div>`;
                    });
                }
                if(q.hint) html += `<div class="review-hint">💡 Hint: ${q.hint}</div>`;
                html += `</div>`;
                container.innerHTML += html;
            });
        }
    });
}
function closeReviewScreen() { switchScreen('review-screen', 'analysis-screen'); }
