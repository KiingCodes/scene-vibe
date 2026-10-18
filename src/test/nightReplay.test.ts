import { describe, expect, it } from 'vitest';
import { isReplayActive, replayUploadPath, REPLAY_TTL_SECONDS, validateReplayFile } from '@/lib/nightReplay';

describe('Night Replay rules', () => {
  it.each([['mp4', 'video/mp4'], ['mov', 'video/quicktime'], ['webm', 'video/webm']])('accepts %s', (ext, type) => {
    expect(validateReplayFile({ name: `clip.${ext}`, size: 1024, type })).toBe(type);
  });
  it('accepts 25 MB but rejects larger files', () => {
    expect(validateReplayFile({ name: 'clip.mp4', size: 25 * 1024 * 1024, type: 'video/mp4' })).toBe('video/mp4');
    expect(() => validateReplayFile({ name: 'clip.mp4', size: 25 * 1024 * 1024 + 1, type: 'video/mp4' })).toThrow();
  });
  it('rejects disguised non-video content', () => {
    expect(() => validateReplayFile({ name: 'clip.mp4', size: 100, type: 'text/plain' })).toThrow();
  });
  it('uses the requested naming convention', () => {
    expect(replayUploadPath('user-123', 123456)).toBe('replays/user-123_123456.mp4');
  });
  it('uses a 72 hour lifetime', () => expect(REPLAY_TTL_SECONDS).toBe(259200));
  it('only displays approved unexpired highlights', () => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    expect(isReplayActive({ status: 'approved', expires_at: '2026-10-21T12:00:00Z' }, now)).toBe(true);
    expect(isReplayActive({ status: 'pending', expires_at: '2026-10-21T12:00:00Z' }, now)).toBe(false);
    expect(isReplayActive({ status: 'rejected', expires_at: '2026-10-21T12:00:00Z' }, now)).toBe(false);
    expect(isReplayActive({ status: 'approved', expires_at: '2026-10-18T12:00:00Z' }, now)).toBe(false);
  });
});