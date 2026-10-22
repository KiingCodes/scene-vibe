export const cleanGoogleImageUrl = (url: string): string => {
  if (!url || (!url.includes('googleusercontent.com') && !url.includes('maps'))) return url;

  const match = url.match(/(AF1Qip[\w-]+)/);
  if (match?.[1]) {
    return `https://lh3.googleusercontent.com/${match[1]}=s0`;
  }

  return url;
};
