/** biome-ignore-all lint/suspicious/noArrayIndexKey: dont care lol */
type NumericNoteTextProps = {
  text: string;
};

export function NumericNoteText({ text }: NumericNoteTextProps) {
  const parts = text.split(/(\d+)/);

  return (
    <>
      {parts.map((part, index) =>
        /\d+/.test(part) ? (
          <span key={`${part}-${index}`} className="font-numeric">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}
