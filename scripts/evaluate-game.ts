import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStage } from '../src/core/game';
import { stages } from '../src/core/lessons';
import type { Stage } from '../src/core/types';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const results = stages.map((stage) => evaluateStage(stage));
const summary = summarize(results);
const report = {
  generatedAt: new Date().toISOString(),
  targets: {
    overallScore: 0.9,
    validStages: stages.length,
    minimumWordChallenges: 6,
  },
  summary,
  results,
  nextAction: nextAction(results),
};

writeJson(`${root}/artifacts/evals/latest.json`, report);
writeLog(`${root}/.logs/latest-eval.md`, report);

if (summary.overallScore < report.targets.overallScore) {
  console.error(`Game eval failed: overall score ${summary.overallScore}`);
  process.exit(1);
}

console.log(
  `Game eval passed: score=${summary.overallScore}, valid=${summary.validStages}/${summary.totalStages}`,
);

type StageEvalResult = {
  id: string;
  name: string;
  challengeCount: number;
  averageRomajiLength: number;
  checks: {
    valid: boolean;
    enoughChallenges: boolean;
    hasKana: boolean;
    romajiOnly: boolean;
    difficultyFitsStage: boolean;
  };
  score: number;
  errors: string[];
};

function evaluateStage(stage: Stage): StageEvalResult {
  const errors: string[] = [];
  try {
    validateStage(stage);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const averageRomajiLength =
    stage.challenges.reduce((sum, challenge) => sum + challenge.romaji.length, 0) /
    stage.challenges.length;
  const checks = {
    valid: errors.length === 0,
    enoughChallenges: stage.challenges.length >= Math.min(stage.requiredCorrect, 5),
    hasKana: stage.challenges.every((challenge) => challenge.kana.length > 0),
    romajiOnly: stage.challenges.every((challenge) => /^[a-z]+$/.test(challenge.romaji)),
    difficultyFitsStage: difficultyFitsStage(stage, averageRomajiLength),
  };
  const score =
    Number(checks.valid) * 0.3 +
    Number(checks.enoughChallenges) * 0.2 +
    Number(checks.hasKana) * 0.15 +
    Number(checks.romajiOnly) * 0.15 +
    Number(checks.difficultyFitsStage) * 0.2;

  return {
    id: stage.id,
    name: stage.name,
    challengeCount: stage.challenges.length,
    averageRomajiLength: Number(averageRomajiLength.toFixed(2)),
    checks,
    score,
    errors,
  };
}

function difficultyFitsStage(stage: Stage, averageRomajiLength: number): boolean {
  if (stage.id === 'vowels') {
    return stage.challenges.every((challenge) => challenge.romaji.length === 1);
  }
  if (stage.id === 'words') {
    return averageRomajiLength >= 4;
  }
  return averageRomajiLength >= 2;
}

function summarize(items: StageEvalResult[]) {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  return {
    totalStages: items.length,
    validStages: items.filter((item) => item.checks.valid).length,
    totalChallenges: items.reduce((sum, item) => sum + item.challengeCount, 0),
    overallScore: Number((totalScore / items.length).toFixed(3)),
  };
}

function nextAction(items: StageEvalResult[]): string {
  const firstFailure = items.find((item) => item.score < 1);
  if (!firstFailure) {
    return 'All stages have valid kana, romaji, challenge counts, and difficulty progression.';
  }
  return `Improve ${firstFailure.id}: ${firstFailure.errors[0] ?? 'score is below target.'}`;
}

function writeJson(path: string, value: typeof report): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLog(path: string, value: typeof report): void {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [
    '# Latest Eval',
    '',
    `Generated: ${value.generatedAt}`,
    `Overall score: ${value.summary.overallScore}`,
    `Valid stages: ${value.summary.validStages}/${value.summary.totalStages}`,
    `Total challenges: ${value.summary.totalChallenges}`,
    '',
    '## Next Action',
    '',
    value.nextAction,
    '',
    '## Stage Scores',
    '',
    ...value.results.map(
      (item) =>
        `- ${item.id}: score=${item.score}, challenges=${item.challengeCount}, avgLength=${item.averageRomajiLength}, errors=${item.errors.length}`,
    ),
  ];
  writeFileSync(path, `${lines.join('\n')}\n`);
}
