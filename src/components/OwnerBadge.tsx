import React from 'react';
import { getOwnerBadge } from '../utils/badges';
import { Crown } from 'lucide-react';

interface OwnerBadgeProps {
  badgeId?: string;
  isOwner?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  glow?: boolean;
  offsetYClass?: string;
}

export const OwnerBadge: React.FC<OwnerBadgeProps> = ({
  badgeId,
  isOwner = true,
  size = 'md',
  showLabel = false,
  className = '',
  offsetYClass,
}) => {
  if (!isOwner) return null;

  const badgeDef = getOwnerBadge(badgeId) || getOwnerBadge('owner_crown')!;

  // Strict locked layout footprint
  const footprintClasses = {
    xs: 'w-[18px] h-[18px] min-w-[18px]',
    sm: 'w-[22px] h-[22px] min-w-[22px]',
    md: 'w-[26px] h-[26px] min-w-[26px]',
    lg: 'w-[32px] h-[32px] min-w-[32px]',
    xl: 'w-[42px] h-[42px] min-w-[42px]',
  };

  // Custom badge is enlarged (2.2x), whereas built-in web badges keep normal standard size (1.0x)
  const scaleClasses = badgeDef.isCustom
    ? 'scale-[2.2] hover:scale-[2.4]'
    : 'scale-100 hover:scale-105';

  // Per-size vertical alignment:
  // xs/sm are placed next to compact 12px-14px texts (e.g. main screen header button & table rows)
  // md is placed next to larger title texts (e.g. text-2xl profile modal header)
  const sizeTranslateY = {
    xs: '-translate-y-[0.5px]',
    sm: '-translate-y-[1px]',
    md: '-translate-y-2.5',
    lg: '-translate-y-2',
    xl: '-translate-y-2.5',
  };

  const verticalOffset = offsetYClass ?? sizeTranslateY[size];

  const tagSizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
    xl: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center shrink-0 self-center select-none ${className}`}
      title={`OWNER: ${badgeDef.name} — ${badgeDef.title}`}
    >
      {/* Container with fixed footprint and overflow-visible */}
      <span className={`${footprintClasses[size]} relative shrink-0 inline-flex items-center justify-center overflow-visible mx-0.5`}>
        <img
          src={badgeDef.iconPath}
          alt={badgeDef.name}
          className={`w-full h-full object-contain shrink-0 block origin-center ${scaleClasses} ${verticalOffset} transition-transform duration-200 z-10`}
          onError={(e) => {
            e.currentTarget.src = '/icons/owner_crown.svg';
          }}
          loading="eager"
          decoding="async"
        />
      </span>

      {showLabel && (
        <span
          style={{
            borderColor: `${badgeDef.glowColor}70`,
          }}
          className={`ml-1.5 inline-flex items-center rounded-full font-black uppercase tracking-wider bg-slate-950/90 text-amber-300 border shadow-sm ${tagSizeClasses[size]}`}
          title={badgeDef.title}
        >
          <Crown className={`${size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-400 fill-amber-400 shrink-0`} />
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-display leading-none">
            OWNER
          </span>
        </span>
      )}
    </span>
  );
};



