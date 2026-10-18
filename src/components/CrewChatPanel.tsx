import { useEffect, useRef, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Calculator,
  CircleDollarSign,
  MapPin,
  Paperclip,
  Play,
  Send,
  Vote,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useClubs } from '@/hooks/useClubs';
import { useCrewMessages, useSendCrewMessage } from '@/hooks/useCrewMessages';
import { useVideos } from '@/hooks/useVideos';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CrewMessageType } from '@/hooks/useCrewMessages';

type CommandDialog = 'location' | 'split' | 'attach' | null;

const CrewChatPanel = ({
  crewId,
  crewName,
  memberCount,
  onOpenVote,
}: {
  crewId: string;
  crewName: string;
  memberCount: number;
  onOpenVote: () => void;
}) => {
  const { user } = useAuth();
  const { data: messages, isLoading, isError } = useCrewMessages(crewId);
  const sendMessage = useSendCrewMessage();
  const { data: clubs, isLoading: venuesLoading, isError: venuesError } = useClubs();
  const { data: videos, isLoading: videosLoading, isError: videosError } = useVideos();
  const [draft, setDraft] = useState('');
  const [dialog, setDialog] = useState<CommandDialog>(null);
  const [splitTotal, setSplitTotal] = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const onlineChannelKey = `crew-presence-${crewId}`;

  useEffect(() => {
    if (!user || !crewId) {
      setActiveCount(0);
      return;
    }

    const presence = supabase.channel(onlineChannelKey, {
      config: { presence: { key: user.id } },
    });
    presence
      .on('presence', { event: 'sync' }, () => {
        setActiveCount(Object.keys(presence.presenceState()).length);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          const trackResult = await presence.track({ user_id: user.id });
          if (trackResult !== 'ok') toast.error('Could not update squad presence');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          toast.error('Squad presence connection was interrupted');
        }
      });

    return () => { void supabase.removeChannel(presence); };
  }, [crewId, onlineChannelKey, user]);

  useEffect(() => {
    if (!messages?.length || !streamRef.current) return;
    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  const postMessage = async (
    content: string,
    messageType: CrewMessageType = 'text',
    metadata: { replay_id?: string; video_url?: string; venue_id?: string } = {},
  ) => {
    try {
      await sendMessage.mutateAsync({ crewId, content, messageType, metadata });
      return true;
    } catch {
      toast.error('Could not send crew message');
      return false;
    }
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (await postMessage(content)) setDraft('');
  };

  const handleLocationDrop = async (venueId: string) => {
    const venue = clubs?.find(club => club.id === venueId);
    if (!venue) {
      toast.error('That venue is no longer available');
      return;
    }
    const sent = await postMessage(`is at ${venue.name}`, 'location_drop', { venue_id: venue.id });
    if (sent) setDialog(null);
  };

  const handleShareReplay = async (video: NonNullable<typeof videos>[number]) => {
    const sent = await postMessage(video.caption?.trim() || 'Shared a Night Replay highlight', 'replay_share', {
      replay_id: video.id,
      video_url: video.video_url,
      venue_id: video.club_id || undefined,
    });
    if (sent) setDialog(null);
  };

  const handleShareVenue = async (venueId: string) => {
    const venue = clubs?.find(club => club.id === venueId);
    if (!venue) {
      toast.error('That venue is no longer available');
      return;
    }
    const sent = await postMessage(`Shared ${venue.name}`, 'venue_card', { venue_id: venue.id });
    if (sent) setDialog(null);
  };

  const formatTotal = Number(splitTotal);
  const perPerson = Number.isFinite(formatTotal) && formatTotal > 0 && memberCount > 0
    ? formatTotal / memberCount
    : null;

  return (
    <section className="space-y-3 border-t border-white/10 pt-5" aria-label={`${crewName} chat`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Squad command</p>
          <h3 className="font-display text-lg font-bold text-white">{crewName}</h3>
          <p className="text-xs text-white/50">{activeCount} active now · {memberCount} squad member{memberCount === 1 ? '' : 's'}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-200 shadow-[0_0_16px_rgba(249,115,22,0.12)]">
          🔥 Squad Active Tonight
        </span>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Squad commands">
        <button
          type="button"
          onClick={onOpenVote}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          <Vote className="h-3.5 w-3.5 text-fuchsia-300" /> Live Vote
        </button>
        <button
          type="button"
          onClick={() => setDialog('location')}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          <MapPin className="h-3.5 w-3.5 text-cyan-300" /> Drop Location
        </button>
        <button
          type="button"
          onClick={() => setDialog('split')}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          <CircleDollarSign className="h-3.5 w-3.5 text-amber-300" /> Split VIP Table
        </button>
      </div>

      <div
        ref={streamRef}
        aria-live="polite"
        className="h-[450px] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl"
      >
        {isLoading && <p className="py-6 text-center text-sm text-white/50">Connecting to squad chat…</p>}
        {isError && <p role="alert" className="py-6 text-center text-sm text-red-300">Could not load crew chat. Please try again.</p>}
        {!isLoading && !isError && !messages?.length && (
          <p className="py-12 text-center text-sm text-white/45">Your squad channel is ready. Drop the first message.</p>
        )}
        {messages?.map(message => {
          const ownMessage = message.user_id === user?.id;
          const senderName = message.profile?.username || 'Squad member';
          const venue = message.metadata.venue_id ? clubs?.find(club => club.id === message.metadata.venue_id) : null;
          const replay = message.metadata.replay_id ? videos?.find(video => video.id === message.metadata.replay_id) : null;
          const time = format(new Date(message.created_at), 'h:mm a');

          return (
            <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
              <article className={`max-w-[88%] rounded-2xl px-4 py-2.5 shadow-md ${ownMessage ? 'rounded-tr-none bg-gradient-to-r from-cyan-500 to-blue-600 font-medium text-black' : 'rounded-tl-none border border-white/15 bg-white/10 text-white'}`}>
                {!ownMessage && (
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 text-[10px] font-bold uppercase text-fuchsia-200">
                      {senderName.slice(0, 1)}
                    </span>
                    <span className="text-xs font-semibold text-fuchsia-200">{senderName}</span>
                  </div>
                )}

                {message.message_type === 'replay_share' && (
                  <div className={`mb-2 overflow-hidden rounded-xl border ${ownMessage ? 'border-black/15' : 'border-white/10'}`}>
                    <div className="relative h-28 bg-slate-900">
                      {venue?.image_url && <img src={venue.image_url} alt="" className="h-full w-full object-cover opacity-75" />}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </span>
                      </span>
                    </div>
                    <div className={`p-2 ${ownMessage ? 'bg-black/10' : 'bg-black/20'}`}>
                      <p className="truncate text-xs font-semibold">{venue?.name || 'Night Replay'}</p>
                      {message.metadata.video_url && (
                        <a
                          href={message.metadata.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-xs font-bold underline underline-offset-2"
                        >
                          Watch Clip
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(message.message_type === 'location_drop' || message.message_type === 'venue_card') && venue && (
                  <div className={`mb-2 rounded-xl border p-3 ${ownMessage ? 'border-black/15 bg-black/10' : 'border-white/10 bg-black/20'}`}>
                    <p className="text-xs font-semibold">📍 {senderName} is at {venue.name}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold underline underline-offset-2">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer">
                        Navigate
                      </a>
                      <Link to={`/club/${venue.id}`}>View Spot</Link>
                    </div>
                  </div>
                )}

                {message.content && message.message_type !== 'text' && message.content !== venue?.name && (
                  <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                )}
                {message.message_type === 'text' && <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>}
                <time dateTime={message.created_at} className={`mt-1 block text-right text-[10px] ${ownMessage ? 'text-black/60' : 'text-white/45'}`}>
                  {time}
                </time>
              </article>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="sticky bottom-3 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => setDialog('attach')}
          aria-label="Attach a replay or venue"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-cyan-200"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <Input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Message your squad…"
          aria-label="Message your crew"
          className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-0"
          maxLength={1000}
          disabled={!user || sendMessage.isPending}
        />
        <Button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || !user || sendMessage.isPending}
          className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-r from-[#FF6B4A] to-[#D946EF] p-2.5 text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
          {dialog === 'location' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-white">Drop a venue pin</DialogTitle>
                <DialogDescription className="text-white/55">Share a venue with your squad without turning on live location sharing.</DialogDescription>
              </DialogHeader>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {venuesLoading && <p className="py-4 text-center text-sm text-white/50">Loading venues…</p>}
                {venuesError && <p role="alert" className="py-4 text-center text-sm text-red-300">Could not load venues.</p>}
                {clubs?.map(club => (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => handleLocationDrop(club.id)}
                    disabled={sendMessage.isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <span>{club.name}</span><MapPin className="h-4 w-4 text-cyan-300" />
                  </button>
                ))}
              </div>
            </>
          )}

          {dialog === 'attach' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-white">Share with your crew</DialogTitle>
                <DialogDescription className="text-white/55">Pick an approved Night Replay clip or a venue card.</DialogDescription>
              </DialogHeader>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {videosLoading && <p className="py-3 text-center text-sm text-white/50">Loading highlights…</p>}
                {videosError && <p role="alert" className="py-3 text-center text-sm text-red-300">Could not load highlights.</p>}
                {videos?.filter(video => video.club_id).map(video => {
                  const venue = clubs?.find(club => club.id === video.club_id);
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleShareReplay(video)}
                      disabled={sendMessage.isPending}
                      className="flex w-full items-center gap-3 rounded-xl border border-fuchsia-400/15 bg-white/5 p-3 text-left hover:bg-white/10 disabled:opacity-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
                        {venue?.image_url ? <img src={venue.image_url} alt="" className="h-full w-full object-cover" /> : <Play className="h-4 w-4 text-fuchsia-200" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{venue?.name || 'Night Replay'}</span>
                        <span className="block truncate text-xs text-white/50">{video.caption || 'Weekend highlight'}</span>
                      </span>
                    </button>
                  );
                })}
                {clubs?.map(club => (
                  <button
                    key={`venue-${club.id}`}
                    type="button"
                    onClick={() => handleShareVenue(club.id)}
                    disabled={sendMessage.isPending}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 disabled:opacity-50"
                  >
                    <MapPin className="h-5 w-5 text-cyan-300" />
                    <span className="text-sm font-semibold text-white">{club.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {dialog === 'split' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-white">Split VIP table</DialogTitle>
                <DialogDescription className="text-white/55">Estimate an even split across {memberCount} squad member{memberCount === 1 ? '' : 's'}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <label htmlFor={`split-total-${crewId}`} className="text-sm font-medium text-white/80">Total table cost</label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id={`split-total-${crewId}`}
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={splitTotal}
                    onChange={event => setSplitTotal(event.target.value)}
                    placeholder="Enter total"
                    className="rounded-xl border-white/15 bg-slate-900 pl-10 text-white"
                  />
                </div>
                {perPerson !== null && (
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-fuchsia-100/65">Each person pays</p>
                    <p className="mt-1 text-3xl font-black text-white">{perPerson.toFixed(2)}</p>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={async () => {
                    if (perPerson === null) return;
                    const sent = await postMessage(`VIP table split: ${formatTotal.toFixed(2)} across ${memberCount} members (${perPerson.toFixed(2)} each).`, 'text');
                    if (sent) setDialog(null);
                  }}
                  disabled={perPerson === null || sendMessage.isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#D946EF] font-bold text-white"
                >
                  Share split with squad
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CrewChatPanel;
