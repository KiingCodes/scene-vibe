// Public VAPID key — safe to expose in client code.
// Paired with server-only VAPID_PRIVATE_KEY used by the send-push-digest edge function.
export const VAPID_PUBLIC_KEY =
  "BIstxDHLaiBuC1EbsU539Get2_urm9T9gybbU-e-C7nvsq1ls2WQ-dQkGv6TRZiRX8AlHPepSxKqjMyOYKTFZpg";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}