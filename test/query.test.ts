import { describe, expect, it } from 'vitest';
import { buildQuery } from '../src';

describe('buildQuery', () => {
  it('encodes nested objects with bracket notation', () => {
    expect(
      buildQuery({
        info: { service: 'Standard', packages: { parcel: 1 } },
        recipient: { county: 'Bucuresti', locality: 'Bucuresti' },
      }),
    ).toBe(
      'info%5Bservice%5D=Standard&info%5Bpackages%5D%5Bparcel%5D=1&recipient%5Bcounty%5D=Bucuresti&recipient%5Blocality%5D=Bucuresti',
    );
  });

  it('repeats array entries using [] keys', () => {
    expect(buildQuery({ awbs: ['123', 456] })).toBe('awbs%5B%5D=123&awbs%5B%5D=456');
    expect(buildQuery({ 'awbs[]': ['123'] })).toBe('awbs%5B%5D=123');
  });

  it('skips undefined and null values', () => {
    expect(buildQuery({ a: undefined, b: null, c: 0, d: false })).toBe('c=0&d=false');
  });
});
