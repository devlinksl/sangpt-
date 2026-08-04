interface Heading {
  id: string;
  depth?: number;
  text?: string;
}

export const TOC = ({ headings }: { headings: Heading[] }) => {
  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Contents</p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: `${((h.depth ?? 1) - 1) * 12}px` }}
            className="text-sm text-foreground/80"
          >
            {h.text}
          </li>
        ))}
      </ul>
    </nav>
  );
};
