export interface AdminDateRangeFilters {
  fromDate?: string;
  toDate?: string;
}

/**
 * Apply a date range using Europe/Zurich calendar boundaries.
 * The query builder is mutated in place and also returned for chaining.
 */
export function applyZurichDateRange(query: any, column: string, filters: AdminDateRangeFilters = {}) {
  if (filters.fromDate) {
    query.whereRaw(`${column} >= (?::date::timestamp AT TIME ZONE 'Europe/Zurich')`, [filters.fromDate]);
  }

  if (filters.toDate) {
    query.whereRaw(
      `${column} < (((?::date + INTERVAL '1 day')::timestamp) AT TIME ZONE 'Europe/Zurich')`,
      [filters.toDate]
    );
  }

  return query;
}