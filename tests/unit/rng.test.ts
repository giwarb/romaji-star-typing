import { describe, expect, it } from 'vitest';
import { createRng, normalizeSeed } from '../../src/core/rng';

describe('deterministic rng', () => {
  it('normalizes invalid, zero, fractional, and negative seeds', () => {
    expect(normalizeSeed('nope')).toBe(1);
    expect(normalizeSeed(0)).toBe(1);
    expect(normalizeSeed(-3.9)).toBe(3);
  });

  it('returns reproducible values and exposes current state', () => {
    const first = createRng(42);
    const second = createRng(42);

    expect(first.state).toBe(42);
    expect(first.next()).toBe(second.next());
    expect(first.state).toBe(second.state);
    expect(first.next()).toBeGreaterThanOrEqual(0);
    expect(first.next()).toBeLessThan(1);
  });
});
