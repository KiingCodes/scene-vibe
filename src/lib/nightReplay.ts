export const REPLAY_MAX_BYTES = 25 * 1024 * 1024;
export const REPLAY_TTL_SECONDS = 72 * 60 * 60;

export function validateReplayFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
  if (!extension || !types[extension] || (file.type && file.type !== types[extension])) {
    throw new Error('Choose an MP4, MOV, or WEBM video');
  }
  if (file.size > REPLAY_MAX_BYTES) throw new Error('Video must be 25 MB or smaller');
  return types[extension];
}

export const replayUploadPath = (userId: string, timestamp = Date.now()) => `replays/${userId}_${timestamp}.mp4`;

export const isReplayActive = (replay: { status: string; expires_at: string }, now = Date.now()) =>
  replay.status === 'approved' && new Date(replay.expires_at).getTime() > now;