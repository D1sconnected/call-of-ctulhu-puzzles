document.addEventListener('DOMContentLoaded', function() {
    // Game state
    let steps = 0;
    let gameActive = true;
    let selectedPieceIndex = null;
    let timerActive = false;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let lastSecond = 0;
    
    // Single image - using local image from root directory
    const puzzleImage = 'mansion.jpg';
    
    // Puzzle configuration
    const boardSize = 3; // 3x3 grid
    
    // Each position on the board stores which piece is currently there
    // piecePositions[i] = which piece image is at position i (0-8)
    let piecePositions = [];
    
    // DOM elements
    const puzzleBoard = document.getElementById('puzzle-board');
    const stepsElement = document.getElementById('steps');
    const timerElement = document.getElementById('timer');
    const winMessage = document.getElementById('win-message');
    const finalStepsElement = document.getElementById('final-steps');
    const finalTimeElement = document.getElementById('final-time');
    const playAgainBtn = document.getElementById('play-again-btn');
    const selectedPieceInfo = document.getElementById('selected-piece-info');
    
    // Audio elements
    const buttonClickSound = document.getElementById('button-click-sound');
    const pieceSelectSound = document.getElementById('piece-select-sound');
    const pieceSwapSound = document.getElementById('piece-swap-sound');
    const winSound = document.getElementById('win-sound');
    const shuffleSound = document.getElementById('shuffle-sound');
    const tickSound = document.getElementById('tick-sound');
    
    // Sound function - always on
    function playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => {
                console.log("Audio play failed:", e);
            });
        }
    }
    
    // Timer functions with milliseconds
    function formatTime(milliseconds) {
        const totalSeconds = milliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const centiseconds = Math.floor((milliseconds % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    function startTimer() {
        if (!timerActive) {
            timerActive = true;
            startTime = Date.now() - elapsedTime;
            lastSecond = Math.floor(elapsedTime / 1000);
            timerInterval = setInterval(updateTimer, 10); // Update every 10ms for smooth centiseconds
        }
    }
    
    function stopTimer() {
        if (timerActive) {
            timerActive = false;
            clearInterval(timerInterval);
            elapsedTime = Date.now() - startTime;
        }
    }
    
    function resetTimer() {
        stopTimer();
        elapsedTime = 0;
        lastSecond = 0;
        timerElement.textContent = '00:00.00';
    }
    
    function updateTimer() {
        if (timerActive) {
            elapsedTime = Date.now() - startTime;
            timerElement.textContent = formatTime(elapsedTime);
            
            // Play tick sound every second
            const currentSecond = Math.floor(elapsedTime / 1000);
            if (currentSecond > lastSecond) {
                lastSecond = currentSecond;
                playSound(tickSound);
            }
        }
    }
    
    function getCurrentTime() {
        return formatTime(elapsedTime);
    }
    
    // Initialize the puzzle
    function initPuzzle() {
        puzzleBoard.innerHTML = '';
        piecePositions = [];
        selectedPieceIndex = null;
        selectedPieceInfo.textContent = 'SYSTEM READY...';
        
        // Initialize with pieces in correct order
        for (let i = 0; i < boardSize * boardSize; i++) {
            piecePositions.push(i);
        }
        
        createPuzzlePieces();
        
        // Reset steps
        steps = 0;
        stepsElement.textContent = steps;
        
        // Reset timer
        resetTimer();
        
        gameActive = true;
        
        // Remove selection from all pieces
        updatePieceSelection();
        
        // Shuffle the puzzle on initialization
        shuffleOnInit();
    }
    
    // Create puzzle pieces
    function createPuzzlePieces() {
        // Clear the board first
        puzzleBoard.innerHTML = '';
        
        // Create puzzle pieces at each position
        for (let position = 0; position < piecePositions.length; position++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.position = position;
            piece.dataset.pieceId = piecePositions[position];
            
            // The piece ID tells us which image slice to show
            const pieceId = piecePositions[position];
            
            const col = pieceId % boardSize;
            const row = Math.floor(pieceId / boardSize);
            
            // For 3x3 grid
            const bgSize = 300; // 300% of container
            
            const xPos = -col * 100;
            const yPos = -row * 100;
            
            piece.style.backgroundImage = `url('${puzzleImage}')`;
            piece.style.backgroundSize = `${bgSize}% ${bgSize}%`;
            piece.style.backgroundPosition = `${xPos}% ${yPos}%`;
            
            // Add click event listener
            piece.addEventListener('click', function() {
                playSound(pieceSelectSound);
                handlePieceClick(position);
            });
            
            puzzleBoard.appendChild(piece);
        }
    }
    
    // Shuffle on initialization
    function shuffleOnInit() {
        // Clear any selection
        selectedPieceIndex = null;
        selectedPieceInfo.textContent = 'SYSTEM READY...';
        
        // Play shuffle sound
        playSound(shuffleSound);
        
        // Fisher-Yates shuffle algorithm
        for (let i = piecePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [piecePositions[i], piecePositions[j]] = [piecePositions[j], piecePositions[i]];
        }
        
        // Recreate pieces with new positions
        createPuzzlePieces();
        
        // Update selection visual
        updatePieceSelection();
    }
    
    // Handle piece click
    function handlePieceClick(position) {
        if (!gameActive) return;
        
        // Start timer on first move
        if (steps === 0 && !timerActive) {
            startTimer();
        }
        
        // If no piece is selected, select this position
        if (selectedPieceIndex === null) {
            selectedPieceIndex = position;
            selectedPieceInfo.textContent = `NODE ${position + 1} SELECTED → CHOOSE ADJACENT`;
        }
        // If same position is clicked again, deselect it
        else if (selectedPieceIndex === position) {
            selectedPieceIndex = null;
            selectedPieceInfo.textContent = 'SYSTEM READY...';
        }
        // If a different position is clicked, check if adjacent and swap
        else {
            if (arePositionsAdjacent(selectedPieceIndex, position)) {
                // Play swap sound
                playSound(pieceSwapSound);
                
                // Swap the pieces at these two positions
                [piecePositions[selectedPieceIndex], piecePositions[position]] = 
                [piecePositions[position], piecePositions[selectedPieceIndex]];
                
                // Update UI - recreate pieces with new positions
                createPuzzlePieces();
                
                // Clear selection
                selectedPieceIndex = null;
                selectedPieceInfo.textContent = 'SYSTEM READY...';
                
                // Increment steps
                steps++;
                stepsElement.textContent = steps;
                
                // Update visual selection (should clear it)
                updatePieceSelection();
                
                // Check if puzzle is solved
                if (isPuzzleSolved()) {
                    gameActive = false;
                    stopTimer();
                    finalStepsElement.textContent = steps;
                    finalTimeElement.textContent = getCurrentTime();
                    
                    // Play win sound
                    playSound(winSound);
                    
                    setTimeout(() => {
                        winMessage.classList.add('show');
                    }, 500);
                }
            } else {
                // Pieces are not adjacent, select the new piece instead
                selectedPieceIndex = position;
                selectedPieceInfo.textContent = `NODE ${position + 1} SELECTED → CHOOSE ADJACENT`;
                updatePieceSelection();
            }
        }
    }
    
    // Check if two positions are adjacent
    function arePositionsAdjacent(pos1, pos2) {
        const row1 = Math.floor(pos1 / boardSize);
        const col1 = pos1 % boardSize;
        const row2 = Math.floor(pos2 / boardSize);
        const col2 = pos2 % boardSize;
        
        // Check if adjacent horizontally or vertically (not diagonally)
        return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }
    
    // Update visual selection of pieces
    function updatePieceSelection() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        
        pieces.forEach((piece, i) => {
            const position = parseInt(piece.dataset.position);
            if (position === selectedPieceIndex) {
                piece.classList.add('selected');
            } else {
                piece.classList.remove('selected');
            }
        });
    }
    
    // Check if puzzle is solved
    function isPuzzleSolved() {
        for (let i = 0; i < piecePositions.length; i++) {
            if (piecePositions[i] !== i) {
                return false;
            }
        }
        return true;
    }
    
    // Play again button handler
    function playAgain() {
        // Play button click sound
        playSound(buttonClickSound);
        
        initPuzzle();
        winMessage.classList.remove('show');
    }
    
    // Event listener for play again button
    playAgainBtn.addEventListener('click', playAgain);
    
    // Initialize the game
    initPuzzle();
});