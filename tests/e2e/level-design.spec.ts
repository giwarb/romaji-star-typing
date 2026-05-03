import { expect, test } from '@playwright/test';
import { solvableLevel } from '../fixtures/solvable-level';
import { createGameDriver } from '../harness/gameDriver';

test('fixture level is loadable and solvable through browser harness', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadLevel(solvableLevel);

  const result = await driver.play([
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
  ]);

  expect(result.status).toBe('won');
  expect(result.moves).toBe(8);
});

test('seeded levels are deterministic for AI debugging', async ({ page }) => {
  const driver = await createGameDriver(page);
  const first = await driver.reset(1234);
  const second = await driver.reset(1234);

  expect(first.levelId).toBe('seed-1234');
  expect(second).toEqual(first);
});
