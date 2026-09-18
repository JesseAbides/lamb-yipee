# Lamb Yipee — Red-Team Critique Pass (Round 3)

Reviewer: adversarial code critique (independent of the automated gauntlet).
Scope: js/engine.js, js/main.js, js/lamb.js, index.src.html, css/style.css.
Method: full source read hunting for state-machine holes, stale-timer leaks,
pause/resume drift, double-finish races, and DOM/XSS.

## Findings

### F1 — HIGH — Duo-CPU rival dies permanently if you pause at the wrong moment
`startRivalClock()` (duo-CPU branch) schedules the rival's NEXT tap only at the
end of the previous tap: `G.cpuTimer = setTimeout(step, delay)`. If the timeout
fires while the game is paused (or just before the race starts), the callback
returns **without rescheduling** — so after Resume the CPU opponent never taps
again. The player wins by forfeit and the progress bars freeze.
*The ghost rival (single mode) is immune: it uses `setInterval`, which survives
pause by skipping ticks without drift.* The automated gauntlet never paused
mid-CPU-tap, so it never saw this.
**Fix:** when the pending tap fires while `!running || paused`, reschedule a
short retry (250 ms) instead of dying; keep the raceId guard.

### F2 — MEDIUM — Countdown timers leak across races
`countdown()` stores its interval in a local. `quitGame()` during a countdown
hides the overlay but the old interval keeps ticking, and its final
`setTimeout` (hide overlay + callback) can fire **into a newly started race**,
hiding the new countdown mid-3-2-1. The race-start callback is raceId-guarded,
but the overlay hide is not.
**Fix:** tag the countdown with the current race id; every tick/timeout bails
if the race id moved on; `startGame` clears any previous countdown timers.

### F3 — LOW — Duplicate distractor word
`DISTRACTORS` contains `"faithfulness"` twice; `shuffle(...).slice(0, n)` can
deal two identical trick cards onto the hill in one race.
**Fix:** dedupe the pool before slicing.

### F4 — CLEANUP — Dead code
`hopYipee()` in js/main.js is unreferenced since the side-mascot rework
(verified: no caller in source or QA harness). Removed.

## Checked and cleared (no action needed)
- Double-finish: `finishRace` re-entry guard (`G.finished`) + raceId guards on
  all rival clocks — a same-millisecond tie resolves to the first finisher.
- Resume time drift: `startAt` and `rival.doneAt` both shift by pause delta;
  ghost interval skips paused ticks without drift.
- Stale rAF/timers after "Race Again": old tick loop exits on `!G.running`,
  old CPU chain dies on raceId mismatch, bubbles are wiped on start.
- XSS: leaderboard names are internal constants, never user input; verse text
  is set via `textContent`.
- P2 keys / taps correctly blocked while paused and during countdown.
- Peek cannot reveal words (slot outline only) and cannot stack (button
  disabled through cooldown).
- localStorage all wrapped in try/catch (private-mode safe).

## Verdict
4 findings: 1 high, 1 medium, 1 low, 1 cleanup. All fixed in source; full
gauntlet re-run after the fixes to confirm the goal still holds.

## Post-fix hardening (found during re-run)
Round 3's re-run exposed one robustness gap the critique's own review had
flagged as environment-only: the rig's physics ran on requestAnimationFrame,
which browsers suspend in hidden/throttled tabs — freezing Yipee mid-pose and
stalling performance timers. The rig now has a **watchdog**: if no rAF fires
within 200 ms, it drives the physics in 33 ms steps itself. Verified by
G7 passing with the preview tab hidden. Regression stages G12 (F1) and
G13 (F2) were added to the gauntlet so both critique bugs can never silently
return.

## Final result
Round 4 gauntlet: **14 pass · 0 fail — GOAL MET.**
