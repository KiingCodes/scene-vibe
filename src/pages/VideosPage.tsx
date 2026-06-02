import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Trash2, Eye, Clock, MapPin, Play, User, Heart, MessageCircle, Send, X, Camera, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoRecorder from '@/components/VideoRecorder';
import { useAuth } from '@/hooks/useAuth';
import { useVideos, useUploadVideo, useDeleteVideo, useRecordVideoView, useVideoLikes, useToggleLike, useVideoComments, usePostComment, useDeleteComment } from '@/hooks/useVideos';
import { useIsFollowing, useToggleFollow, useFollowCounts } from '@/hooks/useFollows';
import { useVideoReactions, useToggleReaction, REACTION_EMOJIS } from '@/hooks/useVideoReactions';
import { useClubs } from '@/hooks/useClubs';
import { SkeletonBlock } from '@/components/BrandedSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

const FollowButton = ({ targetId }: { targetId: string }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(targetId);
  const toggleFollow = useToggleFollow();
  if (!user || user.id === targetId) return null;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        toggleFollow.mutate(
          { targetId, isFollowing: !!isFollowing },
          {
            onSuccess: () => toast.success(isFollowing ? 'Unfollowed' : 'Following ✨'),
            onError: (err: any) => toast.error(err?.message || 'Could not update follow'),
          },
        );
      }}
      disabled={toggleFollow.isPending}
      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
        isFollowing
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'gradient-primary text-primary-foreground border-transparent'
      }`}
    >
      {isFollowing ? <><UserCheck className="w-3 h-3" /> Following</> : <><UserPlus className="w-3 h-3" /> Follow</>}
    </motion.button>
  );
};

const ReactionBar = ({ videoId }: { videoId: string }) => {
  const { user } = useAuth();
  const { data } = useVideoReactions(videoId);
  const toggle = useToggleReaction();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTION_EMOJIS.map((e) => {
        const count = data?.counts[e] || 0;
        const mine = data?.mine.has(e) || false;
        return (
          <motion.button
            key={e}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.12 }}
            onClick={() => {
              if (!user) return toast.error('Sign in to react');
              toggle.mutate({ videoId, emoji: e, on: mine });
            }}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
              mine
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-muted/20 border-border/30 text-muted-foreground hover:border-primary/30'
            }`}
          >
            <span className="text-sm leading-none">{e}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
};

const VideoCard = ({ video, clubs }: { video: any; clubs: any[] | undefined }) => {
  const { user } = useAuth();
  const deleteVideo = useDeleteVideo();
  const recordView = useRecordVideoView();
  const { data: likeData } = useVideoLikes(video.id);
  const toggleLike = useToggleLike();
  const { data: comments } = useVideoComments(video.id);
  const postComment = usePostComment();
  const deleteComment = useDeleteComment();
  const { data: followCounts } = useFollowCounts(video.user_id);
  const [playing, setPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const club = clubs?.find((c: any) => c.id === video.club_id);
  const isOwner = user?.id === video.user_id;
  const profile = video.profile;
  const username = profile?.username || 'Anon';
  const initials = username.slice(0, 2).toUpperCase();

  const handlePlay = () => {
    setPlaying(true);
    recordView.mutate(video.id);
  };

  const handleLike = () => {
    if (!user) return toast.error('Sign in to like videos');
    toggleLike.mutate({ videoId: video.id, liked: likeData?.userLiked || false });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    if (!user) return toast.error('Sign in to comment');
    postComment.mutate({ videoId: video.id, content: commentText.trim() });
    setCommentText('');
  };

  return (
    <motion.div
      variants={item}
      className="glass rounded-xl overflow-hidden group border border-border/30 hover:border-primary/40 transition-colors"
    >
      {/* Author header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/20">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="w-8 h-8 ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} alt={username} />
            <AvatarFallback className="bg-muted text-[10px] font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              @{username}
              <Sparkles className="w-3 h-3 text-secondary/70" />
            </p>
            <p className="text-[10px] text-muted-foreground">
              {followCounts?.followers || 0} followers · {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <FollowButton targetId={video.user_id} />
      </div>

      {/* Video Player / Thumbnail */}
      <div className="relative aspect-video bg-black/50 cursor-pointer" onClick={handlePlay}>
        {playing ? (
          <video src={video.video_url} controls autoPlay className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div whileHover={{ scale: 1.2 }} className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </motion.div>
          </div>
        )}
        {isOwner && (
          <button
            onClick={e => { e.stopPropagation(); deleteVideo.mutate(video.id); toast.success('Video deleted'); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/80 flex items-center justify-center hover:bg-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Info + Actions */}
      <div className="p-3 space-y-2">
        {video.caption && <p className="text-sm text-foreground font-medium line-clamp-2">{video.caption}</p>}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {club && (
              <Link to={`/club/${club.id}`} className="flex items-center gap-0.5 hover:text-primary transition-colors">
                <MapPin className="w-3 h-3" /> {club.name}
              </Link>
            )}
          </div>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.view_count}</span>
        </div>

        {/* Emoji reactions */}
        <ReactionBar videoId={video.id} />

        {/* Like & Comment buttons */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/20">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${likeData?.userLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${likeData?.userLiked ? 'fill-current' : ''}`} />
            {likeData?.count || video.like_count || 0}
          </motion.button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> {comments?.length || 0}
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {format(new Date(video.created_at), 'MMM d · h:mm a')}
          </span>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2 border-t border-border/20"
            >
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {comments?.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>}
                {comments?.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2 bg-muted/20 rounded-lg px-2 py-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-foreground">{c.profile?.username || 'Anon'}</span>
                      <p className="text-xs text-muted-foreground">{c.content}</p>
                    </div>
                    {user?.id === c.user_id && (
                      <button
                        onClick={() => deleteComment.mutate({ commentId: c.id, videoId: video.id })}
                        className="text-destructive/60 hover:text-destructive shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {user && (
                <div className="flex gap-1.5">
                  <Input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="h-8 text-xs bg-muted/30 border-border/30"
                    maxLength={300}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                  />
                  <Button size="sm" onClick={handleComment} className="h-8 w-8 p-0 gradient-primary">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const VideosPage = () => {
  const { user } = useAuth();
  const { data: videos, isLoading } = useVideos();
  const { data: clubs } = useClubs();
  const uploadVideo = useUploadVideo();
  const [caption, setCaption] = useState('');
  const [clubId, setClubId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return toast.error('Select a video file');
    if (!user) return toast.error('Sign in to post videos');
    if (file.size > 50 * 1024 * 1024) return toast.error('Max 50MB');
    try {
      await uploadVideo.mutateAsync({ file, clubId: clubId || undefined, caption });
      setFile(null);
      setCaption('');
      setClubId('');
      setOpen(false);
      toast.success('Video posted! 🎬');
    } catch {
      toast.error('Could not upload video');
    }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="font-display font-bold text-3xl text-foreground flex items-center justify-center gap-3">
            <Video className="w-8 h-8 text-primary" /> SCENE Videos
          </h1>
          <p className="text-muted-foreground mt-1">Record & share your night 🎬</p>
        </motion.div>

        {user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gradient-primary text-primary-foreground gap-2 py-6 text-base" onClick={() => setOpen(true)}>
                    <Camera className="w-5 h-5" /> Record
                  </Button>
                  <Button variant="outline" className="border-border/50 gap-2 py-6 text-base" onClick={() => setOpen(true)}>
                    <Upload className="w-5 h-5" /> Upload
                  </Button>
                </div>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 max-w-lg">
              <DialogHeader><DialogTitle className="text-foreground">Post Video</DialogTitle></DialogHeader>
              <Tabs defaultValue="record" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-3">
                  <TabsTrigger value="record"><Camera className="w-4 h-4 mr-1.5" /> Record</TabsTrigger>
                  <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-1.5" /> Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="record" className="space-y-3">
                  {!file ? (
                    <VideoRecorder onRecorded={(f) => setFile(f)} maxSeconds={30} />
                  ) : (
                    <div className="space-y-2">
                      <video src={URL.createObjectURL(file)} controls className="w-full rounded-lg" />
                      <Button variant="outline" size="sm" onClick={() => setFile(null)} className="w-full">Retake</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="upload" className="space-y-3">
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full border-border/50 text-muted-foreground gap-2">
                    <Video className="w-4 h-4" /> {file ? file.name : 'Select Video'}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="space-y-3 mt-3 pt-3 border-t border-border/30">
                <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-muted/50 border-border/50" maxLength={200} />
                <Select value={clubId} onValueChange={setClubId}>
                  <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Tag a club (optional)" /></SelectTrigger>
                  <SelectContent>
                    {clubs?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleUpload} disabled={uploadVideo.isPending || !file} className="w-full gradient-primary text-primary-foreground">
                  {uploadVideo.isPending ? 'Uploading...' : file ? 'Post Video' : 'Record or upload first'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl aspect-video animate-pulse" />
            ))}
          </div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos?.map(video => (
            <VideoCard key={video.id} video={video} clubs={clubs} />
          ))}
        </motion.div>

        {!isLoading && (!videos || videos.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No videos yet. Be the first to post!</p>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default VideosPage;
