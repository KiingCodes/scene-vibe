import { useState } from 'react';
import { Delete, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  hint?: string;
  onSubmit: (pin: string) => void;
  submitting?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/** 4-digit keypad used to end a walk (safe PIN) or silently escalate (duress PIN). */
const DuressPinPad = ({ title = 'Enter your PIN', hint, onSubmit, submitting }: Props) => {
  const [pin, setPin] = useState('');

  const press = (k: string) => {
    if (submitting) return;
    if (k === 'del') return setPin(p => p.slice(0, -1));
    if (!k || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        onSubmit(next);
        setPin('');
      }, 120);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-white/90 font-semibold">
          <ShieldAlert className="w-4 h-4 text-[#ff2e93]" />
          {title}
        </div>
        {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
      </div>

      <div className="flex justify-center gap-3" aria-live="polite">
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border transition-all ${
              pin.length > i
                ? 'bg-[#00e6d6] border-[#00e6d6] shadow-[0_0_10px_rgba(0,230,214,0.7)]'
                : 'border-white/25'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
        {KEYS.map((k, i) =>
          k === '' ? (
            <div key={i} />
          ) : (
            <Button
              key={i}
              type="button"
              variant="ghost"
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'Delete' : k}
              className="h-14 rounded-xl bg-white/5 border border-white/10 text-lg font-bold text-white hover:bg-white/10"
            >
              {k === 'del' ? <Delete className="w-5 h-5" /> : k}
            </Button>
          ),
        )}
      </div>
    </div>
  );
};

export default DuressPinPad;
