import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import CommunityChat from '@/components/CommunityChat';
import { MessageCircle } from 'lucide-react';

const ChatPage = () => {
  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Community Chat
          </h1>
          <p className="text-muted-foreground text-sm">One room. Everyone in the scene. Talk vibes, link up, share moments.</p>
        </motion.div>
        <CommunityChat />
      </main>
    </div>
  );
};

export default ChatPage;
