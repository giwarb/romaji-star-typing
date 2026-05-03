import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  keyboardToAction,
  movePlayer,
  reduceGame,
  serializeState,
  validateLevel,
} from '../../src/core/game.js';
import { getLevel } from '../../src/core/levels.js';

describe('game model', () => {
  it('creates a serializable initial state from a level', () => {
    const state = createInitialState({ level: getLevel(0) });

    expect(state.player).toEqual({ x: 0, y: 0 });
    expect(state.moves).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('moves with keyboard codes and clamps against walls', () => {
    const state = createInitialState({ level: getLevel(0) });

    expect(movePlayer(state, 'ArrowLeft').player).toEqual({ x: 0, y: 0 });
    expect(movePlayer(state, 'ArrowRight').player).toEqual({ x: 1, y: 0 });
  });

  it('loses when the player enters a hazard', () => {
    const state = createInitialState({ level: getLevel(0) });
    const afterMoves = ['ArrowRight', 'ArrowRight', 'ArrowDown'].reduce(
      (current, key) => reduceGame(current, { type: 'MOVE', key }),
      state,
    );

    expect(afterMoves.player).toEqual({ x: 2, y: 1 });
    expect(afterMoves.status).toBe('lost');
  });

  it('wins and records best score when the goal is reached', () => {
    const state = createInitialState({ level: getLevel(0) });
    const route = [
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
    ];

    const result = route.reduce(
      (current, key) => reduceGame(current, { type: 'MOVE', key }),
      state,
    );

    expect(result.status).toBe('won');
    expect(result.best.intro).toBe(10);
  });

  it('maps only supported keyboard codes to actions', () => {
    expect(keyboardToAction('KeyW')).toEqual({ type: 'MOVE', key: 'KeyW' });
    expect(keyboardToAction('Space')).toBeNull();
  });

  it('ignores unknown actions, unknown movement keys, and moves after terminal states', () => {
    const state = createInitialState({ level: getLevel(0) });
    const wonState = {
      ...state,
      status: 'won',
    };

    expect(reduceGame(state, { type: 'WAIT' })).toBe(state);
    expect(movePlayer(state, 'Space')).toBe(state);
    expect(movePlayer(wonState, 'ArrowRight')).toBe(wonState);
  });

  it('resets current and next levels while preserving best scores', () => {
    const state = createInitialState({ level: getLevel(0), best: { intro: 10 } });
    const nextLevel = getLevel(1);

    const next = reduceGame(state, {
      type: 'NEXT_LEVEL',
      level: nextLevel,
      levelIndex: 1,
    });
    const reset = reduceGame(next, { type: 'RESET' });

    expect(next.level.id).toBe('switchback');
    expect(next.best).toEqual({ intro: 10 });
    expect(reset.player).toEqual(nextLevel.start);
    expect(reset.best).toEqual({ intro: 10 });
  });

  it('serializes state without leaking mutable references', () => {
    const state = createInitialState({ level: getLevel(0), best: { intro: 10 } });
    const snapshot = serializeState(state);

    snapshot.player.x = 99;
    snapshot.history[0].x = 99;
    snapshot.best.intro = 1;

    expect(state.player.x).toBe(0);
    expect(state.history[0].x).toBe(0);
    expect(state.best.intro).toBe(10);
  });

  it('keeps lower best scores and reports over-par wins', () => {
    const level = {
      ...getLevel(0),
      par: 1,
    };
    const state = createInitialState({ level, best: { intro: 5 } });
    const route = [
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
      'ArrowDown',
    ];

    const result = route.reduce(
      (current, key) => reduceGame(current, { type: 'MOVE', key }),
      state,
    );

    expect(result.best.intro).toBe(5);
    expect(result.message).toBe('Gate reached. Try trimming the route.');
  });

  it('rejects invalid levels before they reach rendering', () => {
    expect(() =>
      validateLevel({
        id: 'bad',
        name: 'Bad',
        width: 2,
        height: 2,
        start: { x: 0, y: 0 },
        goal: { x: 1, y: 1 },
        hazards: [{ x: 0, y: 0 }],
        par: 2,
      }),
    ).toThrow('Start and goal');
  });

  it('rejects invalid level sizes and out-of-bounds points', () => {
    expect(() =>
      validateLevel({
        id: 'tiny',
        name: 'Tiny',
        width: 1,
        height: 2,
        start: { x: 0, y: 0 },
        goal: { x: 0, y: 1 },
        hazards: [],
        par: 1,
      }),
    ).toThrow('integer width and height');

    expect(() =>
      validateLevel({
        id: 'outside',
        name: 'Outside',
        width: 2,
        height: 2,
        start: { x: 0, y: 0 },
        goal: { x: 2, y: 1 },
        hazards: [],
        par: 1,
      }),
    ).toThrow('outside the level');
  });
});
