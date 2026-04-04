# call-of-ctulhu-puzzles

A collection of HTML-based interactive puzzles for Call of Cthulhu sessions. Each puzzle is self-contained, browser-friendly, and designed to feel like an in-world prop or mini-game rather than a generic web toy.

## Current Puzzles

### [01_slide_puzzle](./01_slide_puzzle/)
A retro terminal-style sliding puzzle with sound effects, move counter, timer, and bilingual interface support.

### [02_lock_pick_puzzle](./02_lock_pick_puzzle/)
A lockpicking mini-game inspired by TES IV: Oblivion, adapted for a creepy investigative atmosphere with audio feedback and multi-pin progression.

### [03_guess_puzzle](./03_guess_puzzle/)
A code-sequence deduction puzzle where players assemble guesses from symbolic inputs, review attempt history, and decode the correct pattern before system lockdown.

## Language Support

All current puzzles now use English as the default interface language.

Press `L` during a puzzle to switch between:
- English
- Russian

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/D1sconnected/call-of-ctulhu-puzzles.git
```

2. Open any puzzle folder, for example:

```bash
cd call-of-ctulhu-puzzles/02_lock_pick_puzzle
```

3. Open `index.html` in a browser.

## Repository Structure

```text
01_slide_puzzle/
02_lock_pick_puzzle/
03_guess_puzzle/
```

Each folder contains its own HTML, CSS, JavaScript, sounds, and image assets.

## Contributing

Want to add a new puzzle or improve an existing one?

- Fork the repository
- Create a new puzzle folder
- Keep assets local to that puzzle
- Update this README with a short description
- Submit a pull request
