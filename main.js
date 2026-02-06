import { initState, setDirection, step, getCellSize } from "./game.js";

const TICK_MS = 120;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pause");
const restartBtn = document.getElementById("restart");

let state = initState();
let paused = false;

function updateStatus() {
  if (state.gameOver) {
    statusEl.textContent = "Game Over";
  } else if (paused) {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }
  scoreEl.textContent = `Score: ${state.score}`;
}

function draw() {
  const { cell } = getCellSize(canvas, state.cols, state.rows);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#121722";
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
    }
  }

  if (state.food) {
    ctx.fillStyle = "#f7c848";
    ctx.fillRect(state.food.x * cell, state.food.y * cell, cell - 1, cell - 1);
  }

  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#4ad295" : "#2bb07f";
    ctx.fillRect(segment.x * cell, segment.y * cell, cell - 1, cell - 1);
  });
}

function loop() {
  if (!paused && !state.gameOver) {
    state = step(state);
  }
  updateStatus();
  draw();
}

function restart() {
  state = initState();
  paused = false;
  updateStatus();
  draw();
}

function togglePause() {
  if (state.gameOver) return;
  paused = !paused;
  updateStatus();
}

function handleDirection(dir) {
  state = setDirection(state, dir);
}

const keyMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }
  if (event.key === "r" || event.key === "R") {
    restart();
    return;
  }
  const dir = keyMap[event.key];
  if (dir) {
    event.preventDefault();
    handleDirection(dir);
  }
});

document.querySelectorAll("button[data-dir]").forEach((button) => {
  button.addEventListener("click", () => handleDirection(button.dataset.dir));
});

pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", restart);

updateStatus();
setInterval(loop, TICK_MS);
