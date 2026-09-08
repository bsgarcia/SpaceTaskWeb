# Reinforcement Learning And Perceptual Inference Space Shooter Game 

## Research

This task is the experimental paradigm behind the paper **"Biased yet flexible weighting of perceptual and value information during decision-making"** (Garcia, Wyart & Bavelier), posted as a preprint on Research Square: [doi.org/10.21203/rs.3.rs-9140831/v1](https://doi.org/10.21203/rs.3.rs-9140831/v1).

### Abstract

Human decision making routinely relies on combining cues from value-based and perceptual dimensions. Despite their frequent overlap in everyday decisions, these processes have mostly been studied separately, such that it remains unclear how humans combine perceptual and value-based information during decision-making. To address this gap, we ran 4 experiments (total N = 245) where we developed a gamified hybrid bandit task that orthogonally manipulates value and perceptual information across all options, each of which combines both dimensions. We found that humans can flexibly combine perceptual and learnt value information, yet with a bias toward perceptual cues. Analysis of individual differences revealed three decision strategies: 'value-dominant', 'perceptual-dominant', and 'combined' — for which both sources of information are weighted more equally. Crucially, varying task parameters across different iterations of the task successfully shifted the distribution of participants among these three decision strategies. Computational modeling further indicated that most participants combine perceptual and value information, with one dimension dominating the other. Individual differences in risk aversion could not explain participants' decision strategy. Because single-dimension strategies yield suboptimal decision accuracy, their use betrays a tradeoff between cognitive effort and decision accuracy, revealing how humans flexibly arbitrate between perceptual and value-based information during hybrid decisions.

### Task design

Each trial pits two options against each other, where an option combines two independently manipulated dimensions:

- **Value (spaceship):** four distinct spaceship shapes, each associated with a mean reward (280, 380, 620, or 720), learned through trial-and-error reinforcement learning.
- **Perceptual uncertainty (shield):** a noisy shield surrounding the spaceship, whose pixel density (white to black) signals the probability that it will be destroyed (0.12–0.88), following a classic dominant-color perceptual-discrimination paradigm.

A reward is only obtained if the chosen spaceship's shield is destroyed; a resistant shield yields zero points, forcing participants to weigh the probability of success against the potential reward. Participants first complete separate training blocks for the value and perceptual dimensions, then a combination task (144 trials) where both are presented together (see `src/`, `plan.md`, and `PROJECT_STRUCTURE.md` for implementation details).

Three payoff variants of the combination task were run across experiments:
- **E1 — "All or nothing":** shield failure yields zero reward.
- **E2 — "Partial reward":** shield failure still yields 50% of the potential reward.
- **E3 — "Partial destroy":** feedback is deterministic, awarding the full expected value (reward × shield strength) rather than a binary outcome.

### Key findings

- Participants show a robust **bias toward perceptual cues**, maintaining near-optimal accuracy on the shield dimension while performing significantly worse on the value dimension, despite learning both equally well during training.
- Individual differences reveal three stable strategies — **perceptual-dominant**, **value-dominant**, and **combined** — captured by a computational model's weighting parameter (ω), which arbitrates between perceptual and value log-evidence before a softmax choice.
- This perceptual-first bias is **not explained by risk aversion** (no correlation with Holt & Laury lottery choices or DOSPERT scores), and is associated with **faster response times**, consistent with a saliency-driven heuristic.
- The bias is **flexible, not fixed**: reducing the cost of perceptual errors (E2) shifted nearly half of participants toward value-dominant strategies, and removing probabilistic risk altogether (E3) significantly increased the prevalence of balanced, combined strategies.

### Citation

```
Garcia, B., Wyart, V., & Bavelier, D. (2026). Biased yet flexible weighting of
perceptual and value information during decision-making. Research Square (preprint).
https://doi.org/10.21203/rs.3.rs-9140831/v1
```
