import { expect, test } from '@playwright/test';
import { createGameDriver } from '../harness/gameDriver';

test('loadStage(4) reaches combo band enemies at wave 9', async ({ page }) => {
  const driver = await createGameDriver(page);
  const snapshot = await driver.loadStage(4);

  // stageIndex 4 maps to wave 9 (combo band)
  expect(snapshot.wave).toBeGreaterThanOrEqual(9);
  expect(snapshot.stageId).toBe('combo');
});

test('loadStage(5) activates words band and enemies have long romaji', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(5);
  // Tick to spawn an enemy
  await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
  const snapshot = await driver.snapshot();

  expect(snapshot.stageId).toBe('words');
  // All enemies should be from the words band
  for (const e of snapshot.enemies) {
    expect(e.romaji.length).toBeGreaterThanOrEqual(3);
  }
});
