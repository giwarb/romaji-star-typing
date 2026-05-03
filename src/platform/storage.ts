import type { BestScores } from '../core/types';

const storageKey = 'html-game-ai-harness:save';

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSave(storage: StorageAdapter = localStorage): { best: BestScores } {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return { best: {} };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
    };
  } catch {
    return { best: {} };
  }
}

export function saveBest(best: BestScores, storage: StorageAdapter = localStorage): void {
  storage.setItem(storageKey, JSON.stringify({ best }));
}

export function clearSave(storage: StorageAdapter = localStorage): void {
  storage.removeItem(storageKey);
}

export { storageKey };
