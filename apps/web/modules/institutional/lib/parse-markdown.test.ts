import { describe, expect, it } from 'vitest';
import { parseMarkdownDocument } from './parse-markdown';

describe('parseMarkdownDocument', () => {
  it('parses headings, lists and tables', () => {
    const blocks = parseMarkdownDocument(`# Título

## Secção

Texto **negrito**.

- um
- dois

| A | B |
| --- | --- |
| 1 | 2 |
`);
    expect(blocks.some((b) => b.type === 'h1')).toBe(true);
    expect(blocks.some((b) => b.type === 'h2')).toBe(true);
    expect(blocks.some((b) => b.type === 'ul')).toBe(true);
    expect(blocks.some((b) => b.type === 'table')).toBe(true);
  });

  it('parses fenced code blocks as pre (wireframes)', () => {
    const blocks = parseMarkdownDocument(`## Wireframe

\`\`\`
MODELO DE INTERFACE — exemplo conceptual
| KUTEKA |
\`\`\`
`);
    const pre = blocks.find((b) => b.type === 'pre');
    expect(pre).toBeTruthy();
    if (pre && pre.type === 'pre') {
      expect(pre.text).toContain('MODELO DE INTERFACE');
    }
  });
});
