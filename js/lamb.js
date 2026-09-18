/* ============================================================
   LAMB YIPEE — animated character v3
   Sculpted after the 3D-render reference: big head with curly
   pom-pom crown, wide splayed ears with pink inner, huge glossy
   amber eyes, blush, open smile with tongue, brown hooves.

   MOTION: no CSS keyframes at all — a per-frame spring-physics
   skeleton drives every part, so movement is continuous,
   interruptible and naturally "loose":
     • jumps use real gravity (launch, hang, fall, squash-land)
     • ears/head/legs are damped springs with inertia coupling —
       they lag, whip and settle on their own like real fluff
     • idle = breathing, weight-shift, blinks, ear flicks, glances
   ============================================================ */

function makeLambSVG(opts = {}) {
  const id = opts.id || "x";
  const wool    = opts.wool    || "#fdf6e8";
  const woolHi  = opts.woolHi  || "#fffdf6";
  const woolSh  = opts.woolSh  || opts.woolShade || "#e9d5b2";
  const skin    = opts.skin    || opts.face      || "#ffedda";
  const skinSh  = opts.skinSh  || "#f4d9b8";
  const earIn   = opts.earIn   || opts.tint      || "#f6adad";
  const hoof    = opts.hoof    || "#5f4030";
  const hoofHi  = opts.hoofHi  || "#7b5844";
  const iris    = opts.iris    || "#8a5a28";
  const tongue  = opts.tongue  || "#f4899b";

  return `
<svg class="lamb-rig" viewBox="0 0 120 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="woolG-${id}" cx="36%" cy="26%" r="88%">
      <stop offset="0%" stop-color="${woolHi}"/>
      <stop offset="55%" stop-color="${wool}"/>
      <stop offset="100%" stop-color="${woolSh}"/>
    </radialGradient>
    <radialGradient id="skinG-${id}" cx="40%" cy="30%" r="82%">
      <stop offset="0%" stop-color="#fff8ec"/>
      <stop offset="70%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skinSh}"/>
    </radialGradient>
    <linearGradient id="earG-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbc9c9"/>
      <stop offset="100%" stop-color="${earIn}"/>
    </linearGradient>
    <linearGradient id="hoofG-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${hoofHi}"/>
      <stop offset="100%" stop-color="${hoof}"/>
    </linearGradient>
    <radialGradient id="irisG-${id}" cx="42%" cy="36%" r="72%">
      <stop offset="0%" stop-color="#a3703a"/>
      <stop offset="60%" stop-color="${iris}"/>
      <stop offset="100%" stop-color="#4a2d12"/>
    </radialGradient>
    <radialGradient id="shadG-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(70,45,20,.30)"/>
      <stop offset="100%" stop-color="rgba(70,45,20,0)"/>
    </radialGradient>
  </defs>

  <ellipse class="rig-shadow" cx="60" cy="120" rx="33" ry="7" fill="url(#shadG-${id})"/>

  <g class="rig-root">
    <!-- BACK LEGS (behind body, wool-shaded) -->
    <g class="rig-leg-bl">
      <rect x="39" y="95" width="9.5" height="21" rx="4.7" fill="${woolSh}"/>
      <ellipse cx="43.7" cy="115" rx="6.6" ry="4.6" fill="url(#hoofG-${id})"/>
      <path d="M43.7 112.5 v5" stroke="${hoof}" stroke-width="1" opacity=".5"/>
    </g>
    <g class="rig-leg-br">
      <rect x="71" y="95" width="9.5" height="21" rx="4.7" fill="${woolSh}"/>
      <ellipse cx="75.7" cy="115" rx="6.6" ry="4.6" fill="url(#hoofG-${id})"/>
      <path d="M75.7 112.5 v5" stroke="${hoof}" stroke-width="1" opacity=".5"/>
    </g>

    <!-- BODY: curly pom-pom pile -->
    <g class="rig-body">
      <circle cx="60" cy="89" r="24" fill="url(#woolG-${id})"/>
      <circle cx="42" cy="80" r="11" fill="url(#woolG-${id})"/>
      <circle cx="78" cy="80" r="11" fill="url(#woolG-${id})"/>
      <circle cx="36" cy="92" r="9" fill="url(#woolG-${id})"/>
      <circle cx="84" cy="92" r="9" fill="url(#woolG-${id})"/>
      <circle cx="48" cy="101" r="10" fill="url(#woolG-${id})"/>
      <circle cx="72" cy="101" r="10" fill="url(#woolG-${id})"/>
      <circle cx="60" cy="105" r="10" fill="url(#woolG-${id})"/>
      <circle cx="60" cy="78" r="12" fill="url(#woolG-${id})"/>
      <path d="M49 85 q5 -5 9.5 0 q-4.5 4.5 -9.5 0" fill="${woolSh}" opacity=".5"/>
      <path d="M64 94 q5 -5 9.5 0 q-4.5 4.5 -9.5 0" fill="${woolSh}" opacity=".45"/>
      <path d="M43 96 q4 -4 8 0 q-4 3.5 -8 0" fill="${woolSh}" opacity=".4"/>
    </g>

    <!-- FRONT LEGS -->
    <g class="rig-leg-fl">
      <rect x="47.5" y="97" width="10" height="19" rx="5" fill="url(#skinG-${id})"/>
      <ellipse cx="52.5" cy="115.5" rx="6.9" ry="4.7" fill="url(#hoofG-${id})"/>
      <path d="M52.5 112.5 v5.5" stroke="${hoof}" stroke-width="1" opacity=".55"/>
    </g>
    <g class="rig-leg-fr">
      <rect x="62.5" y="97" width="10" height="19" rx="5" fill="url(#skinG-${id})"/>
      <ellipse cx="67.5" cy="115.5" rx="6.9" ry="4.7" fill="url(#hoofG-${id})"/>
      <path d="M67.5 112.5 v5.5" stroke="${hoof}" stroke-width="1" opacity=".55"/>
    </g>

    <!-- HEAD -->
    <g class="rig-head">
      <!-- EARS: wide, splayed out like the character (inside head so they follow it) -->
      <g class="rig-ear-l">
        <path d="M35 33 C 22 24, 5 27, 3.5 40 C 2.5 51, 20 56, 35.5 47 Z" fill="url(#skinG-${id})"/>
        <path d="M32 35 C 23 30, 10 33, 9.5 41 C 9 47, 21 50, 32 44.5 Z" fill="url(#earG-${id})"/>
      </g>
      <g class="rig-ear-r">
        <path d="M85 33 C 98 24, 115 27, 116.5 40 C 117.5 51, 100 56, 84.5 47 Z" fill="url(#skinG-${id})"/>
        <path d="M88 35 C 97 30, 110 33, 110.5 41 C 111 47, 99 50, 88 44.5 Z" fill="url(#earG-${id})"/>
      </g>

      <!-- curly pom-pom crown -->
      <circle cx="36" cy="27" r="12.5" fill="url(#woolG-${id})"/>
      <circle cx="52" cy="18" r="14" fill="url(#woolG-${id})"/>
      <circle cx="70" cy="18" r="14" fill="url(#woolG-${id})"/>
      <circle cx="85" cy="27" r="12" fill="url(#woolG-${id})"/>
      <circle cx="26" cy="38" r="10" fill="url(#woolG-${id})"/>
      <circle cx="94" cy="38" r="10" fill="url(#woolG-${id})"/>
      <path d="M52 15 q6 -6 11 0 q-5 5 -11 0" fill="${woolHi}" opacity=".8"/>
      <!-- face -->
      <ellipse cx="60" cy="47" rx="27" ry="24" fill="url(#skinG-${id})"/>
      <ellipse cx="60" cy="55" rx="17" ry="12" fill="url(#skinG-${id})" opacity=".55"/>

      <!-- blush -->
      <ellipse class="rig-blush" cx="38" cy="55" rx="6.6" ry="4" fill="#ffb0ba" opacity=".8"/>
      <ellipse class="rig-blush" cx="82" cy="55" rx="6.6" ry="4" fill="#ffb0ba" opacity=".8"/>

      <!-- brows -->
      <path class="rig-brow-l" d="M42 33.5 Q48 30 54 32.5" stroke="#8a6242" stroke-width="2.1" fill="none" stroke-linecap="round"/>
      <path class="rig-brow-r" d="M66 32.5 Q72 30 78 33.5" stroke="#8a6242" stroke-width="2.1" fill="none" stroke-linecap="round"/>

      <!-- BIG GLOSSY AMBER EYES -->
      <g class="rig-eye-l">
        <ellipse cx="49" cy="46" rx="7.8" ry="8.8" fill="#fff"/>
        <g class="rig-gaze-l">
          <circle cx="49" cy="47" r="6.5" fill="url(#irisG-${id})"/>
          <circle cx="49" cy="47" r="3.2" fill="#241608"/>
          <circle cx="46.6" cy="43.8" r="2.3" fill="#fff"/>
          <circle cx="51.8" cy="49.8" r="1" fill="#fff" opacity=".85"/>
        </g>
        <path d="M41.8 38.8 l-2.2 -1.7 M44 37.6 l-1.5 -2.1" stroke="#3a2412" stroke-width="1.1" stroke-linecap="round"/>
        <rect class="eye-lid" x="41" y="36.5" width="16" height="0" rx="8" fill="${skin}"/>
        <path class="eye-sad" d="M43.5 45 Q49 49.5 54.5 45" stroke="#241608" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0"/>
      </g>
      <g class="rig-eye-r">
        <ellipse cx="71" cy="46" rx="7.8" ry="8.8" fill="#fff"/>
        <g class="rig-gaze-r">
          <circle cx="71" cy="47" r="6.5" fill="url(#irisG-${id})"/>
          <circle cx="71" cy="47" r="3.2" fill="#241608"/>
          <circle cx="68.6" cy="43.8" r="2.3" fill="#fff"/>
          <circle cx="73.8" cy="49.8" r="1" fill="#fff" opacity=".85"/>
        </g>
        <path d="M78.2 38.8 l2.2 -1.7 M76 37.6 l1.5 -2.1" stroke="#3a2412" stroke-width="1.1" stroke-linecap="round"/>
        <rect class="eye-lid" x="63" y="36.5" width="16" height="0" rx="8" fill="${skin}"/>
        <path class="eye-sad" d="M65.5 45 Q71 49.5 76.5 45" stroke="#241608" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0"/>
      </g>

      <!-- nose -->
      <path d="M56.6 56.5 Q60 54.3 63.4 56.5 Q62.4 59.5 60 60.7 Q57.6 59.5 56.6 56.5" fill="#f2a0a0"/>

      <!-- mouth: open smile with tongue ↔ sad frown -->
      <g class="rig-mouth-happy">
        <path d="M50 63.5 Q60 76 70 63.5 Q60 68.5 50 63.5 Z" fill="#8e3a2c"/>
        <ellipse cx="60" cy="69" rx="4.8" ry="2.8" fill="${tongue}"/>
      </g>
      <g class="rig-mouth-sad" opacity="0">
        <path d="M53.5 68 Q60 60.5 66.5 68" stroke="#8e3a2c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
    </g>

    <!-- celebrate sparkles -->
    <g class="rig-sparkles" opacity="0">
      <text x="10" y="24" font-size="14">✨</text>
      <text x="100" y="20" font-size="13">✨</text>
      <text x="108" y="58" font-size="12">⭐</text>
      <text x="2" y="62" font-size="12">⭐</text>
      <text x="58" y="4" font-size="12">💫</text>
    </g>

    <!-- sweat drop on sad -->
    <g class="rig-sweat" opacity="0">
      <path d="M100 16 q4.5 8 0 11 q-4.5 -3 0 -11" fill="#7fc4f0"/>
    </g>
  </g>
</svg>`;
}

/* ============================================================
   Spring-physics rig — everything moves every frame.
   ============================================================ */

const GRAV = 1400;              // svg-units / s²

function rigLamb(container, opts = {}) {
  container.innerHTML = makeLambSVG(opts);
  const svg = container.querySelector("svg.lamb-rig");
  const q = (s) => svg.querySelector(s);
  const qa = (s) => svg.querySelectorAll(s);

  const P = {
    root: q(".rig-root"),
    head: q(".rig-head"),
    earL: q(".rig-ear-l"), earR: q(".rig-ear-r"),
    legFL: q(".rig-leg-fl"), legFR: q(".rig-leg-fr"),
    legBL: q(".rig-leg-bl"), legBR: q(".rig-leg-br"),
    gazeL: q(".rig-gaze-l"), gazeR: q(".rig-gaze-r"),
    shadow: q(".rig-shadow"),
    sparkles: q(".rig-sparkles"), sweat: q(".rig-sweat"),
    blushes: qa(".rig-blush"),
    mouthHappy: q(".rig-mouth-happy"), mouthSad: q(".rig-mouth-sad"),
    lids: qa(".eye-lid"), eyesSad: qa(".eye-sad"),
    eyesWhite: qa(".rig-eye-l > ellipse, .rig-eye-r > ellipse"),
    pupils: qa(".rig-gaze-l > circle, .rig-gaze-r > circle")
  };
  [P.gazeL, P.gazeR].forEach(g => {
    g.style.transformBox = "fill-box";
    g.style.transformOrigin = "center";
  });

  /* ----- damped springs: {x: value, v: velocity, t: target} ----- */
  const S = (x, k, damp) => ({ x, v: 0, t: x, k, damp });
  const sqx   = S(1, 190, 9.5);   // squash width
  const sqy   = S(1, 190, 9.5);   // squash height
  const earL  = S(0, 120, 7);     // + = tip down (left), - = up
  const earR  = S(0, 120, 7);     // - = tip down (right), + = up
  const headR = S(0, 90, 8);      // head tilt
  const headY = S(0, 90, 8);      // head bob offset
  const legFL = S(0, 150, 9);
  const legFR = S(0, 150, 9);
  const legBL = S(0, 130, 9);
  const legBR = S(0, 130, 9);
  const lean  = S(0, 80, 8);      // body lean
  const gazeX = S(0, 60, 10);
  const gazeY = S(0, 60, 10);
  const slump = S(0, 60, 11);     // sad sink

  /* ----- state ----- */
  let mode = "idle";
  let y = 0, vy = 0, jumping = false;
  let idleAmp = 1;                       // breath amplitude (fades in air)
  let lookTimer = null, perfTimers = [];

  function clearPerfTimers() { perfTimers.forEach(clearTimeout); perfTimers = []; }
  function later(fn, ms) { perfTimers.push(setTimeout(fn, ms)); }

  function setFace(mood) {
    const sad = mood === "sad";
    P.mouthHappy.style.opacity = sad ? 0 : 1;
    P.mouthSad.style.opacity = sad ? 1 : 0;
    P.eyesSad.forEach(p => p.style.opacity = sad ? 1 : 0);
    P.eyesWhite.forEach(p => p.style.opacity = sad ? 0 : 1);
    P.pupils.forEach(p => p.style.opacity = sad ? 0 : 1);
    // brows: up & round when happy, pinched & tilted when sad
    q(".rig-brow-l").setAttribute("transform", sad ? "translate(2 2.5) rotate(9 47 31)" : "");
    q(".rig-brow-r").setAttribute("transform", sad ? "translate(-2 2.5) rotate(-9 73 31)" : "");
  }

  function blink(slow = false) {
    const dur = slow ? 240 : 120;
    P.lids.forEach(l => l.setAttribute("height", "19"));
    setTimeout(() => P.lids.forEach(l => l.setAttribute("height", "0")), dur);
  }

  /* ---------- REJOICE: three gravity hops with anticipation ---------- */
  function rejoice(ms = 820) {
    clearPerfTimers();
    mode = "rejoice";
    setFace("happy");
    P.sweat.style.opacity = 0;
    P.blushes.forEach(b => b.style.opacity = 1);
    P.sparkles.style.opacity = 1;
    try {
      P.sparkles.style.transformBox = "fill-box";
      P.sparkles.style.transformOrigin = "center";
      P.sparkles.animate(
        [{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(1.2)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 280, easing: "ease-out", fill: "both" });
    } catch (e) {}

    const hops = [26, 16, 22];
    const scale = Math.max(.6, Math.min(1.25, ms / 1500));
    let idx = 0;

    function hop() {
      if (mode !== "rejoice") return;
      // anticipation crouch (splay stance)
      sqy.v -= 2.4; sqx.v += 2.0;
      legFL.t = 14; legFR.t = -14; legBL.t = 10; legBR.t = -10;
      later(() => {
        if (mode !== "rejoice") return;
        // launch
        const h = hops[idx] * scale;
        vy = Math.sqrt(2 * GRAV * h);
        jumping = true;
        sqy.v += 3.6; sqx.v -= 2.8;                    // stretch upward
        earL.v -= 170; earR.v += 170;                  // extra whip up
        headR.v -= 70; headY.v -= 40;                  // chin leads
        // star-jump: front hooves up past horizontal, back legs out
        legFL.t = 100 + idx * 8; legFR.t = -100 - idx * 8;
        legBL.t = 18; legBR.t = -18;
      }, 105);
    }

    function landed() {
      if (idx >= hops.length - 1) {
        P.sparkles.style.opacity = 0;
        later(() => { if (mode === "rejoice") { mode = "idle"; P.blushes.forEach(b => b.style.opacity = .8); } }, 160);
      } else {
        idx++;
        later(hop, 70);
      }
    }

    hop();
    return landed;
  }

  /* ---------- SAD: heavy slump with slow ears ---------- */
  function sad(ms = 950) {
    clearPerfTimers();
    mode = "sad";
    setFace("sad");
    blink(true);
    P.sparkles.style.opacity = 0;
    P.sweat.style.opacity = 1;

    slump.t = -7;                       // sink
    earL.t = 44; earR.t = -44;          // ears droop
    headR.t = 13; headY.t = 4.5;        // head hangs
    legFL.t = -10; legFR.t = 10;        // feet tuck inward
    legBL.t = -7; legBR.t = 7;
    sqy.v -= 2.6; sqx.v += 2.1;         // sigh compress

    if (P.sweat.animate) try {
      P.sweat.animate(
        [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "translateY(3px)", offset: .5 }, { opacity: 0, transform: "translateY(12px)" }],
        { duration: ms, fill: "both" });
    } catch (e) {}

    later(() => {
      if (mode !== "sad") return;
      slump.t = 0; earL.t = 0; earR.t = 0; headR.t = 0; headY.t = 0;
      legFL.t = legFR.t = legBL.t = legBR.t = 0;
      setFace("happy");
      P.sweat.style.opacity = 0;
      mode = "idle";
    }, ms);
  }

  /* ---------- gaze ---------- */
  function lookAt(px, py) {
    const r = svg.getBoundingClientRect();
    if (!r.width || mode !== "idle") return;
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height * 0.38);
    const d = Math.max(1, Math.hypot(dx, dy));
    gazeX.t = Math.max(-2.6, Math.min(2.6, dx / d * 2.6));
    gazeY.t = Math.max(-1.8, Math.min(2.2, dy / d * 2.2));
    headR.t = Math.max(-3.5, Math.min(3.5, dx / d * 3.5)) * 0.6;
    clearTimeout(lookTimer);
    lookTimer = setTimeout(() => {
      gazeX.t = 0; gazeY.t = 0;
      if (mode === "idle") headR.t = 0;
    }, 750);
  }

  /* ---------- main loop ---------- */
  let prevVy = 0, last = performance.now(), blinkT = null, fidgetT = null;
  let rafId = 0, destroyed = false, lastFrameAt = last;

  function frame(now, synthetic) {
    lastFrameAt = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.033) dt = 0.033;

    const t = now / 1000;
    const inAir = jumping || mode === "rejoice";

    /* idle micro-motion targets */
    if (mode === "idle") {
      earL.t = 3 + Math.sin(t * 1.1) * 3;
      earR.t = -3 - Math.sin(t * 1.1 + 1.7) * 3;
      headR.t = Math.sin(t * 0.8) * 2 + (gazeX.t !== 0 ? headR.t * 0.5 : 0);
      headY.t = Math.sin(t * 0.5) * 1;
      legFL.t = Math.sin(t * 1.3) * 2.5;
      legFR.t = -Math.sin(t * 1.3 + 2) * 2.5;
      legBL.t = Math.sin(t * 0.9 + 1) * 1.5;
      legBR.t = -Math.sin(t * 0.9 + 2.4) * 1.5;
      lean.t = Math.sin(t * 0.6) * 1.5;
      gazeX.t *= 0.995; gazeY.t *= 0.995;
    }
    idleAmp += ((inAir ? 0 : 1) - idleAmp) * Math.min(1, dt * 8);

    /* integrate springs */
    function step(s, dt) {
      const a = -s.k * (s.x - s.t) - s.damp * s.v;
      s.v += a * dt;
      s.x += s.v * dt;
    }
    [sqx, sqy, earL, earR, headR, headY, legFL, legFR, legBL, legBR, lean, gazeX, gazeY, slump].forEach(s => step(s, dt));

    /* gravity / jump physics */
    if (jumping) {
      vy -= GRAV * dt;
      y += vy * dt;
      if (y <= 0 && vy < 0) {
        y = 0; vy = 0; jumping = false;
        sqy.v -= 6.2; sqx.v += 6.0;                 // squash-land
        lean.v += (Math.random() - .5) * 70;        // stagger
        earL.v += 150; earR.v -= 150;               // ears flop
        if (mode !== "sad") legFL.t = legFR.t = legBL.t = legBR.t = 0;  // legs back under
        headY.v += 55;
        if (mode === "rejoice" && onLand) onLand();
      }
    } else {
      y += (0 - y) * Math.min(1, dt * 10);          // settle to ground
    }

    /* inertia coupling: parts resist vertical acceleration */
    const ay = Math.max(-2500, Math.min(2500, (vy - prevVy) / Math.max(dt, 1e-4)));
    prevVy = vy;
    if (jumping) {
      earL.v += ay * 0.028;
      earR.v += ay * 0.028;
      headY.v += ay * 0.012;
    }

    /* ----- apply transforms (SVG attribute syntax = always valid) ----- */
    const breath = Math.sin(t * 2.2) * 1.1 * idleAmp;
    const yy = y + breath + slump.x;
    P.root.setAttribute("transform",
      `translate(60 118) translate(0 ${(-yy).toFixed(2)}) rotate(${lean.x.toFixed(2)}) scale(${sqx.x.toFixed(3)} ${sqy.x.toFixed(3)}) translate(-60 -118)`);
    P.head.setAttribute("transform",
      `rotate(${headR.x.toFixed(2)} 60 72) translate(${(Math.sin(t * .5) * 1.2 * idleAmp).toFixed(2)} ${headY.x.toFixed(2)})`);
    P.earL.setAttribute("transform", `rotate(${earL.x.toFixed(2)} 35 36)`);
    P.earR.setAttribute("transform", `rotate(${earR.x.toFixed(2)} 85 36)`);
    P.legFL.setAttribute("transform", `rotate(${legFL.x.toFixed(2)} 52.5 100)`);
    P.legFR.setAttribute("transform", `rotate(${legFR.x.toFixed(2)} 67.5 100)`);
    P.legBL.setAttribute("transform", `rotate(${legBL.x.toFixed(2)} 43.7 100)`);
    P.legBR.setAttribute("transform", `rotate(${legBR.x.toFixed(2)} 75.7 100)`);
    P.gazeL.style.transform = `translate(${gazeX.x.toFixed(2)}px, ${gazeY.x.toFixed(2)}px)`;
    P.gazeR.style.transform = `translate(${gazeX.x.toFixed(2)}px, ${gazeY.x.toFixed(2)}px)`;

    /* shadow follows altitude */
    const airT = Math.min(1, yy / 30);
    P.shadow.setAttribute("transform", `translate(60 120) scale(${(1 - airT * .35).toFixed(3)} 1) translate(-60 -120)`);
    P.shadow.setAttribute("opacity", (1 - airT * .5).toFixed(2));

    if (!synthetic) rafId = requestAnimationFrame(frame);
  }

  let onLand = null;

  /* fidgets: blinks, ear flicks, glances */
  function scheduleBlink() {
    blinkT = setTimeout(() => { if (mode !== "sad") blink(); scheduleBlink(); }, 2400 + Math.random() * 2800);
  }
  function scheduleFidget() {
    fidgetT = setTimeout(() => {
      if (mode === "idle") {
        const roll = Math.random();
        if (roll < .4) { (Math.random() < .5 ? earL : earR).v += (Math.random() < .5 ? 1 : -1) * 130; }
        else if (roll < .7) { gazeX.t = Math.random() * 5 - 2.5; gazeY.t = Math.random() * 3 - 1; setTimeout(() => { if (mode === "idle") { gazeX.t = 0; gazeY.t = 0; } }, 1400); }
        else blink(true);
      }
      scheduleFidget();
    }, 2600 + Math.random() * 3800);
  }

  rafId = requestAnimationFrame(frame);
  /* Watchdog: browsers suspend rAF in hidden/throttled tabs, which would
     freeze the rig mid-pose (and permanently stall performance timers).
     When rAF hasn't fired for 200ms, drive the physics in 33ms steps so
     the lamb keeps settling; at ~1/3 speed in background — fine. */
  const watchdog = setInterval(() => {
    if (destroyed) return;
    const now = performance.now();
    if (now - lastFrameAt < 200) return;
    let guard = 0;
    while (now - last > 33 && guard++ < 5) frame(last + 33, true);
  }, 100);
  scheduleBlink();
  scheduleFidget();

  return {
    el: container,
    mode: "alive",
    rejoice: (ms) => {
      const landed = rejoice(ms || 820);
      onLand = landed;
    },
    sad: (ms) => sad(ms || 950),
    lookAt,
    destroy: () => { destroyed = true; cancelAnimationFrame(rafId); clearInterval(watchdog); clearTimeout(blinkT); clearTimeout(fidgetT); clearTimeout(lookTimer); clearPerfTimers(); },
    dbg: () => ({ mode, y: +y.toFixed(1), earL: +earL.x.toFixed(1), earR: +earR.x.toFixed(1), head: +headR.x.toFixed(1), sqy: +sqy.x.toFixed(2), legFL: +legFL.x.toFixed(1), tt: { earL: earL.t, head: headR.t, slump: slump.t } })
  };
}
