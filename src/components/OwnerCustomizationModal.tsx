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
  Star,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, OwnerNameEffect, OwnerNameAnimation, CustomBadgeItem } from '../types';
import {
  OwnerNameText,
  OWNER_EFFECT_CONFIGS,
  OWNER_ANIMATION_CONFIGS,
  getDeterministicEffectForUsername,
} from './OwnerNameText';
import { OwnerBadge, VipBadge } from './OwnerBadge';
import { UserAvatar } from './UserAvatar';
import { OWNER_BADGES, getOwnerBadge } from '../utils/badges';
import {
  updateOwnerStyle,
  fetchCustomBadges,
  activateVipStatus,
  fetchVipPassword,
  updateVipPassword,
} from '../utils/api';

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
  const isVip = Boolean(currentUser.isVip || currentUser.isOwner);

  const [activeTab, setActiveTab] = useState<'name_effects' | 'badges'>('name_effects');
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.username);
  const [selectedEffect, setSelectedEffect] = useState<OwnerNameEffect>(
    currentUser.ownerNameEffect || (isOwner ? 'gold-glow' : isVip ? 'cyberpunk-rgb' : getDeterministicEffectForUsername(currentUser.username))
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

  // VIP Activation State (for regular users)
  const [vipCodeInput, setVipCodeInput] = useState('');
  const [showVipInputPass, setShowVipInputPass] = useState(false);
  const [isActivatingVip, setIsActivatingVip] = useState(false);
  const [vipSuccessMessage, setVipSuccessMessage] = useState<string | null>(null);

  // Owner VIP Password Management State
  const [currentVipPassword, setCurrentVipPassword] = useState('VIP123');
  const [newVipPasswordInput, setNewVipPasswordInput] = useState('VIP123');
  const [isUpdatingVipPass, setIsUpdatingVipPass] = useState(false);
  const [vipPassFeedback, setVipPassFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName || currentUser.username);
    setSelectedEffect(
      currentUser.ownerNameEffect ||
        (isOwner ? 'gold-glow' : isVip ? 'cyberpunk-rgb' : getDeterministicEffectForUsername(currentUser.username))
    );
    setSelectedAnimation(currentUser.ownerNameAnimation || (isOwner ? 'shimmer' : 'none'));
    setSelectedBadgeId(currentUser.activeBadgeId || (isOwner ? 'owner_crown' : ''));
    if (isOwner) {
      loadFolderBadges();
      fetchVipPassword(currentUser.username).then((res) => {
        if (res.success && res.vipPassword) {
          setCurrentVipPassword(res.vipPassword);
          setNewVipPasswordInput(res.vipPassword);
        }
      });
    }
  }, [currentUser, isOpen, isOwner, isVip]);

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

  const handleActivateVip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = vipCodeInput.trim();
    if (!code) {
      setErrorMessage('Password VIP wajib diisi untuk mengaktifkan VIP!');
      return;
    }
    setIsActivatingVip(true);
    setErrorMessage(null);
    try {
      const res = await activateVipStatus(currentUser.username, code);
      if (res.success && res.user) {
        setVipSuccessMessage(res.message || 'Selamat! Akun Anda kini berstatus VIP Wayground!');
        onProfileUpdated(res.user);
        setVipCodeInput('');
        setTimeout(() => {
          setVipSuccessMessage(null);
        }, 4000);
      } else {
        setErrorMessage(res.message || 'Password VIP tidak valid. Periksa kembali password Anda.');
      }
    } catch {
      setErrorMessage('Terjadi gangguan saat memverifikasi password VIP');
    } finally {
      setIsActivatingVip(false);
    }
  };

  const handleUpdateVipPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = newVipPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 3) {
      setErrorMessage('Password VIP minimal 3 karakter');
      return;
    }
    setIsUpdatingVipPass(true);
    setVipPassFeedback(null);
    try {
      const res = await updateVipPassword(currentUser.username, cleanPass);
      if (res.success && res.vipPassword) {
        setCurrentVipPassword(res.vipPassword);
        setVipPassFeedback(res.message || 'Password VIP berhasil diperbarui!');
        setTimeout(() => setVipPassFeedback(null), 3500);
      } else {
        setErrorMessage(res.message || 'Gagal mengubah password VIP');
      }
    } catch {
      setErrorMessage('Terjadi gangguan saat menyimpan password VIP baru');
    } finally {
      setIsUpdatingVipPass(false);
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
    } else if (isVip) {
      setSelectedEffect('cyberpunk-rgb');
      setSelectedAnimation('none');
    } else {
      setSelectedEffect(getDeterministicEffectForUsername(currentUser.username));
      setSelectedAnimation('none');
    }
    setDisplayName(currentUser.username);
  };

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
          isOwner
            ? 'border-amber-500/40 shadow-amber-950/40'
            : isVip
            ? 'border-purple-500/40 shadow-purple-950/40'
            : 'border-slate-700/60 shadow-slate-950/40'
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
                : isVip
                ? 'bg-gradient-to-br from-purple-500 via-indigo-600 to-amber-400 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'bg-gradient-to-br from-slate-700 via-slate-800 to-purple-900 border-purple-400/30'
            }`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-[14px]" />
              {isOwner ? (
                <Crown className="w-6 h-6 text-amber-300 fill-amber-400/25 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] stroke-[2.2] animate-pulse relative z-10" />
              ) : isVip ? (
                <Star className="w-6 h-6 text-amber-300 fill-amber-300/40 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] stroke-[2.2] animate-pulse relative z-10" />
              ) : (
                <Sparkles className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] relative z-10" />
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
                : isVip
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isOwner ? (
              <>
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                <span>Fitur Khusus Owner</span>
              </>
            ) : isVip ? (
              <>
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                <span>Member VIP Aktif</span>
              </>
            ) : (
              <>
                <Sparkles className="w-2.5 h-2.5 text-slate-400" />
                <span>Kustomisasi Nama Profil</span>
              </>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-display">
            {isOwner ? 'Pengaturan Gaya Owner' : isVip ? 'Warna Nama VIP' : 'Kustomisasi Nama Profil'}
          </h2>
          <p className="text-[10px] text-slate-300 leading-relaxed px-1">
            {isOwner
              ? 'Kustomisasi nama tampilan, warna emas, & lencana khusus akun Owner'
              : isVip
              ? 'Kustomisasi nama tampilan & warna neon VIP aktif di seluruh web'
              : 'Ganti nama tampilan profil Anda secara gratis. Fitur Warna Teks Neon & Animasi khusus untuk Member VIP!'}
          </p>
        </div>

        {/* Live Preview Box */}
        <div
          className={`mb-3 p-3 rounded-2xl border shadow-inner relative z-10 space-y-1.5 ${
            isOwner
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-950/90 to-purple-950/30 border-amber-500/30'
              : isVip
              ? 'bg-gradient-to-r from-purple-950/40 via-slate-950/90 to-indigo-950/30 border-purple-500/30'
              : 'bg-slate-950/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span
              className={`flex items-center gap-1 font-bold uppercase tracking-wider ${
                isOwner ? 'text-amber-400' : isVip ? 'text-purple-300' : 'text-slate-300'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Pratinjau Nama
            </span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset ke pengaturan awal"
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
                    isVip={isVip}
                    effect={selectedEffect}
                    animation={selectedAnimation}
                    className="text-sm sm:text-base font-black"
                  />
                  {isOwner ? (
                    <OwnerBadge
                      isOwner={true}
                      badgeId={selectedBadgeId}
                      size="sm"
                      showLabel
                    />
                  ) : isVip ? (
                    <VipBadge size="xs" showLabel />
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      Standar
                    </span>
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

        {/* Tab Selection (For Owner: Colors vs Custom Badges) */}
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

        {/* VIP Success Notification */}
        {vipSuccessMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{vipSuccessMessage}</span>
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
          {/* Field: Display Name (Available for ALL users: Akun Biasa, VIP, & Owner) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <label className="flex items-center gap-1 text-[11px]">
                <Smile className={`w-3.5 h-3.5 ${isOwner ? 'text-amber-400' : isVip ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Nama Tampilan (Custom Name)</span>
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
              maxLength={30}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950/80 border text-white font-bold text-xs outline-none transition-all placeholder:text-slate-600 ${
                isOwner
                  ? 'border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20'
                  : isVip
                  ? 'border-slate-700/80 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20'
                  : 'border-slate-700/80 focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20'
              }`}
            />
          </div>

          {activeTab === 'name_effects' || !isOwner ? (
            /* TAB 1: WARNA & EFEK NAMA */
            <>
              {isVip || isOwner ? (
                /* JIKA VIP ATAU OWNER: Bebas Pilih Seluruh 13 Warna & Efek Animasi */
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Palette className={`w-3 h-3 ${isOwner ? 'text-amber-400' : 'text-purple-400'}`} />
                        Pilihan Warna Nama VIP ({availableEffects.length})
                      </label>
                      <span className="text-[9px] text-purple-300 font-bold flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                        VIP UNLOCKED
                      </span>
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
                                {isSelected && (
                                  <span
                                    className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${cfg.badgePillClass}`}
                                  >
                                    Terpilih
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                                {cfg.description}
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: cfg.sampleTextColor }}
                              />
                              {isSelected && (
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-slate-950 ${
                                    isOwner ? 'bg-amber-400' : 'bg-purple-400'
                                  }`}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opsi Efek Animasi Nama Variatif */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Wand2 className={`w-3 h-3 ${isOwner ? 'text-amber-400' : 'text-purple-400'}`} />
                        Koleksi Efek Animasi Visual ({Object.keys(OWNER_ANIMATION_CONFIGS).length})
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {OWNER_ANIMATION_CONFIGS[selectedAnimation]?.name || 'Tanpa Animasi'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                      {Object.values(OWNER_ANIMATION_CONFIGS).map((anim) => {
                        const isSelected = selectedAnimation === anim.id;
                        return (
                          <button
                            key={anim.id}
                            type="button"
                            onClick={() => setSelectedAnimation(anim.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                              isSelected
                                ? isOwner
                                  ? 'bg-amber-950/50 border-amber-400 shadow-sm ring-1 ring-amber-400/60'
                                  : 'bg-purple-950/50 border-purple-400 shadow-sm ring-1 ring-purple-400/60'
                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[11px] font-bold flex items-center gap-1 truncate ${
                                  isSelected
                                    ? isOwner
                                      ? 'text-amber-300'
                                      : 'text-purple-300'
                                    : 'text-slate-200'
                                }`}
                              >
                                <span className="text-xs">{anim.iconSymbol}</span>
                                <span className="truncate">{anim.name}</span>
                              </span>
                              {isSelected && (
                                <Check
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isOwner ? 'text-amber-400' : 'text-purple-400'
                                  }`}
                                />
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5 truncate leading-tight">
                              {anim.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* VIP Active Badge for Users who have unlocked VIP */}
                  {isVip && !isOwner && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-400/40 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span className="text-xs font-bold text-white">Status: Member VIP Wayground Aktif</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold">
                          TERVERIFIKASI
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        Akun Anda telah berstatus VIP. Semua 13 warna neon nama, animasi teks, 4 Tema Eksklusif Sovereign & Royal Edition, serta lencana bintang VIP aktif!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* JIKA NON-VIP: Tampilkan Kunci VIP & Form Password VIP */
                <div className="space-y-3 pt-1">
                  {/* VIP Locked Banner & Password Box */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-950 border border-purple-500/50 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          <Lock className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <span>Warna & Animasi Khusus VIP</span>
                            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 inline-block" />
                          </span>
                          <span className="text-[10px] text-purple-200/80 block truncate">
                            Buka 13 Pilihan Warna Neon & 4 Tema Owner
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-900/60 text-amber-300 border border-purple-400/50 font-bold tracking-wide flex items-center gap-1 shrink-0 shadow-sm">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
                        <span>VIP ONLY</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Fitur gradasi warna nama berkilau dan efek animasi teks hanya dapat digunakan oleh <strong>Member VIP</strong>. Masukkan password VIP Anda untuk mengaktifkan seluruh warna nama dan tema eksklusif:
                    </p>

                    <form onSubmit={handleActivateVip} className="space-y-2">
                      <div className="relative">
                        <input
                          type={showVipInputPass ? 'text' : 'password'}
                          value={vipCodeInput}
                          onChange={(e) => setVipCodeInput(e.target.value)}
                          placeholder="Ketik password VIP di sini..."
                          className="w-full px-3 py-2 pr-20 rounded-xl bg-slate-900 border border-purple-500/40 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVipInputPass(!showVipInputPass)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-purple-300 hover:text-white px-2 py-0.5 rounded cursor-pointer"
                        >
                          {showVipInputPass ? 'Tutup' : 'Lihat'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isActivatingVip}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50 shadow-md"
                      >
                        {isActivatingVip ? (
                          'Memverifikasi...'
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                            <span>Aktifkan VIP & Buka Warna Nama</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Preview of Locked VIP Colors */}
                  <div className="space-y-1.5 opacity-60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        Pratinjau Koleksi Warna VIP ({availableEffects.length})
                      </label>
                      <span className="text-[9px] text-purple-400 font-medium">Terkunci VIP</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {availableEffects.slice(0, 6).map((effId) => {
                        const cfg = OWNER_EFFECT_CONFIGS[effId];
                        return (
                          <div
                            key={effId}
                            className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-1.5"
                          >
                            <span className={`text-[10px] font-bold ${cfg.gradientClass} truncate`}>
                              {cfg.name}
                            </span>
                            <Lock className="w-2.5 h-2.5 text-purple-400/80 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: LENCANA & FOTO OWNER (Eksklusif Akun Owner) */
            <>
              {/* Preset Badges Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Koleksi Lencana Resmi ({OWNER_BADGES.length})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OWNER_BADGES.map((b) => {
                    const isSelected = selectedBadgeId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBadgeId(b.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-left ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={b.iconPath}
                            alt={b.name}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[11px] font-bold text-white truncate">{b.name}</h5>
                          <span className="text-[9px] text-amber-300/80 font-mono block">
                            {b.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="shrink-0 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Foto Badge Sendiri */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  Upload Foto Badge Baru
                </label>
                <div className="p-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 text-center space-y-2">
                  <p className="text-[10px] text-slate-300">
                    Pilih logo, foto avatar, atau stiker transparan (PNG/SVG, maks 2.5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Pilih File Gambar
                  </button>
                </div>
              </div>

              {/* Folder Custom Badges */}
              {customBadgesList.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3 text-cyan-400" />
                    Badge dari Folder public ({customBadgesList.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {customBadgesList.map((cb) => {
                      const isSelected = selectedBadgeId === cb.url;
                      return (
                        <button
                          key={cb.id}
                          type="button"
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
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kelola Password VIP untuk Pengguna (Eksklusif Owner) */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Kelola Password VIP Pengguna
                  </label>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                    OWNER ONLY
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Ubah password yang digunakan pengguna lain untuk mengaktifkan status VIP & membuka Tema Owner.
                </p>

                {vipPassFeedback && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{vipPassFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateVipPassword} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newVipPasswordInput}
                      onChange={(e) => setNewVipPasswordInput(e.target.value)}
                      placeholder="Masukkan password VIP baru..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdatingVipPass}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isUpdatingVipPass ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Submit Action Buttons (Available for ALL users) */}
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
                    : isVip
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:brightness-110 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
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
                    ) : isVip ? (
                      <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isOwner ? 'Simpan Gaya Owner' : isVip ? 'Simpan Warna VIP' : 'Simpan Nama Profil'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tersimpan untuk @{currentUser.username} & aktif di seluruh web</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
