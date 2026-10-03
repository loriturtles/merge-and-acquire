# Merge & Acquire — build brief

> Working title. A merge-2 mobile game where you live a whole career in tech, from uni to retirement.
> Read this file first, then `data/chains.json`, then look at `assets/preview.png` and the files in `design/reference/`.

## 1. What we're building

A casual merge game for iPhone, in the same family as Travel Town, Gossip Harbor and Merge Mansion, but set in office life. The humour is corporate satire anyone with a job recognises: two emails merge into a thread, two threads into a reply-all, and eventually you get a restructure.

**Core loop**
1. Tap a **generator** on the board (costs 1 hour of your work week) to spawn a tier-1 item.
2. Drag two identical items together to **merge** them into the next tier.
3. Colleagues post **requests in a team chat**. Deliver the item they want for a bonus (salary or shares) and XP.
4. XP fills your level. Levels are **job titles**. Enough promotions move you to the next **career chapter**.
5. Spend salary to **rebuild the space** for your current chapter (share house → garage startup → open-plan floor …).

## 2. Career storyline (7 chapters)

| # | Chapter | Age | Space you rebuild | Job titles | Orders from | Chains unlocked |
|---|---|---|---|---|---|---|
| 1 | Uni | 18–21 | The share house | Fresher → Tutor | Flatmates, your tutor | Study, Share-house food |
| 2 | First job | 22–24 | The garage startup | Intern → Grad engineer | Two founders and a dog | Code, Swag |
| 3 | Junior | 25–29 | The open-plan floor | Analyst → Senior analyst | Your manager, Sales | Inbox, Coffee |
| 4 | Lead | 30–35 | The scale-up | Team lead → Head of | The exec team | Strategy, Data |
| 5 | Manager | 36–44 | Big tech campus | Director → VP | Your 40 direct reports | Hiring, Office culture |
| 6 | Exec | 45–60 | Your own HQ | COO → Founder & CEO | Investors, the board | Funding |
| 7 | Retirement | 61+ | The beach house | Board member → Grandparent | Grandkids, ex-colleagues | Garden |

Earlier chains stay available in later chapters, so the board gets richer as you progress. In Retirement, ex-colleagues still message asking for "one quick favour" (the Inbox chain comes back as a joke).

### 2b. Career paths (supersedes the single storyline above from chapter 2 on)

After the Uni performance review the player **chooses a path**. The path decides job titles, salaries, generators and chains, who messages you, and one **rule twist** that changes how the game plays. Chapters (life stages) stay the same; the table above is now flavour for the default storyline. A second fork (stay a specialist or go into management) comes at chapter 5 in a later milestone. Paths meet again at exec level (CTO / CPO / CRO / CEO).

| Path | Ch 2 titles | Ch 3 titles | Ch 2 chain (generator) | Ch 3 adds | Twist |
|---|---|---|---|---|---|
| Engineer | SWE intern → Junior engineer | Software engineer → Senior engineer | Code (Laptop) | Data (Server rack) | **On call:** a pager drops Bug items onto your desk every few minutes |
| Product | APM intern → Associate PM | Product manager → Senior PM | Strategy (Printer) | Inbox (In-tray) | **Stakeholders:** requests ask for more items at once and pay ×1.5 |
| Sales | Sales intern → Sales development rep | Account executive → Senior AE | Swag (Merch box) | Coffee (Coffee machine) | **Commission:** payday is base salary only; deliveries pay ×3 |
| Founder | Solo founder → Pre-seed founder | Seed-stage CEO → Series A CEO | Code (Laptop) | Funding (Piggy bank) | **Equity-rich, cash-poor:** tiny salary, generators can drop tiers 1–3, every delivery also grants a share |

- **Spaces to rebuild:** ch 1 the share house, ch 2 the garage startup, ch 3 the open-plan floor (all paths).
- **Cast:** each path has its own workplace cast of 5 (see `src/content/characters.ts`), all drawn as funny tech archetypes, never real people.
- **Salaries** are real US figures with sources in `src/content/salaries.ts`; each payday pays one fortnightly paycheck (annual ÷ 26).
- **Levels are job titles.** Filling the XP bar promotes you to the next title (pay rise and share grant). Passing a chapter's last title triggers its performance review and the next chapter.

## 3. Economy

Keep every number in **one config file** (e.g. `src/config/economy.ts`) so it can be tuned without touching game logic. Starting values below are guesses for playtesting.

**Hours (replaces energy)**
- 40 hours a week. Each generator tap costs 1 hour.
- Refills 1 hour every 2 minutes of real time, up to 40.
- **Overtime:** at 0 hours you can keep working up to 15 extra hours.
- **Burnout:** using more than 15 overtime hours in a rolling 24h triggers "Burnt out" for 30 minutes: generators only drop tier-1 items and orders pay half. A "long weekend" (stop playing, or spend shares) clears it.
- Later chapters change the week: Uni has lots of hours but weak generators; Exec has fewer hours but generators sometimes drop tier 2–3; Retirement has no cap.

**Salary (everyday currency)**
- Paid on a payday timer (every 4 real hours of play) and scales with job title. Every promotion is a visible pay rise.
- Order rewards are **bonuses** on top of salary.
- Spent on rebuilding each chapter's space, and earned by selling items you don't need.

**Shares (premium currency)**
- Earned from promotions, bigger orders and events.
- They **vest**: you can see unvested shares, but can't spend them for 24 hours.
- Cash in vested shares for: a full refill of hours (no burnout), skipping an item up a tier, an extra generator slot, or unlocking a rare chain.
- **IPO twist:** in the Exec chapter the share price can jump, multiplying held shares. This is the reason to hold rather than spend.
- If monetisation is added later, shares are the thing to sell.

**Events** (timed, appear as a pill in the chat header)
- **Performance review** (end of each chapter): score based on orders filled → promotion, pay rise and share grant.
- **Salary review** (seasonal): choose a pay rise, more shares, or a better title (the title does nothing — that's the joke).
- **Engagement survey:** three silly questions; office mood rises and orders pay better for a week.
- **End of financial year:** a rush of urgent orders, double bonuses.
- **Hackathon weekend:** pizza and code items drop twice as often.
- **Restructure:** shuffles the board and swaps your manager, rewards adapting quickly.
- **Christmas party season:** themed limited-time decorations.

Start with the core loop plus **one** event (the engagement survey) and add the rest later.

## 4. The 12 chains

Full data, including the asset file for every tier, is in `data/chains.json`. Six tiers each. Max tier can't merge further; it's for orders or selling. Sell value: 2^tier salary.

| Chain | Generator | Tiers 1 → 6 |
|---|---|---|
| Study | Backpack | Highlighter, Lecture notes, Flashcards, Essay, A+ exam, Degree |
| Share-house food | Microwave | Instant noodles, Toastie, Pizza slice, Whole pizza, Hackathon pizzas, Graduation cake |
| Code | Laptop | Bug, Patch, Pull request, Feature, App release, Product launch |
| Swag | Merch box | Laptop sticker, Lanyard, Tote bag, Launch T-shirt, Hoodie, The fleece vest |
| Inbox | In-tray | Email, Thread, Reply-all, Meeting, Offsite, Restructure |
| Coffee | Coffee machine | Coffee bean, Espresso, Flat white, Oat latte, Coffee run, Coffee cart |
| Strategy | Printer | Sticky note, Whiteboard, Slide, Slide deck, Strategy, Pivot |
| Data | Server rack | Cell, Spreadsheet, Chart, Dashboard, Forecast, Board report |
| Hiring | Recruiter's phone | Résumé, Interview, Offer letter, New starter, Team, Department |
| Office culture | Office fridge | Biscuit, Cupcake, Morning tea, Birthday cake, Farewell card, Christmas party |
| Funding | Piggy bank | Coin, Coin stack, Cash bundle, Term sheet, Series A, IPO bell |
| Garden | Watering can | Seed packet, Seedling, Pot plant, Tomato plant, Veggie patch, Greenhouse |

**Art that exists:** all 72 items (`assets/items/`), 3 generators (`assets/generators/`: in-tray, coffee machine, piggy bank) and 3 currency icons (`assets/icons/`: hours, salary, shares).
**Art still to make:** the other 9 generators (backpack, microwave, laptop, merch box, printer, server rack, recruiter's phone, office fridge, watering can). Draw them as SVG following section 5 exactly, matching the existing generator files.

## 5. Visual style — "glossy vinyl, bubbly"

Every item looks like a squishy, glossy collectible desk toy. Use the provided SVGs as-is. New art must match:

- **Round everything.** Corner radius at least 15% of the item's size. No sharp points, even on fins, flaps and arrows.
- **One light, top left.** Radial gradients with the bright centre at about (35%, 28%): highlight → base → shadow, never darker than the shadow tone.
- **Soft shine:** one blurred white streak or blob per surface on the lit side.
- **Solid base:** a darker copy of the main shape offset ~5 units down, behind it, so items feel thick.
- **Contact shadow:** a blurred ellipse under every item, `#2a2140` at ~22% opacity.
- **One hero colour per item.** Neighbouring tiers differ in colour, size or both.
- **No thin parts** (under ~6% of item width) and no outlines.
- **Soft edge at board size (required):** on the board, render items with a faint dark edge so pale items don't blend into the cells, e.g. `filter: drop-shadow(0 0 0.8px rgba(42,33,64,.45))`, or the SVG morphology filter used in `design/reference/GameScreenG.dc.html` (`#edge`). Not needed at large sizes.
- All item art uses a 120×120 viewBox.

**Palette (highlight / base / shadow)**

| Name | Highlight | Base | Shadow |
|---|---|---|---|
| Red | #ffb3a6 | #f04f3c | #a32a1e |
| Orange | #ffd0a8 | #ff8a3a | #c4561a |
| Yellow | #fff4bd | #ffc93a | #cf8f0c |
| Green | #b8f6d4 | #3fbf82 | #1f7a50 |
| Blue | #d3e7ff | #3f86f2 | #1f4fa8 |
| Purple | #e6d8ff | #8f63f0 | #4f2fb0 |
| Pink | #ffdcea | #ff8cb8 | #c94f80 |
| Paper | #ffffff | #f2f4f9 | #c3cbdb |
| Kraft | #fae2bc | #d9b27a | #9c7440 |
| Ink | #8a81b8 | #3a3358 | #221b38 |

**UI**
- Font: **Manrope** (Google Fonts). 800 for headings with −0.02em letter spacing, 700 for labels, 500 for body. Use tabular numbers for currencies.
- Page background `#eef1f7`, text `#2a2140`, secondary text `#4d4866`.
- Board: `#b9c5da` tray with inset shadow, cells with a soft radial `#e8edf5 → #d4dce9`, radius ~14px. Generator cells get a warm yellow radial fill with a `#f2b733` ring and a small clock badge.
- Cards, buttons and nav are rounded and pill-shaped, with soft drop shadows. Primary buttons use a green gradient (`#7fe0ad → #2a9c66`).
- **Orders are team chat messages** in a channel called `#team-requests`: avatar, name, team, time, a short line of dialogue, and the requested item with its reward. A message you can fill is highlighted green with a Deliver button. Keep the chat look generic — **do not copy Slack's name, logo or colours** (App Store risk).
- The reference mockup for the main screen is `design/reference/GameScreenG.dc.html` (a 390×844 phone layout). It uses a templating syntax (`<sc-for>`, `<sc-if>`, `{{…}}`), but the layout, sizes and colours are all readable as plain HTML/CSS.

## 6. Main screen layout (top to bottom, 390×844)

1. Chapter + job title ("CHAPTER 3 · THE OPEN-PLAN FLOOR / Senior Analyst"), level and XP bar ("Lv 7 · review in 2 days").
2. Three stat pills: hours ("32h of 40 this week"), salary ("$4,820 · Payday in 1h 12m"), shares ("18 · +6 vesting").
3. `#team-requests` chat panel with 3 messages and the event pill.
4. The board: 7 columns × 7 rows (go to 8 rows if space allows on larger phones).
5. Selected-item bar: item art, name, "Coffee · tier 4 of 6. Merge two for a coffee run.", Sell button.
6. Bottom nav: Desk (board), Office (rebuild the space), Team, Shares.

## 7. Technical approach

- **Phase 1: web app, mobile first.** Vite + React + TypeScript. It must play well in Safari on an iPhone (touch drag with pointer events, no hover-dependent UI, `touch-action: none` on the board). Use the SVG assets directly.
- **Phase 2: iOS app.** Wrap the same web app with Capacitor for TestFlight and the App Store (needs a Mac with Xcode and an Apple Developer account). Add haptics through Capacitor at that point.
- State: a single game-state object, saved to `localStorage` (later Capacitor Preferences). Include offline progress (hours refilled, payday timers, vesting) when the app reopens.
- Keep game rules pure and testable (merge rules, order matching, economy maths) and separate from rendering. Write unit tests for them.
- Content as data: chains, chapters, job titles, characters and their chat lines, rebuild tasks and events all live in JSON or TS config files, not in components.

## 8. Milestones

1. **Core loop, Uni chapter:** board, generators, drag to merge, hours with refill, chat orders, salary payday, sell, save and load. Playable on a phone.
2. **Career progression:** XP, job titles, the path choice after Uni, promotion to chapters 2–3 for all four paths with their chains, generators and twists; shares with vesting; overtime and burnout.
3. **Rebuild screens** for each chapter (Office tab), plus the engagement survey and performance review events.
4. **Polish:** merge and spawn animations, sound, all 7 chapters, remaining events, the 9 missing generators, a debug panel for tuning the economy.
5. **iOS:** Capacitor wrap, haptics, app icon, TestFlight build.

After each milestone: run the tests, then check the game in a mobile-sized browser viewport and fix anything that looks broken before moving on.

## 9. Files in this kit

- `CLAUDE.md` — this brief
- `data/chains.json` — the 12 chains, tiers, generators and asset paths
- `assets/items/` — 72 item SVGs, named `{chain}-{tier}-{name}.svg`
- `assets/generators/` — in-tray, coffee machine, piggy bank
- `assets/icons/` — hours, salary, shares
- `assets/preview.html` and `assets/preview.png` — every item on one sheet
- `design/reference/GameScreenG.dc.html` — main screen mockup
- `design/reference/StyleG.dc.html` — style guide page
- `design/reference/ChainsG.dc.html` — all chains page
- `design/reference/Career.dc.html` — storyline and chapters page (older art style; use for content only)

## 10. Working in this repo

- `npm run dev`: dev server on the local network (`--host`), for testing on a phone over Wi-Fi.
- `npm test`: unit tests for the game rules (`src/game/*.test.ts`). `npx tsc -b` and `npx oxlint` must stay clean.
- `npm run ios:open`: builds, syncs to `ios/` and opens Xcode. Needs full Xcode installed.
- `/dev/phones.html`: the game at three iPhone viewport sizes side by side. `?save=name` gives a separate save slot.
- Dev console: `__game.set({ ... })` patches the live game state (dev builds only).
- Art scripts: `node scripts/avatars.mjs` (cast avatars) and `node scripts/app-icon.mjs` (app icon, macOS only).
- Layout: rules in `src/game/` (pure, no React), content in `src/content/`, numbers in `src/config/economy.ts`, UI in `src/ui/`.
- Status: milestones 1–3 are done, including career paths for chapters 1–3. Next: polish (milestone 4) and chapters 4–7 per path.
