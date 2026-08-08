# Skilltracker Mobile — Complete Redesign Plan
*Authored: 2026-08-08*

---

## 1. UX Audit Findings

### Critical Issues (must fix)
- **Home screen is empty** — two pill-shaped cards with invisible text. No useful information. Fails the "5-second team understanding" requirement.
- **Player profile has no radar/visualization** — only flat skill bars. No longitudinal trend. No development narrative.
- **Assessment flow is multi-screen per skill** — too slow. Brief says 30–45 seconds total.
- **Match setup keyboard dominates** — "START MATCH" CTA hidden behind keyboard.
- **Live match: 3-tap model** — brief requires ≤2 taps per event.
- **Invisible CTAs** — "Create first assessment" button is white-on-white (confirmed in IMG_8666).
- **Squad list has no filters** — no position filter, no assessment status filter, no sort.
- **Insights tab is empty** — no content visible in screenshots.
- **No parent experience** — single role only.
- **No empty/loading/error/offline states** — screens just go blank.
- **No longitudinal development trend** — no line chart anywhere.
- **Assessment review is missing** — no review screen before save.
- **Match summary is sparse** — no zone map, no pattern insights.

### Secondary Issues
- Inconsistent spacing — some screens use 20px padding, others use 16px.
- Avatar colors are random and low-contrast on some combinations.
- Progress bars use amber for "Developing" but green for everything else — not semantic.
- "New" chip on unassessed players is amber but has no icon — not accessible.
- Tab bar has 3 tabs (Home, Players, Insights) but Home is the only entry point for Match — buried.
- No haptic feedback on assessment selections.
- No undo on assessment selections.
- Coach notes step has no voice hint visible.

---

## 2. New Information Architecture

### Coach Navigation (4 tabs)
```
HOME     TEAM     MATCH     INSIGHTS
```
- **HOME**: Command Center — team snapshot, next action, upcoming match, quick actions
- **TEAM**: Squad list with filters → Player Development Profile → Skill Detail → Assessment History
- **MATCH**: Match hub → Setup → Live Capture → Summary
- **INSIGHTS**: Team insights → Team skill detail → Player comparison

### Parent Navigation (3 tabs)
```
OVERVIEW     PROGRESS     FOCUS
```
- **OVERVIEW**: Player card, radar, strength/focus, latest observation
- **PROGRESS**: Development trend, assessment history, skill detail
- **FOCUS**: Current development focus, coach notes, what to work on

### Screen Inventory
| # | Screen | Route |
|---|--------|-------|
| 01 | Coach Home | `/(tabs)/index` |
| 02 | Squad | `/(tabs)/team` |
| 03 | Player Profile | `/player/[id]` |
| 04 | Skill Detail | `/player/[id]/skill/[key]` |
| 05 | Assessment — Player Select | `/assess` |
| 06 | Assessment — Skills | `/assess/[playerId]` |
| 07 | Assessment — Notes | (step within assess flow) |
| 08 | Assessment — Review | (step within assess flow) |
| 09 | Match Setup | `/match/setup` |
| 10 | Live Match Capture | `/match/live/[id]` |
| 11 | Match Summary | `/match/summary/[id]` |
| 12 | Team Insights | `/(tabs)/insights` |
| 13 | Team Skill Detail | `/insights/skill/[key]` |
| 14 | Assessment History | `/player/[id]/history` |
| 15 | Parent Home | `/(parent)/index` |
| 16 | Player Dev Profile | `/(parent)/player` |
| 17 | Parent Skill Detail | `/(parent)/skill/[key]` |
| 18 | Development History | `/(parent)/history` |
| 19 | Latest Assessment | `/(parent)/assessment` |
| 20 | Current Focus | `/(parent)/focus` |

---

## 3. Design Tokens

### Color Palette
```
// Structural
navy:        #0F1F2E   (deep navy — primary structural)
navyMid:     #1C3A52
navyLight:   #2E5C82

// Primary interaction (emerald/teal)
primary:     #00A878   (emerald green)
primaryDark: #006B4D
primarySoft: #E8F7F3
sage:        #C2E0D8

// Attention / Focus (warm amber)
amber:       #F59E0B
amberDark:   #92400E
amberSoft:   #FEF3C7

// Developing / Warning (soft coral)
coral:       #F87171
coralDark:   #991B1B
coralSoft:   #FEE2E2

// Backgrounds
background:  #F5F6F4   (off-white, warm)
surface:     #FFFFFF
surfaceAlt:  #F0F1EF
surfaceElev: #FAFAFA

// Text
ink:         #111827   (near-black)
inkMid:      #374151
muted:       #6B7280
faint:       #9CA3AF

// Borders
border:      #E5E7EB
borderMid:   #D1D5DB

// Semantic
developing:  #F87171   (coral)
secure:      #F59E0B   (amber)
strong:      #00A878   (emerald)
```

### Typography Scale
```
displayLg:   36px / 800 weight / -0.8 tracking
displayMd:   30px / 800 weight / -0.6 tracking
pageTitle:   26px / 800 weight / -0.5 tracking
sectionHead: 20px / 700 weight / -0.3 tracking
cardTitle:   17px / 700 weight / -0.2 tracking
body:        16px / 400 weight / 0 tracking
bodyMed:     16px / 600 weight / 0 tracking
caption:     13px / 500 weight / 0.2 tracking
eyebrow:     12px / 700 weight / 0.8 tracking / uppercase
```

### Spacing System (8pt)
```
xs:   4
sm:   8
md:   12
base: 16
lg:   24
xl:   32
2xl:  48
3xl:  64
```

### Border Radius
```
sm:   8
md:   12
lg:   16
xl:   20
2xl:  24
full: 999
```

### Touch Targets
- Minimum: 44×44 (WCAG AA)
- Assessment buttons: 80px height minimum
- Match event buttons: 88px height minimum
- Touchline mode: 96px height minimum

---

## 4. Component Hierarchy

### Primitives (lib/design-tokens.ts)
All tokens exported as a single object.

### Base Components (components/ui/)
- `PlayerAvatar` — initials + accent color, sizes: sm/md/lg/xl
- `SkillBadge` — Developing/Secure/Strong with icon + color + text
- `DevelopmentDelta` — ↑0.3 / ↓0.1 / — with color coding
- `AssessmentFreshness` — "4 days ago" / "Overdue" / "Today"
- `EmptyState` — icon + title + body + optional CTA
- `LoadingState` — skeleton shimmer
- `ErrorState` — error icon + message + retry
- `OfflineState` — offline icon + message
- `InsightCard` — insight + explanation + optional visualization
- `FocusCard` — amber card: skill name + coaching cue
- `StrengthCard` — green card: skill name + observation

### Visualization Components (components/charts/)
- `SkillRadar` — SVG 6-axis radar, current + optional ghost polygon
- `SkillTrendLine` — SVG line chart, 4w/3m/season, skill filter
- `SkillBar` — horizontal bar with label, value, delta
- `PitchMap` — SVG 9-zone pitch, tappable or display-only
- `PitchHeatmap` — zone intensity overlay on PitchMap
- `EventSelector` — 4 large outcome buttons (post-zone-tap)

### Screen Components (components/screens/)
- `CoachCommandCenter` — home screen content
- `PlayerRow` — squad list row: avatar + name + number + position + freshness + score + delta
- `PlayerDevelopmentProfile` — full profile: header + radar + strength/focus + trend
- `AssessmentSkillCard` — full-screen skill assessment card
- `LiveMatchHeader` — LIVE timer + score + event counts
- `MatchEventFeed` — scrollable event list with undo
- `TeamInsightsFeed` — insight-first team analytics

---

## 5. Assessment Flow Redesign

### New Model: Single-Screen Swipe Cards
Instead of one screen per skill (6 screens), use a horizontal card stack:
- Full-screen card per skill
- Three large tap targets: DEVELOPING / SECURE / STRONG
- Progress dots at top: ● ● ● ○ ○ ○
- Swipe left/right OR tap to advance
- Notes as a final card (card 7)
- Review as a final card (card 8)
- Total: 8 cards, ~5 seconds each = 40 seconds

### Skill Card Layout
```
[Progress: 3 of 6]
[Player name]

BALL CONTROL
How effectively did [name] control the ball?

[  DEVELOPING  ]  ← 88px height, coral tint when selected
[   SECURE     ]  ← 88px height, amber tint when selected
[   STRONG     ]  ← 88px height, green tint when selected

[coaching cue text]
```

---

## 6. Live Match Capture Redesign

### 2-Tap Model
```
TAP 1: Tap a pitch zone (9 zones on SVG pitch)
  → Pitch zones expand slightly, event overlay appears

TAP 2: Tap one of 4 large event buttons:
  [↑ PROGRESSION]  [⚡ CHANCE]
  [● RETENTION]    [× TURNOVER]

→ Haptic confirmation
→ Toast: "Progression · Left attacking third" + [UNDO] for 4 seconds
```

### Live Match Screen Layout
```
[LIVE  24:17  vs Juventus]
[Events: 12  Prog: 6  Chance: 3  Turn: 3]

[──────── PITCH (fills screen) ────────]
[  9 tappable zones, large touch areas  ]

[Event overlay appears after zone tap]
```

---

## 7. Implementation Order

1. **Design tokens + palette** (lib/design-tokens.ts, lib/palette.ts)
2. **Base UI components** (components/ui/)
3. **Visualization primitives** (components/charts/)
4. **Coach Home** (/(tabs)/index.tsx)
5. **Squad + Player Profile** (/(tabs)/team.tsx, /player/[id].tsx)
6. **Assessment flow** (/assess/[playerId].tsx)
7. **Match Setup + Live + Summary**
8. **Team Insights**
9. **Parent experience** (/(parent)/)
10. **System states** (empty/loading/error/offline)
11. **Settings**
12. **QA pass**
13. **TypeScript check + commit + OTA**
