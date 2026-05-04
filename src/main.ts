import './styles.css';
import {
  createInitialState,
  keyboardRows,
  keyboardState,
  reduceGame,
  serializeState,
  stageProgress,
} from './core/game';
import type { FeedbackEvent, GameAction, GameHarness, GameMode, HarnessSnapshot } from './core/types';
import { loadSave, saveProgress } from './platform/storage';

const app = q('#app', HTMLElement);
const startPanel = q('[data-testid="start-panel"]', HTMLElement);
const startNormalButton = q('[data-testid="start-normal"]', HTMLButtonElement);
const startAdvancedButton = q('[data-testid="start-advanced"]', HTMLButtonElement);
const waveLabel = q('[data-testid="wave-label"]', HTMLElement);
const scoreLabel = q('[data-testid="score-label"]', HTMLElement);
const bestLabel = q('[data-testid="best-label"]', HTMLElement);
const modeLabel = q('[data-testid="mode-label"]', HTMLElement);
const stageTitle = q('[data-testid="stage-title"]', HTMLElement);
const waveProgress = q('[data-testid="wave-progress"]', HTMLElement);
const waveKills = q('[data-testid="wave-kills-label"]', HTMLElement);
const battleLane = q('[data-testid="battle-lane"]', HTMLElement);
const hpDisplay = q('[data-testid="hp-display"]', HTMLElement);
const buddyFigure = q('[data-testid="buddy-figure"]', HTMLElement);
const buddyChargeFill = q('[data-testid="buddy-charge-fill"]', HTMLElement);
const buddyChargeLabel = q('[data-testid="buddy-charge-label"]', HTMLElement);
const buddySkillButton = q('[data-testid="buddy-skill-button"]', HTMLButtonElement);
const targetInfo = q('[data-testid="kana-card"]', HTMLElement);
const kanaText = q('[data-testid="kana-text"]', HTMLElement);
const romajiTarget = q('[data-testid="romaji-target"]', HTMLElement);
const hintText = q('[data-testid="hint-text"]', HTMLElement);
const messageText = q('[data-testid="message"]', HTMLElement);
const resultPanel = q('[data-testid="result-panel"]', HTMLElement);
const resultRank = q('[data-testid="result-rank"]', HTMLElement);
const resultTitle = q('[data-testid="result-title"]', HTMLElement);
const resultSubtitle = q('[data-testid="result-subtitle"]', HTMLElement);
const resultStars = q('[data-testid="result-stars"]', HTMLElement);
const resultScore = q('[data-testid="result-score"]', HTMLElement);
const resultLevel = q('[data-testid="result-level"]', HTMLElement);
const resultAccuracy = q('[data-testid="result-accuracy"]', HTMLElement);
const resultMaxCombo = q('[data-testid="result-max-combo"]', HTMLElement);
const resultBestScore = q('[data-testid="result-best-score"]', HTMLElement);
const resultBestLevel = q('[data-testid="result-best-level"]', HTMLElement);
const keyboard = q('[data-testid="keyboard"]', HTMLElement);
const effectLayer = q('[data-testid="effect-layer"]', HTMLElement);
const nextButton = q('[data-testid="next-button"]', HTMLButtonElement);
const resetButton = q('[data-testid="reset-button"]', HTMLButtonElement);

let state = createInitialState({ save: loadSave() });
let started = false;
let lastRenderedFeedbackId = 0;

render();

window.setInterval(() => {
  if (started && state.status === 'playing') {
    dispatch({ type: 'TICK', elapsedMs: 200 });
  }
}, 200);

window.addEventListener('keydown', (event) => {
  if (!started) return;

  if (event.key === 'Backspace') {
    event.preventDefault();
    dispatch({ type: 'BACKSPACE' });
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    dispatch({ type: 'CAST_BUDDY_SKILL' });
    return;
  }
  if (event.key === ' ') {
    event.preventDefault();
    dispatch({ type: 'NEXT_CHALLENGE' });
    return;
  }
  if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    dispatch({ type: 'TYPE_KEY', key: event.key });
  }
});

startNormalButton.addEventListener('click', () => startGame('normal'));
startAdvancedButton.addEventListener('click', () => startGame('advanced'));
nextButton.addEventListener('click', () => {
  if (!started) return;
  dispatch({ type: 'NEXT_CHALLENGE' });
});
buddySkillButton.addEventListener('click', () => {
  if (!started) return;
  dispatch({ type: 'CAST_BUDDY_SKILL' });
});
resetButton.addEventListener('click', () => {
  if (!started) return;
  dispatch({ type: 'RESET' });
});

function dispatch(action: GameAction): HarnessSnapshot {
  if (!started) started = true;

  const prevBestScore = state.bestScore;
  const prevBestWave = state.bestWave;
  state = reduceGame(state, action);

  if (state.bestScore !== prevBestScore || state.bestWave !== prevBestWave) {
    saveProgress({ bestScore: state.bestScore, bestLevel: state.bestWave });
  }

  render();
  return snapshot();
}

function render(): void {
  const progress = stageProgress(state);
  const view = serializeState(state);

  app.dataset.status = state.status;
  app.dataset.bossWave = String(view.bossWave);
  app.dataset.started = String(started);
  app.dataset.mode = view.mode;

  renderStartPanel();
  modeLabel.textContent = view.mode === 'advanced' ? 'ADVANCED' : 'NORMAL';
  waveLabel.textContent = String(state.wave);
  scoreLabel.textContent = String(state.score);
  bestLabel.textContent = String(state.bestWave);

  stageTitle.textContent = view.bossWave ? `BOSS WAVE ${state.wave}` : `Wave ${state.wave}`;
  waveProgress.style.width = `${Math.round(progress.wavePercent * 100)}%`;
  waveKills.textContent = `${state.waveKills} / ${state.waveTarget}`;

  nextButton.disabled = !started;
  resetButton.disabled = !started;

  resultPanel.hidden = !view.result;
  if (view.result) {
    renderResultPanel(view);
    nextButton.textContent = 'Play Again';
  } else {
    nextButton.textContent = 'Release Lock [Space]';
  }

  renderHpDisplay(state.baseHp, state.maxBaseHp);
  const mood = guardianMood(state.baseHp, state.maxBaseHp);
  buddyFigure.dataset.form = waveGuardianForm(state.wave);
  buddyFigure.dataset.mood = mood;
  buddyFigure.dataset.ready = String(view.buddyReady);
  renderGuardianSupport(view);
  renderEnemies();
  renderTargetInfo(view);
  messageText.textContent = started
    ? state.message
    : 'Choose a mode to begin. First key locks a target. Enter casts burst.';
  renderKeyboard();
  playFeedbackEffect(state.feedbackEvent);
}

function renderHpDisplay(hp: number, max: number): void {
  hpDisplay.replaceChildren(
    ...Array.from({ length: max }, (_, index) => {
      const span = document.createElement('span');
      span.className = `hp-heart${index < hp ? '' : ' empty'}`;
      span.textContent = index < hp ? 'O' : 'x';
      return span;
    }),
  );
}

function guardianMood(hp: number, max: number): string {
  if (hp <= 0) return 'hurt';
  if (hp / max <= 0.4) return 'alert';
  return 'happy';
}

function waveGuardianForm(wave: number): string {
  if (wave >= 11) return 'astral';
  if (wave >= 7) return 'knight';
  return 'sentinel';
}

function renderGuardianSupport(view: ReturnType<typeof serializeState>): void {
  buddyChargeFill.style.width = `${view.buddyCharge}%`;
  buddyChargeLabel.textContent = view.buddyReady ? 'BURST READY' : `${view.buddyCharge}%`;
  const hasActiveEnemies = state.enemies.some((enemy) => enemy.status === 'approaching' || enemy.status === 'targeted');
  buddySkillButton.disabled = !(started && state.status === 'playing' && view.buddyReady && hasActiveEnemies);
  buddySkillButton.textContent = view.buddyReady ? 'ASTRAL BURST [ENTER]' : 'Charge burst to 100%';
}

function renderEnemies(): void {
  const liveIds = new Set(state.enemies.map((enemy) => enemy.id));
  for (const el of [...battleLane.querySelectorAll<HTMLElement>('.enemy')]) {
    const id = Number(el.dataset.id);
    if (!liveIds.has(id)) el.remove();
  }

  for (const enemy of state.enemies) {
    let el = battleLane.querySelector<HTMLElement>(`.enemy[data-id="${enemy.id}"]`);
    if (!el) {
      el = createEnemyElement(enemy.id);
      battleLane.append(el);
    }

    const trackPct = enemy.kind === 'boss' ? 38 : ([10, 40, 68][enemy.track] ?? 10);
    el.style.left = `${Math.min(99, enemy.position * 100)}%`;
    el.style.top = `${trackPct}%`;
    el.dataset.status = enemy.status;
    el.dataset.band = String(enemy.bandIndex);
    el.dataset.slow = String(enemy.slowTimer > 0);
    el.dataset.kind = enemy.kind;

    const roleEl = el.querySelector<HTMLElement>('.enemy-role');
    const kanaEl = el.querySelector<HTMLElement>('.enemy-kana');
    const romaEl = el.querySelector<HTMLElement>('.enemy-romaji');
    const bossEl = el.querySelector<HTMLElement>('.enemy-boss-progress');

    if (roleEl) {
      roleEl.textContent = enemy.kind === 'boss' ? `BOSS ${enemy.bossName ?? ''}` : '';
      roleEl.hidden = enemy.kind !== 'boss';
    }
    if (kanaEl) kanaEl.textContent = enemy.challenge.kana;
    if (romaEl) {
      const typed = enemy.challenge.romaji.slice(0, enemy.typed.length);
      const remain = enemy.challenge.romaji.slice(enemy.typed.length);
      romaEl.replaceChildren(
        ...(typed.length > 0 ? [makeSpan('typed-part', typed)] : []),
        ...(remain.length > 0 ? [makeSpan('remain-part', remain)] : []),
      );
    }
    if (bossEl) {
      bossEl.textContent = enemy.kind === 'boss'
        ? `Phase ${enemy.bossPhaseIndex + 1} / ${enemy.bossMaxPhases}`
        : '';
      bossEl.hidden = enemy.kind !== 'boss';
    }
  }
}

function createEnemyElement(id: number): HTMLElement {
  const div = document.createElement('div');
  div.className = 'enemy';
  div.dataset.id = String(id);
  div.innerHTML = `
    <div class="enemy-label">
      <span class="enemy-role" hidden></span>
      <span class="enemy-kana"></span>
      <div class="enemy-romaji"></div>
      <div class="enemy-boss-progress" hidden></div>
    </div>
    <div class="enemy-body">
      <div class="enemy-crown"></div>
      <div class="enemy-eye el"></div>
      <div class="enemy-eye er"></div>
      <div class="enemy-mouth"></div>
    </div>
  `;
  return div;
}

function makeSpan(cls: string, text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = cls;
  span.textContent = text;
  return span;
}

function renderTargetInfo(view: ReturnType<typeof serializeState>): void {
  const hasTarget = view.targetId !== null;
  targetInfo.dataset.empty = String(!hasTarget);
  targetInfo.dataset.boss = 'false';

  if (!hasTarget) {
    kanaText.textContent = '';
    hintText.textContent = 'Type the first matching letter to lock on. Space releases the lock.';
    romajiTarget.replaceChildren();
    return;
  }

  const targetEnemy = state.enemies.find((enemy) => enemy.id === view.targetId);
  kanaText.textContent = view.kana;
  targetInfo.dataset.boss = String(targetEnemy?.kind === 'boss');
  hintText.textContent = targetEnemy?.kind === 'boss'
    ? `BOSS ${targetEnemy.bossName}  Phase ${targetEnemy.bossPhaseIndex + 1}/${targetEnemy.bossMaxPhases}  ${targetEnemy.challenge.hint}`
    : targetEnemy?.challenge.hint ?? '';

  romajiTarget.replaceChildren(
    ...view.romaji.split('').map((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      if (index < view.typed.length) {
        span.className = 'typed';
      } else if (index === view.typed.length) {
        span.className = state.lastMistake ? 'next wrong-next' : 'next';
      }
      return span;
    }),
  );
}

function renderResultPanel(view: ReturnType<typeof serializeState>): void {
  const result = view.result;
  if (!result) return;

  resultRank.textContent = result.rank;
  resultTitle.textContent = result.title;
  resultSubtitle.textContent = result.subtitle;
  resultScore.textContent = String(result.score);
  resultLevel.textContent = `Wave ${result.wave}`;
  resultAccuracy.textContent = `${Math.round(result.accuracy * 100)}%`;
  resultMaxCombo.textContent = String(result.maxStreak);
  resultBestScore.textContent = result.newBestScore ? `${state.bestScore} NEW` : String(state.bestScore);
  resultBestLevel.textContent = result.newBestWave ? `Wave ${state.bestWave} NEW` : `Wave ${state.bestWave}`;

  resultStars.replaceChildren(
    ...Array.from({ length: 5 }, (_, index) => {
      const span = document.createElement('span');
      span.className = index < result.stars ? 'result-star filled' : 'result-star';
      span.textContent = '*';
      return span;
    }),
  );
}

function renderKeyboard(): void {
  const kbState = keyboardState(state);
  keyboard.replaceChildren(
    ...keyboardRows.map((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'key-row';
      rowEl.replaceChildren(
        ...row.split('').map((letter) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `key ${kbState[letter]}`;
          btn.dataset.key = letter;
          btn.dataset.testid = `key-${letter}`;
          btn.textContent = letter;
          btn.addEventListener('click', () => dispatch({ type: 'TYPE_KEY', key: letter }));
          return btn;
        }),
      );
      return rowEl;
    }),
  );
}

function playFeedbackEffect(event: FeedbackEvent | null): void {
  if (!event || event.id === lastRenderedFeedbackId) return;
  lastRenderedFeedbackId = event.id;

  switch (event.kind) {
    case 'correct':
      spawnParticles(['*', '+'], event.comboTier !== 'calm' ? 'clear' : 'kill', 4);
      if (event.comboTier !== 'calm') spawnBanner(comboText(event.comboTier), 'clear');
      break;
    case 'kill':
      spawnParticles(['*', '*', 'K'], 'kill', 7);
      spawnBanner(event.bossName ? `${event.bossName} BREAK` : 'KILL!', 'kill');
      break;
    case 'boss-phase':
      spawnParticles(['+', '+', '*'], 'wave', 12);
      spawnBanner('BOSS BREAK', 'wave big');
      break;
    case 'escape':
      spawnParticles(['!', '!'], 'mistake', 5);
      break;
    case 'mistake':
      spawnParticles(['!'], 'mistake', 3);
      break;
    case 'wave-up': {
      const nextWave = event.wave ?? state.wave;
      spawnParticles(['*', 'W', 'A', 'V'], 'wave', 12);
      spawnBanner(nextWave >= 3 && nextWave % 3 === 0 ? `BOSS WAVE ${nextWave}` : `WAVE ${nextWave}`, 'wave big');
      break;
    }
    case 'buddy-skill':
      spawnParticles(['+', '+', '*'], 'wave', 10);
      spawnBanner('ASTRAL BURST', 'clear big');
      break;
    case 'game-over':
      spawnParticles(['!', '!', '!'], 'mistake', 8);
      spawnBanner('GAME OVER', 'mistake big');
      break;
  }
}

function spawnParticles(glyphs: string[], tone: string, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.className = `fx-particle ${tone}`;
    particle.textContent = glyphs[index % glyphs.length];
    particle.style.setProperty('--fx-x', `${Math.round(-100 + Math.random() * 200)}px`);
    particle.style.setProperty('--fx-y', `${Math.round(-30 - Math.random() * 120)}px`);
    effectLayer.append(particle);
    window.setTimeout(() => particle.remove(), 900);
  }
}

function spawnBanner(text: string, tone: string): void {
  const banner = document.createElement('div');
  banner.className = `fx-banner ${tone}`;
  banner.textContent = text;
  effectLayer.append(banner);
  window.setTimeout(() => banner.remove(), 1000);
}

function comboText(tier: HarnessSnapshot['comboTier']): string {
  switch (tier) {
    case 'flow':
      return 'FLOW';
    case 'spark':
      return 'SPARK';
    case 'fever':
      return 'FEVER';
    default:
      return 'NICE';
  }
}

function renderStartPanel(): void {
  startPanel.hidden = started;
}

function startGame(mode: GameMode): void {
  started = true;
  lastRenderedFeedbackId = 0;
  state = createInitialState({
    seed: state.seed,
    save: { bestScore: state.bestScore, bestLevel: state.bestWave },
    mode,
  });
  render();
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
        save: { bestScore: state.bestScore, bestLevel: state.bestWave },
        mode: state.mode,
      });
    } else {
      state = createInitialState({
        seed: seedOrState?.seed ?? state.seed,
        save: seedOrState?.save ?? { bestScore: state.bestScore, bestLevel: state.bestWave },
        mode: seedOrState?.mode ?? state.mode,
      });
    }
    started = true;
    render();
    return snapshot();
  },
  loadStage(stageIndex: number) {
    started = true;
    state = reduceGame(state, { type: 'SET_STAGE', stageIndex });
    render();
    return snapshot();
  },
};

window.__GAME_HARNESS__ = harness;

function q<T extends Element>(selector: string, ctor: { new (...args: never[]): T }): T {
  const el = document.querySelector(selector);
  if (!(el instanceof ctor)) throw new Error(`Missing element: ${selector}`);
  return el;
}

