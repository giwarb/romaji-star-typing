import type { Level } from '../../src/core/types';

export const solvableLevel: Level = {
  id: 'fixture-solvable',
  name: 'Fixture Solvable',
  width: 5,
  height: 5,
  start: { x: 0, y: 0 },
  goal: { x: 4, y: 4 },
  hazards: [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 2 },
  ],
  par: 8,
};
