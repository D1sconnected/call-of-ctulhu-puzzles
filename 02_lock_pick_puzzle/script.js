// Game state
const gameState = {
    barrels: [],
    currentBarrel: 1,
    lockpicks: 10,
    isGameActive: true,
    isLockpickMoving: false,
    currentSpeed: 0,
    lockpickPosition: 0,
    animationId: null,
    speedVariants: [0.8, 1.0, 1.3, 1.6],
    trackLength: 80,
    targetZoneHalfWidth: 7.5,
    containerWidth: 0 // Will be set dynamically
};

// DOM elements
const lockBarrels = document.getElementById('lockBarrels');
const currentBarrelEl = document.getElementById('currentBarrel');
const lockpicksCount = document.getElementById('lockpicksCount');
const lockpickEl = document.getElementById('lockpick');
const targetZone = document.getElementById('targetZone');
const winScreen = document.getElementById('winScreen');
const loseScreen = document.getElementById('loseScreen');
const gameContainer = document.getElementById('gameContainer');
const lockpickVisual = document.querySelector('.lockpick-visual');

// Audio elements
const soundLockpickMove = document.getElementById('soundLockpickMove');
const soundLockpickFix = document.getElementById('soundLockpickFix');
const soundLockpickBreak = document.getElementById('soundLockpickBreak');
const soundBarrelUnlock = document.getElementById('soundBarrelUnlock');

// Initialize game on page load
function initGame() {
    // Calculate container width for accurate positioning
    gameState.containerWidth = lockpickVisual.offsetWidth;
    
    createBarrels();
    setupEventListeners();
    
    // Initialize target zone position for first barrel
    const firstBarrel = gameState.barrels[0];
    if (firstBarrel) {
        updateTargetZonePosition(firstBarrel.targetPosition);
    }
    
    // Listen for window resize
    window.addEventListener('resize', () => {
        gameState.containerWidth = lockpickVisual.offsetWidth;
    });
}

// Create 5 horizontal lock barrels
function createBarrels() {
    lockBarrels.innerHTML = '';
    gameState.barrels = [];
    
    for (let i = 1; i <= 5; i++) {
        // Generate random target position between 30% and 70% (not near edges)
        const barrel = {
            id: i,
            isUnlocked: false,
            targetPosition: Math.random() * 40 + 30, // 30-70%
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

// Set up event listeners
function setupEventListeners() {
    // Keyboard controls only
    document.addEventListener('keydown', handleKeyPress);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameState.isGameActive) return;
    
    // Start lockpick movement - can always start if not already moving
    if ((e.key === 'w' || e.key === 'W') && !gameState.isLockpickMoving) {
        startLockpick();
    }
    
    // Fix lockpick position - only if lockpick is moving
    if (e.key === 'Enter' && gameState.isLockpickMoving) {
        fixLockpick();
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

// Play sound with volume control
function playSound(sound, volume = 0.5) {
    if (sound) {
        sound.volume = volume;
        sound.currentTime = 0;
        sound.play().catch(e => {
            // Silent fail for audio
            console.log("Audio play failed (safe to ignore):", e);
        });
    }
}

// Start lockpick movement
function startLockpick() {
    if (!gameState.isGameActive || gameState.isLockpickMoving) return;
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    if (barrel.isUnlocked) {
        return; // Shouldn't happen with auto-selection
    }
    
    if (gameState.lockpicks <= 0) {
        showLoseScreen();
        return;
    }
    
    // Play lockpick movement sound
    playSound(soundLockpickMove, 0.3);
    
    // Select random speed from variants
    const randomIndex = Math.floor(Math.random() * gameState.speedVariants.length);
    gameState.currentSpeed = gameState.speedVariants[randomIndex];
    
    // Start lockpick movement
    gameState.isLockpickMoving = true;
    gameState.lockpickPosition = 0;
    
    // Update barrel status
    barrel.barrelElement.classList.add('progressing');
    barrel.barrelElement.querySelector('.barrel-status').textContent = 'IN PROGRESS';
    
    // Set target zone for current barrel
    updateTargetZonePosition(barrel.targetPosition);
    
    // Start movement animation
    moveLockpick();
}

// Move the lockpick
function moveLockpick() {
    if (!gameState.isLockpickMoving) return;
    
    // Update lockpick position
    gameState.lockpickPosition += gameState.currentSpeed;
    
    // Check if reached the end (trackLength%)
    if (gameState.lockpickPosition >= gameState.trackLength) {
        gameState.lockpickPosition = gameState.trackLength;
        
        // Update visuals
        updateLockpickVisualPosition();
        const barrel = gameState.barrels[gameState.currentBarrel - 1];
        barrel.progressElement.style.width = `${gameState.lockpickPosition}%`;
        
        // Stop movement naturally (no lockpick break, no reset)
        stopLockpickMovement(true);
        return;
    }
    
    // Update lockpick visual position
    updateLockpickVisualPosition();
    
    // Update barrel progress visual for current barrel
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    barrel.progressElement.style.width = `${gameState.lockpickPosition}%`;
    
    // Continue animation
    gameState.animationId = requestAnimationFrame(() => moveLockpick());
}

// Update lockpick visual position with proper centering
function updateLockpickVisualPosition() {
    // The lockpick element is 8px wide, so we need to account for its center
    // position = (lockpickPosition% of container) - 4px (half of lockpick width)
    const pixelPosition = (gameState.lockpickPosition / 100) * gameState.containerWidth;
    lockpickEl.style.left = `${pixelPosition}px`;
}

// Fix lockpick at current position
function fixLockpick() {
    if (!gameState.isGameActive || !gameState.isLockpickMoving) return;
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    // Play lockpick fix sound
    playSound(soundLockpickFix, 0.4);
    
    // Get ACTUAL pixel positions for accurate detection
    const containerWidth = gameState.containerWidth;
    const lockpickPixelPosition = (gameState.lockpickPosition / 100) * containerWidth;
    const targetZonePixelPosition = (barrel.targetPosition / 100) * containerWidth;
    
    // Target zone is 100px wide in CSS (50px on each side of center)
    const targetZoneHalfPixelWidth = 50; // Half of 100px target zone
    
    // Calculate the center of the lockpick (4px from left edge since lockpick is 8px wide)
    const lockpickCenter = lockpickPixelPosition + 4;
    
    // Calculate target zone boundaries
    const minTarget = targetZonePixelPosition - targetZoneHalfPixelWidth;
    const maxTarget = targetZonePixelPosition + targetZoneHalfPixelWidth;
    
    // Check if lockpick center is within target zone
    const isInTargetZone = lockpickCenter >= minTarget && lockpickCenter <= maxTarget;
    
    // DEBUG: Show hitbox information in console
    console.log('Detection debug:', {
        lockpickPosition: gameState.lockpickPosition.toFixed(1) + '%',
        lockpickPixels: lockpickPixelPosition.toFixed(1) + 'px',
        lockpickCenter: lockpickCenter.toFixed(1) + 'px',
        targetPosition: barrel.targetPosition.toFixed(1) + '%',
        targetPixels: targetZonePixelPosition.toFixed(1) + 'px',
        targetZone: `[${minTarget.toFixed(1)}px - ${maxTarget.toFixed(1)}px]`,
        isInTargetZone: isInTargetZone
    });
    
    // Stop movement
    stopLockpickMovement(false);
    
    if (isInTargetZone) {
        // SUCCESS - barrel unlocked!
        playSound(soundBarrelUnlock, 0.5);
        
        barrel.isUnlocked = true;
        
        barrel.barrelElement.classList.remove('progressing', 'locked');
        barrel.barrelElement.classList.add('unlocked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'UNLOCKED';
        
        // Move to next barrel
        if (gameState.currentBarrel < 5) {
            gameState.currentBarrel++;
            currentBarrelEl.textContent = gameState.currentBarrel;
            updateCurrentBarrelVisual();
            
            // Update target zone for new barrel
            const nextBarrel = gameState.barrels[gameState.currentBarrel - 1];
            updateTargetZonePosition(nextBarrel.targetPosition);
        } else {
            // All barrels unlocked - WIN!
            showWinScreen();
        }
    } else {
        // FAILED - incorrect ENTER press
        // Break a lockpick
        gameState.lockpicks--;
        lockpicksCount.textContent = gameState.lockpicks;
        
        // Play break sound
        playSound(soundLockpickBreak, 0.4);
        
        // RESET ALL BARRELS on failed attempt
        resetAllBarrels();
        
        // Check if out of lockpicks
        if (gameState.lockpicks <= 0) {
            showLoseScreen();
        }
    }
}

// Stop lockpick movement
function stopLockpickMovement(reachedEnd) {
    gameState.isLockpickMoving = false;
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // Reset progress bar
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    if (barrel && barrel.barrelElement && !barrel.isUnlocked) {
        barrel.barrelElement.classList.remove('progressing');
        barrel.progressElement.style.width = '0%';
        
        if (reachedEnd) {
            // Lockpick reached end without ENTER press - no penalty, just reset
            barrel.barrelElement.querySelector('.barrel-status').textContent = 'READY';
        }
    }
    
    // Reset lockpick position to 0
    lockpickEl.style.left = '0px';
}

// Reset ALL barrels (on failure)
function resetAllBarrels() {
    gameState.currentBarrel = 1;
    currentBarrelEl.textContent = '1';
    
    // Reset all barrels
    gameState.barrels.forEach(barrel => {
        barrel.isUnlocked = false;
        
        // Update barrel element
        barrel.barrelElement.classList.remove('unlocked', 'progressing');
        barrel.barrelElement.classList.add('locked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'LOCKED';
        
        // Generate new target position for each barrel
        barrel.targetPosition = Math.random() * 40 + 30; // 30-70%
        barrel.targetElement.style.left = `${barrel.targetPosition}%`;
    });
    
    // Update current barrel visual
    updateCurrentBarrelVisual();
    
    // Update target zone for first barrel
    const firstBarrel = gameState.barrels[0];
    updateTargetZonePosition(firstBarrel.targetPosition);
}

// Update target zone position in lockpick visual
function updateTargetZonePosition(position) {
    // Calculate pixel position based on container width
    const pixelPosition = (position / 100) * gameState.containerWidth;
    targetZone.style.left = `${pixelPosition}px`;
    targetZone.style.transform = 'translateX(-50%)'; // Center the target zone
}

// Show win screen
function showWinScreen() {
    gameState.isGameActive = false;
    stopLockpickMovement(false);
    
    // Hide game, show win screen
    gameContainer.style.display = 'none';
    winScreen.classList.add('active');
}

// Show lose screen
function showLoseScreen() {
    gameState.isGameActive = false;
    stopLockpickMovement(false);
    
    // Hide game, show lose screen
    gameContainer.style.display = 'none';
    loseScreen.classList.add('active');
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);