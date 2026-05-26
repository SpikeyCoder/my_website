const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function initState(cols = 20, rows = 20) {
  const start = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  const snake = [start, { x: start.x - 1, y: start.y }];
  const state = {
    cols,
    rows,
    snake,
    dir: "right",
    nextDir: "right",
    food: null,
    score: 0,
    gameOver: false,
  };
  return { ...state, food: placeFood(state, Math.random) };
}

export function setDirection(state, dir) {
  if (!DIRS[dir]) return state;
  if (OPPOSITE[dir] === state.dir) return state;
  return { ...state, nextDir: dir };
}

export function step(state, rng = Math.random) {
  if (state.gameOver) return state;

  const dir = state.nextDir || state.dir;
  const vector = DIRS[dir];
  const head = state.snake[0];
  const next = { x: head.x + vector.x, y: head.y + vector.y };

  if (
    next.x < 0 ||
    next.x >= state.cols ||
    next.y < 0 ||
    next.y >= state.rows
  ) {
    return { ...state, dir, gameOver: true };
  }

  const hitsSelf = state.snake.some((segment) => segment.x === next.x && segment.y === next.y);
  if (hitsSelf) {
    return { ...state, dir, gameOver: true };
  }

  const ateFood = state.food && next.x === state.food.x && next.y === state.food.y;
  const newSnake = [next, ...state.snake];
  if (!ateFood) {
    newSnake.pop();
  }

  const nextState = {
    ...state,
    dir,
    snake: newSnake,
    score: ateFood ? state.score + 1 : state.score,
  };

  if (ateFood) {
    return { ...nextState, food: placeFood(nextState, rng) };
  }
  return nextState;
}

export function placeFood(state, rng = Math.random) {
  const open = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const blocked = state.snake.some((segment) => segment.x === x && segment.y === y);
      if (!blocked) open.push({ x, y });
    }
  }
  if (open.length === 0) return null;
  const idx = Math.floor(rng() * open.length);
  return open[Math.max(0, Math.min(open.length - 1, idx))];
}

export function getCellSize(canvas, cols, rows) {
  return {
    cell: Math.floor(Math.min(canvas.width / cols, canvas.height / rows)),
  };
}
