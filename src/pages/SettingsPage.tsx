import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Eye,
  FileText,
  KeyRound,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  Monitor,
  Moon,
  RotateCcw,
  Shield,
  Smartphone,
  Trash2,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_VERSION } from "@/lib/version";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TwoFactorDialog from "@/components/settings/TwoFactorDialog";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/pushConfig";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useCountry } from "@/contexts/CountryContext";

/** Preferences persisted as columns on the user's profile row. */
type ProfilePrefs = {
  email_notifications: boolean;
  push_notifications: boolean;
  profile_visibility: "public" | "followers" | "private";
  walk_me_home_privacy: "contacts" | "private";
  sound_effects: boolean;
  two_factor_enabled: boolean;
};

const DEFAULT_PREFS: ProfilePrefs = {
  email_notifications: true,
  push_notifications: false,
  profile_visibility: "public",
  walk_me_home_privacy: "contacts",
  sound_effects: true,
  two_factor_enabled: false,
};

const PREF_COLUMNS = Object.keys(DEFAULT_PREFS).join(",");

/** Secondary alert/display toggles kept on the account metadata. */
type ExtraState = {
  activityVisible: boolean;
  liveVenueVibes: boolean;
  chatMentions: boolean;
  safetyCheckins: boolean;
  highContrastNeon: boolean;
};

const DEFAULT_EXTRA: ExtraState = {
  activityVisible: true,
  liveVenueVibes: true,
  chatMentions: true,
  safetyCheckins: true,
  highContrastNeon: false,
};

type RowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
};

const SettingRow = ({
  icon: Icon,
  title,
  description,
  children,
  onClick,
}: RowProps) => {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      {children}
    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
    >
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3">
      {content}
    </div>
  );
};

const Section = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass overflow-hidden rounded-2xl border border-white/10"
  >
    <div className="border-b border-white/10 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-foreground">
        {title}
      </h2>
    </div>
    <div className="divide-y divide-white/5 p-2">{children}</div>
  </motion.section>
);

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const { country } = useCountry();
  const [prefs, setPrefs] = useState<ProfilePrefs>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [extra, setExtra] = useState<ExtraState>(DEFAULT_EXTRA);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const hasPassword = !!user?.identities?.some((i) => i.provider === "email");

  // Load saved preferences from the profile row, and sync 2FA with real MFA factors.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setExtra({
      ...DEFAULT_EXTRA,
      ...((user.user_metadata?.scene_settings as Partial<ExtraState> | undefined) ?? {}),
    });
    (async () => {
      setPrefsLoading(true);
      const [{ data, error }, { data: factors }] = await Promise.all([
        supabase.from("profiles").select(PREF_COLUMNS).eq("user_id", user.id).maybeSingle(),
        supabase.auth.mfa.listFactors(),
      ]);
      if (cancelled) return;
      if (error) toast.error("Could not load your settings");
      const loaded = { ...DEFAULT_PREFS, ...((data as Partial<ProfilePrefs> | null) ?? {}) };
      const mfaOn = (factors?.totp ?? []).some((f) => f.status === "verified");
      if (loaded.two_factor_enabled !== mfaOn) {
        loaded.two_factor_enabled = mfaOn;
        await supabase.from("profiles").update({ two_factor_enabled: mfaOn }).eq("user_id", user.id);
      }
      setPrefs(loaded);
      setPrefsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  /** Write a patch to the profile row (insert it if missing). */
  const persistPrefs = async (patch: Partial<ProfilePrefs>) => {
    if (!user) return { error: new Error("Not signed in") };
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", user.id)
      .select("id");
    if (error) return { error };
    if (!data?.length) {
      const { error: insErr } = await supabase.from("profiles").insert({ user_id: user.id, ...patch });
      return { error: insErr };
    }
    return { error: null };
  };

  const updatePref = async <K extends keyof ProfilePrefs>(key: K, value: ProfilePrefs[K]) => {
    if (!user || savingKey) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setSavingKey(key);
    const { error } = await persistPrefs({ [key]: value } as Partial<ProfilePrefs>);
    setSavingKey(null);
    if (error) {
      setPrefs(previous);
      toast.error("Could not save that setting");
      return false;
    }
    toast.success("Setting saved");
    return true;
  };

  const updateExtra = async (key: keyof ExtraState, value: boolean) => {
    if (!user || savingKey) return;
    const previous = extra;
    const next = { ...extra, [key]: value };
    setExtra(next);
    setSavingKey(key);
    const { error } = await supabase.auth.updateUser({ data: { scene_settings: next } });
    setSavingKey(null);
    if (error) {
      setExtra(previous);
      toast.error("Could not save that setting");
      return;
    }
    toast.success("Setting saved");
  };

  // --- Push notifications: real browser permission + push subscription ---
  const togglePush = async (on: boolean) => {
    if (!user || savingKey) return;
    if (!on) {
      setSavingKey("push_notifications");
      try {
        const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          await sub.unsubscribe();
        }
      } catch { /* browser cleanup is best-effort */ }
      setSavingKey(null);
      await updatePref("push_notifications", false);
      return;
    }
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return;
    }
    setSavingKey("push_notifications");
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      setSavingKey(null);
      toast.error("Notifications are blocked. Allow them in your browser settings.");
      return;
    }
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
          });
        }
        await supabase.functions.invoke("push-subscribe", {
          body: { subscription: sub.toJSON(), device_id: deviceId, country, user_id: user.id },
        });
      }
    } catch {
      // Permission granted but background push unavailable (e.g. preview iframe) — keep the preference.
    }
    setSavingKey(null);
    await updatePref("push_notifications", true);
  };

  // --- 2FA ---
  const toggleTwoFactor = async (on: boolean) => {
    if (on) {
      setMfaOpen(true);
      return;
    }
    setSavingKey("two_factor_enabled");
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (error) {
        setSavingKey(null);
        toast.error(
          error.message.includes("aal2")
            ? "Sign in again with your 2FA code before turning it off."
            : error.message,
        );
        return;
      }
    }
    setSavingKey(null);
    await updatePref("two_factor_enabled", false);
  };

  const clearLocalCache = () => {
    Object.keys(localStorage)
      .filter((key) => !key.startsWith("sb-"))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    toast.success("Local cache cleared");
  };

  const handlePasswordChange = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    setPasswordOpen(false);
    toast.success("Password updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    setDeletingAccount(true);
    try {
      // Re-verify identity before deleting.
      if (hasPassword) {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: deletePassword,
        });
        if (authErr) {
          toast.error("Password is incorrect");
          setDeletingAccount(false);
          return;
        }
      }
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      navigate("/");
      toast.success("Account deleted");
    } catch {
      toast.error("Could not delete account. Try again.");
      setDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <main className="container mx-auto px-4 pb-24 pt-24 text-center">
          <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Sign in to manage settings
          </h1>
          <Link to="/auth" className="mt-6 inline-block">
            <Button className="gradient-primary text-primary-foreground">
              Sign In
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const spin = (key: string) =>
    savingKey === key ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null;

  const prefToggle = (
    key: "email_notifications" | "sound_effects" | "push_notifications" | "two_factor_enabled",
    onChange: (v: boolean) => void = (v) => updatePref(key, v),
  ) => (
    <span className="flex items-center gap-2">
      {spin(key)}
      <Switch
        checked={prefs[key]}
        disabled={savingKey !== null || prefsLoading}
        onCheckedChange={onChange}
        aria-label={`Toggle ${key}`}
      />
    </span>
  );

  const toggle = (key: keyof ExtraState) => (
    <span className="flex items-center gap-2">
      {spin(key)}
      <Switch
        checked={extra[key]}
        disabled={savingKey !== null}
        onCheckedChange={(value) => updateExtra(key, value)}
        aria-label={`Toggle ${key}`}
      />
    </span>
  );

  const prefSelect = <K extends "profile_visibility" | "walk_me_home_privacy">(
    key: K,
    options: { value: ProfilePrefs[K]; label: string }[],
  ) => (
    <span className="flex items-center gap-2">
      {spin(key)}
      <Select
        value={prefs[key]}
        disabled={savingKey !== null || prefsLoading}
        onValueChange={(v) => updatePref(key, v as ProfilePrefs[K])}
      >
        <SelectTrigger className="h-9 w-[130px] border-white/10 bg-white/5 text-xs" aria-label={key}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-24 pt-20 sm:pt-24">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to profile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              Your SCENE
            </p>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Settings
            </h1>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">
            Tune your night, your way.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Your preferences are synced securely to your SCENE account and
            follow you between devices.
          </p>
        </div>

        <div className="space-y-4">
          <Section eyebrow="01 / Account" title="Account & Security">
            <SettingRow
              icon={KeyRound}
              title="Change Password"
              description="Keep your account access fresh"
              onClick={() => setPasswordOpen(true)}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </SettingRow>
            <SettingRow
              icon={Smartphone}
              title="Two-Factor Authentication"
              description="Add an extra layer of account protection"
            >
              {prefToggle("two_factor_enabled", toggleTwoFactor)}
            </SettingRow>
            <SettingRow
              icon={Bell}
              title="Email Preferences"
              description="Receive useful updates and community news"
            >
              {prefToggle("email_notifications")}
            </SettingRow>
          </Section>

          <Section eyebrow="02 / Control" title="Privacy & Safety">
            <SettingRow
              icon={Eye}
              title="Profile Discoverability"
              description="Let people find your profile in the SCENE community"
            >
              {prefSelect("profile_visibility", [{ value: "public", label: "Everyone" }, { value: "followers", label: "Followers" }, { value: "private", label: "Only me" }])}
            </SettingRow>
            <SettingRow
              icon={Monitor}
              title="Activity Feed Visibility"
              description="Show your vibes and activity to other people"
            >
              {toggle("activityVisible")}
            </SettingRow>
            <SettingRow
              icon={MapPin}
              title="Walk Me Home Location Privacy"
              description="Keep your live safety location visible only to chosen contacts"
            >
              {prefSelect("walk_me_home_privacy", [{ value: "contacts", label: "My contacts" }, { value: "private", label: "Only me" }])}
            </SettingRow>
          </Section>

          <Section eyebrow="03 / Stay in the loop" title="Notifications">
            <SettingRow
              icon={Smartphone}
              title="Push notifications"
              description="Get alerts on this device, even when SCENE is closed"
            >
              {prefToggle("push_notifications", togglePush)}
            </SettingRow>
            <SettingRow
              icon={Bell}
              title="Live venue vibes"
              description="Alerts when the energy changes at nearby venues"
            >
              {toggle("liveVenueVibes")}
            </SettingRow>
            <SettingRow
              icon={MessageCircle}
              title="Chat mentions"
              description="Know when someone calls you into the conversation"
            >
              {toggle("chatMentions")}
            </SettingRow>
            <SettingRow
              icon={Shield}
              title="Safety check-ins"
              description="Reminders and updates from Walk Me Home"
            >
              {toggle("safetyCheckins")}
            </SettingRow>
          </Section>

          <Section eyebrow="04 / Experience" title="App Preferences">
            <SettingRow
              icon={Volume2}
              title="Sound effects"
              description="Add subtle audio feedback to key moments"
            >
              {prefToggle("sound_effects")}
            </SettingRow>
            <SettingRow
              icon={Moon}
              title="High contrast neon mode"
              description="Boost contrast for brighter, easier scanning at night"
            >
              {toggle("highContrastNeon")}
            </SettingRow>
            <SettingRow
              icon={RotateCcw}
              title="Clear local cache"
              description="Remove locally stored app data without signing you out"
              onClick={clearLocalCache}
            >
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Check className="h-3.5 w-3.5" /> Clear
              </span>
            </SettingRow>
          </Section>

          <Section eyebrow="05 / The fine print" title="Legal & About">
            <SettingRow
              icon={FileText}
              title="Terms of Service"
              description="Read the rules for using SCENE"
              onClick={() => navigate("/terms")}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </SettingRow>
            <SettingRow
              icon={Shield}
              title="Privacy Policy"
              description="See how SCENE handles your information"
              onClick={() => navigate("/privacy")}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </SettingRow>
            <SettingRow
              icon={Monitor}
              title="App Version"
              description="You are running the latest SCENE release"
            >
              <span className="text-xs font-semibold text-muted-foreground">
                v{APP_VERSION}
              </span>
            </SettingRow>
            <SettingRow
              icon={LogOut}
              title="Sign Out"
              description="Sign out of this device"
              onClick={handleSignOut}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </SettingRow>
          </Section>

          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]">
                Danger Zone
              </h2>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Permanently delete your account, vibes, reviews, messages, and
              badges. This cannot be undone.
            </p>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-destructive">
                    Delete Account
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Type DELETE and confirm your password. Your profile, vibes, reviews, messages and badges will be permanently removed.
                </p>
                <Input
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="DELETE"
                  className="border-destructive/30 bg-muted/50"
                />
                {hasPassword && (
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder="Your current password"
                    autoComplete="current-password"
                    className="border-destructive/30 bg-muted/50"
                  />
                )}
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  disabled={deleteConfirm !== "DELETE" || (hasPassword && !deletePassword) || deletingAccount}
                  className="w-full"
                >
                  {deletingAccount
                    ? "Deleting..."
                    : "Permanently Delete My Account"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
      <Footer />

      <TwoFactorDialog
        open={mfaOpen}
        onOpenChange={setMfaOpen}
        onEnabled={() => updatePref("two_factor_enabled", true)}
      />

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
            />
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Confirm new password"
            />
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="w-full gradient-primary text-primary-foreground"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
