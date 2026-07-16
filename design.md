# Tactiq Mobile Interface Design

**Product direction.** Tactiq Mobile combines the strongest parts of the two source products: fast in-match tactical capture from Tactiq and player development tracking from SkillTracker. The mobile product deliberately removes the web apps’ duplicated dashboards, administrative surfaces, CRM, blog, and multi-role navigation. A coach should be able to answer three questions quickly: **What needs attention today? Who is improving? What happened in the match?**

The interface is designed for **mobile portrait orientation (9:16)** and one-handed use. Primary actions sit in the lower half of each screen, destructive actions require confirmation, touch targets are at least 44 points, and navigation follows mainstream iOS conventions: large titles, concise grouped content, native-feeling sheets, clear back behavior, restrained motion, and a persistent four-item tab bar.

## Screen List and Layout

| Screen | Primary content and layout | Core functionality |
|---|---|---|
| Home | Large “Today” title, compact team context, one prominent next-action card, a two-column status snapshot, and a short recent-activity list. | Start a match, begin an assessment, resume unfinished work, and open recent player or match records. |
| Squad | Large title with search, a segmented Team/Players control, compact roster rows, and a single floating add action. | Browse teams and players, search the roster, select a player, and open team or player details. |
| Player Detail | Identity header, current development score, strongest skill, focus skill, recent assessments, and a fixed lower “Assess player” action. | Review development, see trend history, and begin a new assessment. |
| Assessment | Player context at the top, one skill group at a time, three large rating choices, a short optional note field, and a fixed save action. | Rate technical and tactical skills on a simple 1–3 scale, move between groups, add notes, and save locally. |
| Capture | A choice sheet for “Match” or “Assessment,” keeping creation out of the tab bar and reducing competing calls to action. | Start either core capture workflow from one place. |
| Match Setup | Team, opponent, date, and a single “Start match” button in a short form. | Create a local match record and enter live capture. |
| Live Match | Compact match header and clock, a large 3×3 pitch-zone grid, outcome choices directly below, pressure toggle, and a fixed “Record event” action. Undo remains visible near the event count. | Start, pause, resume, or end a match; record zone, outcome, pressure, and minute; undo the latest event; see lightweight live feedback. |
| Match Summary | Final score context, three key performance metrics, a zone activity view, up to three tactical insights, and suggested next actions. | Review the match, understand tactical patterns, and open the recommended focus or drill. |
| Insights | Team/Player segmented control, concise progress cards, skill trend bars, recent match patterns, and a focus list. | Compare development over time without dense charts or desktop-style analytics panels. |
| Settings | Team preference, appearance, haptics, data reset, and product information in iOS-style grouped sections. | Adjust local preferences and reset demo/local data with confirmation. |

## Navigation Model

The bottom tab bar contains **Home**, **Squad**, **Capture**, and **Insights**. Capture uses the same visual weight as the other tabs rather than an oversized center button, maintaining a familiar native hierarchy. Player Detail, Assessment, Match Setup, Live Match, Match Summary, and Settings are pushed or presented from these four roots, so the tab bar does not become a catalogue of features.

Web-only surfaces such as CRM, bulk email actions, blog publishing, marketing pages, administrator analytics, invitations, and component showcases are excluded from the first mobile version. Team management and player development remain, but forms are shorter and administrative controls are secondary to coaching tasks.

## Key User Flows

| Goal | Mobile flow |
|---|---|
| Record a match event | Home or Capture → Match Setup → Start Match → Tap pitch zone → Select outcome → Optionally change pressure → Record Event → Haptic confirmation → Continue or Undo. |
| Finish a match | Live Match → End Match → Confirmation sheet → Match Summary → Review insights → Return Home. |
| Assess a player | Home or Capture → Assessment → Select player if needed → Rate each skill group → Add optional note → Save → Player Detail with updated trend. |
| Review a player | Squad → Search or select team → Player row → Player Detail → Review latest assessment and focus skill → Assess Player. |
| Find the next coaching priority | Insights → Team view → Focus list → Select item → Relevant player or match summary. |

## Visual System

The source products use dark obsidian surfaces, bright emerald, cyan accents, and Inter. The mobile redesign preserves the recognizable **emerald coaching-performance identity** and the simple letterform character of the existing logo, while moving away from dense dark dashboards and blue-heavy highlights.

| Token | Light value | Dark value | Intended use |
|---|---:|---:|---|
| Primary emerald | `#168A68` | `#63D6AE` | Primary actions, selected states, progress, and brand emphasis. |
| Deep ink | `#18231F` | `#F3F8F5` | Primary text and icons. |
| Background | `#F6F8F4` | `#101613` | Warm, light screen background with minimal blue. |
| Surface | `#FFFFFF` | `#18201C` | Cards, sheets, and grouped sections. |
| Soft sage | `#E7F1EB` | `#24372F` | Selected rows, positive context, and subtle field backgrounds. |
| Muted text | `#6D7772` | `#AAB5AF` | Supporting labels and metadata. |
| Border | `#DDE5E0` | `#314039` | Hairline separators and input boundaries. |
| Amber | `#C98218` | `#F0B45A` | Attention states and medium pressure. |
| Coral | `#C75245` | `#F28A7E` | Destructive actions and negative outcomes. |

Cards use 16–20 point corner radii, subtle borders, and almost no drop shadow. Blue is not used as a dominant accent; where platform links conventionally require blue, the brand emerald remains the interactive color. Typography uses the system font stack for a first-party iOS feel, with large screen titles, 17-point body copy, and tabular numerals for match time and metrics.

## Interaction Principles

The live-match experience is optimized for repeated, low-attention use on the sideline. The chosen pitch zone remains selected after recording so that the coach can quickly record repeated events, while the outcome resets. A light success haptic confirms a recorded event, medium haptics mark pause/resume, and an error haptic accompanies validation failures. The interface never relies on color alone: outcomes pair color with a label and symbol, selected states use both fill and border, and metrics include plain-language descriptions.

Assessment ratings use three explicit choices—**Developing**, **Secure**, and **Strong**—instead of an ambiguous slider. The underlying values remain 1, 2, and 3 for compatibility with the source model. Progress is summarized as trend and focus rather than a wall of analytics. Empty states explain the next useful action and include one clear button.

## Data and Scope Decisions

The first version uses local persisted data so the mobile experience can be tested without introducing account creation or cloud complexity that the user did not request. The shared vocabulary is Team, Player, Assessment, Match, Match Event, Insight, and Activity. The interface will ship with a coherent demo workspace that can be reset from Settings; all user-created changes persist on the device.

The architecture leaves room for later authentication and cross-device sync, but no login, parent portal, CRM, or remote notification flow is shown in the initial mobile navigation. This keeps the rebuild focused on coaching and makes the product substantially simpler than the two source web applications.
