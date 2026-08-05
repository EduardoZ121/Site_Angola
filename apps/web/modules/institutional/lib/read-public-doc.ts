import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Read an institutional markdown document from apps/web/public/docs at build time. */
export function readPublicDoc(filename: string): string {
  return readFileSync(join(process.cwd(), 'public', 'docs', filename), 'utf8');
}
