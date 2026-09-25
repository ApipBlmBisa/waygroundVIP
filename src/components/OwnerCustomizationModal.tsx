import React, { useState, useRef, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Palette,
  X,
  Check,
  FolderOpen,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  Wand2,
  Smile,
  Activity,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { UserProfile, OwnerNameEffect, OwnerNameAnimation, CustomBadgeItem } from '../types';
import {
  OwnerNameText,
  OWNER_EFFECT_CONFIGS,
  OWNER_ANIMATION_CONFIGS,
  getDeterministicEffectForUsername,
} from './OwnerNameText';
import { OwnerBadge } from './OwnerBadge';
import { UserAvatar } from './UserAvatar';
import { OWNER_BADGES, getOwnerBadge } from '../utils/badges';
import { updateOwnerStyle, fetchCustomBadges } from '../utils/api';

interface OwnerCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export const OwnerCustomizationModal: React.FC<OwnerCustomizationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  if (!isOpen) return null;

  const isOwner = Boolean(currentUser.isOwner);

  const [activeTab, setActiveTab] = useState<'name_effects' | 'badges'>('name_effects');
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username);
  const [selectedEffect, setSelectedEffect] = useState<OwnerNameEffect>(
    currentUser.ownerNameEffect || (isOwner ? 'gold-glow' : getDeterministicEffectForUsername(currentUser.username))
  );
  const [selectedAnimation, setSelectedAnimation] = useState<OwnerNameAnimation>(
    currentUser.ownerNameAnimation || (isOwner ? 'shimmer' : 'none')
  );
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(
    currentUser.activeBadgeId || (isOwner ? 'owner_crown' : '')
  );

  const [customBadgesList, setCustomBadgesList] = useState<CustomBadgeItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName || currentUser.username);
    setSelectedEffect(
      currentUser.ownerNameEffect ||
        (isOwner ? 'gold-glow' : getDeterministicEffectForUsername(currentUser.username))
    );
    setSelectedAnimation(currentUser.ownerNameAnimation || (isOwner ? 'shimmer' : 'none'));
    setSelectedBadgeId(currentUser.activeBadgeId || (isOwner ? 'owner_crown' : ''));
    if (isOwner) {
      loadFolderBadges();
    }
  }, [currentUser, isOpen, isOwner]);

  const loadFolderBadges = async () => {
    try {
      const res = await fetchCustomBadges();
      if (res.success && res.badges) {
        setCustomBadgesList(res.badges);
      }
    } catch {
      // ignore
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap pilih file gambar (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 2.5MB');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setSelectedBadgeId(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMessage('Nama profil tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const res = await updateOwnerStyle(currentUser.username, {
      displayName: displayName.trim().slice(0, 30),
      ownerNameEffect: selectedEffect,
      ownerNameAnimation: selectedAnimation,
      activeBadgeId: isOwner ? selectedBadgeId : undefined,
    });

    setIsSaving(false);

    if (res.success && res.user) {
      setSaveSuccess(true);
      onProfileUpdated(res.user);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.message || 'Gagal menyimpan pengaturan ke server');
    }
  };

  const handleResetToDefault = () => {
    if (isOwner) {
      setSelectedEffect('gold-glow');
      setSelectedAnimation('shimmer');
      setSelectedBadgeId('owner_crown');
    } else {
      setSelectedEffect(getDeterministicEffectForUsername(currentUser.username));
      setSelectedAnimation('none');
    }
    setDisplayName(currentUser.username);
  };

  const activeBadgeDef = isOwner ? getOwnerBadge(selectedBadgeId) : null;

  // List of all 13 distinct color presets
  const availableEffects: OwnerNameEffect[] = [
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
    'default',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Unified scrollable modal matching PvP Setting Modal (continuous scroll) */}
      <div
        className={`w-full max-w-[340px] sm:max-w-[370px] glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-2xl relative transition-all duration-300 bg-slate-900/95 backdrop-blur-xl my-auto max-h-[92vh] overflow-y-auto custom-scrollbar ${
          isOwner ? 'border-amber-500/40 shadow-amber-950/40' : 'border-purple-500/40 shadow-purple-950/40'
        }`}
      >
        {/* Glow ambient decoration inside card */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12 ${
            isOwner ? 'bg-amber-500/15' : 'bg-purple-500/20'
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12 ${
            isOwner ? 'bg-purple-500/15' : 'bg-cyan-500/15'
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors border border-white/10"
          title="Tutup"
        >
          ✕
        </button>

        {/* Top Icon Badge */}
        <div className="flex justify-center mb-2 mt-0.5 relative z-10">
          <div
            className={`w-12 h-12 rounded-2xl p-1 shadow-lg flex items-center justify-center border ${
              isOwner
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-amber-300/70 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
            }`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-[14px]" />
              {isOwner ? (
                <Crown className="w-6 h-6 text-amber-300 fill-amber-400/25 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] stroke-[2.2] animate-pulse relative z-10" />
              ) : (
                <Sparkles className="w-6 h-6 text-purple-300 fill-purple-400/25 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] stroke-[2.2] relative z-10" />
              )}
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-0.5 mb-3 relative z-10">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
              isOwner
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-purple-500/15 border-purple-500/40 text-purple-300'
            }`}
          >
            {isOwner ? (
              <>
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                <span>Fitur Khusus Owner</span>
              </>
            ) : (
              <>
                <Palette className="w-2.5 h-2.5 text-purple-400" />
                <span>Pengaturan per Username</span>
              </>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-display">
            {isOwner ? 'Pengaturan Gaya Owner' : 'Pengaturan Warna Nama'}
          </h2>
          <p className="text-[10px] text-slate-300 leading-relaxed px-1">
            Warna nama tersimpan untuk <b>@{currentUser.username}</b> & tampil unik di seluruh web
          </p>
        </div>

        {/* Live Preview Box */}
        <div
          className={`mb-3 p-3 rounded-2xl border shadow-inner relative z-10 space-y-1.5 ${
            isOwner
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-950/90 to-purple-950/30 border-amber-500/30'
              : 'bg-gradient-to-r from-purple-950/40 via-slate-950/90 to-indigo-950/30 border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span
              className={`flex items-center gap-1 font-bold uppercase tracking-wider ${
                isOwner ? 'text-amber-400' : 'text-purple-300'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Pratinjau Nama
            </span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset ke warna awal"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar avatar={currentUser.avatar} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <OwnerNameText
                    name={displayName || currentUser.username}
                    isOwner={isOwner}
                    effect={selectedEffect}
                    animation={selectedAnimation}
                    className="text-sm sm:text-base font-black"
                  />
                  {isOwner && (
                    <OwnerBadge
                      isOwner={true}
                      badgeId={selectedBadgeId}
                      size="sm"
                      showLabel
                    />
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">@{currentUser.username}</p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold flex items-center gap-1">
                <Activity className="w-2 h-2" /> Live
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection (Always visible for Owner; shown if owner or available) */}
        {isOwner && (
          <div className="flex bg-slate-950/80 p-1 rounded-xl mb-3 border border-slate-800 relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab('name_effects')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'name_effects'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Warna & Efek</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Badge & Foto</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Settings Body - Continuous Scrolling with Entire Modal */}
        <div className="space-y-3.5 relative z-10">
          {activeTab === 'name_effects' || !isOwner ? (
            /* TAB 1: NAMA TAMPILAN & PILIHAN WARNA NAMA PER USERNAME */
            <>
              {/* Field: Display Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <label className="flex items-center gap-1 text-[11px]">
                    <Smile className={`w-3 h-3 ${isOwner ? 'text-amber-400' : 'text-purple-400'}`} />
                    Nama Tampilan
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {displayName.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                  placeholder="Ketik nama tampilan Anda"
                  className={`w-full px-3 py-2 rounded-xl bg-slate-950/80 border text-white font-bold text-xs outline-none transition-all placeholder:text-slate-600 ${
                    isOwner
                      ? 'border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20'
                      : 'border-slate-700/80 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20'
                  }`}
                />
              </div>

              {/* Opsi Warna & Gradien Nama */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Palette className={`w-3 h-3 ${isOwner ? 'text-amber-400' : 'text-purple-400'}`} />
                    Pilihan Warna & Gradien ({availableEffects.length})
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">Bebas Dipilih</span>
                </div>

                <div className="space-y-1.5">
                  {availableEffects.map((effId) => {
                    const cfg = OWNER_EFFECT_CONFIGS[effId];
                    const isSelected = selectedEffect === effId;

                    return (
                      <button
                        key={effId}
                        type="button"
                        onClick={() => setSelectedEffect(effId)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? isOwner
                              ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/60'
                              : 'bg-purple-950/30 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)] ring-1 ring-purple-400/60'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black ${cfg.gradientClass}`}>
                              {cfg.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {cfg.description}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? isOwner
                                  ? 'bg-amber-400 border-amber-400 text-slate-950 shadow'
                                  : 'bg-purple-400 border-purple-400 text-slate-950 shadow'
                                : 'border-slate-700 bg-slate-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Efek Animasi CSS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <Wand2 className={`w-3 h-3 ${isOwner ? 'text-amber-400' : 'text-purple-400'}`} />
                  Efek Animasi Visual
                </label>

                <div className="space-y-1.5">
                  {(
                    ['none', 'shimmer', 'neon-glow', 'pulse-wave'] as OwnerNameAnimation[]
                  ).map((animId) => {
                    const animCfg = OWNER_ANIMATION_CONFIGS[animId];
                    const isSelected = selectedAnimation === animId;

                    return (
                      <button
                        key={animId}
                        type="button"
                        onClick={() => setSelectedAnimation(animId)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? isOwner
                              ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/60'
                              : 'bg-purple-950/30 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)] ring-1 ring-purple-400/60'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{animCfg.iconSymbol}</span>
                            <span className="text-xs font-bold text-white">
                              {animCfg.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {animCfg.description}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? isOwner
                                  ? 'bg-amber-400 border-amber-400 text-slate-950 shadow'
                                  : 'bg-purple-400 border-purple-400 text-slate-950 shadow'
                                : 'border-slate-700 bg-slate-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: PILIHAN BADGE & UNGGAH FOTO KUSTOM (OWNER ONLY) */
            <>
              {/* Upload Photo Button */}
              <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200">Foto / Logo Khusus</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    Maks 2.5MB
                  </span>
                </div>

                <p className="text-[10px] text-slate-300">
                  Gunakan foto profil asli Anda atau logo eksklusif sebagai lencana Owner.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Galeri</span>
                  </button>

                  {selectedBadgeId.startsWith('data:image/') && (
                    <button
                      type="button"
                      onClick={() => setSelectedBadgeId('owner_crown')}
                      className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Hapus foto kustom"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {selectedBadgeId.startsWith('data:image/') && (
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-amber-400/40 flex items-center gap-2.5">
                    <img
                      src={selectedBadgeId}
                      alt="Pratinjau"
                      className="w-8 h-8 rounded-lg object-cover border border-amber-400/60"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-white block truncate">
                        Foto Kustom Terpilih
                      </span>
                      <span className="text-[9px] text-emerald-400">Siap disimpan</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Built-in Badges List */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Lencana Eksklusif Owner
                </label>

                <div className="space-y-1.5">
                  {OWNER_BADGES.map((badge) => {
                    const isSelected = selectedBadgeId === badge.id;

                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setSelectedBadgeId(badge.id)}
                        className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/60'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="shrink-0">
                            <OwnerBadge isOwner={true} badgeId={badge.id} size="sm" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {badge.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate">
                              {badge.description}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow'
                                : 'border-slate-700 bg-slate-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Folder Badges from public/custom-badges if any */}
              {customBadgesList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3 text-amber-400" />
                    Lencana Folder Server
                  </label>

                  <div className="space-y-1.5">
                    {customBadgesList.map((cb) => {
                      const isSelected = selectedBadgeId === cb.url;

                      return (
                        <div
                          key={cb.id}
                          onClick={() => setSelectedBadgeId(cb.url)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                            <img
                              src={cb.url}
                              alt={cb.name}
                              className="w-5 h-5 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-bold text-white truncate">{cb.name}</h5>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {cb.sizeFormatted}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="shrink-0 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Action Buttons */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                  isOwner
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:brightness-110 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    {isOwner ? (
                      <Crown className="w-3.5 h-3.5 fill-current opacity-70" />
                    ) : (
                      <Palette className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan Warna Nama</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tersimpan per username & aktif di seluruh web</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
