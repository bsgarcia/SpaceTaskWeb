

## Implementation Plan: Replace DOSPERT + Lotteries with CFI + CFS

### Survey specs

| | CFI | CFS |
|---|---|---|
| Items | 20 (from CFI.txt) | 12 (from CFS.txt) |
| Scale | 7-point Likert (1 Strongly Disagree → 7 Strongly Agree) | 6-point Likert (1 Strongly Disagree → 6 Strongly Agree) |
| Reverse-scored | Items 2, 4, 7, 9, 11, 17 (1-indexed) | Items 2, 3, 5, 10 (1-indexed) |
| Phase slot | 14 (was DOSPERT) | 15 (was RISK) |

---

### Step 1 — Phase constants & PHP endpoints (main.mjs)

Replace:
```js
const DOSPERT = 14;
const RISK    = 15;
const RISK_PHP          = 'php/insert_risk.php';
const RISK_TRIAL_PHP    = 'php/insert_risk_trial.php';
const DOSPERT_PHP       = 'php/insert_dospert.php';
const GENERAL_RISK_PHP  = 'php/insert_general_risk.php';
```
With:
```js
const CFI = 14;
const CFS = 15;
const CFI_PHP = 'php/insert_cfi.php';
const CFS_PHP = 'php/insert_cfs.php';
```

---

### Step 2 — Game-end transition (`window.endFull2`, main.mjs)

Change the one line that sets the next survey phase:
```js
// was:
instNum = DOSPERT;
// becomes:
instNum = CFI;
```

Also update the `gotoParam === 'risk'` dev-shortcut block (line ~97) to jump to `CFI` instead.

---

### Step 3 — Switch-case routing (main.mjs, `setPageInstruction`)

Replace:
```js
case DOSPERT:
    ...
    dospertScalePage();
    break;
case RISK:
    ...
    riskAssessmentPage();
    break;
```
With:
```js
case CFI:
    setPreviousStepDone();
    setCurrentStep('survey');
    cfiPage();
    break;
case CFS:
    setPreviousStepDone();
    setCurrentStep('survey');
    cfsPage();
    break;
```

---

### Step 4 — New page function `cfiPage()` (main.mjs)

Modelled on `dospertScalePage()`:

- Display a 7-button Likert scale per item (1–7, labels: "Strongly Disagree" … "Strongly Agree")
- Store responses in `window.cfiResponses = { q0: val, …, q19: val }`
- Validation: all 20 items answered before allowing submit
- On submit:
  - Apply reverse-scoring for items at 0-indexed positions **1, 3, 6, 8, 10, 16**: `reversedVal = 8 - rawVal`
  - Compute `score = sum of all 20 (scored) values`
  - Build payload `{ prolificID, expName: 'FullPilotW', timestamp, q0…q19 (raw), score }`
  - Call `sendCfiData(payload)`
  - Set `instNum = CFS; setPageInstruction(instNum)`

---

### Step 5 — New page function `cfsPage()` (main.mjs)

Modelled on `dospertScalePage()`:

- Display a 6-button Likert scale per item (1–6, same labels)
- Store responses in `window.cfsResponses = { q0: val, …, q11: val }`
- Validation: all 12 items answered
- On submit:
  - Apply reverse-scoring for items at 0-indexed positions **1, 2, 4, 9**: `reversedVal = 7 - rawVal`
  - Compute `score = sum of all 12 (scored) values`
  - Build payload `{ prolificID, expName: 'FullPilotW', timestamp, q0…q11 (raw), score }`
  - Call `sendCfsData(payload)`
  - Set `instNum = SURVEY; setPageInstruction(instNum)`

---

### Step 6 — New data-sending functions (main.mjs)

Add two functions identical in structure to `sendDospertData`:

```js
const sendCfiData = async (data, call = 0) => { /* POST to CFI_PHP, retry ×3 */ };
const sendCfsData = async (data, call = 0) => { /* POST to CFS_PHP, retry ×3 */ };
```

The old `sendDospertData`, `sendRiskData`, `sendRiskTrialData`, and `sendGeneralRiskData` can be removed or commented out.

---

### Step 7 — New PHP endpoint `php/insert_cfi.php`

Clone insert_dospert.php with these changes:

| | Old | New |
|--|--|--|
| Allowed columns | `prolificID, expName, timestamp, q0–q29` | `prolificID, expName, timestamp, q0–q19, score` |
| Validation | ≥ 30 questions | ≥ 20 questions |
| Table | `spaceprl_dospert` | `spaceprl_cfi` |

---

### Step 8 — New PHP endpoint `php/insert_cfs.php`

Clone insert_dospert.php with:

| | New |
|--|--|
| Allowed columns | `prolificID, expName, timestamp, q0–q11, score` |
| Validation | ≥ 12 questions |
| Table | `spaceprl_cfs` |

---

### Step 9 — Database tables (run on MySQL server)

```sql
CREATE TABLE spaceprl_cfi (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  prolificID VARCHAR(64)  NOT NULL,
  expName    VARCHAR(64),
  timestamp  DATETIME,
  q0  TINYINT, q1  TINYINT, q2  TINYINT, q3  TINYINT, q4  TINYINT,
  q5  TINYINT, q6  TINYINT, q7  TINYINT, q8  TINYINT, q9  TINYINT,
  q10 TINYINT, q11 TINYINT, q12 TINYINT, q13 TINYINT, q14 TINYINT,
  q15 TINYINT, q16 TINYINT, q17 TINYINT, q18 TINYINT, q19 TINYINT,
  score      SMALLINT
);

CREATE TABLE spaceprl_cfs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  prolificID VARCHAR(64)  NOT NULL,
  expName    VARCHAR(64),
  timestamp  DATETIME,
  q0  TINYINT, q1  TINYINT, q2  TINYINT, q3  TINYINT,
  q4  TINYINT, q5  TINYINT, q6  TINYINT, q7  TINYINT,
  q8  TINYINT, q9  TINYINT, q10 TINYINT, q11 TINYINT,
  score      SMALLINT
);
```

---

### Final experiment flow (post-games)

```
window.endFull2()
  └─► CFI questionnaire   (phase 14) → sendCfiData  → spaceprl_cfi
  └─► CFS questionnaire   (phase 15) → sendCfsData  → spaceprl_cfs
  └─► Post-game survey    (phase 16) → sendFeedback → spaceprl_feedback
  └─► End / Prolific redirect (phase 17)
```

---

**Files to create:** `php/insert_cfi.php`, `php/insert_cfs.php`  
**Files to modify:** main.mjs  
**No changes needed to:** index.html, html_templates.mjs, `game.mjs`, webpack config