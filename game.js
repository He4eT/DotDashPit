// title:   MorsePit
// author:  He4eT@oddsquat.org
// desc:    Defeat endless waves of enemies using Morse code.
// site:    https://github.com/He4eT/MorsePit
// license: MIT License
// version: 0.1
// script:  js

let morseTable = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z',
}

let keyDownAt = 0
let keyUpAt = 0
let isKeyDown = false

let morseBuffer = ''

function TIC() {
  gameStages[currentStage]()
}

/* Stages */

const gameStages = {
  startScreen,
  gameScreen,
  gameoverScreen,
}

/** @type {keyof typeof gameStages} */
let currentStage = 'startScreen'

/* State */

/** @type {Arena} */
const arena = {
  screenPosition: {
    x: 7,
    y: 7,
  },
  bounds: {
    top: 0,
    right: 225,
    bottom: 89,
    left: 0,
  },
  spriteHalfSize: 3,
  wave: 0,
}

/** @type {Player} */
const player = {
  state: 'default',
  position: {
    x: rnd(arena.bounds.left, arena.bounds.right),
    y: rnd(arena.bounds.top, arena.bounds.bottom),
  },
}

const playerStates = {
  default: {
    speed: 1,
  },
  dot: {
    speed: 1.5,
  },
  dash: {
    speed: 2,
  },
}

/** @type {Enemy[]} */
let enemies = []

/** @type {Effect[]} */
let effects = []

/* Main Menu */

function startScreen() {
  cls()
  const title = 'Morse Pit'
  print(title, 12, 12, 3, false, 2)

  const instruction = 'Press any key to start'
  print(instruction, 12, 30, 4)

  if (anyKeyPressed()) {
    currentStage = 'gameScreen'
  }
}

/* Gameover */

function gameoverScreen() {
  if (effects.length > 0) {
    drawFX()
    drawEnemies()
    drawPlayer()
  } else {
    const title = 'Game Over'
    print(title, 12, SCREEN_H - 24, 10, false, 2)

    if (anyKeyPressed()) {
      reset()
    }
  }
}

function gameover() {
  effects = [
    {
      type: 'flash',
      frames: '7777777777654321000000000000000000'.split(''),
    },
  ]
  currentStage = 'gameoverScreen'
}

/* Gameplay */

function gameScreen() {
  checkColisions()

  handleMoves()
  // handleMorse()

  spawnEnemies()
  moveEnemies()

  drawInterface()
  drawArena()
  drawFX()
  drawEnemies()
  drawPlayer()
  drawLetters()
  handleMorse()
}

/* Interface */

function drawInterface() {
  cls(0)
}

function drawSprite(spriteIndex, x, y) {
  const colorkey = 0
  const center = arenaToScreen({ x, y })

  spr(
    spriteIndex,
    center.x - arena.spriteHalfSize,
    center.y - arena.spriteHalfSize,
    colorkey,
  )
}

/* Arena */

function drawArena() {
  map(0, 0, 30, 15)
}

function arenaToScreen({ x, y }) {
  return {
    x: x + arena.screenPosition.x,
    y: y + arena.screenPosition.y,
  }
}

/* Player */

function handleMoves() {
  let dx = 0
  if (btn(BTN_L)) dx -= 1
  if (btn(BTN_R)) dx += 1

  let dy = 0
  if (btn(BTN_U)) dy -= 1
  if (btn(BTN_D)) dy += 1

  const { speed } = playerStates[player.state]

  const norm = speed / ([dx, dy].every((d) => d !== 0) ? Math.SQRT2 : 1)
  const { bounds } = arena

  player.position.x = Math.max(
    bounds.left,
    Math.min(bounds.right, player.position.x + dx * norm),
  )
  player.position.y = Math.max(
    bounds.top,
    Math.min(bounds.bottom, player.position.y + dy * norm),
  )
}

function handleMorse() {
  // Cheatcode

  if (btnp(BTN_B, 100, 100)) {
    const letter = enemies[0].letter
    destroyEnemiesByLetter(letter)
  }

  // Morse part

  const buttonPressed = btn(4)
  // const buttonPressed = [BTN_A, BTN_B, BTN_X, BTN_Y].map(btn).some(Boolean)

  // player.sprite = buttonPressed ? 65 : 64
  // player.speed = buttonPressed ? 2 : 1

  const now = time()
  const dotDashThreshold = 200
  const idleTimeout = 500

  // Start
  if (buttonPressed && !isKeyDown) {
    isKeyDown = true
    keyDownAt = now
  }

  if (buttonPressed && isKeyDown) {
    const dash = now - keyDownAt > dotDashThreshold
    player.state = dash ? 'dash' : 'dot'
  }

  // Release
  if (!buttonPressed && isKeyDown) {
    player.state = 'default'
    isKeyDown = false
    keyUpAt = now
    morseBuffer += keyUpAt - keyDownAt < dotDashThreshold ? '.' : '-'

    effects.unshift({
      type: 'detection',
      frames: [8],
      to: player.position,
    })
  }

  // Flush by Timeout
  if (!buttonPressed && morseBuffer.length > 0 && now - keyUpAt > idleTimeout) {
    if (morseTable[morseBuffer]) {
      destroyEnemiesByLetter(morseTable[morseBuffer])
    }
    morseBuffer = ''
  }

  // Debug
  print('Current Code: ' + morseBuffer, 10, 100)
  print('Current Code Length: ' + morseBuffer.length, 10, 106)
}

function drawPlayer() {
  drawSprite(
    {
      default: 64,
      dot: 65,
      dash: 66,
    }[player.state],
    player.position.x,
    player.position.y,
  )
}

/* Enemies */

const enemyBehaviors = {
  point: () => {},
  fidget: (enemy) => {
    const speed = 0.5
    const current = enemy.positions[0]
    const previous = enemy.positions[1] || current

    let d = getDirection(previous, current)

    if (Math.random() < 0.05 || (d.x === 0 && d.y === 0)) {
      const angle = Math.random() * 2 * Math.PI
      d = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }
    }

    let dx = d.x * speed
    let dy = d.y * speed

    let newX = current.x + dx
    let newY = current.y + dy

    if (newX < arena.bounds.left || newX > arena.bounds.right) {
      dx = -dx
      newX = current.x + dx
    }

    if (newY < arena.bounds.top || newY > arena.bounds.bottom) {
      dy = -dy
      newY = current.y + dy
    }

    enemy.positions = [
      { x: newX, y: newY },
      { x: current.x, y: current.y },
    ]
  },
  bounce: (enemy) => {
    const speed = 1
    const current = enemy.positions[0]
    const previous = enemy.positions[1]

    const d = getDirection(previous, current)

    let dx = d.x * speed
    let dy = d.y * speed

    let newX = current.x + dx
    let newY = current.y + dy

    if (newX < arena.bounds.left || newX > arena.bounds.right) {
      dx = -dx
      newX = current.x + dx
    }

    if (newY < arena.bounds.top || newY > arena.bounds.bottom) {
      dy = -dy
      newY = current.y + dy
    }

    enemy.positions = [
      { x: newX, y: newY },
      { x: current.x, y: current.y },
    ]
  },
  zombie: (enemy) => {
    const speed = 0.5
    const current = enemy.positions[0]
    const target = player.position

    const d = getDirection(current, target)

    enemy.positions = [
      {
        x: current.x + d.x * speed,
        y: current.y + d.y * speed,
      },
    ]
  },
}

function spawnEnemies() {
  if (enemies.length > 0) {
    return
  }

  arena.wave += 1

  const enemyCount = 1 + Math.floor(arena.wave / 2)

  const getType = (wave) => {
    if (wave <= 2) return 'point'

    const enemyTypes = Object.keys(enemyBehaviors)
    return enemyTypes[rnd(0, enemyTypes.length - 1)]
  }

  const getDangerZone = (type) => {
    if (type === 'zombie') return 6
    return 8
  }

  const getRandomLetter = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return alphabet[rnd(0, alphabet.length - 1)]
  }

  const getSpawnPosition = () => {
    const minDistance = 12 * arena.spriteHalfSize
    const b = 4 * arena.spriteHalfSize
    let x, y, distance

    do {
      x = rnd(arena.bounds.left + b, arena.bounds.right - b)
      y = rnd(arena.bounds.top + b, arena.bounds.bottom - b)
      distance = Math.hypot(x - player.position.x, y - player.position.y)
    } while (distance < minDistance)

    return { x, y }
  }

  enemies = arr(enemyCount).map(() => {
    const type = getType(arena.wave)
    return {
      type,
      letter: getRandomLetter(),
      positions: [getSpawnPosition(), getSpawnPosition()],
      dangerZone: getDangerZone(type),
    }
  })

  enemies.forEach((enemy) => {
    effects.unshift({
      type: 'detection',
      to: enemy.positions[0],
      frames: arr(10, 4),
    })
  })
}

function moveEnemies() {
  enemies.forEach((enemy) => enemyBehaviors[enemy.type](enemy))
}

function destroyEnemiesByLetter(letter) {
  const destructionEffects = [
    ['laser', [1, 3, 5, 7, 7, 5, 3, 1]],
    ['laser', [2, 4, 6, 6, 7, 6, 4, 2]],
    ['laser', [1, 2, 3, 4, 7, 7, 7, 6, 5, 4, 3, 2, 1]],
    ['nuke', [7, 6, 5, 4, 3, 2]],
    ['verticalLine', [4, 5, 6, 7, 7, 6, 5, 4]],
    ['horizontalLine', [4, 5, 6, 7, 7, 6, 5, 4]],
  ]

  enemies
    .filter((enemy) => enemy.letter === letter)
    .forEach((enemy) => {
      const [type, frames] =
        destructionEffects[rnd(0, destructionEffects.length - 1)]

      effects.unshift({
        type,
        frames,
        from: player.position,
        to: enemy.positions[0],
      })
    })

  enemies = enemies.filter((enemy) => enemy.letter !== letter)
}

function checkColisions() {
  if (
    enemies
      .map((enemy) => [
        enemy,
        Math.hypot(
          player.position.x - enemy.positions[0].x,
          player.position.y - enemy.positions[0].y,
        ),
      ])
      .some(([enemy, distance]) => distance < enemy.dangerZone)
  ) {
    gameover()
  }
}

function drawEnemies() {
  enemies
    .map((enemy) => [
      {
        point: 80,
        fidget: 81,
        bounce: 82,
        zombie: 83,
      }[enemy.type],
      enemy.positions[0].x,
      enemy.positions[0].y,
    ])
    .forEach(([sprite, x, y]) => drawSprite(sprite, x, y))
}

function drawLetters() {
  enemies.forEach((enemy) => {
    const enemyPosition = enemy.positions[0]
    const d = getDirection(enemyPosition, player.position)

    const letterPos = {
      x: enemyPosition.x - d.x * 18,
      y: enemyPosition.y - d.y * 18,
    }

    const screenPos = arenaToScreen(letterPos)

    rect(screenPos.x - 7, screenPos.y - 7, 16, 16, 5)
    print(enemy.letter, screenPos.x - 4, screenPos.y - 4, 2, false, 2)
  })
}

/* Effects */

const effectHandlers = {
  flash: ({ frames }) => {
    const color = frames.shift()
    cls(color)
  },
  laser: ({ from, to, frames }) => {
    const color = frames.shift()
    line(from.x, from.y, to.x, to.y, color)
    circ(from.x, from.y, frames.length / 3, color)
    circ(to.x, to.y, frames.length / 2, color)
    circb(to.x, to.y, frames.length, color + 3)
  },
  nuke: ({ to, frames }) => {
    const color = frames.shift()
    circ(to.x, to.y, Math.pow(frames.length, 5), color)
  },
  verticalLine: ({ to, frames }) => {
    const color = frames.shift()
    rect(0, to.y - frames.length, SCREEN_W, frames.length * 2, color)
  },
  horizontalLine: ({ to, frames }) => {
    const color = frames.shift()
    rect(to.x - frames.length, 0, frames.length * 2, SCREEN_W, color)
  },
  detection: ({ to, frames }) => {
    const color = frames.shift()
    const w = arena.spriteHalfSize
    const d = frames.length + 2 * w
    const corners = [
      [+1, +1],
      [+1, -1],
      [-1, +1],
      [-1, -1],
    ]

    corners.forEach(([dx, dy]) => {
      const x = to.x + dx * d
      const y = to.y + dy * d

      line(x, y, x - dx * w, y, color)
      line(x, y, x, y - dy * w, color)
    })
  },
}

function drawFX() {
  effects
    .map((effect) => ({
      ...effect,
      from: arenaToScreen(effect.from ?? {}),
      to: arenaToScreen(effect.to ?? {}),
    }))
    .forEach((effect) => effectHandlers[effect.type](effect))

  effects = effects.filter(({ frames }) => frames.length > 0)
}

/* Utils */

function arr(n, filler) {
  const result = []
  for (let i = 0; i < n; i++) {
    result.push(filler)
  }

  return result
}

function rnd(from, to) {
  return Math.floor(Math.random() * (to - from + 1)) + from
}

function getDirection(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1

  return {
    x: dx / distance,
    y: dy / distance,
  }
}

function anyKeyPressed() {
  for (let i = 0; i < 8; i++) {
    if (btnp(i)) {
      return true
    }
  }
  return false
}

/* Constants */

/* Screen */
const SCREEN_W = 240
const SCREEN_H = 136

/* Buttons */
const BTN_U = 0
const BTN_D = 1
const BTN_L = 2
const BTN_R = 3
const BTN_A = 4
const BTN_B = 5
const BTN_X = 6
const BTN_Y = 7

/* Types */

/**
 * @typedef {{ x: number, y: number }} Point
 *
 * @typedef {{
 *   screenPosition: Point,
 *   bounds: {
 *     top: number,
 *     right: number,
 *     bottom: number,
 *     left: number,
 *   },
 *   spriteHalfSize: number,
 *   wave: number,
 * }} Arena
 *
 * @typedef {{
 *   state: keyof typeof playerStates,
 *   position: Point,
 * }} Player
 *
 * @typedef {{
 *   type: keyof typeof enemyBehaviors,
 *   positions: Point[],
 *   letter: string,
 *   dangerZone: number,
 * }} Enemy
 *
 * @typedef {{
 *   type: keyof typeof effectHandlers
 *   from: Point,
 *   to: Point,
 *   frames: number[],
 * }} Effect
 */

// <TILES>
// 001:5555555055555550555555505555555055555550555555505555555000000000
// 002:1111110012222100123321001233210012222100111111000000000000000000
// 003:1111111112222221123333211233332112222221111111110000000000000000
// 016:0000000000000000000000000000000000000000000001110000012200000123
// 017:0000000000000000000000000000000000000000111111112222222233333333
// 018:0000000000000000000000000000000000000000111000002210000032100000
// 032:0000012300000123000001230000012300000123000001230000012300000123
// 033:2111111211111111111111111111111111111111111111111111111121111112
// 034:3210000032100000321000003210000032100000321000003210000032100000
// 048:0000012300000122000001110000000000000000000000000000000000000000
// 049:3333333322222222111111110000000000000000000000000000000000000000
// 050:3210000022100000111000000000000000000000000000000000000000000000
// 064:8800088080000080008880000088800000888000800000808800088000000000
// 065:8800088080000080000000000008000000000000800000808800088000000000
// 066:0000000008808800080008000008000008000800088088000000000000000000
// 080:aaaaaaa0aaaaaaa0aa000aa0aa000aa0aa000aa0aaaaaaa0aaaaaaa000000000
// 081:aaaaaaa0a00a00a0a00a00a0aaaaaaa0a00a00a0a00a00a0aaaaaaa000000000
// 082:00a0a00000000000a0aaa0a000aaa000a0aaa0a00000000000a0a00000000000
// 083:aa000aa0aaaaaaa00aaaaa000aaaaa000aaaaa00aaaaaaa0aa000aa000000000
// </TILES>

// <MAP>
// 000:011111111111111111111111111111111111111111111111111111111121000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 001:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 002:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 003:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 004:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 005:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 006:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 007:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 008:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 009:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 010:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 011:021212121212121212121212121212121212121212121212121212121222000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 012:031313131313131313131313131313131313131313131313131313131323000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </MAP>

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:0123456789abcdef0123456789abcdef
// </WAVES>

// <SFX>
// 000:000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000304000000000
// </SFX>

// <TRACKS>
// 000:100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// </TRACKS>

// <PALETTE>
// 000:000000002b36073642586e75657b8383949693a1a1ffffffb58900cb4b16dc322fd336826c71c4268bd22aa198859900
// </PALETTE>
