import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Sparkles, MapPin, DollarSign, Megaphone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useCreateEvent, useRequestPromotion } from '@/hooks/usePromotions';
import { useClubs } from '@/hooks/useClubs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const EventsPage = () => {
  const { user } = useAuth();
  const { data: events } = useEvents();
  const { data: clubs } = useClubs();
  const createEvent = useCreateEvent();
  const requestPromotion = useRequestPromotion();

  const [form, setForm] = useState({ club_id: '', title: '', description: '', event_date: '', image_url: '' });
  const [boostForm, setBoostForm] = useState({ eventId: '', bankRef: '', amount: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showBoost, setShowBoost] = useState(false);

  const handleCreate = async () => {
    if (!form.club_id || !form.title || !form.event_date) { toast.error('Fill required fields'); return; }
    try {
      await createEvent.mutateAsync(form);
      setForm({ club_id: '', title: '', description: '', event_date: '', image_url: '' });
      setShowCreate(false);
      toast.success('Event created! 🎉');
    } catch { toast.error('Could not create event'); }
  };

  const handleBoost = async () => {
    if (!boostForm.eventId || !boostForm.bankRef) { toast.error('Fill required fields'); return; }
    try {
      await requestPromotion.mutateAsync({
        type: 'club_boost',
        target_id: boostForm.eventId,
        bank_reference: boostForm.bankRef,
        amount_cents: parseInt(boostForm.amount || '0') * 100,
      });
      setBoostForm({ eventId: '', bankRef: '', amount: '' });
      setShowBoost(false);
      toast.success('Boost request submitted! Admin will review after payment confirmation.');
    } catch { toast.error('Could not submit boost request'); }
  };

  const upcomingEvents = events?.filter(e => new Date(e.event_date) >= new Date()) || [];
  const pastEvents = events?.filter(e => new Date(e.event_date) < new Date()) || [];

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-secondary" /> Events & Promotions
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Promote events, boost clubs, get noticed.</p>
        </motion.div>

        {/* Actions */}
        {user && (
          <div className="flex gap-2 mb-6">
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground gap-1"><Plus className="w-4 h-4" /> Post Event</Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/50">
                <DialogHeader><DialogTitle className="text-foreground">Post an Event</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={form.club_id} onValueChange={v => setForm(f => ({ ...f, club_id: v }))}>
                    <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select club" /></SelectTrigger>
                    <SelectContent>{clubs?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" className="bg-muted/50 border-border/50" maxLength={60} />
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="bg-muted/50 border-border/50" maxLength={300} />
                  <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="bg-muted/50 border-border/50" />
                  <Button onClick={handleCreate} disabled={createEvent.isPending} className="w-full gradient-primary text-primary-foreground">Post Event</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showBoost} onOpenChange={setShowBoost}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-secondary/50 text-secondary gap-1"><Megaphone className="w-4 h-4" /> Boost</Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/50">
                <DialogHeader><DialogTitle className="text-foreground">Boost an Event</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground mb-3">Pay via bank transfer, then submit reference. Admin will approve after payment confirmation. Boosted events get highlighted borders & badges.</p>
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-foreground space-y-1">
                    <p className="font-semibold">Bank Details:</p>
                    <p>Bank: FNB</p>
                    <p>Account: 62XXXXXXXX</p>
                    <p>Branch: 250655</p>
                    <p>Reference: Your username</p>
                  </div>
                  <Select value={boostForm.eventId} onValueChange={v => setBoostForm(f => ({ ...f, eventId: v }))}>
                    <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select event to boost" /></SelectTrigger>
                    <SelectContent>
                      {events?.filter(e => e.promoter_id === user?.id).map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={boostForm.bankRef} onChange={e => setBoostForm(f => ({ ...f, bankRef: e.target.value }))} placeholder="Bank reference / proof" className="bg-muted/50 border-border/50" />
                  <Input type="number" value={boostForm.amount} onChange={e => setBoostForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (ZAR)" className="bg-muted/50 border-border/50" />
                  <Button onClick={handleBoost} disabled={requestPromotion.isPending} className="w-full gradient-secondary text-secondary-foreground">Submit Boost Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Upcoming */}
        <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Upcoming
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center mb-6">
            <p className="text-muted-foreground">No upcoming events. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass rounded-xl p-4 ${event.is_boosted ? 'border-secondary/50 neon-border-secondary' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-foreground truncate">{event.title}</h3>
                      {event.is_boosted && <Badge className="gradient-secondary text-secondary-foreground text-[10px]">BOOSTED 🔥</Badge>}
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{event.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.event_date), 'MMM d, yyyy · h:mm a')}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {(event as any).promoter?.username || 'Promoter'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pastEvents.length > 0 && (
          <>
            <h2 className="font-display font-semibold text-lg text-foreground mb-3 text-muted-foreground/70">Past Events</h2>
            <div className="space-y-2 opacity-60">
              {pastEvents.slice(0, 5).map(event => (
                <div key={event.id} className="glass rounded-lg p-3">
                  <p className="text-sm text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(event.event_date), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
