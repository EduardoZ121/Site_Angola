import { describe, expect, it } from 'vitest';
import { createAppError, toErrorResponse } from './errors';

describe('errors', () => {
  it('maps codes to status', () => {
    const err = createAppError('NOT_FOUND', 'Missing');
    expect(err.status).toBe(404);
    expect(toErrorResponse(err)).toEqual({
      error: { code: 'NOT_FOUND', message: 'Missing' },
    });
  });
});
