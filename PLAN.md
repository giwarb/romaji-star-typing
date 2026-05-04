# PLAN.md - Romanji Star Typing

## Goal

Defend the shrine in a typing tower-defense game.
Enemies push in from the left, pressure rises every wave, and a boss appears every 3 waves.
The player chooses Normal or Advanced at the start. Advanced mode dramatically increases speed, spawn pace, and simultaneous enemy pressure.

## Core Loop

1. Choose a mode before the run starts.
2. Enemies spawn on the left and march toward the shrine on the right.
3. Typing the first matching letter locks onto the most dangerous enemy.
4. Keep typing that enemy's romaji to defeat it. Bosses require multiple word phases.
5. Correct typing charges Astral Burst. When full, Enter freezes every active enemy for a few seconds.
6. If an enemy reaches the shrine, one HP is lost. At 0 HP the run ends.
7. Clear the wave target, and on boss waves defeat the boss as well, to advance.

## Wave And Difficulty

| Mode | Modifier |
|------|----------|
| Normal | baseline |
| Advanced | spawn interval x0.45 / movement speed x16 / max concurrent +3 |

| Wave | Band | Spawn Interval | Max Concurrent | Notes |
|------|------|----------------|----------------|-------|
| 1-2 | vowels | 4200ms to 3800ms | 4 | onboarding |
| 3 | k-row | around 3600ms | 5 | boss wave |
| 4-5 | k-row / mixed-basic | 3400ms to 3000ms | 4-5 | crowd control starts |
| 6 | mixed-basic / dakuten | around 2840ms | 5-6 | boss wave |
| 7-8 | dakuten | 2800ms to 2600ms | 5 | sustained pressure |
| 9 | combo | around 2440ms | 6-7 | boss wave |
| 10-11 | combo / words | 2240ms to 1840ms | 5-7 | word band |
| 12+ | words | 1840ms and below | 6-8 | late boss rush |

Wave target: `waveTarget = 6 + wave * 2`
Base enemy speed: `0.036 + wave * 0.004` with mode tuning applied.

## Romanization

- Use school-style Japanese romanization close to Kunrei-shiki.
- Examples: `si`, `ti`, `tu`, `hu`, `zi`, `sya`, `syu`, `syo`, `tya`, `tyu`, `tyo`
- Keep long words and boss phrases consistent with the same rules.

## Bosses

- A boss spawns first every 3 waves.
- Bosses have multiple word phases.
- Completing one word advances the boss to the next phrase.
- Boss waves still spawn normal enemies, so prioritization matters.
- Meeting the kill target alone is not enough on a boss wave; the boss must also be defeated.

## Guardian

- A nameless guardian stands beside the shrine.
- `data-mood`: `happy` / `alert` / `hurt`
- `data-form`: `sentinel` / `knight` / `astral`
- Correct typing charges Astral Burst.
- Astral Burst freezes every active enemy for a few seconds.

## Controls

| Action | Effect |
|--------|--------|
| Mode buttons on start screen | Start in Normal or Advanced |
| Letter keys | Acquire lock or type romaji |
| Backspace | Delete one letter, or release lock if empty |
| Enter | Cast Astral Burst at 100% charge |
| Release Lock button / Space | Manually drop the current target |
| Reset button | Restart in the current mode |
| On-screen keyboard | Tap input |

## Save Data

- `bestScore`: highest score
- `bestLevel`: highest wave reached

## Visual Direction

- Dark navy battlefield
- Guardian should read as an RPG shrine defender, not a mascot
- Bosses should feel heavy through silhouette, labels, and phase display
- Burst and boss breaks should use large banner feedback
- Start flow should open on the mode-selection overlay

## Stack

- TypeScript + Vite
- Vitest + Playwright
- localStorage only

## Milestones

- [x] Full typing tower-defense rewrite
- [x] Guardian burst support skill
- [x] Expanded challenge bands including 72 word entries
- [x] Boss waves and multi-phase bosses
- [x] Start-of-run Normal / Advanced selection
- [x] School-style romanization
- [ ] Stronger boss-specific presentation and impact
- [ ] Better mobile boss UI