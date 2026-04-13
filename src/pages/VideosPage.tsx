import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Trash2, Eye, Clock, MapPin, Crown, Play, X, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useVideos, useUploadVideo, useDeleteVideo, useRecordVideoView } from '@/hooks/useVideos';
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

const VideosPage = () => {
  const { user } = useAuth();
  const { data: videos, isLoading } = useVideos();
  const { data: clubs } = useClubs();
  const uploadVideo = useUploadVideo();
  const deleteVideo = useDeleteVideo();
  const recordView = useRecordVideoView();
  const [caption, setCaption] = useState('');
  const [clubId, setClubId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    try {
      await deleteVideo.mutateAsync(id);
      toast.success('Video deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  const handlePlay = (videoId: string) => {
    setPlayingId(videoId);
    recordView.mutate(videoId);
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="font-display font-bold text-3xl text-foreground flex items-center justify-center gap-3">
            <Video className="w-8 h-8 text-primary" /> SCENE Videos
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Crown className="w-4 h-4 text-yellow-400" /> Premium feature — record & share your night
          </p>
        </motion.div>

        {/* Upload */}
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
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
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

        {/* Video Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl aspect-video animate-pulse" />
            ))}
          </div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos?.map(video => {
            const club = clubs?.find(c => c.id === video.club_id);
            const isOwner = user?.id === video.user_id;
            const profile = (video as any).profile;

            return (
              <motion.div key={video.id} variants={item} className="glass rounded-xl overflow-hidden group">
                {/* Video Player / Thumbnail */}
                <div className="relative aspect-video bg-black/50 cursor-pointer" onClick={() => handlePlay(video.id)}>
                  {playingId === video.id ? (
                    <video
                      src={video.video_url}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur-sm"
                      >
                        <Play className="w-6 h-6 text-primary-foreground ml-1" />
                      </motion.div>
                    </div>
                  )}

                  {/* Premium badge */}
                  {video.is_premium && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500/90 text-xs font-bold text-black flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Premium
                    </div>
                  )}

                  {/* Delete button for owner */}
                  {isOwner && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(video.id); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/80 flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5">
                  {video.caption && (
                    <p className="text-sm text-foreground font-medium line-clamp-2">{video.caption}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {profile?.username || 'Anon'}
                      </span>
                      {club && (
                        <Link to={`/club/${club.id}`} className="flex items-center gap-0.5 hover:text-primary transition-colors">
                          <MapPin className="w-3 h-3" /> {club.name}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {video.view_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Clock className="w-3 h-3" />
                    {format(new Date(video.created_at), 'MMM d, yyyy · h:mm a')}
                    <span className="ml-1">({formatDistanceToNow(new Date(video.created_at), { addSuffix: true })})</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
