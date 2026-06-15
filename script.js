/* Media Scouting Report — prototype behavior.
   Loads the local sample JSON, renders each stage, and manages stage
   navigation plus the Shortlist. No backend; state is in-memory only. */

const state = {
  story: null,
  reporters: [],
  shortlist: new Set(), // reporter ids
};

const LANDING_READY_DELAY_MS = 1725;
const ENTRY_STAGE_SETTLE_MS = 760;
const LANDING_EXIT_FALLBACK_MS = 520;

/* Fit-score components in display order. Keys match `scores` in
   data/reporters.json; weights and meaning are in docs/scoring-model.md. */
const FIT_COMPONENT_LABELS = {
  beatRelevance: "Beat relevance",
  coverageRecency: "Recency",
  audienceOverlap: "Audience",
  proofMatch: "Proof match",
  receptivity: "Receptivity",
};

/* Readiness chips. Reporter cards use ready/conditional/hold; the
   Likely Target Types module uses high/medium/low. Same component,
   one tone scale — see "Fit vs. readiness" in docs/scoring-model.md. */
const READINESS = {
  ready: { label: "Ready to pitch", tone: "good" },
  conditional: { label: "Conditional", tone: "warn" },
  hold: { label: "Hold", tone: "muted" },
  high: { label: "High readiness", tone: "good" },
  medium: { label: "Medium readiness", tone: "warn" },
  low: { label: "Low readiness", tone: "muted" },
};

function statusChip(level) {
  const { label, tone } = READINESS[level];
  return `<span class="status-chip tone-${tone}">${label}</span>`;
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

setupLanding();

/* The sample data is local and trusted, but every string rendered into
   markup goes through here so external data can't inject HTML later. */
function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
  );
}

function findReporter(id) {
  return state.reporters.find((reporter) => reporter.id === id);
}

/* One source for reporter portraits; className picks the size variant. */
function avatarImg(reporter, className) {
  return `<img class="${className}" src="${esc(reporter.avatar)}" alt="Portrait of ${esc(reporter.name)}">`;
}

init();

function setupLanding() {
  const landing = $("#landing-layer");
  if (!landing) return;

  const landingCta = $("#landing-cta");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isReady = false;
  let isDismissed = false;
  let readyTimer = null;
  let cleanupTimer = null;
  let stageSettleTimer = null;

  setWorkspaceInteractivity(false);
  if (landingCta) {
    landingCta.addEventListener("click", () => {
      if (!isReady || isDismissed) return;
      dismissLanding();
    });
  }

  if (reducedMotionQuery.matches) {
    window.requestAnimationFrame(markReady);
  } else {
    readyTimer = window.setTimeout(markReady, LANDING_READY_DELAY_MS);
  }

  function markReady() {
    if (isDismissed || isReady) return;
    isReady = true;
    document.body.classList.add("is-landing-ready");
    landing.classList.add("is-ready");
    if (landingCta) landingCta.disabled = false;
  }

  function dismissLanding() {
    isDismissed = true;
    document.body.classList.add("is-landing-leaving");
    document.body.classList.add("is-stage-arriving");
    landing.classList.add("is-handoff");
    landing.setAttribute("aria-hidden", "true");
    if (landingCta) landingCta.disabled = true;
    releaseWorkspace();

    if (readyTimer) window.clearTimeout(readyTimer);
    if (stageSettleTimer) window.clearTimeout(stageSettleTimer);
    stageSettleTimer = window.setTimeout(
      () => document.body.classList.remove("is-stage-arriving"),
      reducedMotionQuery.matches ? 1 : ENTRY_STAGE_SETTLE_MS
    );

    if (reducedMotionQuery.matches) {
      finishLanding();
      return;
    }

    const onTransitionEnd = (event) => {
      if (event.target !== landing || event.propertyName !== "opacity") return;
      landing.removeEventListener("transitionend", onTransitionEnd);
      finishLanding();
    };

    landing.addEventListener("transitionend", onTransitionEnd);
    cleanupTimer = window.setTimeout(finishLanding, LANDING_EXIT_FALLBACK_MS);
  }

  function releaseWorkspace() {
    setWorkspaceInteractivity(true);
  }

  function setWorkspaceInteractivity(isEnabled) {
    const workspace = $(".app");
    const tray = $(".tray");
    [workspace, tray].forEach((element) => {
      if (!element) return;
      if (isEnabled) element.removeAttribute("inert");
      else element.setAttribute("inert", "");
    });
  }

  function finishLanding() {
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
    document.body.classList.remove("is-landing-ready", "is-landing-leaving");
    document.body.classList.remove("is-landing-active");
    landing.remove();
  }
}

async function init() {
  try {
    [state.story, state.reporters] = await loadSampleData();
  } catch {
    $("#load-error").hidden = false;
    return;
  }

  renderBrief(state.story);
  renderDiagnosis(state.story, state.reporters);
  renderDeck();
  renderTray();
  renderPack();
  wireNavigation();
  wireShortlistControls();
}

async function loadSampleData() {
  const [storyRes, reportersRes] = await Promise.all([
    fetch("data/sample-story.json", { cache: "no-store" }),
    fetch("data/reporters.json", { cache: "no-store" }),
  ]);
  if (!storyRes.ok || !reportersRes.ok) throw new Error("Failed to fetch sample data");
  const story = await storyRes.json();
  const { reporters } = await reportersRes.json();
  return [story, reporters];
}

/* ---------- Navigation ---------- */

function wireNavigation() {
  // Sidebar items and any control with data-goto switch the visible stage.
  $$("[data-stage], [data-goto]").forEach((el) => {
    el.addEventListener("click", () => showStage(el.dataset.stage || el.dataset.goto));
  });
}

function showStage(name) {
  $$(".stage").forEach((stage) => {
    stage.classList.toggle("is-active", stage.id === `stage-${name}`);
  });
  $$(".nav-item").forEach((item) => {
    const isActive = item.dataset.stage === name;
    item.classList.toggle("is-active", isActive);
    if (isActive) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  const main = $(".main");
  if (main) main.scrollTo({ top: 0 });
  else window.scrollTo({ top: 0 });
}

/* ---------- 1. Story Brief ---------- */

/* Step 1 stays a calm intake: just The Story form. Everything derived
   from the story is revealed by renderDiagnosis on step 2. */
function renderBrief(story) {
  $("#f-company").value = story.company;
  $("#f-headline").value = story.headline;
  $("#f-summary").value = story.summary;
  $("#f-category").value = story.category;
  $("#f-target-date").value = story.timing.embargoDate;
  $("#f-target-date-hint").textContent = `${story.timing.peg}. ${story.timing.flexibility}.`;
}

/* ---------- 2. Story Diagnosis ---------- */

function renderDiagnosis(story, reporters) {
  const diagnosis = story.diagnosis;
  $("#verdict-chip").textContent = diagnosis.verdict;
  $("#pitchable-grade-chip").textContent = diagnosis.pitchableGrade?.grade || "—";
  $("#diagnosis-summary").textContent = diagnosis.summary;
  $("#pitchable-grade").textContent = diagnosis.pitchableGrade?.grade || "—";
  $("#pitchable-grade-note").textContent = diagnosis.pitchableGrade?.note || "";
  $("#signal-list").innerHTML = diagnosis.signals.map(signalRow).join("");
  $("#gap-list").innerHTML = diagnosis.gaps.map((gap) => `<li>${esc(gap)}</li>`).join("");
  $("#target-type-list").innerHTML = diagnosis.targetTypes.map(targetTypeCard).join("");

  // The reveal: evidence and first scout signals appear once the
  // diagnosis has run, not on the intake screen.
  $("#proof-list").innerHTML = story.proofPoints.map(proofPointItem).join("");
  $("#audience-list").innerHTML = story.audiences
    .map((audience) => `<li>${esc(audience)}</li>`)
    .join("");
  $("#spokespeople-list").innerHTML = story.spokespeople.map(spokespersonItem).join("");
  $("#early-signal-list").innerHTML = reporters.map(miniScoutCard).join("");
}

function proofPointItem(point) {
  return `
    <li>
      <span class="proof-grade ${esc(point.strength)}">${esc(point.strength)}</span>
      <div>
        <span class="proof-claim">${esc(point.claim)}</span>
        <span class="proof-evidence">${esc(point.evidence)}</span>
      </div>
    </li>`;
}

function spokespersonItem(person) {
  return `
    <li>
      <strong>${esc(person.name)}</strong> — ${esc(person.role)}
      <span class="sub-note">${esc(person.notes)}</span>
    </li>`;
}

/* Compact preview of a scout card. Deliberately no fit number here —
   the full, scored card lives in the Target Deck. */
function miniScoutCard(reporter) {
  return `
    <li class="mini-card">
      <div class="mini-head">
        ${avatarImg(reporter, "mini-avatar")}
        <div class="mini-id">
          <h3 class="mini-name">${esc(reporter.name)}</h3>
          <p class="mini-outlet">${esc(reporter.outlet)} · ${esc(reporter.beat)}</p>
        </div>
        <div class="fit-badge is-pending" title="Full fit score in the Target Deck">
          <span class="fit-num">—</span>
          <span class="fit-cap">Fit</span>
        </div>
      </div>
      <p class="mini-angle">Possible angle: ${esc(reporter.suggestedAngle)}</p>
      <span class="status-chip tone-muted">Scout preview</span>
    </li>`;
}

function targetTypeCard(type) {
  return `
    <li class="target-type">
      <div class="target-type-head">
        <h3>${esc(type.name)}</h3>
        ${statusChip(type.readiness)}
      </div>
      <p><strong>Why they may care:</strong> ${esc(type.whyTheyMayCare)}</p>
      <p><strong>Proof they'd need:</strong> ${esc(type.proofNeeded)}</p>
    </li>`;
}

function signalRow(signal) {
  return `
    <div class="signal-row">
      <span class="signal-label">${esc(signal.label)}</span>
      <div class="signal-track" aria-hidden="true">
        <div class="signal-fill is-${signalTier(signal.score)}" style="width:${signal.score}%"></div>
      </div>
      <span class="signal-score">${signal.score}</span>
      <p class="signal-note">${esc(signal.note)}</p>
    </div>`;
}

function signalTier(score) {
  if (score >= 70) return "high";
  if (score >= 55) return "mid";
  return "low";
}

/* ---------- 4. Target Deck ---------- */

function renderDeck() {
  const ranked = [...state.reporters].sort((a, b) => b.fitScore - a.fitScore);
  $("#deck-count").textContent = `${ranked.length} scout cards`;
  $("#deck").innerHTML = ranked.map(scoutCard).join("");
}

/* Card front stays compact: identity, fit, readiness, angle, and The Open.
   Everything long lives in the collapsed "Full scout report" details. */
function scoutCard(reporter) {
  const shortlisted = state.shortlist.has(reporter.id);
  return `
    <article class="scout-card ${shortlisted ? "is-shortlisted" : ""}" data-reporter-id="${esc(reporter.id)}">
      ${scoutCardHeader(reporter)}
      ${readinessRow(reporter.pitchReadiness)}
      ${scoutSection("Suggested angle", `<p class="scout-angle">“${esc(reporter.suggestedAngle)}”</p>`)}
      ${scoutSection("The Open", `<p class="scout-open">“${esc(reporter.theOpen)}”</p>`)}
      ${scoutReport(reporter)}
      ${scoutCardFooter(reporter, shortlisted)}
    </article>`;
}

function readinessRow(readiness) {
  return `
    <div class="scout-status">
      ${statusChip(readiness.level)}
      <span class="scout-status-note">${esc(readiness.note)}</span>
    </div>`;
}

function scoutReport(reporter) {
  const history = reporter.lastPitched
    ? `Last pitched ${reporter.lastPitched}`
    : "No prior outreach";
  return `
    <details class="scout-report">
      <summary>Full scout report</summary>
      ${scoutSection("Why they'd care", `<p>${esc(reporter.whyTheyCare)}</p>`)}
      ${scoutSection("Recent coverage", coverageList(reporter.recentCoverage))}
      ${scoutSection("Fit breakdown", fitBreakdown(reporter.scores))}
      ${scoutSection("Proof match", bulletList(reporter.proofMatchNotes))}
      ${scoutSection("Cautions", bulletList(reporter.cautions, "is-cautions"))}
      <p class="scout-meta">${esc(history)}</p>
    </details>`;
}

function scoutCardHeader(reporter) {
  return `
    <header class="scout-top">
      ${avatarImg(reporter, "scout-avatar")}
      <div class="scout-id">
        <h2 class="scout-name">${esc(reporter.name)}</h2>
        <p class="scout-outlet">${esc(reporter.outlet)} · ${esc(reporter.outletType)}</p>
        <p class="scout-beat">${esc(reporter.beat)} — ${esc(reporter.location)}</p>
      </div>
      <div class="fit-badge is-${fitTier(reporter.fitScore)}" title="Weighted fit score — see docs/scoring-model.md">
        <span class="fit-num">${reporter.fitScore}</span>
        <span class="fit-cap">Fit</span>
      </div>
    </header>`;
}

/* Tier boundaries match the table in docs/scoring-model.md:
   80+ strong fit, 65–79 conditional, below that stretch. */
function fitTier(score) {
  if (score >= 80) return "high";
  if (score >= 65) return "mid";
  return "low";
}

function scoutSection(title, bodyHtml) {
  return `
    <section class="scout-section">
      <h3>${title}</h3>
      ${bodyHtml}
    </section>`;
}

function coverageList(coverage) {
  const items = coverage.map(
    (piece) => `
      <li>
        <span class="cov-date">${esc(piece.date)}</span>${esc(piece.title)}
        <span class="sub-note">${esc(piece.note)}</span>
      </li>`
  );
  return `<ul class="scout-coverage">${items.join("")}</ul>`;
}

function fitBreakdown(scores) {
  const rows = Object.entries(FIT_COMPONENT_LABELS).map(
    ([key, label]) => `
      <div class="scout-bar">
        <span>${label}</span>
        <div class="bar-track" aria-hidden="true">
          <div class="bar-fill" style="width:${scores[key]}%"></div>
        </div>
        <span class="bar-num">${scores[key]}</span>
      </div>`
  );
  return `<div class="scout-bars">${rows.join("")}</div>`;
}

function bulletList(items, modifier = "") {
  const listItems = items.map((item) => `<li>${esc(item)}</li>`).join("");
  return `<ul class="scout-points ${modifier}">${listItems}</ul>`;
}

function scoutCardFooter(reporter, shortlisted) {
  return `
    <footer class="scout-foot">
      <button type="button" class="btn btn-shortlist ${shortlisted ? "is-on" : ""}"
        data-shortlist-toggle="${esc(reporter.id)}" aria-pressed="${shortlisted}">
        ${shortlisted ? "✓ On shortlist" : "+ Add to Shortlist"}
      </button>
    </footer>`;
}

/* ---------- Shortlist ---------- */

function wireShortlistControls() {
  // Delegated, so re-rendering cards and chips never re-binds listeners.
  $("#deck").addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortlist-toggle]");
    if (button) toggleShortlist(button.dataset.shortlistToggle);
  });
  $("#tray-chips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortlist-remove]");
    if (button) toggleShortlist(button.dataset.shortlistRemove);
  });
}

function toggleShortlist(reporterId) {
  if (!state.shortlist.delete(reporterId)) state.shortlist.add(reporterId);
  syncDeckCard(reporterId);
  renderTray();
  renderPack();
}

/* Update the one affected card in place rather than re-rendering the
   whole deck, so an open "Full scout report" stays open. */
function syncDeckCard(reporterId) {
  const card = $(`.scout-card[data-reporter-id="${reporterId}"]`);
  if (!card) return;
  const shortlisted = state.shortlist.has(reporterId);
  card.classList.toggle("is-shortlisted", shortlisted);

  const button = card.querySelector("[data-shortlist-toggle]");
  button.classList.toggle("is-on", shortlisted);
  button.setAttribute("aria-pressed", String(shortlisted));
  button.textContent = shortlisted ? "✓ On shortlist" : "+ Add to Shortlist";
}

function renderTray() {
  const count = state.shortlist.size;
  const countEl = $("#tray-count");
  countEl.textContent = count;
  countEl.classList.toggle("has-items", count > 0);
  $("#tray-build").disabled = count === 0;

  $("#tray-chips").innerHTML =
    count === 0
      ? `<p class="tray-empty">No reporters shortlisted yet — add from the Target Deck.</p>`
      : [...state.shortlist]
          .map((id) => findReporter(id))
          .filter(Boolean)
          .map((reporter) => trayChip(reporter))
          .join("");
}

function trayChip(reporter) {
  return `
    <span class="tray-chip">
      ${avatarImg(reporter, "tray-avatar")}
      ${esc(reporter.name)} · ${esc(reporter.outlet)}
      <button type="button" data-shortlist-remove="${esc(reporter.id)}"
        aria-label="Remove ${esc(reporter.name)} from shortlist">×</button>
    </span>`;
}

/* ---------- 5. Outreach Pack (placeholder) ---------- */

function renderPack() {
  const body = $("#pack-body");
  if (state.shortlist.size === 0) {
    body.innerHTML = `
      <div class="pack-empty">
        <strong>The pack is built from your Shortlist</strong>
        Add reporters from the Target Deck, and each one gets a preparation card here —
        angle, proof bundle, and personalization notes. No reporters shortlisted yet.
      </div>`;
    return;
  }
  body.innerHTML = [...state.shortlist]
    .map((id) => findReporter(id))
    .filter(Boolean)
    .map((reporter) => packCard(reporter, state.story))
    .join("");
}

function packCard(reporter, story) {
  const proofPoints = story.proofPoints.slice(0, 3).map((point) => `
    <li>
      <strong>${esc(point.claim)}</strong>
      <span>${esc(point.evidence)}</span>
    </li>`).join("");
  const recentCoverage = reporter.recentCoverage[0];
  return `
    <article class="pack-card">
      <header class="pack-who">
        <h2 class="scout-name">${esc(reporter.name)}</h2>
        <p class="scout-outlet">${esc(reporter.outlet)}</p>
        <p class="scout-beat">${esc(reporter.beat)}</p>
      </header>
      <div class="pack-slots">
        <section class="pack-slot is-filled">
          <h3>Chosen angle</h3>
          “${esc(reporter.suggestedAngle)}”
        </section>
        <section class="pack-slot is-filled">
          <h3>Format &amp; cadence</h3>
          ${esc(reporter.preferredFormat)}
        </section>
        <section class="pack-slot is-filled">
          <h3>Proof bundle</h3>
          <ul class="pack-list">${proofPoints}</ul>
        </section>
        <section class="pack-slot is-filled">
          <h3>Personalization notes</h3>
          <p>${esc(reporter.whyTheyCare)}</p>
          <p>${esc(reporter.cautions[0])}</p>
          ${recentCoverage ? `<p>Lead with ${esc(recentCoverage.title)} (${esc(recentCoverage.date)}).</p>` : ""}
        </section>
      </div>
    </article>`;
}
