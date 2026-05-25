const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse chart API dates (ISO, "Jan 21, 2026", "Jan 2026"). */
export function parseChartPointDate(value: string): Date | null {
  if (!value?.trim()) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime()) && /\d{4}/.test(value)) {
    return iso;
  }

  const tokens = value.replace(/,/g, "").trim().split(/\s+/);
  if (tokens.length < 2) return null;

  const monthIdx = MONTH_LABELS.indexOf(tokens[0]);
  if (monthIdx < 0) return null;

  const year = Number.parseInt(tokens[tokens.length - 1], 10);
  if (Number.isNaN(year)) return null;

  const dayToken = tokens.length >= 3 ? tokens[1] : "1";
  const day = Number.parseInt(dayToken, 10);
  const safeDay = Number.isNaN(day) ? 1 : day;

  return new Date(Date.UTC(year, monthIdx, safeDay));
}

export function formatChartMonthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export type MonthMetricMode = "average" | "sum" | "last";

/** Collapse daily (or finer) points into one row per calendar month. */
export function aggregateMetricsByMonth<T>(
  items: T[],
  getDate: (item: T) => string,
  getMetricValues: (item: T) => Record<string, number>,
  modes: Record<string, MonthMetricMode> = {},
): Array<{ name: string; [key: string]: string | number }> {
  const buckets = new Map<
    string,
    {
      name: string;
      sortKey: string;
      sums: Record<string, number>;
      counts: Record<string, number>;
      last: Record<string, number>;
      lastOrder: number;
    }
  >();

  let order = 0;

  for (const item of items) {
    const parsed = parseChartPointDate(getDate(item));
    if (!parsed) continue;

    const sortKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
    const name = formatChartMonthLabel(parsed);

    if (!buckets.has(sortKey)) {
      buckets.set(sortKey, { name, sortKey, sums: {}, counts: {}, last: {}, lastOrder: -1 });
    }

    const bucket = buckets.get(sortKey)!;
    for (const [key, value] of Object.entries(getMetricValues(item))) {
      if (typeof value !== "number" || Number.isNaN(value)) continue;
      bucket.sums[key] = (bucket.sums[key] ?? 0) + value;
      bucket.counts[key] = (bucket.counts[key] ?? 0) + 1;
      if (order >= bucket.lastOrder) {
        bucket.last[key] = value;
        bucket.lastOrder = order;
      }
    }
    order += 1;
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ name, sums, counts, last }) => {
      const row: { name: string; [key: string]: string | number } = { name };
      for (const key of Object.keys(sums)) {
        const mode = modes[key] ?? "average";
        const count = counts[key] ?? 0;
        if (mode === "sum") {
          row[key] = sums[key];
        } else if (mode === "last") {
          row[key] = last[key] ?? 0;
        } else {
          row[key] = count > 0 ? sums[key] / count : 0;
        }
      }
      return row;
    });
}
