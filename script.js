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

let pendingTestId = "";
let pendingTestTime = 0;
let screenHistory = ['landing-screen']; 

let currentExamTarget = 'JEE Main'; // Default Target
let currentUser = "Scholar";
let currentUsername = "scholar";

window.onload = function() {
    createSnow(); // New UI element
    createLeaves();
    checkAutoLogin();
};

// ========================================================
// 2. AUTH & SMART UI NAVIGATION (BACK BUTTON LOGIC)
// ========================================================
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
    if (!username || username.trim() === "") return alert("Please enter a username to unlock the vault.");
    currentUsername = username.toLowerCase().replace(/\s+/g, '');
    localStorage.setItem("vault_username", currentUsername);
    updateUserUI(); closeAuthModal(); switchScreen('landing-screen', 'exam-selection-screen'); 
}
function performLogout() { localStorage.removeItem("vault_username"); location.reload(); }
function updateUserUI() {
    document.getElementById('dash-student-name').innerText = currentUsername;
    if(document.getElementById('sidebar-name')) document.getElementById('sidebar-name').innerText = currentUsername;
}
function toggleSidebar() { document.getElementById('side-menu').classList.toggle('hidden'); }

// NAV & BACK LOGIC
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
}

// UI EFFECTS
function createSnow() {
    const container = document.getElementById('snow-container');
    if(!container) return;
    for(let i=0; i<30; i++) {
        let snow = document.createElement('div'); snow.className = 'snowflake';
        let size = Math.random() * 5 + 2;
        snow.style.width = size + 'px'; snow.style.height = size + 'px';
        snow.style.left = Math.random() * 100 + 'vw';
        snow.style.animationDuration = (Math.random() * 3 + 4) + 's';
        snow.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(snow);
    }
}
function createLeaves() { /* Kept Same */ }

// ========================================================
// 3. TARGET EXAM, GRIDS & $1 PREMIUM LOGIC
// ========================================================
function setExamTarget(examName) {
    currentExamTarget = examName;
    document.getElementById('dash-exam-title').innerText = examName.toUpperCase();
    switchScreen('exam-selection-screen', 'dashboard-screen');
    generateGrids();
}

function checkPremiumForCurrentTarget() {
    // Check if user bought premium specifically for JEE, NEET, etc.
    let targetKey = currentExamTarget.replace(/\s+/g, '').toLowerCase();
    return localStorage.getItem("vault_premium_" + targetKey) === "true";
}

function openPremiumModal() { 
    document.getElementById('premium-exam-name').innerText = currentExamTarget;
    document.getElementById('premium-modal').classList.remove('hidden'); 
}
function closePremiumModal() { document.getElementById('premium-modal').classList.add('hidden'); }

function activatePremium() {
    // Razorpay Integration will go here
    alert("Razorpay Gateway Triggered for $1! Module Unlocked.");
    let targetKey = currentExamTarget.replace(/\s+/g, '').toLowerCase();
    localStorage.setItem("vault_premium_" + targetKey, "true");
    closePremiumModal();
    generateGrids(); // Refresh tests after buying
}

function openDaySelection() { switchScreen('dashboard-screen', 'day-selection-screen'); }
function openTestSelection() { switchScreen('dashboard-screen', 'test-selection-screen'); }

function generateGrids() {
    let hasPremium = checkPremiumForCurrentTarget();

    const dayGrid = document.getElementById('days-grid');
    if(dayGrid) {
        dayGrid.innerHTML = '';
        for(let i=1; i<=75; i++) {
            let isFree = (i === 1); // Test 1 is Free Trial
            let btn = document.createElement('button');
            
            if(isFree || hasPremium) {
                btn.className = 'day-unlocked'; btn.innerText = `Day ${i}`;
                btn.onclick = () => showAllTheBest(`day_${i}`, 15);
            } else {
                btn.className = 'day-locked'; btn.innerText = `Day ${i}`;
                btn.onclick = () => openPremiumModal();
            }
            dayGrid.appendChild(btn);
        }
    }
    const testGrid = document.getElementById('tests-grid');
    if(testGrid) {
        testGrid.innerHTML = '';
        // Loops exactly for 20 Tests as requested
        for(let i=1; i<=20; i++) {
            let isFree = (i === 1); // Test 1 is Free Trial
            let btn = document.createElement('button');
            
            if(isFree || hasPremium) {
                btn.className = 'day-unlocked'; btn.innerText = `Test ${i}`;
                btn.onclick = () => showAllTheBest(`full_test_${i}`, 180);
            } else {
                btn.className = 'day-locked'; btn.innerText = `Test ${i}`;
                btn.onclick = () => openPremiumModal();
            }
            testGrid.appendChild(btn);
        }
    }
}

// ========================================================
// 4. TEST ENGINE (Keep fetch logic unchanged)
// ========================================================
function showAllTheBest(testId, timeInMins) { pendingTestId = testId; pendingTestTime = timeInMins; document.getElementById('all-best-modal').classList.remove('hidden'); }
function closeAllBestModal() { document.getElementById('all-best-modal').classList.add('hidden'); }
function confirmStartTest() { closeAllBestModal(); alert("Fetching JSON for " + currentExamTarget + " - " + pendingTestId); /* Call your NTA startTest function here */ }

// AI Bot Function remains untouched
