import './styles.css';
import { createInitialState, keyboardToAction, reduceGame, serializeState } from './core/game';
import { generateSeededLevel, getLevel } from './core/levels';
import type { GameAction, GameHarness, HarnessSnapshot, Level, MoveKey } from './core/types';
import { loadSave, saveBest } from './platform/storage';

const board = getElement('#board', HTMLDivElement);
const levelLabel = getElement('[data-testid="level-label"]', HTMLElement);
const moveLabel = getElement('[data-testid="move-label"]', HTMLElement);
const bestLabel = getElement('[data-testid="best-label"]', HTMLElement);
const resetButton = getElement('[data-testid="reset-button"]', HTMLButtonElement);
const nextButton = getElement('[data-testid="next-button"]', HTMLButtonElement);
const seedButton = getElement('[data-testid="seed-button"]', HTMLButtonElement);

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

function dispatch(action: GameAction): HarnessSnapshot {
  state = reduceGame(state, action);
  saveBest(state.best);
  render();
  return snapshot();
}

function render(): void {
  board.style.setProperty('--columns', String(state.level.width));
  board.style.setProperty('--rows', String(state.level.height));
  board.setAttribute('data-status', state.status);
  board.setAttribute('aria-label', `${state.level.name}: ${state.message}`);
  board.replaceChildren(...createCells());

  levelLabel.textContent = state.level.name;
  moveLabel.textContent = `Moves ${state.moves}`;
  bestLabel.textContent = `Best ${state.best[state.level.id] ?? '-'}`;
}

function createCells(): HTMLDivElement[] {
  const cells: HTMLDivElement[] = [];
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

function snapshot(): HarnessSnapshot {
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

const harness: GameHarness = {
  snapshot,
  dispatch,
  press(key: MoveKey) {
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
  loadLevel(level: Level) {
    state = createInitialState({ level, levelIndex: state.levelIndex, best: state.best });
    render();
    return snapshot();
  },
};

window.__GAME_HARNESS__ = harness;

function getElement<T extends Element>(
  selector: string,
  constructor: {
    new (...args: never[]): T;
  },
): T {
  const element = document.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}
