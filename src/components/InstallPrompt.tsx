import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session or already installed
    if (sessionStorage.getItem('install-dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing for better UX
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('install-dismissed', 'true');
  };

  // iOS detection — show manual instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const showIOSBanner = isIOS && !window.matchMedia('(display-mode: standalone)').matches && !dismissed;

  useEffect(() => {
    if (isIOS && !sessionStorage.getItem('install-dismissed')) {
      setTimeout(() => setShowBanner(true), 3000);
    }
  }, [isIOS]);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="glass rounded-2xl p-4 border border-primary/30 shadow-lg shadow-primary/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm text-foreground">
                Install SCENE
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS
                  ? 'Tap Share → "Add to Home Screen" for the full experience'
                  : 'Get instant notifications & quick access from your home screen'}
              </p>
              {!isIOS && deferredPrompt && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="mt-2 gradient-primary text-primary-foreground text-xs rounded-full px-4"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Install App
                </Button>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
