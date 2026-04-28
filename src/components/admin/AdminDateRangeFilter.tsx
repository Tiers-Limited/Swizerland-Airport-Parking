'use client';

import { Button, Input, Select } from '@/components/ui';

export type AdminDateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export interface AdminDateRangeValue {
  fromDate: string;
  toDate: string;
  preset: AdminDateRangePreset;
}

export const adminDateRangeStorageKey = 'airport-parking-admin-date-range';

const presetLabels: Record<Exclude<AdminDateRangePreset, 'custom'>, string> = {
  today: 'Heute',
  yesterday: 'Gestern',
  thisWeek: 'Diese Woche',
  lastWeek: 'Letzte Woche',
  thisMonth: 'Dieser Monat',
  lastMonth: 'Letzter Monat',
};

function getZurichDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value || date.getFullYear());
  const month = Number(parts.find((part) => part.type === 'month')?.value || date.getMonth() + 1);
  const day = Number(parts.find((part) => part.type === 'day')?.value || date.getDate());

  return { year, month, day };
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDays(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function buildZurichDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getLast30DaysRange(baseDate = new Date()): AdminDateRangeValue {
  const { year, month, day } = getZurichDateParts(baseDate);
  const today = buildZurichDate(year, month, day);
  const start = shiftDays(today, -29);
  return {
    fromDate: toInputDate(start),
    toDate: toInputDate(today),
    preset: 'custom',
  };
}

export function getPresetRange(preset: Exclude<AdminDateRangePreset, 'custom'>, baseDate = new Date()): AdminDateRangeValue {
  const { year, month, day } = getZurichDateParts(baseDate);
  const today = buildZurichDate(year, month, day);

  if (preset === 'today') {
    const date = toInputDate(today);
    return { fromDate: date, toDate: date, preset };
  }

  if (preset === 'yesterday') {
    const date = shiftDays(today, -1);
    const input = toInputDate(date);
    return { fromDate: input, toDate: input, preset };
  }

  if (preset === 'thisWeek') {
    const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const start = shiftDays(today, -dayIndex);
    const end = shiftDays(start, 6);
    return { fromDate: toInputDate(start), toDate: toInputDate(end), preset };
  }

  if (preset === 'lastWeek') {
    const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const end = shiftDays(today, -dayIndex - 1);
    const start = shiftDays(end, -6);
    return { fromDate: toInputDate(start), toDate: toInputDate(end), preset };
  }

  if (preset === 'thisMonth') {
    const start = buildZurichDate(year, month, 1);
    const end = buildZurichDate(year, month + 1, 0);
    return { fromDate: toInputDate(start), toDate: toInputDate(end), preset };
  }

  const lastMonthDate = buildZurichDate(year, month, 1);
  const lastMonthEnd = shiftDays(lastMonthDate, -1);
  const lastMonthStart = buildZurichDate(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth() + 1, 1);
  return { fromDate: toInputDate(lastMonthStart), toDate: toInputDate(lastMonthEnd), preset };
}

export function formatAdminRangeLabel(range: Pick<AdminDateRangeValue, 'fromDate' | 'toDate'>) {
  if (!range.fromDate || !range.toDate) return 'Kein Zeitraum gewählt';

  const formatter = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const from = formatter.format(new Date(`${range.fromDate}T12:00:00`));
  const to = formatter.format(new Date(`${range.toDate}T12:00:00`));
  return `${from} – ${to}`;
}

export function loadStoredAdminRange(defaultRange: AdminDateRangeValue): AdminDateRangeValue {
  if (globalThis.window === undefined) return defaultRange;

  try {
    const raw = globalThis.window.sessionStorage.getItem(adminDateRangeStorageKey);
    if (!raw) return defaultRange;

    const parsed = JSON.parse(raw) as Partial<AdminDateRangeValue>;
    if (!parsed.fromDate || !parsed.toDate) return defaultRange;

    return {
      fromDate: parsed.fromDate,
      toDate: parsed.toDate,
      preset: parsed.preset || 'custom',
    };
  } catch {
    return defaultRange;
  }
}

export function storeAdminRange(range: AdminDateRangeValue) {
  if (globalThis.window === undefined) return;
  globalThis.window.sessionStorage.setItem(adminDateRangeStorageKey, JSON.stringify(range));
}

export function clearStoredAdminRange() {
  if (globalThis.window === undefined) return;
  globalThis.window.sessionStorage.removeItem(adminDateRangeStorageKey);
}

interface AdminDateRangeFilterProps {
  readonly value: AdminDateRangeValue;
  readonly onChange: (value: AdminDateRangeValue) => void;
  readonly onApply: () => void;
  readonly onReset: () => void;
}

export function AdminDateRangeFilter({ value, onChange, onApply, onReset }: AdminDateRangeFilterProps) {
  const presetOptions = [
    { value: 'today', label: presetLabels.today },
    { value: 'yesterday', label: presetLabels.yesterday },
    { value: 'thisWeek', label: presetLabels.thisWeek },
    { value: 'lastWeek', label: presetLabels.lastWeek },
    { value: 'thisMonth', label: presetLabels.thisMonth },
    { value: 'lastMonth', label: presetLabels.lastMonth },
    { value: 'custom', label: 'Benutzerdefiniert' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
        <Select
          label="Voreinstellung"
          value={value.preset}
          onChange={(preset) => {
            if (preset === 'custom') {
              onChange({ ...value, preset: 'custom' });
              return;
            }

            onChange(getPresetRange(preset as Exclude<AdminDateRangePreset, 'custom'>));
          }}
          options={presetOptions}
        />
        <Input
          label="Von"
          type="date"
          value={value.fromDate}
          onChange={(e) => onChange({ ...value, fromDate: e.target.value, preset: 'custom' })}
        />
        <Input
          label="Bis"
          type="date"
          value={value.toDate}
          onChange={(e) => onChange({ ...value, toDate: e.target.value, preset: 'custom' })}
        />
        <div className="flex gap-2 lg:justify-end">
          <Button type="button" variant="secondary" onClick={onReset} className="flex-1 lg:flex-none">
            Reset
          </Button>
          <Button type="button" onClick={onApply} className="flex-1 lg:flex-none">
            Apply
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetOptions.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => {
              if (preset.value === 'custom') {
                onChange({ ...value, preset: 'custom' });
                return;
              }

              onChange(getPresetRange(preset.value as Exclude<AdminDateRangePreset, 'custom'>));
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value.preset === preset.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}