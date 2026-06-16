# Survey/Task Materials — Sources

Index of where the item text, scales, and scoring keys in this folder were
sourced from. Use these links if anything needs re-verifying against the
original publication or an official form.

| Instrument | File | Primary source(s) | Notes |
|---|---|---|---|
| REI-40 (Rational-Experiential Inventory, 40-item) | [REI-40.md](REI-40.md) | Pacini, R., & Epstein, S. (1999). *J. Personality & Social Psychology, 76*(6), 972–987. Item text cross-checked via web search against multiple academic reproductions. | 5-point scale (1=Definitely False … 5=Definitely True). Two subscales: Rational (items 1–20) and Experiential (items 21–40), each split into Ability and Engagement (10 items each). 13 reverse-scored items. |
| CFQ (Cognitive Failures Questionnaire, 25-item) | [CFQ.md](CFQ.md) | [Cognitive Failures Questionnaire — UC Berkeley (Kihlstrom)](https://www.ocf.berkeley.edu/~jfkihlstrom/ConsciousnessWeb/Meditation/CFQ.htm) | Broadbent, Cooper, FitzGerald, & Parkes (1982). 0–4 scale, no reverse items, sum 0–100. |
| OCI-R (Obsessive-Compulsive Inventory-Revised, 18-item) | [OCI-R.md](OCI-R.md) | Subscale structure: [NovoPsych OCI-R](https://novopsych.com/assessments/diagnosis/obsessional-compulsive-inventory-revised-oci-r/); item wording cross-checked via multiple clinic PDF reproductions (e.g. [caleblack.com OCI-R.pdf](http://www.caleblack.com/psy5960_files/OCI-R.pdf), [grnspace.com OCI-R.pdf](https://www.grnspace.com/print/oci-r.pdf)) | Foa et al. (2002). 0–4 scale, no reverse items, total 0–72, 6 subscales of 3 items each (0–12). |
| BFI-2-S (Big Five Inventory-2 Short Form, 30-item) | [BFI-2-S.md](BFI-2-S.md) | Item list: [LCBC-UiO questionnaires reference](https://lcbc-uio.github.io/questionnaires/articles/bfi-2.html) (note: that page is documented as BFI-2 full form but the 30-item list it returned matches the BFI-2-S "I am someone who…" item set); domain/reverse-key pattern verified against [Colby Personality Lab BFI-2-S](https://www.colby.edu/wp-content/uploads/2013/08/bfi2s-form.pdf) and Soto & John (2017), *Journal of Research in Personality* | Domain assignment follows the cyclic pattern (items 1,6,11,16,21,26→Extraversion; 2,7,12,17,22,27→Agreeableness; 3,8,13,18,23,28→Conscientiousness; 4,9,14,19,24,29→Negative Emotionality; 5,10,15,20,25,30→Open-Mindedness), which was cross-checked item-by-item against the reverse-key for internal consistency — all 30 items check out semantically. **Recommend a final spot-check against the official Colby PDF form before launch** since it could only be machine-read as binary, not text. |
| WCST-64 (Wisconsin Card Sorting Test, 64-card) | [WCST-64.md](WCST-64.md) | Implementation: [vekteo/WCST_jsPsych on GitHub](https://github.com/vekteo/WCST_jsPsych) (MIT license); background: [Wikipedia — Wisconsin Card Sorting Test](https://en.wikipedia.org/wiki/Wisconsin_Card_Sorting_Test) | Not a questionnaire — see WCST-64.md for the implementation/integration plan (external task page, mirroring the existing Color-Shape Task pattern). |

## General notes

- All four questionnaires (REI-40, CFQ, OCI-R, BFI-2-S) are widely used in
  academic research and free to use for non-commercial research purposes;
  none require a paid license. WCST-64 itself (the official PAR product) is
  commercial/copyrighted — we use an open-source simulation instead (see
  WCST-64.md).
- Each `*.md` file in this folder is written to mirror the structure of
  `cfiPage()` in `src/main.mjs` (question array + reverse-item list + scale +
  scoring formula) so it can be mechanically translated into a page function.
