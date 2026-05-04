import { getBossBlueprint, getChallenge, makeChallengeOrder, stages } from './lessons';
import type {
  ComboTier,
  Enemy,
  EnemyStatus,
  FeedbackEvent,
  GameAction,
  GameMode,
  GameResult,
  GameState,
  KeyboardKeyState,
  SaveData,
  SerializedEnemy,
  SerializedGameState,
  Stage,
} from './types';

const maxBaseHp = 5;
const maxBuddyCharge = 100;
const buddyChargePerKey = 12;
const buddyChargePerKill = 18;
const buddyChargeBossBonus = 26;
const buddyChargeLossOnEscape = 20;
const buddySkillFreezeMs = 3000;
const bossSegmentPushback = 0.14;

function waveTargetKills(wave: number): number {
  return 6 + wave * 2;
}

function isBossWave(wave: number): boolean {
  return wave >= 3 && wave % 3 === 0;
}

function bandForWave(wave: number): number {
  if (wave >= 11) return 5;
  if (wave >= 9) return 4;
  if (wave >= 7) return 3;
  if (wave >= 5) return 2;
  if (wave >= 3) return 1;
  return 0;
}

function modeTuning(mode: GameMode): { spawnMultiplier: number; speedMultiplier: number; concurrentBonus: number } {
  if (mode === 'advanced') {
    return { spawnMultiplier: 0.45, speedMultiplier: 16, concurrentBonus: 3 };
  }
  return { spawnMultiplier: 1, speedMultiplier: 1, concurrentBonus: 1 };
}

function waveParams(wave: number, mode: GameMode): {
  stageIndex: number;
  spawnInterval: number;
  speed: number;
  maxConcurrent: number;
} {
  const bossWave = isBossWave(wave);
  const tuning = modeTuning(mode);
  const baseSpawnInterval = Math.max(1400, 4200 - (wave - 1) * 200) + (bossWave ? 240 : 0);
  const baseSpeed = Number((0.036 + (wave - 1) * 0.004).toFixed(4));
  return {
    stageIndex: bandForWave(wave),
    spawnInterval: Math.max(1100, Math.round(baseSpawnInterval * tuning.spawnMultiplier)),
    speed: Number((baseSpeed * tuning.speedMultiplier).toFixed(4)),
    maxConcurrent: bossWave
      ? Math.min(4 + Math.floor(wave / 10) + tuning.concurrentBonus, 8)
      : Math.min(3 + Math.floor((wave - 1) / 2) + tuning.concurrentBonus, 10),
  };
}

export function createInitialState({
  seed = 20260503,
  save = { bestScore: 0, bestLevel: 1 },
  stageIndex = 0,
  mode = 'normal',
}: {
  seed?: number;
  save?: SaveData;
  stageIndex?: number;
  mode?: GameMode;
} = {}): GameState {
  const startWave = waveForBandIndex(stageIndex);
  const params = waveParams(startWave, mode);
  return {
    mode,
    stages: stages.map((stage) => ({ ...stage, challenges: stage.challenges.map((challenge) => ({ ...challenge })) })),
    stageIndex: params.stageIndex,
    enemies: [],
    nextEnemyId: 1,
    spawnTimer: mode === 'advanced' ? 300 : 800,
    spawnInterval: params.spawnInterval,
    maxConcurrent: params.maxConcurrent,
    wave: startWave,
    waveKills: 0,
    waveTarget: waveTargetKills(startWave),
    bossSpawned: false,
    bossDefeated: !isBossWave(startWave),
    baseHp: maxBaseHp,
    maxBaseHp,
    score: 0,
    targetId: null,
    buddyCharge: 0,
    buddyReady: false,
    streak: 0,
    maxStreak: 0,
    correctKeys: 0,
    mistakes: 0,
    challengeCounter: 0,
    status: 'playing',
    message: isBossWave(startWave)
      ? `${mode === 'advanced' ? 'ADVANCED ' : ''}BOSS WAVE ${startWave}. Lock on with the first key and defend the shrine!`
      : `${mode === 'advanced' ? 'ADVANCED MODE.' : 'NORMAL MODE.'} Defend the shrine with first-letter lock-on!`,
    lastMistake: null,
    lastCorrectKey: null,
    feedbackEvent: null,
    result: null,
    bestScore: Math.max(0, save.bestScore),
    bestWave: Math.max(1, save.bestLevel),
    seed,
  };
}

function waveForBandIndex(stageIndex: number): number {
  const table = [1, 3, 5, 7, 9, 11];
  const safe = Math.max(0, Math.min(table.length - 1, stageIndex));
  return table[safe];
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TYPE_KEY':
      return typeKey(state, action.key);
    case 'BACKSPACE':
      return handleBackspace(state);
    case 'NEXT_CHALLENGE':
      return handleNextChallenge(state);
    case 'NEXT_STAGE':
      return createInitialState({ seed: state.seed, save: toSave(state), stageIndex: state.stageIndex + 1, mode: state.mode });
    case 'SET_STAGE':
      return createInitialState({ seed: state.seed, save: toSave(state), stageIndex: action.stageIndex, mode: state.mode });
    case 'CAST_BUDDY_SKILL':
      return castBuddySkill(state);
    case 'RESET':
      return createInitialState({ seed: action.seed ?? state.seed, save: action.save ?? toSave(state), mode: state.mode });
    case 'TICK':
      return tickClock(state, action.elapsedMs);
    default:
      return state;
  }
}

export function typeKey(state: GameState, rawKey: string): GameState {
  if (state.status !== 'playing') return state;
  const key = normalizeKey(rawKey);
  if (!key) return state;

  const target = findActiveTarget(state);
  if (target) {
    return typeOnTarget(state, target, key);
  }
  return acquireTarget(state, key);
}

function acquireTarget(state: GameState, key: string): GameState {
  const candidates = state.enemies.filter(
    (enemy) => enemy.status === 'approaching' && enemy.challenge.romaji[0] === key,
  );

  if (candidates.length === 0) {
    return {
      ...state,
      streak: 0,
      lastMistake: null,
      lastCorrectKey: null,
      feedbackEvent: makeFeedbackEvent(state, 'mistake', { key }),
      message: 'No matching enemy. Use the highlighted key to lock on.',
    };
  }

  const target = candidates.reduce((best, current) => {
    const bestPriority = best.position + (best.kind === 'boss' ? 0.08 : 0);
    const currentPriority = current.position + (current.kind === 'boss' ? 0.08 : 0);
    return currentPriority > bestPriority ? current : best;
  });

  const nextState: GameState = {
    ...state,
    targetId: target.id,
    enemies: state.enemies.map((enemy) => (enemy.id === target.id ? { ...enemy, status: 'targeted' as EnemyStatus } : enemy)),
    lastMistake: null,
    lastCorrectKey: null,
    feedbackEvent: null,
    message: target.kind === 'boss' ? `BOSS ${target.bossName} locked on!` : `Target locked: ${target.challenge.kana}`,
  };
  return typeOnTarget(nextState, { ...target, status: 'targeted' }, key);
}

function typeOnTarget(state: GameState, target: Enemy, key: string): GameState {
  const expected = target.challenge.romaji[target.typed.length];
  if (!expected) return state;

  if (key !== expected) {
    return {
      ...state,
      mistakes: state.mistakes + 1,
      streak: 0,
      lastMistake: { actual: key, expected, index: target.typed.length, challengeId: target.challenge.id },
      lastCorrectKey: null,
      feedbackEvent: makeFeedbackEvent(state, 'mistake', { key }),
      message: `Type ${expected} next. Reset and keep the line.`,
    };
  }

  const typed = target.typed + key;
  const streak = state.streak + 1;
  const maxStreak = Math.max(state.maxStreak, streak);
  const score = state.score + scoreForKey(streak, state.wave);
  const completed = typed === target.challenge.romaji;
  const buddy = buddyChargeState(state.buddyCharge, buddyChargePerKey);

  const updatedEnemies = state.enemies.map((enemy) =>
    enemy.id === target.id ? { ...enemy, typed, status: (completed ? 'dying' : 'targeted') as EnemyStatus, dieTimer: completed ? 400 : 0 } : enemy,
  );

  const baseState: GameState = {
    ...state,
    enemies: updatedEnemies,
    score,
    buddyCharge: buddy.buddyCharge,
    buddyReady: buddy.buddyReady,
    streak,
    maxStreak,
    correctKeys: state.correctKeys + 1,
    lastMistake: null,
    lastCorrectKey: key,
    feedbackEvent: makeFeedbackEvent(state, completed ? 'kill' : 'correct', {
      key,
      kana: completed ? target.challenge.kana : undefined,
      bossName: target.kind === 'boss' ? target.bossName ?? undefined : undefined,
    }),
    message: completed
      ? target.kind === 'boss'
        ? `${target.bossName} took a hit!`
        : `${target.challenge.kana} defeated!`
      : praise(streak),
  };

  if (!completed) return baseState;

  if (target.kind === 'boss' && target.bossPhaseIndex + 1 < target.bossMaxPhases) {
    return advanceBossPhase(baseState, target.id);
  }

  return handleEnemyDefeat(baseState, target.id, target.kind === 'boss' ? target.bossMaxPhases : 1);
}

function advanceBossPhase(state: GameState, enemyId: number): GameState {
  const boss = state.enemies.find((enemy) => enemy.id === enemyId && enemy.kind === 'boss');
  if (!boss) return state;

  const nextPhaseIndex = boss.bossPhaseIndex + 1;
  const nextChallenge = boss.bossSegments[nextPhaseIndex];
  if (!nextChallenge) return state;

  return {
    ...state,
    score: state.score + bossSegmentBonus(state.wave, nextPhaseIndex),
    enemies: state.enemies.map((enemy) => {
      if (enemy.id !== enemyId) return enemy;
      return {
        ...enemy,
        challenge: nextChallenge,
        typed: '',
        position: Math.max(0, enemy.position - bossSegmentPushback),
        status: 'targeted' as EnemyStatus,
        dieTimer: 0,
        bossPhaseIndex: nextPhaseIndex,
      };
    }),
    feedbackEvent: makeFeedbackEvent(state, 'boss-phase', { bossName: boss.bossName ?? undefined }),
    message: `${boss.bossName} pushed back. Next word: ${nextChallenge.kana}`,
  };
}

function handleEnemyDefeat(state: GameState, enemyId: number, killCount: number): GameState {
  const enemy = state.enemies.find((item) => item.id === enemyId);
  if (!enemy) return state;

  const bossKill = enemy.kind === 'boss';
  const bonus = bossKill
    ? bossKillBonus(state.wave, enemy.bossMaxPhases, state.streak)
    : killBonus(state.wave, enemy.challenge.romaji.length, state.streak);
  const buddy = buddyChargeState(
    state.buddyCharge,
    bossKill ? buddyChargePerKill + buddyChargeBossBonus : buddyChargePerKill,
  );
  const nextWaveKills = state.waveKills + killCount;
  const bossDefeated = state.bossDefeated || bossKill || !isBossWave(state.wave);
  const canAdvance = nextWaveKills >= state.waveTarget && bossDefeated;

  if (!canAdvance) {
    const params = waveParams(state.wave, state.mode);
    return {
      ...state,
      score: state.score + bonus,
      targetId: null,
      buddyCharge: buddy.buddyCharge,
      buddyReady: buddy.buddyReady,
      waveKills: nextWaveKills,
      bossDefeated,
      challengeCounter: state.challengeCounter + (bossKill ? 0 : 1),
      spawnInterval: params.spawnInterval,
      spawnTimer: Math.min(state.spawnTimer, params.spawnInterval * 0.6),
      message: bossKill ? `${enemy.bossName} defeated. More enemies incoming!` : state.message,
    };
  }

  const nextWave = state.wave + 1;
  const params = waveParams(nextWave, state.mode);
  return {
    ...state,
    score: state.score + bonus,
    targetId: null,
    buddyCharge: buddy.buddyCharge,
    buddyReady: buddy.buddyReady,
    wave: nextWave,
    waveKills: 0,
    waveTarget: waveTargetKills(nextWave),
    bossSpawned: false,
    bossDefeated: !isBossWave(nextWave),
    stageIndex: params.stageIndex,
    spawnInterval: params.spawnInterval,
    spawnTimer: params.spawnInterval,
    maxConcurrent: params.maxConcurrent,
    challengeCounter: state.challengeCounter + (bossKill ? 0 : 1),
    feedbackEvent: makeFeedbackEvent(state, 'wave-up', { wave: nextWave }),
    message: isBossWave(nextWave)
      ? `BOSS WAVE ${nextWave}. A stronger enemy is approaching!`
      : `Wave ${nextWave}. Target: ${waveTargetKills(nextWave)} defeats.`,
  };
}

function castBuddySkill(state: GameState): GameState {
  if (state.status !== 'playing' || !state.buddyReady) return state;

  const activeEnemies = state.enemies.filter((enemy) => enemy.status === 'approaching' || enemy.status === 'targeted');
  if (activeEnemies.length === 0) {
    return {
      ...state,
      message: 'Save the burst until enemies are in the lane.',
    };
  }

  return {
    ...state,
    buddyCharge: 0,
    buddyReady: false,
    enemies: state.enemies.map((enemy) => {
      if (enemy.status !== 'approaching' && enemy.status !== 'targeted') {
        return enemy;
      }
      return {
        ...enemy,
        slowTimer: Math.max(enemy.slowTimer, buddySkillFreezeMs),
      };
    }),
    feedbackEvent: makeFeedbackEvent(state, 'buddy-skill', {}),
    message: 'Astral burst stopped enemies for a few seconds!',
  };
}

function handleBackspace(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const target = findActiveTarget(state);
  if (!target) return state;

  const newTyped = target.typed.slice(0, -1);
  if (newTyped.length > 0) {
    return {
      ...state,
      enemies: state.enemies.map((enemy) => (enemy.id === target.id ? { ...enemy, typed: newTyped } : enemy)),
      lastMistake: null,
    };
  }

  return {
    ...state,
    targetId: null,
    enemies: state.enemies.map((enemy) =>
      enemy.id === target.id ? { ...enemy, status: 'approaching' as EnemyStatus, typed: '' } : enemy,
    ),
    message: 'Lock released. Switch targets if needed.',
  };
}

function handleNextChallenge(state: GameState): GameState {
  if (state.status === 'game-over') {
    return createInitialState({ seed: state.seed, save: toSave(state), mode: state.mode });
  }
  if (state.targetId === null) return state;

  return {
    ...state,
    targetId: null,
    enemies: state.enemies.map((enemy) =>
      enemy.id === state.targetId ? { ...enemy, status: 'approaching' as EnemyStatus, typed: '' } : enemy,
    ),
    message: 'Lock released. Pick another enemy.',
  };
}

function tickClock(state: GameState, elapsedMs: number): GameState {
  if (state.status !== 'playing') return state;

  const elapsed = Math.max(0, elapsedMs);
  let next = { ...state };

  const moved = moveEnemies(next, elapsed);
  next = moved.state;
  const escapedCount = moved.escapedCount;

  if (escapedCount > 0) {
    const newHp = next.baseHp - escapedCount;
    const buddy = buddyChargeState(next.buddyCharge, -escapedCount * buddyChargeLossOnEscape);
    if (newHp <= 0) {
      return buildGameOver({ ...next, baseHp: 0, buddyCharge: buddy.buddyCharge, buddyReady: buddy.buddyReady });
    }
    next = {
      ...next,
      baseHp: newHp,
      buddyCharge: buddy.buddyCharge,
      buddyReady: buddy.buddyReady,
      feedbackEvent: makeFeedbackEvent(next, 'escape', {}),
      message: newHp <= 2 ? 'The shrine is breaking. Hold the line!' : `Enemy escaped! HP ${newHp}/${maxBaseHp}`,
    };
  }

  next = {
    ...next,
    enemies: next.enemies
      .map((enemy) => (enemy.status === 'dying' ? { ...enemy, dieTimer: enemy.dieTimer - elapsed } : enemy))
      .filter(
        (enemy) =>
          enemy.status !== 'escaped' &&
          !(enemy.status === 'dying' && enemy.dieTimer <= 0),
      ),
  };

  if (next.targetId !== null && !next.enemies.some((enemy) => enemy.id === next.targetId)) {
    next = { ...next, targetId: null };
  }

  const newSpawnTimer = next.spawnTimer - elapsed;
  if (newSpawnTimer <= 0) {
    if (isBossWave(next.wave) && !next.bossSpawned) {
      const spawnedBoss = spawnBoss(next);
      next = {
        ...spawnedBoss.state,
        spawnTimer: Math.max(1200, next.spawnInterval * 0.9) + newSpawnTimer,
      };
    } else {
      const activeCount = next.enemies.filter(
        (enemy) => enemy.status === 'approaching' || enemy.status === 'targeted',
      ).length;
      if (activeCount < next.maxConcurrent) {
        const spawned = spawnEnemy(next);
        next = {
          ...spawned.state,
          spawnTimer: next.spawnInterval + newSpawnTimer,
        };
      } else {
        next = { ...next, spawnTimer: Math.max(300, next.spawnInterval * 0.5) };
      }
    }
  } else {
    next = { ...next, spawnTimer: newSpawnTimer };
  }

  return next;
}

function moveEnemies(state: GameState, elapsedMs: number): { state: GameState; escapedCount: number } {
  const elapsedSec = elapsedMs / 1000;
  let escapedCount = 0;
  let newTargetId = state.targetId;

  const enemies = state.enemies.map((enemy) => {
    if (enemy.status !== 'approaching' && enemy.status !== 'targeted') {
      if (enemy.slowTimer <= 0) return enemy;
      return { ...enemy, slowTimer: Math.max(0, enemy.slowTimer - elapsedMs) };
    }

    const slowTimer = Math.max(0, enemy.slowTimer - elapsedMs);
    const effectiveSpeed = enemy.speed * (enemy.slowTimer > 0 ? 0 : 1);
    const newPos = enemy.position + effectiveSpeed * elapsedSec;
    if (newPos >= 1.0) {
      escapedCount += 1;
      if (enemy.id === state.targetId) newTargetId = null;
      return { ...enemy, position: 1.0, status: 'escaped' as EnemyStatus, slowTimer };
    }
    return { ...enemy, position: newPos, slowTimer };
  });

  return { state: { ...state, enemies, targetId: newTargetId }, escapedCount };
}

function spawnEnemy(state: GameState): { state: GameState } {
  const stage = state.stages[state.stageIndex];
  const order = makeChallengeOrder(stage, state.seed + state.wave * 31 + state.nextEnemyId);
  const index = order[state.challengeCounter % order.length];
  const challenge = getChallenge(stage, index);
  const params = waveParams(state.wave, state.mode);
  const track = (state.nextEnemyId % 3) as 0 | 1 | 2;
  const speedVariance = 1 + ((state.nextEnemyId * 7) % 10) * 0.01 - 0.05;

  const enemy: Enemy = {
    id: state.nextEnemyId,
    kind: 'normal',
    challenge,
    typed: '',
    position: 0,
    speed: Number((params.speed * speedVariance).toFixed(4)),
    track,
    status: 'approaching',
    dieTimer: 0,
    slowTimer: 0,
    bandIndex: state.stageIndex,
    bossName: null,
    bossPhaseIndex: 0,
    bossMaxPhases: 0,
    bossSegments: [],
  };

  return {
    state: {
      ...state,
      enemies: [...state.enemies, enemy],
      nextEnemyId: state.nextEnemyId + 1,
    },
  };
}

function spawnBoss(state: GameState): { state: GameState } {
  const blueprint = getBossBlueprint(state.wave);
  const params = waveParams(state.wave, state.mode);
  const boss: Enemy = {
    id: state.nextEnemyId,
    kind: 'boss',
    challenge: blueprint.segments[0],
    typed: '',
    position: 0,
    speed: Number((params.speed * 0.82).toFixed(4)),
    track: 1,
    status: 'approaching',
    dieTimer: 0,
    slowTimer: 0,
    bandIndex: state.stageIndex,
    bossName: blueprint.name,
    bossPhaseIndex: 0,
    bossMaxPhases: blueprint.segments.length,
    bossSegments: blueprint.segments.map((segment) => ({ ...segment })),
  };

  return {
    state: {
      ...state,
      enemies: [...state.enemies, boss],
      nextEnemyId: state.nextEnemyId + 1,
      bossSpawned: true,
      message: `BOSS ${blueprint.name} appeared. Break every word phase!`,
    },
  };
}

function buildGameOver(state: GameState): GameState {
  const newBestScore = state.score > state.bestScore;
  const newBestWave = state.wave > state.bestWave;
  const bestScore = Math.max(state.bestScore, state.score);
  const bestWave = Math.max(state.bestWave, state.wave);
  const result = buildResult({ ...state, bestScore, bestWave }, newBestScore, newBestWave);

  return {
    ...state,
    targetId: null,
    status: 'game-over',
    message: 'The shrine fell. Regroup and try again.',
    bestScore,
    bestWave,
    feedbackEvent: makeFeedbackEvent(state, 'game-over', { wave: state.wave }),
    result,
  };
}

function buildResult(state: GameState, newBestScore: boolean, newBestWave: boolean): GameResult {
  const hitRate = accuracy(state);

  if (state.wave >= 15 && hitRate >= 0.93) {
    return { rank: 'SS', title: 'Legend Guardian', subtitle: 'You broke through the highest boss tier.', stars: 5, accuracy: hitRate, maxStreak: state.maxStreak, wave: state.wave, score: state.score, newBestScore, newBestWave };
  }
  if (state.wave >= 11 && hitRate >= 0.9) {
    return { rank: 'S', title: 'Boss Hunter', subtitle: 'Strong control through the late waves.', stars: 4, accuracy: hitRate, maxStreak: state.maxStreak, wave: state.wave, score: state.score, newBestScore, newBestWave };
  }
  if (state.wave >= 7 && hitRate >= 0.85) {
    return { rank: 'A', title: 'Veteran Defender', subtitle: 'You held the midgame pressure well.', stars: 3, accuracy: hitRate, maxStreak: state.maxStreak, wave: state.wave, score: state.score, newBestScore, newBestWave };
  }
  if (state.wave >= 4) {
    return { rank: 'B', title: 'Adventurer Rank', subtitle: 'Aim to clear the next boss wave.', stars: 2, accuracy: hitRate, maxStreak: state.maxStreak, wave: state.wave, score: state.score, newBestScore, newBestWave };
  }
  return { rank: 'C', title: 'Apprentice Guardian', subtitle: 'Start by learning the lock-on rhythm.', stars: 1, accuracy: hitRate, maxStreak: state.maxStreak, wave: state.wave, score: state.score, newBestScore, newBestWave };
}

export function currentStage(state: GameState): Stage {
  return state.stages[state.stageIndex];
}

export function serializeState(state: GameState): SerializedGameState {
  const stage = currentStage(state);
  const target = findActiveTarget(state);

  const enemies: SerializedEnemy[] = state.enemies.map((enemy) => ({
    id: enemy.id,
    kind: enemy.kind,
    kana: enemy.challenge.kana,
    romaji: enemy.challenge.romaji,
    typed: enemy.typed,
    remaining: enemy.challenge.romaji.slice(enemy.typed.length),
    position: enemy.position,
    track: enemy.track,
    status: enemy.status,
    bandIndex: enemy.bandIndex,
    slowTimer: enemy.slowTimer,
    bossName: enemy.bossName,
    bossPhaseIndex: enemy.bossPhaseIndex,
    bossMaxPhases: enemy.bossMaxPhases,
  }));

  return {
    mode: state.mode,
    stageId: stage.id,
    stageIndex: state.stageIndex,
    challengeId: target?.challenge.id ?? '',
    kana: target?.challenge.kana ?? '',
    romaji: target?.challenge.romaji ?? '',
    typed: target?.typed ?? '',
    remaining: target ? target.challenge.romaji.slice(target.typed.length) : '',
    wave: state.wave,
    waveKills: state.waveKills,
    waveTarget: state.waveTarget,
    bossWave: isBossWave(state.wave),
    bossDefeated: state.bossDefeated,
    baseHp: state.baseHp,
    maxBaseHp: state.maxBaseHp,
    enemies,
    targetId: state.targetId,
    score: state.score,
    buddyCharge: state.buddyCharge,
    buddyReady: state.buddyReady,
    streak: state.streak,
    maxStreak: state.maxStreak,
    correctKeys: state.correctKeys,
    mistakes: state.mistakes,
    accuracy: accuracy(state),
    comboTier: comboTier(state.streak),
    status: state.status,
    message: state.message,
    lastMistake: state.lastMistake,
    lastCorrectKey: state.lastCorrectKey,
    feedbackEvent: state.feedbackEvent,
    result: state.result,
    bestScore: state.bestScore,
    bestWave: state.bestWave,
  };
}

export function keyboardState(state: GameState): Record<string, KeyboardKeyState> {
  const keys: Record<string, KeyboardKeyState> = {};
  for (const key of keyboardKeys) {
    keys[key] = 'idle';
  }

  if (state.status !== 'playing') return keys;

  if (state.lastMistake) {
    keys[state.lastMistake.actual] = 'wrong';
    keys[state.lastMistake.expected] = 'expected';
    return keys;
  }

  if (state.lastCorrectKey) {
    keys[state.lastCorrectKey] = 'correct';
  }

  const target = findActiveTarget(state);
  if (target) {
    const expected = target.challenge.romaji[target.typed.length];
    if (expected) keys[expected] = 'next';
    return keys;
  }

  for (const enemy of state.enemies) {
    if (enemy.status !== 'approaching') continue;
    const first = enemy.challenge.romaji[0];
    if (first && keys[first] === 'idle') keys[first] = 'next';
  }

  return keys;
}

export function stageProgress(state: GameState): { wavePercent: number; hpPercent: number } {
  return {
    wavePercent: clamp(state.waveKills / state.waveTarget, 0, 1),
    hpPercent: clamp(state.baseHp / state.maxBaseHp, 0, 1),
  };
}

export function validateStage(stage: Stage): void {
  if (stage.challenges.length === 0) throw new Error(`Stage ${stage.id} must include challenges.`);
  for (const challenge of stage.challenges) {
    if (!/^[a-z]+$/.test(challenge.romaji)) throw new Error(`Challenge ${challenge.id} has invalid romaji.`);
    if (!challenge.kana || !challenge.hint) throw new Error(`Challenge ${challenge.id} is missing kana or hint.`);
  }
}

export const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
export const keyboardKeys = keyboardRows.flatMap((row) => row.split(''));

function findActiveTarget(state: GameState): Enemy | undefined {
  if (state.targetId === null) return undefined;
  return state.enemies.find((enemy) => enemy.id === state.targetId && enemy.status === 'targeted');
}

function scoreForKey(streak: number, wave: number): number {
  return 10 + Math.min(streak, 12) * 2 + wave;
}

function killBonus(wave: number, romajiLength: number, streak: number): number {
  const combo = comboTier(streak) === 'fever' ? 50 : comboTier(streak) === 'spark' ? 25 : comboTier(streak) === 'flow' ? 10 : 0;
  return 30 + wave * 10 + romajiLength * 15 + combo;
}

function bossSegmentBonus(wave: number, phaseIndex: number): number {
  return 40 + wave * 8 + phaseIndex * 15;
}

function bossKillBonus(wave: number, phases: number, streak: number): number {
  return 90 + wave * 18 + phases * 45 + (comboTier(streak) === 'fever' ? 80 : 30);
}

function buddyChargeState(currentCharge: number, delta: number): { buddyCharge: number; buddyReady: boolean } {
  const buddyCharge = clamp(currentCharge + delta, 0, maxBuddyCharge);
  return {
    buddyCharge,
    buddyReady: buddyCharge >= maxBuddyCharge,
  };
}

function accuracy(state: GameState): number {
  const total = state.correctKeys + state.mistakes;
  return total === 0 ? 1 : state.correctKeys / total;
}

function comboTier(streak: number): ComboTier {
  if (streak >= 10) return 'fever';
  if (streak >= 6) return 'spark';
  if (streak >= 3) return 'flow';
  return 'calm';
}

function praise(streak: number): string {
  switch (comboTier(streak)) {
    case 'fever':
      return 'FEVER! Keep pressing the attack.';
    case 'spark':
      return 'SPARK! Keep the pressure on.';
    case 'flow':
      return 'Good flow. Stay on the lane.';
    default:
      return 'Nice hit.';
  }
}

function normalizeKey(key: string): string | null {
  if (key.length === 1 && /^[a-z]$/i.test(key)) return key.toLowerCase();
  if (key.startsWith('Key') && key.length === 4) return key[3].toLowerCase();
  return null;
}

function makeFeedbackEvent(
  state: GameState,
  kind: FeedbackEvent['kind'],
  details: Omit<FeedbackEvent, 'id' | 'kind' | 'comboTier'> = {},
): FeedbackEvent {
  return {
    id: (state.feedbackEvent?.id ?? 0) + 1,
    kind,
    comboTier: comboTier(state.streak),
    ...details,
  };
}

function toSave(state: GameState): SaveData {
  return { bestScore: state.bestScore, bestLevel: state.bestWave };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

