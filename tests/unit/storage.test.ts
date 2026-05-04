import { describe, expect, it } from 'vitest';
import { clearSave, emptySave, loadSave, saveProgress } from '../../src/platform/storage';

class MockStorage {
  private data: Record<string, string> = {};
  getItem(k: string) { return this.data[k] ?? null; }
  setItem(k: string, v: string) { this.data[k] = v; }
  removeItem(k: string) { delete this.data[k]; }
}

describe('storage adapter (TD save format)', () => {
  it('returns empty save with no existing data', () => {
    const save = loadSave(new MockStorage());
    expect(save.bestScore).toBe(0);
    expect(save.bestLevel).toBe(1);
  });

  it('round-trips bestScore and bestLevel (wave)', () => {
    const storage = new MockStorage();
    saveProgress({ bestScore: 420, bestLevel: 7 }, storage);
    const loaded = loadSave(storage);
    expect(loaded.bestScore).toBe(420);
    expect(loaded.bestLevel).toBe(7);
  });

  it('clearSave removes data', () => {
    const storage = new MockStorage();
    saveProgress({ bestScore: 100, bestLevel: 3 }, storage);
    clearSave(storage);
    const loaded = loadSave(storage);
    expect(loaded.bestScore).toBe(0);
  });

  it('emptySave returns zeros', () => {
    expect(emptySave()).toEqual({ bestScore: 0, bestLevel: 1 });
  });

  it('migrates legacy format { best, unlockedStage }', () => {
    const storage = new MockStorage();
    storage.setItem('romaji-typing-garden:save', JSON.stringify({
      best: { vowels: 120, words: 920 },
      unlockedStage: 4,
    }));
    const loaded = loadSave(storage);
    expect(loaded.bestScore).toBe(920);
    expect(loaded.bestLevel).toBe(5);
  });
});
