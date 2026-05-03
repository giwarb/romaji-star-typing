import './styles.css';
import { createInitialState, keyboardToAction, reduceGame, serializeState } from './core/game.js';
import { generateSeededLevel, getLevel } from './core/levels.js';
import { loadSave, saveBest } from './platform/storage.js';

const board = document.querySelector('#board');
const levelLabel = document.querySelector('[data-testid="level-label"]');
const moveLabel = document.querySelector('[data-testid="move-label"]');
const bestLabel = document.querySelector('[data-testid="best-label"]');
const resetButton = document.querySelector('[data-testid="reset-button"]');
const nextButton = document.querySelector('[data-testid="next-button"]');
const seedButton = document.querySelector('[data-testid="seed-button"]');

let state = createInitialState({
  level: getLevel(0),
  levelIndex: 0,
  best: loadSave().best,
});

render();

window.addEventListener('keydown', (event) => {
  const action = keyboardToAction(event.code);
  if (action) {
    event.preventDefault();
    dispatch(action);
  }
});

resetButton.addEventListener('click', () => dispatch({ type: 'RESET' }));
nextButton.addEventListener('click', () => {
  const levelIndex = state.levelIndex + 1;
  dispatch({ type: 'NEXT_LEVEL', level: getLevel(levelIndex), levelIndex });
});
seedButton.addEventListener('click', () => {
  const seed = Date.now() % 10_000;
  dispatch({ type: 'NEXT_LEVEL', level: generateSeededLevel(seed), levelIndex: state.levelIndex });
});

function dispatch(action) {
  state = reduceGame(state, action);
  saveBest(state.best);
  render();
  return snapshot();
}

function render() {
  board.style.setProperty('--columns', state.level.width);
  board.style.setProperty('--rows', state.level.height);
  board.setAttribute('data-status', state.status);
  board.setAttribute('aria-label', `${state.level.name}: ${state.message}`);
  board.replaceChildren(...createCells());

  levelLabel.textContent = state.level.name;
  moveLabel.textContent = `Moves ${state.moves}`;
  bestLabel.textContent = `Best ${state.best[state.level.id] ?? '-'}`;
}

function createCells() {
  const cells = [];
  for (let y = 0; y < state.level.height; y += 1) {
    for (let x = 0; x < state.level.width; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.dataset.testid = `cell-${x}-${y}`;
      cell.setAttribute('role', 'gridcell');

      if (state.level.goal.x === x && state.level.goal.y === y) {
        cell.classList.add('goal');
        cell.textContent = 'G';
      }
      if (state.level.hazards.some((hazard) => hazard.x === x && hazard.y === y)) {
        cell.classList.add('hazard');
        cell.textContent = '!';
      }
      if (state.player.x === x && state.player.y === y) {
        cell.classList.add('player');
        cell.textContent = 'P';
      }
      cells.push(cell);
    }
  }
  return cells;
}

function snapshot() {
  return {
    ...serializeState(state),
    board: {
      columns: state.level.width,
      rows: state.level.height,
      cellCount: board.children.length,
      activeCell: `${state.player.x},${state.player.y}`,
    },
  };
}

window.__GAME_HARNESS__ = {
  snapshot,
  dispatch,
  press(key) {
    return dispatch({ type: 'MOVE', key });
  },
  reset(seedOrState) {
    if (typeof seedOrState === 'number' || typeof seedOrState === 'string') {
      state = createInitialState({
        level: generateSeededLevel(seedOrState),
        levelIndex: state.levelIndex,
        best: state.best,
      });
    } else if (seedOrState?.level) {
      state = createInitialState({
        level: seedOrState.level,
        levelIndex: seedOrState.levelIndex ?? state.levelIndex,
        best: state.best,
      });
    } else {
      state = createInitialState({
        level: state.level,
        levelIndex: state.levelIndex,
        best: state.best,
      });
    }
    render();
    return snapshot();
  },
  loadLevel(level) {
    state = createInitialState({ level, levelIndex: state.levelIndex, best: state.best });
    render();
    return snapshot();
  },
};
