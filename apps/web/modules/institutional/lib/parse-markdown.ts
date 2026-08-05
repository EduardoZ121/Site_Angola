export type MdBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'hr' };

/** Lightweight Markdown subset for institutional documents (headings, lists, tables, quotes). */
export function parseMarkdownDocument(md: string): MdBlock[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let i = 0;
  let para: string[] = [];

  const flush = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ').trim() });
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.trim() === '---') {
      flush();
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }
    if (line.startsWith('#')) {
      flush();
      const level = Math.min(line.match(/^#+/)?.[0].length ?? 1, 3) as 1 | 2 | 3;
      blocks.push({ type: `h${level}`, text: line.replace(/^#+\s*/, '').trim() });
      i += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      flush();
      const quote: string[] = [line.slice(2)];
      i += 1;
      while (i < lines.length && (lines[i] ?? '').startsWith('> ')) {
        quote.push((lines[i] ?? '').slice(2));
        i += 1;
      }
      blocks.push({ type: 'quote', text: quote.join(' ').trim() });
      continue;
    }
    if (line.startsWith('|') && line.includes('|', 1)) {
      flush();
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('|')) {
        const raw = (lines[i] ?? '').trim();
        if (/^\|[\s|:-]+\|$/.test(raw)) {
          i += 1;
          continue;
        }
        rows.push(
          raw
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim()),
        );
        i += 1;
      }
      if (rows.length) blocks.push({ type: 'table', rows });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^[-*]\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\d+\.\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }
    if (!line.trim()) {
      flush();
      i += 1;
      continue;
    }
    para.push(line.trim());
    i += 1;
  }
  flush();
  return blocks;
}
