let selectedExam = "";

// Check if user is already logged in when page loads
window.onload = function() {
    checkLoginStatus();
};

function checkLoginStatus() {
    const savedName = localStorage.getItem('userName');
    const savedExam = localStorage.getItem('userExam');
    
    if (savedName && savedExam) {
        // User is logged in, show dashboard directly
        document.getElementById('hero-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-name-display').innerText = `Hi, ${savedName}`;
        document.getElementById('target-exam-display').innerText = savedExam;
        
        // Load old score if exists (default is 0)
        let oldScore = localStorage.getItem('lastScore') || 0;
        document.getElementById('saved-score').innerText = oldScore;
    }
}

// Modal Functions
function openLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

// Select JEE or NEET
function selectExam(exam) {
    selectedExam = exam;
    let buttons = document.querySelectorAll('.exam-select-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // Highlight the clicked button
    event.target.classList.add('selected');
    document.getElementById('exam-warning').classList.add('hidden');
}

// Save Data and Login
function saveProfile() {
    const name = document.getElementById('username-input').value;
    
    if (name.trim() === "") {
        alert("Please enter your name.");
        return;
    }
    
    if (selectedExam === "") {
        document.getElementById('exam-warning').classList.remove('hidden');
        return;
    }

    // Saving data to browser's Local Storage
    localStorage.setItem('userName', name);
    localStorage.setItem('userExam', selectedExam);
    
    closeLoginModal();
    checkLoginStatus(); // Refresh the screen to show dashboard
}

// Logout
function logout() {
    localStorage.clear(); // Clear saved data
    location.reload(); // Reload page to show hero section again
}
