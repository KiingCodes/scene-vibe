import { useState } from 'react';
import { Building2, Check, X, MapPin, Phone, Mail, FileText, ShieldCheck, Loader2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVenueClaims, useClaimDocumentUrl, useModerateClaim, type VenueClaim } from '@/hooks/useVenueClaims';

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  in_review: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const STAGES = ['Business Info', 'Geofence', 'Verification'];

const DocumentLightbox = ({ path, name, onClose }: { path: string; name?: string | null; onClose: () => void }) => {
  const { data: url, isLoading, error } = useClaimDocumentUrl(path);
  const isPdf = (name || path).toLowerCase().endsWith('.pdf');
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">{name || 'Proof of ownership'}</DialogTitle>
          <DialogDescription>Private document — signed link expires in 5 minutes.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl overflow-hidden border border-border/50 bg-black/40 min-h-[320px] flex items-center justify-center">
          {isLoading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
          {error && <p className="text-sm text-destructive px-4 text-center">Could not load this document.</p>}
          {url && (isPdf
            ? <iframe src={url} title={name || 'Claim document'} className="w-full h-[70vh]" />
            : <img src={url} alt={name || 'Venue ownership document'} className="max-h-[70vh] w-auto object-contain" />)}
        </div>
        {url && (
          <DialogFooter>
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Open in new tab</Button>
            </a>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ClaimCard = ({ claim }: { claim: VenueClaim }) => {
  const moderate = useModerateClaim();
  const [note, setNote] = useState('');
  const [showDoc, setShowDoc] = useState(false);

  const act = async (status: 'approved' | 'rejected' | 'in_review') => {
    try {
      await moderate.mutateAsync({ id: claim.id, status, note: note || undefined });
      toast.success(`Claim ${status.replace('_', ' ')}`);
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="glass rounded-2xl p-4 border border-border/40 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/15 border border-primary/25"><Building2 className="w-4 h-4 text-primary" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-foreground truncate">{claim.venue_name}</h3>
            <Badge className={`text-[10px] uppercase border ${STATUS_TONE[claim.status] || STATUS_TONE.draft}`}>{claim.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {claim.legal_name || 'No legal entity'} · updated {formatDistanceToNow(new Date(claim.updated_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Stage tracker */}
      <ol className="flex items-center gap-2" aria-label="Onboarding stages">
        {STAGES.map((s, i) => {
          const done = claim.step > i + 1 || claim.status === 'approved';
          const active = claim.step === i + 1;
          return (
            <li key={s} className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`w-5 h-5 shrink-0 rounded-full grid place-items-center text-[10px] font-bold border ${
                done ? 'bg-primary text-primary-foreground border-primary'
                  : active ? 'bg-primary/20 text-primary border-primary' : 'bg-muted text-muted-foreground border-border'}`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={`text-[10px] uppercase tracking-wider truncate ${active ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5" /> {claim.email || '—'}</span>
        <span className="flex items-center gap-1.5 truncate"><Phone className="w-3.5 h-3.5" /> {claim.phone || '—'} {claim.otp_verified && <Check className="w-3 h-3 text-emerald-400" />}</span>
        <span className="flex items-center gap-1.5 truncate col-span-full"><MapPin className="w-3.5 h-3.5" /> {claim.address || '—'}
          {claim.geofence_verified && <span className="text-emerald-400">· geofenced {claim.radius_m}m</span>}
        </span>
      </div>

      {!!claim.tags?.length && (
        <div className="flex flex-wrap gap-1">
          {claim.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-border/50 text-[10px] text-muted-foreground">{t}</span>)}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {claim.document_url ? (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowDoc(true)}>
            <FileText className="w-3.5 h-3.5" /> View document
          </Button>
        ) : (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> No document uploaded</span>
        )}
        {claim.otp_verified && (
          <span className="text-[11px] text-emerald-300 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Phone verified</span>
        )}
      </div>

      {claim.review_note && <p className="text-[11px] text-muted-foreground italic">Note: {claim.review_note}</p>}

      {claim.status !== 'draft' && (
        <div className="space-y-2 pt-1 border-t border-border/40">
          <label className="sr-only" htmlFor={`note-${claim.id}`}>Review note</label>
          <Textarea
            id={`note-${claim.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional review note sent with the decision…"
            className="min-h-[60px] text-xs"
          />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => act('approved')} disabled={moderate.isPending} className="gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30">
              <Check className="w-3.5 h-3.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => act('in_review')} disabled={moderate.isPending} className="gap-1.5 text-xs">
              Mark in review
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act('rejected')} disabled={moderate.isPending} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Reject
            </Button>
          </div>
        </div>
      )}

      {showDoc && claim.document_url && (
        <DocumentLightbox path={claim.document_url} name={claim.document_name} onClose={() => setShowDoc(false)} />
      )}
    </div>
  );
};

const VenueClaimsTab = () => {
  const [status, setStatus] = useState('all');
  const { data: claims, isLoading } = useVenueClaims(status);

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-card/40 rounded-full p-1 flex-wrap h-auto">
          {['all', 'submitted', 'in_review', 'approved', 'rejected', 'draft'].map((s) => (
            <TabsTrigger key={s} value={s} className="rounded-full text-xs capitalize">{s.replace('_', ' ')}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
      ) : !claims?.length ? (
        <div className="text-center py-10 glass rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No venue claims here</p>
          <p className="text-xs text-muted-foreground mt-1">Claims appear as venue managers complete the wizard.</p>
        </div>
      ) : (
        <div className="space-y-3">{claims.map((c) => <ClaimCard key={c.id} claim={c} />)}</div>
      )}
    </div>
  );
};

export default VenueClaimsTab;
