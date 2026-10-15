import { describe, expect, it } from 'vitest';
import { GEN, type Level, type Topic, placeParts } from '../src/model/generators';
import { mulberry32 } from '../src/model/rng';

describe('placeParts', () => {
  it('returns an array of numbers', () => {
    expect(placeParts(420)).toEqual([400, 20]);
  });
  it('skips zero digits', () => {
    expect(placeParts(305)).toEqual([300, 5]);
  });
});
