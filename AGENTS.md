# Project Agent Notes

## Typography

- Use the Macarena brand/display fonts for names, headings, flavor copy, and normal prose.
- Use `font-data` for emails, URLs, phone numbers, order IDs, dates, currency, quantities, percentages, and strings with symbols such as `@`, `+`, `-`, `/`, or many digits. The Coco Gothic glyphs for these characters are visually rough, so data-heavy text should use the cleaner Inter-backed data font.
- Apply `font-data` to the entire UI label when it contains numeric presentation text, for example `Precio 1/2 litro` or `Precio 1 litro`; styling only the value is not enough.
- `font-numeric` remains fine for purely numeric values, but prefer `font-data` when the string mixes letters with symbols or numbers.
