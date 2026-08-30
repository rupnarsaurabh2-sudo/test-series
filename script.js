let currentTestType = "";
let questions = [];
let currentSubject = "Physics";
let currentQIndex = 0; // Relative to subject
let timerInterval;
let totalTime; // in seconds
let timeSpent = 0;

// State array to track answers: { id, status: 'visited'|'answered'|'marked', selectedOpt: null }
let testState = {}; 

// Mock Data Fetch (JSON se aayega)
async function fetchQuestions(testId) {
    // Real implementation me fetch('data.json') use karna
    const dummyData = {
        "Physics": [
            { id: "p1", q: "A solid sphere rolls on rough surface...", options: ["Option A", "Option B", "Option C", "Option D"], ans: 0 },
            { id: "p2", q: "In YDSE, if source is shifted...", options: ["Up", "Down", "Same", "None"], ans: 1 }
        ],
        "Chemistry": [
            { id: "c1", q: "Resonating structure stability...", options: ["A", "B", "C", "D"], ans: 2 }
        ],
        "Mathematics": [
            { id: "m1", q: "Roots of equation x3 - 12x2...", options: ["1", "2", "3", "4"], ans: 2 }
        ]
    };
    return dummyData; // Assuming testId fetches appropriate length data
}

// UI Navigation
function openInfoModal() { document.getElementById('info-modal').classList.remove('hidden'); }
function closeInfoModal() { document.getElementById('info-modal').classList.add('hidden'); }
function openLogin() { alert("Login System Integration Pending. Using Guest Mode."); guestLogin(); }

function guestLogin() {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.body.className = 'theme-sky'; // Reset
}

// --- TEST ENGINE ---
async function startTest(testId, timeInMins) {
    questions = await fetchQuestions(testId);
    
    // Initialize State
    testState = {};
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach((q, idx) => {
            testState[q.id] = { status: 'not-visited', selectedOpt: null, globalIdx: idx, subject: sub };
        });
    });

    // Theme & UI Switch
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('nta-screen').classList.remove('hidden');
    document.body.className = 'theme-nta';
    
    totalTime = timeInMins * 60;
    timeSpent = 0;
    startTimer();
    
    switchSubject('Physics'); // Default
}

function startTimer() {
    clearInterval(timerInterval);
    const display = document.getElementById('time-left');
    
    timerInterval = setInterval(() => {
        totalTime--;
        timeSpent++;
        
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
    currentSubject = subName;
    currentQIndex = 0;
    
    // Update Tabs
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
    
    // Mark as not-answered if it was not-visited
    if(testState[q.id].status === 'not-visited') {
        testState[q.id].status = 'not-answered';
    }
    
    document.getElementById('current-q-no').innerText = idx + 1;
    document.getElementById('q-text').innerText = q.q;
    
    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';
    
    q.options.forEach((opt, oIdx) => {
        let isChecked = testState[q.id].selectedOpt === oIdx ? 'checked' : '';
        optArea.innerHTML += `
            <label class="opt-row">
                <input type="radio" name="opt" value="${oIdx}" ${isChecked} onchange="selectOption(${oIdx})">
                ${opt}
            </label>
        `;
    });
    
    buildPalette(); // Refresh palette colors
}

function selectOption(oIdx) {
    let qId = questions[currentSubject][currentQIndex].id;
    testState[qId].selectedOpt = oIdx;
}

// Action Buttons
function saveAndNext() {
    let qId = questions[currentSubject][currentQIndex].id;
    if(testState[qId].selectedOpt !== null) {
        testState[qId].status = 'answered';
    }
    moveToNext();
}

function markForReview() {
    let qId = questions[currentSubject][currentQIndex].id;
    testState[qId].status = 'marked';
    moveToNext();
}

function clearResponse() {
    let qId = questions[currentSubject][currentQIndex].id;
    testState[qId].selectedOpt = null;
    testState[qId].status = 'not-answered';
    loadQuestion(currentQIndex); // Reload to uncheck radio
}

function moveToNext() {
    if(currentQIndex < questions[currentSubject].length - 1) {
        loadQuestion(currentQIndex + 1);
    } else {
        alert("Section End. Switch tab to continue.");
        buildPalette();
    }
}

function submitTestEarly() {
    if(confirm("Are you sure you want to submit the test early?")) {
        clearInterval(timerInterval);
        calculateAndShowResult();
    }
}

// --- ANALYSIS LOGIC ---
function calculateAndShowResult() {
    let finalScore = 0;
    let correct = 0;
    let totalAttempted = 0;
    
    Object.keys(questions).forEach(sub => {
        questions[sub].forEach(q => {
            let state = testState[q.id];
            if(state.selectedOpt !== null) {
                totalAttempted++;
                if(state.selectedOpt === q.ans) {
                    finalScore += 4;
                    correct++;
                } else {
                    finalScore -= 1;
                }
            }
        });
    });

    let accuracy = totalAttempted > 0 ? Math.round((correct/totalAttempted)*100) : 0;
    
    document.getElementById('nta-screen').classList.add('hidden');
    document.getElementById('analysis-screen').classList.remove('hidden');
    document.body.className = 'theme-forest';
    
    document.getElementById('final-score').innerText = finalScore;
    document.getElementById('final-accuracy').innerText = `${accuracy}%`;
    document.getElementById('final-time').innerText = `${Math.floor(timeSpent/60)}m ${timeSpent%60}s`;
}
