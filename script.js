document.addEventListener("DOMContentLoaded", () => {
  // ======= NAVIGASI ANTAR SCREEN =======
  const homeScreen = document.getElementById("home");
  const screens = document.querySelectorAll(".screen");
  const gameCards = document.querySelectorAll(".game-card");
  const backButtons = document.querySelectorAll("[data-back]");

  function showScreen(screenId) {
    // stop semua game loop dulu biar nggak jalan di belakang
    stopSnakeGame();
    stopFlappyGame();
    stopHockeyGame();

    if (screenId === "home") {
      homeScreen.classList.add("active-screen");
      screens.forEach((s) => s.classList.remove("active-screen"));
      return;
    }

    homeScreen.classList.remove("active-screen");
    screens.forEach((s) => {
      s.id === screenId
        ? s.classList.add("active-screen")
        : s.classList.remove("active-screen");
    });

    // trigger init tertentu kalau perlu
    if (screenId === "tictactoe-screen") resetTicTacToe();
  }

  gameCards.forEach((card) => {
    card.addEventListener("click", () => {
      const target = card.dataset.target;
      showScreen(target);
    });
  });

  backButtons.forEach((btn) => {
    btn.addEventListener("click", () => showScreen("home"));
  });

  // ============ TIC TAC TOE ============
  const tttCells = document.querySelectorAll(".cell");
  const tttStatus = document.getElementById("tictactoe-status");
  const tttReset = document.getElementById("tictactoe-reset");

  let tttBoard = Array(9).fill(null);
  let tttCurrent = "X";
  let tttGameOver = false;

  const tttWins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function updateTicTacToeStatus() {
    if (tttGameOver) return;
    tttStatus.textContent = `Giliran: ${tttCurrent}`;
  }

  function checkTicTacToeWin() {
    for (const combo of tttWins) {
      const [a, b, c] = combo;
      if (
        tttBoard[a] &&
        tttBoard[a] === tttBoard[b] &&
        tttBoard[a] === tttBoard[c]
      ) {
        tttStatus.textContent = `Pemain ${tttBoard[a]} menang!`;
        tttGameOver = true;
        return;
      }
    }
    if (!tttBoard.includes(null)) {
      tttStatus.textContent = "Seri!";
      tttGameOver = true;
    }
  }

  function handleTttClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index, 10);
    if (tttBoard[index] || tttGameOver) return;
    tttBoard[index] = tttCurrent;
    cell.textContent = tttCurrent;
    checkTicTacToeWin();
    if (!tttGameOver) {
      tttCurrent = tttCurrent === "X" ? "O" : "X";
      updateTicTacToeStatus();
    }
  }

  function resetTicTacToe() {
    tttBoard = Array(9).fill(null);
    tttCurrent = "X";
    tttGameOver = false;
    tttCells.forEach((cell) => (cell.textContent = ""));
    tttStatus.textContent = "Giliran: X";
  }

  tttCells.forEach((cell) => cell.addEventListener("click", handleTttClick));
  tttReset.addEventListener("click", resetTicTacToe);
  updateTicTacToeStatus();

  // ============ SNAKE ============
  const snakeCanvas = document.getElementById("snake-canvas");
  const snakeCtx = s
