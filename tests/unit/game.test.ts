import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  currentStage,
  keyboardState,
  reduceGame,
  serializeState,
  stageProgress,
  typeKey,
  validateStage,
} from '../../src/core/game';
import { stages } from '../../src/core/lessons';

function spawnFirstEnemy(seed = 1, stageIndex = 0) {
  let state = createInitialState({ seed, stageIndex });
  state = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });
  const enemy = state.enemies.find((item) => item.status === 'approaching');
  return { state, enemy };
}

describe('romaji tower defense rpg model', () => {
  it('starts at wave 1 with no enemies and full HP', () => {
    const state = createInitialState({ seed: 1 });
    const view = serializeState(state);

    expect(view.wave).toBe(1);
    expect(view.mode).toBe('normal');
    expect(view.baseHp).toBe(5);
    expect(view.enemies).toHaveLength(0);
    expect(view.targetId).toBeNull();
    expect(view.score).toBe(0);
    expect(currentStage(state).id).toBe('vowels');
  });

  it('advanced mode starts with faster spawn and movement', () => {
    const normal = createInitialState({ seed: 1, mode: 'normal' });
    const advanced = createInitialState({ seed: 1, mode: 'advanced' });

    expect(advanced.spawnInterval).toBeLessThan(normal.spawnInterval);
    expect(advanced.maxConcurrent).toBeGreaterThan(normal.maxConcurrent);

    const normalAfter = reduceGame(normal, { type: 'TICK', elapsedMs: 1000 });
    const advancedAfter = reduceGame(advanced, { type: 'TICK', elapsedMs: 1000 });
    const normalEnemy = normalAfter.enemies[0];
    const advancedEnemy = advancedAfter.enemies[0];

    expect(normalEnemy).toBeDefined();
    expect(advancedEnemy).toBeDefined();
    expect(advancedEnemy.speed).toBeGreaterThan(normalEnemy.speed);
  });

  it('uses school-style romaji in kana and word data', () => {
    const kRow = stages.find((stage) => stage.id === 'k-row');
    const words = stages.find((stage) => stage.id === 'words');

    expect(kRow?.challenges.find((challenge) => challenge.id === 'si')?.romaji).toBe('si');
    expect(kRow?.challenges.find((challenge) => challenge.id === 'ti')?.romaji).toBe('ti');
    expect(kRow?.challenges.find((challenge) => challenge.id === 'tu')?.romaji).toBe('tu');
    expect(words?.challenges.find((challenge) => challenge.id === 'densya')?.romaji).toBe('densya');
    expect(words?.challenges.find((challenge) => challenge.id === 'sinkansen')?.romaji).toBe('sinkansen');
  });

  it('spawns enemies on first tick', () => {
    const state = createInitialState({ seed: 1 });
    const after = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });

    expect(after.enemies.length).toBeGreaterThanOrEqual(1);
    expect(after.enemies[0].status).toBe('approaching');
    const after2 = reduceGame(after, { type: 'TICK', elapsedMs: 200 });
    expect(after2.enemies[0].position).toBeGreaterThan(0);
  });

  it('spawns a boss first on boss waves', () => {
    let state = createInitialState({ seed: 7, stageIndex: 1 });
    state = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });

    const boss = state.enemies.find((enemy) => enemy.kind === 'boss');
    expect(state.wave).toBe(3);
    expect(boss).toBeDefined();
    expect(state.bossSpawned).toBe(true);
    expect(state.bossDefeated).toBe(false);
    expect(boss?.bossMaxPhases).toBeGreaterThan(1);
  });

  it('advances a boss phase instead of killing it after one word', () => {
    let state = createInitialState({ seed: 11, stageIndex: 1 });
    state = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });
    const boss = state.enemies.find((enemy) => enemy.kind === 'boss');
    expect(boss).toBeDefined();

    const initialPosition = boss!.position;
    for (const key of boss!.challenge.romaji) {
      state = typeKey(state, key);
    }

    const advanced = state.enemies.find((enemy) => enemy.id === boss!.id);
    expect(advanced).toBeDefined();
    expect(advanced!.kind).toBe('boss');
    expect(advanced!.status).toBe('targeted');
    expect(advanced!.bossPhaseIndex).toBe(1);
    expect(advanced!.position).toBeLessThanOrEqual(initialPosition);
    expect(state.waveKills).toBe(0);
  });

  it('kills targeted enemy when full romaji is typed', () => {
    const spawned = spawnFirstEnemy(1, 0);
    const enemy = spawned.enemy;
    let state = spawned.state;
    expect(enemy).toBeDefined();

    for (const key of enemy!.challenge.romaji) {
      state = typeKey(state, key);
    }

    const killed = state.enemies.find((item) => item.id === enemy!.id);
    expect(killed?.status).toBe('dying');
    expect(state.score).toBeGreaterThan(0);
    expect(state.waveKills).toBe(1);
    expect(state.targetId).toBeNull();
  });

  it('records a mistake on wrong key and breaks streak', () => {
    const spawned = spawnFirstEnemy(1, 3);
    const enemy = spawned.enemy;
    let state = spawned.state;
    expect(enemy).toBeDefined();
    state = typeKey(state, enemy!.challenge.romaji[0]);

    const expected = enemy!.challenge.romaji[1];
    const wrong = expected === 'a' ? 's' : 'a';
    const after = typeKey(state, wrong);

    const kbState = keyboardState(after);
    expect(after.mistakes).toBe(1);
    expect(after.streak).toBe(0);
    expect(kbState[wrong]).toBe('wrong');
    expect(kbState[expected]).toBe('expected');
  });

  it('advances wave after enough kills and raises the next target count', () => {
    let state = createInitialState({ seed: 2 });

    while (state.wave === 1 && state.status === 'playing') {
      state = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });
      const active = state.enemies.find((enemy) => enemy.status === 'approaching');
      if (!active) continue;

      for (const key of active.challenge.romaji) {
        state = typeKey(state, key);
      }
    }

    expect(state.wave).toBe(2);
    expect(state.waveKills).toBe(0);
    expect(state.waveTarget).toBe(10);
  });

  it('charges burst through correct typing and freezes enemies in place', () => {
    let state = createInitialState({ seed: 5, stageIndex: 1 });

    while (state.buddyCharge < 100) {
      state = reduceGame(state, { type: 'TICK', elapsedMs: 1200 });
      const active = state.enemies.find((enemy) => enemy.status === 'approaching');
      if (!active) continue;

      for (const key of active.challenge.romaji) {
        state = typeKey(state, key);
      }
    }

    while (!state.enemies.some((enemy) => enemy.status === 'approaching')) {
      state = reduceGame(state, { type: 'TICK', elapsedMs: 1200 });
    }
    state = reduceGame(state, { type: 'TICK', elapsedMs: 400 });
    const beforeCast = state.enemies
      .filter((enemy) => enemy.status === 'approaching')
      .map((enemy) => ({ id: enemy.id, position: enemy.position, slowTimer: enemy.slowTimer }));

    expect(beforeCast.length).toBeGreaterThan(0);
    expect(state.buddyReady).toBe(true);

    state = reduceGame(state, { type: 'CAST_BUDDY_SKILL' });

    expect(state.buddyCharge).toBe(0);
    expect(state.buddyReady).toBe(false);
    expect(state.feedbackEvent?.kind).toBe('buddy-skill');

    for (const enemy of beforeCast) {
      const after = state.enemies.find((item) => item.id === enemy.id);
      expect(after).toBeDefined();
      expect(after!.position).toBe(enemy.position);
      expect(after!.slowTimer).toBeGreaterThan(enemy.slowTimer);
    }

    const frozenTick = reduceGame(state, { type: 'TICK', elapsedMs: 400 });
    for (const enemy of beforeCast) {
      const after = frozenTick.enemies.find((item) => item.id === enemy.id);
      expect(after).toBeDefined();
      expect(after!.position).toBe(enemy.position);
    }
  });

  it('loses base HP when enemy reaches the base', () => {
    let state = createInitialState({ seed: 1 });
    state = reduceGame(state, { type: 'TICK', elapsedMs: 1000 });
    expect(state.enemies.length).toBeGreaterThan(0);

    state = reduceGame(state, { type: 'TICK', elapsedMs: 40000 });
    expect(state.baseHp).toBeLessThan(5);
  });

  it('builds game-over and result when base HP reaches 0', () => {
    let state = createInitialState({ seed: 1 });
    for (let index = 0; index < 10; index += 1) {
      state = reduceGame(state, { type: 'TICK', elapsedMs: 5000 });
    }
    if (state.status !== 'game-over') {
      state = { ...state, baseHp: 1 };
      state = reduceGame(state, { type: 'TICK', elapsedMs: 40000 });
    }

    expect(state.status).toBe('game-over');
    expect(state.result).not.toBeNull();
    expect(state.bestWave).toBeGreaterThanOrEqual(1);
    expect(state.bestScore).toBeGreaterThanOrEqual(0);
  });

  it('restarts cleanly after game-over', () => {
    let state = createInitialState({ seed: 1 });
    state = { ...state, baseHp: 0, status: 'game-over' };
    const restarted = reduceGame(state, { type: 'NEXT_CHALLENGE' });

    expect(restarted.status).toBe('playing');
    expect(restarted.wave).toBe(1);
    expect(restarted.enemies).toHaveLength(0);
    expect(restarted.baseHp).toBe(5);
  });

  it('releases target on backspace when typed is empty', () => {
    const spawned = spawnFirstEnemy(1, 3);
    const enemy = spawned.enemy;
    let state = spawned.state;
    expect(enemy).toBeDefined();

    state = typeKey(state, enemy!.challenge.romaji[0]);
    expect(state.targetId).toBe(enemy!.id);

    state = reduceGame(state, { type: 'BACKSPACE' });
    const released = state.enemies.find((item) => item.id === enemy!.id);
    expect(released?.status).toBe('approaching');
    expect(state.targetId).toBeNull();
  });

  it('progress returns valid wavePercent and hpPercent', () => {
    const state = createInitialState({ seed: 1 });
    const progress = stageProgress(state);
    expect(progress.wavePercent).toBeGreaterThanOrEqual(0);
    expect(progress.wavePercent).toBeLessThanOrEqual(1);
    expect(progress.hpPercent).toBeGreaterThanOrEqual(0);
    expect(progress.hpPercent).toBeLessThanOrEqual(1);
  });

  it('validates all exported stage challenge data', () => {
    for (const stage of stages) {
      expect(() => validateStage(stage)).not.toThrow();
    }
  });
});
