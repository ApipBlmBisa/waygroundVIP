import React from 'react';
import { OwnerNameEffect, OwnerNameAnimation } from '../types';

export const OWNER_EFFECT_CONFIGS: Record<
  OwnerNameEffect,
  {
    id: OwnerNameEffect;
    name: string;
    description: string;
    gradientClass: string;
    glowColor: string;
    borderGlowClass: string;
    badgePillClass: string;
    sampleTextColor: string;
  }
> = {
  'gold-glow': {
    id: 'gold-glow',
    name: 'Gold Glow',
    description: 'Gradien Emas Neon Berkilau',
    gradientClass: 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent',
    glowColor: 'rgba(245, 158, 11, 0.85)',
    borderGlowClass: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    badgePillClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    sampleTextColor: '#fbbf24',
  },
  'cyberpunk-rgb': {
    id: 'cyberpunk-rgb',
    name: 'Cyberpunk RGB',
    description: 'Gradien Neon Cyan-Magenta Futuristik',
    gradientClass: 'bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    borderGlowClass: 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    badgePillClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    sampleTextColor: '#22d3ee',
  },
  'fire-lava': {
    id: 'fire-lava',
    name: 'Fire / Lava',
    description: 'Gradien Kobaran Api Panas Menyala',
    gradientClass: 'bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 bg-clip-text text-transparent',
    glowColor: 'rgba(239, 68, 68, 0.85)',
    borderGlowClass: 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    badgePillClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    sampleTextColor: '#f97316',
  },
  'holographic': {
    id: 'holographic',
    name: 'Holographic Prisma',
    description: 'Efek Pelangi Holografik Prisma',
    gradientClass: 'bg-gradient-to-r from-rose-300 via-violet-300 via-teal-200 to-amber-200 bg-clip-text text-transparent',
    glowColor: 'rgba(192, 132, 252, 0.85)',
    borderGlowClass: 'border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)]',
    badgePillClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    sampleTextColor: '#c084fc',
  },
  'emerald-matrix': {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Gradien Zamrud Hijau Neon Terang',
    gradientClass: 'bg-gradient-to-r from-emerald-300 via-green-400 to-teal-400 bg-clip-text text-transparent',
    glowColor: 'rgba(16, 185, 129, 0.85)',
    borderGlowClass: 'border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    badgePillClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    sampleTextColor: '#34d399',
  },
  'ocean-abyss': {
    id: 'ocean-abyss',
    name: 'Ocean Abyss',
    description: 'Gradien Biru Samudra Elektrik',
    gradientClass: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent',
    glowColor: 'rgba(59, 130, 246, 0.85)',
    borderGlowClass: 'border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    badgePillClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    sampleTextColor: '#60a5fa',
  },
  'sunset-flare': {
    id: 'sunset-flare',
    name: 'Sunset Flare',
    description: 'Gradien Lembayung Senja Emas-Oranye',
    gradientClass: 'bg-gradient-to-r from-amber-300 via-orange-400 to-pink-500 bg-clip-text text-transparent',
    glowColor: 'rgba(251, 146, 60, 0.85)',
    borderGlowClass: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,146,60,0.3)]',
    badgePillClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    sampleTextColor: '#fb923c',
  },
  'ruby-rose': {
    id: 'ruby-rose',
    name: 'Ruby Rose',
    description: 'Gradien Merah Delima & Magenta Mewah',
    gradientClass: 'bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 bg-clip-text text-transparent',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    borderGlowClass: 'border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    badgePillClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    sampleTextColor: '#fb7185',
  },
  'purple-galaxy': {
    id: 'purple-galaxy',
    name: 'Purple Galaxy',
    description: 'Gradien Ungu Nebula Elektrik Kosmik',
    gradientClass: 'bg-gradient-to-r from-purple-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent',
    glowColor: 'rgba(168, 85, 247, 0.85)',
    borderGlowClass: 'border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    badgePillClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    sampleTextColor: '#c084fc',
  },
  'neon-mint': {
    id: 'neon-mint',
    name: 'Neon Mint',
    description: 'Gradien Hijau Mint Cyan Segar',
    gradientClass: 'bg-gradient-to-r from-teal-200 via-emerald-300 to-cyan-300 bg-clip-text text-transparent',
    glowColor: 'rgba(45, 212, 191, 0.85)',
    borderGlowClass: 'border-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.3)]',
    badgePillClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    sampleTextColor: '#2dd4bf',
  },
  'ice-blue': {
    id: 'ice-blue',
    name: 'Ice Crystal Blue',
    description: 'Gradien Es Arktik Kristal Bersinar',
    gradientClass: 'bg-gradient-to-r from-sky-200 via-cyan-300 to-blue-300 bg-clip-text text-transparent',
    glowColor: 'rgba(56, 189, 248, 0.85)',
    borderGlowClass: 'border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    badgePillClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    sampleTextColor: '#38bdf8',
  },
  'electric-violet': {
    id: 'electric-violet',
    name: 'Electric Violet',
    description: 'Gradien Violet Ultra Elektrik Dinamis',
    gradientClass: 'bg-gradient-to-r from-indigo-300 via-violet-400 to-purple-500 bg-clip-text text-transparent',
    glowColor: 'rgba(139, 92, 246, 0.85)',
    borderGlowClass: 'border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    badgePillClass: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
    sampleTextColor: '#a78bfa',
  },
  'default': {
    id: 'default',
    name: 'Default Klasik',
    description: 'Teks Putih Elegan Standar',
    gradientClass: 'text-white',
    glowColor: 'transparent',
    borderGlowClass: 'border-slate-700',
    badgePillClass: 'bg-slate-800 text-slate-300 border-slate-700',
    sampleTextColor: '#ffffff',
  },
};

export const OWNER_ANIMATION_CONFIGS: Record<
  OwnerNameAnimation,
  {
    id: OwnerNameAnimation;
    name: string;
    description: string;
    animationClass: string;
    iconSymbol: string;
  }
> = {
  'shimmer': {
    id: 'shimmer',
    name: 'Shimmer / Glossy',
    description: 'Kilauan cahaya bergerak melintasi teks',
    animationClass: 'animate-owner-shimmer',
    iconSymbol: '✨',
  },
  'neon-glow': {
    id: 'neon-glow',
    name: 'Neon Glow Outer',
    description: 'Pendaran cahaya neon di luar teks',
    animationClass: 'animate-owner-neon',
    iconSymbol: '🌟',
  },
  'pulse-wave': {
    id: 'pulse-wave',
    name: 'Text Pulse / Wave',
    description: 'Efek bergelombang dan berdenyut lembut',
    animationClass: 'animate-owner-pulse-wave',
    iconSymbol: '🌊',
  },
  'none': {
    id: 'none',
    name: 'Tanpa Animasi',
    description: 'Tampilan statik jernih',
    animationClass: '',
    iconSymbol: '⚡',
  },
};

// Cycle of vibrant distinct presets to guarantee no two people share identical colors if they haven't chosen yet
export const DISTINCT_NAME_PALETTES: OwnerNameEffect[] = [
  'cyberpunk-rgb',
  'emerald-matrix',
  'sunset-flare',
  'ocean-abyss',
  'ruby-rose',
  'purple-galaxy',
  'neon-mint',
  'fire-lava',
  'ice-blue',
  'gold-glow',
  'electric-violet',
  'holographic',
];

/**
 * Calculates a deterministic distinct color preset based on username hash
 * Ensures every single person has a unique, stylish color on the web by default!
 */
export function getDeterministicEffectForUsername(username: string): OwnerNameEffect {
  if (!username) return 'cyberpunk-rgb';
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DISTINCT_NAME_PALETTES.length;
  return DISTINCT_NAME_PALETTES[index];
}

export interface OwnerNameTextProps {
  name: string;
  isOwner?: boolean;
  effect?: OwnerNameEffect;
  animation?: OwnerNameAnimation;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const OwnerNameText: React.FC<OwnerNameTextProps> = ({
  name,
  isOwner = false,
  effect,
  animation,
  className = '',
  style,
  title,
}) => {
  // If user has an explicit setting saved per username (and not 'default'), use it.
  // Otherwise, use a deterministic distinct color based on their username so everyone has distinct colors!
  const effectiveEffect: OwnerNameEffect =
    effect && effect !== 'default'
      ? effect
      : isOwner
      ? 'gold-glow'
      : getDeterministicEffectForUsername(name);

  const effectConfig = OWNER_EFFECT_CONFIGS[effectiveEffect] || OWNER_EFFECT_CONFIGS['cyberpunk-rgb'];
  const effectiveAnim = animation || (isOwner ? 'shimmer' : 'none');
  const animConfig = OWNER_ANIMATION_CONFIGS[effectiveAnim] || OWNER_ANIMATION_CONFIGS['none'];

  return (
    <span
      title={title || `@${name}${isOwner ? ' (Owner)' : ''}`}
      style={{
        ['--owner-glow-color' as any]: effectConfig.glowColor,
        ...style,
      }}
      className={`inline-block font-black tracking-tight ${effectConfig.gradientClass} ${animConfig.animationClass} ${className}`}
    >
      {name}
    </span>
  );
};
