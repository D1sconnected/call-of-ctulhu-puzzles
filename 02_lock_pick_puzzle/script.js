// Game state
const gameState = {
    barrels: [],
    selectedBarrel: null,
    lockpicks: 10,
    unlockedCount: 0,
    isGameActive: false,
    isBarrelMoving: false,
    currentMoveSpeed: 0,
    moveDirection: 1
};

// DOM elements
const lockBarrels = document.getElementById('lockBarrels');
const selectedBarrelEl = document.getElementById('selectedBarrel');
const lockpicksCount = document.getElementById('lockpicksCount');
const unlockedCount = document.getElementById('unlockedCount');
const targetZone = document.getElementById('targetZone');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');

// Initialize game
function initGame() {
    createBarrels();
    setupEventListeners();
    showMessage('Welcome', 'Press START GAME to begin. Select a barrel with keys 1-5.');
}

// Create 5 lock barrels
function createBarrels() {
    lockBarrels.innerHTML = '';
    gameState.barrels = [];
    
    for (let i = 1; i <= 5; i++) {
        const barrel = {
            id: i,
            isUnlocked: false,
            isSelected: false,
            targetPosition: Math.random() * 60 + 20, // 20-80%
            currentPosition: 0,
            progressElement: null,
            targetElement: null
        };
        
        gameState.barrels.push(barrel);
        
        // Create barrel DOM element
        const barrelEl = document.createElement('div');
        barrelEl.className = 'barrel locked';
        barrelEl.dataset.id = i;
        
        barrelEl.innerHTML = `
            <div class="barrel-header">
                <div class="barrel-number">BARREL ${i}</div>
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
        
        // Position target zone
        barrel.targetElement.style.left = `${barrel.targetPosition}%`;
        
        // Add click event
        barrelEl.addEventListener('click', () => selectBarrel(i));
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
    
    // Select barrels 1-5
    if (e.key >= '1' && e.key <= '5') {
        const barrelId = parseInt(e.key);
        if (barrelId >= 1 && barrelId <= 5) {
            selectBarrel(barrelId);
        }
    }
    
    // Insert lockpick (start barrel movement)
    if (e.key === 'w' || e.key === 'W') {
        insertLockpick();
    }
    
    // Fix barrel position
    if (e.key === 'Enter') {
        fixBarrel();
    }
    
    // Reset current barrel
    if (e.key === 'r' || e.key === 'R') {
        resetCurrentBarrel();
    }
}

// Select a barrel
function selectBarrel(barrelId) {
    if (!gameState.isGameActive) return;
    
    const barrel = gameState.barrels[barrelId - 1];
    
    // Can't select already unlocked barrels
    if (barrel.isUnlocked) {
        showMessage('Already Unlocked', `Barrel ${barrelId} is already unlocked. Select another barrel.`);
        return;
    }
    
    // Deselect previously selected barrel
    if (gameState.selectedBarrel) {
        const prevBarrel = gameState.barrels[gameState.selectedBarrel - 1];
        const prevBarrelEl = document.querySelector(`.barrel[data-id="${prevBarrel.id}"]`);
        prevBarrelEl.classList.remove('selected');
        prevBarrel.isSelected = false;
        
        // Stop movement if barrel was moving
        stopBarrelMovement();
    }
    
    // Select new barrel
    gameState.selectedBarrel = barrelId;
    barrel.isSelected = true;
    
    const barrelEl = document.querySelector(`.barrel[data-id="${barrelId}"]`);
    barrelEl.classList.add('selected');
    
    // Update UI
    selectedBarrelEl.textContent = barrelId;
    updateTargetZonePosition(barrel.targetPosition);
    
    showMessage(`Barrel ${barrelId} Selected`, 'Press W to insert lockpick and start barrel movement.');
}

// Insert lockpick into selected barrel
function insertLockpick() {
    if (!gameState.isGameActive || !gameState.selectedBarrel || gameState.isBarrelMoving) return;
    
    const barrel = gameState.barrels[gameState.selectedBarrel - 1];
    
    if (barrel.isUnlocked) {
        showMessage('Already Unlocked', 'This barrel is already unlocked.');
        return;
    }
    
    if (gameState.lockpicks <= 0) {
        showMessage('No Lockpicks Left', 'Reset the game to get more lockpicks.');
        return;
    }
    
    // Start barrel movement
    gameState.isBarrelMoving = true;
    gameState.currentMoveSpeed = 0.5;
    gameState.moveDirection = 1;
    
    const barrelEl = document.querySelector(`.barrel[data-id="${gameState.selectedBarrel}"]`);
    barrelEl.classList.add('barrel-moving');
    
    showMessage('Barrel Moving', 'Press ENTER when the moving line is in the green zone.');
    
    // Start movement animation
    moveBarrel();
}

// Move the selected barrel's progress indicator
function moveBarrel() {
    if (!gameState.isBarrelMoving || !gameState.selectedBarrel) return;
    
    const barrel = gameState.barrels[gameState.selectedBarrel - 1];
    
    // Update position
    barrel.currentPosition += gameState.currentMoveSpeed * gameState.moveDirection;
    
    // Bounce at edges
    if (barrel.currentPosition >= 100) {
        barrel.currentPosition = 100;
        gameState.moveDirection = -1;
        gameState.currentMoveSpeed += 0.05; // Speed up on bounce
    } else if (barrel.currentPosition <= 0) {
        barrel.currentPosition = 0;
        gameState.moveDirection = 1;
        gameState.currentMoveSpeed += 0.05; // Speed up on bounce
    }
    
    // Update progress bar
    barrel.progressElement.style.width = `${barrel.currentPosition}%`;
    
    // Continue animation
    requestAnimationFrame(() => moveBarrel());
}

// Fix barrel at current position
function fixBarrel() {
    if (!gameState.isGameActive || !gameState.selectedBarrel || !gameState.isBarrelMoving) return;
    
    const barrel = gameState.barrels[gameState.selectedBarrel - 1];
    
    // Calculate if we're in the target zone (with some tolerance)
    const tolerance = 5; // ±5% tolerance
    const minTarget = barrel.targetPosition - tolerance;
    const maxTarget = barrel.targetPosition + tolerance;
    
    const isInTargetZone = barrel.currentPosition >= minTarget && barrel.currentPosition <= maxTarget;
    
    // Stop movement
    stopBarrelMovement();
    
    // Use a lockpick
    gameState.lockpicks--;
    lockpicksCount.textContent = gameState.lockpicks;
    
    if (isInTargetZone) {
        // Success!
        barrel.isUnlocked = true;
        gameState.unlockedCount++;
        
        const barrelEl = document.querySelector(`.barrel[data-id="${barrel.id}"]`);
        barrelEl.classList.remove('barrel-moving', 'locked');
        barrelEl.classList.add('unlocked');
        
        barrelEl.querySelector('.barrel-status').textContent = 'UNLOCKED';
        
        // Update unlocked count
        unlockedCount.textContent = `${gameState.unlockedCount}/5`;
        
        showMessage('Success!', `Barrel ${barrel.id} unlocked! ${5 - gameState.unlockedCount} barrels remaining.`);
        
        // Check win condition
        if (gameState.unlockedCount === 5) {
            gameWin();
        }
    } else {
        // Failed attempt
        const barrelEl = document.querySelector(`.barrel[data-id="${barrel.id}"]`);
        barrelEl.classList.remove('barrel-moving');
        
        showMessage('Failed', 'Missed the sweet spot. Try again.');
        
        // Check if out of lockpicks
        if (gameState.lockpicks <= 0) {
            gameOver();
        }
    }
}

// Stop barrel movement
function stopBarrelMovement() {
    gameState.isBarrelMoving = false;
    
    if (gameState.selectedBarrel) {
        const barrelEl = document.querySelector(`.barrel[data-id="${gameState.selectedBarrel}"]`);
        if (barrelEl) {
            barrelEl.classList.remove('barrel-moving');
        }
    }
}

// Reset current barrel
function resetCurrentBarrel() {
    if (!gameState.isGameActive || !gameState.selectedBarrel) return;
    
    stopBarrelMovement();
    
    const barrel = gameState.barrels[gameState.selectedBarrel - 1];
    
    // Reset barrel position
    barrel.currentPosition = 0;
    barrel.progressElement.style.width = '0%';
    
    showMessage('Barrel Reset', 'Barrel position has been reset. Ready for another attempt.');
}

// Update target zone position in lockpick visual
function updateTargetZonePosition(position) {
    targetZone.style.left = `${position}%`;
}

// Start the game
function startGame() {
    gameState.isGameActive = true;
    gameState.selectedBarrel = null;
    gameState.lockpicks = 10;
    gameState.unlockedCount = 0;
    
    // Reset all barrels
    createBarrels();
    
    // Update UI
    selectedBarrelEl.textContent = 'None';
    lockpicksCount.textContent = gameState.lockpicks;
    unlockedCount.textContent = '0/5';
    
    showMessage('Game Started', 'Select a barrel (1-5) and begin lockpicking!');
    
    // Update target zone to center
    targetZone.style.left = '50%';
}

// Reset entire game
function resetGame() {
    stopBarrelMovement();
    startGame();
}

// Game win condition
function gameWin() {
    gameState.isGameActive = false;
    stopBarrelMovement();
    
    showMessage('VICTORY!', 'All 5 barrels unlocked! The ancient mechanism yields to your skill.');
    
    // Celebrate
    document.querySelectorAll('.barrel').forEach(barrel => {
        barrel.style.animation = 'pulse 1s infinite';
    });
}

// Game over condition
function gameOver() {
    gameState.isGameActive = false;
    stopBarrelMovement();
    
    showMessage('GAME OVER', 'You ran out of lockpicks. The mechanism remains locked.');
}

// Show message
function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);