let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userCurrentDay = 1; // Default day 1 se shuru hoga

// Jab user Dashboard par "Start Today's Test" dabayega
async function startDailyQuiz() {
    let exam = localStorage.getItem('userExam'); // 'JEE' ya 'NEET'
    userCurrentDay = localStorage.getItem('currentDay') || 1; // Pata karo user konse din par hai
    
    // JSON database ko internet/Vercel se bulao
    let response = await fetch(`${exam.toLowerCase()}_daily.json`);
    let database = await response.json();
    
    let todayKey = `day_${userCurrentDay}`; // Example: "day_1"
    
    // Check karo database me aaj ke questions hain ya nahi
    if(database[todayKey]) {
        currentQuestions = database[todayKey];
        
        // UI hide/show karo
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        
        loadQuestion();
    } else {
        alert("Bhai, tune saare din ke questions khatam kar diye! Naye questions kal aayenge.");
    }
}

// ... (Baki loadQuestion, checkAnswer aur nextQuestion ka function waise hi rahega jaise pehle tha)

function finishQuiz() {
    // Score save karo
    localStorage.setItem('lastScore', score);
    
    // Agle din par bhej do! (Taki kal usko automatically day_2 mile)
    localStorage.setItem('currentDay', parseInt(userCurrentDay) + 1);
    
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('score-text').innerText = `You scored ${score} out of ${currentQuestions.length}!`;
}
