export const BROADCAST_CHANNELS = [
  { id: 'live-clubs', label: '#Live-Clubs' },
  { id: 'johannesburg', label: '#Johannesburg' },
  { id: 'capetown', label: '#CapeTown' },
  { id: 'cities', label: '#Johannesburg / #CapeTown' },
  { id: 'amapiano', label: '#Amapiano & Deep House' },
  { id: 'global', label: '#Global-Vibes' },
] as const;

export const normalizeDoorWait = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 90 ? value : 0;

export const doorWaitLabel = (value: unknown): string => {
  const minutes = normalizeDoorWait(value);
  return minutes === 0 ? 'No wait' : `${minutes}-${minutes + 5} min`;
};
