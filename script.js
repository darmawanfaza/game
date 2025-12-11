document.addEventListener("DOMContentLoaded", () => {
  /* =========================
   *  GLOBAL ELEMENTS & STATE
   * ========================= */
  const body = document.body;
  const screens = document.querySelectorAll(".screen");
  const menuScreen = document.getElementById("menu-screen");

  const btnHowTo = document.getElementById("btn-how-to");
  const btnSettings = document.getElementById("btn-settings");
  const btnContinueLast = document.getElementById("btn-continue-last");
  const btnRandomGame = document.getElementById("btn-random-game");

  const modalSettings = document.getElementById("modal-settings");
  const modalHowTo = document.getElementById("modal-howto");
  const modalName = document.getElementById("modal-name");

  const settingSoundToggle = document.getElementById("setting-sound-toggle");
  const themeChips = document.querySelectorAll(".theme-chip");

  const playerNameDisplay = document.getElementById("player-name-display");
  const editNameButton = document.getElementById("edit-name-button");
  const playerNameInput = document.getElementById("player-name-input");
  const playerNameSave = document.getElementById("player-name-save");
  const playerAvatar = document.getElementById("player-avatar");

  const statTotalPlayed = document.getElementById("stat-total-played");
  const statTotalTime = document.getElementById("stat-total-time");
  const statFavoriteGame = document.getElementById("stat-favorite-game");

  const achievementStatuses = document.querySelectorAll("[data-achievement-status]");

  const gameCards = document.querySelectorAll(".game-card");
  const backButtons = document.querySelectorAll("[data-back]");

  // Highscore elements appear multiple times
  const highscoreElsByGame = {};
  document.querySelectorAll("[data-highscore]").forEach(el => {
    const gameId = el.getAttribute("data-highscore");
    if (!highscoreElsByGame[gameId]) highscoreElsByGame[gameId] = [];
    highscoreElsByGame[gameId].push(el);
  });

  const gameIdToScreenId = {
    "tic-tac-toe": "tic-tac-toe-screen",
    "snake": "snake-screen",
    "flappy": "flappy-screen",
    "airhockey": "airhockey-screen",
    "tetris": "tetris-screen",
    "submarine": "submarine-screen",
    "game2048": "g2048-screen",
    "breakout": "breakout-screen",
    "space": "space-screen",
    "pong": "pong-screen",
    "memory": "memory-screen"
  };

  const allGameIds = Object.keys(gameIdToScreenId);

  const state = {
    currentScreenId: "menu-screen",
    lastGameId: null,
    soundOn: true,
    theme: "dark",
    totalGamesPlayed: 0,
    totalPlayTimeMs: 0,
    currentGameStartTime: null,
    highScores: {},
    gamePlayCount: {}, // for favorite game
  };

  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
      }
    }
  }

  function playBeep(type = "click") {
    if (!state.soundOn) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    let freq = 440;
    let duration = 0.08;

    if (type === "success") {
      freq = 720; duration = 0.12;
    } else if (type === "error") {
      freq = 180; duration = 0.18;
    } else if (type === "score") {
      freq = 540; duration = 0.12;
    }

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function updateAvatarInitials(name) {
    const trimmed = (name || "").trim();
    let initials = "CH";
    if (trimmed.length > 0) {
      const parts = trimmed.split(/\s+/);
      initials = parts.slice(0, 2).map(p => p[0].toUpperCase()).join("");
    }
    playerAvatar.innerHTML = `<span>${initials}</span>`;
  }

  function loadFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem("arcadeHubState") || "{}");
      if (saved.playerName) {
        playerNameDisplay.textContent = saved.playerName;
        updateAvatarInitials(saved.playerName);
      }
      if (typeof saved.soundOn === "boolean") {
        state.soundOn = saved.soundOn;
        settingSoundToggle.setAttribute("data-sound-state", state.soundOn ? "on" : "off");
      }
      if (saved.theme === "neon") {
        state.theme = "neon";
        body.classList.add("theme-neon");
        themeChips.forEach(chip => {
          chip.classList.toggle("active", chip.dataset.theme === "neon");
        });
      }
      if (saved.highScores) {
        state.highScores = saved.highScores;
        Object.entries(state.highScores).forEach(([gameId, score]) => {
          updateHighScoreDisplay(gameId, score);
        });
      }
      if (saved.totalGamesPlayed) {
        state.totalGamesPlayed = saved.totalGamesPlayed;
        statTotalPlayed.textContent = state.totalGamesPlayed;
      }
      if (saved.totalPlayTimeMs) {
        state.totalPlayTimeMs = saved.totalPlayTimeMs;
        updateTotalTimeUI();
      }
      if (saved.gamePlayCount) {
        state.gamePlayCount = saved.gamePlayCount;
        updateFavoriteGameUI();
      }
    } catch (e) {
      console.warn("Failed to load state", e);
    }
  }

  function saveToStorage() {
    const payload = {
      playerName: playerNameDisplay.textContent,
      soundOn: state.soundOn,
      theme: state.theme,
      highScores: state.highScores,
      totalGamesPlayed: state.totalGamesPlayed,
      totalPlayTimeMs: state.totalPlayTimeMs,
      gamePlayCount: state.gamePlayCount
    };
    try {
      localStorage.setItem("arcadeHubState", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save state", e);
    }
  }

  function updateHighScoreDisplay(gameId, score) {
    state.highScores[gameId] = score;
    const els = highscoreElsByGame[gameId] || [];
    els.forEach(el => {
      el.textContent = score;
    });
  }

  function maybeSetHighScore(gameId, score) {
    const current = state.highScores[gameId] || 0;
    if (score > current) {
      updateHighScoreDisplay(gameId, score);
      saveToStorage();
      playBeep("success");
      return true;
    }
    return false;
  }

  function updateTotalTimeUI() {
    const minutes = Math.round(state.totalPlayTimeMs / 60000);
    statTotalTime.textContent = `${minutes} m`;
  }

  function updateFavoriteGameUI() {
    const entries = Object.entries(state.gamePlayCount);
    if (!entries.length) {
      statFavoriteGame.textContent = "-";
      return;
    }
    entries.sort((a, b) => b[1] - a[1]);
    const [topGameId] = entries[0];
    statFavoriteGame.textContent = mapGameIdToName(topGameId);
  }

  function mapGameIdToName(gameId) {
    const map = {
      "tic-tac-toe": "Tic Tac Toe",
      "snake": "Snake",
      "flappy": "Flappy Bird",
      "airhockey": "Air Hockey",
      "tetris": "Tetris",
      "submarine": "Submarine Battle",
      "game2048": "2048",
      "breakout": "Breakout",
      "space": "Space Shooter",
      "pong": "Pong",
      "memory": "Memory Match"
    };
    return map[gameId] || gameId;
  }

  function recordGameStart(gameId) {
    state.currentGameStartTime = Date.now();
    state.lastGameId = gameId;
  }

  function recordGameEnd(gameId) {
    if (!state.currentGameStartTime) return;
    const elapsed = Date.now() - state.currentGameStartTime;
    state.currentGameStartTime = null;
    state.totalPlayTimeMs += elapsed;
    state.totalGamesPlayed += 1;
    statTotalPlayed.textContent = state.totalGamesPlayed;
    updateTotalTimeUI();
    state.gamePlayCount[gameId] = (state.gamePlayCount[gameId] || 0) + 1;
    updateFavoriteGameUI();
    saveToStorage();
  }

  function unlockAchievement(id) {
    achievementStatuses.forEach(el => {
      const target = el.getAttribute("data-achievement-status");
      if (target === id) {
        el.textContent = "Unlocked";
        el.classList.add("unlocked");
      }
    });
  }

  /* ==============
   *  MODALS
   * ============== */
  function openModal(modal) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll("[data-modal-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      closeModal(modal);
    });
  });

  btnHowTo.addEventListener("click", () => {
    openModal(modalHowTo);
    playBeep("click");
  });

  btnSettings.addEventListener("click", () => {
    openModal(modalSettings);
    playBeep("click");
  });

  /* ==============
   *  SETTINGS
   * ============== */
  settingSoundToggle.addEventListener("click", () => {
    const current = settingSoundToggle.getAttribute("data-sound-state");
    const next = current === "on" ? "off" : "on";
    settingSoundToggle.setAttribute("data-sound-state", next);
    state.soundOn = next === "on";
    saveToStorage();
    if (state.soundOn) playBeep("click");
  });

  themeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const theme = chip.dataset.theme;
      themeChips.forEach(c => c.classList.toggle("active", c === chip));
      if (theme === "neon") {
        body.classList.add("theme-neon");
        state.theme = "neon";
      } else {
        body.classList.remove("theme-neon");
        state.theme = "dark";
      }
      saveToStorage();
      playBeep("click");
    });
  });

  /* ==============
   *  PLAYER NAME
   * ============== */
  editNameButton.addEventListener("click", () => {
    playerNameInput.value = playerNameDisplay.textContent || "CHIEF";
    openModal(modalName);
  });

  playerNameSave.addEventListener("click", () => {
    const newName = playerNameInput.value.trim() || "CHIEF";
    playerNameDisplay.textContent = newName;
    updateAvatarInitials(newName);
    saveToStorage();
    closeModal(modalName);
    playBeep("success");
  });

  /* ====================
   *  SCREEN NAVIGATION
   * ==================== */
  const games = {}; // will be filled below (each game module)

  function stopAllGames() {
    Object.values(games).forEach(game => {
      if (game && typeof game.stop === "function") {
        game.stop();
      }
    });
    state.currentGameStartTime = null;
  }

  function showScreen(screenId) {
    if (screenId === state.currentScreenId) return;

    // If leaving a game screen, record end time
    const prevScreenId = state.currentScreenId;
    if (prevScreenId && prevScreenId !== "menu-screen") {
      const prevGameId = Object.entries(gameIdToScreenId).find(
        ([gid, sid]) => sid === prevScreenId
      )?.[0];
      if (prevGameId) {
        recordGameEnd(prevGameId);
      }
    }

    // Stop all loops
    stopAllGames();

    screens.forEach(s => {
      s.classList.toggle("active", s.id === screenId);
    });
    state.currentScreenId = screenId;

    if (screenId === "menu-screen") return;

    // Start the corresponding game
    const gameId = Object.entries(gameIdToScreenId).find(
      ([gid, sid]) => sid === screenId
    )?.[0];

    if (gameId && games[gameId] && typeof games[gameId].start === "function") {
      games[gameId].start();
      recordGameStart(gameId);
      unlockAchievement("first-game");
    }
  }

  gameCards.forEach(card => {
    card.addEventListener("click", e => {
      // Only trigger when clicking card or its Play button
      const targetScreen = card.getAttribute("data-target");
      const gameId = card.getAttribute("data-game-id");
      if (!targetScreen) return;
      playBeep("click");
      showScreen(targetScreen);
      state.lastGameId = gameId;
      saveToStorage();
    });

    const playBtn = card.querySelector(".play-button");
    if (playBtn) {
      playBtn.addEventListener("click", e => {
        e.stopPropagation();
        const targetScreen = card.getAttribute("data-target");
        const gameId = card.getAttribute("data-game-id");
        if (!targetScreen) return;
        playBeep("click");
        showScreen(targetScreen);
        state.lastGameId = gameId;
        saveToStorage();
      });
    }
  });

  backButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      playBeep("click");
      showScreen("menu-screen");
    });
  });

  btnContinueLast.addEventListener("click", () => {
    if (!state.lastGameId) {
      playBeep("error");
      return;
    }
    const screenId = gameIdToScreenId[state.lastGameId];
    if (!screenId) return;
    playBeep("click");
    showScreen(screenId);
  });

  btnRandomGame.addEventListener("click", () => {
    const idx = Math.floor(Math.random() * allGameIds.length);
    const randomGameId = allGameIds[idx];
    const screenId = gameIdToScreenId[randomGameId];
    if (!screenId) return;
    playBeep("click");
    showScreen(screenId);
    state.lastGameId = randomGameId;
    saveToStorage();
  });

  /* =========================
   *  GAME: TIC TAC TOE
   * ========================= */
  (function initTicTacToe() {
    const boardEl = document.getElementById("ttt-board");
    const statusEl = document.getElementById("ttt-status");
    const restartBtn = document.getElementById("ttt-restart");

    let board = Array(9).fill(null);
    let currentPlayer = "X";
    let gameOver = false;

    function renderBoard() {
      boardEl.innerHTML = "";
      board.forEach((val, idx) => {
        const cell = document.createElement("div");
        cell.className = "ttt-cell";
        cell.textContent = val || "";
        cell.addEventListener("click", () => onCellClick(idx));
        boardEl.appendChild(cell);
      });
    }

    function checkWinner(b) {
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
      ];
      for (const [a, c, d] of lines) {
        if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
      }
      if (b.every(x => x)) return "draw";
      return null;
    }

    function onCellClick(idx) {
      if (gameOver || board[idx]) return;
      board[idx] = currentPlayer;
      playBeep("click");
      const result = checkWinner(board);
      if (result === "X" || result === "O") {
        statusEl.textContent = `Pemenang: ${result}`;
        gameOver = true;
        playBeep("success");
      } else if (result === "draw") {
        statusEl.textContent = "Seri!";
        gameOver = true;
      } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusEl.textContent = `Giliran: ${currentPlayer}`;
      }
      renderBoard();
    }

    function reset() {
      board = Array(9).fill(null);
      currentPlayer = "X";
      gameOver = false;
      statusEl.textContent = "Giliran: X";
      renderBoard();
    }

    restartBtn.addEventListener("click", () => {
      reset();
      playBeep("click");
    });

    reset();

    games["tic-tac-toe"] = {
      start() {
        reset();
      },
      stop() {
        // no loop to clean
      }
    };
  })();

  /* =========================
   *  GAME: SNAKE
   * ========================= */
  (function initSnake() {
    const canvas = document.getElementById("snake-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("snake-score");
    const startBtn = document.getElementById("snake-start");

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake, food, dir, score, intervalId, running;
    let keyHandler;

    function reset() {
      snake = [{ x: 10, y: 10 }];
      dir = { x: 1, y: 0 };
      placeFood();
      score = 0;
      scoreEl.textContent = "0";
      running = false;
      draw();
    }

    function placeFood() {
      food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      };
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // food
      ctx.fillStyle = "#f97316";
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

      // snake
      ctx.fillStyle = "#38bdf8";
      snake.forEach((segment, idx) => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
      });
    }

    function update() {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // wrap or crash?
      if (
        head.x < 0 ||
        head.x >= tileCount ||
        head.y < 0 ||
        head.y >= tileCount ||
        snake.some(seg => seg.x === head.x && seg.y === head.y)
      ) {
        playBeep("error");
        maybeSetHighScore("snake", score);
        if (score >= 100) unlockAchievement("snake-100");
        stopGame();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = String(score);
        playBeep("score");
        placeFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function startGame() {
      if (running) {
        // restart
        stopGame();
      }
      reset();
      running = true;
      if (!keyHandler) {
        keyHandler = e => {
          const key = e.key.toLowerCase();
          if (["arrowup", "w"].includes(key) && dir.y !== 1) {
            dir = { x: 0, y: -1 };
          } else if (["arrowdown", "s"].includes(key) && dir.y !== -1) {
            dir = { x: 0, y: 1 };
          } else if (["arrowleft", "a"].includes(key) && dir.x !== 1) {
            dir = { x: -1, y: 0 };
          } else if (["arrowright", "d"].includes(key) && dir.x !== -1) {
            dir = { x: 1, y: 0 };
          }
        };
      }
      document.addEventListener("keydown", keyHandler);
      intervalId = setInterval(update, 120);
    }

    function stopGame() {
      running = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
      }
      draw();
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    reset();

    games["snake"] = {
      start() {
        reset();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: FLAPPY BIRD
   * ========================= */
  (function initFlappy() {
    const canvas = document.getElementById("flappy-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("flappy-score");
    const startBtn = document.getElementById("flappy-start");

    let birdY, birdV, gravity, lift;
    let pipes, score, running, frameId;
    let lastPipeX;
    let clickHandler;
    let keyHandler;

    function reset() {
      birdY = canvas.height / 2;
      birdV = 0;
      gravity = 0.35;
      lift = -6;
      pipes = [];
      score = 0;
      scoreEl.textContent = "0";
      lastPipeX = canvas.width + 120;
      running = false;
      draw();
    }

    function spawnPipe() {
      const gap = 120;
      const minHeight = 40;
      const maxHeight = canvas.height - gap - minHeight;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
      pipes.push({
        x: canvas.width + 10,
        top: topHeight,
        bottom: canvas.height - (topHeight + gap),
        passed: false
      });
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // bird
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(80, birdY, 12, 0, Math.PI * 2);
      ctx.fill();

      // pipes
      ctx.fillStyle = "#22c55e";
      pipes.forEach(p => {
        ctx.fillRect(p.x, 0, 40, p.top);
        ctx.fillRect(p.x, canvas.height - p.bottom, 40, p.bottom);
      });
    }

    function update() {
      if (!running) return;
      birdV += gravity;
      birdY += birdV;

      if (birdY > canvas.height - 12 || birdY < 12) {
        gameOver();
        return;
      }

      pipes.forEach(p => {
        p.x -= 2;
      });

      if (!pipes.length || pipes[pipes.length - 1].x < canvas.width - 160) {
        spawnPipe();
      }

      // collision & scoring
      for (const p of pipes) {
        if (80 + 12 > p.x && 80 - 12 < p.x + 40) {
          // in pipe x range
          if (birdY - 12 < p.top || birdY + 12 > canvas.height - p.bottom) {
            gameOver();
            return;
          }
        }
        if (!p.passed && p.x + 40 < 80) {
          p.passed = true;
          score++;
          scoreEl.textContent = String(score);
          playBeep("score");
        }
      }

      draw();
      frameId = requestAnimationFrame(update);
    }

    function flap() {
      if (!running) return;
      birdV = lift;
      playBeep("click");
    }

    function gameOver() {
      running = false;
      cancelAnimationFrame(frameId);
      maybeSetHighScore("flappy", score);
      if (score >= 10) unlockAchievement("flappy-10");
      playBeep("error");
    }

    function startGame() {
      // reset and start
      cancelAnimationFrame(frameId);
      running = true;
      reset();
      running = true;
      frameId = requestAnimationFrame(update);
    }

    function bindControls() {
      if (!clickHandler) {
        clickHandler = () => flap();
      }
      if (!keyHandler) {
        keyHandler = e => {
          if (e.code === "Space") {
            e.preventDefault();
            flap();
          }
        };
      }
      canvas.addEventListener("mousedown", clickHandler);
      document.addEventListener("keydown", keyHandler);
    }

    function unbindControls() {
      if (clickHandler) canvas.removeEventListener("mousedown", clickHandler);
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    reset();
    bindControls();

    games["flappy"] = {
      start() {
        reset();
      },
      stop() {
        running = false;
        cancelAnimationFrame(frameId);
        unbindControls();
        bindControls(); // rebind once so controls available next time
        draw();
      }
    };
  })();

  /* =========================
   *  GAME: AIR HOCKEY
   * ========================= */
  (function initAirHockey() {
    const canvas = document.getElementById("airhockey-canvas");
    const ctx = canvas.getContext("2d");
    const playerScoreEl = document.getElementById("airhockey-player-score");
    const aiScoreEl = document.getElementById("airhockey-ai-score");
    const startBtn = document.getElementById("airhockey-start");

    let running = false;
    let frameId;
    let mousePos = { x: canvas.width / 2, y: canvas.height - 40 };

    const puck = { x: canvas.width / 2, y: canvas.height / 2, vx: 3, vy: 3, r: 10 };
    const player = { x: canvas.width / 2, y: canvas.height - 30, r: 20 };
    const ai = { x: canvas.width / 2, y: 30, r: 20 };

    let playerScore = 0;
    let aiScore = 0;

    canvas.addEventListener("mousemove", e => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    });

    function reset() {
      puck.x = canvas.width / 2;
      puck.y = canvas.height / 2;
      puck.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
      puck.vy = (Math.random() > 0.5 ? 1 : -1) * 3;
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // center line
      ctx.strokeStyle = "#1e293b";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // goals (narrow area)
      const goalWidth = 120;
      ctx.fillStyle = "#0f766e";
      const goalX = (canvas.width - goalWidth) / 2;
      ctx.fillRect(goalX, 0, goalWidth, 4);
      ctx.fillRect(goalX, canvas.height - 4, goalWidth, 4);

      // puck
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
      ctx.fill();

      // paddles
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(ai.x, ai.y, ai.r, 0, Math.PI * 2);
      ctx.fill();
    }

    function update() {
      if (!running) return;

      // move player to mouse (clamped)
      player.x = Math.min(Math.max(mousePos.x, player.r), canvas.width - player.r);
      player.y = Math.min(Math.max(mousePos.y, canvas.height / 2 + player.r), canvas.height - player.r);

      // AI simple follow puck on x
      const aiSpeed = 2.5;
      if (puck.x < ai.x - 4) ai.x -= aiSpeed;
      else if (puck.x > ai.x + 4) ai.x += aiSpeed;
      ai.x = Math.min(Math.max(ai.x, ai.r), canvas.width - ai.r);

      // puck movement
      puck.x += puck.vx;
      puck.y += puck.vy;

      // side walls
      if (puck.x < puck.r || puck.x > canvas.width - puck.r) {
        puck.vx *= -1;
        puck.x = Math.min(Math.max(puck.x, puck.r), canvas.width - puck.r);
      }

      // top & bottom walls (no auto score)
      if (puck.y < puck.r) {
        puck.vy *= -1;
        puck.y = puck.r;
      } else if (puck.y > canvas.height - puck.r) {
        puck.vy *= -1;
        puck.y = canvas.height - puck.r;
      }

      // collision with paddles
      function collideCircle(circle) {
        const dx = puck.x - circle.x;
        const dy = puck.y - circle.y;
        const dist = Math.hypot(dx, dy);
        const minDist = puck.r + circle.r;
        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.hypot(puck.vx, puck.vy);
          puck.vx = Math.cos(angle) * speed;
          puck.vy = Math.sin(angle) * speed;
          const overlap = minDist - dist;
          puck.x += Math.cos(angle) * overlap;
          puck.y += Math.sin(angle) * overlap;
          playBeep("click");
        }
      }

      collideCircle(player);
      collideCircle(ai);

      // goals (only count if puck fully crosses line inside goal range)
      const goalWidth = 120;
      const goalX = (canvas.width - goalWidth) / 2;
      const inGoalX = puck.x > goalX && puck.x < goalX + goalWidth;

      // player scores: puck crosses top, in goal range, moving up
      if (puck.y <= puck.r && puck.vy < 0 && inGoalX) {
        playerScore++;
        playerScoreEl.textContent = String(playerScore);
        playBeep("score");
        reset();
      }

      // ai scores: puck crosses bottom, in goal range, moving down
      if (puck.y >= canvas.height - puck.r && puck.vy > 0 && inGoalX) {
        aiScore++;
        aiScoreEl.textContent = String(aiScore);
        playBeep("error");
        reset();
      }

      draw();
      frameId = requestAnimationFrame(update);
    }

    function startGame() {
      running = true;
      reset();
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }

    function stopGame() {
      running = false;
      cancelAnimationFrame(frameId);
      draw();
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    draw();

    games["airhockey"] = {
      start() {
        draw();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: TETRIS
   * ========================= */
  (function initTetris() {
    const canvas = document.getElementById("tetris-canvas");
    const ctx = canvas.getContext("2d");
    const nextCanvas = document.getElementById("tetris-next");
    const nextCtx = nextCanvas.getContext("2d");
    const scoreEl = document.getElementById("tetris-score");
    const startBtn = document.getElementById("tetris-start");

    const cols = 10;
    const rows = 20;
    const blockSize = canvas.width / cols;

    let board, current, next, score, dropInterval, dropTimerId;
    let keyHandler;

    const shapes = [
      [[1, 1, 1, 1]], // I
      [
        [1, 1],
        [1, 1]
      ], // O
      [
        [0, 1, 0],
        [1, 1, 1]
      ], // T
      [
        [1, 0, 0],
        [1, 1, 1]
      ], // J
      [
        [0, 0, 1],
        [1, 1, 1]
      ], // L
      [
        [1, 1, 0],
        [0, 1, 1]
      ], // S
      [
        [0, 1, 1],
        [1, 1, 0]
      ] // Z
    ];

    function newBoard() {
      const b = [];
      for (let r = 0; r < rows; r++) {
        b.push(new Array(cols).fill(0));
      }
      return b;
    }

    function randomPiece() {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      return {
        x: Math.floor(cols / 2) - Math.ceil(shape[0].length / 2),
        y: 0,
        shape
      };
    }

    function rotate(matrix) {
      const rows = matrix.length;
      const cols = matrix[0].length;
      const result = [];
      for (let c = 0; c < cols; c++) {
        const row = [];
        for (let r = rows - 1; r >= 0; r--) {
          row.push(matrix[r][c]);
        }
        result.push(row);
      }
      return result;
    }

    function collide(board, piece) {
      const { shape, x, y } = piece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const nx = x + c;
            const ny = y + r;
            if (nx < 0 || nx >= cols || ny >= rows) return true;
            if (ny >= 0 && board[ny][nx]) return true;
          }
        }
      }
      return false;
    }

    function merge(board, piece) {
      const { shape, x, y } = piece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const nx = x + c;
            const ny = y + r;
            if (ny >= 0) {
              board[ny][nx] = 1;
            }
          }
        }
      }
    }

    function clearLines() {
      let linesCleared = 0;
      for (let r = rows - 1; r >= 0; r--) {
        if (board[r].every(v => v)) {
          board.splice(r, 1);
          board.unshift(new Array(cols).fill(0));
          linesCleared++;
          r++;
        }
      }
      if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreEl.textContent = String(score);
        playBeep("score");
      }
    }

    function drawBoard() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1f2933";
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * blockSize, 0);
        ctx.lineTo(x * blockSize, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * blockSize);
        ctx.lineTo(canvas.width, y * blockSize);
        ctx.stroke();
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (board[r][c]) {
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(c * blockSize + 1, r * blockSize + 1, blockSize - 2, blockSize - 2);
          }
        }
      }

      if (current) {
        ctx.fillStyle = "#a855f7";
        const { shape, x, y } = current;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const nx = x + c;
              const ny = y + r;
              if (ny >= 0) {
                ctx.fillRect(nx * blockSize + 1, ny * blockSize + 1, blockSize - 2, blockSize - 2);
              }
            }
          }
        }
      }
    }

    function drawNext() {
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      if (!next) return;
      const size = 16;
      const offsetX = (nextCanvas.width - next.shape[0].length * size) / 2;
      const offsetY = (nextCanvas.height - next.shape.length * size) / 2;
      nextCtx.fillStyle = "#020617";
      nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      nextCtx.fillStyle = "#38bdf8";
      for (let r = 0; r < next.shape.length; r++) {
        for (let c = 0; c < next.shape[r].length; c++) {
          if (next.shape[r][c]) {
            nextCtx.fillRect(
              offsetX + c * size + 1,
              offsetY + r * size + 1,
              size - 2,
              size - 2
            );
          }
        }
      }
    }

    function spawnPiece() {
      current = next || randomPiece();
      next = randomPiece();
      drawNext();
      if (collide(board, current)) {
        // game over
        maybeSetHighScore("tetris", score);
        stopGame();
      }
    }

    function tick() {
      if (!current) return;
      current.y++;
      if (collide(board, current)) {
        current.y--;
        merge(board, current);
        clearLines();
        spawnPiece();
      }
      drawBoard();
    }

    function startGame() {
      stopGame();
      board = newBoard();
      score = 0;
      scoreEl.textContent = "0";
      current = null;
      next = randomPiece();
      drawNext();
      spawnPiece();
      drawBoard();
      dropInterval = 500;
      dropTimerId = setInterval(tick, dropInterval);

      if (!keyHandler) {
        keyHandler = e => {
          if (!current) return;
          if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
          }
          if (e.key === "ArrowLeft") {
            current.x--;
            if (collide(board, current)) current.x++;
          } else if (e.key === "ArrowRight") {
            current.x++;
            if (collide(board, current)) current.x--;
          } else if (e.key === "ArrowDown") {
            current.y++;
            if (collide(board, current)) current.y--;
          } else if (e.key === "ArrowUp") {
            const rotated = rotate(current.shape);
            const oldShape = current.shape;
            current.shape = rotated;
            if (collide(board, current)) {
              current.shape = oldShape;
            }
          }
          drawBoard();
        };
      }
      document.addEventListener("keydown", keyHandler);
    }

    function stopGame() {
      if (dropTimerId) {
        clearInterval(dropTimerId);
        dropTimerId = null;
      }
      if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
      }
      drawBoard();
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    board = newBoard();
    drawBoard();
    drawNext();

    games["tetris"] = {
      start() {
        drawBoard();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: SUBMARINE BATTLE
   * ========================= */
  (function initSubmarine() {
    const canvas = document.getElementById("submarine-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("submarine-score");
    const startBtn = document.getElementById("submarine-start");

    let running = false;
    let frameId;
    let keys = {};

    const player = {
      x: canvas.width / 2,
      y: canvas.height - 40,
      w: 32,
      h: 16,
      speed: 3,
      baseSpeed: 3,
      hp: 100,
      maxHp: 100
    };

    let bullets = [];
    let enemies = [];
    let enemyTimer = 0;
    let score = 0;

    const powerUp = {
      type: null,
      timer: 0
    };

    let hpBarWidth = 120;

    function reset() {
      player.x = canvas.width / 2;
      player.y = canvas.height - 40;
      player.speed = player.baseSpeed;
      player.hp = player.maxHp;
      bullets = [];
      enemies = [];
      enemyTimer = 0;
      score = 0;
      scoreEl.textContent = "0";
      powerUp.type = null;
      powerUp.timer = 0;
      draw();
    }

    function spawnEnemy() {
      const w = 30;
      const h = 18;
      enemies.push({
        x: Math.random() * (canvas.width - w) + w / 2,
        y: -h,
        w,
        h,
        vy: 1.2 + Math.random() * 1.2,
        hp: 2
      });
    }

    function spawnPowerUp(x, y) {
      const types = ["speed", "double", "spread"];
      const type = types[Math.floor(Math.random() * types.length)];
      enemies.push({
        x,
        y,
        w: 16,
        h: 16,
        vy: 1.2,
        hp: 1,
        isPowerUp: true,
        powerType: type
      });
    }

    function fireBullets() {
      playBeep("click");
      const baseBullet = { x: player.x, y: player.y - 10, vy: -6 };

      if (!powerUp.type) {
        bullets.push({ ...baseBullet });
      } else if (powerUp.type === "double") {
        bullets.push({ x: player.x - 6, y: player.y - 10, vy: -6 });
        bullets.push({ x: player.x + 6, y: player.y - 10, vy: -6 });
      } else if (powerUp.type === "spread") {
        bullets.push({ x: player.x, y: player.y - 10, vy: -6, vx: 0 });
        bullets.push({ x: player.x - 4, y: player.y - 10, vy: -5.5, vx: -1 });
        bullets.push({ x: player.x + 4, y: player.y - 10, vy: -5.5, vx: 1 });
      } else if (powerUp.type === "speed") {
        bullets.push({ ...baseBullet, vy: -7 });
      }
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // HUD HP
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(10, 10, hpBarWidth, 8);
      const hpRatio = player.hp / player.maxHp;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(10, 10, hpBarWidth * hpRatio, 8);

      // power up HUD
      if (powerUp.type && powerUp.timer > 0) {
        ctx.fillStyle = "#e5e7eb";
        ctx.font = "10px system-ui";
        ctx.fillText(`Power: ${powerUp.type}`, 10, 32);
      }

      // player (submarine)
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
      ctx.fillRect(player.x - 8, player.y - player.h / 2 - 6, 16, 6);

      // bullets
      ctx.fillStyle = "#f97316";
      bullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y - 6, 4, 8);
      });

      // enemies
      enemies.forEach(e => {
        if (e.isPowerUp) {
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
        }
      });
    }

    function update() {
      if (!running) return;

      // move player
      if (keys["ArrowLeft"] || keys["a"]) {
        player.x -= player.speed;
      }
      if (keys["ArrowRight"] || keys["d"]) {
        player.x += player.speed;
      }
      if (keys["ArrowUp"] || keys["w"]) {
        player.y -= player.speed;
      }
      if (keys["ArrowDown"] || keys["s"]) {
        player.y += player.speed;
      }

      player.x = Math.min(Math.max(player.x, player.w / 2), canvas.width - player.w / 2);
      player.y = Math.min(Math.max(player.y, canvas.height / 2), canvas.height - 20);

      // spawn enemies
      enemyTimer += 1;
      if (enemyTimer > 60) {
        enemyTimer = 0;
        spawnEnemy();
      }

      // update enemies
      enemies.forEach(e => {
        e.y += e.vy;
      });
      enemies = enemies.filter(e => e.y < canvas.height + 40 && e.hp > 0);

      // bullets
      bullets.forEach(b => {
        b.y += b.vy;
        if (b.vx) b.x += b.vx;
      });
      bullets = bullets.filter(b => b.y > -10 && b.y < canvas.height + 10);

      // collisions
      bullets.forEach(b => {
        enemies.forEach(e => {
          if (
            b.x > e.x - e.w / 2 &&
            b.x < e.x + e.w / 2 &&
            b.y > e.y - e.h / 2 &&
            b.y < e.y + e.h / 2
          ) {
            e.hp -= 1;
            b.y = -999;
            if (e.hp <= 0) {
              if (e.isPowerUp && e.powerType) {
                powerUp.type = e.powerType;
                powerUp.timer = 600; // ~10 detik
                if (powerUp.type === "speed") {
                  player.speed = player.baseSpeed * 1.8;
                }
              } else {
                score += 10;
                scoreEl.textContent = String(score);
                if (score >= 200) unlockAchievement("submarine-200");
              }
              playBeep("score");
            }
          }
        });
      });

      // enemy hits player
      enemies.forEach(e => {
        if (e.isPowerUp) return;
        if (
          Math.abs(e.x - player.x) < (e.w + player.w) / 2 &&
          Math.abs(e.y - player.y) < (e.h + player.h) / 2
        ) {
          e.y = canvas.height + 999;
          player.hp -= 20;
          playBeep("error");
        }
      });

      if (player.hp <= 0) {
        maybeSetHighScore("submarine", score);
        running = false;
        playBeep("error");
      }

      if (powerUp.type) {
        powerUp.timer -= 1;
        if (powerUp.timer <= 0) {
          if (powerUp.type === "speed") {
            player.speed = player.baseSpeed;
          }
          powerUp.type = null;
        }
      }

      draw();
      frameId = requestAnimationFrame(update);
    }

    function startGame() {
      reset();
      running = true;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }

    function stopGame() {
      running = false;
      cancelAnimationFrame(frameId);
      draw();
    }

    function keyDown(e) {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) {
        e.preventDefault();
      }
      if (k === " ") {
        if (running) {
          fireBullets();
        }
      } else {
        keys[k] = true;
      }
    }

    function keyUp(e) {
      const k = e.key.toLowerCase();
      keys[k] = false;
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    draw();

    games["submarine"] = {
      start() {
        draw();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: 2048
   * ========================= */
  (function init2048() {
    const gridEl = document.getElementById("g2048-grid");
    const scoreEl = document.getElementById("g2048-score");
    const startBtn = document.getElementById("g2048-start");

    let board;
    let score = 0;
    let running = false;
    let keyHandler;

    function createEmptyBoard() {
      return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    }

    function spawnTile() {
      const empty = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!board[r][c]) empty.push({ r, c });
        }
      }
      if (!empty.length) return;
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
      gridEl.innerHTML = "";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = board[r][c];
          const tile = document.createElement("div");
          tile.className = "g2048-tile";
          if (val) {
            tile.textContent = val;
            tile.classList.add(`g2048-tile-${val}`);
          } else {
            tile.textContent = "";
          }
          gridEl.appendChild(tile);
        }
      }
      scoreEl.textContent = String(score);
    }

    function slideRow(row) {
      const arr = row.filter(v => v);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score += arr[i];
          arr[i + 1] = 0;
        }
      }
      return arr.filter(v => v);
    }

    function moveLeft() {
      let moved = false;
      for (let r = 0; r < 4; r++) {
        const row = board[r];
        const slided = slideRow(row);
        const newRow = [...slided, ...Array(4 - slided.length).fill(0)];
        if (newRow.some((v, idx) => v !== row[idx])) moved = true;
        board[r] = newRow;
      }
      return moved;
    }

    function moveRight() {
      let moved = false;
      for (let r = 0; r < 4; r++) {
        const row = board[r].slice().reverse();
        const slided = slideRow(row);
        const newRow = [...slided, ...Array(4 - slided.length).fill(0)].reverse();
        if (newRow.some((v, idx) => v !== board[r][idx])) moved = true;
        board[r] = newRow;
      }
      return moved;
    }

    function moveUp() {
      let moved = false;
      for (let c = 0; c < 4; c++) {
        const col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        const slided = slideRow(col);
        const newCol = [...slided, ...Array(4 - slided.length).fill(0)];
        for (let r = 0; r < 4; r++) {
          if (board[r][c] !== newCol[r]) moved = true;
          board[r][c] = newCol[r];
        }
      }
      return moved;
    }

    function moveDown() {
      let moved = false;
      for (let c = 0; c < 4; c++) {
        const col = [board[0][c], board[1][c], board[2][c], board[3][c]].reverse();
        const slided = slideRow(col);
        const newCol = [...slided, ...Array(4 - slided.length).fill(0)].reverse();
        for (let r = 0; r < 4; r++) {
          if (board[r][c] !== newCol[r]) moved = true;
          board[r][c] = newCol[r];
        }
      }
      return moved;
    }

    function hasMoves() {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!board[r][c]) return true;
          if (c < 3 && board[r][c] === board[r][c + 1]) return true;
          if (r < 3 && board[r][c] === board[r + 1][c]) return true;
        }
      }
      return false;
    }

    function startGame() {
      board = createEmptyBoard();
      score = 0;
      spawnTile();
      spawnTile();
      running = true;
      render();

      if (!keyHandler) {
        keyHandler = e => {
          if (!running) return;
          const key = e.key;
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            e.preventDefault();
          }
          let moved = false;
          if (key === "ArrowLeft") moved = moveLeft();
          else if (key === "ArrowRight") moved = moveRight();
          else if (key === "ArrowUp") moved = moveUp();
          else if (key === "ArrowDown") moved = moveDown();

          if (moved) {
            spawnTile();
            render();
            playBeep("click");
            maybeSetHighScore("game2048", score);
            if (!hasMoves()) {
              running = false;
              playBeep("error");
            }
          }
        };
      }
      document.addEventListener("keydown", keyHandler);
    }

    function stopGame() {
      running = false;
      if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
      }
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    board = createEmptyBoard();
    render();

    games["game2048"] = {
      start() {
        render();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: BREAKOUT
   * ========================= */
  (function initBreakout() {
    const canvas = document.getElementById("breakout-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("breakout-score");
    const startBtn = document.getElementById("breakout-start");

    let running = false;
    let frameId;
    let paddleX, paddleWidth, paddleHeight;
    let ballX, ballY, ballVX, ballVY, ballR;
    let bricks, rows, cols, brickWidth, brickHeight, score;
    let mouseHandler;

    function reset() {
      paddleWidth = 70;
      paddleHeight = 12;
      paddleX = (canvas.width - paddleWidth) / 2;

      ballR = 7;
      ballX = canvas.width / 2;
      ballY = canvas.height - 40;
      ballVX = 3;
      ballVY = -3;

      rows = 4;
      cols = 8;
      brickWidth = (canvas.width - 40) / cols;
      brickHeight = 16;
      bricks = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: 20 + c * brickWidth,
            y: 30 + r * (brickHeight + 4),
            w: brickWidth - 4,
            h: brickHeight,
            alive: true
          });
        }
      }
      score = 0;
      scoreEl.textContent = "0";
      draw();
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // bricks
      bricks.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // paddle
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);

      // ball
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
      ctx.fill();
    }

    function update() {
      if (!running) return;

      ballX += ballVX;
      ballY += ballVY;

      if (ballX < ballR || ballX > canvas.width - ballR) {
        ballVX *= -1;
        playBeep("click");
      }
      if (ballY < ballR) {
        ballVY *= -1;
        playBeep("click");
      }

      // paddle collision
      const paddleTop = canvas.height - paddleHeight - 10;
      if (
        ballY + ballR >= paddleTop &&
        ballY + ballR <= paddleTop + paddleHeight &&
        ballX >= paddleX &&
        ballX <= paddleX + paddleWidth
      ) {
        ballVY *= -1;
        const hitPos = (ballX - paddleX) / paddleWidth - 0.5;
        ballVX += hitPos * 2;
        playBeep("click");
      }

      // brick collisions
      bricks.forEach(b => {
        if (!b.alive) return;
        if (
          ballX + ballR > b.x &&
          ballX - ballR < b.x + b.w &&
          ballY + ballR > b.y &&
          ballY - ballR < b.y + b.h
        ) {
          b.alive = false;
          ballVY *= -1;
          score += 10;
          scoreEl.textContent = String(score);
          playBeep("score");
        }
      });

      // game over
      if (ballY > canvas.height + ballR) {
        maybeSetHighScore("breakout", score);
        running = false;
        playBeep("error");
      }

      draw();
      frameId = requestAnimationFrame(update);
    }

    function startGame() {
      reset();
      running = true;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }

    function stopGame() {
      running = false;
      cancelAnimationFrame(frameId);
      draw();
    }

    if (!mouseHandler) {
      mouseHandler = e => {
        const rect = canvas.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        paddleX = relX - paddleWidth / 2;
        paddleX = Math.max(0, Math.min(paddleX, canvas.width - paddleWidth));
      };
      canvas.addEventListener("mousemove", mouseHandler);
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    reset();

    games["breakout"] = {
      start() {
        draw();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: SPACE SHOOTER
   * ========================= */
  (function initSpaceShooter() {
    const canvas = document.getElementById("space-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("space-score");
    const startBtn = document.getElementById("space-start");

    let running = false;
    let frameId;
    let keys = {};
    let player, bullets, enemies, score, spawnTimer;

    function reset() {
      player = { x: canvas.width / 2, y: canvas.height - 30, w: 24, h: 16 };
      bullets = [];
      enemies = [];
      score = 0;
      scoreEl.textContent = "0";
      spawnTimer = 0;
      draw();
    }

    function fire() {
      bullets.push({ x: player.x, y: player.y - 12, vy: -5 });
      playBeep("click");
    }

    function spawnEnemy() {
      enemies.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        w: 20,
        h: 16,
        vy: 1.5 + Math.random()
      });
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // stars
      ctx.fillStyle = "#1f2937";
      for (let i = 0; i < 40; i++) {
        const x = (i * 23) % canvas.width;
        const y = (i * 47) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      // player
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);

      // bullets
      ctx.fillStyle = "#f97316";
      bullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 8);
      });

      // enemies
      ctx.fillStyle = "#e11d48";
      enemies.forEach(e => {
        ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      });
    }

    function update() {
      if (!running) return;

      if (keys["arrowleft"]) player.x -= 3;
      if (keys["arrowright"]) player.x += 3;
      player.x = Math.max(10, Math.min(canvas.width - 10, player.x));

      spawnTimer++;
      if (spawnTimer > 50) {
        spawnTimer = 0;
        spawnEnemy();
      }

      bullets.forEach(b => {
        b.y += b.vy;
      });
      bullets = bullets.filter(b => b.y > -10);

      enemies.forEach(e => {
        e.y += e.vy;
      });
      enemies = enemies.filter(e => e.y < canvas.height + 20);

      // collisions
      bullets.forEach(b => {
        enemies.forEach(e => {
          if (
            b.x > e.x - e.w / 2 &&
            b.x < e.x + e.w / 2 &&
            b.y > e.y - e.h / 2 &&
            b.y < e.y + e.h / 2
          ) {
            e.y = canvas.height + 999;
            b.y = -999;
            score += 10;
            scoreEl.textContent = String(score);
            playBeep("score");
          }
        });
      });

      // enemy hits player
      enemies.forEach(e => {
        if (
          Math.abs(e.x - player.x) < (e.w + player.w) / 2 &&
          Math.abs(e.y - player.y) < (e.h + player.h) / 2
        ) {
          running = false;
          playBeep("error");
        }
      });

      draw();
      frameId = requestAnimationFrame(update);
    }

    function startGame() {
      reset();
      running = true;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }

    function stopGame() {
      running = false;
      cancelAnimationFrame(frameId);
      draw();
    }

    function keyDown(e) {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === " ") {
        if (running) fire();
      } else {
        keys[k] = true;
      }
    }

    function keyUp(e) {
      keys[e.key.toLowerCase()] = false;
    }

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    reset();

    games["space"] = {
      start() {
        draw();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: PONG
   * ========================= */
  (function initPong() {
    const canvas = document.getElementById("pong-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("pong-score");
    const startBtn = document.getElementById("pong-start");

    let running = false;
    let frameId;
    let playerY, aiY, paddleHeight;
    let ballX, ballY, ballVX, ballVY, ballR;
    let playerScore, aiScore;
    let mouseHandler;

    function reset() {
      paddleHeight = 50;
      playerY = canvas.height / 2;
      aiY = canvas.height / 2;
      ballR = 6;
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballVX = 3;
      ballVY = 2;
      playerScore = 0;
      aiScore = 0;
      scoreEl.textContent = "0";
      draw();
    }

    function serve(direction = 1) {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballVX = 3 * direction;
      ballVY = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
    }

    function draw() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // center line
      ctx.strokeStyle = "#1e293b";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // paddles
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(10, playerY - paddleHeight / 2, 6, paddleHeight);

      ctx.fillStyle = "#facc15";
      ctx.fillRect(canvas.width - 16, aiY - paddleHeight / 2, 6, paddleHeight);

      // ball
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
      ctx.fill();
    }

    function update() {
      if (!running) return;

      ballX += ballVX;
      ballY += ballVY;

      if (ballY < ballR || ballY > canvas.height - ballR) {
        ballVY *= -1;
        playBeep("click");
      }

      // player paddle collision
      if (
        ballX - ballR <= 16 &&
        ballY > playerY - paddleHeight / 2 &&
        ballY < playerY + paddleHeight / 2
      ) {
        ballVX *= -1;
        const offset = (ballY - playerY) / (paddleHeight / 2);
        ballVY = offset * 3;
        playBeep("click");
      }

      // ai paddle collision
      if (
        ballX + ballR >= canvas.width - 16 &&
        ballY > aiY - paddleHeight / 2 &&
        ballY < aiY + paddleHeight / 2
      ) {
        ballVX *= -1;
        const offset = (ballY - aiY) / (paddleHeight / 2);
        ballVY = offset * 3;
        playBeep("click");
      }

      // scoring
      if (ballX < -10) {
        aiScore++;
        serve(1);
        playBeep("error");
      } else if (ballX > canvas.width + 10) {
        playerScore++;
        serve(-1);
        playBeep("score");
      }

      scoreEl.textContent = `${playerScore} : ${aiScore}`;

      // AI simple follow
      if (ballY > aiY + 4) aiY += 2.6;
      else if (ballY < aiY - 4) aiY -= 2.6;
      aiY = Math.max(paddleHeight / 2, Math.min(canvas.height - paddleHeight / 2, aiY));

      draw();
      frameId = requestAnimationFrame(update);
    }

    function startGame() {
      reset();
      serve(1);
      running = true;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }

    function stopGame() {
      running = false;
      cancelAnimationFrame(frameId);
      draw();
    }

    if (!mouseHandler) {
      mouseHandler = e => {
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        playerY = Math.max(paddleHeight / 2, Math.min(canvas.height - paddleHeight / 2, y));
      };
      canvas.addEventListener("mousemove", mouseHandler);
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    reset();

    games["pong"] = {
      start() {
        draw();
      },
      stop() {
        stopGame();
      }
    };
  })();

  /* =========================
   *  GAME: MEMORY MATCH
   * ========================= */
  (function initMemory() {
    const gridEl = document.getElementById("memory-grid");
    const stepsEl = document.getElementById("memory-steps");
    const startBtn = document.getElementById("memory-start");

    const symbols = ["🐍", "🚢", "🎮", "💎", "🧠", "🧱", "👾", "🏓"];
    let cards = [];
    let flipped = [];
    let steps = 0;
    let lockBoard = false;

    function createCards() {
      const pool = [...symbols, ...symbols]; // 16 cards
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      cards = pool.map(sym => ({
        symbol: sym,
        matched: false
      }));
    }

    function render() {
      gridEl.innerHTML = "";
      cards.forEach((card, idx) => {
        const cardEl = document.createElement("div");
        cardEl.className = "memory-card";
        if (card.matched) cardEl.classList.add("matched");

        const inner = document.createElement("div");
        inner.className = "memory-card-inner";

        const front = document.createElement("div");
        front.className = "memory-card-front";
        front.textContent = card.symbol;

        const back = document.createElement("div");
        back.className = "memory-card-back";
        back.textContent = "?";

        inner.appendChild(front);
        inner.appendChild(back);
        cardEl.appendChild(inner);

        cardEl.addEventListener("click", () => onCardClick(idx, cardEl));
        gridEl.appendChild(cardEl);
      });
      stepsEl.textContent = String(steps);
    }

    function onCardClick(idx, cardEl) {
      if (lockBoard || cards[idx].matched) return;

      if (!flipped.includes(idx)) {
        flipped.push(idx);
        cardEl.classList.add("flipped");
        playBeep("click");
      }

      if (flipped.length === 2) {
        lockBoard = true;
        steps++;
        stepsEl.textContent = String(steps);
        const [i1, i2] = flipped;
        if (cards[i1].symbol === cards[i2].symbol) {
          // match
          cards[i1].matched = true;
          cards[i2].matched = true;
          playBeep("score");
          flipped = [];
          lockBoard = false;
          if (cards.every(c => c.matched)) {
            maybeSetHighScore("memory", Math.max(0, 100 - steps * 2));
          }
        } else {
          setTimeout(() => {
            const els = gridEl.querySelectorAll(".memory-card");
            els[i1].classList.remove("flipped");
            els[i2].classList.remove("flipped");
            flipped = [];
            lockBoard = false;
          }, 500);
        }
      }
    }

    function startGame() {
      steps = 0;
      flipped = [];
      lockBoard = false;
      createCards();
      render();
    }

    startBtn.addEventListener("click", () => {
      playBeep("click");
      startGame();
    });

    createCards();
    render();

    games["memory"] = {
      start() {
        render();
      },
      stop() {
        // no loop
      }
    };
  })();

  /* ==========
   *  INIT
   * ========== */
  loadFromStorage();
});
