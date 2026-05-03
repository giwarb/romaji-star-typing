import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  currentChallenge,
  currentStage,
  keyboardState,
  reduceGame,
  serializeState,
  stageProgress,
  typeKey,
  validateStage,
} from '../../src/core/game';
import { stages } from '../../src/core/lessons';

describe('romaji typing game model', () => {
  it('starts on the vowel stage with a serializable prompt', () => {
    const state = createInitialState({ seed: 1 });
    const snapshot = serializeState(state);

    expect(currentStage(state).id).toBe('vowels');
    expect(snapshot.kana).toBeTruthy();
    expect(snapshot.romaji).toMatch(/^[aeiou]$/);
    expect(snapshot.status).toBe('playing');
  });

  it('accepts correct typing and advances typed progress', () => {
    const state = createInitialState({ seed: 1 });
    const challenge = currentChallenge(state);
    const result = typeKey(state, challenge.romaji[0]);

    expect(result.typed).toBe(challenge.romaji[0]);
    expect(result.score).toBeGreaterThan(0);
    expect(result.lastCorrectKey).toBe(challenge.romaji[0]);
    expect(result.lastMistake).toBeNull();
  });

  it('highlights both actual and expected keys after a mistake', () => {
    const state = createInitialState({ seed: 1 });
    const challenge = currentChallenge(state);
    const wrongKey = challenge.romaji[0] === 'a' ? 's' : 'a';
    const result = typeKey(state, wrongKey);
    const keys = keyboardState(result);

    expect(result.mistakes).toBe(1);
    expect(result.lastMistake).toMatchObject({ actual: wrongKey, expected: challenge.romaji[0] });
    expect(keys[wrongKey]).toBe('wrong');
    expect(keys[challenge.romaji[0]]).toBe('expected');
  });

  it('completes challenges and unlocks the next stage', () => {
    let state = createInitialState({ seed: 1 });
    const stage = currentStage(state);

    for (let count = 0; count < stage.requiredCorrect; count += 1) {
      const challenge = currentChallenge(state);
      for (const key of challenge.romaji) {
        state = typeKey(state, key);
      }
      if (count < stage.requiredCorrect - 1) {
        state = reduceGame(state, { type: 'NEXT_CHALLENGE' });
      }
    }

    expect(state.status).toBe('stage-complete');
    expect(state.unlockedStage).toBe(1);
    expect(state.best.vowels).toBeGreaterThan(0);
  });

  it('moves between stages and resets while keeping save data', () => {
    const state = createInitialState({ save: { best: { vowels: 100 }, unlockedStage: 2 } });
    const next = reduceGame(state, { type: 'SET_STAGE', stageIndex: 2 });
    const reset = reduceGame(next, { type: 'RESET' });

    expect(currentStage(next).id).toBe('mixed-basic');
    expect(reset.best.vowels).toBe(100);
    expect(reset.unlockedStage).toBe(2);
  });

  it('reports progress as bounded ratios', () => {
    const state = createInitialState();
    const progress = stageProgress(state);

    expect(progress.stagePercent).toBeGreaterThanOrEqual(0);
    expect(progress.coursePercent).toBeGreaterThanOrEqual(0);
    expect(progress.coursePercent).toBeLessThanOrEqual(1);
  });

  it('rejects invalid stage data', () => {
    expect(() =>
      validateStage({
        ...stages[0],
        challenges: [{ id: 'bad', kana: 'あ', romaji: 'a1', hint: '', group: 'bad' }],
      }),
    ).toThrow('invalid romaji');
  });
});
