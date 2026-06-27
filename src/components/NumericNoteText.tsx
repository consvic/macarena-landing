/** biome-ignore-all lint/suspicious/noArrayIndexKey: dont care lol */
type NumericNoteTextProps = {
  text: string;
};

export function NumericNoteText({ text }: NumericNoteTextProps) {
  const parts = text.split(/([^\p{L}\s]+)/gu).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => (
        <span
          key={`${part}-${index}`}
          className={/[^\p{L}\s]/u.test(part) ? "font-data" : undefined}
        >
          {part}
        </span>
      ))}
    </>
  );
}
