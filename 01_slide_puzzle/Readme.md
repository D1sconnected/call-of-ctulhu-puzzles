# Slide Puzzle
A retro-styled 80s puzzle game with a green matrix aesthetic and atmospheric sound effects.

Vibe-coded with the help of AI, feel free to use and modify.

# ✨ Game Features

* Image divided into 9 pieces
* Audio feedback for all actions
* Millisecond timer for intensity
* Move counter, that tracks player moves
* Puzzle shuffles on load
* Visual effects: glitch animations, scanlines, matrix noise

# 📁 Project Structure

```
puzzle-game/
│
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # Game logic (JavaScript)
│
├── mansion.jpg         # Main puzzle image
│
├── button-click.mp3    # Button click sound
├── piece-select.mp3    # Piece selection sound
├── piece-swap.mp3      # Piece swap sound
├── win-sound.mp3       # Victory sound
├── shuffle-sound.mp3   # Shuffle sound
└── tick.mp3            # Clock tick sound (every second)
```

# 🎨 Color Scheme

The game uses green matrix-inspired colors:
* Main background: #051A0F (very dark green)
* Primary accent: #63B35A (main green)
* Secondary accent: #0C7348 (dark green)
* Light accent: #8BC34A (light green)
* Details: #A5D6A7 (very light green)

# 🎮 How to Play

* Launch the game by opening index.html in a browser
* Click any puzzle piece to select it (it will highlight)
* Click an adjacent piece (up, down, left, or right) to swap them
* Repeat steps 2-3 until you reconstruct the original image
* Monitor the move counter and timer
* After winning, click "CONTINUE" for a new game

# 🖼️ Changing the Puzzle Image

To use a different puzzle image:
* Place your image file in the root folder
* Rename it to mansion.jpg
* Or edit the line in script.js:

```
const puzzleImage = 'your-image.jpg';
```