import { initState, setDirection, step, placeFood } from "./game.js";

const resultsEl = document.getElementById("results");
const summaryEl = document.getElementById("summary");

let passCount = 0;
let failCount = 0;

function assert(name, condition) {
  const row = document.createElement("div");
  row.className = condition ? "pass" : "fail";
  row.textContent = `${condition ? "PASS" : "FAIL"} ${name}`;
  resultsEl.appendChild(row);
  if (condition) {
    passCount += 1;
  } else {
    failCount += 1;
  }
}

function rngSequence(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function run() {
  const state = initState(6, 6);
  const moved = step(state, rngSequence([0]));
  assert("Snake moves right by default", moved.snake[0].x === state.snake[0].x + 1);

  const noReverse = setDirection(state, "left");
  assert("Cannot reverse direction", noReverse.nextDir === "right");

  const wallState = { ...state, snake: [{ x: 5, y: 0 }, { x: 4, y: 0 }], dir: "right", nextDir: "right" };
  const hitWall = step(wallState, rngSequence([0]));
  assert("Wall collision ends game", hitWall.gameOver === true);

  const foodState = { ...state, food: { x: state.snake[0].x + 1, y: state.snake[0].y } };
  const grew = step(foodState, rngSequence([0]));
  assert("Eating food grows snake", grew.snake.length === state.snake.length + 1);
  assert("Score increments on food", grew.score === 1);

  const filled = {
    ...state,
    snake: Array.from({ length: state.cols * state.rows }, (_, i) => ({
      x: i % state.cols,
      y: Math.floor(i / state.cols),
    })),
  };
  const noFood = placeFood(filled, rngSequence([0]));
  assert("No food when grid is full", noFood === null);

  summaryEl.textContent = `${passCount} passed, ${failCount} failed`;
}

run();
