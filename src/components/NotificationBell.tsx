import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const iconFor = (type: string) => {
  switch (type) {
    case 'chat_message': return <MessageCircle className="w-3.5 h-3.5" />;
    case 'version_update': return <Sparkles className="w-3.5 h-3.5" />;
    default: return <Bell className="w-3.5 h-3.5" />;
  }
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotificationRead();
  const del = useDeleteNotification();

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 px-1.5 sm:px-2.5 text-muted-foreground hover:text-foreground"
          aria-label={`${unread} unread notifications`}
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50" align="end">
        <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
          </h4>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {!notifications?.length ? (
            <div className="text-center py-10 px-4">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`group px-3 py-2.5 border-b border-border/20 flex gap-2.5 transition-colors ${
                    n.read ? 'bg-transparent' : 'bg-primary/5'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                  }`}>
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => { markOne.mutate(n.id); setOpen(false); }}
                        className="block"
                      >
                        <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                        {n.body && <p className="text-[11px] text-muted-foreground truncate">{n.body}</p>}
                      </Link>
                    ) : (
                      <button
                        onClick={() => markOne.mutate(n.id)}
                        className="block text-left w-full"
                      >
                        <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                        {n.body && <p className="text-[11px] text-muted-foreground truncate">{n.body}</p>}
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => del.mutate(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;