import type { Page } from '@playwright/test';
import type { GameAction, HarnessResetInput, HarnessSnapshot } from '../../src/core/types';

export type GameDriver = {
  snapshot(): Promise<HarnessSnapshot>;
  dispatch(action: GameAction): Promise<HarnessSnapshot>;
  press(key: string): Promise<HarnessSnapshot>;
  loadStage(stageIndex: number): Promise<HarnessSnapshot>;
  reset(seedOrState?: HarnessResetInput): Promise<HarnessSnapshot>;
  typeText(text: string): Promise<HarnessSnapshot>;
};

export async function createGameDriver(page: Page): Promise<GameDriver> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__GAME_HARNESS__));

  const driver: GameDriver = {
    snapshot() {
      return page.evaluate(() => window.__GAME_HARNESS__.snapshot());
    },
    dispatch(action: GameAction) {
      return page.evaluate((value) => window.__GAME_HARNESS__.dispatch(value), action);
    },
    press(key: string) {
      return page.evaluate((value) => window.__GAME_HARNESS__.press(value), key);
    },
    loadStage(stageIndex: number) {
      return page.evaluate((value) => window.__GAME_HARNESS__.loadStage(value), stageIndex);
    },
    reset(seedOrState?: HarnessResetInput) {
      return page.evaluate((value) => window.__GAME_HARNESS__.reset(value), seedOrState);
    },
    async typeText(text: string) {
      let snapshot: HarnessSnapshot | undefined;
      for (const key of text) {
        snapshot = await driver.press(key);
      }
      return snapshot ?? driver.snapshot();
    },
  };
  return driver;
}
