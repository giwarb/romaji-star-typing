import { describe, expect, it } from 'vitest';
import { generateSeededLevel, getLevel } from '../../src/core/levels.js';

describe('levels', () => {
  it('returns cloned base levels', () => {
    const level = getLevel(0);
    level.start.x = 99;

    expect(getLevel(0).start.x).toBe(0);
  });

  it('generates deterministic seeded levels without blocking start or goal', () => {
    const first = generateSeededLevel(42);
    const second = generateSeededLevel(42);

    expect(first).toEqual(second);
    expect(first.hazards).not.toContainEqual(first.start);
    expect(first.hazards).not.toContainEqual(first.goal);
  });
});
