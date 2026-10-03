import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
};

/** Real TOTP enrollment: enroll → scan QR → challenge + verify a 6-digit code. */
const TwoFactorDialog = ({ open, onOpenChange, onEnabled }: Props) => {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setCode("");
      // Clear any half-finished (unverified) factors from earlier attempts.
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `SCENE ${new Date().toISOString().slice(0, 16)}`,
      });
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        toast.error(error?.message ?? "Could not start 2FA setup");
        onOpenChange(false);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
    return () => { cancelled = true; };
  }, [open, onOpenChange]);

  const close = async (next: boolean) => {
    // Abandoned setup → remove the unverified factor.
    if (!next && factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      const f = data?.all.find((x) => x.id === factorId);
      if (f && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId });
      setFactorId(null); setQr(null); setSecret(null);
    }
    onOpenChange(next);
  };

  const verify = async () => {
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !ch) {
      setVerifying(false);
      toast.error(chErr?.message ?? "Could not create challenge");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setVerifying(false);
    if (error) {
      toast.error("That code didn't match. Try the newest one in your app.");
      return;
    }
    setFactorId(null);
    onEnabled();
    onOpenChange(false);
    toast.success("Two-factor authentication is on");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Set up 2FA</DialogTitle>
          <DialogDescription>Scan this code with Google Authenticator, Authy or 1Password, then enter the 6-digit code.</DialogDescription>
        </DialogHeader>
        {loading || !qr ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-fit rounded-xl bg-white p-3">
              <img src={qr} alt="2FA QR code" className="h-44 w-44" />
            </div>
            {secret && (
              <p className="break-all text-center text-[11px] text-muted-foreground">
                Can't scan? Enter this key: <span className="font-mono text-foreground">{secret}</span>
              </p>
            )}
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
            <Button onClick={verify} disabled={code.length !== 6 || verifying} className="w-full gradient-primary text-primary-foreground">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & turn on"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorDialog;
