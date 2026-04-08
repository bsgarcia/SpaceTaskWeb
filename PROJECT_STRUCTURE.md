# Project Structure — SpaceTaskWithin

A gamified reinforcement-learning experiment (space shooter) built for studying decision-making and risk behaviour. Participants play Unity WebGL games, then complete risk-assessment surveys. The study is recruited via **Prolific** and hosted on **AWS EC2**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | ES6 modules, BeerCSS (Material Design), Anime.js, zero-md |
| Game Engine | Unity → WebGL builds |
| Build | Webpack 5 (`src/main.mjs` → `dist/bundle.js`) |
| Backend | PHP 8 + MySQL/PDO |
| Hosting | AWS EC2 (N. Virginia) |

---

## Directory Map

```
SpaceTaskWithin/
├── index.html              ← Main experiment page (loads dist/bundle.js)
├── main.css                ← Global styles (dark Material theme)
├── package.json            ← Webpack + raw-loader deps
├── webpack.config.js       ← Build config (entry: src/main.mjs → dist/bundle.js)
├── compile.sh              ← Runs `npx webpack`
├── cossh.sh                ← SSH shortcut to EC2 instance
├── to_js.sh                ← Legacy .mjs→.js rename (unused)
├── basile_key              ← SSH private key for EC2
│
├── src/
│   ├── main.mjs            ← Core application logic (~2100 lines)
│   ├── modules/
│   │   ├── game.mjs        ← Unity WebGL loader (startUnityGame / quitUnityGame)
│   │   ├── html_templates.mjs ← Landing, consent, rest pages + markdown renderer
│   │   └── utils.mjs       ← URL params, RNG, shuffle, browser detection
│   ├── instructions/       ← Markdown pages rendered via zero-md
│   │   ├── inst_1.md … inst_11.md
│   │   ├── images/         ← Instruction images
│   │   └── videos/         ← Instruction videos
│   ├── game/               ← Unity WebGL builds (one folder per phase)
│   │   ├── tutorial/
│   │   ├── training1/ training2/ training3/
│   │   ├── full/ full2/
│   │   ├── destroy3/ destroy/ partial_reward/ all_or_none/
│   │   ├── pittedgame2/
│   │   └── cssplaceholder/
│   └── cs_task/            ← Color-Shape shift task (DISABLED)
│
├── php/                    ← Server-side data collection
│   ├── login.php           ← DB credentials + connection helper
│   ├── admin.php           ← JSON endpoint: participant progress
│   ├── admin.html          ← Dashboard UI (Materialize table)
│   ├── insert.php          ← Game session data → spaceprl
│   ├── insert_feedback.php ← Post-game survey → spaceprl_feedback
│   ├── insert_dospert.php  ← DOSPERT 30-item → spaceprl_dospert
│   ├── insert_risk.php     ← Lottery choices → spaceprl_risk
│   └── insert_general_risk.php ← General risk → spaceprl_general_risk
│
├── lib/
│   ├── css/                ← Admonitions, stepper, slider, Font Awesome
│   ├── js/                 ← jQuery, Bootstrap, Popper, TweenMax, etc.
│   └── webfonts/           ← Font Awesome icon fonts
│
├── images/                 ← Logos, spaceship sprites, UI assets
└── dist/                   ← Webpack output (bundle.js) — gitignored
```

---

## File Interactions

### Frontend Module Graph

```
index.html
  ├── loads: main.css, lib/css/*.css, lib/js/*.js
  ├── loads: dist/bundle.js  (webpack output)
  │
  └─ dist/bundle.js  ← webpack bundles:
       │
       src/main.mjs  (entry point)
       ├── imports  src/modules/game.mjs
       │     └── calls createUnityInstance() (global, from Unity loader)
       │     └── reads src/game/{phase}/Build/{phase}.loader.js, .data, .framework.js, .wasm
       ├── imports  src/modules/html_templates.mjs
       │     └── fetches src/instructions/inst_*.md at runtime
       │     └── references src/instructions/images/* and videos/*
       └── imports  src/modules/utils.mjs
```

### Frontend → Backend Data Flow

```
main.mjs
  │
  ├── POST /php/insert.php
  │     body: { prolificID, expName, score, timestamp, sessionID, gameNumber }
  │     → spaceprl table
  │
  ├── POST /php/insert_feedback.php
  │     body: { prolificID, q0–q4, open_q0–open_q4 }
  │     → spaceprl_feedback table
  │
  ├── POST /php/insert_dospert.php
  │     body: { prolificID, expName, timestamp, q0–q29 }
  │     → spaceprl_dospert table
  │
  ├── POST /php/insert_risk.php
  │     body: { prolificID, expName, selected, amount, choice_0–choice_9 }
  │     → spaceprl_risk table
  │
  └── POST /php/insert_general_risk.php
        body: { prolificID, expName, riskScore }
        → spaceprl_general_risk table
```

All INSERT endpoints share `login.php` for PDO connection and column whitelisting. Retry logic in main.mjs resends failed POSTs up to 3 times.

### Admin Monitoring

```
admin.html  →  fetch(admin.php)  →  SELECT JOIN on spaceprl  →  JSON table
```

Displays per-participant progress (session × 72 + trial) / 576 as a percentage bar.

### Unity Games ↔ Page

`game.mjs` dynamically constructs the Unity loader path from the phase name and calls `createUnityInstance()`. The Unity runtime communicates back to the page via `window.score` (an array accumulating per-session points). When the game ends, main.mjs reads `window.score`, tears down the Unity canvas (`quitUnityGame()`), and POSTs the results to the server.

### State Persistence

| Store | Data |
|-------|------|
| `localStorage` | `score`, `session`, `instNum`, `end` flag |
| `window.*` globals | `subID`, `session`, `instNum`, `score`, `dospertResponses`, `riskData` |

LocalStorage allows participants to resume after an accidental page refresh.

---

## Experiment Flow

```
 Landing Page (instNum 0)
       │
 Consent Form (instNum 1)  ── 4 checkboxes required
       │
 Instructions ── inst_1.md … inst_N.md (rendered via zero-md)
       │
 ┌─────────────────────────────────────────┐
 │  Tutorial game            (phase 3)     │
 │  Rest                     (phase 6)     │
 │  RL Training 1            (phase 5)     │
 │  Rest                     (phase 8)     │
 │  Perceptual Training      (phase 7)     │
 │  Rest                     (phase 10)    │
 │  RL Training 2            (phase 9)     │
 │  Rest                     (phase 12)    │
 │  Game 4 — full            (phase 11)    │
 │  Game 5 — partial_reward  (phase 13)    │
 └─────────────────────────────────────────┘
       │
 DOSPERT 30-item scale       (phase 14)
       │
 Lottery Risk Assessment     (phase 15)  ── Holt-Laury 10-pair
       │
 Post-game Survey            (phase 16)
       │
 End / Reward Page           (phase 17)  → redirect to Prolific
```

Score is converted to GBP at `CONV = 0.00002` and displayed on the final page.

---

## Database Schema (inferred from PHP column whitelists)

| Table | Columns |
|-------|---------|
| `spaceprl` | prolificID, expName, score, timestamp, sessionID, gameNumber |
| `spaceprl_feedback` | prolificID, q0–q4, open_q0–open_q4 |
| `spaceprl_dospert` | prolificID, expName, timestamp, q0–q29 |
| `spaceprl_risk` | prolificID, expName, selected, amount, choice_0–choice_9 |
| `spaceprl_general_risk` | prolificID, expName, riskScore, timestamp |

---

## Build & Deployment

### Local Build

```bash
npm install          # install webpack + plugins
npx webpack          # or: bash compile.sh
```

This bundles `src/main.mjs` (+ its module imports) into `dist/bundle.js`.

### Production Deployment

The experiment runs on an **AWS EC2** instance at:

```
ec2-107-21-104-92.compute-1.amazonaws.com
```

#### Deploy Steps

1. **SSH into the server**

   ```bash
   ssh -i basile_key basile@ec2-107-21-104-92.compute-1.amazonaws.com
   ```

   (or run `bash cossh.sh`)

2. **Pull latest changes**

   ```bash
   cd /path/to/SpaceTaskWithin
   git pull
   ```

3. **Rebuild the bundle**

   ```bash
   npx webpack        # produces dist/bundle.js
   ```

   The server serves `index.html` which references `dist/bundle.js` and the `php/` endpoints directly — no additional deploy step is needed beyond rebuilding the JS bundle.

### What the Server Needs

- **Apache/Nginx** serving the repo root as a document root
- **PHP** with PDO + MySQL extension
- **MySQL** database `basile` with the five tables listed above
- **Node.js + npm** (for webpack builds on the server)

---

## Disabled / Legacy Components

| Item | Status |
|------|--------|
| `src/cs_task/` (Color-Shape shift task, `.iqjs` files) | Commented out in main.mjs |
| `webpack.config.js.old` | Previous config with content-hashing and HtmlWebpackPlugin |
| `to_js.sh` | Legacy helper, no longer needed |
| `lib/js/` vendor scripts (Bootstrap, jQuery, TweenMax) | Loaded via index.html; some may be unused |
| `php/old/` | Older PHP helpers (connectDB.php, InsertFeedback.php, InsertLearning.php) |

---

## Security Notes

- All PHP INSERT endpoints use **PDO prepared statements** and **column whitelisting** to prevent SQL injection.
- `isValidTable()` restricts queries to five known table names.
- Participant identity is limited to the Prolific anonymised ID — no PII is stored.
- Database credentials live in `php/login.php` (not exposed to the client).
- The SSH private key (`basile_key`) is committed to the repo — consider removing it and using a deploy key or SSH agent instead.
