import { describe, expect, it } from 'vitest';
import { clearSave, loadSave, saveBest, storageKey } from '../../src/platform/storage.js';

describe('storage adapter', () => {
  it('loads an empty save when storage has no data', () => {
    const storage = createMemoryStorage();

    expect(loadSave(storage)).toEqual({ best: {} });
  });

  it('persists best scores', () => {
    const storage = createMemoryStorage();

    saveBest({ intro: 10 }, storage);

    expect(loadSave(storage)).toEqual({ best: { intro: 10 } });
  });

  it('recovers from invalid JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem(storageKey, '{');

    expect(loadSave(storage)).toEqual({ best: {} });
  });

  it('clears saved data', () => {
    const storage = createMemoryStorage();
    saveBest({ intro: 10 }, storage);
    clearSave(storage);

    expect(loadSave(storage)).toEqual({ best: {} });
  });
});

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
