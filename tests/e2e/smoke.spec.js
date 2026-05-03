import { expect, test } from '@playwright/test';
import { createGameDriver } from '../harness/gameDriver.js';

test('renders a complete board and exposes harness snapshots', async ({ page }) => {
  const driver = await createGameDriver(page);
  const snapshot = await driver.snapshot();

  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('level-label')).toHaveText('Level 1');
  expect(snapshot.board.cellCount).toBe(36);
  expect(snapshot.status).toBe('playing');
});

test('can complete the first level through the same harness AI uses', async ({ page }) => {
  const driver = await createGameDriver(page);

  const result = await driver.play([
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
  ]);

  expect(result.status).toBe('won');
  await expect(page.getByTestId('best-label')).toHaveText('Best 10');
});

test('persists best score in localStorage across reloads', async ({ page }) => {
  const driver = await createGameDriver(page);

  await driver.play([
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
    'ArrowDown',
  ]);
  await page.reload();

  await expect(page.getByTestId('best-label')).toHaveText('Best 10');
});
