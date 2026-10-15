import { GEN, type Problem } from './generators';
import { hash, mulberry32, randInt } from './rng';

/** Today's date as "YYYY-MM-DD" in local time. This is the daily puzzle's seed. */
export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole days since 1970-01-01 for a "YYYY-MM-DD" key, so dates can be subtracted. */
export function dayNum(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}

/** The puzzle number for a date. 2026-01-01 is No. 1. */
export function puzzleNo(key: string): number {
  return dayNum(key) - dayNum('2026-01-01') + 1;
}

/** The six daily problems for a date. Same date, same six problems, for everyone. */
export function buildDaily(key: string): Problem[] {
  const r = mulberry32(hash('carry:' + key));
  return [
    GEN.add(r, 2),
    GEN.sub(r, 2),
    GEN.mul(r, 1),
    GEN.pct(r, 2),
    GEN.special(r, randInt(r, 1, 2) as 1 | 2),
    r() < 0.5 ? GEN.mul(r, 3) : GEN.div(r, 3),
  ];
}
