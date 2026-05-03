import { getChallenge, getStage, makeChallengeOrder, stages } from './lessons';
import type {
  Challenge,
  GameAction,
  GameState,
  KeyboardKeyState,
  SaveData,
  SerializedGameState,
  Stage,
  StageId,
} from './types';

export function createInitialState({
  seed = 20260503,
  save = { best: {}, unlockedStage: 0 },
  stageIndex = 0,
}: {
  seed?: number;
  save?: SaveData;
  stageIndex?: number;
} = {}): GameState {
  const safeStageIndex = clamp(stageIndex, 0, stages.length - 1);
  return {
    stages: stages.map((stage) => ({ ...stage, challenges: stage.challenges.map((c) => ({ ...c })) })),
    stageIndex: safeStageIndex,
    challengeIndex: 0,
    typed: '',
    score: 0,
    streak: 0,
    correctInStage: 0,
    mistakes: 0,
    status: 'playing',
    message: 'ローマ字をタイプして、ことばの星をあつめよう。',
    lastMistake: null,
    lastCorrectKey: null,
    best: save.best,
    unlockedStage: Math.max(save.unlockedStage, safeStageIndex),
    seed,
  };
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TYPE_KEY':
      return typeKey(state, action.key);
    case 'BACKSPACE':
      return {
        ...state,
        typed: state.typed.slice(0, -1),
        lastMistake: null,
        lastCorrectKey: null,
        message: '一文字もどしたよ。落ち着いて続けよう。',
      };
    case 'NEXT_CHALLENGE':
      return nextChallenge(state);
    case 'NEXT_STAGE':
      return goToStage(state, state.stageIndex + 1);
    case 'SET_STAGE':
      return goToStage(state, action.stageIndex);
    case 'RESET':
      return createInitialState({
        seed: action.seed ?? state.seed,
        save: action.save ?? { best: state.best, unlockedStage: state.unlockedStage },
        stageIndex: state.stageIndex,
      });
    default:
      return state;
  }
}

export function typeKey(state: GameState, rawKey: string): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const key = normalizeKey(rawKey);
  if (!key) {
    return state;
  }

  const challenge = currentChallenge(state);
  const expected = challenge.romaji[state.typed.length];
  if (!expected) {
    return nextChallenge(state);
  }

  if (key !== expected) {
    return {
      ...state,
      mistakes: state.mistakes + 1,
      streak: 0,
      lastMistake: {
        actual: key,
        expected,
        index: state.typed.length,
        challengeId: challenge.id,
      },
      lastCorrectKey: null,
      message: `今は「${expected}」のキーだよ。赤が押したキー、緑が正解。`,
    };
  }

  const typed = state.typed + key;
  const completed = typed === challenge.romaji;
  const streak = state.streak + 1;
  const score = state.score + 10 + Math.min(streak, 12) * 2;

  if (!completed) {
    return {
      ...state,
      typed,
      score,
      streak,
      lastMistake: null,
      lastCorrectKey: key,
      message: praise(streak),
    };
  }

  return completeChallenge({
    ...state,
    typed,
    score: score + 50,
    streak,
    correctInStage: state.correctInStage + 1,
    lastMistake: null,
    lastCorrectKey: key,
    message: `できた！「${challenge.kana}」は ${challenge.romaji}。`,
  });
}

export function currentStage(state: GameState): Stage {
  return state.stages[state.stageIndex];
}

export function currentChallenge(state: GameState): Challenge {
  const stage = currentStage(state);
  const order = makeChallengeOrder(stage, state.seed + state.correctInStage);
  return getChallenge(stage, order[state.challengeIndex % order.length]);
}

export function serializeState(state: GameState): SerializedGameState {
  const stage = currentStage(state);
  const challenge = currentChallenge(state);
  return {
    stageId: stage.id,
    stageIndex: state.stageIndex,
    challengeId: challenge.id,
    kana: challenge.kana,
    romaji: challenge.romaji,
    typed: state.typed,
    remaining: challenge.romaji.slice(state.typed.length),
    score: state.score,
    streak: state.streak,
    correctInStage: state.correctInStage,
    requiredCorrect: stage.requiredCorrect,
    mistakes: state.mistakes,
    status: state.status,
    message: state.message,
    lastMistake: state.lastMistake,
    lastCorrectKey: state.lastCorrectKey,
    unlockedStage: state.unlockedStage,
    best: state.best,
  };
}

export function keyboardState(state: GameState): Record<string, KeyboardKeyState> {
  const challenge = currentChallenge(state);
  const expected = challenge.romaji[state.typed.length];
  const keys: Record<string, KeyboardKeyState> = {};

  for (const key of keyboardKeys) {
    keys[key] = 'idle';
  }
  if (expected) {
    keys[expected] = 'expected';
  }
  if (state.lastCorrectKey) {
    keys[state.lastCorrectKey] = 'correct';
  }
  if (state.lastMistake) {
    keys[state.lastMistake.expected] = 'expected';
    keys[state.lastMistake.actual] = 'wrong';
  }
  if (!state.lastMistake && expected) {
    keys[expected] = state.lastCorrectKey === expected ? 'correct' : 'next';
  }
  return keys;
}

export function validateStage(stage: Stage): void {
  if (stage.challenges.length === 0) {
    throw new Error(`Stage ${stage.id} must include challenges.`);
  }
  for (const challenge of stage.challenges) {
    if (!/^[a-z]+$/.test(challenge.romaji)) {
      throw new Error(`Challenge ${challenge.id} has invalid romaji.`);
    }
    if (!challenge.kana || !challenge.hint) {
      throw new Error(`Challenge ${challenge.id} is missing kana or hint.`);
    }
  }
}

export function stageProgress(state: GameState): {
  stagePercent: number;
  coursePercent: number;
} {
  const stage = currentStage(state);
  const stagePercent = clamp(state.correctInStage / stage.requiredCorrect, 0, 1);
  const completedBefore = state.stages
    .slice(0, state.stageIndex)
    .reduce((sum, item) => sum + item.requiredCorrect, 0);
  const total = state.stages.reduce((sum, item) => sum + item.requiredCorrect, 0);
  return {
    stagePercent,
    coursePercent: clamp((completedBefore + state.correctInStage) / total, 0, 1),
  };
}

export const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
export const keyboardKeys = keyboardRows.flatMap((row) => row.split(''));

function completeChallenge(state: GameState): GameState {
  const stage = currentStage(state);
  const best = updateBest(state.best, stage.id, state.score);
  const stageDone = state.correctInStage >= stage.requiredCorrect;

  if (!stageDone) {
    return {
      ...state,
      best,
      status: 'playing',
      message: `${state.message} 次もいけるよ。`,
    };
  }

  const courseDone = state.stageIndex >= state.stages.length - 1;
  return {
    ...state,
    best,
    status: courseDone ? 'course-complete' : 'stage-complete',
    unlockedStage: Math.max(state.unlockedStage, state.stageIndex + (courseDone ? 0 : 1)),
    message: courseDone
      ? 'ローマ字マスター！ぜんぶのステージをクリアしたよ。'
      : 'ステージクリア！次の音に進めるよ。',
  };
}

function nextChallenge(state: GameState): GameState {
  if (state.status === 'stage-complete') {
    return goToStage(state, state.stageIndex + 1);
  }
  if (state.status === 'course-complete') {
    return state;
  }
  return {
    ...state,
    typed: '',
    challengeIndex: state.challengeIndex + 1,
    lastMistake: null,
    lastCorrectKey: null,
    message: '次の問題。指をホームポジションにもどそう。',
  };
}

function goToStage(state: GameState, targetIndex: number): GameState {
  const stageIndex = clamp(targetIndex, 0, state.stages.length - 1);
  return {
    ...state,
    stageIndex,
    challengeIndex: 0,
    typed: '',
    correctInStage: 0,
    status: 'playing',
    lastMistake: null,
    lastCorrectKey: null,
    unlockedStage: Math.max(state.unlockedStage, stageIndex),
    message: `${getStage(stageIndex).name}、スタート！`,
  };
}

function updateBest(best: Partial<Record<StageId, number>>, stageId: StageId, score: number) {
  return {
    ...best,
    [stageId]: Math.max(best[stageId] ?? 0, score),
  };
}

function normalizeKey(key: string): string | null {
  if (key.length === 1 && /^[a-z]$/i.test(key)) {
    return key.toLowerCase();
  }
  if (key.startsWith('Key') && key.length === 4) {
    return key[3].toLowerCase();
  }
  return null;
}

function praise(streak: number): string {
  if (streak >= 12) {
    return 'すごい集中！コンボが光ってる。';
  }
  if (streak >= 6) {
    return 'いいリズム！その調子。';
  }
  return 'ナイスキー！';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
