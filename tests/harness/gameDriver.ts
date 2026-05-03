import type { Page } from '@playwright/test';
import type {
  GameAction,
  HarnessResetInput,
  HarnessSnapshot,
  Level,
  MoveKey,
} from '../../src/core/types';

export type GameDriver = {
  snapshot(): Promise<HarnessSnapshot>;
  dispatch(action: GameAction): Promise<HarnessSnapshot>;
  press(key: MoveKey): Promise<HarnessSnapshot>;
  loadLevel(level: Level): Promise<HarnessSnapshot>;
  reset(seedOrState?: HarnessResetInput): Promise<HarnessSnapshot>;
  play(route: MoveKey[]): Promise<HarnessSnapshot>;
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
    press(key: MoveKey) {
      return page.evaluate((value) => window.__GAME_HARNESS__.press(value), key);
    },
    loadLevel(level: Level) {
      return page.evaluate((value) => window.__GAME_HARNESS__.loadLevel(value), level);
    },
    reset(seedOrState?: HarnessResetInput) {
      return page.evaluate((value) => window.__GAME_HARNESS__.reset(value), seedOrState);
    },
    async play(route: MoveKey[]) {
      let snapshot: HarnessSnapshot | undefined;
      for (const key of route) {
        snapshot = await driver.press(key);
      }
      if (!snapshot) {
        return driver.snapshot();
      }
      return snapshot;
    },
  };
  return driver;
}
