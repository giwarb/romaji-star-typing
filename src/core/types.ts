export type StageId = 'vowels' | 'k-row' | 'mixed-basic' | 'dakuten' | 'combo' | 'words';

export type Challenge = {
  id: string;
  kana: string;
  romaji: string;
  hint: string;
  group: string;
};

export type BossBlueprint = {
  id: string;
  name: string;
  segments: Challenge[];
};

export type Stage = {
  id: StageId;
  name: string;
  badge: string;
  description: string;
  requiredCorrect: number;
  timeLimitMs: number;
  clearBonusMs: number;
  mistakePenaltyMs: number;
  challenges: Challenge[];
};

export type KeyboardKeyState = 'idle' | 'correct' | 'wrong' | 'expected' | 'next';

export type LastMistake = {
  actual: string;
  expected: string;
  index: number;
  challengeId: string;
};

export type SaveData = {
  bestScore: number;
  bestLevel: number;
};

export type GameMode = 'normal' | 'advanced';

export type EnemyStatus = 'approaching' | 'targeted' | 'dying' | 'escaped';
export type EnemyKind = 'normal' | 'boss';

export type Enemy = {
  id: number;
  kind: EnemyKind;
  challenge: Challenge;
  typed: string;
  position: number;
  speed: number;
  track: 0 | 1 | 2;
  status: EnemyStatus;
  dieTimer: number;
  slowTimer: number;
  bandIndex: number;
  bossName: string | null;
  bossPhaseIndex: number;
  bossMaxPhases: number;
  bossSegments: Challenge[];
};

export type GameStatus = 'playing' | 'game-over';

export type ComboTier = 'calm' | 'flow' | 'spark' | 'fever';

export type EffectKind =
  | 'correct'
  | 'mistake'
  | 'kill'
  | 'escape'
  | 'wave-up'
  | 'buddy-skill'
  | 'boss-phase'
  | 'game-over';

export type FeedbackEvent = {
  id: number;
  kind: EffectKind;
  comboTier: ComboTier;
  key?: string;
  kana?: string;
  wave?: number;
  bossName?: string;
};

export type GameResult = {
  rank: 'SS' | 'S' | 'A' | 'B' | 'C';
  title: string;
  subtitle: string;
  stars: number;
  accuracy: number;
  maxStreak: number;
  wave: number;
  score: number;
  newBestScore: boolean;
  newBestWave: boolean;
};

export type GameState = {
  mode: GameMode;
  stages: Stage[];
  stageIndex: number;
  enemies: Enemy[];
  nextEnemyId: number;
  spawnTimer: number;
  spawnInterval: number;
  maxConcurrent: number;
  wave: number;
  waveKills: number;
  waveTarget: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  baseHp: number;
  maxBaseHp: number;
  score: number;
  targetId: number | null;
  buddyCharge: number;
  buddyReady: boolean;
  streak: number;
  maxStreak: number;
  correctKeys: number;
  mistakes: number;
  challengeCounter: number;
  status: GameStatus;
  message: string;
  lastMistake: LastMistake | null;
  lastCorrectKey: string | null;
  feedbackEvent: FeedbackEvent | null;
  result: GameResult | null;
  bestScore: number;
  bestWave: number;
  seed: number;
};

export type TypeKeyAction = { type: 'TYPE_KEY'; key: string };
export type BackspaceAction = { type: 'BACKSPACE' };
export type NextChallengeAction = { type: 'NEXT_CHALLENGE' };
export type NextStageAction = { type: 'NEXT_STAGE' };
export type SetStageAction = { type: 'SET_STAGE'; stageIndex: number };
export type CastBuddySkillAction = { type: 'CAST_BUDDY_SKILL' };
export type ResetAction = { type: 'RESET'; seed?: number; save?: SaveData };
export type TickAction = { type: 'TICK'; elapsedMs: number };

export type GameAction =
  | TypeKeyAction
  | BackspaceAction
  | NextChallengeAction
  | NextStageAction
  | SetStageAction
  | CastBuddySkillAction
  | ResetAction
  | TickAction;

export type SerializedEnemy = {
  id: number;
  kind: EnemyKind;
  kana: string;
  romaji: string;
  typed: string;
  remaining: string;
  position: number;
  track: 0 | 1 | 2;
  status: EnemyStatus;
  bandIndex: number;
  slowTimer: number;
  bossName: string | null;
  bossPhaseIndex: number;
  bossMaxPhases: number;
};

export type SerializedGameState = {
  mode: GameMode;
  stageId: StageId;
  stageIndex: number;
  challengeId: string;
  kana: string;
  romaji: string;
  typed: string;
  remaining: string;
  wave: number;
  waveKills: number;
  waveTarget: number;
  bossWave: boolean;
  bossDefeated: boolean;
  baseHp: number;
  maxBaseHp: number;
  enemies: SerializedEnemy[];
  targetId: number | null;
  score: number;
  buddyCharge: number;
  buddyReady: boolean;
  streak: number;
  maxStreak: number;
  correctKeys: number;
  mistakes: number;
  accuracy: number;
  comboTier: ComboTier;
  status: GameStatus;
  message: string;
  lastMistake: LastMistake | null;
  lastCorrectKey: string | null;
  feedbackEvent: FeedbackEvent | null;
  result: GameResult | null;
  bestScore: number;
  bestWave: number;
};

export type HarnessSnapshot = SerializedGameState & {
  keyboard: Record<string, KeyboardKeyState>;
  progress: {
    wavePercent: number;
    hpPercent: number;
  };
};

export type HarnessResetInput =
  | number
  | {
      seed?: number;
      save?: SaveData;
      mode?: GameMode;
    }
  | undefined;

export type GameHarness = {
  snapshot(): HarnessSnapshot;
  dispatch(action: GameAction): HarnessSnapshot;
  press(key: string): HarnessSnapshot;
  reset(seedOrState?: HarnessResetInput): HarnessSnapshot;
  loadStage(stageIndex: number): HarnessSnapshot;
};
