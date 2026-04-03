import { MEXICO_CITY_UTC_OFFSET } from "@/lib/admin/constants";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ORDERED_AT_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

function parseDateParts(value: string) {
  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  return { year, month, day };
}

export function parseDateOnlyToRangeBoundary(
  value: string,
  boundary: "start" | "end",
): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const { year, month, day } = parseDateParts(value);
  const time = boundary === "start" ? "00:00:00" : "23:59:59";
  const parsed = new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${time}${MEXICO_CITY_UTC_OFFSET}`,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseOrderedAtLocal(value: string): Date | null {
  const match = ORDERED_AT_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00${MEXICO_CITY_UTC_OFFSET}`,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveAdminDateRange(
  dateFrom?: string,
  dateTo?: string,
  defaultDays = 30,
): DateRange {
  const endDate =
    parseDateOnlyToRangeBoundary(dateTo ?? "", "end") ?? new Date();
  const startDate =
    parseDateOnlyToRangeBoundary(dateFrom ?? "", "start") ??
    new Date(endDate.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  if (startDate > endDate) {
    return { startDate: endDate, endDate: startDate };
  }

  return { startDate, endDate };
}

export function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
