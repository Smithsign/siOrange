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
let position = 0;
let gameAreaHeight = 400;
let gameAreaWidth = 800;
let pipeGap = 180;
let pipeFrequency = 2000;
let lastPipeTime = 0;
let pipes = [];
let countdown = 3;
let countdownInterval;

// Initialize game area dimensions
function initGameArea() {
    const container = document.getElementById('game-container');
    gameAreaHeight = container.offsetHeight;
    gameAreaWidth = container.offsetWidth;
    position = gameAreaHeight / 2;
    updateOrangePosition();
}

// Event listeners
startButton.addEventListener('click', startCountdown);
tryAgainButton.addEventListener('click', startCountdown);
shareButton.addEventListener('click', shareScore);

// Keyboard and touch controls
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') && gameRunning) {
        flap();
    }
});

gameScreen.addEventListener('click', () => {
    if (gameRunning) {
        flap();
    }
});

// Game functions
function startCountdown() {
    // Reset game state
    score = 0;
    scoreDisplay.textContent = score;
    position = gameAreaHeight / 2;
    velocity = 0;
    orange.style.transform = `translateY(${position}px) rotate(0deg)`;
    
    // Clear pipes
    pipesContainer.innerHTML = '';
    pipes = [];
    
    // Show countdown screen
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    countdownScreen.classList.remove('hidden');
    
    // Start countdown
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

function startGame() {
    gameRunning = true;
    countdownScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Reset orange position
    position = gameAreaHeight / 2;
    updateOrangePosition();
    
    // Start game loop
    lastPipeTime = Date.now() - pipeFrequency;
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Apply gravity
    velocity += gravity;
    position += velocity;
    
    // Update orange position
    updateOrangePosition();
    
    // Check for collisions
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // Generate pipes
    const currentTime = Date.now();
    if (currentTime - lastPipeTime > pipeFrequency) {
        createPipe();
        lastPipeTime = currentTime;
    }
    
    // Move pipes
    movePipes();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

function updateOrangePosition() {
    // Keep orange within bounds
    if (position < 40) position = 40;
    if (position > gameAreaHeight - 40) {
        position = gameAreaHeight - 40;
        if (gameRunning) endGame();
    }
    
    // Apply rotation based on velocity
    const rotation = Math.min(Math.max(velocity * 5, -30), 30);
    orange.style.transform = `translateY(${position}px) rotate(${rotation}deg)`;
}

function flap() {
    velocity = -10;
}

function createPipe() {
    const minGap = gameAreaHeight * 0.3;
    const maxGap = gameAreaHeight * 0.7;
    const gapPosition = Math.random() * (maxGap - minGap) + minGap;
    
    const pipeTopHeight = gapPosition - (pipeGap / 2);
    const pipeBottomHeight = gameAreaHeight - gapPosition - (pipeGap / 2);
    
    // Create top pipe
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe';
    topPipe.style.height = `${pipeTopHeight}px`;
    topPipe.style.top = '0';
    topPipe.style.left = `${gameAreaWidth}px`;
    pipesContainer.appendChild(topPipe);
    
    // Create bottom pipe
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe';
    bottomPipe.style.height = `${pipeBottomHeight}px`;
    bottomPipe.style.bottom = '0';
    bottomPipe.style.left = `${gameAreaWidth}px`;
    pipesContainer.appendChild(bottomPipe);
    
    pipes.push({
        element: topPipe,
        x: gameAreaWidth,
        height: pipeTopHeight,
        top: true,
        passed: false
    });
    
    pipes.push({
        element: bottomPipe,
        x: gameAreaWidth,
        height: pipeBottomHeight,
        top: false,
        passed: false
    });
}

function movePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 3;
        pipe.element.style.left = `${pipe.x}px`;
        
        // Check if pipe is passed
        if (!pipe.passed && pipe.x < 100 - 40) {
            if (pipe.top) {
                score++;
                scoreDisplay.textContent = score;
                pipe.passed = true;
            }
        }
        
        // Remove pipes that are off screen
        if (pipe.x < -80) {
            pipesContainer.removeChild(pipe.element);
            pipes.splice(i, 1);
        }
    }
}

function checkCollision() {
    // Orange boundaries
    const orangeTop = position - 20;
    const orangeBottom = position + 20;
    const orangeLeft = 100 - 20;
    const orangeRight = 100 + 20;
    
    // Ground/ceiling check
    if (orangeTop <= 0 || orangeBottom >= gameAreaHeight) {
        return true;
    }
    
    // Check pipe collisions
    for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + 80;
        
        // Check if orange is within pipe's x-range
        if (orangeRight > pipeLeft && orangeLeft < pipeRight) {
            if (pipe.top) {
                // Top pipe
                const pipeBottom = pipe.height;
                if (orangeTop < pipeBottom) {
                    return true;
                }
            } else {
                // Bottom pipe
                const pipeTop = gameAreaHeight - pipe.height;
                if (orangeBottom > pipeTop) {
                    return true;
                }
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
}

function shareScore() {
    const tweetText = `I scored ${score} in siOrange �! Try it here: ${window.location.href}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

// Initialize game on load
window.addEventListener('load', initGameArea);
window.addEventListener('resize', initGameArea);
