# OCI-R — Obsessive-Compulsive Inventory-Revised (18-item)

**Source:** Foa, Huppert, Leiberg, Langner, Kichic, Hajcak, & Salkovskis (2002). See [sources.md](sources.md) for links.
**Estimated time:** ~3 min
**Items:** 18
**Response scale:** 5-point, 0 = "Not at all" → 4 = "Extremely"

## Instructions (for participants)

> The following statements refer to experiences that many people have in
> their everyday lives. Circle the number that best describes HOW MUCH that
> experience has DISTRESSED or BOTHERED you during the PAST MONTH.

## Scale labels

| Value | Label |
|---|---|
| 0 | Not at all |
| 1 | A little |
| 2 | Moderately |
| 3 | A lot |
| 4 | Extremely |

## Items

1. I have saved up so many things that they get in the way. *(Hoarding)*
2. I check things more often than necessary. *(Checking)*
3. I get upset if objects are not arranged properly. *(Ordering)*
4. I feel compelled to count while I am doing things. *(Neutralising)*
5. I find it difficult to touch an object when I know it has been touched by strangers or certain people. *(Washing)*
6. I find it difficult to control my own thoughts. *(Obsessing)*
7. I collect things I don't need. *(Hoarding)*
8. I repeatedly check doors, windows, drawers, etc. *(Checking)*
9. I get upset if others change the way I have arranged things. *(Ordering)*
10. I feel I have to repeat certain numbers. *(Neutralising)*
11. I sometimes have to wash or clean myself simply because I feel contaminated. *(Washing)*
12. I am upset by unpleasant thoughts that come into my mind against my will. *(Obsessing)*
13. I avoid throwing things away because I am afraid I might need them later. *(Hoarding)*
14. I repeatedly check gas and water taps and light switches after turning them off. *(Checking)*
15. I need things to be arranged in a particular way. *(Ordering)*
16. I feel that there are good and bad numbers. *(Neutralising)*
17. I wash my hands more often and longer than necessary. *(Washing)*
18. I frequently get nasty thoughts and have difficulty in getting rid of them. *(Obsessing)*

## Subscales (item numbers, 1-indexed)

| Subscale | Items |
|---|---|
| Hoarding | 1, 7, 13 |
| Checking | 2, 8, 14 |
| Ordering | 3, 9, 15 |
| Neutralising | 4, 10, 16 |
| Washing | 5, 11, 17 |
| Obsessing | 6, 12, 18 |

## Reverse-scored items

None.

## Scoring

```
total_score = sum of all 18 item values        // range 0–72
subscale_score[s] = sum of that subscale's 3 items   // range 0–12 each
```

Clinical cutoff (not directly relevant here): total ≥ 21.

## Hypothesis link (context only — not for implementation)

Tests the "stuck in the heuristic" idea — more compulsive participants (higher
OCI-R) stay locked into perceptual-dominance and shift less across game
conditions. Exploratory, likely range-restricted at this sample size.
