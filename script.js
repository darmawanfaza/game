// ========== SISTEM AUDIO SEDERHANA ==========
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

function playBeep({ freq = 440, duration = 120, type = "sine", volume = 0.2 } = {}) {
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

// Helper per game
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
function sfxSolitaireMove() {
  playBeep({ freq: 620, duration: 80, type: "square", volume: 0.15 });
}
function sfxSolitaireWin() {
  playBeep({ freq: 900, duration: 150, type: "triangle", volume: 0.25 });
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

// ========== NAVIGASI SCREEN ==========
document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");

  function showScreen(id) {
    screens.forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
    }
  }

  // Klik kartu game -> pindah screen
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const targetId = card.getAttribute("data-target");
      if (!targetId) return;
      sfxMenuClick();
      showScreen(targetId);

      if (targetId === "tic-tac-toe-screen") initTicTacToe();
    });
  });

  // Tombol Back
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sfxMenuClick();
      showScreen("menu-screen");
    });
  });

  // Inisialisasi game
  initTicTacToe();
  initSnake();
  initFlappy();
  initSolitaire();
  initAirHockey();
  initTetris();
  initSubmarine();
});

// ========== TIC TAC TOE ==========
let tttBoard = [];
let tttCurrentPlayer = "X";
let tttGameOver = false;

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

// ========== SNAKE ==========
let snakeCanvas,
  snakeCtx,
  snakeInterval = null,
  snake,
  snakeDir,
  snakeFood,
  snakeScore = 0;

const SNAKE_TILE = 20;
const SNAKE_SPEED_MS = 120;

function initSnake() {
  snakeCanvas = document.getElementById("snake-canvas");
  if (!snakeCanvas) return;
  snakeCtx = snakeCanvas.getContext("2d");

  const startBtn = document.getElementById("snake-start");
  if (startBtn) {
    startBtn.addEventListener("click", startSnakeGame);
  }

  document.addEventListener("keydown", handleSnakeKey);
  resetSnake();
  drawSnake();
}

function resetSnake() {
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

  // Tabrak dinding
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    endSnakeGame();
    return;
  }

  // Tabrak badan
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    endSnakeGame();
    return;
  }

  snake.unshift(head);

  // Makan
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

  // Snake
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

  // Food
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
  alert("Game over! Skor kamu: " + snakeScore);
}

function updateSnakeScore() {
  const scoreEl = document.getElementById("snake-score");
  if (scoreEl) scoreEl.textContent = snakeScore;
}

// ========== FLAPPY BIRD (bugfix restart) ==========
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
const PIPE_INTERVAL = 1600; // ms

function initFlappy() {
  flappyCanvas = document.getElementById("flappy-canvas");
  if (!flappyCanvas) return;
  flappyCtx = flappyCanvas.getContext("2d");

  const startBtn = document.getElementById("flappy-start");
  if (startBtn) startBtn.addEventListener("click", startFlappy);

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
  // Bird physics
  flappyBird.vy += GRAVITY;
  flappyBird.y += flappyBird.vy;

  // Spawn pipes pakai timer
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

  // Move pipes
  const speed = 2.5;
  flappyPipes.forEach((pipe) => {
    pipe.x -= speed;
  });

  // Hapus pipes di luar layar
  flappyPipes = flappyPipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

  // Cek skor & tabrakan
  for (const pipe of flappyPipes) {
    // Nambah skor
    if (!pipe.passed && flappyBird.x > pipe.x + PIPE_WIDTH) {
      pipe.passed = true;
      flappyScore += 1;
      updateFlappyScore();
      sfxFlappyScore();
    }

    // Cek tabrakan
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

  // Tabrak tanah atau langit
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

  // Latar belakang
  flappyCtx.fillStyle = "#020617";
  flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

  // Pipes
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

  // Bird
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
  alert("Game over! Skor kamu: " + flappyScore);
}

function updateFlappyScore() {
  const el = document.getElementById("flappy-score");
  if (el) el.textContent = flappyScore;
}

// ========== SOLITAIRE (Klondike sederhana: stock, waste, tableau) ==========
let solitaireDeck = [];
let solitaireStock = [];
let solitaireWaste = [];
let solitaireFoundations = [[], [], [], []]; // per foundation: array of cards
let solitaireTableau = []; // 7 kolom

function initSolitaire() {
  const newBtn = document.getElementById("solitaire-new");
  const stockEl = document.getElementById("solitaire-stock");
  if (newBtn) {
    newBtn.addEventListener("click", setupSolitaire);
  }
  if (stockEl) {
    stockEl.addEventListener("click", drawFromStock);
  }
  setupSolitaire();
}

function setupSolitaire() {
  const statusEl = document.getElementById("solitaire-status");
  solitaireFoundations = [[], [], [], []];
  solitaireStock = [];
  solitaireWaste = [];
  solitaireTableau = [[], [], [], [], [], [], []];

  createShuffledDeck();

  // Bangun tableau
  for (let col = 0; col < 7; col++) {
    for (let i = 0; i <= col; i++) {
      const card = solitaireDeck.pop();
      const faceUp = i === col;
      solitaireTableau[col].push({ ...card, faceUp });
    }
  }

  // Sisa deck jadi stock
  solitaireStock = [...solitaireDeck];
  solitaireDeck = [];

  renderSolitaire();

  if (statusEl) {
    statusEl.textContent =
      "Aturan: Klik stock untuk draw kartu. Klik kartu face-up di tableau atau waste untuk memindah ke foundation (A → K, satu jenis kartu).";
  }
}

function createShuffledDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  solitaireDeck = [];

  suits.forEach((suit) => {
    ranks.forEach((rank, idx) => {
      const value = idx + 1; // A=1, K=13
      solitaireDeck.push({ suit, rank, value });
    });
  });

  for (let i = solitaireDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [solitaireDeck[i], solitaireDeck[j]] = [solitaireDeck[j], solitaireDeck[i]];
  }
}

function renderSolitaire() {
  const stockEl = document.getElementById("solitaire-stock");
  const wasteEl = document.getElementById("solitaire-waste");
  const tableauEl = document.getElementById("solitaire-tableau");
  const foundationEls = document.querySelectorAll(".foundation");

  if (!stockEl || !wasteEl || !tableauEl) return;

  // Stock
  stockEl.innerHTML = "";
  if (solitaireStock.length > 0) {
    const backCard = document.createElement("div");
    backCard.className = "card face-down";
    stockEl.appendChild(backCard);
  } else {
    stockEl.textContent = "♻";
  }

  // Waste
  wasteEl.innerHTML = "";
  if (solitaireWaste.length > 0) {
    const top = solitaireWaste[solitaireWaste.length - 1];
    const cardEl = createCardElement(top);
    cardEl.addEventListener("click", () => handleWasteClick(top));
    wasteEl.appendChild(cardEl);
  }

  // Foundations
  foundationEls.forEach((fEl, idx) => {
    fEl.textContent = "";
    const pile = solitaireFoundations[idx];
    if (pile.length > 0) {
      const top = pile[pile.length - 1];
      fEl.textContent = top.rank + top.suit;
    }
  });

  // Tableau
  tableauEl.innerHTML = "";
  solitaireTableau.forEach((column, colIndex) => {
    const colEl = document.createElement("div");
    colEl.className = "tableau-column";
    column.forEach((cardObj, idx) => {
      const cardEl = cardObj.faceUp
        ? createCardElement(cardObj)
        : createFaceDownCard();
      if (cardObj.faceUp && idx === column.length - 1) {
        cardEl.addEventListener("click", () =>
          handleTableauCardClick(cardObj, colIndex)
        );
      }
      colEl.appendChild(cardEl);
    });
    tableauEl.appendChild(colEl);
  });
}

function createCardElement(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.dataset.suit = card.suit;
  el.dataset.rank = card.rank;
  el.dataset.value = card.value;

  const isRed = card.suit === "♥" || card.suit === "♦";
  el.classList.add(isRed ? "red" : "black");

  el.innerHTML = `
    <span class="card-rank-top">${card.rank}</span>
    <span class="card-suit-center">${card.suit}</span>
    <span class="card-rank-bottom">${card.rank}</span>
  `;
  return el;
}

function createFaceDownCard() {
  const el = document.createElement("div");
  el.className = "card face-down";
  return el;
}

function drawFromStock() {
  if (solitaireStock.length === 0) {
    while (solitaireWaste.length > 0) {
      solitaireStock.push(solitaireWaste.pop());
    }
  } else {
    const card = solitaireStock.pop();
    solitaireWaste.push(card);
  }
  renderSolitaire();
}

function handleWasteClick(card) {
  if (tryMoveCardToFoundation(card)) {
    solitaireWaste.pop();
    sfxSolitaireMove();
    renderSolitaire();
    checkSolitaireWin();
  }
}

function handleTableauCardClick(card, colIndex) {
  const column = solitaireTableau[colIndex];
  const top = column[column.length - 1];
  if (!top || !top.faceUp || top.value !== card.value || top.suit !== card.suit)
    return;

  if (tryMoveCardToFoundation(card)) {
    column.pop();
    const newTop = column[column.length - 1];
    if (newTop && !newTop.faceUp) newTop.faceUp = true;
    sfxSolitaireMove();
    renderSolitaire();
    checkSolitaireWin();
  }
}

function tryMoveCardToFoundation(card) {
  for (let i = 0; i < solitaireFoundations.length; i++) {
    const pile = solitaireFoundations[i];
    if (pile.length === 0) {
      if (card.value === 1) {
        pile.push(card);
        return true;
      }
    } else {
      const top = pile[pile.length - 1];
      if (top.suit === card.suit && card.value === top.value + 1) {
        pile.push(card);
        return true;
      }
    }
  }
  return false;
}

function checkSolitaireWin() {
  const total = solitaireFoundations.reduce(
    (sum, pile) => sum + pile.length,
    0
  );
  const statusEl = document.getElementById("solitaire-status");
  if (total === 52) {
    if (statusEl) {
      statusEl.textContent =
        "Selamat! Semua kartu sudah berpindah ke foundation. 🎉";
    }
    sfxSolitaireWin();
  }
}

// ========== AIR HOCKEY (gawang fix) ==========
let airCanvas,
  airCtx,
  airLoopId = null;

let puck,
  playerPaddle,
  aiPaddle,
  airPlayerScore = 0,
  airAiScore = 0;

function initAirHockey() {
  airCanvas = document.getElementById("airhockey-canvas");
  if (!airCanvas) return;
  airCtx = airCanvas.getContext("2d");

  const startBtn = document.getElementById("airhockey-start");
  if (startBtn) startBtn.addEventListener("click", startAirHockey);

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
    vx: (Math.random() > 0.5 ? 2 : -2),
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

  // Dinding samping
  if (puck.x - puck.r < 0 || puck.x + puck.r > w) {
    puck.vx *= -1;
  }

  // AI follow
  const aiSpeed = 2.1;
  if (puck.x < aiPaddle.x - 5) {
    aiPaddle.x -= aiSpeed;
  } else if (puck.x > aiPaddle.x + 5) {
    aiPaddle.x += aiSpeed;
  }
  aiPaddle.x = Math.max(aiPaddle.r, Math.min(w - aiPaddle.r, aiPaddle.x));

  // Tabrakan paddle
  handlePaddleCollision(playerPaddle, true);
  handlePaddleCollision(aiPaddle, false);

  const goalLeft = w / 3;
  const goalRight = (2 * w) / 3;

  // Gawang atas (player mencetak)
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

  // Gawang bawah (AI mencetak)
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

// ========== TETRIS ==========
let tetrisCanvas,
  tetrisCtx,
  tetrisGrid,
  tetrisCols = 10,
  tetrisRows = 20,
  tetrisTile = 20,
  tetrisPiece = null,
  tetrisScore = 0,
  tetrisDropInterval = 500,
  tetrisDropTimer = null,
  tetrisRunning = false;

const TETRIS_COLORS = [
  "#000000",
  "#f97373", // I
  "#38bdf8", // J
  "#22c55e", // L
  "#eab308", // O
  "#a855f7", // S
  "#f97316", // T
  "#06b6d4", // Z
];

const TETRIS_SHAPES = [
  [],
  [[1, 1, 1, 1]], // I
  [
    [2, 0, 0],
    [2, 2, 2],
  ], // J
  [
    [0, 0, 3],
    [3, 3, 3],
  ], // L
  [
    [4, 4],
    [4, 4],
  ], // O
  [
    [0, 5, 5],
    [5, 5, 0],
  ], // S
  [
    [0, 6, 0],
    [6, 6, 6],
  ], // T
  [
    [7, 7, 0],
    [0, 7, 7],
  ], // Z
];

function initTetris() {
  tetrisCanvas = document.getElementById("tetris-canvas");
  if (!tetrisCanvas) return;
  tetrisCtx = tetrisCanvas.getContext("2d");

  const startBtn = document.getElementById("tetris-start");
  if (startBtn) startBtn.addEventListener("click", startTetris);

  document.addEventListener("keydown", handleTetrisKey);
  resetTetris();
  drawTetris();
}

function resetTetris() {
  tetrisGrid = Array.from({ length: tetrisRows }, () =>
    Array(tetrisCols).fill(0)
  );
  tetrisScore = 0;
  updateTetrisScore();
  tetrisPiece = null;
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
  const type = 1 + Math.floor(Math.random() * 7);
  const shape = TETRIS_SHAPES[type];
  tetrisPiece = {
    x: Math.floor(tetrisCols / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
    shape: shape.map((row) => [...row]),
  };
  if (collides(tetrisPiece.shape, tetrisPiece.x, tetrisPiece.y)) {
    endTetris();
  }
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
    // lock piece
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
  tetrisCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

  // grid
  for (let y = 0; y < tetrisRows; y++) {
    for (let x = 0; x < tetrisCols; x++) {
      const val = tetrisGrid[y][x];
      if (val !== 0) {
        tetrisCtx.fillStyle = TETRIS_COLORS[val];
        tetrisCtx.fillRect(
          x * tetrisTile,
          y * tetrisTile,
          tetrisTile - 1,
          tetrisTile - 1
        );
      }
    }
  }

  // piece
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
              gx * tetrisTile,
              gy * tetrisTile,
              tetrisTile - 1,
              tetrisTile - 1
            );
          }
        }
      }
    }
  }
}

function endTetris() {
  tetrisRunning = false;
  if (tetrisDropTimer) clearInterval(tetrisDropTimer);
  tetrisDropTimer = null;
  sfxTetrisGameOver();
  alert("Game over! Skor Tetris kamu: " + tetrisScore);
}

function updateTetrisScore() {
  const el = document.getElementById("tetris-score");
  if (el) el.textContent = tetrisScore;
}

// ========== SUBMARINE BATTLE ==========
let subCanvas,
  subCtx,
  subRunning = false,
  submarine,
  torpedoes = [],
  enemies = [],
  subScore = 0,
  subLoopId = null,
  subKeys = {},
  lastShotTime = 0,
  lastEnemySpawn = 0;

function initSubmarine() {
  subCanvas = document.getElementById("submarine-canvas");
  if (!subCanvas) return;
  subCtx = subCanvas.getContext("2d");

  const startBtn = document.getElementById("submarine-start");
  if (startBtn) startBtn.addEventListener("click", startSubmarine);

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
  submarine = {
    x: 80,
    y: subCanvas.height / 2,
    vy: 0,
    r: 14,
  };
  torpedoes = [];
  enemies = [];
  subScore = 0;
  updateSubmarineScore();
  lastShotTime = 0;
  lastEnemySpawn = 0;
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
    updateSubmarine(delta);
    renderSubmarine();
    subLoopId = requestAnimationFrame(loop);
  };

  subLoopId = requestAnimationFrame(loop);
}

function shootTorpedo(time) {
  const cooldown = 250;
  if (time - lastShotTime < cooldown) return;
  lastShotTime = time;
  torpedoes.push({
    x: submarine.x + 20,
    y: submarine.y,
    vx: 4,
  });
  sfxSubShoot();
}

function spawnEnemy(time) {
  const interval = 1200;
  if (time - lastEnemySpawn < interval) return;
  lastEnemySpawn = time;
  enemies.push({
    x: subCanvas.width + 20,
    y: 40 + Math.random() * (subCanvas.height - 80),
    vx: -2.2 - Math.random() * 0.8,
    r: 16,
  });
}

function updateSubmarine(delta) {
  const timeNow = performance.now();

  // Input gerak
  const upPressed = subKeys["ArrowUp"] || subKeys["KeyW"];
  const downPressed = subKeys["ArrowDown"] || subKeys["KeyS"];
  if (upPressed && !downPressed) {
    submarine.vy = -2.4;
  } else if (downPressed && !upPressed) {
    submarine.vy = 2.4;
  } else {
    submarine.vy *= 0.85;
  }

  submarine.y += submarine.vy;
  submarine.y = Math.max(20, Math.min(subCanvas.height - 20, submarine.y));

  // Shoot
  if (subKeys["Space"]) {
    shootTorpedo(timeNow);
  }

  // Update torpedo
  torpedoes.forEach((t) => {
    t.x += t.vx;
  });
  torpedoes = torpedoes.filter((t) => t.x < subCanvas.width + 30);

  // Spawn enemy
  spawnEnemy(timeNow);

  // Update enemy
  enemies.forEach((e) => {
    e.x += e.vx;
  });
  enemies = enemies.filter((e) => e.x > -30);

  // Cek hit torpedo-enemy
  for (let i = enemies.length - 1; i >= 0; i--) {
    let hit = false;
    for (let j = torpedoes.length - 1; j >= 0; j--) {
      const dx = enemies[i].x - torpedoes[j].x;
      const dy = enemies[i].y - torpedoes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemies[i].r) {
        // hancur
        enemies.splice(i, 1);
        torpedoes.splice(j, 1);
        subScore += 10;
        updateSubmarineScore();
        sfxSubHit();
        hit = true;
        break;
      }
    }
    if (hit) continue;
  }

  // Cek tabrakan musuh dengan kapal selam
  for (const e of enemies) {
    const dx = e.x - submarine.x;
    const dy = e.y - submarine.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < e.r + submarine.r) {
      endSubmarine();
      return;
    }
  }
}

function renderSubmarine() {
  if (!subCtx) return;
  const w = subCanvas.width;
  const h = subCanvas.height;

  subCtx.clearRect(0, 0, w, h);
  // Air
  subCtx.fillStyle = "#020617";
  subCtx.fillRect(0, 0, w, h);

  // Sedikit gelembung
  subCtx.strokeStyle = "rgba(148,163,184,0.2)";
  for (let i = 0; i < 12; i++) {
    const bx = (i * 50 + (performance.now() / 30)) % w;
    const by = (i * 25) % h;
    subCtx.beginPath();
    subCtx.arc(bx, by, 3, 0, Math.PI * 2);
    subCtx.stroke();
  }

  // Torpedoes
  subCtx.fillStyle = "#e5e7eb";
  torpedoes.forEach((t) => {
    subCtx.fillRect(t.x - 6, t.y - 2, 12, 4);
  });

  // Enemies (mine / kapal musuh)
  enemies.forEach((e) => {
    subCtx.fillStyle = "#f97373";
    subCtx.beginPath();
    subCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    subCtx.fill();
    subCtx.strokeStyle = "#fecaca";
    subCtx.beginPath();
    subCtx.arc(e.x, e.y, e.r - 5, 0, Math.PI * 2);
    subCtx.stroke();
  });

  // Submarine
  subCtx.fillStyle = "#38bdf8";
  subCtx.beginPath();
  subCtx.ellipse(submarine.x, submarine.y, 24, 12, 0, 0, Math.PI * 2);
  subCtx.fill();
  // Tower
  subCtx.fillRect(submarine.x - 6, submarine.y - 16, 12, 10);
  // Window
  subCtx.fillStyle = "#0f172a";
  subCtx.beginPath();
  subCtx.arc(submarine.x + 8, submarine.y, 4, 0, Math.PI * 2);
  subCtx.fill();
}

function endSubmarine() {
  subRunning = false;
  if (subLoopId) cancelAnimationFrame(subLoopId);
  subLoopId = null;
  sfxSubGameOver();
  alert("Kapal selam hancur! Skor kamu: " + subScore);
}

function updateSubmarineScore() {
  const el = document.getElementById("submarine-score");
  if (el) el.textContent = subScore;
}
