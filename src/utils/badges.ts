export interface OwnerBadgeDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  iconPath: string;
  glowColor: string;
  borderColor: string;
  gradientBadge: string;
  rarity: 'Mythic' | 'Legendary' | 'Godly' | 'Custom VIP';
  isCustom?: boolean;
}

export const OWNER_BADGES: OwnerBadgeDefinition[] = [
  {
    id: 'owner_crown',
    name: 'Mahkota Sovereign',
    title: 'Sovereign Emperor',
    description: 'Mahkota emas murni bertahtakan safir biru kaisar Wayground.',
    iconPath: '/icons/owner_crown.svg',
    glowColor: '#f59e0b',
    borderColor: 'border-amber-400',
    gradientBadge: 'from-amber-400 via-yellow-500 to-amber-600',
    rarity: 'Godly',
  },
  {
    id: 'obsidian_shield',
    name: 'Perisai Aegis Titanium',
    title: 'Aegis Guardian',
    description: 'Perisai kegelapan obsidian berlapis emas anti-tembus peluru.',
    iconPath: '/icons/obsidian_shield.svg',
    glowColor: '#38bdf8',
    borderColor: 'border-sky-400',
    gradientBadge: 'from-slate-900 via-sky-600 to-amber-500',
    rarity: 'Mythic',
  },
  {
    id: 'cyber_matrix',
    name: 'Matrix Core Overlord',
    title: 'Cyber Overlord',
    description: 'Inti heksagonal cybernetic dengan sirkuit tegangan ultra-tinggi.',
    iconPath: '/icons/cyber_matrix.svg',
    glowColor: '#00f0ff',
    borderColor: 'border-cyan-400',
    gradientBadge: 'from-cyan-400 via-teal-500 to-blue-600',
    rarity: 'Legendary',
  },
  {
    id: 'deep_purple_orb',
    name: 'Singularitas Void Cosmic',
    title: 'Void Monarch',
    description: 'Portal singularitas ungu ultraviolet penguasa dimensi gelap.',
    iconPath: '/icons/deep_purple_orb.svg',
    glowColor: '#c084fc',
    borderColor: 'border-purple-400',
    gradientBadge: 'from-purple-500 via-fuchsia-500 to-violet-700',
    rarity: 'Godly',
  },
  {
    id: 'crimson_dragon',
    name: 'Naga Api Darah Crimson',
    title: 'Crimson Warlord',
    description: 'Lambang kobaran api naga merah delima yang tak pernah padam.',
    iconPath: '/icons/crimson_dragon.svg',
    glowColor: '#ff1a40',
    borderColor: 'border-rose-500',
    gradientBadge: 'from-rose-500 via-red-600 to-rose-800',
    rarity: 'Mythic',
  },
  {
    id: 'celestial_star',
    name: 'Bintang Nova Celestial',
    title: 'Celestial Deity',
    description: 'Pancaran 8 sudut aurora zamrud dan berlian kosmos.',
    iconPath: '/icons/celestial_star.svg',
    glowColor: '#10b981',
    borderColor: 'border-emerald-400',
    gradientBadge: 'from-emerald-400 via-cyan-400 to-teal-500',
    rarity: 'Legendary',
  },
  {
    id: 'quantum_infinity',
    name: 'Cincin Infinity Quantum',
    title: 'Quantum Nexus',
    description: 'Gelung tanpa batas pembias spektrum prisma tak terhingga.',
    iconPath: '/icons/quantum_infinity.svg',
    glowColor: '#ec4899',
    borderColor: 'border-pink-400',
    gradientBadge: 'from-pink-500 via-purple-500 to-indigo-500',
    rarity: 'Mythic',
  },
  {
    id: 'valkyrie_wings',
    name: 'Sayap Emas Valkyrie',
    title: 'Valkyrie Prime',
    description: 'Sayap suci malaikat tempur pelindung tahta tertinggi.',
    iconPath: '/icons/valkyrie_wings.svg',
    glowColor: '#facc15',
    borderColor: 'border-yellow-400',
    gradientBadge: 'from-yellow-300 via-amber-500 to-yellow-600',
    rarity: 'Godly',
  },
];

export function getOwnerBadge(badgeId?: string): OwnerBadgeDefinition | undefined {
  if (!badgeId) return undefined;
  
  // Custom uploaded photo badge support
  const isCustomImage =
    badgeId.startsWith('data:image/') ||
    badgeId.startsWith('http://') ||
    badgeId.startsWith('https://') ||
    badgeId.startsWith('blob:') ||
    badgeId.startsWith('/custom-badges/') ||
    badgeId.startsWith('custom-badges/') ||
    badgeId.startsWith('custom:') ||
    /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(badgeId);

  if (isCustomImage) {
    let rawUrl = badgeId;
    if (badgeId.startsWith('custom:')) {
      rawUrl = badgeId.slice(7);
    } else if (badgeId.startsWith('custom-badges/')) {
      rawUrl = `/${badgeId}`;
    } else if (!badgeId.startsWith('/') && !badgeId.startsWith('http') && !badgeId.startsWith('data:') && !badgeId.startsWith('blob:')) {
      rawUrl = `/custom-badges/${badgeId}`;
    }

    const filename = rawUrl.split('/').pop() || 'custom';
    const friendlyName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/^[0-9_]+/, '')
      .replace(/^badge_[^_]+_/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    return {
      id: badgeId,
      name: friendlyName ? `Foto Kustom: ${friendlyName}` : 'Foto Kustom Owner VIP',
      title: 'Custom Sovereign Emblem',
      description: 'Badge foto/gambar kustom eksklusif yang diunggah ke folder public/custom-badges.',
      iconPath: rawUrl,
      glowColor: '#fbbf24',
      borderColor: 'border-amber-400',
      gradientBadge: 'from-amber-400 via-yellow-500 to-amber-600',
      rarity: 'Custom VIP',
      isCustom: true,
    };
  }

  return OWNER_BADGES.find((b) => b.id === badgeId) || OWNER_BADGES[0];
}
