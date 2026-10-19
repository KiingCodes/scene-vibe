# Architecture rules
- Night Replay video submissions use `night_replays`; preserve legacy nightly-summary columns for compatibility.
- Venue broadcasts use the existing `messages` stream; database triggers derive verified sender identity from authorized venue ownership and atomically mirror announcements to prevent spoofing or partial saves.
- Door wait uses numeric `clubs.wait_time_minutes` and a shared normalization helper so persisted values and every dashboard fallback remain consistent.
- Venue relations use `clubs` and moderation uses ownership plus `has_role`, never profile role fields, to keep permissions server-enforced.
- Replay uploads use a dedicated bucket and signed playback URLs when workspace policy prohibits public storage.