document.addEventListener('DOMContentLoaded', function() {
    const TRANSLATIONS = {
        en: {
            subtitle: 'CODE SEQUENCE VERIFICATION',
            attemptsLabel: './attempts',
            timeLabel: './time',
            availableSymbolsTitle: 'AVAILABLE SYMBOLS',
            currentGuessTitle: 'CURRENT GUESS',
            targetSequenceTitle: 'TARGET SEQUENCE',
            verifyButton: 'VERIFY',
            clearButton: 'CLEAR',
            attemptHistoryTitle: 'ATTEMPT HISTORY',
            systemInstructionTitle: 'SYSTEM INSTRUCTION',
            instruction1: '1. SELECT 4 SYMBOLS FROM THE AVAILABLE SET',
            instruction2: '2. BUILD A SEQUENCE IN THE INPUT FIELD',
            instruction3: '3. INITIATE THE VERIFICATION PROCEDURE',
            instruction4: '4. SYMBOLS',
            instruction4Suffix: '- CORRECT POSITION',
            instruction5: '5. SYMBOLS',
            instruction5Suffix: '- PRESENT IN THE SEQUENCE',
            instruction6: '6. PRESS L TO SWITCH LANGUAGE',
            instruction7: '7. DECODE THE PATTERN BEFORE SYSTEM LOCKDOWN',
            winTitle: 'ACCESS GRANTED',
            winSubtitle: 'Code sequence confirmed',
            codeLabel: 'CODE:',
            attemptsStatLabel: 'ATTEMPTS:',
            timeStatLabel: 'TIME:',
            statusLabel: 'STATUS:',
            statusValue: 'SECURE',
            playAgain: 'NEW SEQUENCE',
            consoleReady: 'READY TO RECEIVE SYMBOLS █',
            consoleInputCount: (count, total) => `SYMBOLS ENTERED: ${count}/${total} █`,
            consoleReadyToVerify: 'SEQUENCE READY FOR VERIFICATION █',
            consoleAttemptResult: (attempt, correct, partial) => `ATTEMPT ${attempt}: ${correct}✓ ${partial}? █`,
            consoleUnlocked: 'ACCESS GRANTED - SYSTEM UNLOCKED █',
            performanceExcellent: 'Optimal decryption achieved',
            performanceGood: 'Decryption within acceptable limits',
            performanceLow: 'Decryption complete - system resources depleted',
            symbolNames: ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA']
        },
        ru: {
            subtitle: 'ПРОВЕРКА ПОСЛЕДОВАТЕЛЬНОСТИ КОДА',
            attemptsLabel: './попытки',
            timeLabel: './время',
            availableSymbolsTitle: 'ДОСТУПНЫЕ СИМВОЛЫ',
            currentGuessTitle: 'ТЕКУЩАЯ ПОПЫТКА',
            targetSequenceTitle: 'ЦЕЛЕВАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ',
            verifyButton: 'ПРОВЕРИТЬ',
            clearButton: 'ОЧИСТИТЬ',
            attemptHistoryTitle: 'ИСТОРИЯ ПОПЫТОК',
            systemInstructionTitle: 'СИСТЕМНАЯ ИНСТРУКЦИЯ',
            instruction1: '1. ВЫБЕРИ 4 СИМВОЛА ИЗ ДОСТУПНЫХ ВАРИАНТОВ',
            instruction2: '2. СОСТАВЬ ПОСЛЕДОВАТЕЛЬНОСТЬ В ПОЛЕ ВВОДА',
            instruction3: '3. ИНИЦИИРУЙТЕ ПРОЦЕДУРУ ПРОВЕРКИ',
            instruction4: '4. СИМВОЛЫ',
            instruction4Suffix: '- ПРАВИЛЬНАЯ ПОЗИЦИЯ',
            instruction5: '5. СИМВОЛЫ',
            instruction5Suffix: '- ПРИСУТСТВУЮТ В ПОСЛЕДОВАТЕЛЬНОСТИ',
            instruction6: '6. НАЖМИТЕ L ДЛЯ СМЕНЫ ЯЗЫКА',
            instruction7: '7. РАСШИФРУЙТЕ КОД ДО БЛОКИРОВКИ СИСТЕМЫ',
            winTitle: 'ДОСТУП РАЗРЕШЁН',
            winSubtitle: 'Последовательность кода подтверждена',
            codeLabel: 'КОД:',
            attemptsStatLabel: 'ПОПЫТОК:',
            timeStatLabel: 'ВРЕМЯ:',
            statusLabel: 'СТАТУС:',
            statusValue: 'БЕЗОПАСНО',
            playAgain: 'НОВАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ',
            consoleReady: 'ГОТОВ К ПРИЁМУ СИМВОЛОВ █',
            consoleInputCount: (count, total) => `ВВЕДЕНО СИМВОЛОВ: ${count}/${total} █`,
            consoleReadyToVerify: 'ПОСЛЕДОВАТЕЛЬНОСТЬ ГОТОВА К ПРОВЕРКЕ █',
            consoleAttemptResult: (attempt, correct, partial) => `ПОПЫТКА ${attempt}: ${correct}✓ ${partial}? █`,
            consoleUnlocked: 'ДОСТУП РАЗРЕШЁН - СИСТЕМА РАЗБЛОКИРОВАНА █',
            performanceExcellent: 'Оптимальная расшифровка достигнута',
            performanceGood: 'Расшифровка в допустимых пределах',
            performanceLow: 'Расшифровка завершена - ресурсы системы истощены',
            symbolNames: ['АЛЬФА', 'БЕТА', 'ГАММА', 'ДЕЛЬТА', 'ЭПСИЛОН', 'ДЗЕТА']
        }
    };

    // Game state
    let attempts = 0;
    let gameActive = true;
    let timerActive = false;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let lastSecond = 0;
    let currentLanguage = 'en';
    let hasWon = false;
    
    // Game configuration
    const SEQUENCE_LENGTH = 4;
    const SYMBOL_COUNT = 6; // Total available symbols
    let secretSequence = [];
    let currentGuess = [];
    
    // System symbols
    const symbols = [
        { id: 1, emoji: "α" },
        { id: 2, emoji: "β" },
        { id: 3, emoji: "γ" },
        { id: 4, emoji: "δ" },
        { id: 5, emoji: "ε" },
        { id: 6, emoji: "ζ" }
    ];
    
    // DOM elements
    const symbolsElement = document.getElementById('symbols');
    const sequenceDisplay = document.getElementById('sequence-display');
    const guessSlots = document.getElementById('guess-slots');
    const attemptsElement = document.getElementById('attempts');
    const timerElement = document.getElementById('timer');
    const historyContainer = document.getElementById('history-container');
    const winMessage = document.getElementById('win-message');
    const finalAttemptsElement = document.getElementById('final-attempts');
    const finalTimeElement = document.getElementById('final-time');
    const finalCodeElement = document.getElementById('final-code');
    const secretMessageElement = document.getElementById('secret-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    const makeGuessBtn = document.getElementById('make-guess-btn');
    const resetGuessBtn = document.getElementById('reset-guess-btn');
    const consoleText = document.getElementById('selected-piece-info');

    function getText() {
        return TRANSLATIONS[currentLanguage];
    }

    function getSymbolName(id) {
        return getText().symbolNames[id - 1];
    }

    function setConsoleReady() {
        consoleText.textContent = getText().consoleReady;
    }

    function updatePerformanceMessage() {
        let message = "";
        if (attempts <= 4) {
            message = getText().performanceExcellent;
        } else if (attempts <= 8) {
            message = getText().performanceGood;
        } else {
            message = getText().performanceLow;
        }
        secretMessageElement.textContent = message;
    }

    function updateFinalCodeDisplay() {
        finalCodeElement.textContent = secretSequence.map(id => getSymbolName(id)).join(' - ');
    }

    function revealSequenceSlots() {
        const sequenceSlots = sequenceDisplay.querySelectorAll('.sequence-slot');
        sequenceSlots.forEach((slot, index) => {
            const symbol = symbols.find(s => s.id === secretSequence[index]);
            slot.innerHTML = `
                <div class="symbol-emoji-small">${symbol.emoji}</div>
                <div class="symbol-name-small">${getSymbolName(symbol.id)}</div>
            `;
            slot.classList.remove('hidden');
            slot.classList.add('revealed');
        });
    }

    function applyTranslations() {
        const t = getText();
        document.documentElement.lang = currentLanguage;

        const mappings = {
            subtitle: t.subtitle,
            'attempts-label': t.attemptsLabel,
            'time-label': t.timeLabel,
            'available-symbols-title': t.availableSymbolsTitle,
            'current-guess-title': t.currentGuessTitle,
            'target-sequence-title': t.targetSequenceTitle,
            'make-guess-btn': t.verifyButton,
            'reset-guess-btn': t.clearButton,
            'attempt-history-title': t.attemptHistoryTitle,
            'system-instruction-title': t.systemInstructionTitle,
            'instruction-1': t.instruction1,
            'instruction-2': t.instruction2,
            'instruction-3': t.instruction3,
            'instruction-6': t.instruction6,
            'instruction-7': t.instruction7,
            'win-title': t.winTitle,
            'win-subtitle': t.winSubtitle,
            'code-label': t.codeLabel,
            'attempts-stat-label': t.attemptsStatLabel,
            'time-stat-label': t.timeStatLabel,
            'status-label': t.statusLabel,
            'status-value': t.statusValue,
            'play-again-btn': t.playAgain
        };

        Object.entries(mappings).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        const instruction4 = document.getElementById('instruction-4');
        if (instruction4) {
            instruction4.innerHTML = `${t.instruction4} <span class="correct">✓</span> ${t.instruction4Suffix}`;
        }

        const instruction5 = document.getElementById('instruction-5');
        if (instruction5) {
            instruction5.innerHTML = `${t.instruction5} <span class="partial">?</span> ${t.instruction5Suffix}`;
        }

        createSymbolSelection();
        updateGuessSlots();

        if (hasWon) {
            revealSequenceSlots();
            updateFinalCodeDisplay();
            updatePerformanceMessage();
            consoleText.textContent = t.consoleUnlocked;
        } else if (gameActive) {
            if (currentGuess.length === 0) {
                setConsoleReady();
            } else if (currentGuess.length === SEQUENCE_LENGTH) {
                consoleText.textContent = t.consoleReadyToVerify;
            } else {
                consoleText.textContent = t.consoleInputCount(currentGuess.length, SEQUENCE_LENGTH);
            }
        }
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
        applyTranslations();
    }
    
    // Audio elements
    const buttonClickSound = document.getElementById('button-click-sound');
    const pieceSelectSound = document.getElementById('piece-select-sound');
    const pieceSwapSound = document.getElementById('piece-swap-sound');
    const winSound = document.getElementById('win-sound');
    const shuffleSound = document.getElementById('shuffle-sound');
    const tickSound = document.getElementById('tick-sound');
    
    // Timer functions
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function startTimer() {
        if (!timerActive) {
            timerActive = true;
            startTime = Date.now() - elapsedTime * 1000;
            lastSecond = Math.floor(elapsedTime);
            timerInterval = setInterval(updateTimer, 100);
        }
    }
    
    function stopTimer() {
        if (timerActive) {
            timerActive = false;
            clearInterval(timerInterval);
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        }
    }
    
    function resetTimer() {
        stopTimer();
        elapsedTime = 0;
        lastSecond = 0;
        timerElement.textContent = '00:00';
    }
    
    function updateTimer() {
        if (timerActive) {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            timerElement.textContent = formatTime(elapsedTime);
            
            // Play tick sound every second
            const currentSecond = Math.floor(elapsedTime);
            if (currentSecond > lastSecond) {
                lastSecond = currentSecond;
                playSound(tickSound);
            }
        }
    }
    
    // Initialize the game
    function initGame() {
        // Generate random secret sequence
        secretSequence = [];
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            secretSequence.push(Math.floor(Math.random() * SYMBOL_COUNT) + 1);
        }
        
        console.log("Secret sequence:", secretSequence);
        
        // Play shuffle sound on new game
        playSound(shuffleSound);
        
        // Reset game state
        attempts = 0;
        currentGuess = [];
        gameActive = true;
        hasWon = false;
        
        // Clear history
        historyContainer.innerHTML = '';
        
        // Update UI
        attemptsElement.textContent = attempts;
        setConsoleReady();
        updateSequenceDisplay();
        updateGuessSlots();
        applyTranslations();
        createSymbolSelection();
        
        // Reset timer
        resetTimer();
        
        // Hide win message
        winMessage.classList.remove('show');
    }
    
    // Create symbol selection
    function createSymbolSelection() {
        symbolsElement.innerHTML = '';
        
        symbols.forEach((symbol, index) => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.dataset.id = symbol.id;
            symbolElement.dataset.index = index;
            
            symbolElement.innerHTML = `
                <div class="symbol-emoji">${symbol.emoji}</div>
                <div class="symbol-name">${getSymbolName(symbol.id)}</div>
            `;
            
            symbolElement.addEventListener('click', () => {
                if (!gameActive) return;
                if (currentGuess.length >= SEQUENCE_LENGTH) {
                    playSound(buttonClickSound);
                    return;
                }
                playSound(pieceSelectSound);
                selectSymbol(symbol.id);
            });
            
            symbolsElement.appendChild(symbolElement);
        });
    }
    
    // Select symbol for current position
    function selectSymbol(symbolId) {
        if (currentGuess.length >= SEQUENCE_LENGTH) return;
        
        currentGuess.push(symbolId);
        updateGuessSlots();
        
        // Update console message
        consoleText.textContent = getText().consoleInputCount(currentGuess.length, SEQUENCE_LENGTH);
        
        // Check if guess is complete
        if (currentGuess.length === SEQUENCE_LENGTH) {
            makeGuessBtn.classList.add('active');
            consoleText.textContent = getText().consoleReadyToVerify;
        }
    }
    
    // Update guess slots display
    function updateGuessSlots() {
        const slots = guessSlots.querySelectorAll('.guess-slot');
        
        slots.forEach((slot, index) => {
            if (index < currentGuess.length) {
                const symbol = symbols.find(s => s.id === currentGuess[index]);
                slot.innerHTML = `
                    <div class="symbol-emoji-small">${symbol.emoji}</div>
                    <div class="symbol-name-small">${getSymbolName(symbol.id)}</div>
                `;
                slot.classList.remove('empty');
            } else {
                slot.textContent = '?';
                slot.classList.add('empty');
            }
        });
    }
    
    // Update sequence display
    function updateSequenceDisplay() {
        sequenceDisplay.innerHTML = '';
        
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            const slot = document.createElement('div');
            slot.className = 'sequence-slot hidden';
            slot.textContent = '?';
            sequenceDisplay.appendChild(slot);
        }
    }
    
    // Make a guess
    function makeGuess() {
        if (!gameActive || currentGuess.length !== SEQUENCE_LENGTH) {
            playSound(buttonClickSound);
            return;
        }
        
        // Start timer on first attempt
        if (attempts === 0 && !timerActive) {
            startTimer();
        }
        
        playSound(pieceSwapSound);
        attempts++;
        attemptsElement.textContent = attempts;
        
        // Calculate hints
        const hints = calculateHints(currentGuess, secretSequence);
        
        // Add to history
        addToHistory(currentGuess, hints);
        
        // Update console message
        consoleText.textContent = getText().consoleAttemptResult(attempts, hints.correct, hints.partial);
        
        // Check if won
        if (hints.correct === SEQUENCE_LENGTH) {
            gameWon();
        } else {
            // Reset for next guess
            currentGuess = [];
            updateGuessSlots();
            makeGuessBtn.classList.remove('active');
            setConsoleReady();
        }
    }
    
    // Calculate hints (correct position and wrong position)
    function calculateHints(guess, secret) {
        let correct = 0;
        let partial = 0;
        
        // Create copies to mark used symbols
        const guessCopy = [...guess];
        const secretCopy = [...secret];
        
        // First pass: find correct positions
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            if (guessCopy[i] === secretCopy[i]) {
                correct++;
                guessCopy[i] = null;
                secretCopy[i] = null;
            }
        }
        
        // Second pass: find partial matches
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            if (guessCopy[i] !== null) {
                const foundIndex = secretCopy.indexOf(guessCopy[i]);
                if (foundIndex !== -1) {
                    partial++;
                    secretCopy[foundIndex] = null;
                }
            }
        }
        
        return { correct, partial };
    }
    
    // Add attempt to history
    function addToHistory(guess, hints) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const guessHtml = guess.map(id => {
            const symbol = symbols.find(s => s.id === id);
            return `<span class="history-symbol">${symbol.emoji}</span>`;
        }).join('');
        
        const hintsHtml = 
            '✓'.repeat(hints.correct) + 
            '?'.repeat(hints.partial) + 
            '○'.repeat(SEQUENCE_LENGTH - hints.correct - hints.partial);
        
        historyItem.innerHTML = `
            <div class="history-guess">${guessHtml}</div>
            <div class="history-hints">${hintsHtml}</div>
        `;
        
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        
        // Limit history to 10 items
        if (historyContainer.children.length > 10) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }
    
    // Game won
    function gameWon() {
        gameActive = false;
        stopTimer();
        
        // Reveal secret sequence
        revealSequenceSlots();
        
        // Update win message
        finalAttemptsElement.textContent = attempts;
        finalTimeElement.textContent = formatTime(elapsedTime);
        
        updateFinalCodeDisplay();
        
        // Add secret message based on performance
        updatePerformanceMessage();
        hasWon = true;
        
        // Update console
        consoleText.textContent = getText().consoleUnlocked;
        
        // Play win sound
        playSound(winSound);
        
        // Show win message
        setTimeout(() => {
            winMessage.classList.add('show');
        }, 1000);
    }
    
    // Reset current guess
    function resetGuess() {
        if (!gameActive) return;
        
        playSound(buttonClickSound);
        currentGuess = [];
        updateGuessSlots();
        makeGuessBtn.classList.remove('active');
        setConsoleReady();
    }
    
    // Play sound
    function playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => {
                console.log("Ошибка воспроизведения звука:", e);
            });
        }
    }
    
    // Event listeners
    makeGuessBtn.addEventListener('click', makeGuess);
    resetGuessBtn.addEventListener('click', resetGuess);
    playAgainBtn.addEventListener('click', () => {
        playSound(buttonClickSound);
        initGame();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            toggleLanguage();
        }
    });
    
    // Initialize the game
    initGame();
    
    // Debug helper
    window.revealSecret = function() {
        const names = secretSequence.map(id => getSymbolName(id));
        console.log("Secret sequence:", names);
        alert(`Secret sequence: ${names.join(' - ')}`);
    };
});
