import { useState } from 'react';
import { motion } from 'framer-motion';

export type Animated3DEmojiName =
  | 'fire'
  | 'lightning'
  | 'microphone'
  | 'headphones'
  | 'map'
  | 'lightbulb'
  | 'crown'
  | 'butterfly'
  | 'owl'
  | 'trophy'
  | 'star'
  | 'medal'
  | 'car'
  | 'heart'
  | 'chat'
  | 'video'
  | 'thumbsUp'
  | 'users'
  | 'rocket'
  | 'user'
  | 'moon'
  | 'sparkles';

type Animated3DEmojiProps = {
  name: Animated3DEmojiName;
  label?: string;
  className?: string;
  featured?: boolean;
};

const Animated3DEmoji = ({ name, label, className = '', featured = false }: Animated3DEmojiProps) => {
  const [assetFailed, setAssetFailed] = useState(false);

  return (
    <span
      role="img"
      aria-label={label ?? name}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 ${
        featured ? 'h-12 w-12 rounded-2xl border-orange-400/30 bg-orange-500/10' : ''
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-1 rounded-lg bg-gradient-to-br from-white/10 to-transparent ${
          featured ? 'from-orange-300/15' : ''
        }`}
      />
      {assetFailed ? (
        <span
          aria-hidden="true"
          className="relative z-10 h-5 w-5 rounded-full bg-gradient-to-br from-white/20 to-transparent shadow-inner"
        />
      ) : (
        <motion.img
          src={`/emoji/fluent-3d/${name}.webp`}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setAssetFailed(true)}
          className={`relative z-10 h-9 w-9 select-none object-contain ${
            featured ? 'h-10 w-10 drop-shadow-[0_0_10px_rgba(255,107,74,0.45)]' : ''
          }`}
          animate={{ y: [0, -1, 0], rotate: [0, -1.5, 1.5, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
};

export default Animated3DEmoji;
