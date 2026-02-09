import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, useSendMessage, useDeleteMessage } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    try {
      await sendMessage.mutateAsync({ clubId, content: newMessage.trim() });
      setNewMessage('');
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId, clubId });
      toast.success('Message deleted');
    } catch {
      toast.error('Could not delete message');
    }
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
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`relative max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                isOwn
                  ? 'gradient-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold text-primary/80 mb-0.5">
                    {profile?.username || 'Anon'}
                  </p>
                )}
                <p>{msg.content}</p>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {user ? (
        <form onSubmit={handleSend} className="p-3 border-t border-border/50 flex gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="What's the vibe like?"
            className="bg-muted/50 border-border/50 text-sm"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending} className="gradient-primary text-primary-foreground shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="p-3 border-t border-border/50 text-center">
          <Link to="/auth" className="text-primary text-sm hover:underline">Sign in to chat</Link>
        </div>
      )}
    </div>
  );
};

export default ClubChat;
