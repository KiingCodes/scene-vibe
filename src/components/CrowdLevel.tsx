import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface CrowdLevelProps {
  vibeCount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CrowdLevel = ({ vibeCount, size = 'md', showLabel = true }: CrowdLevelProps) => {
  // Determine crowd level based on real-time vibe count
  const getCrowdLevel = () => {
    if (vibeCount === 0) return { level: 'Empty', color: 'bg-muted', textColor: 'text-muted-foreground', percent: 5 };
    if (vibeCount === 1) return { level: 'Quiet', color: 'bg-blue-500', textColor: 'text-blue-400', percent: 20 };
    if (vibeCount === 2) return { level: 'Warming Up', color: 'bg-cyan-500', textColor: 'text-cyan-400', percent: 40 };
    if (vibeCount >= 3 && vibeCount < 5) return { level: 'Vibing', color: 'bg-primary', textColor: 'text-primary', percent: 60 };
    if (vibeCount >= 5 && vibeCount < 8) return { level: 'Packed', color: 'bg-orange-500', textColor: 'text-orange-400', percent: 80 };
    return { level: 'On Fire! 🔥', color: 'bg-secondary', textColor: 'text-secondary', percent: 100 };
  };

  const crowd = getCrowdLevel();
  
  const sizeClasses = {
    sm: { bar: 'h-1.5 w-16', text: 'text-[10px]', icon: 'w-3 h-3' },
    md: { bar: 'h-2 w-24', text: 'text-xs', icon: 'w-3.5 h-3.5' },
    lg: { bar: 'h-2.5 w-32', text: 'text-sm', icon: 'w-4 h-4' },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <Users className={`${classes.icon} ${crowd.textColor}`} />
      <div className="flex flex-col gap-0.5">
        {showLabel && (
          <span className={`${classes.text} font-medium ${crowd.textColor}`}>
            {crowd.level}
          </span>
        )}
        <div className={`${classes.bar} bg-muted/50 rounded-full overflow-hidden`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${crowd.percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${crowd.color} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
};

export default CrowdLevel;
