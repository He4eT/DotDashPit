#!/bin/bash

POLYFILLS_FILE="./polyfills/polyfills.js"
GAME_FILE="game.js"
TEMP_FILE="merged_game.js"

sed -i 's/TIC()/_()/' "$GAME_FILE"

cat "$POLYFILLS_FILE" "$GAME_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$GAME_FILE"
