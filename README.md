# 20 November 2026 — World News in One Image

[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/ijayhalawa/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/ijayhalawa/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

Entry for the make.fun bounty **news-image-20261120** ("Sum up 20 November's
world news in one image").

## What it is

`main.ts` draws a newspaper front page (1024x1024 PNG) that sums up Friday
20 November 2026 in one image. Everything is drawn in code — a hand-made 5x7
bitmap font, a hand-rolled PNG encoder (Node `zlib`), and line-drawn icons.
No network calls, no external assets, no fonts loaded from disk.

## What's on the page

- **Lead:** UK pledges 1,000+ long-range drones for Ukraine in a GBP 260m
  package, announced in Berlin by PM Andy Burnham.
- **World Court:** ICJ rules 9-6 that Myanmar's 2017 crackdown on the
  Rohingya was genocide.
- **Climate — COP31:** draft deal in Antalya drops any mention of fossil
  fuels; warming set to pass 1.5C.
- **Middle East:** Houthis say they hit four Saudi targets, damaging
  Riyadh's tallest tower.
- **Markets:** Taiwan stocks plunge over 2,200 points in a day, below 37,000.
- **Diplomacy:** Trump, Xi and Putin hold their first trilateral talks in
  Shenzhen.
- **Tech:** Anthropic shares rise 17% on their Nasdaq debut (ticker ANT).
- **Also today:** US sanctions on the Comancheros and 'Ndrangheta; Estonia
  to close its Russia border; general strike in Spain; Trump pardons Pete
  Rose.

Facts were checked against Reuters, BBC, AFP, AP and Le Monde round-ups on
the morning of 20 November 2026.

## How to run

Requires Node 22+ (standard library only, nothing to install):

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png (1024x1024, ~23 KB)
```

Run it twice and compare: the two outputs are byte-identical (deterministic
rendering — no dates, no randomness, no network in the program).

## Files

- `main.ts` — the program (font, canvas, PNG encoder, icons, layout)
- `LICENSE` — MIT
- `.makefun/owner.json` — claim file naming the payout wallet
