import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreateExperience } from '@/hooks/useExperiences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().min(1),
  area: z.string().trim().min(1).max(100),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  price_info: z.string().trim().max(80).optional(),
  registration_url: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().trim().max(100).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
});

const CATEGORIES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'popup', label: 'Pop-up' },
  { value: 'market', label: 'Market' },
  { value: 'food', label: 'Food spot' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'street_event', label: 'Street event' },
];

const SubmitExperiencePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = useCreateExperience();
  const [form, setForm] = useState({
    name: '', category: 'workshop', area: '', address: '', description: '',
    start_date: '', end_date: '', price_info: '',
    registration_url: '', website: '', instagram: '', image_url: '',
  });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to submit'); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }
    try {
      await create.mutateAsync({
        name: parsed.data.name,
        category: parsed.data.category,
        area: parsed.data.area,
        address: parsed.data.address || null,
        description: parsed.data.description || null,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        price_info: parsed.data.price_info || null,
        registration_url: parsed.data.registration_url || null,
        website: parsed.data.website || null,
        instagram: parsed.data.instagram || null,
        image_url: parsed.data.image_url || null,
      } as any);
      toast.success('🎉 Experience submitted for review!');
      navigate('/experiences');
    } catch {
      toast.error('Could not submit. Try again later.');
    }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/experiences" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4" /> Submit an Experience
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">Share what's happening</h1>
            <p className="text-muted-foreground text-sm mt-1">Workshops, pop-ups, markets, food spots & more.</p>
          </div>

          {!user ? (
            <div className="glass rounded-xl p-8 text-center space-y-3">
              <p className="text-muted-foreground">Sign in to submit an experience.</p>
              <Link to="/auth"><Button className="gradient-primary text-primary-foreground">Sign In</Button></Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="glass rounded-xl p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => update('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Input id="area" value={form.area} onChange={e => update('area', e.target.value)} placeholder="e.g. Braamfontein" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="What's it about?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Starts</Label>
                  <Input id="start_date" type="datetime-local" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Ends</Label>
                  <Input id="end_date" type="datetime-local" value={form.end_date} onChange={e => update('end_date', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price_info">Price</Label>
                  <Input id="price_info" value={form.price_info} onChange={e => update('price_info', e.target.value)} placeholder="Free / R150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@handle" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_url">Registration URL</Label>
                <Input id="registration_url" value={form.registration_url} onChange={e => update('registration_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" value={form.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://..." />
              </div>
              <Button type="submit" disabled={create.isPending} className="w-full gradient-primary text-primary-foreground gap-2">
                <Send className="w-4 h-4" />
                {create.isPending ? 'Submitting...' : 'Submit for review'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Submissions are reviewed before going live.</p>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SubmitExperiencePage;