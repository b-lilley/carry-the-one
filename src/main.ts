// @ts-nocheck -- temporary: the code isn't typed yet. Remove this line in step 7 when adding types.
import './styles.css';

/* ---------- utilities ---------- */
const KEY = 'carry-the-one.v1';
const fmt = (n) => n.toLocaleString('en-US');
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayNum(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}
const puzzleNo = (key) => dayNum(key) - dayNum('2026-01-01') + 1;
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
};
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {}
};
let db = load();
db.history = db.history || {};

/* ---------- problem generators ---------- */
function placeParts(n) {
  const s = String(n),
    out = [];
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    if (d) out.push(d * 10 ** (s.length - 1 - i));
  }
  return out;
}
function stepwise(a, b, op) {
  let run = a;
  const steps = placeParts(b).map((p) => {
    run = op === '+' ? run + p : run - p;
    return `${op} ${fmt(p)} → ${fmt(run)}`;
  });
  return `Start at ${fmt(a)}: ${steps.join(', ')}. Answer: <b>${fmt(run)}</b>.`;
}

function tipAdd(a, b) {
  const o = b % 10;
  if (b < 100 && o >= 6) {
    const up = b + 10 - o;
    return `Round ${b} up to ${up}. ${fmt(a)} + ${up} = ${fmt(a + up)}, then take back the extra ${10 - o}: <b>${fmt(a + b)}</b>.`;
  }
  return `Add ${b} one place at a time. ` + stepwise(a, b, '+');
}
function tipSub(a, b) {
  const o = b % 10;
  if (o >= 6) {
    const up = b + 10 - o;
    return `Round ${b} up to ${up}. ${fmt(a)} − ${up} = ${fmt(a - up)}, then add back the ${10 - o} you over-subtracted: <b>${fmt(a - b)}</b>.`;
  }
  return `Subtract ${b} one place at a time. ` + stepwise(a, b, '−');
}
function tipMul(split, other, splitFirst) {
  const parts = placeParts(split);
  const lines = parts.map((p) =>
    splitFirst
      ? `${fmt(p)} × ${other} = ${fmt(p * other)}`
      : `${other} × ${fmt(p)} = ${fmt(p * other)}`,
  );
  return `Split ${split} into ${parts.map(fmt).join(' + ')}. ${lines.join(', ')}. Add the pieces: <b>${fmt(split * other)}</b>.`;
}

const PCT = {
  1: { 10: [10], 20: [20], 25: [25], 50: [50] },
  2: { 5: [5], 15: [10, 5], 30: [20, 10], 40: [20, 20], 75: [50, 25] },
  3: { 12: [10, 2], 35: [25, 10], 45: [25, 20], 65: [50, 10, 5], 120: [100, 20] },
};
function pctLine(p, B) {
  const v = (p * B) / 100;
  return {
    100: `100% is the whole thing: ${fmt(v)}`,
    50: `50% is half: ${fmt(v)}`,
    25: `25% is a quarter: ${fmt(v)}`,
    20: `20% is a fifth, or double 10%: ${fmt(v)}`,
    10: `10% shifts the decimal one place: ${fmt(v)}`,
    5: `5% is half of 10% (${fmt(B / 10)}): ${fmt(v)}`,
    2: `2% is double 1% (${fmt(B / 100)}): ${fmt(v)}`,
    1: `1% is ${fmt(v)}`,
  }[p];
}

const SPECIAL = {
  x5(r) {
    const a = ri(r, 12, 249) * 2;
    return {
      q: `${a} × 5`,
      a: a * 5,
      tip: `× 5 is half of × 10. ${a} × 10 = ${fmt(a * 10)}, halved: <b>${fmt(a * 5)}</b>.`,
    };
  },
  x11(r) {
    let a;
    do {
      a = ri(r, 12, 98);
    } while (a % 10 === 0);
    const t = Math.floor(a / 10),
      u = a % 10,
      s = t + u;
    return {
      q: `${a} × 11`,
      a: a * 11,
      tip:
        s < 10
          ? `For a 2-digit number × 11, pull its digits apart and put their sum in the middle: ${t} _ ${u}, with ${t} + ${u} = ${s} in the gap → <b>${fmt(a * 11)}</b>.`
          : `For a 2-digit number × 11, pull its digits apart and put their sum in the middle. ${t} + ${u} = ${s}, so write ${s % 10} in the gap and carry 1 onto the ${t}: <b>${fmt(a * 11)}</b>.`,
    };
  },
  sq5(r) {
    const n = ri(r, 1, 9),
      x = n * 10 + 5;
    return {
      q: `${x}²`,
      a: x * x,
      tip: `To square a number ending in 5, take the digit before the 5 (${n}) and multiply it by one more than itself (${n + 1}): ${n} × ${n + 1} = ${n * (n + 1)}. Then put 25 on the end: ${n * (n + 1)} and 25 make <b>${fmt(x * x)}</b>.`,
    };
  },
  x25(r) {
    const a = 4 * ri(r, 4, 99);
    return {
      q: `${a} × 25`,
      a: a * 25,
      tip: `× 25 is the same as ÷ 4, then × 100. ${a} ÷ 4 = ${a / 4} → <b>${fmt(a * 25)}</b>.`,
    };
  },
  x99(r) {
    const a = ri(r, 12, 89);
    return {
      q: `${a} × 99`,
      a: a * 99,
      tip: `× 99 is × 100, minus one more ${a}. ${fmt(a * 100)} − ${a} = <b>${fmt(a * 99)}</b>.`,
    };
  },
  diff(r, L) {
    const m = 10 * ri(r, 2, 9),
      k = ri(r, 1, L === 3 ? 9 : 4);
    return {
      q: `${m - k} × ${m + k}`,
      a: m * m - k * k,
      tip: `Both numbers sit ${k} away from ${m}, so the product is ${m}² − ${k}². ${fmt(m * m)} − ${k * k} = <b>${fmt(m * m - k * k)}</b>.`,
    };
  },
  near(r) {
    const b = pick(r, [50, 100]),
      k = ri(r, 1, 4),
      s = pick(r, [-1, 1]),
      n = b + s * k,
      sg = s < 0 ? '−' : '+';
    return {
      q: `${n}²`,
      a: n * n,
      tip: `${n} is ${b} ${sg} ${k}. Square it in parts: ${b}² ${sg} 2 × ${b} × ${k} + ${k}² = ${fmt(b * b)} ${sg} ${fmt(2 * b * k)} + ${k * k} = <b>${fmt(n * n)}</b>.`,
    };
  },
  x125(r) {
    const a = 8 * ri(r, 2, 20);
    return {
      q: `${a} × 125`,
      a: a * 125,
      tip: `× 125 is ÷ 8, then × 1,000. ${a} ÷ 8 = ${a / 8} → <b>${fmt(a * 125)}</b>.`,
    };
  },
};
const SPECIAL_BY_LEVEL = {
  1: ['x5', 'x11', 'sq5'],
  2: ['x25', 'diff', 'x99'],
  3: ['near', 'x125', 'diff'],
};

const GEN = {
  add(r, L) {
    let a, b;
    do {
      if (L === 1) {
        a = ri(r, 23, 89);
        b = ri(r, 14, 79);
      } else if (L === 2) {
        a = ri(r, 120, 899);
        b = ri(r, 23, 89);
      } else {
        a = ri(r, 140, 899);
        b = ri(r, 120, 799);
      }
    } while ((a % 10) + (b % 10) < 10);
    return { cat: 'Add', q: `${a} + ${b}`, a: a + b, tip: tipAdd(a, b) };
  },
  sub(r, L) {
    let a, b;
    do {
      if (L === 1) {
        a = ri(r, 41, 98);
        b = ri(r, 13, a - 10);
      } else if (L === 2) {
        a = ri(r, 210, 980);
        b = ri(r, 23, 99);
      } else {
        a = ri(r, 410, 990);
        b = ri(r, 120, a - 60);
      }
    } while (!(a % 10 < b % 10));
    return { cat: 'Subtract', q: `${a} − ${b}`, a: a - b, tip: tipSub(a, b) };
  },
  mul(r, L) {
    let a, b;
    if (L === 3) {
      do {
        a = ri(r, 13, 49);
        b = ri(r, 13, 39);
      } while (a % 10 === 0 || b % 10 === 0);
      return { cat: 'Multiply', q: `${a} × ${b}`, a: a * b, tip: tipMul(b, a, false) };
    }
    do {
      a = L === 1 ? ri(r, 13, 98) : ri(r, 112, 989);
      b = ri(r, 3, 9);
    } while (a % 10 === 0);
    return { cat: 'Multiply', q: `${a} × ${b}`, a: a * b, tip: tipMul(a, b, true) };
  },
  div(r, L) {
    let d, q;
    do {
      if (L === 1) {
        d = ri(r, 3, 9);
        q = ri(r, 12, 29);
      } else if (L === 2) {
        d = ri(r, 3, 9);
        q = ri(r, 31, 99);
      } else {
        d = ri(r, 12, 25);
        q = ri(r, 12, 39);
      }
    } while (q % 10 === 0);
    const n = d * q,
      T = q - (q % 10),
      o = q % 10;
    return {
      cat: 'Divide',
      q: `${fmt(n)} ÷ ${d}`,
      a: q,
      tip: `Break ${fmt(n)} into ${fmt(T * d)} + ${fmt(o * d)}, both multiples of ${d}. ${fmt(T * d)} ÷ ${d} = ${T} and ${o * d} ÷ ${d} = ${o}. Together: <b>${q}</b>.`,
    };
  },
  pct(r, L) {
    const p = +pick(r, Object.keys(PCT[L])),
      parts = PCT[L][p];
    const req = [10, ...parts].map((x) => 100 / gcd(x, 100)).reduce(lcm, 1);
    const [lo, hi] = { 1: [40, 400], 2: [60, 800], 3: [80, 900] }[L];
    const B = req * ri(r, Math.ceil(lo / req), Math.floor(hi / req)),
      ans = (p * B) / 100;
    const uniq = [...new Set(parts)],
      vals = parts.map((x) => (x * B) / 100);
    let tip = uniq.map((x) => pctLine(x, B)).join('. ') + '. ';
    tip +=
      parts.length > 1
        ? `${p}% = ${parts.map((x) => x + '%').join(' + ')}, so add them: ${vals.map(fmt).join(' + ')} = <b>${fmt(ans)}</b>.`
        : `That's the answer: <b>${fmt(ans)}</b>.`;
    return { cat: 'Percent', q: `${p}% of ${fmt(B)}`, a: ans, tip };
  },
  special(r, L) {
    const name = pick(r, SPECIAL_BY_LEVEL[L]);
    return { cat: 'Shortcut', ...SPECIAL[name](r, L) };
  },
};

function buildDaily(key) {
  const r = mulberry(hash('carry:' + key));
  return [
    GEN.add(r, 2),
    GEN.sub(r, 2),
    GEN.mul(r, 1),
    GEN.pct(r, 2),
    GEN.special(r, ri(r, 1, 2)),
    r() < 0.5 ? GEN.mul(r, 3) : GEN.div(r, 3),
  ];
}

/* ---------- state ---------- */
const CATS = [
  ['mixed', 'Mixed'],
  ['add', 'Add'],
  ['sub', 'Subtract'],
  ['mul', 'Multiply'],
  ['div', 'Divide'],
  ['pct', 'Percent'],
  ['special', 'Shortcuts'],
];
const LEVELS = [
  [1, 'Warm-up'],
  [2, 'Steady'],
  [3, 'Stretch'],
];
const S = {
  mode: 'daily',
  input: '',
  view: 0,
  daily: null,
  overlay: null,
  reveal: null,
  shake: false,
  msg: '',
  copied: '',
  practice: {
    cat: 'mixed',
    level: 1,
    round: null,
    t0: 0,
    sess: { n: 0, first: 0, streak: 0, time: 0 },
  },
};

function newRound(p) {
  return { p, guesses: [], status: 'play' };
}
function loadDaily() {
  const key = todayKey();
  let d = db.daily && db.daily.key === key ? db.daily : null;
  if (!d) {
    d = {
      key,
      rounds: buildDaily(key).map(newRound),
      idx: 0,
      elapsed: 0,
      started: false,
      done: false,
    };
    db.daily = d;
    save();
  }
  S.daily = d;
  S.view = d.idx;
  S.input = '';
  S.msg = '';
}
function newPractice() {
  const P = S.practice,
    cat =
      P.cat === 'mixed' ? pick(Math.random, ['add', 'sub', 'mul', 'div', 'pct', 'special']) : P.cat;
  P.round = newRound(GEN[cat](Math.random, P.level));
  P.t0 = Date.now();
  S.input = '';
  S.msg = '';
}

/* ---------- scoring ---------- */
function grade(g, a) {
  const res = Array(g.length).fill('miss'),
    left = {};
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) res[i] = 'hit';
    else left[a[i]] = (left[a[i]] || 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (res[i] !== 'hit' && left[g[i]] > 0) {
      res[i] = 'near';
      left[g[i]]--;
    }
  }
  return res;
}
const MARK = { 1: '🟩', 2: '🟨', 3: '🟧', x: '🟥' };
const tries = (R) => (R.status === 'won' ? R.guesses.length : 'x');
const points = (R) => (R.status === 'won' ? 4 - R.guesses.length : 0);

function streaks() {
  const keys = Object.keys(db.history).sort();
  let max = 0,
    run = 0,
    prev = null;
  for (const k of keys) {
    run = prev && dayNum(k) - dayNum(prev) === 1 ? run + 1 : 1;
    max = Math.max(max, run);
    prev = k;
  }
  const cur = prev && dayNum(todayKey()) - dayNum(prev) <= 1 ? run : 0;
  return { cur, max, played: keys.length };
}

/* ---------- actions ---------- */
function activeRound() {
  return S.mode === 'daily' ? S.daily.rounds[S.view] : S.practice.round;
}

function press(k) {
  if (S.overlay) return;
  if (S.mode === 'daily') {
    const d = S.daily;
    if (d.done && k !== 'enter') return;
    if (S.view !== d.idx) {
      S.view = d.idx;
    }
  }
  const R = activeRound();
  if (R.status !== 'play') {
    if (k === 'enter') next();
    render();
    return;
  }
  const len = String(R.p.a).length;
  if (/^\d$/.test(k)) {
    if (S.input.length < len) {
      S.input += k;
      S.msg = '';
    }
    if (S.mode === 'daily' && !S.daily.started) {
      S.daily.started = true;
      save();
    }
  } else if (k === 'back') {
    S.input = S.input.slice(0, -1);
  } else if (k === 'enter') {
    submit(R, len);
  }
  render();
}

function submit(R, len) {
  if (S.input.length < len) {
    S.msg = `The answer has ${len} digit${len > 1 ? 's' : ''}.`;
    S.shake = true;
    return;
  }
  const g = S.input,
    ans = R.p.a;
  R.guesses.push(g);
  S.input = '';
  S.reveal = { round: R, row: R.guesses.length - 1 };
  if (+g === ans) {
    R.status = 'won';
    S.msg = ['Clean. First try.', 'Got it on the second try.', 'Got it on the last try.'][
      R.guesses.length - 1
    ];
  } else if (R.guesses.length >= 3) {
    R.status = 'lost';
    S.msg = `The answer was <strong>${fmt(ans)}</strong>.`;
  } else {
    S.msg = +g < ans ? 'Too low. Go higher.' : 'Too high. Go lower.';
  }
  if (R.status !== 'play') finish(R);
  if (S.mode === 'daily') save();
}

function finish(R) {
  if (S.mode === 'daily') {
    const d = S.daily;
    if (d.idx === 5) {
      d.done = true;
      const score = d.rounds.reduce((s, x) => s + points(x), 0);
      db.history[d.key] = {
        score,
        time: d.elapsed,
        marks: d.rounds.map((x) => MARK[tries(x)]).join(''),
        clean: d.rounds.filter((x) => tries(x) === 1).length,
      };
    }
  } else {
    const s = S.practice.sess;
    s.n++;
    s.time += Math.round((Date.now() - S.practice.t0) / 1000);
    if (R.status === 'won' && R.guesses.length === 1) s.first++;
    s.streak = R.status === 'won' ? s.streak + 1 : 0;
    db.bestStreak = Math.max(db.bestStreak || 0, s.streak);
    save();
  }
}

function next() {
  if (S.mode === 'daily') {
    const d = S.daily;
    if (!d.done && d.idx < 5) {
      d.idx++;
      S.view = d.idx;
      S.msg = '';
      save();
    }
  } else newPractice();
}

/* ---------- rendering ---------- */
const app = document.getElementById('app');

function tilesRow(R, i, isLive) {
  const ans = String(R.p.a),
    len = ans.length,
    g = R.guesses[i];
  const flip = S.reveal && S.reveal.round === R && S.reveal.row === i;
  if (g !== undefined) {
    const res = grade(g, ans),
      diff = +g - R.p.a;
    const dir =
      diff === 0
        ? '<span class="dir" aria-label="correct"><b>✓</b></span>'
        : `<span class="dir" aria-label="${diff < 0 ? 'too low' : 'too high'}"><b>${diff < 0 ? '↑' : '↓'}</b>${diff < 0 ? 'low' : 'high'}</span>`;
    return `<div class="row${flip ? ' flip' : ''}"><span class="dir"></span>${[...g].map((c, j) => `<span class="tile ${res[j]}" style="animation-delay:${j * 90}ms">${c}</span>`).join('')}${dir}</div>`;
  }
  const typed = isLive ? S.input : '';
  const cls = isLive && S.shake ? ' shake' : '';
  return `<div class="row${cls}"><span class="dir"></span>${Array.from({ length: len }, (_, j) => `<span class="tile${typed[j] ? ' typed' : ''}">${typed[j] || ''}</span>`).join('')}<span class="dir"></span></div>`;
}

function sheet(R, { label, clock, isCurrent, nextLabel }) {
  const fin = R.status !== 'play';
  const rows = [0, 1, 2]
    .map((i) => tilesRow(R, i, isCurrent && !fin && i === R.guesses.length))
    .join('');
  const ansHtml = fin
    ? `<span class="ans${R.status === 'lost' ? ' lost' : ''}">${fmt(R.p.a)}</span>`
    : '?';
  return `<section class="sheet" aria-label="Current problem">
    <div class="eyebrow"><span>${label}</span>${clock != null ? `<span class="clock" id="clock">${clock}</span>` : ''}</div>
    <div class="expr">${R.p.q} <span class="eq">=</span> ${ansHtml}</div>
    <div class="rows">${rows}</div>
    <div class="msg" aria-live="polite">${isCurrent ? S.msg : ''}</div>
    ${fin ? `<div class="tip"><h3>The shortcut</h3><p>${R.p.tip}</p>${nextLabel ? `<button class="primary" data-act="next">${nextLabel}</button>` : ''}</div>` : ''}
  </section>`;
}

function keypad(R) {
  const st = {};
  if (R && R.status === 'play') {
    const a = String(R.p.a);
    const rank = { hit: 3, near: 2, miss: 1 };
    R.guesses.forEach((g) =>
      grade(g, a).forEach((v, i) => {
        const c = g[i];
        if (!st[c] || rank[v] > rank[st[c]]) st[c] = v;
      }),
    );
  }
  const k = (d) =>
    `<button class="key ${st[d] || ''}" data-key="${d}" aria-label="${d}">${d}</button>`;
  return `<div class="keypad" role="group" aria-label="Number pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k).join('')}
    <button class="key wide" data-key="back" aria-label="Delete">⌫ Delete</button>${k(0)}
    <button class="key wide enter" data-key="enter">Enter</button></div>`;
}

function doneCard() {
  const d = S.daily,
    h = db.history[d.key];
  if (!h) return '';
  const st = streaks();
  const now = new Date(),
    mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((mid - now) / 1000));
  const hh = Math.floor(left / 3600),
    mm = Math.floor((left % 3600) / 60);
  return `<section class="sheet done" aria-label="Today's result">
    <div class="eyebrow"><span>No. ${puzzleNo(d.key)} complete</span><span>Next in ${hh}h ${String(mm).padStart(2, '0')}m</span></div>
    <div class="big"><span class="score">${h.score}<small>/18</small></span><span class="marks">${h.marks}</span></div>
    <div class="facts"><span>Time <b>${mmss(h.time)}</b></span><span>First-try <b>${h.clean}/6</b></span><span>Streak <b>${st.cur}</b></span></div>
    <div class="btnrow"><button class="primary" data-act="share">${S.copied === 'ok' ? 'Copied' : 'Copy result'}</button><button class="ghost" data-act="mode" data-mode="practice">Keep practicing</button></div>
    ${S.copied === 'fail' ? `<textarea class="copyfallback" id="copyfallback" rows="2" readonly>${shareText()}</textarea>` : ''}
  </section>`;
}
function shareText() {
  const d = S.daily,
    h = db.history[d.key];
  return `Carry the One No. ${puzzleNo(d.key)}  ${h.score}/18  ${mmss(h.time)}\n${h.marks}`;
}

function renderDaily() {
  const d = S.daily,
    R = d.rounds[S.view],
    isCurrent = S.view === d.idx && !d.done;
  const ladder = `<ol class="ladder" aria-label="Today's six problems">${d.rounds
    .map((x, i) => {
      const t = x.status === 'play' ? '' : ' r' + tries(x);
      const cls = (i === d.idx && !d.done ? ' cur' : '') + (i === S.view ? ' viewing' : '') + t;
      const can = x.status !== 'play' || i === d.idx;
      return `<li><button class="${cls.trim()}" data-act="view" data-i="${i}" ${can ? '' : 'disabled'} aria-label="Problem ${i + 1}, ${x.p.cat}"><span class="n">${i + 1}</span><span class="c">${x.p.cat}</span></button></li>`;
    })
    .join('')}</ol>`;
  const label = `Problem ${S.view + 1} / 6 · ${R.p.cat}`;
  const nextLabel =
    S.view === d.idx && !d.done && R.status !== 'play'
      ? 'Next problem'
      : d.done || S.view !== d.idx
        ? null
        : null;
  const backLabel = S.view !== d.idx && !d.done ? 'Back to current problem' : null;
  return (
    (d.done ? doneCard() : '') +
    ladder +
    sheet(R, { label, clock: mmss(d.elapsed), isCurrent, nextLabel: nextLabel || backLabel }) +
    (d.done ? '' : keypad(isCurrent ? R : d.rounds[d.idx]))
  );
}

function renderPractice() {
  const P = S.practice,
    R = P.round,
    s = P.sess;
  const avg = s.n ? (s.time / s.n).toFixed(1) + 's' : '–';
  return (
    `<div class="controls">
    <div class="chips" role="group" aria-label="Topic">${CATS.map(([v, l]) => `<button class="chip" data-act="cat" data-v="${v}" aria-pressed="${P.cat === v}">${l}</button>`).join('')}</div>
    <div class="levels" role="group" aria-label="Difficulty">${LEVELS.map(([v, l]) => `<button class="chip" data-act="level" data-v="${v}" aria-pressed="${P.level === v}">${l}</button>`).join('')}</div>
  </div>
  <div class="sess"><div><b>${s.n}</b><span>Done</span></div><div><b>${s.n ? Math.round((s.first / s.n) * 100) + '%' : '–'}</b><span>First try</span></div><div><b>${s.streak}</b><span>Streak</span></div><div><b>${avg}</b><span>Avg time</span></div></div>` +
    sheet(R, {
      label: `Practice · ${R.p.cat} · ${LEVELS[P.level - 1][1]}`,
      clock: null,
      isCurrent: true,
      nextLabel: 'Next problem',
    }) +
    keypad(R)
  );
}

function overlayHtml() {
  if (S.overlay === 'help')
    return `<div class="overlay" data-act="close"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="ht">
    <div class="head"><h2 id="ht">How to play</h2><button class="ghost" data-act="close">Close</button></div>
    <p>Six problems a day, getting harder as you go. Solve each one in your head. You get three tries per problem, and the tiles tell you how close you were.</p>
    <div class="legend">
      <div class="row"><span class="tile hit">4</span><small>Right digit in the right place value.</small></div>
      <div class="row"><span class="tile near">7</span><small>That digit is in the answer, in another place.</small></div>
      <div class="row"><span class="tile miss">2</span><small>That digit isn't in the answer.</small></div>
      <div class="row"><span class="dir"><b>↑</b>low</span><small>Your guess was too low (↓ means too high).</small></div>
    </div>
    <p>The number of empty tiles tells you how many digits the answer has, which is a good sanity check on your estimate.</p>
    <p>After each problem you'll see a shortcut for doing it faster in your head. Practice mode lets you drill one topic at three difficulty levels.</p>
    <h4>Scoring</h4>
    <ul><li>🟩 first try: 3 points</li><li>🟨 second try: 2 points</li><li>🟧 third try: 1 point</li><li>🟥 missed: 0 points</li></ul>
  </div></div>`;
  if (S.overlay === 'stats') {
    const st = streaks(),
      hs = Object.values(db.history);
    const avg = hs.length ? (hs.reduce((a, h) => a + h.score, 0) / hs.length).toFixed(1) : '–';
    const dist = [0, 1, 2, 3, 4, 5, 6].map((n) => hs.filter((h) => h.clean === n).length),
      max = Math.max(1, ...dist);
    const todayClean = db.history[todayKey()]?.clean;
    return `<div class="overlay" data-act="close"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="st">
      <div class="head"><h2 id="st">Statistics</h2><button class="ghost" data-act="close">Close</button></div>
      <div class="statgrid"><div><b>${st.played}</b><span>Played</span></div><div><b>${avg}</b><span>Avg score</span></div><div><b>${st.cur}</b><span>Current streak</span></div><div><b>${st.max}</b><span>Best streak</span></div></div>
      <h4>First-try solves per day</h4>
      <div class="dist">${dist.map((c, n) => `<div class="bar"><span>${n}</span><span class="fill${todayClean === n ? ' today' : ''}" style="--w:${Math.max(6, (c / max) * 100)}%">${c}</span></div>`).join('')}</div>
      <p style="color:var(--muted);font-size:13px">Best practice streak: ${db.bestStreak || 0}. Stats are saved in this browser only.</p>
    </div></div>`;
  }
  return '';
}

function render() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  app.innerHTML = `<header>
      <div><h1>Carry the <span class="one">One<sup>1</sup></span></h1><div class="meta">No. ${puzzleNo(S.daily.key)} · ${dateStr}</div></div>
      <div class="hbtns"><button class="ghost" data-act="open" data-o="stats">Stats</button><button class="ghost" data-act="open" data-o="help" aria-label="How to play">?</button></div>
    </header>
    <nav class="modes" aria-label="Mode"><button data-act="mode" data-mode="daily" aria-pressed="${S.mode === 'daily'}">Daily six</button><button data-act="mode" data-mode="practice" aria-pressed="${S.mode === 'practice'}">Practice</button></nav>
    ${S.mode === 'daily' ? renderDaily() : renderPractice()}
    ${overlayHtml()}`;
  S.reveal = null;
  S.shake = false;
  const fb = document.getElementById('copyfallback');
  if (fb) {
    fb.focus();
    fb.select();
  }
}

/* ---------- events ---------- */
app.addEventListener('click', (e) => {
  const key = e.target.closest('[data-key]');
  if (key) {
    press(key.dataset.key);
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'close') {
    if (e.target === el || el.tagName === 'BUTTON') {
      S.overlay = null;
      render();
    }
    return;
  }
  if (act === 'open') {
    S.overlay = el.dataset.o;
  } else if (act === 'mode') {
    S.mode = el.dataset.mode;
    S.input = '';
    S.msg = '';
    if (S.mode === 'practice' && !S.practice.round) newPractice();
  } else if (act === 'view') {
    S.view = +el.dataset.i;
    S.input = S.view === S.daily.idx ? S.input : '';
  } else if (act === 'next') {
    if (S.mode === 'daily' && S.view !== S.daily.idx) {
      S.view = S.daily.idx;
    } else next();
  } else if (act === 'cat') {
    S.practice.cat = el.dataset.v;
    newPractice();
  } else if (act === 'level') {
    S.practice.level = +el.dataset.v;
    newPractice();
  } else if (act === 'share') {
    const t = shareText();
    try {
      navigator.clipboard.writeText(t).then(
        () => {
          S.copied = 'ok';
          render();
        },
        () => {
          S.copied = 'fail';
          render();
        },
      );
    } catch (err) {
      S.copied = 'fail';
    }
  }
  render();
});
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (S.overlay) {
    if (e.key === 'Escape') {
      S.overlay = null;
      render();
    }
    return;
  }
  if (/^\d$/.test(e.key)) {
    press(e.key);
    e.preventDefault();
  } else if (e.key === 'Backspace') {
    press('back');
    e.preventDefault();
  } else if (e.key === 'Enter') {
    if (
      document.activeElement &&
      document.activeElement.tagName === 'BUTTON' &&
      !document.activeElement.dataset.key
    )
      return;
    press('enter');
    e.preventDefault();
  }
});
setInterval(() => {
  if (todayKey() !== S.daily.key) {
    loadDaily();
    render();
    return;
  }
  const d = S.daily;
  if (
    S.mode === 'daily' &&
    d.started &&
    !d.done &&
    !S.overlay &&
    document.visibilityState === 'visible'
  ) {
    d.elapsed++;
    save();
    const c = document.getElementById('clock');
    if (c) c.textContent = mmss(d.elapsed);
  }
}, 1000);

loadDaily();
if (!Object.keys(db.history).length && !S.daily.started) S.overlay = null;
render();
