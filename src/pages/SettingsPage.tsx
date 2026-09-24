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

type SettingsState = {
  twoFactor: boolean;
  emailPreferences: boolean;
  profileDiscoverable: boolean;
  activityVisible: boolean;
  walkLocationPrivate: boolean;
  liveVenueVibes: boolean;
  chatMentions: boolean;
  safetyCheckins: boolean;
  soundEffects: boolean;
  highContrastNeon: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  twoFactor: false,
  emailPreferences: true,
  profileDiscoverable: true,
  activityVisible: true,
  walkLocationPrivate: true,
  liveVenueVibes: true,
  chatMentions: true,
  safetyCheckins: true,
  soundEffects: true,
  highContrastNeon: false,
};

type SettingKey = keyof SettingsState;

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
  const [settings, setSettings] = useState<SettingsState>(() => ({
    ...DEFAULT_SETTINGS,
    ...((user?.user_metadata?.scene_settings as
      | Partial<SettingsState>
      | undefined) ?? {}),
  }));
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSettings({
      ...DEFAULT_SETTINGS,
      ...((user.user_metadata?.scene_settings as
        | Partial<SettingsState>
        | undefined) ?? {}),
    });
  }, [user]);

  const updateSetting = async <K extends SettingKey>(
    key: K,
    value: SettingsState[K],
  ) => {
    if (!user || savingKey) return;
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingKey(key);
    const { error } = await supabase.auth.updateUser({
      data: { scene_settings: next },
    });
    setSavingKey(null);
    if (error) {
      setSettings(previous);
      toast.error("Could not save that setting");
      return;
    }
    toast.success("Setting saved");
  };

  const clearLocalCache = () => {
    Object.keys(localStorage)
      .filter((key) => !key.startsWith("sb-"))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    toast.success("Local cache cleared");
  };

  const handlePasswordChange = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    setDeletingAccount(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
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

  const toggle = (key: SettingKey) => (
    <Switch
      checked={settings[key]}
      disabled={savingKey !== null}
      onCheckedChange={(value) => updateSetting(key, value)}
      aria-label={`Toggle ${key}`}
    />
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
              {toggle("twoFactor")}
            </SettingRow>
            <SettingRow
              icon={Bell}
              title="Email Preferences"
              description="Receive useful updates and community news"
            >
              {toggle("emailPreferences")}
            </SettingRow>
          </Section>

          <Section eyebrow="02 / Control" title="Privacy & Safety">
            <SettingRow
              icon={Eye}
              title="Profile Discoverability"
              description="Let people find your profile in the SCENE community"
            >
              {toggle("profileDiscoverable")}
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
              {toggle("walkLocationPrivate")}
            </SettingRow>
          </Section>

          <Section eyebrow="03 / Stay in the loop" title="Notifications">
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
              {toggle("soundEffects")}
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
              onClick={() => signOut()}
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
                  Type DELETE to confirm permanent account deletion.
                </p>
                <Input
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="DELETE"
                  className="border-destructive/30 bg-muted/50"
                />
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  disabled={deleteConfirm !== "DELETE" || deletingAccount}
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
