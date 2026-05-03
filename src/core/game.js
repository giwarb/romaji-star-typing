import { getLevel } from './levels.js';

const deltas = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function createInitialState({ level = getLevel(0), levelIndex = 0, best = {} } = {}) {
  validateLevel(level);

  return {
    level,
    levelIndex,
    player: { ...level.start },
    moves: 0,
    status: 'playing',
    message: 'Reach the pulse gate.',
    best,
    history: [{ ...level.start }],
  };
}

export function reduceGame(state, action) {
  switch (action.type) {
    case 'MOVE':
      return movePlayer(state, action.key);
    case 'RESET':
      return createInitialState({
        level: action.level ?? state.level,
        levelIndex: action.levelIndex ?? state.levelIndex,
        best: state.best,
      });
    case 'NEXT_LEVEL':
      return createInitialState({
        level: action.level,
        levelIndex: action.levelIndex,
        best: state.best,
      });
    default:
      return state;
  }
}

export function movePlayer(state, key) {
  if (state.status !== 'playing') {
    return state;
  }

  const delta = deltas[key];
  if (!delta) {
    return state;
  }

  const next = {
    x: clamp(state.player.x + delta.x, 0, state.level.width - 1),
    y: clamp(state.player.y + delta.y, 0, state.level.height - 1),
  };

  if (samePoint(next, state.player)) {
    return {
      ...state,
      message: 'The arena wall hums back.',
    };
  }

  if (isHazard(state.level, next)) {
    return {
      ...state,
      moves: state.moves + 1,
      player: next,
      status: 'lost',
      message: 'The pulse field collapsed.',
      history: [...state.history, next],
    };
  }

  const won = samePoint(next, state.level.goal);
  const moves = state.moves + 1;
  const bestForLevel = state.best[state.level.id];
  const best = won
    ? {
        ...state.best,
        [state.level.id]: bestForLevel ? Math.min(bestForLevel, moves) : moves,
      }
    : state.best;

  return {
    ...state,
    moves,
    best,
    player: next,
    status: won ? 'won' : 'playing',
    message: won ? scoreMessage(moves, state.level.par) : 'Keep moving.',
    history: [...state.history, next],
  };
}

export function keyboardToAction(key) {
  return deltas[key] ? { type: 'MOVE', key } : null;
}

export function isHazard(level, point) {
  return level.hazards.some((hazard) => samePoint(hazard, point));
}

export function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function serializeState(state) {
  return {
    levelId: state.level.id,
    levelIndex: state.levelIndex,
    player: { ...state.player },
    moves: state.moves,
    status: state.status,
    message: state.message,
    best: { ...state.best },
    history: state.history.map((point) => ({ ...point })),
  };
}

export function validateLevel(level) {
  const requiredPoints = [level.start, level.goal, ...level.hazards];
  const validSize = Number.isInteger(level.width) && Number.isInteger(level.height);
  if (!validSize || level.width < 2 || level.height < 2) {
    throw new Error('Level must have integer width and height of at least 2.');
  }

  for (const point of requiredPoints) {
    if (!isInside(level, point)) {
      throw new Error(`Point ${JSON.stringify(point)} is outside the level.`);
    }
  }

  if (isHazard(level, level.start) || isHazard(level, level.goal)) {
    throw new Error('Start and goal must not be hazards.');
  }
}

function scoreMessage(moves, par) {
  if (moves <= par) {
    return 'Clean run. Pulse gate stabilized.';
  }
  return 'Gate reached. Try trimming the route.';
}

function isInside(level, point) {
  return point.x >= 0 && point.y >= 0 && point.x < level.width && point.y < level.height;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
