/**
 * Formats a number into a compact human-readable string.
 * e.g. 1_200 → "1.2K", 4_500_000 → "4.5M", 2_100_000_000 → "2.1B"
 * Numbers below 1,000 are returned as a locale string (no suffix).
 */
export function formatNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000)
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000)
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return value.toLocaleString();
}
