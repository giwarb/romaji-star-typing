import { describe, expect, it } from 'vitest';
import { getChallenge, getStage, makeChallengeOrder, stages } from '../../src/core/lessons';
import { validateStage } from '../../src/core/game';

describe('romaji lesson data', () => {
  it('defines a staged course from vowels to words', () => {
    expect(stages.map((stage) => stage.id)).toEqual([
      'vowels',
      'k-row',
      'mixed-basic',
      'dakuten',
      'combo',
      'words',
    ]);
    expect(stages[0].challenges[0]).toMatchObject({ kana: 'あ', romaji: 'a' });
    expect(stages.at(-1)?.challenges.some((challenge) => challenge.romaji.length >= 4)).toBe(true);
  });

  it('validates every stage and challenge', () => {
    for (const stage of stages) {
      expect(() => validateStage(stage)).not.toThrow();
    }
  });

  it('clones stages and generates deterministic challenge order', () => {
    const stage = getStage(1);
    stage.challenges[0].romaji = 'changed';

    expect(getStage(1).challenges[0].romaji).toBe('ka');
    expect(makeChallengeOrder(getStage(2), 42)).toEqual(makeChallengeOrder(getStage(2), 42));
    expect(getChallenge(getStage(0), 99).romaji).toMatch(/^[aeiou]$/);
  });
});
