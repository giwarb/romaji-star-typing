import type { GameHarness } from './core/types';

declare global {
  interface Window {
    __GAME_HARNESS__: GameHarness;
  }
}

export {};
