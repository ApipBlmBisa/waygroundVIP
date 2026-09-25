import React from 'react';
import {
  Sparkles,
  Diamond,
  Swords,
  Hexagon,
  Flame,
  Crown,
  Star,
  Zap,
  Shield,
  Sun,
  Triangle,
  Gem,
} from 'lucide-react';

export interface SymbolDefinition {
  id: string;
  symbol: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

export const UNIQUE_SYMBOLS: SymbolDefinition[] = [
  { id: 'sparkles', symbol: '✦', label: 'Nova Spark', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-950/50', border: 'border-amber-500/50' },
  { id: 'diamond', symbol: '◈', label: 'Diamond Core', icon: Diamond, color: 'text-cyan-400', bg: 'bg-cyan-950/50', border: 'border-cyan-500/50' },
  { id: 'swords', symbol: '⚔', label: 'Dual Blades', icon: Swords, color: 'text-rose-400', bg: 'bg-rose-950/50', border: 'border-rose-500/50' },
  { id: 'hexagon', symbol: '⬡', label: 'Hex Matrix', icon: Hexagon, color: 'text-purple-400', bg: 'bg-purple-950/50', border: 'border-purple-500/50' },
  { id: 'crest', symbol: '❖', label: 'Solar Crest', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-950/50', border: 'border-orange-500/50' },
  { id: 'crown', symbol: '♛', label: 'Royal Crown', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-950/50', border: 'border-yellow-500/50' },
  { id: 'star', symbol: '⯎', label: 'Cyber Star', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-500/50' },
  { id: 'zap', symbol: 'ϟ', label: 'Volt Pulse', icon: Zap, color: 'text-yellow-300', bg: 'bg-amber-950/50', border: 'border-yellow-400/50' },
  { id: 'shield', symbol: '⛨', label: 'Aegis Shield', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-950/50', border: 'border-blue-500/50' },
  { id: 'astral', symbol: '✧', label: 'Astral Light', icon: Sun, color: 'text-pink-400', bg: 'bg-pink-950/50', border: 'border-pink-500/50' },
  { id: 'delta', symbol: '▲', label: 'Apex Delta', icon: Triangle, color: 'text-indigo-400', bg: 'bg-indigo-950/50', border: 'border-indigo-500/50' },
  { id: 'gem', symbol: '⟡', label: 'Prism Gem', icon: Gem, color: 'text-teal-400', bg: 'bg-teal-950/50', border: 'border-teal-500/50' },
];

export const EMOJI_TO_SYMBOL: Record<string, string> = {
  '🐱': '✦',
  '👑': '♛',
  '🚀': '▲',
  '🦊': '⯎',
  '🎯': '◈',
  '💎': '⟡',
  '🦄': '✧',
  '🐉': '❖',
  '🎮': '⚔',
  '🦁': '⬡',
  '🤖': '⯎',
  '⚡': 'ϟ',
  '🛡': '⛨',
};

export const sanitizeAvatarSymbol = (raw: string | undefined): string => {
  if (!raw) return '✦';
  if (EMOJI_TO_SYMBOL[raw]) return EMOJI_TO_SYMBOL[raw];
  const found = UNIQUE_SYMBOLS.find((s) => s.symbol === raw || s.id === raw);
  if (found) return found.symbol;
  // If raw is an emoji (codepoint > 255 or contains surrogate), fallback to ✦
  if (/[\uD800-\uDFFF\u2600-\u27BF]/.test(raw)) {
    return '✦';
  }
  return raw;
};

// Apply active theme color and typography style here: dynamic avatar symbol configuration
export const getSymbolConfig = (raw: string | undefined): SymbolDefinition => {
  const sym = sanitizeAvatarSymbol(raw);
  const found = UNIQUE_SYMBOLS.find((s) => s.symbol === sym || s.id === raw);
  return found || UNIQUE_SYMBOLS[0];
};

interface UserAvatarProps {
  avatar: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  glow?: boolean;
  accentColor?: string;
  matchTheme?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  size = 'md',
  showBadge = true,
  className = '',
  glow = false,
  accentColor,
  matchTheme = false,
}) => {
  const conf = getSymbolConfig(avatar);
  const sym = sanitizeAvatarSymbol(avatar);

  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-2xl',
  };

  const badgeRadius = {
    xs: 'rounded-md',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
  };

  // Apply active theme color and typography style here: dynamic theme alignment for icon and container
  const shouldUseTheme = (matchTheme || glow) && Boolean(accentColor);

  const badgeContainerStyles: React.CSSProperties | undefined = shouldUseTheme
    ? {
        backgroundColor: `${accentColor}25`,
        borderColor: `${accentColor}80`,
        boxShadow: glow ? `0 0 14px ${accentColor}70, 0 0 4px ${accentColor}` : undefined,
      }
    : glow && accentColor
    ? {
        boxShadow: `0 0 14px ${accentColor}70, 0 0 4px ${accentColor}`,
        borderColor: accentColor,
      }
    : undefined;

  const symbolSpanStyles: React.CSSProperties | undefined = shouldUseTheme
    ? {
        color: accentColor,
        textShadow: glow ? `0 0 8px ${accentColor}` : undefined,
      }
    : undefined;

  if (!showBadge) {
    return (
      <span
        style={symbolSpanStyles}
        className={`inline-flex items-center justify-center font-mono font-bold select-none ${
          shouldUseTheme ? '' : conf.color
        } ${className}`}
        title={conf.label}
      >
        {sym}
      </span>
    );
  }

  return (
    <div
      style={badgeContainerStyles}
      className={`inline-flex items-center justify-center shrink-0 border ${badgeRadius[size]} ${
        shouldUseTheme ? '' : `${conf.bg} ${conf.border} ${conf.color}`
      } font-mono font-bold select-none shadow-sm transition-all duration-300 ${sizeClasses[size]} ${className}`}
      title={conf.label}
    >
      <span style={symbolSpanStyles}>{sym}</span>
    </div>
  );
};
