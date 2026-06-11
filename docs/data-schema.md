# Data Schema

Shapes of the two local JSON files. All data is fictional sample content;
there is no backend and nothing is fetched from outside the repo.

## `data/sample-story.json` — one Story Brief

```jsonc
{
  "id": "story-001",            // string, unique — identifier only, not rendered
  "company": "Ferrowatt",       // string
  "headline": "…",              // string — working headline, not final copy
  "summary": "…",               // string — plain-language description
  "category": "…",              // string — story type, e.g. "Funding + performance data"

  "timing": {
    "embargoDate": "2026-06-24",  // ISO date
    "flexibility": "…",           // string — how movable the date is
    "peg": "…"                    // string — the external reason this is news NOW
  },

  "proofPoints": [
    {
      "claim": "…",               // string — the assertion as we'd make it
      "evidence": "…",            // string — what actually backs it
      "strength": "strong"        // "strong" | "moderate" | "weak"
    }
  ],

  "audiences": ["…"],             // string[] — who is affected, specifically

  "spokespeople": [
    { "name": "…", "role": "…", "notes": "…" }
  ],

  "diagnosis": {                  // hand-authored in this pass; computed later
    "verdict": "…",               // short label, e.g. "Pitchable, with gaps"
    "summary": "…",               // 2–4 sentence honest read
    "signals": [
      {
        "label": "Timeliness",    // one of the five signals in scoring-model.md
        "score": 78,              // 0–100
        "note": "…"               // why it got that score
      }
    ],
    "gaps": ["…"],                // string[] — what to fix before outreach

    "targetTypes": [              // "Likely Target Types" on the diagnosis —
      {                           // audience categories, scored before any
        "name": "…",              // individual reporter is
        "whyTheyMayCare": "…",    // the audience-level fit case
        "proofNeeded": "…",       // evidence this audience requires
        "readiness": "high"       // "high" | "medium" | "low"
      }
    ]
  }
}
```

## `data/reporters.json` — the Target Deck source

```jsonc
{
  "reporters": [
    {
      "id": "rep-001",            // string, unique — shortlist references this
      "name": "…",                // string (fictional in sample data)
      "outlet": "…",              // string (fictional in sample data)
      "outletType": "…",          // string — trade / regional / newsletter / national …
      "beat": "…",                // string
      "location": "…",            // string
      "avatar": "assets/reporters/black-01.svg",
                                  // repo-relative path to the portrait SVG

      "fitScore": 87,             // 0–100, weighted blend — see scoring-model.md
      "scores": {                 // the five components, each 0–100
        "beatRelevance": 94,
        "coverageRecency": 88,
        "audienceOverlap": 82,
        "proofMatch": 90,
        "receptivity": 76
      },

      "pitchReadiness": {         // can we pitch NOW — distinct from fit
        "level": "conditional",   // "ready" | "conditional" | "hold"
        "note": "…"               // what makes it conditional / why hold
      },

      "theOpen": "…",             // "The Open" — the recommended first line
                                  // of outreach; shown on the card front

      "whyTheyCare": "…",         // the core of the scout card: evidence-based
                                  // reason THIS reporter cares about THIS story
      "recentCoverage": [
        {
          "title": "…",           // headline of a relevant published piece
          "date": "2026-05-14",   // ISO date
          "note": "…"             // why it's relevant to the fit case
        }
      ],

      "proofMatchNotes": ["…"],   // string[] — which of our proof points meet
                                  // this reporter's demonstrated standards
                                  // (named to avoid clashing with scores.proofMatch)
      "cautions": ["…"],          // string[] — pitch risks; honest, not hype
      "suggestedAngle": "…",      // one-line frame, sourced from the Angle Matrix
      "preferredFormat": "…",     // how they've said they want to be pitched;
                                  // shown in the Outreach Pack
      "lastPitched": null         // ISO date or null — relationship freshness,
                                  // shown in the scout card footer
    }
  ]
}
```

## Conventions

- Dates are ISO `YYYY-MM-DD` strings.
- All scores are integers 0–100; the UI renders them as bars without rescaling.
- Every field except the `id`s is rendered somewhere in the UI — no
  speculative fields.
- `shortlist` is runtime state only (a set of reporter `id`s in `script.js`) —
  deliberately not persisted in this pass.
- Fields planned for later passes (Angle Matrix cells, Outreach Pack proof
  bundles) are intentionally absent from the schema until they're real.
