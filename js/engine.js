/* ============================================================
   LAMB YIPEE — game engine
   Pure logic + WebAudio SFX. No DOM access here.
   ============================================================ */

/* ---------- WebAudio blips (no external files) ---------- */
const SFX = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when = 0) {
    try {
      const a = ac();
      const t = a.currentTime + when;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* audio not available */ }
  }
  return {
    tap()    { tone(660, 0.09, "triangle", 0.12); },
    correct(){ tone(523, 0.10, "sine", 0.14); tone(784, 0.12, "sine", 0.12, 0.07); },
    wrong()  { tone(196, 0.20, "sawtooth", 0.10); tone(147, 0.25, "sawtooth", 0.08, 0.05); },
    finish() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "sine", 0.16, i * 0.12)); },
    lose()   { [392, 330, 262].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.15)); },
    count()  { tone(880, 0.08, "sine", 0.10); },
    go()     { tone(1047, 0.25, "sine", 0.16); },
    stun()   { tone(120, 0.3, "square", 0.08); }
  };
})();

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Distractor pool: real words from OTHER verses (NIV wording) so
   players may recognize some, but they never complete the verse. */
const DISTRACTORS = [
  "shepherd", "pastures", "righteousness", "eternal", "overflow",
  "whoever", "believes", "perish", "comfort", "darkness", "mercy",
  "goodness", "dwell", "strength", "renew", "eagles", "weary", "faint",
  "wisdom", "generously", "fault", "faithfulness", "compassions",
  "consumed", "morning", "refuge", "trouble", "present", "dismayed",
  "courageous", "wherever", "petition", "thanksgiving", "anxious",
  "forbearance", "kindness", "love", "envy", "boast",
  "proud", "confidence", "assurance", "hoped", "transformed",
  "conform", "renewing", "pleasing", "perfect", "heartily",
  "burdened", "warrior", "uphold", "prosper", "future", "hope",
  "singing", "mighty", "humbly", "justly", "mountains", "shadow",
  "fountain", "living", "water", "thirsty", "delight", "rejoice"
];

/* Split verse text into word tokens. Em-dashes become their own
   token so phrases like "faith—and" stay fair to tap. */
function tokenize(text) {
  return text.replace(/—/g, " — ").split(/\s+/).filter(Boolean);
}

/* ---------- difficulty tiers by verse length ----------
   The player never browses the scripture list (that would spoil the
   memory challenge) — instead they pick a difficulty and the game
   deals a RANDOM verse from the matching tier:
     easy   — short verses  (≤ 12 words)
     medium — medium verses (13–21 words)
     hard   — long verses   (22+ words)                        */
const WORD_TIERS = { easy: [1, 12], medium: [13, 21], hard: [22, 9999] };

function wordCount(verse) { return tokenize(verse.text).length; }

function versePool(diff) {
  const [lo, hi] = WORD_TIERS[diff] || WORD_TIERS.easy;
  const pool = VERSES.filter(v => { const n = wordCount(v); return n >= lo && n <= hi; });
  return pool.length ? pool : VERSES;
}

function pickVerse(diff) {
  return pick(versePool(diff));
}

function splitIntoPhrases(text) {
  const tokens = tokenize(text);
  if (tokens.length <= 6) return [tokens];
  let bestIdx = -1;
  let bestDist = Infinity;
  const mid = tokens.length / 2;
  for (let i = 2; i < tokens.length - 2; i++) {
    const t = tokens[i];
    if (/[,;:\.!?—]$/.test(t) || t === "—") {
      const dist = Math.abs(i + 1 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i + 1;
      }
    }
  }
  if (bestIdx === -1) {
    bestIdx = Math.ceil(tokens.length / 2);
  }
  return [tokens.slice(0, bestIdx), tokens.slice(bestIdx)];
}

const TIME_LIMITS = {
  easy: 20,
  medium: 30,
  hard: 40
};

function getDifficultyConfig(diff, verse) {
  const tokens = tokenize(verse.text);
  const total = tokens.length;
  const timeLimit = TIME_LIMITS[diff] || 30;

  if (diff === "easy") {
    // Easy: 20 seconds, 50% on board, 50% to be added, 1 incorrect word
    const prefilledCount = Math.floor(total * 0.5);
    const prefilled = tokens.slice(0, prefilledCount);
    const needed = tokens.slice(prefilledCount);
    return {
      type: "easy",
      timeLimit: 20,
      prefilledIndices: Array.from({ length: prefilledCount }, (_, i) => i),
      prefilledWords: prefilled,
      neededWords: needed,
      distractorCount: 1,
      phrases: [tokens]
    };
  } else if (diff === "medium") {
    // Medium: 30 seconds, phrase-by-phrase, initial word on board for each phrase, 1 incorrect word per phrase
    const phrases = splitIntoPhrases(verse.text);
    return {
      type: "medium",
      timeLimit: 30,
      phrases: phrases,
      distractorCount: 1
    };
  } else {
    // Hard: 40 seconds, complete whole verse, 0 revealed, 2 incorrect words
    return {
      type: "hard",
      timeLimit: 40,
      prefilledIndices: [],
      prefilledWords: [],
      neededWords: tokens,
      distractorCount: 2,
      phrases: [tokens]
    };
  }
}

function buildWords(verse, diff = "hard", phraseIdx = 0) {
  const target = tokenize(verse.text);
  const cfg = getDifficultyConfig(diff, verse);

  if (cfg.type === "easy") {
    // Exactly remaining 50% + 1 distractor
    const dist = shuffle([...new Set(DISTRACTORS)]).filter(w => !target.includes(w)).slice(0, 1);
    return shuffle(cfg.neededWords.concat(dist));
  } else if (cfg.type === "medium") {
    // Target is current phrase words excluding the initial word + 1 distractor
    const ph = cfg.phrases[phraseIdx] || cfg.phrases[0];
    const needed = ph.slice(1);
    const dist = shuffle([...new Set(DISTRACTORS)]).filter(w => !ph.includes(w)).slice(0, 1);
    return shuffle(needed.concat(dist));
  } else {
    // Hard: all target words + 2 distractors
    const dist = shuffle([...new Set(DISTRACTORS)]).filter(w => !target.includes(w)).slice(0, 2);
    return shuffle(target.concat(dist));
  }
}

/* ---------- race model ---------- */
class Racer {
  constructor(name, targetWords, mode, opts = {}) {
    this.name = name;
    this.mode = mode;                 // "single" | "duo" | "cpu"
    this.avatarId = opts.avatarId || "flora";
    this.diff = opts.diff || "hard";
    this.target = targetWords;        // array of correct words in order
    this.placed = opts.prefilledWords ? opts.prefilledWords.slice() : [];
    this.phrases = opts.phrases || [targetWords];
    this.phraseIdx = opts.phraseIdx || 0;
    this.stunUntil = 0;               // ms timestamp
    this.done = false;
    this.doneAt = null;               // ms timestamp when finished
    this.mistakes = 0;
    this.taps = 0;
  }
  get progress() { return this.target.length ? (this.placed.length / this.target.length) : 0; }
  tryWord(word, now) {
    if (this.done) return false;
    if (now < this.stunUntil) return false;
    this.taps++;
    const want = this.target[this.placed.length];
    if (word === want) {
      this.placed.push(word);
      if (this.placed.length === this.target.length) {
        this.done = true;
        this.doneAt = now;
      }
      return true;
    }
    this.mistakes++;
    this.stunUntil = now + 1200;
    return false;
  }
  nextWord() { return this.done ? null : this.target[this.placed.length]; }
}

/* ---------- scoring ---------- */
/* grade/star bands are in SECONDS; optional timeLimitSec scales dynamically */
const gradeOf = (ms, timeLimitSec) => {
  const t = ms / 1000;
  if (!timeLimitSec) {
    return t < 20 ? "RADIANT ✨" : t < 30 ? "GOLDEN 🥇" : t < 45 ? "BRIGHT 🥈" : "STEADY 🥉";
  }
  const lim = timeLimitSec;
  return t <= lim * 0.55 ? "RADIANT ✨" : t <= lim * 0.8 ? "GOLDEN 🥇" : t <= lim ? "BRIGHT 🥈" : "TIME'S UP ⏱️";
};

const starsOf = (ms, timeLimitSec) => {
  const t = ms / 1000;
  if (!timeLimitSec) {
    return t < 20 ? 3 : t < 30 ? 2 : 1;
  }
  const lim = timeLimitSec;
  return t <= lim * 0.55 ? 3 : t <= lim * 0.8 ? 2 : 1;
};

/* ---------- storage ---------- */
const Store = {
  key: "lambYipee.v1",
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch (e) { return {}; }
  },
  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); } catch (e) {}
  },
  bestFor(ref) {
    const d = this.load();
    return (d.bests && d.bests[ref]) || null;
  },
  setBest(ref, timeMs) {
    const d = this.load();
    d.bests = d.bests || {};
    const prev = d.bests[ref];
    if (!prev || timeMs < prev) { d.bests[ref] = timeMs; this.save(d); return true; }
    return false;
  },
  totals() {
    const d = this.load();
    return { stars: d.stars || 0, wins: d.wins || 0, races: d.races || 0 };
  },
  addTotals({ stars = 0, win = 0, race = 0 }) {
    const d = this.load();
    d.stars = (d.stars || 0) + stars;
    d.wins = (d.wins || 0) + win;
    d.races = (d.races || 0) + race;
    this.save(d);
  },
  profile() {
    const d = this.load();
    return d.profile || { name: "You", avatarId: "capybara" };
  },
  setProfile(prof) {
    const d = this.load();
    d.profile = Object.assign(d.profile || {}, prof);
    this.save(d);
  }
};

