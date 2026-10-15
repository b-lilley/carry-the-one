import { fmt } from './format';
import { type Rng, pick, randInt } from './rng';

/** Difficulty: 1 = Warm-up, 2 = Steady, 3 = Stretch. */
export type Level = 1 | 2 | 3;

/** The topics a generator exists for (also the practice-mode topic keys, besides 'mixed'). */
export type Topic = 'add' | 'sub' | 'mul' | 'div' | 'pct' | 'special';

/** The label shown on a problem. */
export type Category = 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Percent' | 'Shortcut';

/** One problem: the question shown, its answer, and the shortcut tip (HTML, answer in <b>). */
export interface Problem {
  cat: Category;
  q: string;
  a: number;
  tip: string;
}

/** Makes a random problem of one topic at the given level. */
export type Generator = (rng: Rng, level: Level) => Problem;

/* ---------- helpers ---------- */

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/** Splits a number into its nonzero place values: 452 → [400, 50, 2]. */
export function placeParts(n: number): number[] {
  const s = String(n),
    out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    if (d) out.push(d * 10 ** (s.length - 1 - i));
  }
  return out;
}

function stepwise(a: number, b: number, op: '+' | '−'): string {
  let run = a;
  const steps = placeParts(b).map((p) => {
    run = op === '+' ? run + p : run - p;
    return `${op} ${fmt(p)} → ${fmt(run)}`;
  });
  return `Start at ${fmt(a)}: ${steps.join(', ')}. Answer: <b>${fmt(run)}</b>.`;
}

/* ---------- tips ---------- */

function tipAdd(a: number, b: number): string {
  const o = b % 10;
  if (b < 100 && o >= 6) {
    const up = b + 10 - o;
    return `Round ${b} up to ${up}. ${fmt(a)} + ${up} = ${fmt(a + up)}, then take back the extra ${10 - o}: <b>${fmt(a + b)}</b>.`;
  }
  return `Add ${b} one place at a time. ` + stepwise(a, b, '+');
}

function tipSub(a: number, b: number): string {
  const o = b % 10;
  if (o >= 6) {
    const up = b + 10 - o;
    return `Round ${b} up to ${up}. ${fmt(a)} − ${up} = ${fmt(a - up)}, then add back the ${10 - o} you over-subtracted: <b>${fmt(a - b)}</b>.`;
  }
  return `Subtract ${b} one place at a time. ` + stepwise(a, b, '−');
}

function tipMul(split: number, other: number, splitFirst: boolean): string {
  const parts = placeParts(split);
  const lines = parts.map((p) =>
    splitFirst
      ? `${fmt(p)} × ${other} = ${fmt(p * other)}`
      : `${other} × ${fmt(p)} = ${fmt(p * other)}`,
  );
  return `Split ${split} into ${parts.map(fmt).join(' + ')}. ${lines.join(', ')}. Add the pieces: <b>${fmt(split * other)}</b>.`;
}

/** For each level, the percents asked and the easy pieces each one is built from. */
const PCT: Record<Level, Record<number, number[]>> = {
  1: { 10: [10], 20: [20], 25: [25], 50: [50] },
  2: { 5: [5], 15: [10, 5], 30: [20, 10], 40: [20, 20], 75: [50, 25] },
  3: { 12: [10, 2], 35: [25, 10], 45: [25, 20], 65: [50, 10, 5], 120: [100, 20] },
};

function pctLine(p: number, B: number): string {
  const v = (p * B) / 100;
  const lines: Record<number, string> = {
    100: `100% is the whole thing: ${fmt(v)}`,
    50: `50% is half: ${fmt(v)}`,
    25: `25% is a quarter: ${fmt(v)}`,
    20: `20% is a fifth, or double 10%: ${fmt(v)}`,
    10: `10% shifts the decimal one place: ${fmt(v)}`,
    5: `5% is half of 10% (${fmt(B / 10)}): ${fmt(v)}`,
    2: `2% is double 1% (${fmt(B / 100)}): ${fmt(v)}`,
    1: `1% is ${fmt(v)}`,
  };
  return lines[p];
}

/* ---------- shortcuts ---------- */

type SpecialName = 'x5' | 'x11' | 'sq5' | 'x25' | 'x99' | 'diff' | 'near' | 'x125';

const SPECIAL: Record<SpecialName, (r: Rng, L: Level) => Omit<Problem, 'cat'>> = {
  x5(r) {
    const a = randInt(r, 12, 249) * 2;
    return {
      q: `${a} × 5`,
      a: a * 5,
      tip: `× 5 is half of × 10. ${a} × 10 = ${fmt(a * 10)}, halved: <b>${fmt(a * 5)}</b>.`,
    };
  },
  x11(r) {
    let a: number;
    do {
      a = randInt(r, 12, 98);
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
    const n = randInt(r, 1, 9),
      x = n * 10 + 5;
    return {
      q: `${x}²`,
      a: x * x,
      tip: `To square a number ending in 5, take the digit before the 5 (${n}) and multiply it by one more than itself (${n + 1}): ${n} × ${n + 1} = ${n * (n + 1)}. Then put 25 on the end: ${n * (n + 1)} and 25 make <b>${fmt(x * x)}</b>.`,
    };
  },
  x25(r) {
    const a = 4 * randInt(r, 4, 99);
    return {
      q: `${a} × 25`,
      a: a * 25,
      tip: `× 25 is the same as ÷ 4, then × 100. ${a} ÷ 4 = ${a / 4}, and ${a / 4} × 100 = <b>${fmt(a * 25)}</b>.`,
    };
  },
  x99(r) {
    const a = randInt(r, 12, 89);
    return {
      q: `${a} × 99`,
      a: a * 99,
      tip: `× 99 is × 100, minus one more ${a}. ${fmt(a * 100)} − ${a} = <b>${fmt(a * 99)}</b>.`,
    };
  },
  diff(r, L) {
    const m = 10 * randInt(r, 2, 9),
      k = randInt(r, 1, L === 3 ? 9 : 4);
    return {
      q: `${m - k} × ${m + k}`,
      a: m * m - k * k,
      tip: `Both numbers sit ${k} away from ${m}, so the product is ${m}² − ${k}². ${fmt(m * m)} − ${k * k} = <b>${fmt(m * m - k * k)}</b>.`,
    };
  },
  near(r) {
    const b = pick(r, [50, 100]),
      k = randInt(r, 1, 4),
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
    const a = 8 * randInt(r, 2, 20);
    return {
      q: `${a} × 125`,
      a: a * 125,
      tip: `× 125 is ÷ 8, then × 1,000. ${a} ÷ 8 = ${a / 8}, and ${a / 8} × 1,000 = <b>${fmt(a * 125)}</b>.`,
    };
  },
};

const SPECIAL_BY_LEVEL: Record<Level, SpecialName[]> = {
  1: ['x5', 'x11', 'sq5'],
  2: ['x25', 'diff', 'x99'],
  3: ['near', 'x125', 'diff'],
};

/* ---------- generators ---------- */

export const GEN: Record<Topic, Generator> = {
  add(r, L) {
    let a: number, b: number;
    do {
      if (L === 1) {
        a = randInt(r, 23, 89);
        b = randInt(r, 14, 79);
      } else if (L === 2) {
        a = randInt(r, 120, 899);
        b = randInt(r, 23, 89);
      } else {
        a = randInt(r, 140, 899);
        b = randInt(r, 120, 799);
      }
    } while ((a % 10) + (b % 10) < 10);
    return { cat: 'Add', q: `${a} + ${b}`, a: a + b, tip: tipAdd(a, b) };
  },
  sub(r, L) {
    let a: number, b: number;
    do {
      if (L === 1) {
        a = randInt(r, 41, 98);
        b = randInt(r, 13, a - 10);
      } else if (L === 2) {
        a = randInt(r, 210, 980);
        b = randInt(r, 23, 99);
      } else {
        a = randInt(r, 410, 990);
        b = randInt(r, 120, a - 60);
      }
    } while (!(a % 10 < b % 10));
    return { cat: 'Subtract', q: `${a} − ${b}`, a: a - b, tip: tipSub(a, b) };
  },
  mul(r, L) {
    let a: number, b: number;
    if (L === 3) {
      do {
        a = randInt(r, 13, 49);
        b = randInt(r, 13, 39);
      } while (a % 10 === 0 || b % 10 === 0);
      return { cat: 'Multiply', q: `${a} × ${b}`, a: a * b, tip: tipMul(b, a, false) };
    }
    do {
      a = L === 1 ? randInt(r, 13, 98) : randInt(r, 112, 989);
      b = randInt(r, 3, 9);
    } while (a % 10 === 0);
    return { cat: 'Multiply', q: `${a} × ${b}`, a: a * b, tip: tipMul(a, b, true) };
  },
  div(r, L) {
    let d: number, q: number;
    do {
      if (L === 1) {
        d = randInt(r, 3, 9);
        q = randInt(r, 12, 29);
      } else if (L === 2) {
        d = randInt(r, 3, 9);
        q = randInt(r, 31, 99);
      } else {
        d = randInt(r, 12, 25);
        q = randInt(r, 12, 39);
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
    const B = req * randInt(r, Math.ceil(lo / req), Math.floor(hi / req)),
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
