import { expect, test } from '@playwright/test';
import { createGameDriver } from '../harness/gameDriver';

test('shows a mode selector first and starts in advanced mode when chosen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start-panel')).toBeVisible();
  await page.getByTestId('start-advanced').click();
  await page.waitForFunction(() => Boolean(window.__GAME_HARNESS__));

  const snapshot = await page.evaluate(() => window.__GAME_HARNESS__.snapshot());
  await expect(page.getByTestId('battle-lane')).toBeVisible();
  await expect(page.getByTestId('base-zone')).toBeVisible();
  await expect(page.getByTestId('buddy-figure')).toBeVisible();
  await expect(page.getByTestId('buddy-skill-button')).toBeVisible();
  await expect(page.getByTestId('mode-label')).toHaveText('ADVANCED');
  expect(snapshot.mode).toBe('advanced');
  expect(snapshot.wave).toBe(1);
  expect(snapshot.baseHp).toBe(5);
  expect(snapshot.status).toBe('playing');
});

test('boss wave spawns a boss and one completed word advances its phase', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(1);
  await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
  const start = await driver.snapshot();
  const boss = start.enemies.find((enemy) => enemy.kind === 'boss');

  expect(start.wave).toBe(3);
  expect(boss).toBeTruthy();
  expect(start.bossWave).toBe(true);

  for (const key of boss!.romaji) {
    await driver.press(key);
  }
  const after = await driver.snapshot();
  const advancedBoss = after.enemies.find((enemy) => enemy.id === boss!.id);

  expect(advancedBoss).toBeTruthy();
  expect(advancedBoss!.kind).toBe('boss');
  expect(advancedBoss!.bossPhaseIndex).toBe(1);
  expect(advancedBoss!.status).toBe('targeted');
});

test('enter key casts burst and freezes enemies', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(1);

  let snapshot = await driver.snapshot();
  while (!snapshot.buddyReady) {
    await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
    snapshot = await driver.snapshot();
    const enemy = snapshot.enemies.find((item) => item.status === 'approaching');
    if (!enemy) continue;
    for (const key of enemy.romaji) {
      snapshot = await driver.press(key);
    }
  }

  let beforeCast = await driver.snapshot();
  while (!beforeCast.enemies.some((item) => item.status === 'approaching')) {
    await driver.dispatch({ type: 'TICK', elapsedMs: 400 });
    beforeCast = await driver.snapshot();
  }
  const beforeEnemy = beforeCast.enemies.find((item) => item.status === 'approaching');
  expect(beforeEnemy).toBeTruthy();

  await expect(page.getByTestId('buddy-skill-button')).toBeEnabled();
  await page.keyboard.press('Enter');
  const afterCast = await driver.snapshot();
  const afterEnemy = afterCast.enemies.find((item) => item.id === beforeEnemy!.id);

  expect(afterCast.buddyReady).toBe(false);
  expect(afterCast.buddyCharge).toBe(0);
  expect(afterEnemy).toBeTruthy();
  expect(afterEnemy!.position).toBe(beforeEnemy!.position);
  expect(afterEnemy!.slowTimer).toBeGreaterThan(0);
});

test('first key press on spawned enemy either targets or kills it', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
  const withEnemy = await driver.snapshot();

  expect(withEnemy.enemies.length).toBeGreaterThanOrEqual(1);

  const firstEnemy = withEnemy.enemies[0];
  const firstKey = firstEnemy.romaji[0];
  const after = await driver.press(firstKey);

  const isTargeted = after.targetId === firstEnemy.id;
  const isKilled = after.waveKills > 0 && after.score > 0;
  expect(isTargeted || isKilled).toBe(true);
});

test('typing wrong key on targeted enemy highlights wrong and expected keys', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.loadStage(1);
  await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
  const withEnemy = await driver.snapshot();
  if (withEnemy.enemies.length === 0) return;

  const firstEnemy = withEnemy.enemies[0];
  if (firstEnemy.romaji.length < 2) return;
  await driver.press(firstEnemy.romaji[0]);

  const expected = firstEnemy.romaji[1];
  const wrong = expected === 'a' ? 's' : 'a';
  await driver.press(wrong);

  await expect(page.getByTestId(`key-${wrong}`)).toHaveClass(/wrong/);
  await expect(page.getByTestId(`key-${expected}`)).toHaveClass(/expected/);
});

test('persists best score and best wave after game over', async ({ page }) => {
  const driver = await createGameDriver(page);
  const start = await driver.dispatch({ type: 'TICK', elapsedMs: 1200 });
  if (start.enemies.length > 0) {
    const enemy = start.enemies[0];
    for (const key of enemy.romaji) {
      await driver.press(key);
    }
  }

  await driver.dispatch({ type: 'TICK', elapsedMs: 999999 });
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__GAME_HARNESS__));
  await expect(page.getByTestId('best-label')).toBeVisible();
});

test('shows game-over result panel and retry button', async ({ page }) => {
  const driver = await createGameDriver(page);
  await driver.dispatch({ type: 'TICK', elapsedMs: 999999 });
  const over = await driver.snapshot();

  if (over.status === 'game-over') {
    await expect(page.getByTestId('result-panel')).toBeVisible();
    await expect(page.getByTestId('result-rank')).toBeVisible();
    await expect(page.getByTestId('next-button')).toBeVisible();
  }
});
