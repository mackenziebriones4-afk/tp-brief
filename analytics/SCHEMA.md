# Weekly analytics: rules

Written every Monday 06:30 Manila by the weekly scan. One file per week: `YYYY-Www.json`.
`index.json` lists the weeks (newest last). The app reads these files. The daily job never touches them.

## Items (about 15 a week)
id, title, category (AI | Cloud | Cyber), type (incident | release | trend), niche (1 to 5, 5 = most niche),
region (TK | PH | Global), topic, severity (1 to 3, incidents only), why (one line: why it matters for TP content),
when (date text), sources[] (name, url, tier, read).

- Every item needs a real source that was actually opened. No source, no item.
- Only items from the last 7 days. If fewer than 10 pass, publish what passed and set `thin_week: true`. Never pad.
- Trends need sources too.

## Confidence (shown as `CONFIDENCE: 84%`, numbers only)
- Base from the best source opened: primary (vendor advisory, CVE, regulator, SEC filing, company blog) = 60;
  reputable outlet (news or trade press) = 45; weak (blog, forum, social, repost, headline-only) = 30, capped at 40.
- +15 for each extra independent source opened, up to 100.
- -25 if another source contradicts it.
- Below 30: greyed in the app and left out of every count.

## Calm score (the weekly health bar, per region)
calm = round(max(0, 100 - 3 * sum(severity * confidence / 100)))  over incident items with confidence >= 30.
Items count for a region when region equals it or is Global. 100 is a quiet week, low is a heavy week.

## Topics
Each item has one short topic. The app draws the top 3 topics by item count as trend lines, one point per week.

## Run
`python3 analytics/tools/build_week.py analytics/tools/raw-YYYY-Www.json` writes the week file and updates `index.json`.
