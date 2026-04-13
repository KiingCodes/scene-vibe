import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Trash2, Eye, Clock, MapPin, Play, User, Heart, MessageCircle, Send, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useVideos, useUploadVideo, useDeleteVideo, useRecordVideoView, useVideoLikes, useToggleLike, useVideoComments, usePostComment, useDeleteComment } from '@/hooks/useVideos';
import { useClubs } from '@/hooks/useClubs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const VideoCard = ({ video, clubs }: { video: any; clubs: any[] | undefined }) => {
  const { user } = useAuth();
  const deleteVideo = useDeleteVideo();
  const recordView = useRecordVideoView();
  const { data: likeData } = useVideoLikes(video.id);
  const toggleLike = useToggleLike();
  const { data: comments } = useVideoComments(video.id);
  const postComment = usePostComment();
  const deleteComment = useDeleteComment();
  const [playing, setPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const club = clubs?.find((c: any) => c.id === video.club_id);
  const isOwner = user?.id === video.user_id;
  const profile = video.profile;

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
    <motion.div variants={item} className="glass rounded-xl overflow-hidden group">
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
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {profile?.username || 'Anon'}</span>
            {club && (
              <Link to={`/club/${club.id}`} className="flex items-center gap-0.5 hover:text-primary transition-colors">
                <MapPin className="w-3 h-3" /> {club.name}
              </Link>
            )}
          </div>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.view_count}</span>
        </div>

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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return toast.error('Select a video file');
    if (!user) return toast.error('Sign in to post videos');
    try {
      await uploadVideo.mutateAsync({ file, clubId: clubId || undefined, caption });
      setFile(null);
      setCaption('');
      setClubId('');
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
          <Dialog>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mb-6">
                <Button className="w-full gradient-primary text-primary-foreground gap-2 py-6 text-base">
                  <Upload className="w-5 h-5" /> Post a Video
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="glass border-border/50">
              <DialogHeader><DialogTitle className="text-foreground">Post Video</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full border-border/50 text-muted-foreground gap-2">
                  <Video className="w-4 h-4" /> {file ? file.name : 'Select Video'}
                </Button>
                <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-muted/50 border-border/50" maxLength={200} />
                <Select value={clubId} onValueChange={setClubId}>
                  <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Tag a club (optional)" /></SelectTrigger>
                  <SelectContent>
                    {clubs?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleUpload} disabled={uploadVideo.isPending || !file} className="w-full gradient-primary text-primary-foreground">
                  {uploadVideo.isPending ? 'Uploading...' : 'Post'}
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
