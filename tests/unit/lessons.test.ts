import { describe, expect, it } from 'vitest';
import { stages } from '../../src/core/lessons';

describe('TD lessons band data', () => {
  it('has 6 bands', () => {
    expect(stages).toHaveLength(6);
  });

  it('each band has enough challenges', () => {
    for (const stage of stages) {
      expect(stage.challenges.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('words band has at least 20 entries', () => {
    const wordStage = stages.find((s) => s.id === 'words');
    expect(wordStage).toBeDefined();
    expect(wordStage!.challenges.length).toBeGreaterThanOrEqual(20);
  });

  it('words band average romaji length >= 4', () => {
    const wordStage = stages.find((s) => s.id === 'words')!;
    const avg = wordStage.challenges.reduce((sum, c) => sum + c.romaji.length, 0) / wordStage.challenges.length;
    expect(avg).toBeGreaterThanOrEqual(4);
  });

  it('vowels band has only single-char romaji', () => {
    const vowels = stages.find((s) => s.id === 'vowels')!;
    for (const c of vowels.challenges) {
      expect(c.romaji).toHaveLength(1);
    }
  });

  it('all romaji contain only lowercase a-z', () => {
    for (const stage of stages) {
      for (const c of stage.challenges) {
        expect(c.romaji).toMatch(/^[a-z]+$/);
        expect(c.kana.length).toBeGreaterThan(0);
        expect(c.hint.length).toBeGreaterThan(0);
      }
    }
  });
});
