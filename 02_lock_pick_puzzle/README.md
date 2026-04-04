# 02_lock_pick_puzzle

An HTML lockpicking puzzle inspired by the feel of TES IV: Oblivion, reworked for a Call of Cthulhu session as a tense, tactile interface challenge.

## Overview

The player works through a multi-pin lock one pin at a time. For each pin, they start the moving pick, stop it at the right moment, and try to align the mechanism correctly. A failed attempt costs a lockpick and resets progress.

This version is built as a self-contained browser mini-game with:

- atmospheric metallic UI
- sound effects for movement, fixing, breakage, and unlock events
- English by default with runtime language switching
- responsive scaling for desktop and smaller screens

## Controls

- `W` or `↑ W`: start lockpick movement
- `Enter`: fix the current position
- `L`: switch interface language between English and Russian

## Gameplay Rules

- The lock contains several pins that must be solved in order
- The moving marker travels across the position bar
- Press `Enter` while the marker is inside the target zone
- A correct timing sets the current pin and moves to the next one
- A wrong timing breaks one lockpick and resets all pin progress
- If all pins are solved, the lock opens
- If lockpicks run out, the attempt fails

## Files

- `index.html`: puzzle markup and UI structure
- `styles.css`: lock visuals, layout, and responsive behavior
- `script.js`: game state, pin logic, language switching, and audio handling
- `background.jpg`, `texture.jpg`, `note_texture.jpg`: visual assets
- `sounds/`: movement, fix, break, and unlock sound effects

## Language Support

The puzzle starts in English.

Press `L` at any time to switch between:

- English
- Russian

## Running the Puzzle

Open `index.html` in a browser. No build step is required.

## Session Use Ideas

This puzzle works well as:

- a locked cabinet in an abandoned hospital
- a tool locker in a workshop or basement
- a maintenance compartment aboard a ship
- a physical gate before players can access a clue, key, or document

Because it is short and skill-based, it fits especially well as an in-session interruption rather than a long standalone challenge.
