export interface OwnerBadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  glowColor: string;
  rarity: 'Legendary' | 'Mythic' | 'Exotic' | 'Divine';
  borderColor: string;
  bgGradient: string;
}

export const OWNER_BADGES: OwnerBadgeDefinition[] = [
  {
    id: 'crown-gold',
    name: 'Imperial Gold Crown',
    description: 'Mahkota Emas Tertinggi Penguasa Tahta Wayground',
    iconUrl: '/icons/crown-gold.svg',
    glowColor: '#eab308',
    rarity: 'Divine',
    borderColor: 'border-amber-400/80',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
  },
  {
    id: 'verified-badge',
    name: 'Master Founder',
    description: 'Lencana Verifikasi Resmi Pendiri Platform',
    iconUrl: '/icons/verified-badge.svg',
    glowColor: '#facc15',
    rarity: 'Divine',
    borderColor: 'border-yellow-400/80',
    bgGradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
  },
  {
    id: 'flame-phoenix',
    name: 'Phoenix Crimson Fire',
    description: 'Kobaran Api Abadi Burung Phoenix yang Tak Pernah Padam',
    iconUrl: '/icons/flame-phoenix.svg',
    glowColor: '#f97316',
    rarity: 'Mythic',
    borderColor: 'border-orange-500/80',
    bgGradient: 'from-orange-500/20 via-red-500/10 to-transparent',
  },
  {
    id: 'shield-cyber',
    name: 'Cyber Aegis Matrix',
    description: 'Perisai Pertahanan Digital Berteknologi Cyber Quantum',
    iconUrl: '/icons/shield-cyber.svg',
    glowColor: '#06b6d4',
    rarity: 'Exotic',
    borderColor: 'border-cyan-400/80',
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  },
  {
    id: 'lightning-god',
    name: 'God of Thunder',
    description: 'Sumpah Petir Emas Murni Kecepatan Kilat Para Dewa',
    iconUrl: '/icons/lightning-god.svg',
    glowColor: '#fde047',
    rarity: 'Mythic',
    borderColor: 'border-yellow-300/80',
    bgGradient: 'from-yellow-400/20 via-amber-600/10 to-transparent',
  },
  {
    id: 'diamond-star',
    name: 'Astral Diamond Star',
    description: 'Bintang Berlian Kosmik Bintang Kejora Galaksi',
    iconUrl: '/icons/diamond-star.svg',
    glowColor: '#38bdf8',
    rarity: 'Legendary',
    borderColor: 'border-sky-400/80',
    bgGradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
  },
  {
    id: 'skull-reaper',
    name: 'Void Shadow Reaper',
    description: 'Kekuatan Bayangan Hitam Nether Pengendali Kehampaan',
    iconUrl: '/icons/skull-reaper.svg',
    glowColor: '#a855f7',
    rarity: 'Mythic',
    borderColor: 'border-purple-500/80',
    bgGradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
  },
  {
    id: 'dragon-emperor',
    name: 'Dragon Emperor',
    description: 'Lambang Raja Naga Darah Penguasa Wilayah Tempur',
    iconUrl: '/icons/dragon-emperor.svg',
    glowColor: '#ef4444',
    rarity: 'Divine',
    borderColor: 'border-red-500/80',
    bgGradient: 'from-red-500/20 via-rose-600/10 to-transparent',
  },
];

export function getOwnerBadge(id?: string | null): OwnerBadgeDefinition {
  if (!id) return OWNER_BADGES[0];
  const found = OWNER_BADGES.find((b) => b.id === id || b.iconUrl === id);
  return found || OWNER_BADGES[0];
}
