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
let pipeGap = 180;
let pipeFrequency = 2000;
let lastPipeTime = 0;
let pipes = [];
let countdown = 3;
let countdownInterval;
let animationFrameId;
let orangeRadius = 25;
let gameStartTime = 0;
let gravityDelay = 500; // 0.5 second delay before gravity starts
let initialBoost = -8; // Initial upward boost when game starts

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
    gameRunning = false;
    score = 0;
    scoreDisplay.textContent = score;
    position = gameAreaHeight / 2;
    velocity = 0;
    orange.style.transform = `translateY(${position}px) rotate(0deg)`;
    
    // Clear pipes
    pipesContainer.innerHTML = '';
    pipes = [];
    
    // Cancel any existing animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
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
    gameStartTime = Date.now();
    countdownScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Reset orange position with initial upward boost
    position = gameAreaHeight / 2;
    velocity = initialBoost;
    updateOrangePosition();
    
    // Start game loop
    lastPipeTime = Date.now() - pipeFrequency;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;
    
    const currentTime = Date.now();
    const timeSinceStart = currentTime - gameStartTime;
    
    // Only apply gravity after the initial delay
    if (timeSinceStart > gravityDelay) {
        velocity += gravity;
    }
    
    position += velocity;
    
    // Update orange position
    updateOrangePosition();
    
    // Check for collisions
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // Generate pipes
    if (currentTime - lastPipeTime > pipeFrequency) {
        createPipe();
        lastPipeTime = currentTime;
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
        if (gameRunning) endGame();
    }
    if (position > gameAreaHeight - orangeRadius) {
        position = gameAreaHeight - orangeRadius;
        if (gameRunning) endGame();
    }
    
    // Apply rotation based on velocity
    const rotation = Math.min(Math.max(velocity * 3, -30), 30);
    orange.style.transform = `translateY(${position}px) rotate(${rotation}deg)`;
}

function flap() {
    velocity = -10; // Strong flap to make the game more responsive
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
                
                // Increase difficulty as score increases
                if (score % 5 === 0) {
                    pipeFrequency = Math.max(1000, pipeFrequency - 100);
                    pipeGap = Math.max(120, pipeGap - 10);
                }
            }
        }
        
        // Remove pipes that are off screen
        if (pipe.x < -pipe.width) {
            pipesContainer.removeChild(pipe.element);
            pipes.splice(i, 1);
        }
    }
}

function checkCollision() {
    // Orange boundaries (100px from left, 25px radius)
    const orangeTop = position - orangeRadius;
    const orangeBottom = position + orangeRadius;
    const orangeLeft = 100 - orangeRadius;
    const orangeRight = 100 + orangeRadius;
    
    // Check pipe collisions
    for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipe.width;
        
        // Check if orange is within pipe's x-range
        if (orangeRight > pipeLeft && orangeLeft < pipeRight) {
            if (pipe.top) {
                // Top pipe collision check
                const pipeBottom = pipe.height;
                if (orangeTop < pipeBottom) {
                    return true;
                }
            } else {
                // Bottom pipe collision check
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
    
    // Cancel the animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function shareScore() {
    const tweetText = `I scored ${score} in siOrange! Try it here: ${window.location.href}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

// Initialize game on load
window.addEventListener('load', initGameArea);
window.addEventListener('resize', initGameArea);
