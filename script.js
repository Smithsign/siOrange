// Game elements
const startScreen = document.getElementById('start-screen');
const countdownScreen = document.getElementById('countdown-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const tryAgainButton = document.getElementById('try-again-button');
const shareButton = document.getElementById('share-button');
const orange = document.getElementById('orange');
const pipesContainer = document.getElementById('pipes-container');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const countdownElement = document.getElementById('countdown');

// Game variables
let gameRunning = false;
let score = 0;
let gravity = 0.5;
let velocity = 0;
let position = 200;
let gameAreaHeight = 400;
let gameAreaWidth = 800;
let pipeGap = 150;
let pipeFrequency = 1500;
let lastPipeTime = 0;
let pipes = [];
let countdown = 3;
let countdownInterval;
let animationFrameId;
let orangeRadius = 20;

// Initialize game area
function initGameArea() {
    const container = document.getElementById('game-container');
    gameAreaHeight = container.offsetHeight;
    gameAreaWidth = container.offsetWidth;
    position = gameAreaHeight / 2;
    updateOrangePosition();
}

// **FIXED: Proper Click Controls (Flappy Bird Style)**
function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    e.preventDefault();

    if (!gameRunning) {
        startGame();
    } else {
        velocity = -8; // Jump force
    }
}

// Event Listeners (Click, Touch, Spacebar)
document.addEventListener('keydown', handleInput);
gameScreen.addEventListener('click', handleInput);
gameScreen.addEventListener('touchstart', handleInput);

// Start Button
startButton.addEventListener('click', startCountdown);
tryAgainButton.addEventListener('click', startCountdown);
shareButton.addEventListener('click', shareScore);

// Game functions
function startCountdown() {
    resetGame();
    countdownScreen.classList.remove('hidden');
    countdown = 3;
    countdownElement.textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            startGame();
        }
    }, 1000);
}

function resetGame() {
    gameRunning = false;
    score = 0;
    scoreDisplay.textContent = score;
    position = gameAreaHeight / 2;
    velocity = 0;
    pipesContainer.innerHTML = '';
    pipes = [];
    cancelAnimationFrame(animationFrameId);
}

function startGame() {
    resetGame();
    gameRunning = true;
    countdownScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    lastPipeTime = performance.now();
    gameLoop();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Apply gravity
    velocity += gravity;
    position += velocity;
    
    // Update orange position
    updateOrangePosition();
    
    // Check collisions
    if (checkCollision()) {
        endGame();
        return;
    }

    // Generate pipes
    if (performance.now() - lastPipeTime > pipeFrequency) {
        createPipe();
        lastPipeTime = performance.now();
    }

    // Move pipes
    movePipes();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateOrangePosition() {
    // Keep orange in bounds
    if (position < orangeRadius) {
        position = orangeRadius;
        velocity = 0;
    }
    if (position > gameAreaHeight - orangeRadius) {
        position = gameAreaHeight - orangeRadius;
        velocity = 0;
        if (gameRunning) endGame();
    }
    
    // Apply rotation
    let rotation = velocity * 3;
    rotation = Math.max(-20, Math.min(20, rotation));
    orange.style.transform = `translateY(${position}px) rotate(${rotation}deg)`;
}

function createPipe() {
    const minGap = gameAreaHeight * 0.2;
    const maxGap = gameAreaHeight * 0.5;
    const gapPosition = Math.random() * (maxGap - minGap) + minGap;
    
    const pipeTopHeight = gapPosition - (pipeGap / 2);
    const pipeBottomHeight = gameAreaHeight - gapPosition - (pipeGap / 2);
    
    // Top pipe
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe top-pipe';
    topPipe.style.height = `${pipeTopHeight}px`;
    topPipe.style.left = `${gameAreaWidth}px`;
    pipesContainer.appendChild(topPipe);
    
    // Bottom pipe
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe bottom-pipe';
    bottomPipe.style.height = `${pipeBottomHeight}px`;
    bottomPipe.style.left = `${gameAreaWidth}px`;
    pipesContainer.appendChild(bottomPipe);
    
    pipes.push({
        element: topPipe,
        x: gameAreaWidth,
        width: 80,
        height: pipeTopHeight,
        passed: false
    }, {
        element: bottomPipe,
        x: gameAreaWidth,
        width: 80,
        height: pipeBottomHeight,
        passed: false
    });
}

function movePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 3;
        pipe.element.style.left = `${pipe.x}px`;
        
        // Check if passed
        if (!pipe.passed && pipe.x < 100 - 40) {
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = score;
        }
        
        // Remove off-screen pipes
        if (pipe.x < -pipe.width) {
            pipesContainer.removeChild(pipe.element);
            pipes.splice(i, 1);
        }
    }
}

function checkCollision() {
    const orangeTop = position - orangeRadius;
    const orangeBottom = position + orangeRadius;
    const orangeLeft = 100 - orangeRadius;
    const orangeRight = 100 + orangeRadius;
    
    for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipe.width;
        
        if (orangeRight > pipeLeft && orangeLeft < pipeRight) {
            if (pipe.height < orangeTop || (gameAreaHeight - pipe.height) > orangeBottom) {
                return true;
            }
        }
    }
    return false;
}

function endGame() {
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);
}

function shareScore() {
    const tweetText = `I scored ${score} in siOrange! Try to beat me! ${window.location.href}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

// Initialize game
window.addEventListener('load', initGameArea);
window.addEventListener('resize', initGameArea);
