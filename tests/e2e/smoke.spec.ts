import { expect, test } from '@playwright/test';
import { createGameDriver } from '../harness/gameDriver';

test('renders the romaji typing game and exposes harness snapshots', async ({ page }) => {
  const driver = await createGameDriver(page);
  const snapshot = await driver.snapshot();

  await expect(page.getByTestId('kana-card')).toBeVisible();
  await expect(page.getByTestId('stage-title')).toContainText('ステージ1');
  expect(snapshot.stageId).toBe('vowels');
  expect(snapshot.keyboard).toHaveProperty(snapshot.romaji[0]);
});

test('typing the current answer gives score and visual correct-key feedback', async ({ page }) => {
  const driver = await createGameDriver(page);
  const before = await driver.snapshot();
  const result = await driver.typeText(before.romaji);

  expect(result.score).toBeGreaterThan(0);
  expect(result.typed).toBe(before.romaji);
  await expect(page.getByTestId(`key-${before.romaji.at(-1)}`)).toHaveClass(/correct/);
});

test('wrong typing shows wrong and expected keys on the screen keyboard', async ({ page }) => {
  const driver = await createGameDriver(page);
  const before = await driver.snapshot();
  const wrong = before.romaji[0] === 'a' ? 's' : 'a';
  const result = await driver.press(wrong);

  expect(result.lastMistake).toMatchObject({ actual: wrong, expected: before.romaji[0] });
  await expect(page.getByTestId(`key-${wrong}`)).toHaveClass(/wrong/);
  await expect(page.getByTestId(`key-${before.romaji[0]}`)).toHaveClass(/expected/);
});

test('persists unlocked progress in localStorage across reloads', async ({ page }) => {
  const driver = await createGameDriver(page);
  let snapshot = await driver.snapshot();

  while (snapshot.status === 'playing') {
    snapshot = await driver.typeText(snapshot.romaji);
    if (snapshot.status === 'playing') {
      snapshot = await driver.dispatch({ type: 'NEXT_CHALLENGE' });
    }
  }
  await page.reload();

  await expect(page.locator('.stage-chip').nth(1)).not.toBeDisabled();
});
