# Scoring Model

How the prototype thinks about ranking reporters. In this pass all scores are
hand-authored in `data/reporters.json` — nothing is computed. This document
defines what the numbers *mean* so a later pass can compute them honestly.

## Principle

The Fit Score answers one question: **does this reporter have a demonstrated
reason to care about this specific story, and can we meet their standard of
proof?** It is not a measure of outlet prestige, audience size, or how much we
want the coverage.

## Fit Score (0–100)

A weighted blend of five components, each scored 0–100:

| Component | Weight | What it measures |
|---|---|---|
| Beat relevance | 30% | How squarely the story sits inside what this reporter actually covers — judged from their published work, not their outlet's masthead. |
| Coverage recency | 15% | Whether they've touched adjacent topics *recently*. A perfect-beat reporter who hasn't written about the space in two years scores low. |
| Audience overlap | 15% | How much their readership overlaps with the audiences named in the Story Brief. |
| Proof match | 25% | Whether the evidence we actually have meets this reporter's demonstrated standard. A data-driven reporter scores low here if our key claims are self-reported. |
| Receptivity | 15% | Practical likelihood of engagement: inbound volume, stated pitch preferences, past relationship, recent freshness of our contact. |

**Fit = 0.30·beat + 0.15·recency + 0.15·audience + 0.25·proof + 0.15·receptivity**

Fit scores are rounded to the nearest whole number. Proof match is weighted
second-highest on purpose. It is the component that encodes the product
thesis: relevance without evidence is spam with good targeting.

## Tiers

| Range | Tier | Reading |
|---|---|---|
| 80–100 | Strong fit | Lead targets. Pitch individually, first. |
| 65–79 | Conditional fit | Worth pitching if a specific gap is closed or a specific angle is used. The cautions on the scout card say which. |
| 50–64 | Stretch | Only with a bespoke angle. Usually a "watch" rather than a target. |
| < 50 | No fit | Would not be recommended for the deck. Spray-and-pray is the failure mode this product exists to prevent. |

## Fit vs. readiness

Fit and readiness are deliberately separate axes. **Fit** answers "is this
the right reporter for this story?" **Readiness** answers "can we pitch them
*now*?" — given the gaps the diagnosis found. A reporter can be the best fit
on the deck and still be a bad send today (see Maya Okafor in the sample
data: fit 88, readiness *conditional* until a utility partner goes on
record).

Reporter cards carry one of three readiness levels:

| Level | Meaning |
|---|---|
| Ready to pitch | Nothing in the gaps list blocks this reporter's standard of proof. |
| Conditional | Pitchable once a named gap is closed; the note on the card says which. |
| Hold | Pitching now would burn the relationship — wait. |

The "Likely Target Types" module on the diagnosis applies the same idea one
level up: audience categories rated **high / medium / low** readiness before
any individual reporter is scored. "Early Scout Signals" on the same screen
previews mini scout cards with no fit number — labelled "Scout preview" —
because the full, scored card belongs to the Target Deck. The Story Brief
itself shows nothing derived: intake first, reveal after diagnosis.

## Story Diagnosis signals (0–100)

Independent of any reporter. Scored against the brief itself:

- **Timeliness** — is there a real, dated peg beyond "we want coverage now"?
- **Tension** — does the story contain a conflict, contrarian claim, or stakes?
- **Evidence** — proof points weighted by strength grade (strong / moderate / weak) and by whether sources will go on record.
- **Audience stakes** — does a specific group's situation change because of this?
- **Novelty** — is this under-covered, or the fourth identical announcement this quarter?

A story can be diagnosed "pitchable, with gaps" — the gaps list is the work
plan for raising the Evidence score before outreach starts.

The UI colors signal bars by threshold: 70+ accent (healthy), 55–69 amber
(weak), below 55 red (a reason not to pitch yet).

## Known limitations of this pass

- All scores are editorial judgments encoded as sample data.
- No decay model for coverage recency; dates are eyeballed.
- Receptivity has no signal source — in a real system it would need opt-in
  relationship history, never scraped behavior.
