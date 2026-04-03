import {
  ORDER_IMPORT_HEADERS,
  type OrderImportHeader,
} from "@/lib/admin/constants";

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

export function parseCsv(input: string): ParsedCsv {
  const normalized = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index] ?? "";
    const nextChar = normalized[index + 1] ?? "";

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      currentValue += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentValue.trim());
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter((row) =>
    row.some((value) => value.length > 0),
  );
  if (nonEmptyRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = nonEmptyRows;
  return {
    headers: headerRow,
    rows: dataRows,
  };
}

export function assertOrderImportHeaders(headers: string[]) {
  if (headers.length !== ORDER_IMPORT_HEADERS.length) {
    throw new Error(
      `Invalid header count. Expected ${ORDER_IMPORT_HEADERS.length} columns.`,
    );
  }

  ORDER_IMPORT_HEADERS.forEach((expectedHeader, index) => {
    const actual = headers[index]?.trim();
    if (actual !== expectedHeader) {
      throw new Error(
        `Invalid header at position ${index + 1}. Expected "${expectedHeader}".`,
      );
    }
  });
}

export function rowToOrderImportObject(row: string[]) {
  return ORDER_IMPORT_HEADERS.reduce(
    (accumulator, header, index) => {
      accumulator[header] = row[index] ?? "";
      return accumulator;
    },
    {} as Record<OrderImportHeader, string>,
  );
}
