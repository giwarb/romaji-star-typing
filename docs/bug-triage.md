# Bug Triage Sweep

Use this workflow before scheduling or automating recurring bug sweeps.

## Sources

- GitHub issues and pull requests.
- Failed GitHub Actions checks.
- Playwright reports and screenshots.
- Deploy logs and Pages URL.
- Pasted user reports, screenshots, or support notes.
- Optional external systems when connected: Sentry, Slack, Linear.

## Report Format

First, name any source you could not access.

Then return a prioritized list sorted from P0 to P3. If there are no qualifying bugs, say `No qualifying bugs found.`

For each bug include:

- Priority: P0, P1, P2, or P3.
- Title.
- Evidence with links, logs, screenshots, or citations.
- Observed facts.
- Guesses or hypotheses, clearly separated.
- Recommended next action.

## Action Policy

Do not post, create, assign, label, close, rerun, start fixes, or edit code during triage unless explicitly approved.

Group duplicate reports under one bug. Prefer one high-signal link over many noisy links.
