// Game state
const gameState = {
    barrels: [],
    currentBarrel: 1,
    lockpicks: 10,
    unlockedCount: 0,
    isGameActive: false,
    isLockpickMoving: false,
    currentSpeed: 0,
    lockpickPosition: 0,
    animationId: null,
    speedVariants: [1.0, 1.5, 2.0, 2.5], // 4 speed variants
    targetZoneWidth: 80, // Width of target zone in pixels (matches CSS width)
    lockpickWidth: 8, // Width of lockpick in pixels (matches CSS width)
    containerWidth: 0, // Will be set dynamically
    resetOnFail: true
};

// DOM elements
const lockBarrels = document.getElementById('lockBarrels');
const currentBarrelEl = document.getElementById('currentBarrel');
const lockpicksCount = document.getElementById('lockpicksCount');
const unlockedCount = document.getElementById('unlockedCount');
const lockpickEl = document.getElementById('lockpick');
const targetZone = document.getElementById('targetZone');
const speedValue = document.getElementById('speedValue');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');

// Initialize game
function initGame() {
    createBarrels();
    setupEventListeners();
    calculateContainerWidth();
    showMessage('Welcome', 'Press START GAME to begin. You must unlock barrels 1 through 5 in sequence.');
    
    // Listen for window resize to recalculate container width
    window.addEventListener('resize', calculateContainerWidth);
}

// Create 5 horizontal lock barrels
function createBarrels() {
    lockBarrels.innerHTML = '';
    gameState.barrels = [];
    
    for (let i = 1; i <= 5; i++) {
        const barrel = {
            id: i,
            isUnlocked: false,
            targetPosition: Math.random() * 60 + 20, // 20-80%
            currentProgress: 0,
            progressElement: null,
            targetElement: null,
            barrelElement: null
        };
        
        gameState.barrels.push(barrel);
        
        // Create barrel DOM element
        const barrelEl = document.createElement('div');
        barrelEl.className = 'barrel locked';
        barrelEl.dataset.id = i;
        
        barrelEl.innerHTML = `
            <div class="barrel-header">
                <div class="barrel-number">${i}</div>
                <div class="barrel-status">LOCKED</div>
            </div>
            <div class="barrel-progress">
                <div class="progress-fill"></div>
            </div>
        `;
        
        // Add target zone overlay
        const targetEl = document.createElement('div');
        targetEl.className = 'barrel-target';
        barrelEl.appendChild(targetEl);
        
        lockBarrels.appendChild(barrelEl);
        
        // Store references
        barrel.progressElement = barrelEl.querySelector('.progress-fill');
        barrel.targetElement = targetEl;
        barrel.barrelElement = barrelEl;
        
        // Position target zone
        barrel.targetElement.style.left = `${barrel.targetPosition}%`;
    }
    
    // Set current barrel visual
    updateCurrentBarrelVisual();
}

// Calculate container width for accurate positioning
function calculateContainerWidth() {
    const container = document.querySelector('.lockpick-visual');
    if (container) {
        gameState.containerWidth = container.offsetWidth;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Button controls
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameState.isGameActive) return;
    
    // Start lockpick movement
    if (e.key === 'w' || e.key === 'W') {
        startLockpick();
    }
    
    // Fix lockpick position
    if (e.key === 'Enter') {
        fixLockpick();
    }
    
    // Retry current barrel
    if (e.key === 'r' || e.key === 'R') {
        retryBarrel();
    }
}

// Update visual for current barrel
function updateCurrentBarrelVisual() {
    // Remove current class from all barrels
    document.querySelectorAll('.barrel').forEach(barrel => {
        barrel.classList.remove('current');
    });
    
    // Add current class to current barrel if game is active
    if (gameState.isGameActive && gameState.currentBarrel <= 5) {
        const currentBarrelEl = document.querySelector(`.barrel[data-id="${gameState.currentBarrel}"]`);
        if (currentBarrelEl) {
            currentBarrelEl.classList.add('current');
        }
    }
}

// Start lockpick movement
function startLockpick() {
    if (!gameState.isGameActive || gameState.isLockpickMoving) return;
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    if (barrel.isUnlocked) {
        showMessage('Already Unlocked', 'This barrel is already unlocked.');
        return;
    }
    
    if (gameState.lockpicks <= 0) {
        showMessage('No Lockpicks Left', 'Reset the game to get more lockpicks.');
        return;
    }
    
    // Select random speed from variants
    const randomIndex = Math.floor(Math.random() * gameState.speedVariants.length);
    gameState.currentSpeed = gameState.speedVariants[randomIndex];
    
    // Update speed display
    speedValue.textContent = `${gameState.currentSpeed.toFixed(1)}x`;
    
    // Start lockpick movement
    gameState.isLockpickMoving = true;
    gameState.lockpickPosition = 0;
    
    // Update barrel status
    barrel.barrelElement.classList.add('progressing');
    barrel.barrelElement.querySelector('.barrel-status').textContent = 'IN PROGRESS';
    
    // Set target zone for current barrel
    updateTargetZonePosition(barrel.targetPosition);
    
    showMessage('Lockpick Moving', 'Press ENTER when the lockpick aligns with the green zone.');
    
    // Start movement animation
    moveLockpick();
}

// Move the lockpick
function moveLockpick() {
    if (!gameState.isLockpickMoving) return;
    
    // Update lockpick position
    gameState.lockpickPosition += gameState.currentSpeed;
    
    // Reset to start when reaching 100%
    if (gameState.lockpickPosition >= 100) {
        gameState.lockpickPosition = 0;
    }
    
    // Update lockpick visual position
    lockpickEl.style.left = `${gameState.lockpickPosition}%`;
    
    // Update barrel progress visual for current barrel
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    barrel.progressElement.style.width = `${gameState.lockpickPosition}%`;
    
    // Continue animation
    gameState.animationId = requestAnimationFrame(() => moveLockpick());
}

// Fix lockpick at current position
function fixLockpick() {
    if (!gameState.isGameActive || !gameState.isLockpickMoving) return;
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    // Calculate if lockpick is in the target zone
    // We need to compare the lockpick position (as percentage) with the target zone
    const targetZonePercent = barrel.targetPosition;
    const lockpickPercent = gameState.lockpickPosition;
    
    // Calculate tolerance in percentage (target zone width relative to container)
    const tolerance = 12; // Increased tolerance for better detection
    
    const isInTargetZone = Math.abs(lockpickPercent - targetZonePercent) <= tolerance;
    
    // Stop movement
    stopLockpickMovement();
    
    // Use a lockpick
    gameState.lockpicks--;
    lockpicksCount.textContent = gameState.lockpicks;
    
    if (isInTargetZone) {
        // Success!
        barrel.isUnlocked = true;
        gameState.unlockedCount++;
        
        barrel.barrelElement.classList.remove('progressing', 'locked');
        barrel.barrelElement.classList.add('unlocked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'UNLOCKED';
        
        // Update unlocked count
        unlockedCount.textContent = `${gameState.unlockedCount}/5`;
        
        // Move to next barrel
        if (gameState.currentBarrel < 5) {
            gameState.currentBarrel++;
            currentBarrelEl.textContent = gameState.currentBarrel;
            updateCurrentBarrelVisual();
            
            showMessage('Success!', `Barrel ${barrel.id} unlocked! Now working on barrel ${gameState.currentBarrel}.`);
        } else {
            // All barrels unlocked
            showMessage('Success!', `Barrel ${barrel.id} unlocked! All barrels are now open.`);
        }
        
        // Check win condition
        if (gameState.unlockedCount === 5) {
            gameWin();
        }
    } else {
        // Failed attempt
        barrel.barrelElement.classList.remove('progressing');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'FAILED';
        
        if (gameState.resetOnFail) {
            // Reset all progress on failure
            showMessage('Failed!', 'All barrels have been reset. Start from barrel 1 again.');
            resetAllBarrels();
        } else {
            showMessage('Failed', 'Missed the sweet spot. Try again.');
        }
        
        // Check if out of lockpicks
        if (gameState.lockpicks <= 0) {
            gameOver();
        }
    }
}

// Stop lockpick movement
function stopLockpickMovement() {
    gameState.isLockpickMoving = false;
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // Reset progress bar
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    if (barrel && barrel.barrelElement) {
        barrel.barrelElement.classList.remove('progressing');
        barrel.progressElement.style.width = '0%';
        
        if (!barrel.isUnlocked) {
            barrel.barrelElement.querySelector('.barrel-status').textContent = 'READY';
        }
    }
    
    // Reset lockpick position
    lockpickEl.style.left = '0%';
}

// Retry current barrel
function retryBarrel() {
    if (!gameState.isGameActive) return;
    
    stopLockpickMovement();
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    if (!barrel.isUnlocked) {
        showMessage('Ready', 'Press W to start lockpick movement.');
    }
}

// Reset all barrels (on failure)
function resetAllBarrels() {
    stopLockpickMovement();
    
    gameState.unlockedCount = 0;
    gameState.currentBarrel = 1;
    
    // Reset all barrels
    gameState.barrels.forEach(barrel => {
        barrel.isUnlocked = false;
        
        // Update barrel element
        barrel.barrelElement.classList.remove('unlocked', 'progressing');
        barrel.barrelElement.classList.add('locked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'LOCKED';
        
        // Generate new target position
        barrel.targetPosition = Math.random() * 60 + 20;
        barrel.targetElement.style.left = `${barrel.targetPosition}%`;
    });
    
    // Reset UI
    currentBarrelEl.textContent = '1';
    unlockedCount.textContent = '0/5';
    updateCurrentBarrelVisual();
}

// Update target zone position in lockpick visual
function updateTargetZonePosition(position) {
    targetZone.style.left = `${position}%`;
}

// Start the game
function startGame() {
    gameState.isGameActive = true;
    gameState.currentBarrel = 1;
    gameState.lockpicks = 10;
    gameState.unlockedCount = 0;
    
    // Reset all barrels
    createBarrels();
    
    // Update UI
    currentBarrelEl.textContent = '1';
    lockpicksCount.textContent = gameState.lockpicks;
    unlockedCount.textContent = '0/5';
    speedValue.textContent = '-';
    
    showMessage('Game Started', 'Press W to start lockpicking barrel 1. Failing a barrel will reset all progress!');
    
    // Update target zone to random position
    const firstBarrel = gameState.barrels[0];
    updateTargetZonePosition(firstBarrel.targetPosition);
}

// Reset entire game
function resetGame() {
    stopLockpickMovement();
    startGame();
}

// Game win condition
function gameWin() {
    gameState.isGameActive = false;
    stopLockpickMovement();
    
    showMessage('VICTORY!', 'All 5 barrels unlocked! The ancient mechanism yields to your skill.');
    
    // Celebrate
    gameState.barrels.forEach(barrel => {
        barrel.barrelElement.style.animation = 'pulse 1s infinite';
    });
}

// Game over condition
function gameOver() {
    gameState.isGameActive = false;
    stopLockpickMovement();
    
    showMessage('GAME OVER', 'You ran out of lockpicks. The mechanism remains locked.');
}

// Show message
function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);