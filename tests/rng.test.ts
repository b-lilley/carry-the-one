import { describe, expect, it } from 'vitest';
import { hash, mulberry32, pick, randInt } from '../src/model/rng';

describe('hash', () => {
  it('returns the same value it always has', () => {
    expect(hash('carry:2026-01-01')).toBe(3427237241);
  });

  it('returns a different number for every day of the year', () => {
    const values = new Set<number>();
    for (let day = 1; day <= 365; day++) {
      values.add(hash(`carry:day-${day}`));
    }
    expect(values.size).toBe(365);
  });
});

describe('mulberry32', () => {
  // Pinned values from the original game. If these change, every past and present
  // daily puzzle changes too, so a failure here means the generator was broken.
  it('produces the same sequence it always has', () => {
    expect(hash('carry:2026-01-01')).toBe(3427237241);
    const rng = mulberry32(hash('carry:2026-01-01'));
    expect([rng(), rng(), rng()]).toEqual([
      0.020567809231579304, 0.3298280017916113, 0.2205567522905767,
    ]);
  });

  it('returns numbers in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('randInt', () => {
  it('stays within the bounds and can return both ends', () => {
    const rng = mulberry32(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(randInt(rng, 1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});

describe('pick', () => {
  it('returns an element of the array', () => {
    const items = ['add', 'sub', 'mul'];
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) expect(items).toContain(pick(rng, items));
  });
});
