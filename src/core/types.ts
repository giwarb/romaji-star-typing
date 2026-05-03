export type Point = {
  x: number;
  y: number;
};

export type Level = {
  id: string;
  name: string;
  width: number;
  height: number;
  start: Point;
  goal: Point;
  hazards: Point[];
  par: number;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type BestScores = Record<string, number>;

export type GameState = {
  level: Level;
  levelIndex: number;
  player: Point;
  moves: number;
  status: GameStatus;
  message: string;
  best: BestScores;
  history: Point[];
};

export type MoveKey =
  | 'ArrowUp'
  | 'KeyW'
  | 'ArrowDown'
  | 'KeyS'
  | 'ArrowLeft'
  | 'KeyA'
  | 'ArrowRight'
  | 'KeyD';

export type MoveAction = {
  type: 'MOVE';
  key: MoveKey;
};

export type ResetAction = {
  type: 'RESET';
  level?: Level;
  levelIndex?: number;
};

export type NextLevelAction = {
  type: 'NEXT_LEVEL';
  level: Level;
  levelIndex: number;
};

export type GameAction = MoveAction | ResetAction | NextLevelAction;

export type SerializedGameState = {
  levelId: string;
  levelIndex: number;
  player: Point;
  moves: number;
  status: GameStatus;
  message: string;
  best: BestScores;
  history: Point[];
};

export type HarnessSnapshot = SerializedGameState & {
  board: {
    columns: number;
    rows: number;
    cellCount: number;
    activeCell: string;
  };
};

export type HarnessResetInput =
  | number
  | string
  | {
      level: Level;
      levelIndex?: number;
    }
  | undefined;

export type GameHarness = {
  snapshot(): HarnessSnapshot;
  dispatch(action: GameAction): HarnessSnapshot;
  press(key: MoveKey): HarnessSnapshot;
  reset(seedOrState?: HarnessResetInput): HarnessSnapshot;
  loadLevel(level: Level): HarnessSnapshot;
};
