import type { SaveData } from '../core/types';

const storageKey = 'romaji-typing-garden:save';

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSave(storage: StorageAdapter = localStorage): SaveData {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return emptySave();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SaveData> & {
      best?: Record<string, number>;
      unlockedStage?: number;
    };

    if (typeof parsed.bestScore === 'number' || typeof parsed.bestLevel === 'number') {
      return {
        bestScore: safeNumber(parsed.bestScore, 0),
        bestLevel: Math.max(1, safeNumber(parsed.bestLevel, 1)),
      };
    }

    const legacyBestScore = parsed.best ? Math.max(0, ...Object.values(parsed.best), 0) : 0;
    const legacyBestLevel = typeof parsed.unlockedStage === 'number' ? Math.max(1, parsed.unlockedStage + 1) : 1;
    return {
      bestScore: legacyBestScore,
      bestLevel: legacyBestLevel,
    };
  } catch {
    return emptySave();
  }
}

export function saveProgress(save: SaveData, storage: StorageAdapter = localStorage): void {
  storage.setItem(storageKey, JSON.stringify(save));
}

export function clearSave(storage: StorageAdapter = localStorage): void {
  storage.removeItem(storageKey);
}

export function emptySave(): SaveData {
  return { bestScore: 0, bestLevel: 1 };
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export { storageKey };
