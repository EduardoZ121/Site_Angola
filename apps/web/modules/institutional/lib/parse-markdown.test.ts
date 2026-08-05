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
});
