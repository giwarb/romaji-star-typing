export type StageId = 'vowels' | 'k-row' | 'mixed-basic' | 'dakuten' | 'combo' | 'words';

export type Challenge = {
  id: string;
  kana: string;
  romaji: string;
  hint: string;
  group: string;
};

export type Stage = {
  id: StageId;
  name: string;
  badge: string;
  description: string;
  requiredCorrect: number;
  challenges: Challenge[];
};

export type KeyboardKeyState = 'idle' | 'correct' | 'wrong' | 'expected' | 'next';

export type LastMistake = {
  actual: string;
  expected: string;
  index: number;
  challengeId: string;
};

export type BestScores = Record<StageId, number>;

export type SaveData = {
  best: Partial<BestScores>;
  unlockedStage: number;
};

export type GameStatus = 'playing' | 'stage-complete' | 'course-complete';

export type GameState = {
  stages: Stage[];
  stageIndex: number;
  challengeIndex: number;
  typed: string;
  score: number;
  streak: number;
  correctInStage: number;
  mistakes: number;
  status: GameStatus;
  message: string;
  lastMistake: LastMistake | null;
  lastCorrectKey: string | null;
  best: Partial<BestScores>;
  unlockedStage: number;
  seed: number;
};

export type TypeKeyAction = {
  type: 'TYPE_KEY';
  key: string;
};

export type BackspaceAction = {
  type: 'BACKSPACE';
};

export type NextChallengeAction = {
  type: 'NEXT_CHALLENGE';
};

export type NextStageAction = {
  type: 'NEXT_STAGE';
};

export type SetStageAction = {
  type: 'SET_STAGE';
  stageIndex: number;
};

export type ResetAction = {
  type: 'RESET';
  seed?: number;
  save?: SaveData;
};

export type GameAction =
  | TypeKeyAction
  | BackspaceAction
  | NextChallengeAction
  | NextStageAction
  | SetStageAction
  | ResetAction;

export type SerializedGameState = {
  stageId: StageId;
  stageIndex: number;
  challengeId: string;
  kana: string;
  romaji: string;
  typed: string;
  remaining: string;
  score: number;
  streak: number;
  correctInStage: number;
  requiredCorrect: number;
  mistakes: number;
  status: GameStatus;
  message: string;
  lastMistake: LastMistake | null;
  lastCorrectKey: string | null;
  unlockedStage: number;
  best: Partial<BestScores>;
};

export type HarnessSnapshot = SerializedGameState & {
  keyboard: Record<string, KeyboardKeyState>;
  progress: {
    stagePercent: number;
    coursePercent: number;
  };
};

export type HarnessResetInput =
  | number
  | {
      seed?: number;
      save?: SaveData;
    }
  | undefined;

export type GameHarness = {
  snapshot(): HarnessSnapshot;
  dispatch(action: GameAction): HarnessSnapshot;
  press(key: string): HarnessSnapshot;
  reset(seedOrState?: HarnessResetInput): HarnessSnapshot;
  loadStage(stageIndex: number): HarnessSnapshot;
};
