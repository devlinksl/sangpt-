export interface MarkdownBlock {
  id: string;
  raw: string;
  type: 'heading' | 'code' | 'paragraph';
  depth?: number;
  text?: string;
}

/**
 * Splits markdown into stable top-level blocks so streaming updates
 * only re-render the last block instead of the whole document.
 */
export const splitMarkdownBlocks = (content: string): MarkdownBlock[] => {
  if (!content) return [];

  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];

  let buffer: string[] = [];
  let inFence = false;
  let index = 0;

  const flush = () => {
    const raw = buffer.join('\n');
    if (!raw.trim()) {
      buffer = [];
      return;
    }

    const headingMatch = raw.match(/^(#{1,6})\s+(.*)$/);

    blocks.push({
      id: `block-${index++}`,
      raw,
      type: raw.startsWith('```')
        ? 'code'
        : headingMatch
          ? 'heading'
          : 'paragraph',
      depth: headingMatch ? headingMatch[1].length : undefined,
      text: headingMatch ? headingMatch[2] : undefined,
    });

    buffer = [];
  };

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (inFence) {
        buffer.push(line);
        inFence = false;
        flush();
        continue;
      }
      flush();
      inFence = true;
      buffer.push(line);
      continue;
    }

    if (inFence) {
      buffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();

  return blocks;
};
