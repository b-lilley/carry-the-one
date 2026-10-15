/** Formats a number with thousands separators, e.g. 5200 → "5,200". */
export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}
