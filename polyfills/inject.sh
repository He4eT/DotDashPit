#!/bin/bash

POLYFILLS_FILE="./polyfills/polyfills.js"
GAME_FILE="game.js"
TEMP_FILE="merged_game.js"

sed -i 's/TIC()/_()/' "$GAME_FILE"
sed -i 's/FONT_SIZE = 1/FONT_SIZE = 2/' "$GAME_FILE"
sed -i 's/HINT_DISTANCE = 30/HINT_DISTANCE = 0/' "$GAME_FILE"
sed -i 's/DOT_DASH_THRESHOLD = 200/DOT_DASH_THRESHOLD = 150/' "$GAME_FILE"

cat "$POLYFILLS_FILE" "$GAME_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$GAME_FILE"
