// qa/run-gauntlet.js
// Runs comprehensive gauntlet test loop for EACH and EVERY level & verse
const fs = require("fs");
const path = require("path");

// Load modules
const versesCode = fs.readFileSync(path.join(__dirname, "../js/verses.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "../js/engine.js"), "utf8");

// Mock environment
const sandbox = {
  window: {},
  document: { querySelector: () => null, querySelectorAll: () => [] },
  AudioContext: class { resume() {} },
  webkitAudioContext: class { resume() {} },
  performance: { now: () => Date.now() },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); }
  }
};

const vm = require("vm");
vm.createContext(sandbox);
const exportsObj = vm.runInContext(
  versesCode + "\n" + engineCode + "\n" +
  "({ VERSES, tokenize, getDifficultyConfig, buildWords, splitIntoPhrases, wordCount, versePool, Racer, starsOf, gradeOf, Store });",
  sandbox
);

const { VERSES, tokenize, getDifficultyConfig, buildWords, splitIntoPhrases, wordCount, versePool, Racer, starsOf, gradeOf, Store } = exportsObj;

console.log("==================================================");
console.log("LAMB YIPEE — FULL GAUNTLET LOOP FOR ALL LEVELS");
console.log("==================================================");

let totalAsserts = 0;
let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  totalAsserts++;
  if (condition) {
    totalPassed++;
  } else {
    totalFailed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log(`Total Verses in Library: ${VERSES.length}`);
assert(VERSES.length === 40, "Total verses equals 40");

// 1. Validate Tier Pools
console.log("\n--- STAGE 1: Difficulty Tier Pools ---");
const easyPool = versePool("easy");
const medPool = versePool("medium");
const hardPool = versePool("hard");

console.log(`• Easy Tier (<= 13 words): ${easyPool.length} verses`);
console.log(`• Medium Tier (14-21 words): ${medPool.length} verses`);
console.log(`• Hard Tier (>= 22 words): ${hardPool.length} verses`);

assert(easyPool.length >= 10, "Easy pool has at least 10 verses");
assert(medPool.length >= 10, "Medium pool has at least 10 verses");
assert(hardPool.length >= 10, "Hard pool has at least 10 verses");
assert(easyPool.every(v => wordCount(v) <= 13), "All Easy verses <= 13 words");
assert(medPool.every(v => wordCount(v) >= 14 && wordCount(v) <= 21), "All Medium verses 14-21 words");
assert(hardPool.every(v => wordCount(v) >= 22), "All Hard verses >= 22 words");

// 2. Loop through every verse for all 3 difficulties
console.log("\n--- STAGE 2: Exhaustive Level Loop (40 Verses x 3 Levels) ---");

VERSES.forEach((verse, idx) => {
  const words = tokenize(verse.text);
  assert(words.length > 0, `Verse ${idx + 1} (${verse.ref}) has valid words (${words.length})`);

  // Easy Level
  const easyCfg = getDifficultyConfig("easy", verse);
  assert(easyCfg.timeLimit === 60, `${verse.ref} Easy time limit = 60s`);
  assert(easyCfg.prefilledWords.length === Math.floor(words.length * 0.5), `${verse.ref} Easy has 50% prefilled words`);
  const easyHillWords = buildWords(verse, "easy", 0);
  assert(easyHillWords.length === (words.length - easyCfg.prefilledWords.length + 1), `${verse.ref} Easy hill has remaining words + 1 distractor`);

  // Medium Level
  const medCfg = getDifficultyConfig("medium", verse);
  assert(medCfg.timeLimit === 80, `${verse.ref} Medium time limit = 80s`);
  assert(medCfg.phrases.length === 2, `${verse.ref} Medium split into exactly 2 phrases`);
  assert(medCfg.phrases[0].length >= 2, `${verse.ref} Medium phrase 1 length >= 2`);
  assert(medCfg.phrases[1].length >= 2, `${verse.ref} Medium phrase 2 length >= 2`);
  const medHillP1 = buildWords(verse, "medium", 0);
  assert(medHillP1.length === medCfg.phrases[0].length, `${verse.ref} Medium phrase 1 hill words count correct`);
  const medHillP2 = buildWords(verse, "medium", 1);
  assert(medHillP2.length === medCfg.phrases[1].length, `${verse.ref} Medium phrase 2 hill words count correct`);

  // Hard Level
  const hardCfg = getDifficultyConfig("hard", verse);
  assert(hardCfg.timeLimit === 100, `${verse.ref} Hard time limit = 100s`);
  assert(hardCfg.prefilledWords.length === 0, `${verse.ref} Hard has 0 prefilled words`);
  const hardHillWords = buildWords(verse, "hard", 0);
  assert(hardHillWords.length === words.length + 2, `${verse.ref} Hard hill has all words + 2 distractors`);
});

// 3. Gauntlet Simulated Game Loop for Each Level
console.log("\n--- STAGE 3: Full Race Gameplay Simulation for Each Level ---");

// Test Easy Race Gameplay
console.log("• Testing Easy Race Gameplay Loop...");
const testEasyVerse = VERSES[0];
const easyCfg = getDifficultyConfig("easy", testEasyVerse);
const easyRacer = new Racer("Player", tokenize(testEasyVerse.text), "single", {
  prefilledWords: easyCfg.prefilledWords,
  diff: "easy"
});
assert(easyRacer.placed.length === easyCfg.prefilledWords.length, "Easy racer starts with prefilled words");
while (!easyRacer.done) {
  const nextWord = easyRacer.nextWord();
  const ok = easyRacer.tryWord(nextWord, Date.now());
  assert(ok, `Easy placed word: ${nextWord}`);
}
assert(easyRacer.done, "Easy racer completed full verse");
assert(starsOf(18000, 60) === 3, "18s within 60s limit awards 3 stars");

// Test Medium Race Gameplay Loop with Phrase 1 -> Phrase 2 Transition
console.log("• Testing Medium Race Gameplay Loop (Phrase 1 -> Phrase 2)...");
const testMedVerse = VERSES.find(v => v.ref === "Romans 8:28") || VERSES[10];
const medCfg = getDifficultyConfig("medium", testMedVerse);
const medTargetWords = tokenize(testMedVerse.text);
const p0 = medCfg.phrases[0];
const p1 = medCfg.phrases[1];

const medRacer = new Racer("Player", medTargetWords, "single", {
  prefilledWords: [p0[0]],
  diff: "medium"
});
assert(medRacer.placed.length === 1, "Medium starts with phrase 1 word 0 prefilled");

// Place rest of Phrase 1
for (let i = 1; i < p0.length; i++) {
  const ok = medRacer.tryWord(p0[i], Date.now());
  assert(ok, `Medium placed phrase 1 word ${i}: ${p0[i]}`);
}
assert(medRacer.placed.length === p0.length, "Phrase 1 completed");

// Advance to Phrase 2
medRacer.placed.push(p1[0]); // prefilled word 0 of phrase 2
assert(medRacer.placed.length === p0.length + 1, "Phrase 2 word 0 prefilled on board");

// Place rest of Phrase 2
for (let i = 1; i < p1.length; i++) {
  const ok = medRacer.tryWord(p1[i], Date.now());
  assert(ok, `Medium placed phrase 2 word ${i}: ${p1[i]}`);
}
assert(medRacer.done, "Medium racer completed full verse across both phrases");
assert(starsOf(35000, 80) === 3, "35s within 80s limit awards 3 stars");

// Test Hard Race Gameplay Loop
console.log("• Testing Hard Race Gameplay Loop...");
const testHardVerse = VERSES.find(v => v.ref === "Joshua 1:9") || VERSES[15];
const hardTargetWords = tokenize(testHardVerse.text);
const hardRacer = new Racer("Player", hardTargetWords, "single", {
  diff: "hard"
});
assert(hardRacer.placed.length === 0, "Hard racer starts with 0 words placed");
for (let i = 0; i < hardTargetWords.length; i++) {
  const ok = hardRacer.tryWord(hardTargetWords[i], Date.now());
  assert(ok, `Hard placed word ${i + 1}/${hardTargetWords.length}: ${hardTargetWords[i]}`);
}
assert(hardRacer.done, "Hard racer completed full verse");
assert(starsOf(45000, 100) === 3, "45s within 100s limit awards 3 stars");

// Test Overtime and Pass Score Mechanics
console.log("• Testing Overtime & Pass Scoring...");
assert(starsOf(75000, 60) === 0, "Overtime on Easy (75s > 60s) awards 0 stars");
assert(starsOf(95000, 80) === 0, "Overtime on Medium (95s > 80s) awards 0 stars");
assert(starsOf(115000, 100) === 0, "Overtime on Hard (115s > 100s) awards 0 stars");
assert(gradeOf(75000, 60) === "OVERTIME ⏱️", "Overtime grade formatted correctly");

console.log("\n==================================================");
console.log(`GAUNTLET TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED (Total: ${totalAsserts} Asserts)`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL GAUNTLET TESTS FOR EVERY LEVEL PASSED PERFECTLY!\n");
}
