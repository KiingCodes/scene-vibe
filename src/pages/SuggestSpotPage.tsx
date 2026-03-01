import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { z } from 'zod';

const spotSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  address: z.string().trim().min(1, 'Address is required').max(200),
  area: z.string().trim().min(1, 'Area is required').max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().trim().max(1000).optional(),
  genre: z.string().trim().max(50).optional(),
  capacity: z.string().trim().max(50).optional(),
  opening_hours: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  website: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(100).optional(),
  image_url: z.string().trim().max(500).optional(),
});

const SuggestSpotPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', area: '', lat: '', lng: '',
    description: '', genre: '', capacity: '', opening_hours: '',
    phone: '', website: '', instagram: '', image_url: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleAiSuggest = async () => {
    if (!form.name.trim() || !form.area.trim()) {
      toast.error('Enter a spot name and area first');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-spot-suggest', {
        body: { name: form.name.trim(), area: form.area.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const s = data.suggestion;
      if (s) {
        setForm(prev => ({
          ...prev,
          description: s.description || prev.description,
          genre: s.genre || prev.genre,
          capacity: s.capacity || prev.capacity,
          opening_hours: s.opening_hours || prev.opening_hours,
          address: s.address || prev.address,
          lat: s.lat?.toString() || prev.lat,
          lng: s.lng?.toString() || prev.lng,
        }));
        toast.success('✨ AI filled in suggested details!');
      }
    } catch {
      toast.error('AI suggestion failed. Try again later.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to suggest a spot!');
      return;
    }

    const parsed = spotSchema.safeParse({
      ...form,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      description: form.description || undefined,
      genre: form.genre || undefined,
      capacity: form.capacity || undefined,
      opening_hours: form.opening_hours || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      instagram: form.instagram || undefined,
      image_url: form.image_url || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('pending_clubs').insert({
        user_id: user.id,
        name: parsed.data.name,
        address: parsed.data.address,
        area: parsed.data.area,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        description: parsed.data.description || null,
        genre: parsed.data.genre || null,
        capacity: parsed.data.capacity || null,
        opening_hours: parsed.data.opening_hours || null,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
        instagram: parsed.data.instagram || null,
        image_url: parsed.data.image_url || null,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('🎉 Spot submitted! It will appear once approved.');
      navigate('/');
    } catch {
      toast.error('Could not submit. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-sm font-semibold mb-3">
              <MapPin className="w-4 h-4" />
              Suggest a Spot
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">Know a hidden gem?</h1>
            <p className="text-muted-foreground text-sm mt-1">Submit it and help the community discover new vibes.</p>
          </div>

          {!user ? (
            <div className="glass rounded-xl p-8 text-center space-y-3">
              <p className="text-muted-foreground">You need to be signed in to suggest a spot.</p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground">Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Spot Name *</Label>
                <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Club Pulse" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Input id="area" value={form.area} onChange={e => update('area', e.target.value)} placeholder="e.g. Downtown" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input id="genre" value={form.genre} onChange={e => update('genre', e.target.value)} placeholder="e.g. Hip-Hop" />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading || !form.name.trim() || !form.area.trim()}
                className="w-full gap-2 bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30 transition-all"
                variant="outline"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? 'AI is thinking...' : '✨ AI Auto-Fill Details'}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full street address" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude *</Label>
                  <Input id="lat" type="number" step="any" value={form.lat} onChange={e => update('lat', e.target.value)} placeholder="-33.9" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude *</Label>
                  <Input id="lng" type="number" step="any" value={form.lng} onChange={e => update('lng', e.target.value)} placeholder="18.4" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="What makes this spot special?" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" value={form.capacity} onChange={e => update('capacity', e.target.value)} placeholder="e.g. 500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Hours</Label>
                  <Input id="opening_hours" value={form.opening_hours} onChange={e => update('opening_hours', e.target.value)} placeholder="e.g. 9PM-4AM" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+27..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@handle" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" value={form.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://..." />
              </div>

              <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground gap-2">
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Spot'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">Your submission will be reviewed before going live.</p>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SuggestSpotPage;
