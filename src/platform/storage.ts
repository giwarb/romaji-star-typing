import type { SaveData } from '../core/types';

const storageKey = 'romaji-typing-garden:save';

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSave(storage: StorageAdapter = localStorage): SaveData {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return emptySave();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
      unlockedStage: Number.isInteger(parsed.unlockedStage) ? parsed.unlockedStage ?? 0 : 0,
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
  return { best: {}, unlockedStage: 0 };
}

export { storageKey };
