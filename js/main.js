/* ============================================================
   LAMB YIPEE — main controller
   Screens: menu, verse select, game (single & duo), results
   ============================================================ */

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.add("hidden"));
  $(id).classList.remove("hidden");
}

/* ---------- scenery ---------- */
function makeClouds(area, n = 4) {
  area.querySelectorAll(".cloud").forEach(c => c.remove());
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "cloud";
    const w = 60 + Math.random() * 70;
    c.style.width = w + "px";
    c.style.height = w * 0.34 + "px";
    c.style.top = (8 + Math.random() * 30) + "%";
    c.style.animationDuration = (28 + Math.random() * 30) + "s";
    c.style.animationDelay = (-Math.random() * 40) + "s";
    area.appendChild(c);
  }
}

/* Randomly scatter word cards over the hill with collision avoidance,
   so they look naturally tossed around — never in tidy rows, never
   overlapping. side: 0 = full width, 1 = left half, 2 = right half. */
function scatterBubbles(list, side, w, h) {
  let x0, x1;
  if (side === 1)      { x0 = 46;           x1 = w * 0.5 - 30; }
  else if (side === 2) { x0 = w * 0.5 + 30; x1 = w - 46; }
  else                 { x0 = 60;           x1 = w - 60; }
  if (x1 - x0 < 130) { x0 = Math.max(30, x0); x1 = Math.max(x0 + 130, x1); }
  const GAP = 9;
  const overlap = (r, p) => {
    const dx = (r.w / 2 + p.w / 2 + GAP) - Math.abs(r.x - p.x);
    const dy = (r.h / 2 + p.h / 2 + GAP) - Math.abs(r.y - p.y);
    return (dx > 0 && dy > 0) ? dx * dy : 0;
  };
  const collisions = (placed) => {
    let n = 0;
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++)
        if (overlap(placed[i], placed[j]) > 0) n++;
    return n;
  };
  // widest first packs better; random attempts make placement organic.
  // Dense verses (long text, small screens) get up to 4 passes, each
  // relaxing the vertical band + margins, so cards NEVER overlap.
  for (let pass = 0; pass < 4; pass++) {
    const relax = pass / 3;                              // 0 → 1
    const padX = 60 - relax * 24;                        // 60 → 36
    const bx0 = side ? Math.max(30, x0 - relax * 14) : Math.max(padX, x0 - relax * padX + 12);
    const bx1 = side ? x1 + relax * 14 : Math.min(w - padX, x1 + relax * padX - 12);
    const bandTop = Math.max(6, h * (side ? 0.22 : 0.16) * (1 - relax) - relax * 8);
    const bandBot = Math.min(h - 6, h * (side ? 0.78 : 0.8) + relax * h * 0.12);
    const placed = [];
    const order = list.slice().sort((a, b) => (b.el.offsetWidth || 0) - (a.el.offsetWidth || 0));
    for (const b of order) {
      const bw = b.el.offsetWidth || 90;
      const bh = b.el.offsetHeight || 42;
      const minX = Math.min(bx0 + bw / 2 + 2, (bx0 + bx1) / 2);
      const maxX = Math.max(bx1 - bw / 2 - 2, (bx0 + bx1) / 2);
      const minY = bandTop + bh / 2;
      const maxY = Math.max(bandBot - bh / 2, minY + 1);
      let best = null, bestOv = Infinity;
      for (let i = 0; i < 160; i++) {
        const r = {
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
          w: bw, h: bh
        };
        const ov = placed.reduce((s, p) => s + overlap(r, p), 0);
        if (ov === 0) { best = r; break; }
        if (ov < bestOv) { bestOv = ov; best = r; }
      }
      placed.push(best);
      b.el.style.left = best.x + "px";
      b.el.style.top = best.y + "px";
    }
    if (collisions(placed) === 0) return;                // clean scatter
  }
  // (worst case: last pass used the widest band; residual overlap is
  //  accepted only on extremely small screens with 40+ cards)
}

/* ---------- confetti ---------- */
function confettiBurst(count = 90) {
  const colors = ["#ff9db8", "#ffce4a", "#9ed86b", "#58b8f0", "#e8dcff", "#ffd6e8"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = (2.2 + Math.random() * 2) + "s";
    el.style.animationDelay = (Math.random() * 0.6) + "s";
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }
}

let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- time format ---------- */
function fmt(ms) {
  if (ms == null) return "—";
  const s = ms / 1000;
  return s < 60 ? s.toFixed(2) + "s" : Math.floor(s / 60) + "m " + (s % 60).toFixed(1) + "s";
}

/* ============================================================
   GLOBAL RACE STATE
   ============================================================ */
const G = {
  mode: null,            // "single" | "duo"
  verse: null,
  raceId: 0,             // increments each race; stale timers bail out
  bubbles: [],           // {word, el, taken, isTarget}
  you: null,
  rival: null,           // Racer (single) or opponent (duo)
  rivalKind: null,       // "ghost" | "cpu" | "local"
  startAt: 0,
  running: false,
  paused: false,
  finished: false,
  raf: null,
  cpuTimer: null,
  escHandler: null
};

function fmtRef(v) { return v.ref; }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ============================================================
   GAME SCREEN SETUP
   ============================================================ */
function startGame(mode, verse, opts = {}) {
  G.mode = mode;
  G.verse = verse;
  G.bubbles = [];
  G.running = false;
  G.paused = false;
  G.finished = false;
  G.combo = 0;

  const targetWords = tokenize(verse.text);
  G.verseWords = targetWords;
  const diff = G.pendingDifficulty || opts.diff || "hard";
  G.difficulty = diff;
  const diffCfg = getDifficultyConfig(diff, verse);
  G.diffCfg = diffCfg;
  G.phraseIdx = 0;

  const userProf = Store.profile();
  const youName = opts.youName || userProf.name || "You";
  const avatarId = opts.avatarId || userProf.avatarId || "flora";

  const kind = opts.rivalKind || (mode === "single" ? "ghost" : "cpu");
  const isDuoLocal = mode === "duo" && kind === "local";

  const myRace = ++G.raceId;
  G.myRace = myRace;

  // Determine pre-filled words for this difficulty
  let prefilledWords = [];
  let prefilledIndices = [];
  if (diffCfg.type === "easy") {
    prefilledWords = diffCfg.prefilledWords;
    prefilledIndices = diffCfg.prefilledIndices;
  } else if (diffCfg.type === "medium") {
    prefilledWords = [diffCfg.phrases[0][0]];
    prefilledIndices = [0];
  }

  G.you = new Racer(youName, targetWords, mode, {
    avatarId: avatarId,
    diff: diff,
    prefilledWords: prefilledWords,
    phrases: diffCfg.phrases,
    phraseIdx: 0
  });
  G.rivalKind = kind;
  G.duoDifficulty = opts.duoDifficulty || "normal";

  if (mode === "single") {
    const seed = RIVALS[Math.floor(Math.random() * RIVALS.length)];
    G.rival = Object.assign(new Racer(seed.name, targetWords, "ghost", {
      diff: diff,
      prefilledWords: prefilledWords,
      phrases: diffCfg.phrases,
      phraseIdx: 0
    }), { spw: seed.spw, hue: seed.hue });
  } else {
    G.rival = new Racer(opts.rivalName || "Friend", targetWords, "duo", {
      avatarId: "pirate",
      diff: diff,
      prefilledWords: prefilledWords,
      phrases: diffCfg.phrases,
      phraseIdx: 0
    });
  }

  G.difficultyConfig = diffCfg;
  G.currentPhraseIdx = 0;
  G.totalPhrases = diffCfg.phrases.length;
  G.timeLimit = diffCfg.timeLimit || (diff === "easy" ? 20 : diff === "medium" ? 30 : 40);
  G.timeLimitMs = G.timeLimit * 1000;
  G.urgentShoutDone = false;

  const timerEl = $("#timer");
  if (timerEl) {
    timerEl.textContent = `⏱️ ${G.timeLimit}.0s`;
    timerEl.classList.remove("urgent");
  }

  // Pre-fill board slots if difficulty calls for it (Easy mode has 50% pre-filled)
  const buildBoard = (flowEl, refEl) => {
    flowEl.innerHTML = "";
    targetWords.forEach((word, i) => {
      const s = document.createElement("span");
      if (prefilledIndices.includes(i)) {
        s.className = "word prefilled";
        s.textContent = word;
      } else {
        s.className = "word slot";
        s.textContent = "\u00a0";
      }
      s.dataset.i = i;
      flowEl.appendChild(s);
      flowEl.appendChild(document.createTextNode(" "));
    });
    if (refEl) refEl.textContent = verse.ref;
  };
  buildBoard($("#verseFlow"), $("#boardRefText"));
  buildBoard($("#verseFlow2"), $("#boardRef2Text"));

  $("#board2").style.display = isDuoLocal ? "flex" : "none";
  $("#board1").classList.toggle("duo", isDuoLocal);
  $("#board2").classList.toggle("duo", isDuoLocal);
  $("#ownerTag1").style.display = isDuoLocal ? "" : "none";
  $(".board-area").classList.toggle("duo-mode", isDuoLocal);
  $("#hillArea").classList.toggle("duo-local", isDuoLocal);
  $("#board2Name").textContent = "🐏 " + (opts.rivalName || "Friend");
  $("#hudRef").textContent = verse.ref;

  // Medium phrase badge
  const phraseChip = $("#hudPhrase");
  if (phraseChip) {
    if (diff === "medium" && diffCfg.phrases.length > 1) {
      phraseChip.style.display = "inline-flex";
      phraseChip.textContent = `Phrase 1/${diffCfg.phrases.length}`;
    } else {
      phraseChip.style.display = "none";
    }
  }

  // Build bubbles on hill
  const area = $("#hillArea");
  area.querySelectorAll(".word-bubble").forEach(b => b.remove());
  makeClouds(area, 4);

  const words = buildWords(verse, diff, 0);
  const words2 = isDuoLocal ? buildWords(verse, diff, 0) : null;

  const addSet = (list, side, player) => {
    list.forEach((word) => {
      const b = document.createElement("div");
      b.className = "word-bubble" + (player === 2 ? " p2" : "");
      b.textContent = word;
      b.style.left = "-400px";
      b.style.top = "-40px";
      b.addEventListener("pointerdown", (e) => onBubbleTap(word, b, e, player));
      area.appendChild(b);
      G.bubbles.push({ word, el: b, taken: false, owner: player, isTarget: targetWords.includes(word) });
    });
  };
  if (isDuoLocal) {
    addSet(words, 1, 1);
    addSet(words2, 2, 2);
  } else {
    addSet(words, 0, 1);
  }

  // Rig the animated player avatar (and rival)
  if (G.yipeeRig) G.yipeeRig.destroy();
  G.yipeeRig = rigLamb($("#yipee"), { id: "y", avatarId: G.you.avatarId });

  const petInfo = PET_AVATARS.find(p => p.id === G.you.avatarId) || PET_AVATARS[0];
  const sideTag = $("#playerSideTag");
  if (sideTag) sideTag.textContent = `${petInfo.icon} ${petInfo.name} (${G.you.name})`;

  if (!G.rivalRig && mode === "duo") {
    G.rivalRig = rigLamb($("#rivalDot"), { id: "r", avatarId: "pirate", wool: "#ffe4ef", woolShade: "#f3c6d6", face: "#ffe0ea", tint: "#f087ab", dark: "#5a4632" });
  }

  const dot = $("#rivalDot");
  $("#rivalChip").style.display = mode === "single" ? "" : "none";
  if (mode === "duo") {
    $("#rivalSide").style.display = "flex";
    dot.style.display = "flex";
    let tag = dot.querySelector(".tag");
    if (!tag) { tag = document.createElement("span"); tag.className = "tag"; dot.appendChild(tag); }
    tag.textContent = G.rival.name;
    $("#duoBars").style.display = "flex";
    $("#barYouName").textContent = `${petInfo.icon} ${G.you.name}`;
    $("#barThemName").textContent = "🐏 " + G.rival.name;
  } else {
    $("#rivalSide").style.display = "none";
    $("#duoBars").style.display = "none";
  }

  updateBars();
  $("#peekBtn").disabled = false;
  showScreen("#game");
  repositionBubbles();
  setTimeout(repositionBubbles, 60);

  countdown(() => {
    if (myRace !== G.raceId) return;
    G.startAt = performance.now();
    G.running = true;
    triggerYipeeCheer(pick(["YIPEE! You've got this! ✨", "Run like the wind! 🌸", "Baa-lieve in yourself! 🌟"]));
    if (G.rivalKind === "cpu" || G.rivalKind === "ghost") startRivalClock();
    tick();
  });
}

/* ---------- countdown ---------- */
function countdown(cb) {
  const ov = $("#countOverlay");
  ov.classList.remove("hidden");
  const num = $("#countNum");
  let n = 3;
  const myRace = G.raceId;
  if (G.countTimers) G.countTimers.forEach(clearTimeout);
  G.countTimers = [];
  const later = (fn, ms) => G.countTimers.push(setTimeout(fn, ms));
  num.textContent = n;
  SFX.count();
  const iv = setInterval(() => {
    if (myRace !== G.raceId) { clearInterval(iv); return; }
    n--;
    if (n > 0) { num.textContent = n; SFX.count(); }
    else {
      clearInterval(iv);
      num.textContent = "YIPEE!";
      SFX.go();
      later(() => { if (myRace !== G.raceId) return; ov.classList.add("hidden"); cb(); }, 550);
    }
  }, 800);
  G.countInt = iv;
}

/* ============================================================
   TAPPING
   ============================================================ */
function onBubbleTap(word, el, e, player = 1) {
  if (!G.running || G.paused) return;
  if (player !== 2 && e && G.yipeeRig) {
    try { G.yipeeRig.lookAt(e.clientX, e.clientY); } catch (err) {}
  }
  const racer = player === 2 ? G.rival : G.you;
  if (racer.done) return;
  const now = performance.now();
  el.classList.remove("shake");
  const ok = racer.tryWord(word, now);

  if (ok) {
    SFX.correct();
    el.classList.add("taken");
    const b = G.bubbles.find(x => x.el === el);
    if (b) b.taken = true;
    fillBoardWord(racer.placed.length - 1, player, word, false);

    if (player === 2) {
      if (G.rivalRig) G.rivalRig.rejoice();
      say("#rivalSay", pick(["Yay! 🎉", "Baa-illiant! ⭐", "Keep going! 💪"]), "good");
    } else {
      if (G.yipeeRig) G.yipeeRig.rejoice();
      say("#yipeeSay", pick(["Yipee! 🎉", "Yes! ⭐", "Amen! 🙌", "Keep going! 💪"]), "good");

      // Combos & Yipee Mascot pop-ups
      G.combo = (G.combo || 0) + 1;
      if (G.combo === 3) {
        triggerYipeeCheer(pick(["Super fast! ⚡", "3 in a row! 🔥", "Baa-rilliant! ⭐"]));
      } else if (racer.placed.length === Math.ceil(racer.target.length / 2)) {
        triggerYipeeCheer("Halfway there! Keep going! 🌈");
      }
    }
    updateBars();

    // Check for Medium mode phrase completion
    if (G.diffCfg && G.diffCfg.type === "medium" && G.diffCfg.phrases.length > 1 && G.phraseIdx === 0) {
      const p0Len = G.diffCfg.phrases[0].length;
      if (racer.placed.length === p0Len) {
        advanceToPhraseTwo(player);
        return;
      }
    }

    if (racer.done) finishRace(player === 2 ? "rival" : "you");
  } else {
    SFX.wrong();
    el.classList.add("shake");
    if (player === 1) G.combo = 0;
    if (player === 2) {
      if (G.rivalRig) G.rivalRig.sad();
      say("#rivalSay", "Oops!", "bad");
    } else {
      if (G.yipeeRig) G.yipeeRig.sad();
      say("#yipeeSay", pick(["Try another word! 💛", "Not that one!", "Almost! 🤔"]), "bad");
    }
  }
}

function advanceToPhraseTwo(player = 1) {
  G.phraseIdx = 1;
  const p0Len = G.diffCfg.phrases[0].length;
  const p1Word0 = G.diffCfg.phrases[1][0];

  fillBoardWord(p0Len, 1, p1Word0, true);
  if (G.you.placed.length === p0Len) {
    G.you.placed.push(p1Word0);
  }
  if (G.rival && G.rival.placed.length === p0Len) {
    fillBoardWord(p0Len, 2, p1Word0, true);
    G.rival.placed.push(p1Word0);
  }

  const phraseChip = $("#hudPhrase");
  if (phraseChip) {
    phraseChip.textContent = `Phrase 2/${G.diffCfg.phrases.length}`;
  }

  toast("Phrase 1 Done! 🎉 Phrase 2 Unlocked!");
  triggerYipeeCheer("Phrase 1 Complete! 🏆 Now Phrase 2!", "good", 2400);

  // Repopulate hill with phrase 2 remaining words + 1 distractor
  const area = $("#hillArea");
  area.querySelectorAll(".word-bubble").forEach(b => b.remove());
  G.bubbles = [];

  const isDuoLocal = G.mode === "duo" && G.rivalKind === "local";
  const words = buildWords(G.verse, "medium", 1);
  const words2 = isDuoLocal ? buildWords(G.verse, "medium", 1) : null;

  const addSet = (list, side, p) => {
    list.forEach((word) => {
      const b = document.createElement("div");
      b.className = "word-bubble" + (p === 2 ? " p2" : "");
      b.textContent = word;
      b.style.left = "-400px";
      b.style.top = "-40px";
      b.addEventListener("pointerdown", (e) => onBubbleTap(word, b, e, p));
      area.appendChild(b);
      G.bubbles.push({ word, el: b, taken: false, owner: p, isTarget: G.verseWords.includes(word) });
    });
  };
  if (isDuoLocal) {
    addSet(words, 1, 1);
    addSet(words2, 2, 2);
  } else {
    addSet(words, 0, 1);
  }
  repositionBubbles();
  updateBars();
}

/* run a one-shot animation class on an element */
function animOnce(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/* little speech bubble above a lamb */
let sayTimers = {};
function say(id, text, mood, ms = 1300) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("good", "bad");
  if (mood) el.classList.add(mood);
  el.classList.add("show");
  clearTimeout(sayTimers[id]);
  sayTimers[id] = setTimeout(() => el.classList.remove("show"), ms);
}

function fillBoardWord(idx, player = 1, word = "", isPrefilled = false) {
  const root = player === 2 ? "#verseFlow2" : "#verseFlow";
  const span = $(`${root} .word[data-i="${idx}"]`);
  if (span) {
    span.textContent = word;
    span.classList.remove("slot");
    if (isPrefilled) {
      span.classList.add("prefilled");
    } else {
      span.classList.add("filled");
    }
  }
}


/* ============================================================
   RIVAL CLOCKS
   ============================================================ */
function startRivalClock() {
  clearInterval(G.cpuTimer);
  const targetWords = tokenize(G.verse.text);

  if (G.mode === "single") {
    // ghost rival: ~spw seconds per word, pure board fill
    const base = G.rival.spw * 1000;
    const myRace = G.myRace;
    let elapsed = 0;
    G.cpuTimer = setInterval(() => {
      if (myRace !== G.raceId) { clearInterval(G.cpuTimer); return; }
      if (!G.running || G.paused) return;
      elapsed += 200;
      if (elapsed >= base) {
        elapsed = 0;
        G.rival.tryWord(targetWords[G.rival.placed.length], performance.now());
        if (G.rival.placed.length === targetWords.length) {
          G.rival.done = true;
          G.rival.doneAt = performance.now();
          clearInterval(G.cpuTimer);
          if (!G.you.done) finishRace("rival");
        }
      }
    }, 200);
  } else if (G.rivalKind === "cpu") {
    // duo CPU: taps correct word most of the time, sometimes stalls.
    // If a tick fires while paused/stopped (or during the countdown),
    // RETRY shortly instead of dying — otherwise the CPU would go
    // silent for the rest of the race after a well-timed pause.
    const spw = (DUO_CPU[G.duoDifficulty] || DUO_CPU.normal) * 1000;
    const myRace = G.myRace;
    const step = () => {
      if (myRace !== G.raceId) return;
      const delay = spw * (0.75 + Math.random() * 0.6);
      G.cpuTimer = setTimeout(() => {
        if (myRace !== G.raceId) return;
        if (!G.running || G.paused || G.rival.done) { G.cpuTimer = setTimeout(step, 250); return; }
        const now = performance.now();
        const want = G.rival.nextWord();
        if (want != null) G.rival.tryWord(want, now);
        updateBars();
        if (G.rival.done) { finishRace("rival"); return; }
        step();
      }, delay);
    };
    step();
  }
  // local duo: no clock, human 2 taps their own bubbles
}



/* ============================================================
   DUO LOCAL: keyboard / second pointer
   Player 2 uses keys 1-9 on the same hill (each bubble indexed)
   or taps bubbles in the right half with a second finger.
   Simplification: P2 taps bubbles while holding the "P2" toggle,
   or uses number keys. We implement number keys + a P2 button.
   ============================================================ */
function duoLocalKeyHandler(e) {
  if (G.mode !== "duo" || G.rivalKind !== "local") return;
  const n = parseInt(e.key, 10);
  if (isNaN(n) || n < 1 || n > 9) return;
  const bub = G.bubbles.filter(b => !b.taken && b.owner === 2);
  const b = bub[n - 1];
  if (!b) return;
  onBubbleTap(b.word, b.el, null, 2);
}

/* keep bubbles on the hill arc when the window resizes */
function repositionBubbles() {
  if (!G.bubbles.length) return;
  const area = $("#hillArea");
  const w = area.clientWidth, h = area.clientHeight;
  if (!w || !h) return;
  const split = G.mode === "duo" && G.rivalKind === "local";
  const own = { 1: [], 2: [] };
  G.bubbles.forEach(b => (own[b.owner] || own[1]).push(b));
  if (split) { scatterBubbles(own[1], 1, w, h); scatterBubbles(own[2], 2, w, h); }
  else scatterBubbles(own[1], 0, w, h);
}

/* ============================================================
   HUD / TICK
   ============================================================ */
function tick() {
  if (!G.running) return;
  if (!G.paused && !G.you.done) {
    const elapsed = performance.now() - G.startAt;
    const remainingMs = Math.max(0, G.timeLimitMs - elapsed);
    const timerEl = $("#timer");
    if (timerEl) {
      timerEl.textContent = `⏱️ ${(remainingMs / 1000).toFixed(1)}s`;
      if (remainingMs <= 5000) {
        timerEl.classList.add("urgent");
        if (!G.urgentShoutDone) {
          G.urgentShoutDone = true;
          try { SFX.wrong(); } catch (e) {}
          triggerYipeeCheer("Hurry! 5 seconds left! ⚡", "bad", 1800);
        }
      } else {
        timerEl.classList.remove("urgent");
      }
    }

    if (remainingMs <= 0) {
      finishRace("timeout");
      return;
    }

    if (G.rivalKind === "ghost" && G.rival && !G.rival.done) {
      // show rival progress % in chip
      $("#rivalChip").textContent = `🐏 ${G.rival.name}: ${Math.round(G.rival.progress * 100)}%`;
    }
    if (G.mode === "duo" && G.rivalKind === "cpu" && G.rival) {
      // CPU rival shows its progress on the tag
      const pct = Math.round(G.rival.progress * 100);
      const tag = document.querySelector("#rivalDot .tag");
      if (tag) tag.textContent = `${G.rival.name} · ${pct}%`;
    }
  }
  G.raf = requestAnimationFrame(tick);
}

function updateBars() {
  if (G.mode !== "duo") return;
  $("#barYouFill").style.width = (G.you.progress * 100) + "%";
  $("#barYouPct").textContent = Math.round(G.you.progress * 100) + "%";
  $("#barThemFill").style.width = (G.rival.progress * 100) + "%";
  $("#barThemPct").textContent = Math.round(G.rival.progress * 100) + "%";
}

/* ============================================================
   PAUSE / PEEK / QUIT
   ============================================================ */
function pauseGame() {
  if (!G.running || G.paused || G.you.done) return;
  G.paused = true;
  G.pauseStartedAt = performance.now();
  $("#pauseOverlay").classList.remove("hidden");
}
function resumeGame() {
  if (!G.paused) return;
  const delta = performance.now() - G.pauseStartedAt;
  G.startAt += delta;
  if (G.rival && G.rival.doneAt) G.rival.doneAt += delta;
  G.paused = false;
  $("#pauseOverlay").classList.add("hidden");
}
function peekHint() {
  if (!G.running || G.paused) return;
  const idx = G.you.placed.length;
  const span = $(`#verseFlow .word[data-i="${idx}"]`);
  if (span) {
    span.style.outline = "3px solid #58b8f0";
    span.style.borderRadius = "8px";
    setTimeout(() => { span.style.outline = ""; }, 1200);
  }
  $("#peekBtn").disabled = true;
  setTimeout(() => { $("#peekBtn").disabled = false; }, 8000);
}
function quitGame() {
  G.running = false;
  clearInterval(G.cpuTimer);
  clearTimeout(G.cpuTimer);
  clearInterval(G.countInt);
  if (G.countTimers) G.countTimers.forEach(clearTimeout);
  cancelAnimationFrame(G.raf);
  $("#pauseOverlay").classList.add("hidden");
  $("#countOverlay").classList.add("hidden");
  showScreen("#menu");
}

/* ============================================================
   FINISH + RESULTS
   ============================================================ */
function finishRace(winner) {
  if (G.finished) return;              // already finished this race
  if (!G.running && winner !== "you" && winner !== "timeout") return;
  G.finished = true;
  G.running = false;
  clearInterval(G.cpuTimer);
  clearTimeout(G.cpuTimer);
  cancelAnimationFrame(G.raf);

  const youMs = G.you.done ? G.you.doneAt - G.startAt : null;
  const rivalMs = G.rival && G.rival.done ? G.rival.doneAt - G.startAt : null;
  const isTimeout = winner === "timeout";
  const youWon = winner === "you";

  // stats
  const stars = youMs != null ? starsOf(youMs, G.timeLimit) : 0;
  Store.addTotals({ stars, win: youWon ? 1 : 0, race: 1 });
  let newBest = false;
  if (youMs != null) newBest = Store.setBest(G.verse.ref, youMs);

  setTimeout(() => showResults(winner, youMs, rivalMs, stars, newBest), 700);
  if (youWon) {
    SFX.finish();
    confettiBurst();
    if (G.yipeeRig) G.yipeeRig.rejoice(1300);
  } else if (isTimeout) {
    SFX.lose();
    if (G.yipeeRig) G.yipeeRig.sad(1200);
    triggerYipeeCheer("Time's up! Don't give up, try again! ⏰", "bad", 2500);
  } else {
    SFX.lose();
    if (G.yipeeRig) G.yipeeRig.sad(1100);
  }
}

function showResults(winner, youMs, rivalMs, stars, newBest) {
  const isTimeout = winner === "timeout";
  const youWon = winner === "you";

  $("#resTitle").textContent =
    isTimeout ? "Time's Up! ⏰" :
    G.mode === "duo" ? (youWon ? `${G.you.name} wins! 🎉` : `${G.rival.name} wins! 🐏`) :
    youWon ? "Verse complete! 🎉" : "So close! 🐑";
  $("#resVerse").textContent = "📖 " + G.verse.ref + " · NIV — " + G.verse.text;
  $("#resTime").textContent = isTimeout ? `Time's Up (Limit: ${G.timeLimit}s)` : (youMs != null ? fmt(youMs) : "DNF");
  $("#resGrade").textContent = isTimeout ? "Out of Time ⏳" : (youMs != null ? gradeOf(youMs, G.timeLimit) : "Keep practicing!");
  $("#resStars").textContent = "⭐".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
  $("#resBest").textContent = newBest ? "🏆 NEW PERSONAL BEST!" :
    ("Best: " + fmt(Store.bestFor(G.verse.ref)));
  $("#resMistakes").textContent = `Mistakes: ${G.you.mistakes} · Taps: ${G.you.taps} · Limit: ${G.timeLimit}s`;

  // leaderboard list
  const lb = $("#resBoard");
  lb.innerHTML = "";
  const rows = [];
  const pet = PET_AVATARS.find(p => p.id === G.you.avatarId) || PET_AVATARS[0];

  if (G.mode === "single") {
    const targetWords = tokenize(G.verse.text);
    const n = targetWords.length;
    const totalOf = (spw) => spw * n * 1000;      // ms for the whole verse
    const rt = rivalMs != null ? rivalMs : totalOf(G.rival.spw) * (0.9 + Math.random() * 0.25);
    rows.push({ name: `${pet.icon} ${G.you.name}`, t: youMs, me: true });
    rows.push({ name: "🐏 " + G.rival.name, t: rt, me: false });
    // a couple of other players for flavour
    shuffle(RIVALS.filter(r => r.name !== G.rival.name)).slice(0, 2).forEach(r => {
      rows.push({ name: "ewe " + r.name, t: totalOf(r.spw) * (0.9 + Math.random() * 0.25), me: false });
    });
    rows.sort((a, b) => (a.t ?? Infinity) - (b.t ?? Infinity));
  } else {
    rows.push({ name: `${pet.icon} ${G.you.name}`, t: youMs, me: true });
    rows.push({ name: "🐏 " + G.rival.name, t: rivalMs, me: false });
    rows.sort((a, b) => (a.t ?? Infinity) - (b.t ?? Infinity));
  }
  rows.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "lb-row" + (r.me ? " me" : "");
    div.innerHTML = `<span class="pos">${i + 1}.</span><span class="nm">${r.name}</span>
      <span class="tm ${r.t == null ? "dnf" : ""}">${r.t == null ? "still typing…" : fmt(r.t)}</span>`;
    lb.appendChild(div);
  });

  showScreen("#results");
}

/* ============================================================
   MENU / SELECT / PROFILE WIRING
   ============================================================ */
function refreshStats() {
  const t = Store.totals();
  $("#statStars").textContent = "⭐ " + t.stars;
  $("#statWins").textContent = "🏆 " + t.wins;
  $("#statRaces").textContent = "🏃 " + t.races;
}

function refreshProfileUI() {
  const prof = Store.profile();
  const pet = PET_AVATARS.find(p => p.id === prof.avatarId) || PET_AVATARS[0];
  const nameEl = $("#menuPlayerName");
  const iconEl = $("#menuAvatarIcon");
  const imgEl = $("#menuAvatarImg");
  if (nameEl) nameEl.textContent = prof.name || "You";
  
  const imgSrc = getAvatarImg(pet.id);
  if (imgEl && imgSrc) {
    imgEl.src = imgSrc;
    imgEl.style.display = "block";
    if (iconEl) iconEl.style.display = "none";
  } else {
    if (imgEl) imgEl.style.display = "none";
    if (iconEl) {
      iconEl.style.display = "block";
      iconEl.textContent = pet.icon;
    }
  }
}

let selectedAvatarId = "capybara";

function openProfileModal() {
  const prof = Store.profile();
  selectedAvatarId = prof.avatarId || "capybara";
  const input = $("#playerNameInput");
  if (input) input.value = prof.name || "You";

  const grid = $("#avatarGrid");
  grid.innerHTML = "";
  PET_AVATARS.forEach(pet => {
    const card = document.createElement("div");
    card.className = "avatar-card" + (pet.id === selectedAvatarId ? " sel" : "");
    const imgSrc = getAvatarImg(pet.id);
    const mediaHtml = imgSrc
      ? `<div class="av-img-wrap"><img class="av-img" src="${imgSrc}" alt="${pet.name}" /><span class="av-badge">${pet.icon}</span></div>`
      : `<div class="av-icon">${pet.icon}</div>`;

    card.innerHTML = `
      ${mediaHtml}
      <div class="av-name">${pet.name}</div>
      <div class="av-role">${pet.role}</div>
      <div class="av-desc">${pet.desc}</div>
    `;
    card.addEventListener("click", () => {
      $$(".avatar-card").forEach(c => c.classList.remove("sel"));
      card.classList.add("sel");
      selectedAvatarId = pet.id;
    });
    grid.appendChild(card);
  });

  $("#profileModal").classList.remove("hidden");
}

function closeProfileModal() {
  $("#profileModal").classList.add("hidden");
}

function saveProfile() {
  const nameInput = $("#playerNameInput");
  const name = (nameInput ? nameInput.value.trim() : "") || "You";
  Store.setProfile({ name, avatarId: selectedAvatarId });
  refreshProfileUI();
  closeProfileModal();
  toast("Profile updated! 🐾");
}

function openVerseSelect(mode, rivalKind, rivalName) {
  openLevelSelect(mode, rivalKind, rivalName);
}

function openLevelSelect(mode, rivalKind, rivalName) {
  G.pendingMode = mode;
  G.pendingRivalKind = rivalKind;
  G.pendingRivalName = rivalName;
  $("#vsTitle").textContent = mode === "single" ? "Pick a Difficulty — Single 🐑" : "Pick a Difficulty — Duo ⚔️";
  $("#vsSub").textContent = mode === "single"
    ? "You'll get a random verse of that length. See the reference, recall the words!"
    : (rivalKind === "cpu" ? "Random verse — first to finish it word-for-word wins!"
                           : "Random verse on one screen — P1 taps bubbles, P2 uses keys 1–9!");
  const grid = $("#levelGrid");
  grid.innerHTML = "";
  const cards = [
    { diff: "easy",   icon: "🌟",       name: "Easy",   time: "20s", desc: "⏱️ 20s to solve · 50% pre-filled board · 1 trick word!" },
    { diff: "medium", icon: "🌟🌟",     name: "Medium", time: "30s", desc: "⏱️ 30s to solve · Phrase-by-phrase · 1 trick word per phrase!" },
    { diff: "hard",   icon: "🌟🌟🌟", name: "Hard",   time: "40s", desc: "⏱️ 40s to solve · Full verse from memory · 2+ trick words!" }
  ];
  cards.forEach(c => {
    const card = document.createElement("div");
    card.className = "verse-card";
    card.innerHTML = `<div class="ref">${c.icon} ${c.name} <span class="time-pill">⏱️ ${c.time}</span></div>
      <div class="snippet">${c.desc}</div>
      <div class="meta">A random verse is dealt — beat the clock! ⏰</div>`;
    card.addEventListener("click", () => {
      const verse = pickVerse(c.diff);
      G.pendingDifficulty = c.diff;
      startGame(mode, verse, {
        rivalKind: rivalKind,
        rivalName: rivalName,
        duoDifficulty: G.pendingDuoDifficulty
      });
    });
    grid.appendChild(card);
  });
  showScreen("#verseSelect");
}

function wire() {
  // menu & profile
  $("#btnSingle").addEventListener("click", () => openLevelSelect("single", "ghost"));
  $("#btnDuoCpu").addEventListener("click", () => openLevelSelect("duo", "cpu"));
  $("#btnDuoLocal").addEventListener("click", () => openLevelSelect("duo", "local"));
  $("#btnHow").addEventListener("click", () => $("#howModal").classList.remove("hidden"));
  $("#howClose").addEventListener("click", () => $("#howModal").classList.add("hidden"));

  const btnEdit = $("#btnEditProfile");
  if (btnEdit) btnEdit.addEventListener("click", openProfileModal);
  const btnCloseP = $("#btnCloseProfile");
  if (btnCloseP) btnCloseP.addEventListener("click", closeProfileModal);
  const btnSaveP = $("#btnSaveProfile");
  if (btnSaveP) btnSaveP.addEventListener("click", saveProfile);
  const profModal = $("#profileModal");
  if (profModal) {
    profModal.addEventListener("click", (e) => {
      if (e.target.id === "profileModal") closeProfileModal();
    });
  }

  // duo difficulty chips on menu
  $$(".diff-chip").forEach(c => c.addEventListener("click", () => {
    $$(".diff-chip").forEach(x => x.classList.remove("sel"));
    c.classList.add("sel");
    G.pendingDuoDifficulty = c.dataset.d;
  }));
  G.pendingDuoDifficulty = "normal";

  $("#vsBack").addEventListener("click", () => showScreen("#menu"));

  // HUD
  $("#pauseBtn").addEventListener("click", pauseGame);
  $("#resumeBtn").addEventListener("click", resumeGame);
  $("#quitBtn").addEventListener("click", quitGame);
  $("#peekBtn").addEventListener("click", peekHint);

  // results
  $("#resAgain").addEventListener("click", () => {
    startGame(G.pendingMode || G.mode, G.verse, {
      rivalKind: G.pendingRivalKind, rivalName: G.pendingRivalName,
      duoDifficulty: G.pendingDuoDifficulty
    });
  });
  $("#resOther").addEventListener("click", () => openLevelSelect(G.pendingMode, G.pendingRivalKind, G.pendingRivalName));
  $("#resMenu").addEventListener("click", () => { refreshStats(); refreshProfileUI(); showScreen("#menu"); });

  // keyboard: P2 numbers, Esc pause
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { G.paused ? resumeGame() : pauseGame(); return; }
    duoLocalKeyHandler(e);
  });

  // pause overlay: clicking outside card resumes
  $("#pauseOverlay").addEventListener("click", (e) => {
    if (e.target.id === "pauseOverlay") resumeGame();
  });

  // keep the hill tidy on resize
  window.addEventListener("resize", () => {
    if (!$("#game").classList.contains("hidden")) repositionBubbles();
  });

  refreshStats();
  refreshProfileUI();
}

document.addEventListener("DOMContentLoaded", wire);

