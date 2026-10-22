import { describe, expect, it } from 'vitest';
import { cleanGoogleImageUrl } from '@/utils/cleanGoogleImageUrl';

describe('cleanGoogleImageUrl', () => {
  it('rewrites Google image URLs containing a stable AF1Qip slug', () => {
    expect(cleanGoogleImageUrl('https://lh5.googleusercontent.com/AF1QipExample-123=w800-h600-k-no'))
      .toBe('https://lh3.googleusercontent.com/AF1QipExample-123=s0');
  });

  it('leaves URLs without an AF1Qip slug unchanged', () => {
    const url = 'https://maps.example.com/photo?id=123';
    expect(cleanGoogleImageUrl(url)).toBe(url);
  });

  it('leaves non-Google image URLs unchanged', () => {
    const url = 'https://images.example.com/venue.jpg';
    expect(cleanGoogleImageUrl(url)).toBe(url);
  });

  it('leaves an empty URL unchanged', () => {
    expect(cleanGoogleImageUrl('')).toBe('');
  });
});
