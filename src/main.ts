import './styles.css';
import {
  currentChallenge,
  currentStage,
  keyboardRows,
  keyboardState,
  reduceGame,
  serializeState,
  stageProgress,
  createInitialState,
} from './core/game';
import type { GameAction, GameHarness, HarnessSnapshot } from './core/types';
import { loadSave, saveProgress } from './platform/storage';

const app = getElement('#app', HTMLElement);
const stageTitle = getElement('[data-testid="stage-title"]', HTMLElement);
const stageDescription = getElement('[data-testid="stage-description"]', HTMLElement);
const stageBadge = getElement('[data-testid="stage-badge"]', HTMLElement);
const kanaCard = getElement('[data-testid="kana-card"]', HTMLElement);
const kanaText = getElement('[data-testid="kana-text"]', HTMLElement);
const romajiTarget = getElement('[data-testid="romaji-target"]', HTMLElement);
const hintText = getElement('[data-testid="hint-text"]', HTMLElement);
const messageText = getElement('[data-testid="message"]', HTMLElement);
const scoreLabel = getElement('[data-testid="score-label"]', HTMLElement);
const streakLabel = getElement('[data-testid="streak-label"]', HTMLElement);
const mistakeLabel = getElement('[data-testid="mistake-label"]', HTMLElement);
const stageProgressBar = getElement('[data-testid="stage-progress"]', HTMLElement);
const courseProgressBar = getElement('[data-testid="course-progress"]', HTMLElement);
const keyboard = getElement('[data-testid="keyboard"]', HTMLElement);
const stageRail = getElement('[data-testid="stage-rail"]', HTMLElement);
const nextButton = getElement('[data-testid="next-button"]', HTMLButtonElement);
const resetButton = getElement('[data-testid="reset-button"]', HTMLButtonElement);

let state = createInitialState({ save: loadSave() });

render();

window.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace') {
    event.preventDefault();
    dispatch({ type: 'BACKSPACE' });
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    dispatch({ type: 'NEXT_CHALLENGE' });
    return;
  }
  if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    dispatch({ type: 'TYPE_KEY', key: event.key });
  }
});

nextButton.addEventListener('click', () => {
  dispatch(state.status === 'playing' ? { type: 'NEXT_CHALLENGE' } : { type: 'NEXT_STAGE' });
});
resetButton.addEventListener('click', () => dispatch({ type: 'RESET' }));

function dispatch(action: GameAction): HarnessSnapshot {
  state = reduceGame(state, action);
  saveProgress({
    best: state.best,
    unlockedStage: state.unlockedStage,
  });
  render();
  return snapshot();
}

function render(): void {
  const stage = currentStage(state);
  const challenge = currentChallenge(state);
  const progress = stageProgress(state);

  app.dataset.status = state.status;
  kanaCard.dataset.result = state.lastMistake ? 'wrong' : state.lastCorrectKey ? 'correct' : 'idle';
  stageTitle.textContent = stage.name;
  stageDescription.textContent = stage.description;
  stageBadge.textContent = stage.badge;
  kanaText.textContent = challenge.kana;
  hintText.textContent = challenge.hint;
  messageText.textContent = state.message;
  scoreLabel.textContent = String(state.score);
  streakLabel.textContent = `${state.streak}`;
  mistakeLabel.textContent = `${state.mistakes}`;
  stageProgressBar.style.inlineSize = `${Math.round(progress.stagePercent * 100)}%`;
  courseProgressBar.style.inlineSize = `${Math.round(progress.coursePercent * 100)}%`;
  nextButton.textContent = state.status === 'playing' ? 'つぎの問題' : 'つぎのステージ';

  renderRomaji(challenge.romaji, state.typed);
  renderKeyboard();
  renderStages();
  burstStars();
}

function renderRomaji(target: string, typed: string): void {
  romajiTarget.replaceChildren(
    ...target.split('').map((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      if (index < typed.length) {
        span.className = 'typed';
      } else if (index === typed.length) {
        span.className = state.lastMistake ? 'next wrong-next' : 'next';
      }
      return span;
    }),
  );
}

function renderKeyboard(): void {
  const states = keyboardState(state);
  keyboard.replaceChildren(
    ...keyboardRows.map((row) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'key-row';
      rowElement.replaceChildren(
        ...row.split('').map((letter) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `key ${states[letter]}`;
          button.dataset.key = letter;
          button.dataset.testid = `key-${letter}`;
          button.textContent = letter;
          button.addEventListener('click', () => dispatch({ type: 'TYPE_KEY', key: letter }));
          return button;
        }),
      );
      return rowElement;
    }),
  );
}

function renderStages(): void {
  stageRail.replaceChildren(
    ...state.stages.map((stage, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'stage-chip';
      button.dataset.active = String(index === state.stageIndex);
      button.dataset.locked = String(index > state.unlockedStage);
      button.textContent = `${index + 1}. ${stage.badge}`;
      button.disabled = index > state.unlockedStage;
      button.addEventListener('click', () => dispatch({ type: 'SET_STAGE', stageIndex: index }));
      return button;
    }),
  );
}

function burstStars(): void {
  if (!state.lastCorrectKey || state.typed.length === 0) {
    return;
  }
  const star = document.createElement('span');
  star.className = 'star-pop';
  star.textContent = ['★', '✦', '✧'][state.streak % 3];
  kanaCard.append(star);
  window.setTimeout(() => star.remove(), 700);
}

function snapshot(): HarnessSnapshot {
  return {
    ...serializeState(state),
    keyboard: keyboardState(state),
    progress: stageProgress(state),
  };
}

const harness: GameHarness = {
  snapshot,
  dispatch,
  press(key: string) {
    return dispatch({ type: 'TYPE_KEY', key });
  },
  reset(seedOrState) {
    if (typeof seedOrState === 'number') {
      state = createInitialState({
        seed: seedOrState,
        save: { best: state.best, unlockedStage: state.unlockedStage },
      });
    } else {
      state = createInitialState({
        seed: seedOrState?.seed ?? state.seed,
        save: seedOrState?.save ?? { best: state.best, unlockedStage: state.unlockedStage },
      });
    }
    render();
    return snapshot();
  },
  loadStage(stageIndex: number) {
    state = reduceGame(state, { type: 'SET_STAGE', stageIndex });
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
