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
let gravity = 0.4; // Reduced gravity for better gameplay
let velocity = 0;
let position = 200;
let gameAreaHeight = 400;
let gameAreaWidth = 800;
let pipeGap = 180;
let pipeFrequency = 2000;
let lastPipeTime = 0;
let pipes = [];
let countdown = 3;
let countdownInterval;
let animationFrameId;
let orangeRadius = 25;
let lastFrameTime = 0;
let gravityActive = false;
let initialBoost = -8;

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

// Controls
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') && gameRunning) {
        flap();
    }
});

gameScreen.addEventListener('click', () => {
    if (gameRunning) flap();
});

// Game functions
function startCountdown() {
    // Reset game state
    gameRunning = false;
    score = 0;
    scoreDisplay.textContent = score;
    position = gameAreaHeight / 2;
    velocity = 0;
    gravityActive = false;
    orange.style.transform = `translateY(${position}px) rotate(0deg)`;
    
    // Clear pipes
    pipesContainer.innerHTML = '';
    pipes = [];
    
    // Cancel animation frame
    cancelAnimationFrame(animationFrameId);
    
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
    lastFrameTime = performance.now();
    countdownScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Initial boost
    position = gameAreaHeight / 2;
    velocity = initialBoost;
    gravityActive = true;
    updateOrangePosition();
    
    // Start game loop
    lastPipeTime = performance.now() - pipeFrequency;
    gameLoop();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time for smooth animation
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Apply gravity only when active
    if (gravityActive) {
        velocity += gravity * (deltaTime / 16.67); // Normalize to 60fps
    }
    
    position += velocity * (deltaTime / 16.67); // Normalize movement
    
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
    
    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateOrangePosition() {
    // Keep orange within bounds
    if (position < orangeRadius) {
        position = orangeRadius;
        velocity = 0;
        if (gameRunning) endGame();
    }
    if (position > gameAreaHeight - orangeRadius) {
        position = gameAreaHeight - orangeRadius;
        velocity = 0;
        if (gameRunning) endGame();
    }
    
    // Apply rotation
    const rotation = Math.min(Math.max(velocity * 3, -30), 30);
    orange.style.transform = `translateY(${position}px) rotate(${rotation}deg)`;
}

function flap() {
    velocity = -10; // Consistent flap strength
    gravityActive = true; // Ensure gravity is always active after first flap
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
        width: 80,
        height: pipeTopHeight,
        top: true,
        passed: false
    });
    
    pipes.push({
        element: bottomPipe,
        x: gameAreaWidth,
        width: 80,
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
                
                // Increase difficulty
                if (score % 5 === 0) {
                    pipeFrequency = Math.max(1000, pipeFrequency - 100);
                    pipeGap = Math.max(120, pipeGap - 5);
                }
            }
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
            if (pipe.top) {
                if (orangeTop < pipe.height) return true;
            } else {
                if (orangeBottom > (gameAreaHeight - pipe.height)) return true;
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
    const tweetText = `I scored ${score} in siOrange! Try it here: ${window.location.href}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

// Initialize
window.addEventListener('load', initGameArea);
window.addEventListener('resize', initGameArea);
