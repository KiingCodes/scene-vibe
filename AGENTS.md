# Architecture rules
- Night Replay video submissions use `night_replays`; preserve legacy nightly-summary columns for compatibility.
- Venue relations use `clubs` and moderation uses ownership plus `has_role`, never profile role fields, to keep permissions server-enforced.
- Replay uploads use a dedicated bucket and signed playback URLs when workspace policy prohibits public storage.