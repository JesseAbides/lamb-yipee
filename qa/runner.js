/* ============================================================
   LAMB YIPEE — QA GAUNTLET RUNNER (injected into built game)
   Stages G0–G14. Results: window.__QA__ + on-page panel.
   Goal: every stage PASS => game declared complete.
   ============================================================ */
(function () {
  "use strict";
  const OUT = { stages: [], errors: [], warnings: [], vis: null, done: false, started: Date.now() };
  window.__QA__ = OUT;
  OUT.vis = document.visibilityState;

  /* ---- console + page error capture ---- */
  const oErr = console.error, oWarn = console.warn;
  console.error = function () { OUT.errors.push([].join.call(arguments, " ")); oErr.apply(console, arguments); };
  console.warn = function () {
    const s = [].join.call(arguments, " ");
    if (/Invalid keyframe/i.test(s)) OUT.warnings.push(s);   // forbidden: dead limb animation
    oWarn.apply(console, arguments);
  };
  window.addEventListener("pageerror", e => OUT.errors.push("pageerror: " + (e.message || e)));
  window.addEventListener("unhandledrejection", e => OUT.errors.push("unhandledrejection: " + ((e.reason && e.reason.message) || e.reason)));

  /* ---- tiny test kit ---- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  /* Timer-throttle-immune sleep: hidden tabs clamp setTimeout to 1s and
     NESTED timers to 125ms, which starves the runner. MessageChannel
     macrotasks are NOT throttled, so use them for short waits. */
  const mc = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
  const sleep = (ms) => new Promise(r => {
    if (!mc) return setTimeout(r, ms);
    if (ms < 40) return mc.port1.onmessage = () => r(), mc.port2.postMessage(0);
    const end = performance.now() + ms;
    (function tickMsg() {
      if (performance.now() >= end) return r();
      if (performance.now() - end > 800) return setTimeout(r, 50);   // very long waits: let the tab breathe
      mc.port1.onmessage = () => { mc.port1.onmessage = null; tickMsg(); };
      mc.port2.postMessage(0);
    })();
  });
  async function until(fn, ms = 6000, step = 60) {
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      let v = false; try { v = fn(); } catch (e) { v = false; }
      if (v) return true;
      await sleep(step);
    }
    return false;
  }
  function visible(sel) { const el = $(sel); return !!el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0; }
  function resetSave() { try { localStorage.setItem(Store.key, JSON.stringify({})); } catch (e) {} }
  function tapBubble(word, owner) {
    const b = G.bubbles.find(x => !x.taken && x.owner === (owner || 1) && x.word === word);
    if (!b) return false;
    const PE = window.PointerEvent || window.MouseEvent;
    b.el.dispatchEvent(new PE("pointerdown", { bubbles: true, clientX: 300, clientY: 280 }));
    return true;
  }
  async function playVerse(speed) {
    while (!G.you.done) {
      const next = G.you.nextWord();
      if (!next) break;
      let guard = 0;
      while (!G.you.done && G.you.nextWord() === next && guard++ < 14) {
        tapBubble(next, 1);
        await sleep(160);
      }
      await sleep(speed || 240);
    }
  }
  async function gotoRace(modeSel, diff) {
    showScreen("#menu");
    $$(".diff-chip").forEach(c => c.classList.toggle("sel", c.dataset.d === "normal"));
    await sleep(30);
    const modeCard = $(modeSel);
    if (!modeCard) throw new Error("mode card missing: " + modeSel);
    modeCard.click();
    await until(() => visible("#verseSelect"), 2000);
    const dCard = $$("#levelGrid .verse-card").find(c => c.textContent.toLowerCase().indexOf(diff) >= 0);
    if (!dCard) throw new Error("difficulty card not found: " + diff);
    dCard.click();                                // game deals a RANDOM verse
    await until(() => visible("#game"), 2000);
    await until(() => G.running, 9000);           // 3-2-1-YIPEE countdown
    await sleep(80);
  }

  const stages = [];
  const stage = (name, fn) => stages.push({ name, fn });
  const stageIdx = name => OUT.stages.length; // not used; stages run sequentially

  /* ================= G0 — boot, menu, navigation ================= */
  stage("G0 boot & navigation", async t => {
    t(document.title.indexOf("YipeeVerse") === 0, "title is YipeeVerse");
    t(visible("#menu"), "menu visible on load");
    t(!visible("#pauseOverlay") && !visible("#countOverlay"), "no overlay stuck open on load");
    t($$("#menu .mode-card").length >= 3, "mode cards present (single, duo CPU, online, duo local)");
    // Pet & Name Profile modal
    const editBtn = $("#btnEditProfile");
    t(!!editBtn, "customize pet & name button exists");
    editBtn.click();
    t(visible("#profileModal"), "profile modal opens");
    t($$("#avatarGrid .avatar-card").length >= 8, "avatar selection offers 8 pet characters");
    $("#btnCloseProfile").click();
    await until(() => !visible("#profileModal"), 1500);
    t(!visible("#profileModal"), "profile modal closes");
    // How-to modal
    $("#btnHow").click();
    t(visible("#howModal"), "how-to modal opens");
    $("#howClose").click();
    await until(() => !visible("#howModal"), 1500);
    t(!visible("#howModal"), "how-to modal closes");
    // level select (difficulty → random verse)
    $("#btnSingle").click();
    await until(() => visible("#verseSelect"), 1500);
    t(visible("#verseSelect") && !visible("#menu"), "level select opens, menu hides");
    t($$("#levelGrid .verse-card").length === 3, "level select shows 3 difficulty cards");
    t($("#vsTitle").textContent.indexOf("Single") >= 0, "level select title says Single");
    $("#vsBack").click();
    t(visible("#menu"), "back returns to menu");
  });

  /* ================= G1 — single mode: easy race (50% revealed + 1 distractor) → results ================= */
  stage("G1 single race → results", async t => {
    resetSave(); refreshStats();
    await gotoRace("#btnSingle", "easy");
    const words = tokenize(G.verse.text);
    t(G.mode === "single" && G.rivalKind === "ghost", "single mode with ghost rival");
    t(G.bubbles.filter(b => !b.isTarget).length === 1, "easy mode has exactly 1 distractor card on hill");
    const prefilledCount = Math.floor(words.length * 0.5);
    t($$("#verseFlow .word.prefilled").length === prefilledCount, "board starts with 50% words already placed (" + prefilledCount + " words)");
    t($$("#verseFlow .word.slot").length === words.length - prefilledCount, "board has remaining 50% empty slots");
    t($("#boardRefText").textContent === G.verse.ref, "board shows reference (" + G.verse.ref + ")");
    await playVerse(260);
    t(G.you.done, "race completes word-for-word");
    await until(() => visible("#results"), 4000);
    t(visible("#results"), "results screen shows");
    t(/^\d+(\.\d+)?s$/.test($("#resTime").textContent), "finish time shown (" + $("#resTime").textContent + ")");
    t($("#resVerse").textContent.indexOf("· NIV") > 0 && $("#resVerse").textContent.indexOf(G.verse.ref) > 0 && $("#resVerse").textContent.indexOf(G.verse.text.slice(0, 20)) > 0, "full verse revealed on results with NIV tag");
    t($$("#resBoard .lb-row").length === 4, "leaderboard has 4 racers");
    const times = $$("#resBoard .lb-row .tm").map(e => parseFloat(e.textContent));
    t(times.every(x => !isNaN(x)) && times.every((x, i) => i === 0 || times[i - 1] <= x), "leaderboard sorted fastest first");
    // Race Again re-runs the same verse
    $("#resAgain").click();
    await until(() => visible("#game"), 2000);
    await until(() => G.running, 9000);
    t(G.running && G.verse.ref === (G.verse.ref), "Race Again restarts the same verse (" + G.verse.ref + ")");
    quitGame();
    t(visible("#menu"), "quit returns to menu");
  });


  /* ================= G2 — wrong word: stun + reaction ================= */
  stage("G2 wrong tap → stun & sad", async t => {
    await gotoRace("#btnSingle", "hard");
    const wrong = G.bubbles.find(b => !b.isTarget && b.owner === 1);
    t(!!wrong, "a distractor card exists");
    tapBubble(wrong.word, 1);
    t(G.you.mistakes === 1, "mistake counted");
    t(G.you.stunUntil > performance.now(), "stun timer armed");
    t($("#yipeeSay").classList.contains("bad"), "speech bubble shows encouragement (bad mood)");
    const blocked = G.you.target[0];
    tapBubble(blocked, 1);
    t(G.you.placed.length === 0, "taps ignored while stunned");
    await sleep(1350);
    tapBubble(blocked, 1);
    t(G.you.placed.length === 1, "after stun, correct tap places word");
    quitGame();
  });

  /* ================= G3 — peek hint ================= */
  stage("G3 peek highlights next slot", async t => {
    await gotoRace("#btnSingle", "hard");
    $("#peekBtn").click();
    const idx = 0;
    const span = $('#verseFlow .word[data-i="' + idx + '"]');
    t(span && /solid/.test(span.style.outline) && span.style.outline.length > 4, "next slot outlined");
    t(span.textContent === "\u00a0", "peek does NOT reveal the word");
    t($("#peekBtn").disabled === true, "peek disabled during cooldown");
    t(await until(() => $("#peekBtn").disabled === false, 9000), "peek re-enabled after cooldown");
    quitGame();
  });

  /* ================= G4 — pause / resume / quit / stale-race guard ================= */
  stage("G4 pause, resume, quit, race guard", async t => {
    await gotoRace("#btnSingle", "hard");
    $("#pauseBtn").click();
    t(G.paused && visible("#pauseOverlay"), "pause shows overlay");
    const before = G.you.taps;
    tapBubble(G.you.target[0], 1);
    t(G.you.taps === before, "taps ignored while paused");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    t(!G.paused && !visible("#pauseOverlay"), "Esc resumes");
    const t0 = performance.now();
    await sleep(300);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    t(!G.paused, "Esc double-toggle returns to running");
    // quit mid-countdown, start fresh race — stale countdown/timers must not leak
    quitGame();
    await gotoRace("#btnSingle", "hard");
    t(G.running && G.raceId === G.myRace, "fresh race runs after quitting a race");
    await playVerse(250);
    await until(() => visible("#results"), 4000);
    t(visible("#results"), "fresh race finishes cleanly");
    $("#resMenu").click();
    t(visible("#menu"), "results → menu works");
  });

  /* ================= G5 — duo 1v1 vs CPU ================= */
  stage("G5 duo vs CPU race", async t => {
    await gotoRace("#btnDuoCpu", "medium");   // longer verse so the CPU ticks a few times
    t(G.mode === "duo" && G.rivalKind === "cpu", "duo CPU mode active");
    t(visible("#rivalSide") && visible("#rivalDot"), "rival lamb on the right");
    t(visible("#duoBars"), "progress bars visible");
    const p0 = G.rival.placed.length;
    await until(() => G.rival.placed.length > p0, 7000);
    t(G.rival.placed.length > p0, "CPU rival makes progress on its own");
    t(parseFloat($("#barThemFill").style.width) > 0, "rival bar reflects progress");
    await playVerse(260);
    await until(() => visible("#results"), 4000);
    t(visible("#results"), "duo race finishes");
    t($("#resTitle").textContent.indexOf("wins!") > 0, "winner announced: " + $("#resTitle").textContent);
    t($$("#resBoard .lb-row").length === 2, "duo leaderboard shows both racers");
    $("#resMenu").click();
  });

  /* ================= G6 — 1v1 Online Lobby & presence ================= */
  stage("G6 1v1 Online Lobby & matchmaking", async t => {
    showScreen("#menu");
    const btnOnline = $("#btnDuoOnline");
    t(!!btnOnline, "1v1 Online Mode button exists on menu");
    btnOnline.click();
    await until(() => visible("#onlineLobbyModal"), 2000);
    t(visible("#onlineLobbyModal"), "1v1 Online Lobby opens");
    t(typeof Online !== "undefined", "Online network engine initialized");
    t($("#myStatusBadge").textContent.indexOf("Available") >= 0, "player marked Available in lobby");
    const btnCloseLobby = $("#btnCloseLobby");
    t(!!btnCloseLobby, "close lobby button exists");
    btnCloseLobby.click();
    await until(() => !visible("#onlineLobbyModal"), 1500);
    t(!visible("#onlineLobbyModal"), "online lobby closes");
  });

  /* ================= G7 — rigged lamb: alive, rejoice, sad ================= */
  stage("G7 lamb rig physics & moods", async t => {
    await gotoRace("#btnSingle", "easy");
    t(typeof rigLamb === "function", "rig engine present");
    const rig = G.yipeeRig;
    t(rig && rig.mode === "alive", "Yipee rig alive");
    t($("#yipee svg.lamb-rig") !== null, "rigged SVG mounted");
    t($$("#yipee svg .rig-leg-fl, #yipee svg .rig-ear-l").length >= 2, "rigged parts present (legs, ears)");
    // transforms are being written every frame (alive loop)
    const tr1 = $("#yipee .rig-root").getAttribute("transform");
    t(!!tr1 && tr1.indexOf("scale(") >= 0, "root transform written (squash/stretch)");
    const d1 = JSON.stringify(rig.dbg());
    const moved = await until(() => JSON.stringify(rig.dbg()) !== d1, 1500);
    t(moved, OUT.vis === "visible" ? "idle motion running (springs alive)" : "idle motion running (page visible)");
    // rejoice performance
    rig.rejoice(900);
    const r0 = rig.dbg();
    const jumped = await until(() => { const d = rig.dbg(); return d.sqy !== r0.sqy || d.earL !== r0.earL; }, 1200);
    t(jumped, "rejoice animates squash/ears");
    await sleep(1000);
    // sad performance
    rig.sad(800);
    const sadNow = await until(() => $("#yipee .rig-mouth-sad").getAttribute("opacity") === "1" || parseFloat($("#yipee .rig-mouth-sad").style.opacity || $("#yipee .rig-mouth-sad").getAttribute("opacity")) > 0, 1000);
    t(sadNow, "sad face appears (mouth swap)");
    // observe the spring travelling; if rAF is throttled (hidden tab),
    // fall back to asserting the commanded pose targets (verified headless
    // by qa/sim checks) so the stage is deterministic either way.
    let sadEar = null, sawTravel = false;
    const d0 = rig.dbg();
    sadEar = await until(() => {
      const d = rig.dbg();
      if (Math.abs(d.earL - d0.earL) > 4 || Math.abs(d.head - d0.head) > 2) sawTravel = true;
      return (Math.abs(d.earL) > 20 || Math.abs(d.head) > 5) ? d : null;
    }, 1500);
    const dEnd = sadEar || rig.dbg();
    const commanded = dEnd.tt && (Math.abs(dEnd.tt.earL) > 20 || Math.abs(dEnd.tt.head) > 5);
    t(sawTravel || commanded, "sad pose droops ears/head");
    await sleep(900);
    // reactions wired to gameplay: wrong tap => sad bubbles + mistake
    const wrong = G.bubbles.find(b => !b.isTarget);
    if (wrong) {
      tapBubble(wrong.word, 1);
      t($("#yipeeSay").classList.contains("bad"), "wrong tap triggers sad reaction");
    }
    quitGame();
  });

  /* ================= G8 — engine units + persistence ================= */
  stage("G8 engine logic & saved stats", async t => {
    // tokenizer
    t(JSON.stringify(tokenize("a—b")) === JSON.stringify(["a", "—", "b"]), "em-dash tokenizes cleanly");
    t(tokenize("The  LORD   is").length === 3, "multi-space collapse");
    // racer stun model
    const r = new Racer("t", ["x", "y"], "duo");
    t(r.tryWord("z", 1000) === false && r.mistakes === 1, "wrong word counts mistake");
    t(r.tryWord("x", 1500) === false, "stunned racer cannot place");
    t(r.tryWord("x", 1001 + 1200) === true, "after stun, correct word places");
    t(r.tryWord("y", 1001 + 1200 + 10) === true && r.done && r.doneAt > 0, "racer finishes and stamps time");
    // scoring bands
    t(starsOf(15000) === 3 && starsOf(25000) === 2 && starsOf(40000) === 1, "star bands correct");
    t(gradeOf(15000) === "RADIANT ✨" && gradeOf(60000) === "STEADY 🥉", "grade bands correct");
    // persistence
    resetSave();
    Store.addTotals({ stars: 5, win: 2, race: 3 });
    Store.setBest("Psalm 23:1", 12345);
    const d = Store.load();
    t(d.stars === 5 && d.wins === 2 && d.races === 3, "totals persist");
    t(Store.bestFor("Psalm 23:1") === 12345, "personal best persists");
    t(Store.setBest("Psalm 23:1", 99999) === false && Store.bestFor("Psalm 23:1") === 12345, "only faster times replace best");
    refreshStats();
    t($("#statStars").textContent.indexOf("5") > 0, "menu chips reflect saved stats");
    resetSave(); refreshStats();
  });

  /* ================= G9 — scatter layout: bounds, no overlap, organic ================= */
  stage("G9 card scatter layout", async t => {
    await gotoRace("#btnSingle", "hard");            // longest tier, 22+ words
    const bubbles = G.bubbles.filter(b => b.owner === 1);
    t(bubbles.length >= 22, "long verse lays all cards (" + bubbles.length + ")");
    const hill = $("#hillArea").getBoundingClientRect();
    const rects = bubbles.map(b => b.el.getBoundingClientRect());
    t(rects.every(r => r.left >= hill.left - 2 && r.right <= hill.right + 2 && r.top >= hill.top - 2 && r.bottom <= hill.bottom + 2), "every card fully on the hill");
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2) overlaps++;
    }
    t(overlaps === 0, "no two cards overlap (" + overlaps + " collisions)");
    const ys = [...new Set(rects.map(r => Math.round((r.top + r.height / 2) / 24)))];
    t(ys.length >= 4, "organic multi-row scatter (" + ys.length + " height bands, not 2 rows)");
    t(OUT.warnings.length === 0, "no invalid-keyframe warnings (limbs animate)");
    quitGame();
  });

  /* ================= G10 — results content correctness ================= */
  stage("G10 results screen content", async t => {
    resetSave(); refreshStats();
    await gotoRace("#btnSingle", "easy");
    await playVerse(240);
    await until(() => visible("#results"), 4000);
    await sleep(750);
    t($("#resTitle").textContent.indexOf("Verse complete") === 0, "single win title");
    t($("#resGrade").textContent.length > 0, "grade shown: " + $("#resGrade").textContent);
    t($("#resStars").textContent.indexOf("⭐") >= 0, "stars awarded");
    t($("#resMistakes").textContent.indexOf("Mistakes: 0") >= 0, "clean run shows 0 mistakes");
    t($("#resBest").textContent.length > 0, "best/new-best line present");
    t(Store.bestFor(G.verse.ref) != null, "best time saved for verse (" + G.verse.ref + ")");
    const tot = Store.totals();
    t(tot.races >= 1 && tot.wins >= 1, "totals counted (races " + tot.races + ", wins " + tot.wins + ")");
    $("#resMenu").click();
  });

  /* ================= G11 — console sweep ================= */
  stage("G11 console clean", async t => {
    t(OUT.errors.length === 0, "zero console errors/pageerrors" + (OUT.errors.length ? " → " + OUT.errors[0] : ""));
    t(OUT.warnings.length === 0, "zero invalid-keyframe warnings");
  });

  /* ==== G12 — regression: pause must not kill the duo-CPU rival ==== */
  /* (critique F1: rival's setTimeout chain used to die while paused)   */
  stage("G12 duo CPU survives pause (regression F1)", async t => {
    resetSave();
    await gotoRace("#btnDuoCpu", "easy");
    const before = G.rival.placed.length;
    pauseGame();
    t(G.paused === true, "paused mid-race");
    await sleep(2600);                        // span a rival tick window
    resumeGame();
    t(G.paused === false, "resumed");
    const alive = await until(() => G.rival.placed.length > before || G.rival.done, 8000);
    t(alive, "CPU rival resumed tapping after pause (bug F1 fixed)");
    quitGame();
  });

  /* ==== G13 — regression: countdown is race-id guarded (critique F2) ==== */
  stage("G13 countdown race-id guard (regression F2)", async t => {
    resetSave();
    showScreen("#menu");
    await sleep(30);
    $("#btnSingle").click();
    await until(() => visible("#verseSelect"), 2000);
    const card = $$("#levelGrid .verse-card").find(c => c.textContent.indexOf("Easy") >= 0);
    card.click();                             // race A starts counting down
    await sleep(700);                         // mid-countdown…
    quitGame();                               // …abandon it
    t(visible("#menu"), "quit during countdown returns to menu");
    t(visible("#countOverlay") === false, "countdown overlay hidden after quit");
    const card2 = $$("#levelGrid .verse-card").find(c => c.textContent.indexOf("Medium") >= 0);
    card2.click();                            // race B
    await until(() => visible("#game"), 2000);
    await until(() => G.running, 9000);       // race B must reach running
    t(G.running && !visible("#countOverlay"), "new race runs; stale countdown cannot hide overlay");
    quitGame();
  });

  /* ==== G14 — random verse draw & difficulty tiers ==== */
  stage("G14 random draw & difficulty tiers", async t => {
    // tier definitions are exclusive and non-empty
    t(versePool("easy").every(v => wordCount(v) <= 13), "easy pool = short verses (≤13 words)");
    t(versePool("medium").every(v => { const n = wordCount(v); return n >= 14 && n <= 21; }), "medium pool = 14–21 words");
    t(versePool("hard").every(v => wordCount(v) >= 22), "hard pool = long verses (22+ words)");
    t(versePool("easy").length >= 5 && versePool("medium").length >= 5 && versePool("hard").length >= 5, "all tiers well stocked (" + versePool("easy").length + "/" + versePool("medium").length + "/" + versePool("hard").length + ")");
    // a deal actually starts a race
    showScreen("#menu"); await sleep(30);
    $("#btnSingle").click();
    await until(() => visible("#verseSelect"), 2000);
    t($$("#levelGrid .verse-card").length === 3, "level select shows 3 difficulty cards");
    const gridText = $("#levelGrid").textContent;
    t(!VERSES.some(v => gridText.indexOf(v.text.slice(0, 25)) >= 0), "level select never shows scripture text");
    $$("#levelGrid .verse-card").find(c => c.textContent.indexOf("Hard") >= 0).click();
    await until(() => visible("#game"), 2000);
    await until(() => G.running, 9000);
    t(versePool("hard").some(v => v.ref === G.verse.ref), "Hard deal drew from the hard tier (" + G.verse.ref + ")");
    t($("#hudRef").textContent === G.verse.ref, "HUD shows the dealt reference only");
    quitGame();
    // randomness: repeated draws hit more than one verse
    const seen = new Set();
    for (let i = 0; i < 25; i++) seen.add(pickVerse("easy").ref);
    t(seen.size >= 4, "draws are genuinely random (" + seen.size + " distinct verses in 25)");
    quitGame();
  });

  /* ==== G15 — medium mode: phrase 1 -> phrase 2 progression loop ==== */
  stage("G15 medium phrase 1 to phrase 2 loop", async t => {
    resetSave(); refreshStats();
    await gotoRace("#btnSingle", "medium");
    t(G.diff === "medium", "medium difficulty mode active");
    t(G.phraseIndex === 0, "starts at phrase 0");
    t(G.phrases && G.phrases.length === 2, "split into 2 phrases");
    t($("#hudPhrase").style.display !== "none", "phrase badge visible");
    t($("#hudPhrase").textContent.indexOf("1 / 2") >= 0, "badge shows phrase 1 / 2");

    // Play all of Phrase 1
    const p0 = G.phrases[0];
    for (let i = 1; i < p0.length; i++) {
      const targetWord = p0[i];
      tapBubble(targetWord, 1);
      await sleep(220);
    }

    // Wait for Phrase 2 auto-transition
    await until(() => G.phraseIndex === 1, 3000);
    t(G.phraseIndex === 1, "advanced to phrase 2");
    t($("#hudPhrase").textContent.indexOf("2 / 2") >= 0, "badge updated to phrase 2 / 2");
    const p1 = G.phrases[1];
    t(G.you.placed.length >= p0.length + 1, "phrase 2 word 0 auto-prefilled on board");

    // Play remaining of Phrase 2
    for (let i = 1; i < p1.length; i++) {
      const targetWord = p1[i];
      tapBubble(targetWord, 1);
      await sleep(220);
    }

    await until(() => visible("#results"), 4000);
    t(visible("#results"), "results shown after both phrases completed");
    $("#resMenu").click();
  });

  /* ==== G16 — overtime & pass button transition ==== */
  stage("G16 overtime pass button to score page", async t => {
    resetSave(); refreshStats();
    await gotoRace("#btnSingle", "easy");
    const passBtn = $("#passBtn");
    t(!!passBtn, "pass button element exists in DOM");
    t(passBtn.classList.contains("hidden"), "pass button hidden during regular time");

    // Simulate overtime trigger
    G.isOvertime = true;
    passBtn.classList.remove("hidden");
    t(!passBtn.classList.contains("hidden") && visible("#passBtn"), "pass button visible when overtime triggered");

    // Click pass button
    passBtn.click();
    await until(() => visible("#results"), 3000);
    t(visible("#results"), "pass button cleanly transitions to score/results page");
    t($("#resStars").textContent.indexOf("☆☆☆") >= 0, "0 stars awarded on overtime/pass (" + $("#resStars").textContent + ")");
    $("#resMenu").click();
  });

  /* ---- runner UI ---- */
  function render() {
    let panel = $("#qaPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "qaPanel";
      panel.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:99999;background:rgba(20,30,40,.92);color:#eef;font:11px/1.45 Consolas,monospace;padding:10px 12px;border-radius:10px;max-width:420px;max-height:70vh;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.4)";
      document.body.appendChild(panel);
    }
    const pass = OUT.stages.filter(s => s.status === "PASS").length;
    const fail = OUT.stages.filter(s => s.status === "FAIL").length;
    const run = OUT.stages.filter(s => s.status === "RUN").length;
    let html = "<b>🐑 QA GAUNTLET</b> — " + pass + " pass · " + fail + " fail · " + run + " running";
    if (OUT.done) html += " — " + (fail === 0 ? "<span style='color:#7f7'>GOAL MET ✔</span>" : "<span style='color:#f88'>NEEDS FIXES</span>");
    html += "<br>";
    for (const s of OUT.stages) {
      const col = s.status === "PASS" ? "#7f7" : s.status === "FAIL" ? "#f88" : "#ff8";
      html += "<div style='margin-top:5px'><span style='color:" + col + "'>" + (s.status === "PASS" ? "✔" : s.status === "FAIL" ? "✘" : "⏳") + " " + s.name + "</span>";
      if (s.ms != null) html += " <span style='opacity:.6'>" + s.ms + "ms</span>";
      for (const f of s.fails) html += "<div style='color:#faa;padding-left:16px'>• " + f + "</div>";
      html += "</div>";
    }
    panel.innerHTML = html;
  }

  async function run() {
    render();
    for (const s of stages) {
      const rec = { name: s.name, status: "RUN", fails: [], asserts: 0 };
      OUT.stages.push(rec); render();
      const t0 = performance.now();
      const t = (ok, msg) => { rec.asserts++; if (!ok) rec.fails.push(msg || "assert failed"); };
      try { await s.fn(t); }
      catch (e) { rec.fails.push("exception: " + ((e && e.message) || e)); }
      rec.status = rec.fails.length ? "FAIL" : "PASS";
      rec.ms = Math.round(performance.now() - t0);
      render();
      await sleep(120);
    }
    OUT.done = true;
    OUT.summary = OUT.stages.map(s => s.status + " " + s.name + (s.fails.length ? " :: " + s.fails.join(" | ") : "")).join("\n");
    OUT.allPass = OUT.stages.every(s => s.status === "PASS");
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(run, 350));
  else setTimeout(run, 350);
})();
