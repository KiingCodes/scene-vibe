import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Copy, LogOut, Vote, MapPin, Flame, Navigation } from 'lucide-react';
import CrewLocationMap from '@/components/CrewLocationMap';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useCrews, useCreateCrew, useJoinCrew, useLeaveCrew, useCrewMembers, useCrewVotes, useVoteClub } from '@/hooks/useCrews';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const CrewsPage = () => {
  const { user } = useAuth();
  const { data: crews } = useCrews();
  const createCrew = useCreateCrew();
  const joinCrew = useJoinCrew();
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCrew.mutateAsync({ name: newName.trim() });
      setNewName('');
      toast.success('Crew created! 🔥');
    } catch { toast.error('Could not create crew'); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinCrew.mutateAsync(joinCode.trim());
      setJoinCode('');
      toast.success('Joined crew! 🎉');
    } catch { toast.error('Invalid invite code'); }
  };

  if (!user) {
    return (
      <div className="relative isolate min-h-screen bg-[#0B0E14]">
        <Navbar />
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-20 z-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="relative z-10 pt-24 container mx-auto px-4 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Crews</h1>
          <p className="text-muted-foreground mb-6">Sign in to create or join a crew.</p>
          <Link to="/auth"><Button className="gradient-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-[#0B0E14]">
      <Navbar />
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-20 z-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[120px]" />
      <main className="relative z-10 container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Your Crews
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Squad up. Vote where to go. Pull up together.</p>
        </motion.div>

        {/* Create / Join */}
        <div className="flex gap-2 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold shadow-lg shadow-cyan-500/20 gap-1 hover:brightness-110"><Plus className="w-4 h-4" /> Create Crew</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl text-white">
              <DialogHeader><DialogTitle className="text-foreground">Create a Crew</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Crew name" className="bg-slate-900/80 text-white border-white/10 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" maxLength={30} />
                <Button onClick={handleCreate} disabled={createCrew.isPending} className="w-full gradient-primary text-primary-foreground">Create</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 gap-1"><Users className="w-4 h-4" /> Join Crew</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl text-white">
              <DialogHeader><DialogTitle className="text-foreground">Join a Crew</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter invite code" className="bg-slate-900/80 text-white border-white/10 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" />
                <Button onClick={handleJoin} disabled={joinCrew.isPending} className="w-full gradient-primary text-primary-foreground">Join</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Crew List */}
        {(!crews || crews.length === 0) ? (
          <div className="glass rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No crews yet. Create one or join with an invite code!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {crews.map(crew => (
              <motion.button
                key={crew.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedCrewId(selectedCrewId === crew.id ? null : crew.id)}
                className={`w-full text-left glass rounded-xl p-4 transition-all ${selectedCrewId === crew.id ? 'neon-border border-primary/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">{crew.name}</h3>
                  <span className="text-xs text-muted-foreground">{crew.description || ''}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Crew Detail */}
        {selectedCrewId && <CrewDetail crewId={selectedCrewId} />}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

const CrewDetail = ({ crewId }: { crewId: string }) => {
  const { data: members } = useCrewMembers(crewId);
  const { data: voteData } = useCrewVotes(crewId);
  const { data: clubs } = useClubs();
  const { data: vibeCounts } = useAllVibes();
  const voteClub = useVoteClub();
  const leaveCrew = useLeaveCrew();
  const { user } = useAuth();
  const [showVote, setShowVote] = useState(false);

  // Get crew info for invite code
  const { data: crews } = useCrews();
  const crew = crews?.find(c => c.id === crewId);

  const voteTally = voteData?.votes.reduce((acc, v) => {
    acc[v.club_id] = (acc[v.club_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topClub = Object.entries(voteTally).sort(([,a], [,b]) => b - a)[0];

  const handleVote = async (clubId: string) => {
    try {
      await voteClub.mutateAsync({ crewId, clubId });
      toast.success('Vote cast! 🗳️');
      setShowVote(false);
    } catch { toast.error('Could not vote'); }
  };

  const handleLeave = async () => {
    try {
      await leaveCrew.mutateAsync(crewId);
      toast.success('Left crew');
    } catch { toast.error('Could not leave'); }
  };

  const copyInvite = () => {
    if (crew?.invite_code) {
      navigator.clipboard.writeText(crew.invite_code);
      toast.success('Invite code copied!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-slate-900/70 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
      <h2 className="font-display font-bold text-xl bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
        {crew?.name}
      </h2>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={copyInvite} className="gap-1 bg-white/5 border border-white/15 hover:bg-white/10 text-white rounded-xl">
          <Copy className="w-3.5 h-3.5" /> Copy Invite Code
        </Button>
        <Button size="sm" onClick={() => setShowVote(!showVote)} className="gap-1 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold shadow-lg shadow-fuchsia-500/25 rounded-xl hover:brightness-110">
          <Vote className="w-3.5 h-3.5" /> Vote Where To Go
        </Button>
        <Button size="sm" variant="ghost" onClick={handleLeave} className="h-auto gap-1 px-2 py-1 text-red-400/80 hover:text-red-400 hover:bg-transparent text-xs font-medium">
          <LogOut className="w-3.5 h-3.5" /> Leave
        </Button>
      </div>

      {/* Members */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
        <h4 className="font-display font-semibold text-sm text-cyan-100/90 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]" />
          Members ({members?.length || 0})
        </h4>
        <div className="flex flex-wrap gap-2">
          {members?.map(m => (
            <span key={m.id} className={`inline-flex items-center gap-1.5 rounded-full text-xs ${m.role === 'leader' ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-semibold px-3 py-1' : 'bg-white/5 border border-white/10 text-white px-3 py-1 font-medium'}`}>
              {m.role !== 'leader' && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.65)]" />}
              {m.profile?.username || 'Anon'}
              {m.role === 'leader' && ' 👑'}
            </span>
          ))}
        </div>
      </div>

      {/* Vote Results */}
      {Object.keys(voteTally).length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2 flex items-center gap-1">
            <Vote className="w-4 h-4 text-secondary" /> Tonight's Vote
          </h4>
          <div className="space-y-2">
            {Object.entries(voteTally).sort(([,a], [,b]) => b - a).map(([clubId, count]) => (
              <div key={clubId} className={`flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 ${topClub?.[0] === clubId ? 'border border-primary/40 neon-border' : ''}`}>
                <Link to={`/club/${clubId}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {voteData?.clubs[clubId] || 'Unknown'}
                </Link>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Flame className="w-3 h-3" /> {count} vote{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote Picker */}
      {showVote && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-xl p-4">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2">Pick a club</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {clubs?.map(club => (
              <button
                key={club.id}
                onClick={() => handleVote(club.id)}
                className="w-full text-left flex items-center justify-between bg-muted/10 hover:bg-muted/30 rounded-lg px-3 py-2 transition-all"
              >
                <span className="text-sm text-foreground">{club.name}</span>
                <span className="text-xs text-muted-foreground">{club.area}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Live Location Map */}
      <CrewLocationMap crewId={crewId} />
    </motion.div>
  );
};

export default CrewsPage;
