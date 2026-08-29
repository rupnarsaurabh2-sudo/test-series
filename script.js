// Dummy PYQ Data
const questions = {
    'JEE': [
        {
            question: "Q1. The dimension of Planck's constant is same as that of:",
            options: ["Angular momentum", "Work", "Energy", "Power"],
            answer: 0
        },
        {
            question: "Q2. If integral of x^2 is...", // Dummy math question
            options: ["x^3/3", "2x", "x^2/2", "x"],
            answer: 0
        }
    ],
    'NEET': [
        {
            question: "Q1. Powerhouse of the cell is?",
            options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"],
            answer: 1
        }
    ]
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

function startQuiz(examType) {
    currentQuestions = questions[examType];
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    loadQuestion();
}

function loadQuestion() {
    let q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    
    let optionsHtml = '';
    q.options.forEach((opt, index) => {
        optionsHtml += `<button class="option-btn" onclick="checkAnswer(${index}, this)">${opt}</button>`;
    });
    
    document.getElementById('options-container').innerHTML = optionsHtml;
    document.getElementById('next-btn').classList.add('hidden');
}

function checkAnswer(selectedIndex, buttonElement) {
    let correctIndex = currentQuestions[currentQuestionIndex].answer;
    let allButtons = document.querySelectorAll('.option-btn');
    
    // Saare buttons ko click hone se rok do
    allButtons.forEach(btn => btn.disabled = true);
    
    if(selectedIndex === correctIndex) {
        buttonElement.classList.add('correct');
        score++;
    } else {
        buttonElement.classList.add('wrong');
        allButtons[correctIndex].classList.add('correct'); // Sahi answer highlight karo
    }
    
    document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if(currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        // Quiz khatam
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('score-text').innerText = `You scored ${score} out of ${currentQuestions.length}!`;
    }
}
