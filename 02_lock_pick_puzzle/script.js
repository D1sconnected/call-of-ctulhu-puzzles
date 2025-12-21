// ============================================
// GAME CONFIGURATION - EDIT THESE VALUES
// ============================================
const GAME_CONFIG = {
    // Number of lock pins (3-5)
    pinCount: 4,
    
    // Starting number of lockpicks
    initialLockpicks: 3,
    
    // Width of green target zone in pixels (horizontal position indicator)
    targetZoneWidth: 40,
    
    // Possible speeds for lockpick movement (lower = slower)
    speedVariants: [1.2, 2.0, 2.3, 1.7],
    
    // How far the lockpick travels (50-100%)
    trackLength: 80,
    
    // Where target zones can appear (avoid edges)
    targetPositionMin: 30,  // Minimum percentage
    targetPositionMax: 70   // Maximum percentage
};

// ============================================
// GAME STATE
// ============================================
let gameState = null;

// DOM elements
let lockBarrels, currentBarrelEl, lockpicksCount, lockpicksContainer;
let winScreen, loseScreen, gameContainer;
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
        
        // Create realistic lock mechanism
        createRealisticLock();
        console.log('Realistic lock created');
        
        // Setup event listeners
        setupEventListeners();
        console.log('Event listeners set up');
        
        // Update UI with initial values
        currentBarrelEl.textContent = gameState.currentBarrel;
        lockpicksCount.textContent = gameState.lockpicks;
        
        // Focus the game container for keyboard input
        focusGameContainer();
        
        console.log('Game initialization complete!');
        
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
    lockpicksContainer = document.getElementById('lockpicksContainer');
    winScreen = document.getElementById('winScreen');
    loseScreen = document.getElementById('loseScreen');
    gameContainer = document.getElementById('gameContainer');
    
    soundLockpickMove = document.getElementById('soundLockpickMove');
    soundLockpickFix = document.getElementById('soundLockpickFix');
    soundLockpickBreak = document.getElementById('soundLockpickBreak');
    soundBarrelUnlock = document.getElementById('soundBarrelUnlock');
    
    // Log found elements for debugging
    console.log('DOM elements found:', {
        currentBarrelEl: !!currentBarrelEl,
        lockpicksCount: !!lockpicksCount,
        lockpicksContainer: !!lockpicksContainer,
        winScreen: !!winScreen,
        loseScreen: !!loseScreen,
        gameContainer: !!gameContainer
    });
}

// Focus the game container for keyboard input
function focusGameContainer() {
    if (!gameContainer) {
        console.error('gameContainer element not found!');
        return;
    }
    
    // Set tabindex to make it focusable if not already
    gameContainer.setAttribute('tabindex', '0');
    
    // Focus it
    gameContainer.focus();
    console.log('Game container focused');
    
    // Add event listeners to regain focus when clicking anywhere
    document.addEventListener('click', (e) => {
        // If not clicking on a splash screen button
        if (!e.target.closest('.metal-btn')) {
            gameContainer.focus();
        }
    });
    
    // Also focus when any key is pressed
    document.addEventListener('keydown', (e) => {
        if (!gameContainer.contains(document.activeElement)) {
            gameContainer.focus();
        }
    });
}

// Initialize game state with config
function initGameState() {
    // Validate config values
    const settings = validateConfig(GAME_CONFIG);
    
    gameState = {
        pins: [], // Now called pins instead of barrels
        currentPin: 1,
        lockpicks: settings.initialLockpicks,
        isGameActive: true,
        isLockpickMoving: false,
        currentSpeed: 0,
        lockpickPosition: 0, // Represents horizontal position (0-100%)
        animationId: null,
        speedVariants: settings.speedVariants,
        trackLength: settings.trackLength,
        targetZoneHalfWidth: settings.targetZoneWidth / 2,
        settings: settings
    };
    
    console.log('Game state initialized:', gameState);
}

// Validate configuration values
function validateConfig(config) {
    const validated = { ...config };
    
    // Ensure pinCount is between 3 and 5
    validated.pinCount = Math.max(3, Math.min(5, Number(validated.pinCount) || 5));
    
    // Ensure initialLockpicks is positive
    validated.initialLockpicks = Math.max(1, Number(validated.initialLockpicks) || 10);
    
    // Ensure targetZoneWidth is reasonable
    validated.targetZoneWidth = Math.max(20, Math.min(60, Number(validated.targetZoneWidth) || 40));
    
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

// Create realistic lock mechanism
function createRealisticLock() {
    const lockSection = document.getElementById('realLockSection');
    if (!lockSection) {
        console.error('realLockSection element not found!');
        return;
    }
    
    lockSection.innerHTML = '';
    gameState.pins = [];
    
    const pinCount = gameState.settings.pinCount;
    const targetMin = gameState.settings.targetPositionMin;
    const targetMax = gameState.settings.targetPositionMax;
    const targetRange = targetMax - targetMin;
    
    // Create lock body
    const lockBody = document.createElement('div');
    lockBody.className = 'lock-body';
    
    // Create lock cylinder
    const lockCylinder = document.createElement('div');
    lockCylinder.className = 'lock-cylinder';
    
    // Create keyway
    const keyway = document.createElement('div');
    keyway.className = 'keyway';
    
    // Create pin chambers
    const pinChambers = document.createElement('div');
    pinChambers.className = 'pin-chambers';
    
    // Create shear line
    const shearLine = document.createElement('div');
    shearLine.className = 'shear-line';
    
    // Create lockpick tool
    const lockpickTool = document.createElement('div');
    lockpickTool.className = 'lockpick-tool';
    lockpickTool.id = 'lockpickTool';
    
    // Create tension wrench
    const tensionWrench = document.createElement('div');
    tensionWrench.className = 'tension-wrench';
    
    // Create lockpick position indicator
    const positionIndicator = document.createElement('div');
    positionIndicator.className = 'lockpick-position-indicator';
    positionIndicator.id = 'positionIndicator';
    
    // Create position slider inside indicator
    const positionSlider = document.createElement('div');
    positionSlider.className = 'position-slider';
    positionSlider.id = 'positionSlider';
    
    // Create target zone
    const targetZone = document.createElement('div');
    targetZone.className = 'target-zone';
    targetZone.id = 'targetZone';
    
    // Assemble lock
    positionIndicator.appendChild(targetZone);
    positionIndicator.appendChild(positionSlider);
    
    lockCylinder.appendChild(keyway);
    lockCylinder.appendChild(pinChambers);
    lockCylinder.appendChild(shearLine);
    lockCylinder.appendChild(lockpickTool);
    lockCylinder.appendChild(tensionWrench);
    
    lockBody.appendChild(lockCylinder);
    lockBody.appendChild(positionIndicator);
    
    // Create pin chambers based on pin count
    for (let i = 1; i <= pinCount; i++) {
        // Generate random target position within configured range
        const pin = {
            id: i,
            isUnlocked: false,
            targetPosition: Math.random() * targetRange + targetMin,
            driverPinElement: null,
            keyPinElement: null,
            pinChamberElement: null,
            statusLightElement: null
        };
        
        gameState.pins.push(pin);
        
        // Create pin chamber
        const pinChamber = document.createElement('div');
        pinChamber.className = 'pin-chamber';
        pinChamber.dataset.id = i;
        
        // Create label
        const pinLabel = document.createElement('div');
        pinLabel.className = 'pin-label';
        pinLabel.textContent = i;
        
        // Create chamber tube
        const chamberTube = document.createElement('div');
        chamberTube.className = 'chamber-tube';
        
        // Create driver pin (top pin)
        const driverPin = document.createElement('div');
        driverPin.className = 'driver-pin';
        driverPin.dataset.id = i;
        driverPin.style.height = `${pin.targetPosition}%`;
        
        // Create spring
        const spring = document.createElement('div');
        spring.className = 'pin-spring';
        
        // Create spring coils
        for (let j = 0; j < 6; j++) {
            const coil = document.createElement('div');
            coil.className = 'spring-coil-vertical';
            spring.appendChild(coil);
        }
        
        // Create key pin (bottom pin)
        const keyPin = document.createElement('div');
        keyPin.className = 'key-pin';
        keyPin.dataset.id = i;
        keyPin.style.height = `${100 - pin.targetPosition}%`;
        
        // Assemble pin chamber
        chamberTube.appendChild(driverPin);
        chamberTube.appendChild(spring);
        chamberTube.appendChild(keyPin);
        
        pinChamber.appendChild(pinLabel);
        pinChamber.appendChild(chamberTube);
        pinChambers.appendChild(pinChamber);
        
        // Store references
        pin.driverPinElement = driverPin;
        pin.keyPinElement = keyPin;
        pin.pinChamberElement = pinChamber;
    }
    
    // Create lock status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'lock-status-indicator';
    
    for (let i = 1; i <= pinCount; i++) {
        const pinStatus = document.createElement('div');
        pinStatus.className = 'pin-status';
        
        const statusLight = document.createElement('div');
        statusLight.className = 'status-light';
        statusLight.dataset.id = i;
        
        const statusLabel = document.createElement('div');
        statusLabel.className = 'status-label';
        statusLabel.textContent = `PIN ${i}`;
        
        pinStatus.appendChild(statusLight);
        pinStatus.appendChild(statusLabel);
        statusIndicator.appendChild(pinStatus);
        
        // Store reference
        gameState.pins[i - 1].statusLightElement = statusLight;
    }
    
    // Assemble lock section
    lockSection.appendChild(lockBody);
    lockSection.appendChild(statusIndicator);
    
    // Update rules text with current pin count
    updateRulesText(pinCount);
    
    // Set current pin visual
    updateCurrentPinVisual();
    
    // Initialize target zone position
    updateTargetZonePosition();
    
    if (DEBUG) {
        console.log('Realistic lock created with', pinCount, 'pins');
        gameState.pins.forEach(pin => {
            console.log(`Pin ${pin.id} target at ${pin.targetPosition.toFixed(1)}%`);
        });
    }
}

// Update rules text with current pin count
function updateRulesText(pinCount) {
    const rulesList = document.querySelector('.rules ul');
    if (rulesList && rulesList.firstElementChild) {
        rulesList.firstElementChild.textContent = `Set all ${pinCount} pins at shear line`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Remove any existing listeners first
    document.removeEventListener('keydown', handleKeyPress);
    gameContainer.removeEventListener('keydown', handleKeyPress);
    
    // Add keyboard event listener to the document (not just game container)
    document.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard event listener added to document');
    
    // Also add to game container for extra safety
    gameContainer.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard event listener also added to game container');
    
    // Add a click event to focus game container when clicking anywhere
    document.addEventListener('click', (e) => {
        // If not clicking on win/lose screen button
        if (!e.target.closest('.metal-btn') && gameState && gameState.isGameActive) {
            gameContainer.focus();
        }
    });
}

// Handle keyboard input
function handleKeyPress(e) {
    console.log('Key pressed:', e.key, 
                'Game active:', gameState?.isGameActive, 
                'Lockpick moving:', gameState?.isLockpickMoving);
    
    // Prevent default behavior for game keys to avoid scrolling or other actions
    if (e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!gameState || !gameState.isGameActive) {
        console.log('Game not active or gameState not initialized');
        return;
    }
    
    // Start lockpick movement - can always start if not already moving
    if ((e.key === 'w' || e.key === 'W') && !gameState.isLockpickMoving) {
        console.log('Starting lockpick movement...');
        startLockpick();
        return; // Stop further processing
    }
    
    // Fix lockpick position - only if lockpick is moving
    if (e.key === 'Enter' && gameState.isLockpickMoving) {
        console.log('Fixing lockpick position...');
        fixLockpick();
        return; // Stop further processing
    }
}

// Update visual for current pin
function updateCurrentPinVisual() {
    // Remove current class from all pins
    document.querySelectorAll('.pin-chamber').forEach(chamber => {
        chamber.classList.remove('current');
    });
    
    document.querySelectorAll('.status-light').forEach(light => {
        light.classList.remove('current');
    });
    
    // Add current class to current pin if game is active
    if (gameState.isGameActive && gameState.currentPin <= gameState.settings.pinCount) {
        const currentPin = gameState.pins[gameState.currentPin - 1];
        if (currentPin) {
            currentPin.pinChamberElement.classList.add('current');
            currentPin.statusLightElement.classList.add('current');
            console.log('Current pin set to:', gameState.currentPin);
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
        currentPin: gameState.currentPin,
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
    
    const pin = gameState.pins[gameState.currentPin - 1];
    
    if (!pin) {
        console.error('No pin found for currentPin:', gameState.currentPin);
        return;
    }
    
    if (pin.isUnlocked) {
        console.log('Pin already unlocked');
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
    
    // Update lock visual for picking active
    setPickingActive(true);
    
    // Update target zone for current pin
    updateTargetZonePosition();
    
    console.log('Starting movement animation...');
    // Start movement animation
    moveLockpick();
}

// Move the lockpick (horizontal movement)
function moveLockpick() {
    if (!gameState.isLockpickMoving) {
        console.log('moveLockpick called but lockpick not moving');
        return;
    }
    
    // Update lockpick position (horizontal)
    gameState.lockpickPosition += gameState.currentSpeed;
    
    // Check if reached the end (trackLength%)
    if (gameState.lockpickPosition >= gameState.trackLength) {
        gameState.lockpickPosition = gameState.trackLength;
        
        // Update visuals
        updateLockpickVisualPosition();
        
        console.log('Lockpick reached end of track at', gameState.lockpickPosition + '%');
        
        // Stop movement naturally (no lockpick break, no reset)
        stopLockpickMovement(true);
        return;
    }
    
    // Update lockpick visual position
    updateLockpickVisualPosition();
    
    // Continue animation
    gameState.animationId = requestAnimationFrame(() => moveLockpick());
}

// Update lockpick visual position
function updateLockpickVisualPosition() {
    const positionSlider = document.getElementById('positionSlider');
    const lockpickTool = document.getElementById('lockpickTool');
    
    if (!positionSlider || !lockpickTool) return;
    
    // Calculate pixel position based on indicator width (180px)
    const sliderWidth = 180;
    const sliderPosition = (gameState.lockpickPosition / 100) * sliderWidth;
    positionSlider.style.left = `${sliderPosition - 15}px`; // Center the slider (30px wide)
    
    // Update lockpick tool angle (simulating picking action)
    const angle = (gameState.lockpickPosition - 50) / 50 * 15; // ±15 degrees
    lockpickTool.style.transform = `rotate(${angle}deg)`;
    
    if (DEBUG && Math.floor(gameState.lockpickPosition) % 20 === 0) {
        console.log('Lockpick position:', gameState.lockpickPosition.toFixed(1) + '%', 'pixels:', sliderPosition.toFixed(1));
    }
}

// Update target zone position
function updateTargetZonePosition() {
    const targetZone = document.getElementById('targetZone');
    if (!targetZone) return;
    
    const pin = gameState.pins[gameState.currentPin - 1];
    if (!pin) return;
    
    // Calculate pixel position based on indicator width (180px)
    const sliderWidth = 180;
    const targetPosition = (pin.targetPosition / 100) * sliderWidth;
    const targetZoneHalfWidth = gameState.targetZoneHalfWidth;
    
    const targetMin = targetPosition - targetZoneHalfWidth;
    const targetMax = targetPosition + targetZoneHalfWidth;
    
    targetZone.style.left = `${targetMin}px`;
    targetZone.style.width = `${targetMax - targetMin}px`;
    
    if (DEBUG) {
        console.log(`Target zone updated to:`, targetPosition.toFixed(1) + 'px', 'range:', `${targetMin.toFixed(1)}-${targetMax.toFixed(1)}px`);
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
    
    const pin = gameState.pins[gameState.currentPin - 1];
    
    if (!pin) {
        console.error('No pin found');
        return;
    }
    
    // Play lockpick fix sound
    playSound(soundLockpickFix, 0.4);
    
    // Get ACTUAL pixel positions for accurate detection
    const sliderWidth = 180;
    const lockpickPixelPosition = (gameState.lockpickPosition / 100) * sliderWidth;
    const targetZonePixelPosition = (pin.targetPosition / 100) * sliderWidth;
    
    // Get target zone width from config
    const targetZonePixelWidth = gameState.settings.targetZoneWidth;
    const targetZoneHalfPixelWidth = targetZonePixelWidth / 2;
    
    // Calculate the center of the lockpick slider (15px from left edge since slider is 30px wide)
    const lockpickCenter = lockpickPixelPosition;
    
    // Calculate target zone boundaries
    const minTarget = targetZonePixelPosition - targetZoneHalfPixelWidth;
    const maxTarget = targetZonePixelPosition + targetZoneHalfPixelWidth;
    
    // Check if lockpick center is within target zone
    const isInTargetZone = lockpickCenter >= minTarget && lockpickCenter <= maxTarget;
    
    console.log('Detection results:', {
        lockpickPosition: gameState.lockpickPosition.toFixed(1) + '%',
        lockpickPixels: lockpickPixelPosition.toFixed(1) + 'px',
        lockpickCenter: lockpickCenter.toFixed(1) + 'px',
        targetPosition: pin.targetPosition.toFixed(1) + '%',
        targetPixels: targetZonePixelPosition.toFixed(1) + 'px',
        targetZoneWidth: targetZonePixelWidth + 'px',
        targetZone: `[${minTarget.toFixed(1)}px - ${maxTarget.toFixed(1)}px]`,
        isInTargetZone: isInTargetZone
    });
    
    // Stop movement
    stopLockpickMovement(false);
    
    if (isInTargetZone) {
        // SUCCESS - pin unlocked!
        console.log('SUCCESS! Pin unlocked');
        playSound(soundBarrelUnlock, 0.5);
        showSuccessFlash();
        
        pin.isUnlocked = true;
        
        pin.pinChamberElement.classList.remove('current');
        pin.pinChamberElement.classList.add('unlocked');
        pin.statusLightElement.classList.remove('current');
        pin.statusLightElement.classList.add('unlocked');
        
        // Move to next pin
        if (gameState.currentPin < gameState.settings.pinCount) {
            gameState.currentPin++;
            currentBarrelEl.textContent = gameState.currentPin;
            updateCurrentPinVisual();
            updateTargetZonePosition();
            
            console.log('Moving to next pin:', gameState.currentPin);
        } else {
            // All pins unlocked - WIN!
            console.log('ALL PINS UNLOCKED - VICTORY!');
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
        
        // RESET ALL PINS on failed attempt
        console.log('Resetting all pins...');
        resetAllPins();
        
        // Check if out of lockpicks
        if (gameState.lockpicks <= 0) {
            console.log('Out of lockpicks - GAME OVER');
            showLoseScreen();
        }
    }
}

// Show success flash effect
function showSuccessFlash() {
    const lockBody = document.querySelector('.lock-body');
    if (!lockBody) return;
    
    const flash = document.createElement('div');
    flash.className = 'success-flash';
    
    lockBody.appendChild(flash);
    
    // Remove flash after animation
    setTimeout(() => {
        if (flash.parentNode) {
            flash.parentNode.removeChild(flash);
        }
    }, 500);
}

// Stop lockpick movement
function stopLockpickMovement(reachedEnd) {
    console.log('stopLockpickMovement called, reachedEnd:', reachedEnd);
    
    gameState.isLockpickMoving = false;
    setPickingActive(false);
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // Reset lockpick position to start
    const positionSlider = document.getElementById('positionSlider');
    if (positionSlider) {
        positionSlider.style.left = '0px';
    }
    
    const lockpickTool = document.getElementById('lockpickTool');
    if (lockpickTool) {
        lockpickTool.style.transform = 'rotate(0deg)';
    }
}

// Set picking active state for animations
function setPickingActive(isActive) {
    const lockBody = document.querySelector('.lock-body');
    if (lockBody) {
        lockBody.classList.toggle('picking-active', isActive);
    }
}

// Reset ALL pins (on failure)
function resetAllPins() {
    gameState.currentPin = 1;
    currentBarrelEl.textContent = '1';
    
    const targetMin = gameState.settings.targetPositionMin;
    const targetMax = gameState.settings.targetPositionMax;
    const targetRange = targetMax - targetMin;
    
    // Reset all pins
    gameState.pins.forEach(pin => {
        pin.isUnlocked = false;
        
        // Update pin element
        pin.pinChamberElement.classList.remove('unlocked', 'current');
        pin.statusLightElement.classList.remove('unlocked', 'current');
        
        // Generate new target position for each pin
        pin.targetPosition = Math.random() * targetRange + targetMin;
        
        // Update pin heights
        pin.driverPinElement.style.height = `${pin.targetPosition}%`;
        pin.keyPinElement.style.height = `${100 - pin.targetPosition}%`;
    });
    
    // Update current pin visual
    updateCurrentPinVisual();
    
    // Update target zone position
    updateTargetZonePosition();
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
console.log('Script loading...');
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing game...');
    initGame();
});