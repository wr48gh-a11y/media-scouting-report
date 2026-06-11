# Media Scouting Report

A prototype **media outreach intelligence console**, it turns a company story
into a ranked Target Deck of reporter Scout Cards, backed by an honest
diagnosis of whether the story deserves coverage at all.

It is deliberately **not an email generator**.

**Live demo:** https://wr48gh-a11y.github.io/media-scouting-report/

## The thesis

> Bad PR asks, "Who can we send this to?"
>
> Good comms asks, "Who has a reason to care, and do we have the proof to
> deserve their time?"

Most outreach tooling optimizes the first question: bigger lists, faster
sends, merge fields. This prototype is built around the second. The unit of
work is not the email, it's the **fit case**: evidence that a specific
reporter has a demonstrated reason to care about this specific story, plus an
honest check on whether we can meet their standard of proof.

## The workflow

1. **Story Brief** : a calm intake screen: just the story, what's being
   announced, and when. Nothing derived shows yet; the single action is
   "Run Story Diagnosis."
2. **Story Diagnosis** : the reveal. An honest read of the story's strength
   across five signals (timeliness, tension, evidence, audience stakes,
   novelty), with a verdict and a list of gaps to close *before* anyone's
   inbox is involved. **Likely Target Types** rates four audience categories
   (high / medium / low readiness), **Early Scout Signals** previews mini
   scout cards (no fit numbers — those belong to the Target Deck), and the
   graded **proof points**, audiences, and spokespeople from the brief are
   laid out as evidence.
3. **Angle Matrix** : one story, many frames. Audience × frame pairings; most
   stories only have two or three cells that are real.
4. **Target Deck** : clickable reporter **Scout Cards**, ranked by a fit score
   that weights proof match second only to beat relevance. The card front
   stays compact: identity, fit, pitch readiness, suggested angle, and **The
   Open** — the recommended first line for that reporter. The long-form fit
   case (recent coverage, fit breakdown, proof match, cautions) sits in an
   expandable "Full scout report."
5. **Shortlist** — a persistent tray; the deliberate narrowing step between
   "everyone who fits" and "who we'll actually contact."
6. **Outreach Pack** — per-reporter preparation: chosen angle, proof bundle,
   format preferences, and personalization notes. Notes, not drafted emails.

## What this build is

A **first-pass skeleton** that demonstrates the workflow with sample data. It
does not pretend to be production software.

- Plain HTML, CSS, and JavaScript. No frameworks, no build step.
- Local JSON sample data (`data/`). No backend, no login, no email sending,
  no scraping, no external APIs.
- The Story Brief, Diagnosis, and Target Deck are rendered from data; the
  Angle Matrix and Outreach Pack are structured placeholders labelled
  "pass 2." The Shortlist tray works (add/remove, feeds the pack).
- All reporters, outlets, companies, and scores are **fictional**, authored
  by hand in the JSON. Nothing is computed yet — the scoring model document
  defines what the numbers will mean when it is.

## Running it

The app fetches local JSON, so it needs to be served (browsers block `fetch`
on `file://` pages):

```sh
cd media-scouting-report
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static file server works.

## Repo layout

```
index.html              App shell — all six stages
styles.css              Attio/Linear-inspired styling
script.js               Rendering, navigation, shortlist state
data/sample-story.json  One fictional Story Brief with its diagnosis
data/reporters.json     Three fictional reporter Scout Cards
assets/logo/            Product logo (SVG)
assets/reporters/       Illustrated reporter portraits (SVG)
docs/scoring-model.md   What the fit score and diagnosis signals mean
docs/data-schema.md     Shapes of the JSON files
```

## Design direction

Inspired by Attio and Linear: calm SaaS surfaces, sharp cards, strong
hierarchy, restrained motion. The Scout Cards should read as scouting
reports you want to click — not a spreadsheet, and not a literal baseball
card parody.
