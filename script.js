// =======================================
// ARCADE HUB+ PLATFORM STATE & HELPERS
// =======================================

const STORAGE_KEY = "arcadeHubPlusState";

const GAME_IDS = ["tic-tac-toe", "snake", "flappy", "airhockey", "tetris", "submarine"];
const GAME_SCREENS = {
  "tic-tac-toe": "tic-tac-toe-screen",
  snake: "snake-screen",
  flappy: "flappy-screen",
  airhockey: "airhockey-screen",
  tetris: "tetris-screen",
  submarine: "submarine-screen",
};
const GAME_LABELS = {
  "tic-tac-toe": "Tic Tac Toe",
  snake: "Snake",
  flappy: "Flappy Bird",
  airhockey: "Air Hockey",
  tetris: "Tetris",
  submarine: "Submarine Battle",
};

let platformState = {
  playerName: "CHIEF",
  soundEnabled: true,
  theme: "dark",
  lastGameId: null,
  totalPlayTimeMs: 0,
  gamePlays: {
    "tic-tac-toe": 0,
    snake: 0,
    flappy: 0,
    airhockey: 0,
    tetris: 0,
    submarine: 0,
  },
  highscores: {
    "tic-tac-toe": 0,
    snake: 0,
    flappy: 0,
    airhockey: 0,
    tetris: 0,
    submarine: 0,
  },
  achievements: {
    firstGame: false,
    snake100: false,
    flappy10: false,
    submarine200: false,
  },
};

// Active game session tracking
let activeGameId = null;
let activeGameStartTs = null;

// ---- Storage helpers ----
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    platformState = {
      ...platformState,
      ...parsed,
      gamePlays: { ...platformState.gamePlays, ...(parsed.gamePlays || {}) },
      highscores: { ...platformState.highscores, ...(parsed.highscores || {}) },
      achievements: { ...platformState.achievements, ...(parsed.achievements || {}) },
    };
  } catch (e) {
    console.warn("Gagal load state:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platformState));
  } catch (e) {
    console.warn("Gagal save state:", e);
  }
}

// ---- Audio System (SFX) ----
let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

function playBeep({ freq = 440, duration = 120, type = "sine", volume = 0.2 } = {}) {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  osc.stop(now + duration / 1000);
}

// UI/Game-specific SFX
function sfxMenuClick() {
  playBeep({ freq: 650, duration: 80, type: "square", volume: 0.15 });
}
function sfxTicMove() {
  playBeep({ freq: 550, duration: 70, type: "triangle", volume: 0.15 });
}
function sfxTicWin() {
  playBeep({ freq: 800, duration: 160, type: "square", volume: 0.2 });
}
function sfxSnakeEat() {
  playBeep({ freq: 700, duration: 90, type: "square", volume: 0.2 });
}
function sfxSnakeDie() {
  playBeep({ freq: 200, duration: 200, type: "sawtooth", volume: 0.25 });
}
function sfxFlap() {
  playBeep({ freq: 900, duration: 50, type: "square", volume: 0.15 });
}
function sfxFlappyScore() {
  playBeep({ freq: 1000, duration: 90, type: "triangle", volume: 0.2 });
}
function sfxFlappyDie() {
  playBeep({ freq: 180, duration: 250, type: "sawtooth", volume: 0.25 });
}
function sfxHockeyHit() {
  playBeep({ freq: 500, duration: 60, type: "square", volume: 0.18 });
}
function sfxHockeyGoal() {
  playBeep({ freq: 750, duration: 120, type: "triangle", volume: 0.22 });
}
function sfxTetrisMove() {
  playBeep({ freq: 600, duration: 50, type: "square", volume: 0.15 });
}
function sfxTetrisRotate() {
  playBeep({ freq: 750, duration: 70, type: "triangle", volume: 0.16 });
}
function sfxTetrisLine() {
  playBeep({ freq: 900, duration: 120, type: "square", volume: 0.2 });
}
function sfxTetrisGameOver() {
  playBeep({ freq: 200, duration: 220, type: "sawtooth", volume: 0.25 });
}
function sfxSubShoot() {
  playBeep({ freq: 700, duration: 70, type: "square", volume: 0.2 });
}
function sfxSubHit() {
  playBeep({ freq: 950, duration: 100, type: "triangle", volume: 0.22 });
}
function sfxSubGameOver() {
  playBeep({ freq: 180, duration: 220, type: "sawtooth", volume: 0.25 });
}
function sfxSubPower() {
  playBeep({ freq: 520, duration: 140, type: "triangle", volume: 0.22 });
}

// ---- Platform stats helpers ----
function endActiveGameSession() {
  if (!activeGameId || activeGameStartTs == null) return;
  const now = performance.now();
  const dt = now - activeGameStartTs;
  platformState.totalPlayTimeMs += dt;
  activeGameId = null;
  activeGameStartTs = null;
  updateGlobalStats();
  saveState();
}

function handleGameStart(gameId) {
  endActiveGameSession();
  activeGameId = gameId;
  activeGameStartTs = performance.now();

  if (!platformState.gamePlays[gameId]) platformState.gamePlays[gameId] = 0;
  platformState.gamePlays[gameId] += 1;
  platformState.lastGameId = gameId;

  if (!platformState.achievements.firstGame) {
    platformState.achievements.firstGame = true;
  }

  updateAchievementsUI();
  updateGlobalStats();
  saveState();
}

function handleGameEnd(gameId, score) {
  endActiveGameSession();
  if (typeof score === "number") {
    const prev = platformState.highscores[gameId] || 0;
    if (score > prev) {
      platformState.highscores[gameId] = score;
    }
  }

  if (gameId === "snake" && score >= 100) {
    platformState.achievements.snake100 = true;
  }
  if (gameId === "flappy" && score >= 10) {
    platformState.achievements.flappy10 = true;
  }
  if (gameId === "submarine" && score >= 200) {
    platformState.achievements.submarine200 = true;
  }

  updateAllHighscoreDisplays();
  updateAchievementsUI();
  updateGlobalStats();
  saveState();
}

function updateAllHighscoreDisplays() {
  document.querySelectorAll("[data-highscore]").forEach((el) => {
    const key = el.getAttribute("data-highscore");
    const val = platformState.highscores[key] || 0;
    el.textContent = val;
  });
}

function updateAchievementsUI() {
  const map = {
    firstGame: "first-game",
    snake100: "snake-100",
    flappy10: "flappy-10",
    submarine200: "submarine-200",
  };

  Object.entries(map).forEach(([stateKey, domId]) => {
    const statusEl = document.querySelector(
      `[data-achievement-status="${domId}"]`
    );
    if (!statusEl) return;
    if (platformState.achievements[stateKey]) {
      statusEl.textContent = "Unlocked";
      statusEl.classList.add("unlocked");
    } else {
      statusEl.textContent = "Locked";
      statusEl.classList.remove("unlocked");
    }
  });
}

function updateGlobalStats() {
  const totalPlayed =
    Object.values(platformState.gamePlays || {}).reduce((a, b) => a + b, 0) || 0;
  const totalMinutes = Math.round(platformState.totalPlayTimeMs / 60000);

  const favEl = document.getElementById("stat-favorite-game");
  let favGame = "-";
  let bestPlay = 0;
  for (const gameId of GAME_IDS) {
    const plays = platformState.gamePlays[gameId] || 0;
    if (plays > bestPlay) {
      bestPlay = plays;
      favGame = GAME_LABELS[gameId];
    }
  }

  const totalPlayedEl = document.getElementById("stat-total-played");
  const totalTimeEl = document.getElementById("stat-total-time");
  if (totalPlayedEl) totalPlayedEl.textContent = totalPlayed;
  if (totalTimeEl) totalTimeEl.textContent = totalMinutes > 0 ? `${totalMinutes} m` : "0 m";
  if (favEl) favEl.textContent = favGame;
}

function setPlayerNameUI(name) {
  const disp = document.getElementById("player-name-display");
  const avatar = document.getElementById("player-avatar");
  if (disp) disp.textContent = name;
  if (avatar) {
    const initials = name
      .split(" ")
      .filter((p) => p.length > 0)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
    avatar.innerHTML = `<span>${initials || "PL"}</span>`;
  }
}

function applyTheme(theme) {
  document.body.classList.remove("theme-neon");
  if (theme === "neon") {
    document.body.classList.add("theme-neon");
  }
  document.querySelectorAll(".theme-chip").forEach((chip) => {
    const t = chip.getAttribute("data-theme");
    chip.classList.toggle("active", t === theme);
  });
}

// =======================================
// GAME STATE DECLARATIONS (GLOBAL VARS)
// =======================================

// Snake
let snakeCanvas,
  snakeCtx,
  snakeInterval = null,
  snake,
  snakeDir,
  snakeFood,
  snakeScore = 0;
const SNAKE_TILE = 20;
const SNAKE_SPEED_MS = 120;

// Flappy
let flappyCanvas,
  flappyCtx,
  flappyBird,
  flappyPipes,
  flappyScore,
  flappyLoopId = null,
  flappyRunning = false,
  flappyPipeTimer = 0;
const GRAVITY = 0.5;
const FLAP_FORCE = -8;
const PIPE_GAP = 130;
const PIPE_WIDTH = 60;
const PIPE_INTERVAL = 1600;

// Air Hockey
let airCanvas,
  airCtx,
  airLoopId = null;
let puck,
  playerPaddle,
  aiPaddle,
  airPlayerScore = 0,
  airAiScore = 0;

// Tetris
let tetrisCanvas,
  tetrisCtx,
  tetrisNextCanvas,
  tetrisNextCtx,
  tetrisGrid,
  tetrisCols = 10,
  tetrisRows = 20,
  tetrisTile = 20,
  tetrisPiece = null,
  tetrisNextType = null,
  tetrisScore = 0,
  tetrisDropInterval = 500,
  tetrisDropTimer = null,
  tetrisRunning = false;
const TETRIS_COLORS = [
  "#000000",
  "#f97373",
  "#38bdf8",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#06b6d4",
];
const TETRIS_SHAPES = [
  [],
  [[1, 1, 1, 1]],
  [
    [2, 0, 0],
    [2, 2, 2],
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
  ],
  [
    [4, 4],
    [4, 4],
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
  ],
  [
    [0, 6, 0],
    [6, 6, 6],
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
  ],
];

// Submarine
let subCanvas,
  subCtx,
  subRunning = false,
  submarine,
  torpedoes = [],
  enemies = [],
  powerUps = [],
  subScore = 0,
  subLoopId = null,
  subKeys = {},
  lastShotTime = 0,
  lastEnemySpawn = 0,
  lastPowerSpawn = 0;

// Tic Tac Toe
let tttBoard = [];
let tttCurrentPlayer = "X";
let tttGameOver = false;

// =======================================
// STOP SEMUA GAME (saat pindah screen/menu)
// =======================================
function stopAllGames() {
  endActiveGameSession();

  if (snakeInterval) {
    clearInterval(snakeInterval);
    snakeInterval = null;
  }

  flappyRunning = false;
  if (flappyLoopId) {
    cancelAnimationFrame(flappyLoopId);
    flappyLoopId = null;
  }

  if (airLoopId) {
    cancelAnimationFrame(airLoopId);
    airLoopId = null;
  }

  tetrisRunning = false;
  if (tetrisDropTimer) {
    clearInterval(tetrisDropTimer);
    tetrisDropTimer = null;
  }

  subRunning = false;
  if (subLoopId) {
    cancelAnimationFrame(subLoopId);
    subLoopId = null;
  }
}

// =======================================
// DOMContentLoaded MAIN INIT
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  soundEnabled = platformState.soundEnabled;

  setPlayerNameUI(platformState.playerName);
  applyTheme(platformState.theme);
  updateAllHighscoreDisplays();
  updateAchievementsUI();
  updateGlobalStats();

  const screens = document.querySelectorAll(".screen");

  function showScreen(id) {
    screens.forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  }

  function navigateToGameScreen(gameId) {
    const screenId = GAME_SCREENS[gameId];
    if (!screenId) return;
    sfxMenuClick();
    stopAllGames();
    platformState.lastGameId = gameId;
    saveState();
    showScreen(screenId);
  }

  // Klik kartu game di menu
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const targetId = card.getAttribute("data-target");
      const gameId = card.getAttribute("data-game-id");
      if (!targetId) return;
      sfxMenuClick();
      stopAllGames();
      if (gameId) {
        platformState.lastGameId = gameId;
        saveState();
      }
      showScreen(targetId);
      if (targetId === "tic-tac-toe-screen") initTicTacToe();
    });
  });

  // Tombol back ke menu
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfxMenuClick();
      stopAllGames();
      showScreen("menu-screen");
    });
  });

  // Quick actions
  const btnContinueLast = document.getElementById("btn-continue-last");
  if (btnContinueLast) {
    btnContinueLast.addEventListener("click", () => {
      const last = platformState.lastGameId;
      if (last && GAME_SCREENS[last]) {
        navigateToGameScreen(last);
      } else {
        navigateToGameScreen("snake");
      }
    });
  }

  const btnRandomGame = document.getElementById("btn-random-game");
  if (btnRandomGame) {
    btnRandomGame.addEventListener("click", () => {
      const pick = GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)];
      navigateToGameScreen(pick);
    });
  }

  // MODALS
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
  }

  function closeAllModals() {
    document.querySelectorAll(".modal").forEach((m) =>
      m.setAttribute("aria-hidden", "true")
    );
  }

  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings) {
    btnSettings.addEventListener("click", () => {
      sfxMenuClick();
      openModal("modal-settings");
    });
  }

  const btnHowTo = document.getElementById("btn-how-to");
  if (btnHowTo) {
    btnHowTo.addEventListener("click", () => {
      sfxMenuClick();
      openModal("modal-howto");
    });
  }

  // Edit nama player
  const editNameBtn = document.getElementById("edit-name-button");
  const nameInput = document.getElementById("player-name-input");
  const nameSaveBtn = document.getElementById("player-name-save");

  if (editNameBtn && nameInput && nameSaveBtn) {
    editNameBtn.addEventListener("click", () => {
      sfxMenuClick();
      openModal("modal-name");
      nameInput.value = platformState.playerName || "";
      nameInput.focus();
    });

    nameSaveBtn.addEventListener("click", () => {
      let val = nameInput.value.trim();
      if (!val) val = "Player";
      platformState.playerName = val;
      setPlayerNameUI(val);
      saveState();
      closeAllModals();
    });
  }

  // Close modal via tombol
  document.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", () => {
      closeAllModals();
    });
  });

  // Close modal via backdrop
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      closeAllModals();
    });
  });

  // Settings: sound toggle
  const soundToggle = document.getElementById("setting-sound-toggle");
  if (soundToggle) {
    soundToggle.setAttribute(
      "data-sound-state",
      platformState.soundEnabled ? "on" : "off"
    );
    soundEnabled = platformState.soundEnabled;

    soundToggle.addEventListener("click", () => {
      const current = soundToggle.getAttribute("data-sound-state");
      const next = current === "on" ? "off" : "on";
      soundToggle.setAttribute("data-sound-state", next);
      platformState.soundEnabled = next === "on";
      soundEnabled = platformState.soundEnabled;
      saveState();
      if (soundEnabled) sfxMenuClick();
    });
  }

  // Settings: theme chips
  document.querySelectorAll(".theme-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const theme = chip.getAttribute("data-theme") || "dark";
      platformState.theme = theme;
      applyTheme(theme);
      saveState();
      sfxMenuClick();
    });
  });

  // INIT semua game
  initTicTacToe();
  initSnake();
  initFlappy();
  initAirHockey();
  initTetris();
  initSubmarine();

  showScreen("menu-screen");

  // Opsional: ketika berpindah tab / close, simpan waktu main
  window.addEventListener("beforeunload", () => {
    endActiveGameSession();
  });
});

// =======================================
// TIC TAC TOE
// =======================================

function initTicTacToe() {
  const boardEl = document.getElementById("ttt-board");
  const statusEl = document.getElementById("ttt-status");
  const restartBtn = document.getElementById("ttt-restart");
  if (!boardEl || !statusEl || !restartBtn) return;

  if (!boardEl.hasChildNodes()) {
    tttBoard = Array(9).fill("");
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("button");
      cell.className = "ttt-cell";
      cell.dataset.index = i;
      cell.addEventListener("click", handleTicTacToeClick);
      boardEl.appendChild(cell);
    }
  }

  restartBtn.onclick = resetTicTacToe;
  resetTicTacToe();
}

function resetTicTacToe() {
  tttBoard = Array(9).fill("");
  tttCurrentPlayer = "X";
  tttGameOver = false;
  document.querySelectorAll(".ttt-cell").forEach((cell) => {
    cell.textContent = "";
  });
  const statusEl = document.getElementById("ttt-status");
  if (statusEl) statusEl.textContent = "Giliran: X";
}

function handleTicTacToeClick(e) {
  const index = parseInt(e.currentTarget.dataset.index, 10);
  if (tttGameOver || tttBoard[index] !== "") return;

  tttBoard[index] = tttCurrentPlayer;
  e.currentTarget.textContent = tttCurrentPlayer;
  sfxTicMove();

  if (checkTicTacToeWin(tttCurrentPlayer)) {
    const statusEl = document.getElementById("ttt-status");
    if (statusEl) statusEl.textContent = `Pemenang: ${tttCurrentPlayer}!`;
    tttGameOver = true;
    sfxTicWin();
    return;
  }

  if (tttBoard.every((c) => c !== "")) {
    const statusEl = document.getElementById("ttt-status");
    if (statusEl) statusEl.textContent = "Seri!";
    tttGameOver = true;
    return;
  }

  tttCurrentPlayer = tttCurrentPlayer === "X" ? "O" : "X";
  const statusEl = document.getElementById("ttt-status");
  if (statusEl) statusEl.textContent = `Giliran: ${tttCurrentPlayer}`;
}

function checkTicTacToeWin(player) {
  const b = tttBoard;
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return lines.some((line) => line.every((i) => b[i] === player));
}

// =======================================
// SNAKE
// =======================================

function initSnake() {
  snakeCanvas = document.getElementById("snake-canvas");
  if (!snakeCanvas) return;
  snakeCtx = snakeCanvas.getContext("2d");

  const startBtn = document.getElementById("snake-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      handleGameStart("snake");
      startSnakeGame();
    });
  }

  document.addEventListener("keydown", handleSnakeKey);
  resetSnake();
  drawSnake();
}

function resetSnake() {
  if (!snakeCanvas) return;
  const cols = Math.floor(snakeCanvas.width / SNAKE_TILE);
  const rows = Math.floor(snakeCanvas.height / SNAKE_TILE);
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);

  snake = [{ x: startX, y: startY }];
  snakeDir = { x: 1, y: 0 };
  snakeScore = 0;
  updateSnakeScore();
  spawnSnakeFood();
}

function startSnakeGame() {
  resetSnake();
  if (snakeInterval) clearInterval(snakeInterval);
  snakeInterval = setInterval(updateSnake, SNAKE_SPEED_MS);
}

function handleSnakeKey(e) {
  if (!snake) return;
  const key = e.key.toLowerCase();
  if ((key === "arrowup" || key === "w") && snakeDir.y !== 1) {
    snakeDir = { x: 0, y: -1 };
  } else if ((key === "arrowdown" || key === "s") && snakeDir.y !== -1) {
    snakeDir = { x: 0, y: 1 };
  } else if ((key === "arrowleft" || key === "a") && snakeDir.x !== 1) {
    snakeDir = { x: -1, y: 0 };
  } else if ((key === "arrowright" || key === "d") && snakeDir.x !== -1) {
    snakeDir = { x: 1, y: 0 };
  }
}

function spawnSnakeFood() {
  const cols = Math.floor(snakeCanvas.width / SNAKE_TILE);
  const rows = Math.floor(snakeCanvas.height / SNAKE_TILE);
  let x, y;
  do {
    x = Math.floor(Math.random() * cols);
    y = Math.floor(Math.random() * rows);
  } while (snake.some((seg) => seg.x === x && seg.y === y));
  snakeFood = { x, y };
}

function updateSnake() {
  const cols = Math.floor(snakeCanvas.width / SNAKE_TILE);
  const rows = Math.floor(snakeCanvas.height / SNAKE_TILE);

  const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    endSnakeGame();
    return;
  }

  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    endSnakeGame();
    return;
  }

  snake.unshift(head);

  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore += 10;
    updateSnakeScore();
    spawnSnakeFood();
    sfxSnakeEat();
  } else {
    snake.pop();
  }

  drawSnake();
}

function drawSnake() {
  if (!snakeCtx) return;
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  snakeCtx.fillStyle = "#38bdf8";
  snake.forEach((seg, i) => {
    snakeCtx.globalAlpha = 0.7 + (snake.length - i) / (snake.length * 4);
    snakeCtx.fillRect(
      seg.x * SNAKE_TILE,
      seg.y * SNAKE_TILE,
      SNAKE_TILE - 2,
      SNAKE_TILE - 2
    );
  });
  snakeCtx.globalAlpha = 1;

  if (snakeFood) {
    snakeCtx.fillStyle = "#f97373";
    snakeCtx.beginPath();
    snakeCtx.arc(
      snakeFood.x * SNAKE_TILE + SNAKE_TILE / 2,
      snakeFood.y * SNAKE_TILE + SNAKE_TILE / 2,
      SNAKE_TILE / 2.5,
      0,
      Math.PI * 2
    );
    snakeCtx.fill();
  }
}

function endSnakeGame() {
  if (snakeInterval) clearInterval(snakeInterval);
  snakeInterval = null;
  sfxSnakeDie();
  handleGameEnd("snake", snakeScore);
  alert("Game over! Skor kamu: " + snakeScore);
}

function updateSnakeScore() {
  const scoreEl = document.getElementById("snake-score");
  if (scoreEl) scoreEl.textContent = snakeScore;
}

// =======================================
// FLAPPY BIRD
// =======================================

function initFlappy() {
  flappyCanvas = document.getElementById("flappy-canvas");
  if (!flappyCanvas) return;
  flappyCtx = flappyCanvas.getContext("2d");

  const startBtn = document.getElementById("flappy-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      handleGameStart("flappy");
      startFlappy();
    });
  }

  flappyCanvas.addEventListener("mousedown", () => {
    if (!flappyRunning) return;
    flap();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (flappyRunning) {
        flap();
      }
    }
  });

  resetFlappy();
  renderFlappy();
}

function resetFlappy() {
  if (!flappyCanvas) return;
  flappyBird = {
    x: 80,
    y: flappyCanvas.height / 2,
    vy: 0,
    r: 14,
  };
  flappyPipes = [];
  flappyScore = 0;
  flappyPipeTimer = 0;
  updateFlappyScore();
}

function startFlappy() {
  resetFlappy();
  flappyRunning = true;

  if (flappyLoopId) cancelAnimationFrame(flappyLoopId);

  let lastTime = performance.now();
  const loop = (time) => {
    if (!flappyRunning) return;
    const delta = time - lastTime;
    lastTime = time;
    updateFlappy(delta);
    renderFlappy();
    flappyLoopId = requestAnimationFrame(loop);
  };

  flappyLoopId = requestAnimationFrame(loop);
}

function flap() {
  if (!flappyBird) return;
  flappyBird.vy = FLAP_FORCE;
  sfxFlap();
}

function updateFlappy(delta) {
  flappyBird.vy += GRAVITY;
  flappyBird.y += flappyBird.vy;

  flappyPipeTimer += delta;
  if (flappyPipeTimer >= PIPE_INTERVAL) {
    const gapY =
      60 + Math.random() * (flappyCanvas.height - PIPE_GAP - 120);
    flappyPipes.push({
      x: flappyCanvas.width,
      gapY,
      passed: false,
    });
    flappyPipeTimer = 0;
  }

  const speed = 2.5;
  flappyPipes.forEach((pipe) => {
    pipe.x -= speed;
  });

  flappyPipes = flappyPipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

  for (const pipe of flappyPipes) {
    if (!pipe.passed && flappyBird.x > pipe.x + PIPE_WIDTH) {
      pipe.passed = true;
      flappyScore += 1;
      updateFlappyScore();
      sfxFlappyScore();
    }

    if (
      flappyBird.x + flappyBird.r > pipe.x &&
      flappyBird.x - flappyBird.r < pipe.x + PIPE_WIDTH
    ) {
      if (
        flappyBird.y - flappyBird.r < pipe.gapY ||
        flappyBird.y + flappyBird.r > pipe.gapY + PIPE_GAP
      ) {
        endFlappy();
        return;
      }
    }
  }

  if (
    flappyBird.y + flappyBird.r > flappyCanvas.height ||
    flappyBird.y - flappyBird.r < 0
  ) {
    endFlappy();
  }
}

function renderFlappy() {
  if (!flappyCtx) return;
  flappyCtx.clearRect(0, 0, flappyCanvas.width, flappyCanvas.height);

  flappyCtx.fillStyle = "#020617";
  flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

  flappyCtx.fillStyle = "#22c55e";
  flappyPipes.forEach((pipe) => {
    flappyCtx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
    flappyCtx.fillRect(
      pipe.x,
      pipe.gapY + PIPE_GAP,
      PIPE_WIDTH,
      flappyCanvas.height - pipe.gapY - PIPE_GAP
    );
  });

  flappyCtx.fillStyle = "#facc15";
  flappyCtx.beginPath();
  flappyCtx.arc(flappyBird.x, flappyBird.y, flappyBird.r, 0, Math.PI * 2);
  flappyCtx.fill();
}

function endFlappy() {
  if (!flappyRunning) return;
  flappyRunning = false;
  if (flappyLoopId) {
    cancelAnimationFrame(flappyLoopId);
    flappyLoopId = null;
  }
  sfxFlappyDie();
  handleGameEnd("flappy", flappyScore);
  alert("Game over! Skor kamu: " + flappyScore);
}

function updateFlappyScore() {
  const el = document.getElementById("flappy-score");
  if (el) el.textContent = flappyScore;
}

// =======================================
// AIR HOCKEY
// =======================================

function initAirHockey() {
  airCanvas = document.getElementById("airhockey-canvas");
  if (!airCanvas) return;
  airCtx = airCanvas.getContext("2d");

  const startBtn = document.getElementById("airhockey-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      handleGameStart("airhockey");
      startAirHockey();
    });
  }

  airCanvas.addEventListener("mousemove", handleAirMouseMove);

  resetAirHockey();
  renderAirHockey();
}

function resetAirHockey() {
  const w = airCanvas.width;
  const h = airCanvas.height;

  puck = {
    x: w / 2,
    y: h / 2,
    vx: Math.random() > 0.5 ? 2 : -2,
    vy: 2,
    r: 10,
  };

  playerPaddle = {
    x: w / 2,
    y: h - 30,
    r: 20,
  };

  aiPaddle = {
    x: w / 2,
    y: 30,
    r: 20,
  };
}

function startAirHockey() {
  resetAirHockey();
  airPlayerScore = 0;
  airAiScore = 0;
  updateAirHockeyScore();

  if (airLoopId) cancelAnimationFrame(airLoopId);

  let lastTime = performance.now();
  function loop(time) {
    const delta = time - lastTime;
    lastTime = time;
    updateAirHockey(delta);
    renderAirHockey();
    airLoopId = requestAnimationFrame(loop);
  }

  airLoopId = requestAnimationFrame(loop);
}

function handleAirMouseMove(e) {
  if (!airCanvas || !playerPaddle) return;
  const rect = airCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  playerPaddle.x = Math.max(
    playerPaddle.r,
    Math.min(airCanvas.width - playerPaddle.r, x)
  );
}

function updateAirHockey() {
  const w = airCanvas.width;
  const h = airCanvas.height;

  puck.x += puck.vx;
  puck.y += puck.vy;

  if (puck.x - puck.r < 0 || puck.x + puck.r > w) {
    puck.vx *= -1;
  }

  const aiSpeed = 2.1;
  if (puck.x < aiPaddle.x - 5) {
    aiPaddle.x -= aiSpeed;
  } else if (puck.x > aiPaddle.x + 5) {
    aiPaddle.x += aiSpeed;
  }
  aiPaddle.x = Math.max(aiPaddle.r, Math.min(w - aiPaddle.r, aiPaddle.x));

  handlePaddleCollision(playerPaddle, true);
  handlePaddleCollision(aiPaddle, false);

  const goalLeft = w / 3;
  const goalRight = (2 * w) / 3;

  if (puck.y - puck.r <= 0) {
    if (puck.x > goalLeft && puck.x < goalRight) {
      airPlayerScore++;
      updateAirHockeyScore();
      sfxHockeyGoal();
      resetAirHockey();
      return;
    } else {
      puck.vy *= -1;
      puck.y = puck.r;
    }
  }

  if (puck.y + puck.r >= h) {
    if (puck.x > goalLeft && puck.x < goalRight) {
      airAiScore++;
      updateAirHockeyScore();
      sfxHockeyGoal();
      resetAirHockey();
      return;
    } else {
      puck.vy *= -1;
      puck.y = h - puck.r;
    }
  }
}

function handlePaddleCollision(paddle, isPlayer) {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = puck.r + paddle.r;

  if (dist < minDist) {
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);

    puck.x = paddle.x + nx * minDist;
    puck.y = paddle.y + ny * minDist;

    const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy) || 3;
    const dirY = isPlayer ? -1 : 1;
    puck.vx = nx * speed * 1.05;
    puck.vy = ny * speed * 1.05;
    puck.vy = Math.abs(puck.vy) * dirY;

    sfxHockeyHit();
  }
}

function renderAirHockey() {
  if (!airCtx) return;
  const w = airCanvas.width;
  const h = airCanvas.height;

  airCtx.clearRect(0, 0, w, h);
  airCtx.fillStyle = "#020617";
  airCtx.fillRect(0, 0, w, h);

  airCtx.strokeStyle = "rgba(148, 163, 184, 0.5)";
  airCtx.setLineDash([8, 8]);
  airCtx.beginPath();
  airCtx.moveTo(0, h / 2);
  airCtx.lineTo(w, h / 2);
  airCtx.stroke();
  airCtx.setLineDash([]);

  airCtx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  airCtx.lineWidth = 2;
  airCtx.strokeRect(w / 3, 2, w / 3, 10);
  airCtx.strokeRect(w / 3, h - 12, w / 3, 10);

  airCtx.fillStyle = "#e5e7eb";
  airCtx.beginPath();
  airCtx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
  airCtx.fill();

  airCtx.fillStyle = "#38bdf8";
  airCtx.beginPath();
  airCtx.arc(playerPaddle.x, playerPaddle.y, playerPaddle.r, 0, Math.PI * 2);
  airCtx.fill();

  airCtx.fillStyle = "#f97373";
  airCtx.beginPath();
  airCtx.arc(aiPaddle.x, aiPaddle.y, aiPaddle.r, 0, Math.PI * 2);
  airCtx.fill();
}

function updateAirHockeyScore() {
  const pEl = document.getElementById("airhockey-player-score");
  const aiEl = document.getElementById("airhockey-ai-score");
  if (pEl) pEl.textContent = airPlayerScore;
  if (aiEl) aiEl.textContent = airAiScore;
}

// =======================================
// TETRIS
// =======================================

function initTetris() {
  tetrisCanvas = document.getElementById("tetris-canvas");
  if (!tetrisCanvas) return;
  tetrisCtx = tetrisCanvas.getContext("2d");

  tetrisNextCanvas = document.getElementById("tetris-next");
  if (tetrisNextCanvas) {
    tetrisNextCtx = tetrisNextCanvas.getContext("2d");
  }

  const startBtn = document.getElementById("tetris-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      handleGameStart("tetris");
      startTetris();
    });
  }

  document.addEventListener("keydown", handleTetrisKey);
  resetTetris();
  drawTetris();
  drawNextTetris();
}

function resetTetris() {
  tetrisGrid = Array.from({ length: tetrisRows }, () =>
    Array(tetrisCols).fill(0)
  );
  tetrisScore = 0;
  updateTetrisScore();
  tetrisPiece = null;
  if (tetrisNextType === null) {
    tetrisNextType = randomTetrisType();
  }
  drawNextTetris();
}

function randomTetrisType() {
  return 1 + Math.floor(Math.random() * 7);
}

function startTetris() {
  resetTetris();
  tetrisRunning = true;
  spawnTetrisPiece();
  if (tetrisDropTimer) clearInterval(tetrisDropTimer);
  tetrisDropTimer = setInterval(tetrisStep, tetrisDropInterval);
}

function handleTetrisKey(e) {
  if (!tetrisRunning || !tetrisPiece) return;
  const key = e.key.toLowerCase();
  if (key === "arrowleft") {
    moveTetrisPiece(-1, 0);
  } else if (key === "arrowright") {
    moveTetrisPiece(1, 0);
  } else if (key === "arrowdown") {
    tetrisStep();
  } else if (key === "arrowup") {
    rotateTetrisPiece();
  }
}

function spawnTetrisPiece() {
  const type = tetrisNextType ?? randomTetrisType();
  const shape = TETRIS_SHAPES[type];
  tetrisPiece = {
    x: Math.floor(tetrisCols / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
    shape: shape.map((row) => [...row]),
    type,
  };
  if (collides(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y)) {
    endTetris();
    return;
  }
  tetrisNextType = randomTetrisType();
  drawNextTetris();
}

function collides(shape, offsetX, offsetY) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      const val = shape[y][x];
      if (val !== 0) {
        const nx = offsetX + x;
        const ny = offsetY + y;
        if (
          nx < 0 ||
          nx >= tetrisCols ||
          ny >= tetrisRows ||
          (ny >= 0 && tetrisGrid[ny][nx] !== 0)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function moveTetrisPiece(dx, dy) {
  const newX = tetrisPiece.x + dx;
  const newY = tetrisPiece.y + dy;
  if (!collides(tetrisPiece.shape, newX, newY)) {
    tetrisPiece.x = newX;
    tetrisPiece.y = newY;
    drawTetris();
    sfxTetrisMove();
  }
}

function rotateTetrisPiece() {
  const oldShape = tetrisPiece.shape;
  const rotated = oldShape[0].map((_, i) =>
    oldShape.map((row) => row[i]).reverse()
  );
  if (!collides(rotated, tetrisPiece.x, tetrisPiece.y)) {
    tetrisPiece.shape = rotated;
    drawTetris();
    sfxTetrisRotate();
  }
}

function tetrisStep() {
  if (!tetrisRunning || !tetrisPiece) return;
  const newY = tetrisPiece.y + 1;
  if (!collides(tetrisPiece.shape, tetrisPiece.x, newY)) {
    tetrisPiece.y = newY;
  } else {
    for (let y = 0; y < tetrisPiece.shape.length; y++) {
      for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
        const val = tetrisPiece.shape[y][x];
        if (val !== 0) {
          const gx = tetrisPiece.x + x;
          const gy = tetrisPiece.y + y;
          if (gy >= 0) tetrisGrid[gy][gx] = val;
        }
      }
    }
    clearTetrisLines();
    spawnTetrisPiece();
  }
  drawTetris();
}

function clearTetrisLines() {
  let lines = 0;
  for (let y = tetrisRows - 1; y >= 0; y--) {
    if (tetrisGrid[y].every((cell) => cell !== 0)) {
      tetrisGrid.splice(y, 1);
      tetrisGrid.unshift(Array(tetrisCols).fill(0));
      lines++;
      y++;
    }
  }
  if (lines > 0) {
    tetrisScore += lines * 100;
    updateTetrisScore();
    sfxTetrisLine();
  }
}

function drawTetris() {
  if (!tetrisCtx) return;
  const w = tetrisCanvas.width;
  const h = tetrisCanvas.height;

  tetrisCtx.clearRect(0, 0, w, h);
  tetrisCtx.fillStyle = "#020617";
  tetrisCtx.fillRect(0, 0, w, h);

  tetrisCtx.strokeStyle = "rgba(148,163,184,0.2)";
  tetrisCtx.lineWidth = 0.5;
  for (let x = 0; x <= tetrisCols; x++) {
    const px = x * tetrisTile;
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(px, 0);
    tetrisCtx.lineTo(px, tetrisRows * tetrisTile);
    tetrisCtx.stroke();
  }
  for (let y = 0; y <= tetrisRows; y++) {
    const py = y * tetrisTile;
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(0, py);
    tetrisCtx.lineTo(tetrisCols * tetrisTile, py);
    tetrisCtx.stroke();
  }

  for (let y = 0; y < tetrisRows; y++) {
    for (let x = 0; x < tetrisCols; x++) {
      const val = tetrisGrid[y][x];
      if (val !== 0) {
        tetrisCtx.fillStyle = TETRIS_COLORS[val];
        tetrisCtx.fillRect(
          x * tetrisTile + 1,
          y * tetrisTile + 1,
          tetrisTile - 2,
          tetrisTile - 2
        );
      }
    }
  }

  if (tetrisPiece) {
    for (let y = 0; y < tetrisPiece.shape.length; y++) {
      for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
        const val = tetrisPiece.shape[y][x];
        if (val !== 0) {
          const gx = tetrisPiece.x + x;
          const gy = tetrisPiece.y + y;
          if (gy >= 0) {
            tetrisCtx.fillStyle = TETRIS_COLORS[val];
            tetrisCtx.fillRect(
              gx * tetrisTile + 1,
              gy * tetrisTile + 1,
              tetrisTile - 2,
              tetrisTile - 2
            );
          }
        }
      }
    }
  }
}

function drawNextTetris() {
  if (!tetrisNextCtx) return;
  const w = tetrisNextCanvas.width;
  const h = tetrisNextCanvas.height;

  tetrisNextCtx.clearRect(0, 0, w, h);
  tetrisNextCtx.fillStyle = "#020617";
  tetrisNextCtx.fillRect(0, 0, w, h);

  if (!tetrisNextType) return;
  const shape = TETRIS_SHAPES[tetrisNextType];
  const color = TETRIS_COLORS[tetrisNextType];

  const rows = shape.length;
  const cols = shape[0].length;
  const tile = 16;
  const shapeW = cols * tile;
  const shapeH = rows * tile;
  const offsetX = (w - shapeW) / 2;
  const offsetY = (h - shapeH) / 2;

  tetrisNextCtx.fillStyle = color;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (shape[y][x] !== 0) {
        tetrisNextCtx.fillRect(
          offsetX + x * tile + 1,
          offsetY + y * tile + 1,
          tile - 2,
          tile - 2
        );
      }
    }
  }
}

function endTetris() {
  tetrisRunning = false;
  if (tetrisDropTimer) clearInterval(tetrisDropTimer);
  tetrisDropTimer = null;
  sfxTetrisGameOver();
  handleGameEnd("tetris", tetrisScore);
  alert("Game over! Skor Tetris kamu: " + tetrisScore);
}

function updateTetrisScore() {
  const el = document.getElementById("tetris-score");
  if (el) el.textContent = tetrisScore;
}

// =======================================
// SUBMARINE BATTLE
// =======================================

function initSubmarine() {
  subCanvas = document.getElementById("submarine-canvas");
  if (!subCanvas) return;
  subCtx = subCanvas.getContext("2d");

  const startBtn = document.getElementById("submarine-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      handleGameStart("submarine");
      startSubmarine();
    });
  }

  document.addEventListener("keydown", (e) => {
    subKeys[e.code] = true;
  });
  document.addEventListener("keyup", (e) => {
    subKeys[e.code] = false;
  });

  resetSubmarine();
  renderSubmarine();
}

function resetSubmarine() {
  const w = subCanvas.width;
  const h = subCanvas.height;

  submarine = {
    x: w / 2,
    y: h - 60,
    r: 18,
    baseSpeed: 2.4,
    speedMultiplier: 1,
    fireMode: "single",
    speedUntil: 0,
    doubleUntil: 0,
    spreadUntil: 0,
    hp: 3,
    invUntil: 0,
  };

  torpedoes = [];
  enemies = [];
  powerUps = [];
  subScore = 0;
  updateSubmarineScore();
  lastShotTime = 0;
  lastEnemySpawn = 0;
  lastPowerSpawn = 0;
}

function startSubmarine() {
  resetSubmarine();
  subRunning = true;

  if (subLoopId) cancelAnimationFrame(subLoopId);

  let lastTime = performance.now();
  const loop = (time) => {
    if (!subRunning) return;
    const delta = time - lastTime;
    lastTime = time;
    updateSubmarine(delta, time);
    renderSubmarine();
    subLoopId = requestAnimationFrame(loop);
  };

  subLoopId = requestAnimationFrame(loop);
}

function updateSubmarine(delta, timeNow) {
  const w = subCanvas.width;
  const h = subCanvas.height;

  submarine.speedMultiplier = timeNow < submarine.speedUntil ? 1.8 : 1;
  if (timeNow < submarine.spreadUntil) {
    submarine.fireMode = "spread";
  } else if (timeNow < submarine.doubleUntil) {
    submarine.fireMode = "double";
  } else {
    submarine.fireMode = "single";
  }

  let vx = 0;
  let vy = 0;
  if (subKeys["ArrowLeft"] || subKeys["KeyA"]) vx -= 1;
  if (subKeys["ArrowRight"] || subKeys["KeyD"]) vx += 1;
  if (subKeys["ArrowUp"] || subKeys["KeyW"]) vy -= 1;
  if (subKeys["ArrowDown"] || subKeys["KeyS"]) vy += 1;

  if (vx !== 0 || vy !== 0) {
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    vx /= len;
    vy /= len;
  }

  const speed = submarine.baseSpeed * submarine.speedMultiplier;
  submarine.x += vx * speed;
  submarine.y += vy * speed;

  const margin = 20;
  submarine.x = Math.max(margin, Math.min(w - margin, submarine.x));
  submarine.y = Math.max(margin, Math.min(h - margin, submarine.y));

  if (subKeys["Space"]) {
    shootTorpedo(timeNow);
  }

  torpedoes.forEach((t) => {
    t.x += t.vx;
    t.y += t.vy;
  });
  torpedoes = torpedoes.filter((t) => t.y > -30 && t.x > -30 && t.x < w + 30);

  spawnEnemy(timeNow);
  spawnPowerUp(timeNow);

  enemies.forEach((e) => {
    if (e.type === "elite") {
      e.y += e.vy;
      e.phase += (delta / 16) * 0.04;
      e.x = e.baseX + Math.sin(e.phase) * 40;
    } else {
      e.x += e.vx;
      e.y += e.vy;
    }
  });
  enemies = enemies.filter((e) => e.y < h + 40);

  powerUps.forEach((p) => {
    p.y += p.vy;
  });
  powerUps = powerUps.filter((p) => p.y < h + 30);

  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = torpedoes.length - 1; j >= 0; j--) {
      const dx = enemies[i].x - torpedoes[j].x;
      const dy = enemies[i].y - torpedoes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemies[i].r) {
        torpedoes.splice(j, 1);
        enemies[i].hp -= 1;
        if (enemies[i].hp <= 0) {
          subScore += enemies[i].score;
          updateSubmarineScore();
          enemies.splice(i, 1);
          sfxSubHit();
        }
        break;
      }
    }
  }

  for (const e of enemies) {
    const dx = e.x - submarine.x;
    const dy = e.y - submarine.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < e.r + submarine.r) {
      if (timeNow < submarine.invUntil) continue;
      submarine.hp -= 1;
      submarine.invUntil = timeNow + 1500;
      if (submarine.hp <= 0) {
        endSubmarine();
        return;
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    const dx = p.x - submarine.x;
    const dy = p.y - submarine.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < submarine.r + 12) {
      applyPowerUp(p.type, timeNow);
      powerUps.splice(i, 1);
      sfxSubPower();
    }
  }
}

function shootTorpedo(timeNow) {
  const cooldownBase = 230;
  const cooldown =
    submarine.speedMultiplier > 1 ? cooldownBase * 0.7 : cooldownBase;

  if (timeNow - lastShotTime < cooldown) return;
  lastShotTime = timeNow;

  const shots = [];
  const yStart = submarine.y - 18;

  if (submarine.fireMode === "single") {
    shots.push({ x: submarine.x, y: yStart, vx: 0, vy: -6 });
  } else if (submarine.fireMode === "double") {
    shots.push({ x: submarine.x - 8, y: yStart, vx: 0, vy: -6 });
    shots.push({ x: submarine.x + 8, y: yStart, vx: 0, vy: -6 });
  } else if (submarine.fireMode === "spread") {
    shots.push({ x: submarine.x, y: yStart, vx: 0, vy: -6 });
    shots.push({ x: submarine.x - 6, y: yStart, vx: -1.5, vy: -6 });
    shots.push({ x: submarine.x + 6, y: yStart, vx: 1.5, vy: -6 });
  }

  torpedoes.push(...shots);
  sfxSubShoot();
}

function spawnEnemy(timeNow) {
  const w = subCanvas.width;
  const baseInterval = 900;
  if (timeNow - lastEnemySpawn < baseInterval) return;
  lastEnemySpawn = timeNow;

  const eliteChance = 0.18;
  if (Math.random() < eliteChance) {
    const x = 40 + Math.random() * (w - 80);
    enemies.push({
      type: "elite",
      x,
      y: -30,
      baseX: x,
      phase: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 1.3,
      r: 22,
      hp: 3,
      score: 30,
    });
  } else {
    enemies.push({
      type: "normal",
      x: 40 + Math.random() * (w - 80),
      y: -20,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.6 + Math.random() * 1.2,
      r: 16,
      hp: 1,
      score: 10,
    });
  }
}

function spawnPowerUp(timeNow) {
  const w = subCanvas.width;
  const interval = 6000;
  if (timeNow - lastPowerSpawn < interval) return;
  lastPowerSpawn = timeNow;

  const types = ["speed", "double", "spread"];
  const type = types[Math.floor(Math.random() * types.length)];

  powerUps.push({
    x: 40 + Math.random() * (w - 80),
    y: -20,
    vy: 1.2,
    type,
  });
}

function applyPowerUp(type, timeNow) {
  const durSpeed = 8000;
  const durOther = 9000;
  if (type === "speed") {
    submarine.speedUntil = timeNow + durSpeed;
  } else if (type === "double") {
    submarine.doubleUntil = timeNow + durOther;
  } else if (type === "spread") {
    submarine.spreadUntil = timeNow + durOther;
  }
}

function renderSubmarine() {
  if (!subCtx) return;
  const w = subCanvas.width;
  const h = subCanvas.height;

  subCtx.clearRect(0, 0, w, h);
  subCtx.fillStyle = "#020617";
  subCtx.fillRect(0, 0, w, h);

  subCtx.strokeStyle = "rgba(148,163,184,0.25)";
  for (let i = 0; i < 15; i++) {
    const bx = (i * 60 + performance.now() / 40) % w;
    const by = (i * 30) % h;
    subCtx.beginPath();
    subCtx.arc(bx, by, 3, 0, Math.PI * 2);
    subCtx.stroke();
  }

  subCtx.fillStyle = "#e5e7eb";
  torpedoes.forEach((t) => {
    subCtx.fillRect(t.x - 3, t.y - 8, 6, 10);
  });

  enemies.forEach((e) => {
    if (e.type === "elite") {
      subCtx.fillStyle = "#fb7185";
    } else {
      subCtx.fillStyle = "#f97373";
    }
    subCtx.beginPath();
    subCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    subCtx.fill();
    subCtx.strokeStyle = "#fecaca";
    subCtx.beginPath();
    subCtx.arc(e.x, e.y, e.r - 5, 0, Math.PI * 2);
    subCtx.stroke();
  });

  powerUps.forEach((p) => {
    let color = "#38bdf8";
    let label = "S";
    if (p.type === "double") {
      color = "#eab308";
      label = "D";
    } else if (p.type === "spread") {
      color = "#a855f7";
      label = "T";
    }
    subCtx.fillStyle = color;
    subCtx.beginPath();
    subCtx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    subCtx.fill();
    subCtx.fillStyle = "#020617";
    subCtx.font = "10px system-ui";
    subCtx.textAlign = "center";
    subCtx.textBaseline = "middle";
    subCtx.fillText(label, p.x, p.y + 1);
  });

  const now = performance.now();
  const inv = now < submarine.invUntil;
  if (inv && Math.floor(now / 120) % 2 === 0) {
    subCtx.globalAlpha = 0.4;
  } else {
    subCtx.globalAlpha = 1;
  }

  subCtx.fillStyle = "#38bdf8";
  subCtx.beginPath();
  subCtx.ellipse(submarine.x, submarine.y, 24, 14, 0, 0, Math.PI * 2);
  subCtx.fill();

  subCtx.beginPath();
  subCtx.moveTo(submarine.x, submarine.y - 18);
  subCtx.lineTo(submarine.x - 8, submarine.y - 6);
  subCtx.lineTo(submarine.x + 8, submarine.y - 6);
  subCtx.closePath();
  subCtx.fillStyle = "#0ea5e9";
  subCtx.fill();

  subCtx.fillStyle = "#0f172a";
  subCtx.beginPath();
  subCtx.arc(submarine.x, submarine.y, 6, 0, Math.PI * 2);
  subCtx.fill();

  subCtx.globalAlpha = 1;

  const hp = submarine.hp;
  const heartSize = 10;
  for (let i = 0; i < hp; i++) {
    const hx = 18 + i * 20;
    const hy = 18;
    subCtx.fillStyle = "#f97373";
    subCtx.beginPath();
    subCtx.arc(hx - 4, hy, heartSize / 2, 0, Math.PI * 2);
    subCtx.arc(hx + 4, hy, heartSize / 2, 0, Math.PI * 2);
    subCtx.lineTo(hx, hy + heartSize);
    subCtx.closePath();
    subCtx.fill();
  }

  const barWidth = 80;
  const barHeight = 6;
  const margin = 10;
  let barIndex = 0;

  function drawBar(label, frac, color) {
    const x = w - barWidth - margin;
    const y = margin + barIndex * (barHeight + 6);
    barIndex++;

    subCtx.fillStyle = "rgba(15,23,42,0.9)";
    subCtx.fillRect(x, y, barWidth, barHeight);
    subCtx.strokeStyle = "rgba(148,163,184,0.7)";
    subCtx.strokeRect(x, y, barWidth, barHeight);

    if (frac > 0) {
      subCtx.fillStyle = color;
      subCtx.fillRect(x + 1, y + 1, (barWidth - 2) * frac, barHeight - 2);
    }

    subCtx.fillStyle = "#e5e7eb";
    subCtx.font = "9px system-ui";
    subCtx.textAlign = "right";
    subCtx.textBaseline = "bottom";
    subCtx.fillText(label, x + barWidth, y - 1);
  }

  const nowMs = performance.now();
  const speedFrac = Math.max(0, (submarine.speedUntil - nowMs) / 8000);
  const doubleFrac = Math.max(0, (submarine.doubleUntil - nowMs) / 9000);
  const spreadFrac = Math.max(0, (submarine.spreadUntil - nowMs) / 9000);

  drawBar("SPD", speedFrac, "#38bdf8");
  drawBar("DBL", doubleFrac, "#eab308");
  drawBar("SPR", spreadFrac, "#a855f7");
}

function endSubmarine() {
  subRunning = false;
  if (subLoopId) cancelAnimationFrame(subLoopId);
  subLoopId = null;
  sfxSubGameOver();
  handleGameEnd("submarine", subScore);
  alert("Kapalmu hancur! Skor kamu: " + subScore);
}

function updateSubmarineScore() {
  const el = document.getElementById("submarine-score");
  if (el) el.textContent = subScore;
}
