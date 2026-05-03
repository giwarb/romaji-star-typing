import { expect, test } from '@playwright/test';
import { createGameDriver } from '../harness/gameDriver';

test('later stages can be loaded and completed through the browser harness', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(4);
  const before = await driver.snapshot();
  const result = await driver.typeText(before.romaji);

  expect(before.stageId).toBe('combo');
  expect(result.score).toBeGreaterThan(0);
  expect(result.lastMistake).toBeNull();
});

test('word stage includes multi-letter romaji challenges', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(5);
  const snapshot = await driver.snapshot();

  expect(snapshot.stageId).toBe('words');
  expect(snapshot.romaji.length).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('hint-text')).toBeVisible();
});
