import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseLevels, generateSeededLevel } from '../src/core/levels.js';
import { createInitialState, reduceGame, validateLevel } from '../src/core/game.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const levels = [...baseLevels, generateSeededLevel(1234)];
const results = levels.map((level) => evaluateLevel(level));
const summary = summarize(results);
const report = {
  generatedAt: new Date().toISOString(),
  targets: {
    overallScore: 0.9,
    solvableLevels: 1,
    deterministicChecks: 1,
  },
  summary,
  results,
  nextAction: nextAction(summary, results),
};

writeJson(`${root}/artifacts/evals/latest.json`, report);
writeLog(`${root}/.logs/latest-eval.md`, report);

if (summary.overallScore < report.targets.overallScore) {
  console.error(`Game eval failed: overall score ${summary.overallScore}`);
  process.exit(1);
}

console.log(
  `Game eval passed: score=${summary.overallScore}, solvable=${summary.solvableLevels}/${summary.totalLevels}`,
);

function evaluateLevel(level) {
  const errors = [];
  let route = null;
  let finalState = null;

  try {
    validateLevel(level);
    route = findShortestRoute(level);
    if (!route) {
      errors.push('No route from start to goal.');
    } else {
      finalState = route.reduce(
        (state, key) => reduceGame(state, { type: 'MOVE', key }),
        createInitialState({ level }),
      );
      if (finalState.status !== 'won') {
        errors.push(`Route ended with status ${finalState.status}.`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  const parDelta = route ? route.length - level.par : null;
  const checks = {
    valid: errors.length === 0,
    solvable: Boolean(route && finalState?.status === 'won'),
    withinPar: route ? route.length <= level.par : false,
    deterministic: deterministicCheck(level),
  };
  const score =
    Number(checks.valid) * 0.25 +
    Number(checks.solvable) * 0.35 +
    Number(checks.withinPar) * 0.2 +
    Number(checks.deterministic) * 0.2;

  return {
    id: level.id,
    name: level.name,
    checks,
    score,
    par: level.par,
    routeLength: route?.length ?? null,
    parDelta,
    route: route ?? [],
    errors,
  };
}

function findShortestRoute(level) {
  const moves = [
    ['ArrowUp', { x: 0, y: -1 }],
    ['ArrowDown', { x: 0, y: 1 }],
    ['ArrowLeft', { x: -1, y: 0 }],
    ['ArrowRight', { x: 1, y: 0 }],
  ];
  const hazardKeys = new Set(level.hazards.map(pointKey));
  const queue = [{ point: level.start, route: [] }];
  const seen = new Set([pointKey(level.start)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (samePoint(current.point, level.goal)) {
      return current.route;
    }

    for (const [key, delta] of moves) {
      const next = {
        x: current.point.x + delta.x,
        y: current.point.y + delta.y,
      };
      const nextKey = pointKey(next);
      const outside = next.x < 0 || next.y < 0 || next.x >= level.width || next.y >= level.height;
      if (outside || hazardKeys.has(nextKey) || seen.has(nextKey)) {
        continue;
      }
      seen.add(nextKey);
      queue.push({ point: next, route: [...current.route, key] });
    }
  }

  return null;
}

function deterministicCheck(level) {
  if (!level.id.startsWith('seed-')) {
    return true;
  }
  const seed = level.id.replace('seed-', '');
  return JSON.stringify(level) === JSON.stringify(generateSeededLevel(seed));
}

function summarize(items) {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  return {
    totalLevels: items.length,
    solvableLevels: items.filter((item) => item.checks.solvable).length,
    withinParLevels: items.filter((item) => item.checks.withinPar).length,
    deterministicLevels: items.filter((item) => item.checks.deterministic).length,
    overallScore: Number((totalScore / items.length).toFixed(3)),
  };
}

function nextAction(summary, items) {
  const firstFailure = items.find((item) => item.score < 1);
  if (!firstFailure) {
    return 'All evaluated levels are valid, solvable, deterministic, and within par.';
  }
  if (!firstFailure.checks.solvable) {
    return `Fix level ${firstFailure.id}: it is not solvable.`;
  }
  if (!firstFailure.checks.withinPar) {
    return `Tune level ${firstFailure.id}: shortest route exceeds par.`;
  }
  return `Inspect level ${firstFailure.id}: score is below target.`;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLog(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [
    '# Latest Eval',
    '',
    `Generated: ${value.generatedAt}`,
    `Overall score: ${value.summary.overallScore}`,
    `Solvable levels: ${value.summary.solvableLevels}/${value.summary.totalLevels}`,
    `Within par: ${value.summary.withinParLevels}/${value.summary.totalLevels}`,
    '',
    '## Next Action',
    '',
    value.nextAction,
    '',
    '## Level Scores',
    '',
    ...value.results.map(
      (item) =>
        `- ${item.id}: score=${item.score}, route=${item.routeLength}, par=${item.par}, errors=${item.errors.length}`,
    ),
  ];
  writeFileSync(path, `${lines.join('\n')}\n`);
}

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}
