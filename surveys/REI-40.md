# REI-40 — Rational-Experiential Inventory (40-item)

**Source:** Pacini, R., & Epstein, S. (1999). The relation of rational and experiential information processing styles to personality, basic beliefs, and the ratio-bias phenomenon. *Journal of Personality and Social Psychology, 76*(6), 972–987. Items verified against Table 1 of the paper. See [sources.md](sources.md) for links.
**Estimated time:** ~6 min
**Items:** 40
**Response scale:** 5-point, 1 = "Definitely False" → 5 = "Definitely True"

## Instructions (for participants)

> Rate how well each statement describes you, using the scale provided.

## Scale labels

| Value | Label |
|---|---|
| 1 | Definitely False |
| 2 | Mostly False |
| 3 | Neither True nor False |
| 4 | Mostly True |
| 5 | Definitely True |

## Items

Items marked **(R)** are reverse-scored. Subscale codes from Table 1: **re** = Rational Engagement, **ra** = Rational Ability, **ee** = Experiential Engagement, **ea** = Experiential Ability.

### Rational Subscale (items 1–20)

1. I try to avoid situations that require thinking in depth about something. (re) **(R)**
2. I'm not that good at figuring out complicated problems. (ra) **(R)**
3. I enjoy intellectual challenges. (re)
4. I am not very good at solving problems that require careful logical analysis. (ra) **(R)**
5. I don't like to have to do a lot of thinking. (re) **(R)**
6. I enjoy solving problems that require hard thinking. (re)
7. Thinking is not my idea of an enjoyable activity. (re) **(R)**
8. I am not a very analytical thinker. (ra) **(R)**
9. Reasoning things out carefully is not one of my strong points. (ra) **(R)**
10. I prefer complex problems to simple problems. (re)
11. Thinking hard and for a long time about something gives me little satisfaction. (re) **(R)**
12. I don't reason well under pressure. (ra) **(R)**
13. I am much better at figuring things out logically than most people. (ra)
14. I have a logical mind. (ra)
15. I enjoy thinking in abstract terms. (re)
16. I have no problem thinking things through carefully. (ra)
17. Using logic usually works well for me in figuring out problems in my life. (ra)
18. Knowing the answer without having to understand the reasoning behind it is good enough for me. (re) **(R)**
19. I usually have clear, explainable reasons for my decisions. (ra)
20. Learning new ways to think would be very appealing to me. (re)

### Experiential Subscale (items 21–40)

21. I like to rely on my intuitive impressions. (ee)
22. I don't have a very good sense of intuition. (ea) **(R)**
23. Using my gut feelings usually works well for me in figuring out problems in my life. (ea)
24. I believe in trusting my hunches. (ea)
25. Intuition can be a very useful way to solve problems. (ee)
26. I often go by my instincts when deciding on a course of action. (ee)
27. I trust my initial feelings about people. (ea)
28. When it comes to trusting people, I can usually rely on my gut feelings. (ea)
29. If I were to rely on my gut feelings, I would often make mistakes. (ea) **(R)**
30. I don't like situations in which I have to rely on intuition. (ee) **(R)**
31. I think there are times when one should rely on one's intuition. (ee)
32. I think it is foolish to make important decisions based on feelings. (ee) **(R)**
33. I don't think it is a good idea to rely on one's intuition for important decisions. (ee) **(R)**
34. I generally don't depend on my feelings to help me make decisions. (ee) **(R)**
35. I hardly ever go wrong when I listen to my deepest gut feelings to find an answer. (ea)
36. I would not want to depend on anyone who described himself or herself as intuitive. (ee) **(R)**
37. My snap judgments are probably not as good as most people's. (ea) **(R)**
38. I tend to use my heart as a guide for my actions. (ee)
39. I can usually feel when a person is right or wrong, even if I can't explain how I know. (ea)
40. I suspect my hunches are inaccurate as often as they are accurate. (ea) **(R)**

## Reverse-scored items (0-indexed q0..q39)

```
reverseItems = [0, 1, 3, 4, 6, 7, 8, 10, 11, 17, 21, 28, 29, 31, 32, 33, 35, 36, 39]
// 1-indexed: 1, 2, 4, 5, 7, 8, 9, 11, 12, 18, 22, 29, 30, 32, 33, 34, 36, 37, 40
// Total: 19 reverse-scored items (10 Rational, 9 Experiential)
```

## Scoring

For reverse-scored items, recoded value = `6 - raw` (scale is 1–5).

```
rational_score     = sum of q0..q19  (after recoding)   // range 20–100
experiential_score = sum of q20..q39 (after recoding)   // range 20–100
```

Sub-subscale indices (0-indexed, for analysis only):
- Rational Engagement (re): q0, q2, q4, q5, q6, q9, q10, q14, q17, q19
- Rational Ability    (ra): q1, q3, q7, q8, q11, q12, q13, q15, q16, q18
- Experiential Engagement (ee): q20, q24, q25, q29, q30, q31, q32, q33, q35, q37
- Experiential Ability    (ea): q21, q22, q23, q26, q27, q28, q34, q36, q38, q39

## Hypothesis link (context only — not for implementation)

Tests whether experiential processing (high Experiential, low Rational) predicts
perceptual dominance and reduced strategic shifting in the within-subject RL task.
