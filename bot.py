#!/usr/bin/env python3
"""
SpaceTaskWithin smoke-test bot
==============================
Navigates the full experiment flow, skips Unity WebGL games via JS injection,
fills all surveys automatically, and verifies every PHP API call succeeds.

Requirements
------------
    pip install playwright requests
    playwright install chromium

Usage
-----
    # Full browser run against local dev server:
    python bot.py --url http://localhost:8080

    # Headless (CI) mode:
    python bot.py --url http://localhost:8080 --headless

    # Only run direct API checks (no browser needed):
    python bot.py --api-only --url http://localhost:8080

    # Against the live EC2 server:
    python bot.py --url http://ec2-107-21-104-92.compute-1.amazonaws.com --headless

Experiment flow (instNums)
--------------------------
  0  Landing
  1  Consent (4 checkboxes)
  2  Instructions inst_1.md
  3  Tutorial game        → endTutorial()
  4  Instructions inst_3.md
  5  RL Training 1        → endTrainingRL(0)
  6  Rest inst_5.md
  7  Perceptual Training  → endTrainingPerceptual()
  8  Rest inst_7.md
  9  RL Training 2        → endTrainingRL(2)
 10  Rest inst_9.md
 11  Full game            → endFull(3)
 12  Instructions inst_11.md
 13  Full2 game           → endFull2()
 14  CFI survey (20 q, 1–7 Likert)
 15  CFS survey (12 q, 1–6 Likert)
 18  CS Task page         → skip()
 17  End page             ✓
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from datetime import datetime
from typing import Any

# ── Colour helpers (ANSI, falls back gracefully on Windows) ───────────────────
try:
    import colorama  # type: ignore
    colorama.init()
    GREEN = "\033[92m"
    RED   = "\033[91m"
    YELLOW = "\033[93m"
    CYAN  = "\033[96m"
    RESET = "\033[0m"
except ImportError:
    GREEN = RED = YELLOW = CYAN = RESET = ""


# ── Logging ───────────────────────────────────────────────────────────────────
def _ts() -> str:
    return datetime.now().strftime("%H:%M:%S")

def log(msg: str)   -> None: print(f"{CYAN}[{_ts()}]{RESET} {msg}", flush=True)
def ok(msg: str)    -> None: print(f"{GREEN}[{_ts()}] ✔  {msg}{RESET}", flush=True)
def warn(msg: str)  -> None: print(f"{YELLOW}[{_ts()}] ⚠  {msg}{RESET}", flush=True)
def err(msg: str)   -> None: print(f"{RED}[{_ts()}] ✘  {msg}{RESET}", flush=True)


# ── Constants ─────────────────────────────────────────────────────────────────
DEFAULT_TIMEOUT_MS = 25_000   # per-step timeout (ms)
DEFAULT_BASE_URL   = "http://localhost:8080"

# Fake scores injected before each game-end callback so window.score is valid.
FAKE_SCORES = {
    3:  [100, 150, 200],   # tutorial
    5:  [300, 400],        # RL training 1
    7:  [450, 500],        # perceptual training
    9:  [550, 600],        # RL training 2
    11: [700, 750, 800],   # full game
    13: [950, 1000, 1050], # full2 game
}


# ─────────────────────────────────────────────────────────────────────────────
# Browser helpers
# ─────────────────────────────────────────────────────────────────────────────

def _local_inst_num(page: Any) -> int:  # type: ignore[return]
    """Read instNum from localStorage (updated synchronously in setPageInstruction)."""
    try:
        val = page.evaluate("() => parseInt(localStorage.getItem('instNum') ?? '0')")
        return int(val)
    except Exception:
        return -1


def wait_for_inst(page: Any, expected: int, timeout_ms: int = DEFAULT_TIMEOUT_MS) -> None:
    """Block until localStorage.instNum equals *expected*."""
    try:
        page.wait_for_function(
            f"() => parseInt(localStorage.getItem('instNum') ?? '0') === {expected}",
            timeout=timeout_ms,
        )
        ok(f"  instNum → {expected}")
    except Exception:
        current = _local_inst_num(page)
        raise RuntimeError(
            f"Timed out waiting for instNum={expected}. "
            f"Current instNum in localStorage={current}"
        )


def click_next(page: Any, label: str = "", delay_ms: int = 400) -> None:
    """Wait for #next-button to be visible then click it."""
    page.wait_for_selector("#next-button", state="visible", timeout=DEFAULT_TIMEOUT_MS)
    page.wait_for_timeout(delay_ms)  # small human-like pause
    page.click("#next-button")
    if label:
        log(f"    → Next: {label}")


def inject_score_and_call(page: Any, inst: int, js_call: str) -> None:
    """Set window.score with fake points and call the game-end JS function."""
    scores = FAKE_SCORES.get(inst, [500])
    scores_json = json.dumps(scores)
    page.evaluate(
        f"() => {{ "
        f"  window.score = {scores_json}; "
        f"  localStorage.setItem('score', JSON.stringify(window.score)); "
        f"  {js_call} "
        f"}}"
    )
    log(f"    → JS executed: {js_call}  (score={scores})")


# ─────────────────────────────────────────────────────────────────────────────
# Direct API smoke-tests (no browser required)
# ─────────────────────────────────────────────────────────────────────────────

def _api_post(base_url: str, endpoint: str, payload: dict) -> tuple[bool, str]:
    """POST to php/{endpoint} and return (success, message)."""
    try:
        import requests  # type: ignore
    except ImportError:
        return False, "requests library not installed (pip install requests)"

    # Strip any query string from the base URL before appending the PHP path
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(base_url)
    clean_base = urlunparse((parsed.scheme, parsed.netloc, parsed.path.rstrip('/'), '', '', ''))
    url = f"{clean_base}/php/{endpoint}"
    try:
        resp = requests.post(
            url, json=payload, timeout=10,
            headers={
                'Content-Type':  'application/json',
                'Referer':       clean_base,
                'Origin':        f"{parsed.scheme}://{parsed.netloc}",
                'X-Requested-With': 'XMLHttpRequest',
            },
        )
        # Try to parse as JSON
        try:
            body = resp.json()
            success = body.get("status") == "success"
            msg = body.get("message", str(body))
        except Exception:
            # Non-JSON response — show HTTP status + first 200 chars of body
            snippet = resp.text[:200].replace('\n', ' ').strip()
            return False, f"HTTP {resp.status_code} — non-JSON: {snippet!r}"
        if not success:
            msg = f"HTTP {resp.status_code} — {msg}"
        return success, msg
    except Exception as exc:
        return False, str(exc)


def run_api_checks(base_url: str, prolific_id: str) -> list[dict]:
    """Send minimal valid payloads to every active PHP endpoint and return results."""
    timestamp = datetime.utcnow().isoformat()
    results: list[dict] = []

    tests: list[tuple[str, dict]] = [
        # insert.php – game session data
        ("insert.php", {
            "prolificID": prolific_id,
            "expName":    "BotTest",
            "score":      500,
            "timestamp":  timestamp,
            "sessionID":  "bot-session-1",
            "gameNumber": 1,
        }),
        # insert_cfi.php – CFI survey (20 questions, q0–q19)
        ("insert_cfi.php", {
            "prolificID": prolific_id,
            "expName":    "BotTest",
            "timestamp":  timestamp,
            "score":      80,
            **{f"q{i}": random.randint(1, 7) for i in range(20)},
        }),
        # insert_cfs.php – CFS survey (12 questions, q0–q11)
        ("insert_cfs.php", {
            "prolificID": prolific_id,
            "expName":    "BotTest",
            "timestamp":  timestamp,
            "score":      50,
            **{f"q{i}": random.randint(1, 6) for i in range(12)},
        }),
        # insert_feedback.php – post-game feedback (q0–q4, open_q0–open_q4)
        ("insert_feedback.php", {
            "prolificID":  prolific_id,
            **{f"q{i}":      "Agree"                    for i in range(5)},
            **{f"open_q{i}": "Bot-generated response."  for i in range(5)},
        }),
        # insert_dospert.php – DOSPERT 30-item scale
        ("insert_dospert.php", {
            "prolificID": prolific_id,
            "expName":    "BotTest",
            "timestamp":  timestamp,
            **{f"q{i}": random.randint(1, 7) for i in range(30)},
        }),
        # insert_risk.php – Holt-Laury lottery choices (choice_0–choice_9)
        ("insert_risk.php", {
            "prolificID": prolific_id,
            "expName":    "BotTest",
            "selected":   3,
            "amount":     1.32,
            **{f"choice_{i}": random.randint(0, 1) for i in range(10)},
        }),
    ]

    for endpoint, payload in tests:
        success, message = _api_post(base_url, endpoint, payload)
        results.append({"endpoint": endpoint, "success": success, "message": message})
        if success:
            ok(f"  API {endpoint} → success")
        else:
            err(f"  API {endpoint} → FAILED: {message}")

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Main browser bot
# ─────────────────────────────────────────────────────────────────────────────

def run_browser_bot(base_url: str, headless: bool, prolific_id: str) -> list[dict]:
    """
    Drive the full experiment in a real browser, skipping games and filling
    surveys. Returns a list of API call records captured during the run.
    """
    from playwright.sync_api import sync_playwright  # type: ignore

    api_log: list[dict] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(DEFAULT_TIMEOUT_MS)

        # ── Track PHP responses ───────────────────────────────────────────
        def on_response(response: Any) -> None:
            if "/php/" in response.url:
                endpoint = response.url.split("/php/")[-1]
                try:
                    body  = response.json()
                    succ  = body.get("status") == "success"
                    entry = {
                        "endpoint": endpoint,
                        "success":  succ,
                        "status":   body.get("status", "?"),
                        "message":  body.get("message", ""),
                    }
                    api_log.append(entry)
                    if succ:
                        ok(f"    API {endpoint} → success")
                    else:
                        err(f"    API {endpoint} → FAILED: {entry['message']}")
                except Exception as exc:
                    api_log.append({"endpoint": response.url, "success": False, "message": str(exc)})
                    warn(f"    API response parse error ({response.url}): {exc}")

        page.on("response", on_response)

        # ── Build page URL (strip any query string from base, then add our params) ──
        from urllib.parse import urlparse, urlunparse, urlencode
        parsed_base = urlparse(base_url)
        clean_path  = urlunparse((parsed_base.scheme, parsed_base.netloc,
                                   parsed_base.path.rstrip('/') + '/index.html',
                                   '', urlencode({'prolificID': prolific_id, 'DEBUG': '1'}), ''))
        url = clean_path

        # ── Load page ─────────────────────────────────────────────────────
        log(f"Opening: {url}")
        page.goto(url, wait_until="domcontentloaded")

        # ── Phase 0: Landing ──────────────────────────────────────────────
        log("[Phase 0] Landing page")
        wait_for_inst(page, 0)
        click_next(page, "Landing → Consent")

        # ── Phase 1: Consent ──────────────────────────────────────────────
        log("[Phase 1] Consent form — checking all 4 boxes")
        wait_for_inst(page, 1)
        page.wait_for_selector("input[type='checkbox']", timeout=DEFAULT_TIMEOUT_MS)
        # BeerCSS renders checkboxes as <label class="checkbox"><input><span> where the
        # <span> overlays the input and intercepts pointer events. Use JS to check directly.
        n_checked = page.evaluate("""
            () => {
                const boxes = document.querySelectorAll("input[type='checkbox']");
                boxes.forEach(cb => {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                    cb.dispatchEvent(new Event('input',  { bubbles: true }));
                });
                return boxes.length;
            }
        """)
        log(f"    Checked {n_checked} checkbox(es) via JS")
        click_next(page, "Consent → inst_1.md")

        # ── Phase 2: inst_1.md ────────────────────────────────────────────
        log("[Phase 2] Instructions — inst_1.md")
        wait_for_inst(page, 2)
        click_next(page, "inst_1.md → Tutorial game")

        # ── Phase 3: Tutorial game ────────────────────────────────────────
        log("[Phase 3] Tutorial game — calling endTutorial()")
        wait_for_inst(page, 3)
        inject_score_and_call(page, 3, "window.endTutorial();")

        # ── Phase 4: inst_3.md (rest) ─────────────────────────────────────
        log("[Phase 4] Instructions — inst_3.md")
        wait_for_inst(page, 4)
        click_next(page, "inst_3.md → RL Training 1")

        # ── Phase 5: RL Training 1 ────────────────────────────────────────
        log("[Phase 5] RL Training 1 — calling endTrainingRL(0)")
        wait_for_inst(page, 5)
        inject_score_and_call(page, 5, "window.endTrainingRL(0);")

        # ── Phase 6: inst_5.md (rest) ─────────────────────────────────────
        log("[Phase 6] Instructions — inst_5.md (rest)")
        wait_for_inst(page, 6)
        click_next(page, "inst_5.md → Perceptual Training")

        # ── Phase 7: Perceptual Training ──────────────────────────────────
        log("[Phase 7] Perceptual Training — calling endTrainingPerceptual()")
        wait_for_inst(page, 7)
        inject_score_and_call(page, 7, "window.endTrainingPerceptual();")

        # ── Phase 8: inst_7.md (rest) ─────────────────────────────────────
        log("[Phase 8] Instructions — inst_7.md (rest)")
        wait_for_inst(page, 8)
        click_next(page, "inst_7.md → RL Training 2")

        # ── Phase 9: RL Training 2 ────────────────────────────────────────
        log("[Phase 9] RL Training 2 — calling endTrainingRL(2)")
        wait_for_inst(page, 9)
        inject_score_and_call(page, 9, "window.endTrainingRL(2);")

        # ── Phase 10: inst_9.md (rest) ────────────────────────────────────
        log("[Phase 10] Instructions — inst_9.md (rest)")
        wait_for_inst(page, 10)
        click_next(page, "inst_9.md → Full game")

        # ── Phase 11: Full game (all_or_none) ─────────────────────────────
        log("[Phase 11] Full game — calling endFull(3)")
        wait_for_inst(page, 11)
        inject_score_and_call(page, 11, "window.endFull(3);")

        # ── Phase 12: inst_11.md (pre-game-5) ────────────────────────────
        log("[Phase 12] Instructions — inst_11.md (before game 5)")
        wait_for_inst(page, 12)
        click_next(page, "inst_11.md → Full2 game")

        # ── Phase 13: Full2 game (partial_reward) ─────────────────────────
        log("[Phase 13] Full2 game — calling endFull2()")
        wait_for_inst(page, 13)
        inject_score_and_call(page, 13, "window.endFull2();")

        # ── Phase 14: CFI survey (20 questions, 1–7 Likert) ───────────────
        log("[Phase 14] CFI survey — auto-filling via window.fill()")
        wait_for_inst(page, 14)
        page.wait_for_selector("#cfi-form", timeout=DEFAULT_TIMEOUT_MS)
        page.evaluate("() => window.fill()")
        page.wait_for_timeout(500)  # let UI settle
        # Verify all 20 responses were recorded
        cfi_filled = page.evaluate(
            "() => window.cfiResponses ? Object.keys(window.cfiResponses).length : 0"
        )
        if cfi_filled < 20:
            warn(f"    CFI: only {cfi_filled}/20 responses set before submit")
        click_next(page, "CFI → CFS")

        # ── Phase 15: CFS survey (12 questions, 1–6 Likert) ───────────────
        log("[Phase 15] CFS survey — auto-filling via window.fill()")
        wait_for_inst(page, 15)
        page.wait_for_selector("#cfs-form", timeout=DEFAULT_TIMEOUT_MS)
        page.evaluate("() => window.fill()")
        page.wait_for_timeout(500)
        cfs_filled = page.evaluate(
            "() => window.cfsResponses ? Object.keys(window.cfsResponses).length : 0"
        )
        if cfs_filled < 12:
            warn(f"    CFS: only {cfs_filled}/12 responses set before submit")
        click_next(page, "CFS → CS Task")

        # ── Phase 18: CS Task (external link — skip) ──────────────────────
        log("[Phase 18] CS Task — skipping via window.skip()")
        wait_for_inst(page, 18)
        page.evaluate("() => window.skip()")

        # ── Phase 17: End page ────────────────────────────────────────────
        log("[Phase 17] Waiting for End page...")
        wait_for_inst(page, 17)
        ok("Bot reached the END page — full experiment flow completed!")

        # Grab a screenshot for inspection
        screenshot_path = "bot_end_screenshot.png"
        page.screenshot(path=screenshot_path)
        log(f"    Screenshot saved → {screenshot_path}")

        browser.close()

    return api_log


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def print_summary(api_log: list[dict], prolific_id: str) -> int:
    successes = [r for r in api_log if r.get("success")]
    failures  = [r for r in api_log if not r.get("success")]

    print("\n" + "=" * 60)
    print(f"  Bot run summary  |  Prolific ID: {prolific_id}")
    print("=" * 60)
    print(f"  API calls total:  {len(api_log)}")
    print(f"  Successful:       {GREEN}{len(successes)}{RESET}")
    if failures:
        print(f"  Failed:           {RED}{len(failures)}{RESET}")
        for r in failures:
            print(f"    • {r.get('endpoint', '?')}: {r.get('message', r.get('status', '?'))}")
    else:
        print(f"  Failed:           0")
    print("=" * 60 + "\n")

    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test bot for SpaceTaskWithin experiment.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the experiment server (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run Chromium headless (no visible window — good for CI)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=25,
        help="Per-step timeout in seconds (default: 25)",
    )
    parser.add_argument(
        "--api-only",
        action="store_true",
        dest="api_only",
        help="Skip browser automation; only fire direct HTTP checks to PHP endpoints",
    )
    parser.add_argument(
        "--prolific-id",
        default=None,
        dest="prolific_id",
        help="Prolific ID to use (default: auto-generated BOT-XXXXXX)",
    )
    args = parser.parse_args()

    global DEFAULT_TIMEOUT_MS
    DEFAULT_TIMEOUT_MS = args.timeout * 1000

    prolific_id = args.prolific_id or f"BOT-{random.randint(100_000, 999_999)}"

    log(f"SpaceTaskWithin smoke-test bot")
    log(f"  Target URL:   {args.url}")
    log(f"  Prolific ID:  {prolific_id}")
    log(f"  Mode:         {'API-only' if args.api_only else 'headless browser' if args.headless else 'headed browser'}")

    api_log: list[dict] = []

    # ── Direct API checks (always run, even in browser mode) ─────────────────
    log("\n── Direct API endpoint checks ───────────────────────────────────")
    api_check_results = run_api_checks(args.url, f"{prolific_id}-APICHECK")
    api_log.extend(api_check_results)

    if args.api_only:
        return print_summary(api_log, prolific_id)

    # ── Browser flow ──────────────────────────────────────────────────────────
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401 — just check import
    except ImportError:
        err(
            "playwright not installed. Run:\n"
            "  pip install playwright\n"
            "  playwright install chromium"
        )
        return 1

    log("\n── Browser automation ───────────────────────────────────────────")
    try:
        browser_api_log = run_browser_bot(args.url, args.headless, prolific_id)
        api_log.extend(browser_api_log)
    except RuntimeError as exc:
        err(str(exc))
        return 1
    except Exception as exc:
        err(f"Unexpected error: {exc}")
        import traceback
        traceback.print_exc()
        return 1

    return print_summary(api_log, prolific_id)


if __name__ == "__main__":
    sys.exit(main())
