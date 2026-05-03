export async function createGameDriver(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__GAME_HARNESS__));

  return {
    snapshot() {
      return page.evaluate(() => window.__GAME_HARNESS__.snapshot());
    },
    dispatch(action) {
      return page.evaluate((value) => window.__GAME_HARNESS__.dispatch(value), action);
    },
    press(key) {
      return page.evaluate((value) => window.__GAME_HARNESS__.press(value), key);
    },
    loadLevel(level) {
      return page.evaluate((value) => window.__GAME_HARNESS__.loadLevel(value), level);
    },
    reset(seedOrState) {
      return page.evaluate((value) => window.__GAME_HARNESS__.reset(value), seedOrState);
    },
    async play(route) {
      let snapshot;
      for (const key of route) {
        snapshot = await this.press(key);
      }
      return snapshot;
    },
  };
}
