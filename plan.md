# Plan — New Survey/Task Battery (Within)

## Goal

Replace the current post-game battery (CFI → CFS → Color-Shape Task) with a new
battery while keeping the main game task (~40 min) unchanged.

**Target flow (~66 min total, battery ~26 min):**

```
Main task (games, ~40 min)            ← UNCHANGED
   │
   ├─ RANDOMIZED ORDER (per participant):
   │     NfC      Need for Cognition              (~4 min)
   │     CFQ      Cognitive Failures Questionnaire (~4 min)
   │     OCI-R    Obsessive-Compulsive Inventory-R (~3 min)
   │     BFI-2-S  Big Five short form             (~5 min)
   │
   └─ WCST-64    Wisconsin Card Sorting Test (64) (~10 min)
   │
  END / reward
```

## Hard rule

**Do not delete any existing code.** Everything that is being retired (CFI, CFS,
DOSPERT, Color-Shape Task / `CS_TASK`) must be **commented out**, not removed.
The new battery is added alongside the old code. We keep CFI/CFS/DOSPERT page
functions and PHP endpoints in place (commented out of the flow) so they can be
re-enabled if needed.

---

## Part 0 — Source the survey materials ✅ DONE

Materials have been sourced and written to **[surveys/](surveys/)**, one file
per instrument plus a source index:

- [surveys/sources.md](surveys/sources.md) — table of where each instrument's
  item text/scale/scoring was sourced (links for later re-verification)
- [surveys/NfC.md](surveys/NfC.md) — 18 items, 1–5 scale, 9 reverse items, scoring
- [surveys/CFQ.md](surveys/CFQ.md) — 25 items, 0–4 scale, no reverse items, scoring
- [surveys/OCI-R.md](surveys/OCI-R.md) — 18 items, 0–4 scale, 6 subscales, scoring
- [surveys/BFI-2-S.md](surveys/BFI-2-S.md) — 30 items, 1–5 scale, domain + reverse key, scoring (⚠️ flagged for a final spot-check against the official Colby PDF before launch)
- [surveys/WCST-64.md](surveys/WCST-64.md) — not a questionnaire; implementation plan using `vekteo/WCST_jsPsych` (MIT), mirroring `csTaskPage()`

Each `surveys/*.md` mirrors the structure used in `cfiPage()`
(`src/main.mjs:900`): question array + reverse-item list + scale + scoring
formula, ready for mechanical translation into a page function.

---

## Part 1 — Phase constants (`src/main.mjs`, top, ~line 9–37)

1. **Comment out** the retired phase constants in place, leaving a note:
   ```js
   // const CFI = 14;      // RETIRED — replaced by new battery (kept for reference)
   // const CFS = 15;
   // const CS_TASK = 18;  // Color-Shape Task — retired
   ```
   (Leave `SURVEY = 16` post-game feedback and `END = 17` as-is.)

2. **Add** new battery phase constants (pick unused numbers, e.g.):
   ```js
   const NFC   = 19;
   const CFQ   = 20;
   const OCIR  = 21;
   const BFI2S = 22;
   const WCST  = 23;
   ```

3. **Replace the survey-order randomisation** (currently `src/main.mjs:20-25`,
   two-item CFI/CFS shuffle). Comment out the old block; add a 4-item shuffle:
   ```js
   // OLD two-item order — commented out, see new block below
   // const surveyOrder = ... [CFI, CFS] ...

   const BATTERY = [NFC, CFQ, OCIR, BFI2S];
   const _stored = localStorage.getItem('surveyOrder');
   const surveyOrder = _stored ? JSON.parse(_stored) : shuffle([...BATTERY]);
   if (!_stored) localStorage.setItem('surveyOrder', JSON.stringify(surveyOrder));
   ```
   Use the existing `shuffle` from `utils.mjs` (already imported elsewhere) or a
   Fisher–Yates inline. Keep `window.surveyOrderInfo` / `setSurveyOrder`
   debug helpers but update them for the 4-item list (comment out old versions).

---

## Part 2 — Routing / navigation

A generic helper avoids per-survey branching. Add near the top of the survey
section:

```js
// Returns the next phase after the survey that just completed:
// the next survey in surveyOrder, or WCST once the battery is done.
function nextInBattery(currentPhase) {
    const i = surveyOrder.indexOf(currentPhase);
    return (i >= 0 && i < surveyOrder.length - 1) ? surveyOrder[i + 1] : WCST;
}
```

Then wire it in three places:

1. **`endFull2()`** (`src/main.mjs:2361`): already sets
   `instNum = surveyOrder[0]` — this still works with the new 4-item order. No
   change needed beyond confirming `setCurrentStep('survey')`.

2. **`setPageInstruction()` switch** (`src/main.mjs:606-670`):
   - Comment out the `case CFI / CFS / CS_TASK` blocks.
   - Add `case NFC / CFQ / OCIR / BFI2S:` → `setCurrentStep('survey')` +
     call the matching page fn (`nfcPage()` etc.).
   - Add `case WCST:` → `setCurrentStep('wcst')` + `wcstPage()`.
   - Update the membership guard at `src/main.mjs:599-604` (the
     `TUTORIAL == instNum || ...` chain) to include the new phases and
     comment out CFI/CFS/CS_TASK.

3. **`skipCurrentStep()` switch** (`src/main.mjs:338-391`):
   - Comment out `case CFI / CFS / CS_TASK`.
   - Add `case NFC / CFQ / OCIR / BFI2S:` → `setStepDone('survey'); instNum = nextInBattery(<phase>); setPageInstruction(instNum);`
   - Add `case WCST:` → `setStepDone('wcst'); instNum = END; setPageInstruction(instNum);`
   - Update the `.includes([...])` array at `src/main.mjs:332-333`.

4. **DEBUG URL params** (`src/main.mjs:137-139`): the `survey=1` entry point
   calls `surveyOrder[0] === CFI ? cfiPage() : cfsPage()`. Comment out; replace
   with a dispatch over the new page fns keyed by `surveyOrder[0]`.

---

## Part 3 — Survey page functions (`src/main.mjs`)

Each new instrument is a Likert form. **Clone `cfiPage()` (`src/main.mjs:900`)**
— it already implements: scrollable question list, N-point scale buttons,
per-question selection state, "answer all" validation, score computation with
reverse items, POST, and advance. For each, change only: title, intro text,
question array, scale range + anchor labels, reverse-item list, `*Responses`
window key, error element id, POST fn, and the advance target
(`instNum = nextInBattery(<PHASE>)`).

Add (do **not** remove `cfiPage`/`cfsPage`/`dospertScalePage` — leave them):

- `nfcPage()`    — scale 1–5, NfC items + reverse key
- `cfqPage()`    — scale 0–4 (note: starts at 0 — adjust the button loop, which
  currently runs `for i=1..N`; make it 0..4), no reverse items
- `ociRPage()`   — scale 0–4, no reverse items, 18 items
- `bfi2sPage()`  — scale 1–5, 30 items, domain-tagged + reverse key

Each `submitHandler` ends with:
```js
send<Inst>Data(data);
instNum = nextInBattery(<PHASE>);
setPageInstruction(instNum);
```

The shared title logic should show progress within the randomised battery,
e.g. `Survey ${surveyOrder.indexOf(<PHASE>) + 1} of ${surveyOrder.length}`.

Also extend `window.fill` (`src/main.mjs:427`) test helper with the new
form ids / response keys / scales (keep old entries).

---

## Part 4 — Data senders (`src/main.mjs`, ~2156)

Clone `sendCfiData` (`src/main.mjs:2156`) for each instrument:
`sendNfcData`, `sendCfqData`, `sendOciRData`, `sendBfi2sData`. Add matching
endpoint constants near `src/main.mjs:35-37`:
```js
const NFC_PHP   = 'php/insert_nfc.php';
const CFQ_PHP   = 'php/insert_cfq.php';
const OCIR_PHP  = 'php/insert_ocir.php';
const BFI2S_PHP = 'php/insert_bfi2s.php';
const WCST_PHP  = 'php/insert_wcst.php'; // see Part 5
```
Keep the 3-retry pattern. Payload: `{ prolificID, expName: 'Within', timestamp,
...qN }` — raw per-question responses only. No computed `score` or per-domain
subscores are stored; reverse-scoring, totals, and (for BFI-2-S) domain scores
are computed at analysis time from the raw `qN` values using the keys
documented in `surveys/*.md`.

---

## Part 5 — WCST-64

WCST is **not** a Likert form. Two options:

- **Option A (preferred, lowest risk): external task page**, identical pattern to
  the existing `csTaskPage()` (`src/main.mjs:1168`) — a page with a button that
  opens a hosted WCST-64 (e.g. PsyToolkit / mili2nd / jsPsych deployment) in a
  new tab with `?subjectid=${window.subID}`, with redirect back on completion.
  Sonnet sources/hosts the WCST-64 implementation and provides the URL.
  `wcstPage()` then closely mirrors `csTaskPage()`.

- **Option B: embedded jsPsych WCST plugin** served from the repo (more work,
  more control over raw card-level data). Only if a vetted plugin is found.

Either way:
- `wcstPage()` renders the page; on completion → `instNum = END`.
- `insert_wcst.php`: store summary metrics (total correct, errors, perseverative
  errors, perseverative responses, categories completed, trials-to-first-category,
  failure-to-maintain-set) plus, if available, a JSON blob of trial data. If the
  task is fully external and self-storing, `insert_wcst.php` may just log a
  completion marker.

---

## Part 6 — PHP endpoints + DB

For each questionnaire, **clone `php/insert_cfi.php`** changing: allowed-column
question count, validation count, and target table. Add:

| File | Table | q-columns |
|---|---|---|
| `php/insert_nfc.php` | `spaceprl_nfc` | q0..qN (per chosen NfC length) |
| `php/insert_cfq.php` | `spaceprl_cfq` | q0..q24 |
| `php/insert_ocir.php` | `spaceprl_ocir` | q0..q17 |
| `php/insert_bfi2s.php` | `spaceprl_bfi2s` | q0..q29 (+ domain subscore cols) |
| `php/insert_wcst.php` | `spaceprl_wcst` | summary metric cols (+ optional `trials` JSON) |

- Keep `php/insert_cfi.php` / `insert_cfs.php` files (used as templates; leave on
  disk, no longer called from JS).
- Each new table needs creating in MySQL `basile` DB: columns
  `prolificID, expName, timestamp, score, q0..qN` (+ extras as above). Provide a
  `CREATE TABLE` snippet per table.
- Add the new table names to `isValidTable()` whitelist (check `php/login.php` /
  `php/admin.php`) so admin/queries don't reject them.

---

## Part 7 — `index.html` stepper

- The visible "surveys" step (`index.html:87`) stays and covers the whole
  randomised battery.
- **Comment out** the hidden `cs-task`/`dospert`/`sg`/`si` step blocks that are
  no longer used (they're already partly hidden — leave them commented).
- **Add** a "wcst" step (or repurpose the existing `cs-task` hidden step id) so
  `setCurrentStep('wcst')` resolves. Confirm any `setStepDone`/`setCurrentStep`
  string ids referenced in JS exist in the DOM.

---

## Part 8 — Build, verify, deploy

1. `npx webpack` (or `bash compile.sh`) → rebuild `dist/bundle.js`.
2. Local smoke test with `?DEBUG=1` and the survey skip entry points:
   - Verify randomised order persists across refresh (localStorage `surveyOrder`).
   - Verify each survey validates "answer all", posts, and advances correctly.
   - Verify last survey → WCST → END.
   - Verify each POST lands in its table (check via admin or DB).
3. Deploy: SSH to EC2, `git pull`, `npx webpack` (per PROJECT_STRUCTURE.md).
4. Update `PROJECT_STRUCTURE.md` (flow diagram, PHP list, schema table) after
   implementation.

---

## Checklist (implementation order)

- [x] Part 0: source + record all survey materials (Sonnet)
- [x] Part 1: constants + 4-item randomised order
- [x] Part 6: PHP endpoints + DB tables + whitelist (NfC, CFQ, OCI-R, BFI-2-S;
      see `php/schema_battery.sql` for `CREATE TABLE` statements — run these
      on the MySQL `basile` DB before deploying)
- [x] Part 3 + 4: survey page fns + senders (clone CFI) — `nfcPage`, `cfqPage`,
      `ociRPage`, `bfi2sPage` + matching `send*Data` fns
- [ ] Part 5: WCST-64 page + endpoint — **NOT IMPLEMENTED** (hosting/library TBD)
- [x] Part 2: routing (setPageInstruction, skip, debug entry) — for the 4
      Likert surveys. `nextInBattery()` currently routes the last survey to
      `END` instead of `WCST` (TODO once Part 5 lands)
- [x] Part 7: index.html stepper — cs-task step commented out, "end" renumbered
      to 8; "wcst" step placeholder left as a TODO comment
- [ ] Part 8: build, verify, deploy, update docs — `npx webpack` build passes;
      DB tables still need creating on the server; PROJECT_STRUCTURE.md not
      yet updated (deferring full doc refresh until WCST lands)
- [x] Confirm: nothing deleted — retired code (CFI/CFS/CS_TASK, old 2-item
      survey order, old debug helpers) only commented out
