const storageKey = 'html-game-ai-harness:save';

export function loadSave(storage = localStorage) {
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

export function saveBest(best, storage = localStorage) {
  storage.setItem(storageKey, JSON.stringify({ best }));
}

export function clearSave(storage = localStorage) {
  storage.removeItem(storageKey);
}

export { storageKey };
