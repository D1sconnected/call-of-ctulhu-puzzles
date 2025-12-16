// ============================================
// GAME CONFIGURATION - EDIT THESE VALUES
// ============================================
const GAME_CONFIG = {
    // Number of lock barrels (3-5)
    barrelCount: 3,
    
    // Starting number of lockpicks
    initialLockpicks: 10,
    
    // Width of green target zone in pixels
    targetZoneWidth: 100,
    
    // Possible speeds for lockpick movement (lower = slower)
    speedVariants: [0.8, 1.0, 1.3, 1.6],
    
    // How far the lockpick travels (50-100%)
    trackLength: 80,
    
    // Where green zones can appear (avoid edges)
    targetPositionMin: 30,  // Minimum percentage
    targetPositionMax: 70   // Maximum percentage
};

// ============================================
// GAME STATE
// ============================================
let gameState = null;

// DOM elements
let lockBarrels, currentBarrelEl, lockpicksCount, lockpickEl, targetZone;
let winScreen, loseScreen, gameContainer, lockpickVisual;
let soundLockpickMove, soundLockpickFix, soundLockpickBreak, soundBarrelUnlock;

// Debug flag - set to true to see console messages
const DEBUG = true;

// Initialize game on page load
function initGame() {
    console.log('Initializing game...');
    
    try {
        // Initialize DOM elements
        initDOMElements();
        console.log('DOM elements initialized');
        
        // Initialize game state with config
        initGameState();
        console.log('Game state initialized');
        
        // Calculate container width for accurate positioning
        gameState.containerWidth = lockpickVisual.offsetWidth;
        console.log('Container width:', gameState.containerWidth);
        
        // Create barrels based on config
        createBarrels();
        console.log('Barrels created:', gameState.settings.barrelCount);
        
        // Setup event listeners
        setupEventListeners();
        console.log('Event listeners set up');
        
        // Initialize target zone position for first barrel
        const firstBarrel = gameState.barrels[0];
        if (firstBarrel) {
            updateTargetZonePosition(firstBarrel.targetPosition);
            console.log('Target zone positioned at:', firstBarrel.targetPosition + '%');
        }
        
        // Update UI with initial values
        currentBarrelEl.textContent = gameState.currentBarrel;
        lockpicksCount.textContent = gameState.lockpicks;
        console.log('UI updated');
        
        // Focus the game container for keyboard input
        gameContainer.focus();
        console.log('Game container focused for keyboard input');
        
        // Add click event to regain focus if needed
        gameContainer.addEventListener('click', () => {
            gameContainer.focus();
            console.log('Game container re-focused on click');
        });
        
        // Add tabindex to make game container focusable
        gameContainer.setAttribute('tabindex', '0');
        gameContainer.style.outline = 'none'; // Remove focus outline
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            gameState.containerWidth = lockpickVisual.offsetWidth;
            // Update target zone position on resize
            const currentBarrel = gameState.barrels[gameState.currentBarrel - 1];
            if (currentBarrel) {
                updateTargetZonePosition(currentBarrel.targetPosition);
            }
        });
        
        console.log('Game initialization complete!');
        console.log('Current state:', {
            isGameActive: gameState.isGameActive,
            currentBarrel: gameState.currentBarrel,
            lockpicks: gameState.lockpicks,
            containerWidth: gameState.containerWidth
        });
        
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error initializing game. Check console for details.');
    }
}

// Initialize DOM elements
function initDOMElements() {
    console.log('Looking for DOM elements...');
    
    lockBarrels = document.getElementById('lockBarrels');
    currentBarrelEl = document.getElementById('currentBarrel');
    lockpicksCount = document.getElementById('lockpicksCount');
    lockpickEl = document.getElementById('lockpick');
    targetZone = document.getElementById('targetZone');
    winScreen = document.getElementById('winScreen');
    loseScreen = document.getElementById('loseScreen');
    gameContainer = document.getElementById('gameContainer');
    lockpickVisual = document.querySelector('.lockpick-visual');
    
    soundLockpickMove = document.getElementById('soundLockpickMove');
    soundLockpickFix = document.getElementById('soundLockpickFix');
    soundLockpickBreak = document.getElementById('soundLockpickBreak');
    soundBarrelUnlock = document.getElementById('soundBarrelUnlock');
    
    // Log found elements for debugging
    console.log('DOM elements found:', {
        lockBarrels: !!lockBarrels,
        currentBarrelEl: !!currentBarrelEl,
        lockpicksCount: !!lockpicksCount,
        lockpickEl: !!lockpickEl,
        targetZone: !!targetZone,
        winScreen: !!winScreen,
        loseScreen: !!loseScreen,
        gameContainer: !!gameContainer,
        lockpickVisual: !!lockpickVisual
    });
}

// Initialize game state with config
function initGameState() {
    // Validate config values
    const settings = validateConfig(GAME_CONFIG);
    
    gameState = {
        barrels: [],
        currentBarrel: 1,
        lockpicks: settings.initialLockpicks,
        isGameActive: true,
        isLockpickMoving: false,
        currentSpeed: 0,
        lockpickPosition: 0,
        animationId: null,
        speedVariants: settings.speedVariants,
        trackLength: settings.trackLength,
        targetZoneHalfWidth: settings.targetZoneWidth / 2,
        containerWidth: 0,
        settings: settings
    };
    
    // Update target zone width in CSS
    if (targetZone) {
        targetZone.style.width = `${settings.targetZoneWidth}px`;
        console.log('Target zone width set to:', settings.targetZoneWidth + 'px');
    }
    
    console.log('Game state initialized with settings:', settings);
}

// Validate configuration values
function validateConfig(config) {
    const validated = { ...config };
    
    // Ensure barrelCount is between 3 and 5
    validated.barrelCount = Math.max(3, Math.min(5, Number(validated.barrelCount) || 5));
    
    // Ensure initialLockpicks is positive
    validated.initialLockpicks = Math.max(1, Number(validated.initialLockpicks) || 10);
    
    // Ensure targetZoneWidth is reasonable
    validated.targetZoneWidth = Math.max(50, Math.min(200, Number(validated.targetZoneWidth) || 100));
    
    // Ensure speedVariants is an array with valid numbers
    if (!Array.isArray(validated.speedVariants)) {
        validated.speedVariants = [0.8, 1.0, 1.3, 1.6];
    }
    validated.speedVariants = validated.speedVariants.map(s => Math.max(0.5, Math.min(5, Number(s) || 1)));
    
    // Ensure trackLength is between 50 and 100
    validated.trackLength = Math.max(50, Math.min(100, Number(validated.trackLength) || 80));
    
    // Ensure target position range is valid
    validated.targetPositionMin = Math.max(10, Math.min(90, Number(validated.targetPositionMin) || 30));
    validated.targetPositionMax = Math.max(validated.targetPositionMin + 10, Math.min(90, Number(validated.targetPositionMax) || 70));
    
    return validated;
}

// Create lock barrels based on config
function createBarrels() {
    if (!lockBarrels) {
        console.error('lockBarrels element not found!');
        return;
    }
    
    lockBarrels.innerHTML = '';
    gameState.barrels = [];
    
    const barrelCount = gameState.settings.barrelCount;
    const targetMin = gameState.settings.targetPositionMin;
    const targetMax = gameState.settings.targetPositionMax;
    const targetRange = targetMax - targetMin;
    
    for (let i = 1; i <= barrelCount; i++) {
        // Generate random target position within configured range
        const barrel = {
            id: i,
            isUnlocked: false,
            targetPosition: Math.random() * targetRange + targetMin,
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
        barrelEl.dataset.count = barrelCount;
        
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
        
        if (DEBUG) {
            console.log(`Barrel ${i} created with target at ${barrel.targetPosition.toFixed(1)}%`);
        }
    }
    
    // Update rules text with current barrel count
    updateRulesText(barrelCount);
    
    // Set current barrel visual
    updateCurrentBarrelVisual();
}

// Update rules text with current barrel count
function updateRulesText(barrelCount) {
    const rulesList = document.querySelector('.rules ul');
    if (rulesList && rulesList.firstElementChild) {
        rulesList.firstElementChild.textContent = `Unlock all ${barrelCount} barrels in sequence`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Remove any existing listeners first
    document.removeEventListener('keydown', handleKeyPress);
    
    // Add keyboard event listener to document (not just game container)
    document.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard event listener added to document');
    
    // Also add to game container for extra safety
    gameContainer.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard event listener also added to game container');
    
    // Add a test button for debugging if needed
    if (DEBUG) {
        // Remove existing test button if any
        const existingButton = document.querySelector('#testButton');
        if (existingButton) existingButton.remove();
        
        const testButton = document.createElement('button');
        testButton.id = 'testButton';
        testButton.textContent = 'TEST: Start Lockpick';
        testButton.style.position = 'fixed';
        testButton.style.top = '10px';
        testButton.style.right = '10px';
        testButton.style.zIndex = '1000';
        testButton.style.padding = '10px';
        testButton.style.background = '#8a6dc7';
        testButton.style.color = 'white';
        testButton.style.border = 'none';
        testButton.style.borderRadius = '5px';
        testButton.style.cursor = 'pointer';
        testButton.style.fontFamily = 'Cinzel, serif';
        testButton.style.fontWeight = 'bold';
        
        testButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Test button clicked - attempting to start lockpick');
            startLockpick();
        });
        
        document.body.appendChild(testButton);
    }
}

// Handle keyboard input
function handleKeyPress(e) {
    // Prevent default behavior for game keys
    if (e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
        e.preventDefault();
    }
    
    console.log('Key pressed:', e.key, 'Game active:', gameState?.isGameActive, 'Lockpick moving:', gameState?.isLockpickMoving);
    
    if (!gameState || !gameState.isGameActive) {
        console.log('Game not active or gameState not initialized');
        return;
    }
    
    // Start lockpick movement - can always start if not already moving
    if ((e.key === 'w' || e.key === 'W') && !gameState.isLockpickMoving) {
        console.log('Starting lockpick movement...');
        startLockpick();
    }
    
    // Fix lockpick position - only if lockpick is moving
    if (e.key === 'Enter' && gameState.isLockpickMoving) {
        console.log('Fixing lockpick position...');
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
    if (gameState.isGameActive && gameState.currentBarrel <= gameState.settings.barrelCount) {
        const currentBarrelEl = document.querySelector(`.barrel[data-id="${gameState.currentBarrel}"]`);
        if (currentBarrelEl) {
            currentBarrelEl.classList.add('current');
            console.log('Current barrel set to:', gameState.currentBarrel);
        }
    }
}

// Play sound with volume control
function playSound(sound, volume = 0.5) {
    if (sound) {
        try {
            sound.volume = volume;
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.log("Audio play failed (safe to ignore):", e);
            });
        } catch (error) {
            console.log("Audio error:", error);
        }
    }
}

// Start lockpick movement
function startLockpick() {
    console.log('startLockpick called. State:', {
        isGameActive: gameState.isGameActive,
        isLockpickMoving: gameState.isLockpickMoving,
        currentBarrel: gameState.currentBarrel,
        lockpicks: gameState.lockpicks
    });
    
    if (!gameState.isGameActive) {
        console.log('Game not active');
        return;
    }
    
    if (gameState.isLockpickMoving) {
        console.log('Lockpick already moving');
        return;
    }
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    if (!barrel) {
        console.error('No barrel found for currentBarrel:', gameState.currentBarrel);
        return;
    }
    
    if (barrel.isUnlocked) {
        console.log('Barrel already unlocked');
        return; // Shouldn't happen with auto-selection
    }
    
    if (gameState.lockpicks <= 0) {
        console.log('No lockpicks left');
        showLoseScreen();
        return;
    }
    
    // Play lockpick movement sound
    playSound(soundLockpickMove, 0.3);
    console.log('Played movement sound');
    
    // Select random speed from variants
    const randomIndex = Math.floor(Math.random() * gameState.speedVariants.length);
    gameState.currentSpeed = gameState.speedVariants[randomIndex];
    console.log('Selected speed:', gameState.currentSpeed);
    
    // Start lockpick movement
    gameState.isLockpickMoving = true;
    gameState.lockpickPosition = 0;
    
    // Update barrel status
    barrel.barrelElement.classList.add('progressing');
    barrel.barrelElement.querySelector('.barrel-status').textContent = 'IN PROGRESS';
    
    // Set target zone for current barrel
    updateTargetZonePosition(barrel.targetPosition);
    
    console.log('Starting movement animation...');
    // Start movement animation
    moveLockpick();
}

// Move the lockpick
function moveLockpick() {
    if (!gameState.isLockpickMoving) {
        console.log('moveLockpick called but lockpick not moving');
        return;
    }
    
    // Update lockpick position
    gameState.lockpickPosition += gameState.currentSpeed;
    
    // Check if reached the end (trackLength%)
    if (gameState.lockpickPosition >= gameState.trackLength) {
        gameState.lockpickPosition = gameState.trackLength;
        
        // Update visuals
        updateLockpickVisualPosition();
        const barrel = gameState.barrels[gameState.currentBarrel - 1];
        barrel.progressElement.style.width = `${gameState.lockpickPosition}%`;
        
        console.log('Lockpick reached end of track at', gameState.lockpickPosition + '%');
        
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
    const pixelPosition = (gameState.lockpickPosition / 100) * gameState.containerWidth;
    lockpickEl.style.left = `${pixelPosition}px`;
    
    if (DEBUG && gameState.lockpickPosition % 20 < 1) {
        console.log('Lockpick position:', gameState.lockpickPosition.toFixed(1) + '%', 'pixels:', pixelPosition.toFixed(1));
    }
}

// Fix lockpick at current position
function fixLockpick() {
    console.log('fixLockpick called');
    
    if (!gameState.isGameActive) {
        console.log('Game not active');
        return;
    }
    
    if (!gameState.isLockpickMoving) {
        console.log('Lockpick not moving');
        return;
    }
    
    const barrel = gameState.barrels[gameState.currentBarrel - 1];
    
    if (!barrel) {
        console.error('No barrel found');
        return;
    }
    
    // Play lockpick fix sound
    playSound(soundLockpickFix, 0.4);
    
    // Get ACTUAL pixel positions for accurate detection
    const containerWidth = gameState.containerWidth;
    const lockpickPixelPosition = (gameState.lockpickPosition / 100) * containerWidth;
    const targetZonePixelPosition = (barrel.targetPosition / 100) * containerWidth;
    
    // Get target zone width from config
    const targetZonePixelWidth = gameState.settings.targetZoneWidth;
    const targetZoneHalfPixelWidth = targetZonePixelWidth / 2;
    
    // Calculate the center of the lockpick (4px from left edge since lockpick is 8px wide)
    const lockpickCenter = lockpickPixelPosition + 4;
    
    // Calculate target zone boundaries
    const minTarget = targetZonePixelPosition - targetZoneHalfPixelWidth;
    const maxTarget = targetZonePixelPosition + targetZoneHalfPixelWidth;
    
    // Check if lockpick center is within target zone
    const isInTargetZone = lockpickCenter >= minTarget && lockpickCenter <= maxTarget;
    
    console.log('Detection results:', {
        lockpickPosition: gameState.lockpickPosition.toFixed(1) + '%',
        lockpickPixels: lockpickPixelPosition.toFixed(1) + 'px',
        lockpickCenter: lockpickCenter.toFixed(1) + 'px',
        targetPosition: barrel.targetPosition.toFixed(1) + '%',
        targetPixels: targetZonePixelPosition.toFixed(1) + 'px',
        targetZoneWidth: targetZonePixelWidth + 'px',
        targetZone: `[${minTarget.toFixed(1)}px - ${maxTarget.toFixed(1)}px]`,
        isInTargetZone: isInTargetZone
    });
    
    // Stop movement
    stopLockpickMovement(false);
    
    if (isInTargetZone) {
        // SUCCESS - barrel unlocked!
        console.log('SUCCESS! Barrel unlocked');
        playSound(soundBarrelUnlock, 0.5);
        
        barrel.isUnlocked = true;
        
        barrel.barrelElement.classList.remove('progressing', 'locked');
        barrel.barrelElement.classList.add('unlocked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'UNLOCKED';
        
        // Move to next barrel
        if (gameState.currentBarrel < gameState.settings.barrelCount) {
            gameState.currentBarrel++;
            currentBarrelEl.textContent = gameState.currentBarrel;
            updateCurrentBarrelVisual();
            
            // Update target zone for new barrel
            const nextBarrel = gameState.barrels[gameState.currentBarrel - 1];
            updateTargetZonePosition(nextBarrel.targetPosition);
            
            console.log('Moving to next barrel:', gameState.currentBarrel);
        } else {
            // All barrels unlocked - WIN!
            console.log('ALL BARRELS UNLOCKED - VICTORY!');
            showWinScreen();
        }
    } else {
        // FAILED - incorrect ENTER press
        console.log('FAILED! Wrong timing');
        // Break a lockpick
        gameState.lockpicks--;
        lockpicksCount.textContent = gameState.lockpicks;
        
        // Play break sound
        playSound(soundLockpickBreak, 0.4);
        
        // RESET ALL BARRELS on failed attempt
        console.log('Resetting all barrels...');
        resetAllBarrels();
        
        // Check if out of lockpicks
        if (gameState.lockpicks <= 0) {
            console.log('Out of lockpicks - GAME OVER');
            showLoseScreen();
        }
    }
}

// Stop lockpick movement
function stopLockpickMovement(reachedEnd) {
    console.log('stopLockpickMovement called, reachedEnd:', reachedEnd);
    
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
            console.log('Lockpick reached end, barrel reset to READY');
        }
    }
    
    // Reset lockpick position to 0
    lockpickEl.style.left = '0px';
}

// Reset ALL barrels (on failure)
function resetAllBarrels() {
    gameState.currentBarrel = 1;
    currentBarrelEl.textContent = '1';
    
    const targetMin = gameState.settings.targetPositionMin;
    const targetMax = gameState.settings.targetPositionMax;
    const targetRange = targetMax - targetMin;
    
    // Reset all barrels
    gameState.barrels.forEach(barrel => {
        barrel.isUnlocked = false;
        
        // Update barrel element
        barrel.barrelElement.classList.remove('unlocked', 'progressing');
        barrel.barrelElement.classList.add('locked');
        barrel.barrelElement.querySelector('.barrel-status').textContent = 'LOCKED';
        
        // Generate new target position for each barrel
        barrel.targetPosition = Math.random() * targetRange + targetMin;
        barrel.targetElement.style.left = `${barrel.targetPosition}%`;
    });
    
    // Update current barrel visual
    updateCurrentBarrelVisual();
    
    // Update target zone for first barrel
    const firstBarrel = gameState.barrels[0];
    updateTargetZonePosition(firstBarrel.targetPosition);
    
    console.log('All barrels reset. New target positions:', gameState.barrels.map(b => b.targetPosition.toFixed(1)));
}

// Update target zone position in lockpick visual
function updateTargetZonePosition(position) {
    // Calculate pixel position based on container width
    const pixelPosition = (position / 100) * gameState.containerWidth;
    targetZone.style.left = `${pixelPosition}px`;
    
    if (DEBUG) {
        console.log('Target zone updated to:', position.toFixed(1) + '%', 'pixels:', pixelPosition.toFixed(1));
    }
}

// Show win screen
function showWinScreen() {
    gameState.isGameActive = false;
    stopLockpickMovement(false);
    
    // Hide game, show win screen
    gameContainer.style.display = 'none';
    winScreen.classList.add('active');
    
    console.log('Win screen shown');
}

// Show lose screen
function showLoseScreen() {
    gameState.isGameActive = false;
    stopLockpickMovement(false);
    
    // Hide game, show lose screen
    gameContainer.style.display = 'none';
    loseScreen.classList.add('active');
    
    console.log('Lose screen shown');
}

// Initialize when page loads
console.log('Script loading...');
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing game...');
    initGame();
});