import type { Level, Point } from './types';

export const baseLevels: Level[] = [
  {
    id: 'intro',
    name: 'Level 1',
    width: 6,
    height: 6,
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    hazards: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ],
    par: 10,
  },
  {
    id: 'switchback',
    name: 'Level 2',
    width: 7,
    height: 6,
    start: { x: 0, y: 5 },
    goal: { x: 6, y: 0 },
    hazards: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 4 },
      { x: 4, y: 1 },
      { x: 5, y: 3 },
    ],
    par: 11,
  },
];

export function getLevel(index = 0): Level {
  const wrapped = ((index % baseLevels.length) + baseLevels.length) % baseLevels.length;
  return cloneLevel(baseLevels[wrapped]);
}

export function cloneLevel(level: Level): Level {
  return {
    ...level,
    start: { ...level.start },
    goal: { ...level.goal },
    hazards: level.hazards.map((hazard) => ({ ...hazard })),
  };
}

export function generateSeededLevel(seed: number | string, width = 6, height = 6): Level {
  const hazardCount = 5;
  const hazards: Point[] = [];
  let value = Number(seed) || 1;

  while (hazards.length < hazardCount) {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    const x = value % width;
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    const y = value % height;
    const blocked = (x === 0 && y === 0) || (x === width - 1 && y === height - 1);
    const duplicate = hazards.some((hazard) => hazard.x === x && hazard.y === y);
    if (!blocked && !duplicate) {
      hazards.push({ x, y });
    }
  }

  return {
    id: `seed-${seed}`,
    name: `Seed ${seed}`,
    width,
    height,
    start: { x: 0, y: 0 },
    goal: { x: width - 1, y: height - 1 },
    hazards,
    par: width + height - 2,
  };
}
