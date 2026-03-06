import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2, Image, Pin, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, useSendMessage, useDeleteMessage } from '@/hooks/useMessages';
import { useUserPoints, getLevelFromPoints } from '@/hooks/useGamification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const VERIFIED_LEVEL = 8;

// Common emojis for quick insert
const QUICK_EMOJIS = ['🔥', '🎉', '💃', '🎵', '😍', '🙌', '👀', '💀', '😂', '🥂', '🎧', '⚡'];

interface ClubChatProps {
  clubId: string;
  clubName: string;
}

const ClubChat = ({ clubId, clubName }: ClubChatProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(clubId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    try {
      await sendMessage.mutateAsync({ clubId, content: newMessage.trim() });
      setNewMessage('');
    } catch { /* handled */ }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId, clubId });
      toast.success('Message deleted');
    } catch { toast.error('Could not delete'); }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${clubId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('chat-media').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      const mediaType = file.type.startsWith('audio') ? '🎵 Audio' : '📸 Photo';
      await sendMessage.mutateAsync({ clubId, content: `${mediaType}: ${urlData.publicUrl}`, mediaUrl: urlData.publicUrl, messageType: file.type.startsWith('audio') ? 'audio' : 'image' });
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <div className="glass rounded-xl flex flex-col h-[400px]">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-display font-semibold text-sm text-foreground">💬 Chat — {clubName}</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && <p className="text-muted-foreground text-xs text-center">Loading...</p>}
        {messages?.length === 0 && !isLoading && (
          <p className="text-muted-foreground text-xs text-center py-8">No messages yet. Start the conversation!</p>
        )}
        {messages?.map((msg, i) => {
          const isOwn = msg.user_id === user?.id;
          const profile = msg.profiles as any;
          const mediaUrl = (msg as any).media_url;
          const msgType = (msg as any).message_type || 'text';

          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
              <div className={`relative max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                isOwn ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              } ${(msg as any).is_pinned ? 'ring-1 ring-secondary' : ''}`}>
                {!isOwn && (
                  <p className="text-xs font-semibold text-primary/80 mb-0.5 flex items-center gap-1">
                    {profile?.username || 'Anon'}
                  </p>
                )}
                {msgType === 'image' && mediaUrl ? (
                  <img src={mediaUrl} alt="Shared" className="rounded-lg max-h-40 max-w-full object-cover mb-1" />
                ) : msgType === 'audio' && mediaUrl ? (
                  <audio controls src={mediaUrl} className="max-w-full h-8" />
                ) : (
                  <p>{msg.content}</p>
                )}
                {(msg as any).is_pinned && <Pin className="w-3 h-3 text-secondary absolute -top-1 -right-1" />}
                {isOwn && (
                  <button onClick={() => handleDelete(msg.id)}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                    title="Delete message">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {user ? (
        <div className="border-t border-border/50">
          {showEmojis && (
            <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-border/30">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => addEmoji(e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="p-3 flex gap-2">
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="text-lg hover:scale-110 transition-transform shrink-0">😊</button>
            <input ref={fileRef} type="file" accept="image/*,audio/*" onChange={handleMediaUpload} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted-foreground hover:text-foreground shrink-0">
              <Image className="w-5 h-5" />
            </button>
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="What's the vibe like?" className="bg-muted/50 border-border/50 text-sm" />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending} className="gradient-primary text-primary-foreground shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="p-3 border-t border-border/50 text-center">
          <Link to="/auth" className="text-primary text-sm hover:underline">Sign in to chat</Link>
        </div>
      )}
    </div>
  );
};

export default ClubChat;
