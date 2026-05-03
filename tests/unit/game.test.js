import { describe, expect, it } from 'vitest';
import { createInitialState, keyboardToAction, movePlayer, reduceGame, validateLevel } from '../../src/core/game.js';
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
});
