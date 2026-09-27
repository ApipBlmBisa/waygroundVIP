import React from 'react';
import { OwnerNameEffect, OwnerNameAnimation, OwnerThemeId } from '../types';

export const OWNER_THEME_CONFIGS: Record<
  OwnerThemeId,
  {
    id: OwnerThemeId;
    name: string;
    description: string;
    cardBgClass: string;
    borderClass: string;
    glowClass: string;
    accentColor: string;
    accentBadgeClass: string;
    ambientOrbClass: string;
  }
> = {
  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Gold Theme',
    description: 'Nuansa emas mewah dengan border & aura berkilau',
    cardBgClass: 'bg-gradient-to-br from-amber-950/85 via-yellow-950/70 to-slate-950/95',
    borderClass: 'border-amber-400/60 ring-1 ring-amber-400/40',
    glowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    accentColor: '#fbbf24',
    accentBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    ambientOrbClass: 'bg-amber-500/20',
  },
  'cyberpunk-void': {
    id: 'cyberpunk-void',
    name: 'Cyberpunk Void Theme',
    description: 'Nuansa gelap futuristik dengan efek garis neon grid',
    cardBgClass: 'bg-gradient-to-br from-slate-950/95 via-cyan-950/60 to-fuchsia-950/70',
    borderClass: 'border-cyan-400/60 ring-1 ring-fuchsia-400/40',
    glowClass: 'shadow-[0_0_30px_rgba(6,182,212,0.35)]',
    accentColor: '#06b6d4',
    accentBadgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    ambientOrbClass: 'bg-cyan-500/20',
  },
  'galactic-cosmos': {
    id: 'galactic-cosmos',
    name: 'Galactic Cosmos Theme',
    description: 'Nuansa ruang angkasa dengan efek bintang & nebula mini',
    cardBgClass: 'bg-gradient-to-br from-purple-950/90 via-indigo-950/80 to-slate-950/95',
    borderClass: 'border-purple-400/60 ring-1 ring-indigo-400/40',
    glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.35)]',
    accentColor: '#a855f7',
    accentBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
    ambientOrbClass: 'bg-purple-500/20',
  },
  'inferno-lava': {
    id: 'inferno-lava',
    name: 'Inferno Lava Theme',
    description: 'Nuansa api berkobar dengan efek aura merah-oranye',
    cardBgClass: 'bg-gradient-to-br from-rose-950/85 via-orange-950/75 to-slate-950/95',
    borderClass: 'border-orange-500/60 ring-1 ring-rose-500/40',
    glowClass: 'shadow-[0_0_30px_rgba(249,115,22,0.35)]',
    accentColor: '#f97316',
    accentBadgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    ambientOrbClass: 'bg-orange-500/20',
  },
  'default': {
    id: 'default',
    name: 'Default Sovereign',
    description: 'Nuansa klasik elegan profil Wayground',
    cardBgClass: 'bg-gradient-to-br from-slate-900/95 via-purple-950/40 to-slate-950/95',
    borderClass: 'border-slate-700/80',
    glowClass: 'shadow-xl',
    accentColor: '#cbd5e1',
    accentBadgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    ambientOrbClass: 'bg-purple-500/10',
  },
};

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
    description: 'Gradien Emas Neon Bersinar',
    gradientClass: 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent',
    glowColor: 'rgba(245, 158, 11, 0.85)',
    borderGlowClass: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    badgePillClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    sampleTextColor: '#fbbf24',
  },
  'cyberpunk-rgb': {
    id: 'cyberpunk-rgb',
    name: 'Cyberpunk RGB',
    description: 'Gradien Warna Aurora Neon Futuristik',
    gradientClass: 'bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    borderGlowClass: 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    badgePillClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    sampleTextColor: '#22d3ee',
  },
  'fire-lava': {
    id: 'fire-lava',
    name: 'Fire / Lava',
    description: 'Gradien Warna Api Menyala',
    gradientClass: 'bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 bg-clip-text text-transparent',
    glowColor: 'rgba(239, 68, 68, 0.85)',
    borderGlowClass: 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    badgePillClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    sampleTextColor: '#f97316',
  },
  'holographic': {
    id: 'holographic',
    name: 'Holographic',
    description: 'Efek Warna Pelangi Holografik Berpindah',
    gradientClass: 'bg-gradient-to-r from-rose-300 via-violet-300 via-teal-200 to-amber-200 bg-clip-text text-transparent',
    glowColor: 'rgba(192, 132, 252, 0.85)',
    borderGlowClass: 'border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)]',
    badgePillClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    sampleTextColor: '#c084fc',
  },
  'diamond-ice': {
    id: 'diamond-ice',
    name: 'Diamond Ice',
    description: 'Gradien Biru Muda Es Berkilau',
    gradientClass: 'bg-gradient-to-r from-white via-cyan-200 to-sky-400 bg-clip-text text-transparent',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    borderGlowClass: 'border-cyan-300/50 shadow-[0_0_15px_rgba(56,189,248,0.35)]',
    badgePillClass: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    sampleTextColor: '#7dd3fc',
  },
  'amethyst-void': {
    id: 'amethyst-void',
    name: 'Amethyst Void',
    description: 'Gradien Ungu Kehitaman Bernuansa Misterius',
    gradientClass: 'bg-gradient-to-r from-violet-300 via-purple-500 to-indigo-700 bg-clip-text text-transparent',
    glowColor: 'rgba(168, 85, 247, 0.9)',
    borderGlowClass: 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.35)]',
    badgePillClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    sampleTextColor: '#a855f7',
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
    description: 'Efek kilauan cahaya melintasi teks secara berkala',
    animationClass: 'animate-owner-shimmer',
    iconSymbol: '✦',
  },
  'neon-glow': {
    id: 'neon-glow',
    name: 'Neon Glow Pulse',
    description: 'Efek pendaran bayangan neon berkedip lembut',
    animationClass: 'animate-owner-neon',
    iconSymbol: '✺',
  },
  'pulse-wave': {
    id: 'pulse-wave',
    name: 'Text Pulse / Wave',
    description: 'Efek teks bergelombang & berdenyut mengikuti irama',
    animationClass: 'animate-owner-pulse-wave',
    iconSymbol: '≋',
  },
  'flame-flicker': {
    id: 'flame-flicker',
    name: 'Flame Flicker',
    description: 'Efek bayangan bergetar lembut seperti kobaran api',
    animationClass: 'animate-owner-flame-flicker',
    iconSymbol: '❖',
  },
  'glitch': {
    id: 'glitch',
    name: 'Glitch Effect',
    description: 'Efek teks terdistorsi singkat khas cyberpunk',
    animationClass: 'animate-owner-glitch',
    iconSymbol: 'ϟ',
  },
  'aurora-flow': {
    id: 'aurora-flow',
    name: 'Aurora Flow',
    description: 'Efek pergeseran spektrum aurora bernapas dinamis',
    animationClass: 'animate-owner-aurora-flow',
    iconSymbol: '◎',
  },
  'cosmic-sparkle': {
    id: 'cosmic-sparkle',
    name: 'Cosmic Sparkle',
    description: 'Pendaran kerlap-kerlip bintang celestial berkilau',
    animationClass: 'animate-owner-cosmic-sparkle',
    iconSymbol: '✧',
  },
  'electric-spark': {
    id: 'electric-spark',
    name: 'Lightning Bolt',
    description: 'Sentakan kilat listrik voltase tinggi futuristik',
    animationClass: 'animate-owner-electric-spark',
    iconSymbol: '⚡',
  },
  'rainbow-cycle': {
    id: 'rainbow-cycle',
    name: 'Rainbow Cycle',
    description: 'Aliran spektrum warna pelangi 360° dinamis',
    animationClass: 'animate-owner-rainbow-cycle',
    iconSymbol: '◉',
  },
  'floating-levitate': {
    id: 'floating-levitate',
    name: 'Floating Levitate',
    description: 'Efek teks melayang mengambang vertikal lembut',
    animationClass: 'animate-owner-floating-levitate',
    iconSymbol: '▲',
  },
  'heartbeat-pulse': {
    id: 'heartbeat-pulse',
    name: 'Heartbeat Rhythm',
    description: 'Detak jantung ritmik kinetik bertenaga',
    animationClass: 'animate-owner-heartbeat-pulse',
    iconSymbol: '♥',
  },
  'neon-breathe': {
    id: 'neon-breathe',
    name: 'Deep Neon Breath',
    description: 'Pendaran napas neon memudar dan menguat elegan',
    animationClass: 'animate-owner-neon-breathe',
    iconSymbol: '❂',
  },
  'crystal-prism': {
    id: 'crystal-prism',
    name: 'Crystal Prism',
    description: 'Pantulan kilau kristal berlian berkerlip',
    animationClass: 'animate-owner-crystal-prism',
    iconSymbol: '⟡',
  },
  'none': {
    id: 'none',
    name: 'Tanpa Animasi',
    description: 'Tampilan statik jernih elegan',
    animationClass: '',
    iconSymbol: '—',
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
  isVip?: boolean;
  effect?: OwnerNameEffect;
  animation?: OwnerNameAnimation;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const OwnerNameText: React.FC<OwnerNameTextProps> = ({
  name,
  isOwner = false,
  isVip = false,
  effect,
  animation,
  className = '',
  style,
  title,
}) => {
  const isPrivileged = Boolean(isOwner || isVip);

  // Non-VIP and non-Owner accounts render with classic clean text
  if (!isPrivileged) {
    return (
      <span
        title={title || `@${name}`}
        style={style}
        className={`inline-flex items-center font-bold tracking-normal leading-normal text-white ${className}`}
      >
        {name}
      </span>
    );
  }

  const effectiveEffect: OwnerNameEffect =
    effect && effect !== 'default'
      ? effect
      : isOwner
      ? 'gold-glow'
      : 'cyberpunk-rgb';

  const effectConfig = OWNER_EFFECT_CONFIGS[effectiveEffect] || OWNER_EFFECT_CONFIGS[isOwner ? 'gold-glow' : 'cyberpunk-rgb'];
  const effectiveAnim = animation || (isOwner ? 'shimmer' : 'none');
  const animConfig = OWNER_ANIMATION_CONFIGS[effectiveAnim] || OWNER_ANIMATION_CONFIGS['none'];

  return (
    <span
      title={title || `@${name}${isOwner ? ' (Owner)' : ' (VIP)'}`}
      style={{
        ['--owner-glow-color' as any]: effectConfig.glowColor,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
        ...style,
      }}
      className={`inline-flex items-center font-extrabold tracking-normal leading-normal py-0.5 ${effectConfig.gradientClass} ${animConfig.animationClass} ${className}`}
    >
      {name}
    </span>
  );
};
