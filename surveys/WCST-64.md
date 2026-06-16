# WCST — Wisconsin Card Sorting Test (vekteo jsPsych fork)

**Estimated time:** 64-card ≈ 5–8 min · **128-card ≈ 12–16 min** (decision: run 128 for reliability — see below)
**Type:** Interactive card-sorting task — **not** a questionnaire. No Likert
form / item list applies.

> **Decisions taken (2026-06-14):** free / self-hosted (fork vekteo, no paid
> platform); keep the **WCST construct specifically**; run the **128-card**
> administration to reduce individual-differences score attenuation; treat the
> WCST↔in-game-switching correlations as **exploratory / preregistered** given
> the known low reliability of perseverative-error scores (reliability paradox,
> Hedge, Powell & Sumner, 2018).

## What it is

Participants sort cards by one of three rules (color, shape, or number),
without being told the rule. Feedback (correct/incorrect) is the only cue.
The rule changes after a streak of correct responses, requiring the
participant to detect the shift and adapt ("set-shifting" / executive
flexibility). The 64-card version caps the deck at 64 trials (vs. 128 in the
full WCST).

## Recommended implementation

**[vekteo/WCST_jsPsych](https://github.com/vekteo/WCST_jsPsych)** (MIT
license) — a jsPsych-based card-sorting task already configured for 64 target
cards (matches WCST-64 format), with rule-shift after 10 consecutive correct.

- Standalone web app: `offline/index.html` and `online/index.html` — no npm
  package/plugin integration, just static files.
- Online version auto-generates a random 15-char subject ID; offline version
  allows a custom subject/session ID — we'd want to pass `window.subID`
  (Prolific ID) through.
- License (MIT) permits forking, hosting, and modifying.

### Output / scoring metrics it produces

Per-trial: reaction time, correctness, perseverative-error flag,
perseverative-response flag, "failure to maintain set" flag (error after ≥5
consecutive correct).

Summary (`STAT_` columns):
- Total errors / error %
- Categories achieved (0–6)
- Perseverative errors (count + %)
- Trials to complete first category

## Source-code inspection (cloned & read 2026-06-14) — what actually needs changing

The repo is **jsPsych 6.1.0**, plain static files (no npm/build) — drops in next
to the existing site exactly like the Color-Shape task. But three things in the
out-of-the-box code make it unusable for an unattended Prolific study as-is:

1. **Data is only written as a local CSV download, not POSTed.**
   `online/experiment.js` calls `jsPsych.data.get().localSave('csv', …)` in both
   `on_finish` and `on_close`. That triggers a browser file-download dialog —
   nothing reaches a server. **Must replace** with a `fetch()` POST of
   `jsPsych.data.get().json()` (or just the `STAT_*` summary) to a new
   `php/insert_wcst.php`. The summary stats are already computed in
   `shared/statCalculation.js` and attached to the final trial, so they're
   straightforward to extract and send.

2. **Subject ID is auto-randomised.** `const subjectId = jsPsych.randomization.randomID(15)`
   (experiment.js line 20). **Must replace** with a read of `window.subID` /
   the Prolific ID from the URL query string (e.g. `?subjectid=`), so the WCST
   row joins to the rest of the participant's data.

3. **Safari / mobile.** The README's "incompatible with Safari" is most likely
   the `jspsych-fullscreen` plugin (iOS Safari has no Fullscreen API) plus the
   `localSave` quirk. Removing `localSave` (fix #1) eliminates one cause.
   **Best-science fix for the sample-bias risk: require desktop in Prolific
   (uniform across all browsers — not a Safari-only exclusion) and verify on
   desktop Safari.** A card-sort with four image buttons is a poor mobile UX
   anyway, so a uniform desktop-only requirement is defensible and avoids
   confounding device/browser with the measure.

### 128-card administration (the reliability decision)
The deck in `shared/cards.js` is a **fixed, hand-authored 64-card sequence**
(each card pre-encodes the correct response index for color/shape/number), and
`experiment.js` loops `for (i=1; i<65; …)`. The standard WCST-128 is simply the
same 64-card deck **presented twice**. So 128 = concatenate the deck loop twice
(`i` 1→64, then 1→64 again) — *not* a config flag, but a small, faithful change.

Also adjust the stopping rule while there: `rules = [C,S,N,C,S,N,C]` (7 entries)
currently permits up to **7** completed categories; standard WCST stops at **6**.
With 64 cards this rarely binds, but with 128 it will — **cap at 6 categories**.

### Metric caveats to verify before trusting the `STAT_*` output
- `failure_to_maintain` (experiment.js ~line 180) tests `nMinus1Trial.trial_number`,
  but the per-trial data field is `card_number` — `trial_number` looks undefined,
  so failure-to-maintain-set may never flag. Verify/repair.
- `cards.js` has cosmetic field typos (e.g. trialNumber 23 `starYellow2` has
  `shape:"green"`; trialNumber 22 key/image mislabeled). These don't affect rule
  scoring (scoring uses the numeric `colorRule/shapeRule/numberRule`, not the
  descriptive strings) but would corrupt any analysis that reads the `shape`
  field — clean them if you use raw card attributes.

## Integration plan (mirrors `csTaskPage()` pattern, `src/main.mjs:1168`)

Two viable approaches — pick based on hosting effort:

### Option A — External hosted task (lowest effort, matches existing pattern)

1. Fork `vekteo/WCST_jsPsych`, host the `online/` (or modified `offline/`)
   build on the EC2 instance (or any static host) alongside the main site.
2. `wcstPage()` shows a button: `https://<host>/wcst/?subjectid=${window.subID}`,
   opens in new tab — same UX as `csTaskPage()`.
3. The hosted task needs to either (a) POST its summary result directly to a
   new `php/insert_wcst.php` endpoint (requires a small patch to the fork to
   add a `fetch()` call on completion), or (b) redirect back to the main app
   with results in the URL/query string for the main app to POST.
4. `instNum = END` after the participant returns (same redirect-back pattern
   as `csTaskPage()`).

### Option B — Embedded in main bundle

Vendor the jsPsych task files into `src/game/wcst/` (or `src/cs_task/`-style
folder) and load it inline within `wcstPage()` instead of opening a new tab.
More control over data capture (can write straight into `window.*` and POST
via the existing `send*Data` pattern), but more integration work (jsPsych
dependency, CSS isolation from BeerCSS).

**Recommendation: Option A** (self-hosted fork) to minimize changes, consistent
with how the Color-Shape Task is already handled — but note Option A is *not*
zero-patch: it still requires fixes #1 (POST instead of `localSave`) and #2
(Prolific ID from URL) above, since the stock build neither sends data to a
server nor accepts an external ID. Option B's only real advantage (server data
capture) is already obtained by patch #1, so Option A remains preferred.

## Data to store (`php/insert_wcst.php` / `spaceprl_wcst` table)

| Column | Description |
|---|---|
| prolificID, expName, timestamp | standard |
| total_errors | int |
| error_pct | float |
| categories_completed | int 0–6 |
| perseverative_errors | int |
| perseverative_error_pct | float |
| trials_to_first_category | int |
| trial_data | JSON blob (optional, full per-trial log) |

## Hypothesis link (context only — not for implementation)

Tests whether the in-game strategic switching (perceptual ↔ value-based
weighting) is the same construct as classic executive-function set-shifting,
or a distinct incentive-driven re-weighting process.
