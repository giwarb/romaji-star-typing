import { describe, expect, it } from 'vitest';
import { clearSave, emptySave, loadSave, saveProgress, storageKey } from '../../src/platform/storage';
import type { StorageAdapter } from '../../src/platform/storage';

describe('storage adapter', () => {
  it('loads an empty save when storage has no data', () => {
    const storage = createMemoryStorage();

    expect(loadSave(storage)).toEqual(emptySave());
  });

  it('persists best scores and unlocked stage', () => {
    const storage = createMemoryStorage();

    saveProgress({ best: { vowels: 120 }, unlockedStage: 2 }, storage);

    expect(loadSave(storage)).toEqual({ best: { vowels: 120 }, unlockedStage: 2 });
  });

  it('recovers from invalid JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem(storageKey, '{');

    expect(loadSave(storage)).toEqual(emptySave());
  });

  it('clears saved data', () => {
    const storage = createMemoryStorage();
    saveProgress({ best: { vowels: 120 }, unlockedStage: 2 }, storage);
    clearSave(storage);

    expect(loadSave(storage)).toEqual(emptySave());
  });
});

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}
