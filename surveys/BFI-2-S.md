# BFI-2-S — Big Five Inventory-2 Short Form (30-item)

**Source:** Soto & John (2017), *Journal of Research in Personality*. See [sources.md](sources.md) for links.
**Estimated time:** ~5 min
**Items:** 30
**Response scale:** 5-point, 1 = "Disagree strongly" → 5 = "Agree strongly"

> ⚠️ **Verify before launch**: the item list below was reconstructed from a
> third-party reproduction (not the official Colby PDF, which could only be
> retrieved as binary). The domain/reverse-key assignment follows the
> documented cyclic pattern and was checked item-by-item for semantic
> consistency (all 30 check out — see table below). Still, do a final
> side-by-side check against the official form at
> https://www.colby.edu/wp-content/uploads/2013/08/bfi2s-form.pdf if possible.

## Instructions (for participants)

> Here are a number of characteristics that may or may not apply to you.
> For example, do you agree that you are someone who likes to spend time
> with others? Please indicate the extent to which you agree or disagree
> with that statement.
>
> **I am someone who...**

## Scale labels

| Value | Label |
|---|---|
| 1 | Disagree strongly |
| 2 | Disagree a little |
| 3 | Neutral; no opinion |
| 4 | Agree a little |
| 5 | Agree strongly |

## Items

Each item completes the stem "I am someone who…". **(R)** = reverse-scored.

1. ...tends to be quiet. **(R)**
2. ...is compassionate, has a soft heart.
3. ...tends to be disorganized. **(R)**
4. ...worries a lot.
5. ...is fascinated by art, music, or literature.
6. ...is dominant, acts as a leader.
7. ...is sometimes rude to others. **(R)**
8. ...has difficulty getting started on tasks. **(R)**
9. ...tends to feel depressed, blue.
10. ...has little interest in abstract ideas. **(R)**
11. ...is full of energy.
12. ...assumes the best about people.
13. ...is reliable, can always be counted on.
14. ...is emotionally stable, not easily upset. **(R)**
15. ...is original, comes up with new ideas.
16. ...is outgoing, sociable.
17. ...can be cold and uncaring. **(R)**
18. ...keeps things neat and tidy.
19. ...is relaxed, handles stress well. **(R)**
20. ...has few artistic interests. **(R)**
21. ...prefers to have others take charge. **(R)**
22. ...is respectful, treats others with respect.
23. ...is persistent, works until the task is finished.
24. ...feels secure, comfortable with self. **(R)**
25. ...is complex, a deep thinker.
26. ...is less active than other people. **(R)**
27. ...tends to find fault with others. **(R)**
28. ...can be somewhat careless. **(R)**
29. ...is temperamental, gets emotional easily.
30. ...has little creativity. **(R)**

## Domain assignment (1-indexed item numbers)

| Domain | Items (R = reverse) |
|---|---|
| Extraversion | 1R, 6, 11, 16, 21R, 26R |
| Agreeableness | 2, 7R, 12, 17R, 22, 27R |
| Conscientiousness | 3R, 8R, 13, 18, 23, 28R |
| Negative Emotionality | 4, 9, 14R, 19R, 24R, 29 |
| Open-Mindedness | 5, 10R, 15, 20R, 25, 30R |

## Reverse-scored items (0-indexed q0..q29)

```
reverseItems = [0, 2, 6, 7, 9, 13, 16, 18, 19, 20, 23, 25, 26, 27, 29]
// 1-indexed: 1, 3, 7, 8, 10, 14, 17, 19, 20, 21, 24, 26, 27, 28, 30
```

## Scoring

For reverse-scored items, recoded value = `6 - raw` (since scale is 1–5).

```
domain_score[d] = mean of that domain's 6 items (after reverse-recoding)
```
Each domain score ranges 1–5. Store both the raw `q0..q29` responses and the
five domain scores.

## Hypothesis link (context only — not for implementation)

Tests whether the strategic shift (perceptual → value-based, or vice versa)
reflects a stable personality trait (e.g. Open-Mindedness, Conscientiousness)
or is purely task-driven re-weighting independent of personality.
