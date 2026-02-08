import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ClubChat from '@/components/ClubChat';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { Button } from '@/components/ui/button';
import { MessageCircle, Flame } from 'lucide-react';

const ChatPage = () => {
  const { data: clubs } = useClubs();
  const { data: vibeCounts } = useAllVibes();
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const selectedClub = clubs?.find(c => c.id === selectedClubId);

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Club Chat
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Select a club to join the conversation</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Club selector */}
          <div className="w-full lg:w-72 space-y-2 max-h-[30vh] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
            {clubs?.map(club => {
              const count = vibeCounts?.[club.id] || 0;
              return (
                <button
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  className={`w-full text-left p-3 rounded-lg glass transition-all hover:border-primary/30 ${
                    selectedClubId === club.id ? 'border-primary/50 neon-border' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{club.name}</span>
                    {count > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-primary">
                        <Flame className="w-3 h-3" />{count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{club.area}</p>
                </button>
              );
            })}
          </div>

          {/* Chat */}
          <div className="flex-1">
            {selectedClub ? (
              <ClubChat clubId={selectedClub.id} clubName={selectedClub.name} />
            ) : (
              <div className="glass rounded-xl flex items-center justify-center h-[400px]">
                <div className="text-center space-y-2">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Select a club to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
