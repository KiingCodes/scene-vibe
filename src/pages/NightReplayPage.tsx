import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Moon, Play, Share2, Sparkles, Upload, Video, X } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useClubs } from '@/hooks/useClubs';
import { useSubmitNightReplay, useVideos } from '@/hooks/useVideos';
import { toast } from 'sonner';

const NightReplayPage = () => {
  const { user } = useAuth();
  const { data: videos, isLoading } = useVideos();
  const { data: clubs } = useClubs();
  const submissionVenues = clubs?.filter(club => club.is_community_added !== true) ?? [];
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitReplay = useSubmitNightReplay();
  const navigate = useNavigate();

  const replays = videos?.filter(video => video.club_id) ?? [];
  const activeVideo = replays.find(video => video.id === activeVideoId);
  const activeVenue = clubs?.find(club => club.id === activeVideo?.club_id);

  useEffect(() => {
    if (!selectedVenueId && clubs?.length) {
      const firstSubmittableVenue = clubs.find(club => club.is_community_added !== true);
      if (firstSubmittableVenue) setSelectedVenueId(firstSubmittableVenue.id);
    }
  }, [clubs, selectedVenueId]);

  const validateFile = (file: File) => {
    setSelectedFile(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['mp4', 'mov'].includes(extension || '')) {
      toast.error('Choose an MP4 or MOV video');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be smaller than 100 MB');
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(video.duration) || video.duration >= 15) {
        toast.error('Highlight clips must be under 15 seconds');
        return;
      }
      if (video.videoHeight <= video.videoWidth) {
        toast.error('Please choose a vertical video');
        return;
      }
      setSelectedFile(file);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('Could not read this video file');
    };
    video.src = url;
  };

  const handleSubmitReplay = async () => {
    if (!user) {
      toast.error('Sign in to submit a highlight');
      navigate('/auth');
      return;
    }
    if (!selectedVenueId) {
      toast.error('Choose a venue for this highlight');
      return;
    }
    if (!selectedFile) {
      toast.error('Choose a vertical video under 15 seconds');
      return;
    }

    try {
      await submitReplay.mutateAsync({
        file: selectedFile,
        clubId: selectedVenueId,
        caption,
      });
      toast.success('Clip submitted! Once approved by the venue team, it will go live on Night Replay.', {
        className: 'border border-cyan-400/30 bg-slate-950/95 text-white shadow-xl',
      });
      setSelectedFile(null);
      setCaption('');
      setSubmitOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit this highlight');
    }
  };

  const shareToCrew = async () => {
    if (!activeVideo) return;
    try {
      await navigator.clipboard.writeText(activeVideo.video_url);
      setActiveVideoId(null);
      toast.success('Replay link copied. Paste it into your crew conversation.');
      navigate('/crews');
    } catch {
      toast.error('Could not copy the replay link');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 pb-10 pt-24">
        <div className="mb-4 flex justify-end">
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur-md hover:bg-white/20">
                <Upload className="mr-2 h-4 w-4" />
                Submit Highlight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-white">Submit Weekend Highlight</DialogTitle>
                <DialogDescription className="text-sm text-white/60">
                  Clips are reviewed before going live on Night Replay
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="replay-venue" className="text-sm font-medium text-white/85">Venue</label>
                  <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                    <SelectTrigger id="replay-venue" className="h-auto rounded-xl border border-white/15 bg-slate-900 p-3 text-white focus:ring-cyan-400/40">
                      <SelectValue placeholder="Choose a venue" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-950 text-white">
                      {submissionVenues.map(club => (
                        <SelectItem key={club.id} value={club.id} className="focus:bg-white/10 focus:text-white">
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!submissionVenues.length && <p className="text-xs text-amber-200/80">Venues are currently unavailable. Please try again shortly.</p>}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  className="sr-only"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) validateFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={event => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files[0];
                    if (file) validateFile(file);
                  }}
                  className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? 'border-cyan-300 bg-cyan-500/10' : 'border-cyan-500/40 bg-slate-900/50 hover:border-cyan-400'}`}
                >
                  <Video className="mx-auto mb-3 h-8 w-8 text-cyan-300" />
                  <span className="block text-sm font-semibold text-white">
                    {selectedFile ? selectedFile.name : 'Drop your highlight here or choose a video'}
                  </span>
                  <span className="mt-1 block text-xs text-white/50">Vertical MP4 or MOV · under 15 seconds · max 100 MB</span>
                </button>

                <div className="space-y-2">
                  <label htmlFor="replay-caption" className="text-sm font-medium text-white/85">Caption <span className="text-white/40">(optional)</span></label>
                  <Input
                    id="replay-caption"
                    value={caption}
                    onChange={event => setCaption(event.target.value)}
                    maxLength={120}
                    placeholder="Main stage energy at 1 AM 🪩"
                    className="rounded-xl border-white/15 bg-slate-900/80 text-white placeholder:text-white/35 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitReplay}
                  disabled={submitReplay.isPending || !submissionVenues.length}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 font-bold text-black shadow-lg shadow-cyan-500/20 hover:brightness-110"
                >
                  {submitReplay.isPending ? 'Submitting…' : 'Submit for Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Moon className="mx-auto h-9 w-9 text-fuchsia-300 drop-shadow-[0_0_16px_rgba(232,121,249,0.6)]" />
          <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-fuchsia-300">The weekend, rewound</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Night Replay</h1>
          <p className="mt-2 text-sm text-white/60">The clips, the crowds, the nights worth replaying.</p>
        </motion.header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[9/16] animate-pulse rounded-2xl border border-fuchsia-500/20 bg-slate-900/80" />
            ))}
          </div>
        ) : replays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-fuchsia-500/20 bg-black/40 px-6 py-14 text-center shadow-[0_0_60px_rgba(217,70,239,0.08)]"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10">
              <CalendarDays className="h-8 w-8 text-fuchsia-300" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">No replays just yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Weekend Replay drops every Monday at midnight. Check back soon for recap highlights from top SCENE venues!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {replays.map((replay, index) => {
              const venue = clubs?.find(club => club.id === replay.club_id);
              const venueName = venue?.name || replay.caption || 'SCENE Venue';
              return (
                <motion.button
                  key={replay.id}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  whileHover={{ y: -4, scale: 1.015 }}
                  onClick={() => setActiveVideoId(replay.id)}
                  className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-slate-900/80 text-left shadow-xl transition-colors hover:border-fuchsia-300/60"
                  aria-label={`Play Weekend Replay at ${venueName}`}
                >
                  {venue?.image_url ? (
                    <img src={venue.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950 via-slate-900 to-cyan-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/80" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {venue?.image_url && (
                        <img src={venue.image_url} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/30 object-cover" />
                      )}
                      <span className="truncate text-sm font-bold text-white drop-shadow">{venueName}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-fuchsia-600/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                      Weekend Replay
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-[0_0_35px_rgba(217,70,239,0.65)] backdrop-blur-md transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <span className="text-xs font-medium text-white/80">
                      {format(new Date(replay.created_at), 'EEEE, MMM d')}
                    </span>
                    <Sparkles className="h-4 w-4 text-fuchsia-200" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={!!activeVideo} onOpenChange={open => !open && setActiveVideoId(null)}>
        <DialogContent className="!fixed !left-0 !top-0 !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0 [&>button]:hidden">
          {activeVideo && (
            <div className="relative mx-auto h-full w-full max-w-md overflow-hidden bg-black">
              <DialogTitle className="sr-only">Weekend Replay at {activeVenue?.name || activeVideo.caption || 'SCENE Venue'}</DialogTitle>
              <video
                key={activeVideo.id}
                src={activeVideo.video_url}
                autoPlay
                controls
                playsInline
                className="h-full w-full object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-5 pb-12">
                <div className="pointer-events-auto flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {activeVenue?.image_url && (
                      <img src={activeVenue.image_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white/30 object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold text-white">{activeVenue?.name || activeVideo.caption || 'SCENE Venue'}</p>
                      <p className="text-xs text-white/65">
                        {format(new Date(activeVideo.created_at), 'EEEE')} Night · {format(new Date(activeVideo.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(null)}
                    aria-label="Close replay"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/15"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/90 via-black/65 to-transparent p-5 pt-16">
                {activeVideo.club_id && (
                  <Button asChild className="h-auto w-full bg-gradient-to-r from-[#FF6B4A] via-[#D946EF] to-[#06B6D4] px-4 py-2 font-bold text-white shadow-lg hover:brightness-110">
                    <Link to={`/club/${activeVideo.club_id}`} onClick={() => setActiveVideoId(null)}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Explore {activeVenue?.name || 'Tagged Venue'}
                    </Link>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={shareToCrew}
                  disabled={!user}
                  className="h-auto w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-50"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {user ? 'Share to Crew' : 'Sign in to share'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NightReplayPage;
