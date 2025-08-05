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
let gameStarted = false;
let score = 0;
let gravity = 0.5;
let velocity = 0;
let position = 200;
let gameAreaHeight = 400;
let gameAreaWidth = 800;
let pipeGap = 150; // Smaller gap for more challenge
let pipeFrequency = 1500; // Faster pipe generation
let lastPipeTime = 0;
let pipes = [];
let countdown = 3;
let countdownInterval;
let animationFrameId;
let orangeRadius = 20; // Smaller hitbox
let lastFrameTime = 0;
let gameStartTime = 0;

// Initialize game area
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

// Flappy Bird-style controls
document.addEventListener('keydown', flap);
gameScreen.addEventListener('mousedown', flap);
gameScreen.addEventListener('touchstart', flap);

function flap(e) {
    // Prevent spacebar from scrolling page
    if (e && e.key === ' ') {
        e.preventDefault();
    }
    
    // Only flap if game is running or about to start
    if (!gameRunning && !gameStarted) {
        gameStarted = true;
        startGame();
    }
    
    if (gameRunning) {
        velocity = -8; // Flappy Bird-style quick jump
        // Add jump sound effect here if desired
    }
}

// Game functions
function startCountdown() {
    // Reset game state
    gameRunning = false;
    gameStarted = false;
    score = 0;
    scoreDisplay.textContent = score;
    position = gameAreaHeight / 2;
    velocity = 0;
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
            gameStarted = true;
            startGame();
        }
    }, 1000);
}

function startGame() {
    gameRunning = true;
    gameStartTime = performance.now();
    countdownScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Initial position
    position = gameAreaHeight / 2;
    velocity = 0;
    updateOrangePosition();
    
    // Start game loop
    lastPipeTime = performance.now() - pipeFrequency;
    lastFrameTime = performance.now();
    gameLoop();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Apply gravity (frame-rate independent)
    velocity += gravity * (deltaTime / 16.67);
    position += velocity * (deltaTime / 16.67);
    
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
    
    // Apply rotation (more dramatic than Flappy Bird)
    let rotation = velocity * 4;
    rotation = Math.max(-30, Math.min(90, rotation)); // Limit rotation angles
    orange.style.transform = `translateY(${position}px) rotate(${rotation}deg)`;
}

function createPipe() {
    const minGap = gameAreaHeight * 0.2;
    const maxGap = gameAreaHeight * 0.5;
    const gapPosition = Math.random() * (maxGap - minGap) + minGap;
    
    const pipeTopHeight = gapPosition - (pipeGap / 2);
    const pipeBottomHeight = gameAreaHeight - gapPosition - (pipeGap / 2);
    
    // Create top pipe (with cap)
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe top-pipe';
    topPipe.style.height = `${pipeTopHeight}px`;
    topPipe.style.top = '0';
    topPipe.style.left = `${gameAreaWidth}px`;
    pipesContainer.appendChild(topPipe);
    
    // Create bottom pipe (with cap)
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe bottom-pipe';
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
                    pipeFrequency = Math.max(1000, pipeFrequency - 50);
                    pipeGap = Math.max(100, pipeGap - 5);
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
    gameStarted = false;
    finalScoreDisplay.textContent = score;
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);
    
    // Add death sound effect here if desired
}

function shareScore() {
    const tweetText = `I scored ${score} in siOrange! Try to beat my score! ${window.location.href}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

// Initialize game
window.addEventListener('load', initGameArea);
window.addEventListener('resize', initGameArea);
