/**
 * Pre-built code templates for Level 3: Vibe Coding.
 * Each template provides starter HTML, CSS, and JS that children
 * can customise with AI assistance.
 *
 * @module code-templates
 */

import type { CodeTemplate } from './index';

/** All available code templates */
export const CODE_TEMPLATES: CodeTemplate[] = [
  // ── Bouncing Ball (Game) ────────────────────────────────────────────────────
  {
    id: 'bouncing-ball',
    name: 'Bouncing Ball Game',
    description: 'A colourful ball that bounces around the screen. Use arrow keys to control it!',
    category: 'game',
    starterHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bouncing Ball</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="gameCanvas" width="480" height="360"></canvas>
  <p id="score">Score: 0</p>
  <script src="script.js"></script>
</body>
</html>`,
    starterCss: `body {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1a1a2e;
  font-family: sans-serif;
}

canvas {
  border: 3px solid #e94560;
  border-radius: 8px;
  background: #16213e;
}

#score {
  color: #e94560;
  font-size: 1.25rem;
  margin-top: 0.5rem;
}`,
    starterJs: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let x = canvas.width / 2;
let y = canvas.height / 2;
let dx = 3;
let dy = 3;
const radius = 16;
let score = 0;

const keys = {};

document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

function update() {
  // Keyboard control
  if (keys['ArrowLeft']) dx -= 0.5;
  if (keys['ArrowRight']) dx += 0.5;
  if (keys['ArrowUp']) dy -= 0.5;
  if (keys['ArrowDown']) dy += 0.5;

  x += dx;
  y += dy;

  // Bounce off walls
  if (x + radius > canvas.width || x - radius < 0) {
    dx = -dx;
    score++;
  }
  if (y + radius > canvas.height || y - radius < 0) {
    dy = -dy;
    score++;
  }

  document.getElementById('score').textContent = 'Score: ' + score;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ball with gradient
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#e94560');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();`,
    samplePrompt: 'Make the ball change colour every time it bounces off a wall.',
  },

  // ── Color Picker (App) ──────────────────────────────────────────────────────
  {
    id: 'color-picker',
    name: 'Color Picker App',
    description: 'Pick any colour and see its hex code, RGB values, and a preview swatch.',
    category: 'app',
    starterHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Color Picker</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <h1>Colour Picker</h1>
    <input type="color" id="picker" value="#6c5ce7" />
    <div id="swatch"></div>
    <div class="info">
      <p>Hex: <span id="hex">#6c5ce7</span></p>
      <p>RGB: <span id="rgb">rgb(108, 92, 231)</span></p>
    </div>
    <button id="copyBtn">Copy Hex</button>
    <p id="copied" class="hidden">Copied!</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    starterCss: `body {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #dfe6e9;
  font-family: sans-serif;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  width: 280px;
}

h1 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
  color: #2d3436;
}

input[type="color"] {
  width: 80px;
  height: 80px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
}

#swatch {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  margin: 1rem 0;
  background: #6c5ce7;
  transition: background 0.2s;
}

.info {
  text-align: left;
  font-size: 0.95rem;
  color: #636e72;
}

.info span {
  font-weight: 600;
  color: #2d3436;
}

button {
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: #6c5ce7;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #5a4bd1;
}

.hidden {
  display: none;
}

#copied {
  color: #00b894;
  font-weight: 600;
  margin-top: 0.5rem;
}`,
    starterJs: `const picker = document.getElementById('picker');
const swatch = document.getElementById('swatch');
const hexText = document.getElementById('hex');
const rgbText = document.getElementById('rgb');
const copyBtn = document.getElementById('copyBtn');
const copiedMsg = document.getElementById('copied');

/**
 * Convert a hex colour string to an RGB string.
 * @param {string} hex - e.g. "#6c5ce7"
 * @returns {string} e.g. "rgb(108, 92, 231)"
 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function updateColour(hex) {
  swatch.style.background = hex;
  hexText.textContent = hex;
  rgbText.textContent = hexToRgb(hex);
  copyBtn.style.background = hex;
}

picker.addEventListener('input', (e) => {
  updateColour(e.target.value);
  copiedMsg.classList.add('hidden');
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(picker.value).then(() => {
    copiedMsg.classList.remove('hidden');
    setTimeout(() => copiedMsg.classList.add('hidden'), 1500);
  });
});

// Initialise
updateColour(picker.value);`,
    samplePrompt: 'Add a list that saves my five favourite colours so I can click them to pick again.',
  },

  // ── Emoji Rain (Animation) ──────────────────────────────────────────────────
  {
    id: 'emoji-rain',
    name: 'Emoji Rain',
    description: 'Watch emojis fall from the sky like rain! Click to add more.',
    category: 'animation',
    starterHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Emoji Rain</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="sky"></div>
  <p id="hint">Click anywhere to add more emojis!</p>
  <script src="script.js"></script>
</body>
</html>`,
    starterCss: `body {
  margin: 0;
  overflow: hidden;
  background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  font-family: sans-serif;
}

#sky {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.emoji {
  position: absolute;
  top: -50px;
  animation: fall linear forwards;
  pointer-events: none;
  user-select: none;
}

@keyframes fall {
  to {
    top: 110vh;
    transform: rotate(360deg);
  }
}

#hint {
  position: fixed;
  bottom: 1.5rem;
  width: 100%;
  text-align: center;
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem;
  pointer-events: none;
}`,
    starterJs: `const sky = document.getElementById('sky');

const EMOJIS = ['🌟', '🎉', '🚀', '💎', '🔥', '🌈', '⭐', '🎈', '🍕', '🎸'];

/**
 * Create a single falling emoji element.
 * @param {number} x - Horizontal position in pixels
 */
function createEmoji(x) {
  const el = document.createElement('span');
  el.className = 'emoji';
  el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const size = 20 + Math.random() * 30;
  const duration = 3 + Math.random() * 4;
  const left = x !== undefined ? x : Math.random() * window.innerWidth;

  el.style.left = left + 'px';
  el.style.fontSize = size + 'px';
  el.style.animationDuration = duration + 's';

  sky.appendChild(el);

  // Remove after animation completes
  setTimeout(() => el.remove(), duration * 1000);
}

// Auto-rain: spawn emojis every 300ms
setInterval(() => createEmoji(), 300);

// Click to spawn a burst
document.addEventListener('click', (e) => {
  for (let i = 0; i < 8; i++) {
    const offset = (Math.random() - 0.5) * 100;
    createEmoji(e.clientX + offset);
  }
});`,
    samplePrompt: 'Add a button that lets me choose which emoji falls from the sky.',
  },
];

/**
 * Find a code template by its ID.
 * @param id - Template identifier (e.g. 'bouncing-ball')
 * @returns The matching CodeTemplate, or undefined
 */
export function findCodeTemplateById(id: string): CodeTemplate | undefined {
  return CODE_TEMPLATES.find((t) => t.id === id);
}
