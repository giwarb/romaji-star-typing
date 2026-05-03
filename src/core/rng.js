export function createRng(seed = 1) {
  let state = normalizeSeed(seed);

  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    get state() {
      return state;
    },
  };
}

export function normalizeSeed(seed) {
  const numeric = Number(seed);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return (Math.abs(Math.trunc(numeric)) || 1) >>> 0;
}
