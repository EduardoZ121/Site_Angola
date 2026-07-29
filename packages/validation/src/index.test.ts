import { describe, expect, it } from 'vitest';
import { permissionCodeSchema, roleCodeSchema } from './index';

describe('roleCodeSchema', () => {
  it('accepts official roles', () => {
    expect(roleCodeSchema.parse('client')).toBe('client');
    expect(roleCodeSchema.parse('patrimonial_partner')).toBe('patrimonial_partner');
  });
});

describe('permissionCodeSchema', () => {
  it('accepts dotted permission codes', () => {
    expect(permissionCodeSchema.parse('platform.access')).toBe('platform.access');
    expect(permissionCodeSchema.parse('admin.panel')).toBe('admin.panel');
  });

  it('rejects invalid codes', () => {
    expect(() => permissionCodeSchema.parse('Admin')).toThrow();
    expect(() => permissionCodeSchema.parse('solo')).toThrow();
  });
});
