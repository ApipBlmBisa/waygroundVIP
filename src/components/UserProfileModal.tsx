import React, { useState, useEffect } from 'react';
import { UserProfile, TryoutHistoryItem, PvPHistoryItem, ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';
import { fetchUserProfile, registerUserProfile, updateOwnerBadge, fetchCustomBadges } from '../utils/api';
import { CustomBadgeItem } from '../types';
import { OWNER_BADGES, getOwnerBadge } from '../utils/badges';
import { OwnerBadge } from './OwnerBadge';
import { OwnerNameText } from './OwnerNameText';
import { OwnerCustomizationModal } from './OwnerCustomizationModal';
import {
  X,
  User,
  Swords,
  BookOpen,
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Award,
  BarChart2,
  Edit2,
  Save,
  LogOut,
  Crown,
  Sparkles,
  ShieldCheck,
  Check,
  Upload,
  Image as ImageIcon,
  Palette,
  Trash2,
  FolderOpen,
  RefreshCw,
  FolderCheck,
} from 'lucide-react';
import { UNIQUE_SYMBOLS, UserAvatar, getSymbolConfig } from './UserAvatar';

interface UserProfileModalProps {
  currentUser: UserProfile;
  isOpen?: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  theme?: ThemePreset;
  themeId?: ThemeId;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen = true,
  onClose,
  onProfileUpdated,
  onLogout,
  theme,
  themeId = 'cyber-purple',
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'tryout' | 'pvp' | 'badges'>('stats');
  const [profile, setProfile] = useState<UserProfile>(currentUser);
  const [tryoutHistory, setTryoutHistory] = useState<TryoutHistoryItem[]>([]);
  const [pvpHistory, setPvPHistory] = useState<PvPHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentTheme = theme || getThemePreset(themeId);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(currentUser.displayName);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);

  // Badge Customization
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(
    currentUser.activeBadgeId || 'owner_crown'
  );
  const [isSavingBadge, setIsSavingBadge] = useState(false);
  const [badgeSaveSuccess, setBadgeSaveSuccess] = useState(false);
  const [customBadgesList, setCustomBadgesList] = useState<CustomBadgeItem[]>([]);
  const [isLoadingFolderBadges, setIsLoadingFolderBadges] = useState(false);
  const [showOwnerCustomizer, setShowOwnerCustomizer] = useState(false);
  const customBadgeFileRef = React.useRef<HTMLInputElement>(null);

  const loadCustomBadges = async () => {
    setIsLoadingFolderBadges(true);
    try {
      const res = await fetchCustomBadges();
      if (res.success && res.badges) {
        setCustomBadgesList(res.badges);
      }
    } catch (e) {
      console.error('Failed to load custom badges:', e);
    } finally {
      setIsLoadingFolderBadges(false);
    }
  };

  const handleCustomBadgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      alert('Ukuran file maksimal 6MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        await handleSaveBadge(dataUrl);
        await loadCustomBadges();
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen === false) return;

    setIsLoading(true);
    fetchUserProfile(currentUser.username)
      .then((res) => {
        if (res.success && res.user) {
          setProfile(res.user);
          setEditDisplayName(res.user.displayName);
          setEditAvatar(res.user.avatar);
          if (res.user.activeBadgeId) {
            setSelectedBadgeId(res.user.activeBadgeId);
          }
          if (res.tryoutHistory) setTryoutHistory(res.tryoutHistory);
          if (res.pvpHistory) setPvPHistory(res.pvpHistory);
        }
      })
      .finally(() => setIsLoading(false));

    loadCustomBadges();
  }, [isOpen, currentUser.username]);

  if (isOpen === false) return null;

  const handleSaveEdit = async () => {
    setIsSaving(true);
    const res = await registerUserProfile(currentUser.username, editDisplayName, editAvatar, profile.isOwner, selectedBadgeId);
    setIsSaving(false);
    if (res.success && res.user) {
      setProfile(res.user);
      onProfileUpdated(res.user);
      setIsEditing(false);
    }
  };

  const handleSaveBadge = async (badgeId: string) => {
    setSelectedBadgeId(badgeId);
    setIsSavingBadge(true);
    setBadgeSaveSuccess(false);

    const res = await updateOwnerBadge(currentUser.username, badgeId);
    setIsSavingBadge(false);

    if (res.success && res.user) {
      setProfile(res.user);
      onProfileUpdated(res.user);
      setBadgeSaveSuccess(true);
      setTimeout(() => setBadgeSaveSuccess(false), 3000);
    }
  };

  const pvpWinrate =
    profile.pvpMatches > 0 ? Math.round((profile.pvpWins / profile.pvpMatches) * 100) : 0;

  const activeBadge = getOwnerBadge(profile.activeBadgeId || selectedBadgeId);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-2xl bg-slate-900 border ${currentTheme.cardBorderHighlight} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto relative transition-all duration-300`}>
        {/* Subtle Background Glow Orbs */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${currentTheme.ambientOrbs.orb1} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 ${currentTheme.ambientOrbs.orb2} rounded-full blur-3xl pointer-events-none -ml-20 -mb-20`} />

        {/* Modal Header Banner */}
        <div className={`p-5 sm:p-6 bg-gradient-to-r ${currentTheme.bgGradient} border-b border-white/10 relative z-10 shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar Symbol */}
            <div className="relative group">
              <div
                style={{
                  boxShadow: profile.isOwner
                    ? '0 0 35px rgba(251, 191, 36, 0.7), 0 0 10px rgba(245, 158, 11, 0.9)'
                    : `0 0 28px ${currentTheme.accentColor}60, 0 0 10px ${currentTheme.accentColor}`,
                  borderColor: profile.isOwner ? '#fbbf24' : currentTheme.accentColor,
                }}
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                  profile.isOwner
                    ? 'from-amber-400 via-yellow-500 to-amber-600'
                    : currentTheme.actionBtnGradient
                } p-1 shadow-lg flex items-center justify-center border relative`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <UserAvatar
                    avatar={isEditing ? editAvatar : profile.avatar}
                    size="lg"
                    showBadge={false}
                    className="text-3xl"
                    glow
                    matchTheme={!profile.isOwner}
                    accentColor={profile.isOwner ? '#fbbf24' : currentTheme.accentColor}
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1 sm:pt-7">
              {isEditing ? (
                <div className="space-y-2 mt-1">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Nama Tampilan"
                    style={{ borderColor: currentTheme.accentColor }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-bold w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                  <div className="flex flex-wrap gap-1 mt-1 justify-center sm:justify-start">
                    {UNIQUE_SYMBOLS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditAvatar(item.symbol)}
                        title={item.label}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all ${
                          editAvatar === item.symbol
                            ? `${item.bg} ${item.border} ${item.color} border-2 scale-110 shadow-sm ${currentTheme.accentGlowClass}`
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {item.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-2.5">
                    <div className="flex items-center gap-2">
                      <OwnerNameText
                        name={profile.displayName}
                        isOwner={profile.isOwner}
                        effect={profile.ownerNameEffect || 'gold-glow'}
                        animation={profile.ownerNameAnimation || 'shimmer'}
                        className="text-xl sm:text-2xl font-black"
                      />
                      {profile.isOwner && (
                        <OwnerBadge
                          badgeId={profile.activeBadgeId || 'owner_crown'}
                          isOwner={true}
                          size="md"
                          showLabel
                          showTitle
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Profil Dasar (Nama & Avatar)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {profile.isOwner ? (
                        <button
                          onClick={() => setShowOwnerCustomizer(true)}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all hover:scale-105 active:scale-95"
                          title="Buka Pengaturan Warna & Gaya Khusus Owner"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-400/20" />
                          <span>Gaya Owner</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowOwnerCustomizer(true)}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-400/50 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all hover:scale-105 active:scale-95"
                          title="Buka Pengaturan Warna & Gaya Nama Anda"
                        >
                          <Palette className="w-3.5 h-3.5 text-purple-400" />
                          <span>Warna Nama</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <p className={`text-xs sm:text-sm font-mono ${currentTheme.accentClass}`}>@{profile.username}</p>
                    {profile.isOwner && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        Hak Akses Owner
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons in edit mode */}
              {isEditing && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className={`px-3 py-1 rounded-lg bg-gradient-to-r ${currentTheme.actionBtnGradient} ${currentTheme.accentGlowClass} hover:brightness-110 text-white text-xs font-bold flex items-center gap-1 cursor-pointer`}
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditDisplayName(profile.displayName);
                      setEditAvatar(profile.avatar);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {/* Total Points Badge */}
            <div className={`px-4 py-2 rounded-2xl border text-center ${profile.isOwner ? 'bg-amber-950/60 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : currentTheme.badgeBgClass}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold block ${profile.isOwner ? 'text-amber-400' : currentTheme.accentClass}`}>Total Poin</span>
              <span className="text-xl font-black text-white">{profile.totalScore.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/60 px-4 sm:px-6 relative z-10 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('stats')}
            style={activeTab === 'stats' ? { borderColor: currentTheme.accentColor } : undefined}
            className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'stats'
                ? `${currentTheme.accentClass}`
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            style={activeTab === 'badges' ? { borderColor: '#fbbf24' } : undefined}
            className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'badges'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Badge Kustom {profile.isOwner && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black">OWNER</span>}</span>
          </button>

          <button
            onClick={() => setActiveTab('tryout')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'tryout'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Riwayat Tryout ({tryoutHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pvp')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pvp'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Riwayat PvP ({pvpHistory.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 relative z-10">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 border-3 border-current ${currentTheme.accentClass} border-t-transparent rounded-full animate-spin`} />
              <p className="text-xs font-semibold">Memuat data profil & riwayat...</p>
            </div>
          ) : activeTab === 'badges' ? (
            /* ========================================================= */
            /* TAB: KUSTOMISASI BADGE OWNER (PRESET & FOTO KUSTOM)       */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Header Box */}
              <div className={`p-4 rounded-2xl border ${
                profile.isOwner
                  ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg">
                      <Crown className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Kustomisasi Ikon & Badge Owner</span>
                        {profile.isOwner ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                            LOCKED (KHUSUS OWNER)
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {profile.isOwner
                          ? 'Pilih badge ikon kustom atau unggah foto badge Anda sendiri. Tersimpan ke database publik & tampil di Leaderboard!'
                          : 'Status Owner diperlukan untuk mengaktifkan dan menyimpan badge ke database publik.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {profile.isOwner && (
                      <button
                        type="button"
                        onClick={() => setShowOwnerCustomizer(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      >
                        <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950/20" />
                        <span>Kustomisasi Nama & Efek</span>
                      </button>
                    )}
                    {badgeSaveSuccess && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Tersimpan di Database Publik!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Photo Badge Upload Card (Folder / File Upload) */}
              {profile.isOwner && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-amber-950/30 border border-amber-500/30 shadow-lg relative overflow-hidden">
                  <input
                    type="file"
                    ref={customBadgeFileRef}
                    onChange={handleCustomBadgeUpload}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      {profile.activeBadgeId && (profile.activeBadgeId.startsWith('data:image/') || profile.activeBadgeId.startsWith('http') || profile.activeBadgeId.startsWith('/custom-badges/')) ? (
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                          <img
                            src={profile.activeBadgeId.startsWith('custom:') ? profile.activeBadgeId.slice(7) : profile.activeBadgeId}
                            alt="Custom Badge"
                            className="w-14 h-14 max-w-[56px] max-h-[56px] object-contain shrink-0"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-amber-400 shrink-0">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-0.5">Kustom</span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <h5 className="text-xs sm:text-sm font-black text-white">Unggah Foto Badge Kustom</h5>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            Folder / Storage
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 max-w-sm leading-snug">
                          Upload foto atau lambang kustom dari perangkat Anda (PNG, JPG, WebP, SVG). Gambar akan menjadi badge eksklusif berukuran besar!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => customBadgeFileRef.current?.click()}
                        disabled={isSavingBadge}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>{profile.activeBadgeId?.startsWith('data:image/') ? 'Ganti Foto' : 'Pilih Foto Badge'}</span>
                      </button>

                      {profile.activeBadgeId && (profile.activeBadgeId.startsWith('data:image/') || profile.activeBadgeId.startsWith('http')) && (
                        <button
                          type="button"
                          onClick={() => handleSaveBadge('owner_crown')}
                          title="Reset ke Mahkota Sovereign"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Badges Found in public/custom-badges/ Folder */}
              {profile.isOwner && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-400/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FolderCheck className="w-5 h-5 text-amber-400" />
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                          <span>File Badge di Folder public/custom-badges</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                            {customBadgesList.length} file terdeteksi
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Semua file gambar yang Anda masukkan ke direktori <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">public/custom-badges/</code> muncul otomatis di sini.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loadCustomBadges}
                      disabled={isLoadingFolderBadges}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingFolderBadges ? 'animate-spin' : ''}`} />
                      <span>Refresh Folder</span>
                    </button>
                  </div>

                  {customBadgesList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      Belum ada file kustom di folder <span className="text-slate-300 font-mono">public/custom-badges/</span>.
                    </div>
                  ) : (
                    <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {customBadgesList.map((cb) => {
                          const isEquipped =
                            profile.activeBadgeId === cb.url ||
                            profile.activeBadgeId === cb.id ||
                            profile.activeBadgeId === cb.filename ||
                            profile.activeBadgeId === `/custom-badges/${cb.filename}`;

                          return (
                            <div
                              key={cb.id}
                              onClick={() => handleSaveBadge(cb.url)}
                              style={{
                                borderColor: isEquipped ? '#fbbf24' : undefined,
                                boxShadow: isEquipped ? '0 0 20px rgba(251, 191, 36, 0.4)' : undefined,
                              }}
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                isEquipped
                                  ? 'bg-amber-950/40 border-amber-400 shadow-lg'
                                  : 'bg-slate-900/80 border-slate-800 hover:border-amber-400/50 hover:bg-slate-900'
                              }`}
                            >
                              {/* Raw Transparent Badge Preview */}
                              <div className="w-12 h-12 shrink-0 flex items-center justify-center relative">
                                <img
                                  src={cb.url}
                                  alt={cb.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-12 h-12 max-w-[48px] max-h-[48px] object-contain shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                {isEquipped && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h6 className="text-xs font-black text-white truncate font-mono">
                                    {cb.filename}
                                  </h6>
                                </div>
                                <p className="text-[10px] text-amber-300/90 font-medium truncate mt-0.5">
                                  {cb.name}
                                </p>
                                <div className="flex items-center justify-between gap-1 mt-1.5">
                                  <span className="text-[10px] text-slate-400 font-mono">{cb.sizeFormatted}</span>
                                  {isEquipped ? (
                                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                                      Aktif Dipakai ✓
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveBadge(cb.url);
                                      }}
                                      disabled={isSavingBadge}
                                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                                    >
                                      Pakai Badge
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Badges Grid - Preset Sovereign Icons */}
              <div className="pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Koleksi Preset Sovereign Badges</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {OWNER_BADGES.map((badge) => {
                  const isSelected = selectedBadgeId === badge.id;
                  const isEquipped = (profile.activeBadgeId || 'owner_crown') === badge.id;

                  return (
                    <div
                      key={badge.id}
                      onClick={() => profile.isOwner && handleSaveBadge(badge.id)}
                      style={{
                        borderColor: isSelected ? badge.glowColor : undefined,
                        boxShadow: isSelected ? `0 0 24px ${badge.glowColor}60` : undefined,
                      }}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex items-start gap-4 ${
                        profile.isOwner
                          ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]'
                          : 'opacity-70 cursor-not-allowed'
                      } ${
                        isSelected
                          ? 'bg-slate-950/95 border-2 shadow-xl'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Big Prominent Badge Icon */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className="absolute inset-0 rounded-full blur-[12px] opacity-70"
                          style={{ backgroundColor: badge.glowColor }}
                        />
                        <img
                          src={badge.iconPath}
                          alt={badge.name}
                          className="w-16 h-16 object-contain relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform hover:scale-110"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-sm font-black text-white truncate">{badge.name}</h5>
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider"
                            style={{
                              color: badge.glowColor,
                              backgroundColor: `${badge.glowColor}20`,
                              border: `1px solid ${badge.glowColor}40`,
                            }}
                          >
                            {badge.rarity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{badge.title}</p>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {badge.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          {isEquipped ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Sedang Dipakai
                            </span>
                          ) : profile.isOwner ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveBadge(badge.id);
                              }}
                              disabled={isSavingBadge}
                              className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            >
                              Gunakan Badge
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Terkunci</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            <div className="space-y-4">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Match Tryout</span>
                  <span className="text-xl font-black text-cyan-400">{profile.tryoutMatches}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Selesai dikerjakan</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Akurasi Tryout</span>
                  <span className="text-xl font-black text-emerald-400">{profile.tryoutAvgAccuracy}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Rata-rata benar</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duel PvP</span>
                  <span className="text-xl font-black text-amber-400">{profile.pvpMatches}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Total pertandingan</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Winrate PvP</span>
                  <span className={`text-xl font-black ${currentTheme.accentClass}`}>{pvpWinrate}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{profile.pvpWins}x Juara 1</p>
                </div>
              </div>

              {/* Mode Comparison Card */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award className={`w-4 h-4 ${currentTheme.accentClass}`} />
                  <span>Karakteristik & Prestasi Kuis</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-cyan-300 block flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Mode Tryout (Solo)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Pengerjaan mandiri untuk mengasah pemahaman materi dengan persentase kebenaran.
                    </p>
                    <div className="text-slate-400 text-[11px] pt-1">
                      Total dikerjakan: <b className="text-white">{profile.tryoutMatches} kuis</b>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                    <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5" /> Mode PvP (Multiplayer)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Pertandingan adu cepat dan akurasi melawan pemain lain secara real-time di room.
                    </p>
                    <div className="text-slate-400 text-[11px] pt-1">
                      Kemenangan Rank 1: <b className="text-amber-400">{profile.pvpWins} kali</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'tryout' ? (
            /* ========================================================= */
            /* TAB 1: RIWAYAT MODE TRYOUT                                 */
            /* ========================================================= */
            <div className="space-y-3">
              {tryoutHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">Belum Ada Riwayat Tryout</p>
                  <p className="text-xs text-slate-500 mt-1">Selesaikan kuis mandiri untuk mencatat riwayat dan akurasi di sini.</p>
                </div>
              ) : (
                tryoutHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase">
                          Tryout Solo
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{item.quizTitle}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-3">
                        <span className="text-emerald-400 font-semibold">
                          ✓ {item.correctCount}/{item.totalQuestions} Benar
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {item.timeSpentSeconds}s
                        </span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <span className="text-lg font-black text-cyan-400">
                        {item.score} <span className="text-xs font-normal text-slate-400">poin</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        Akurasi: {item.accuracy}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* TAB 2: RIWAYAT MODE PVP                                   */
            /* ========================================================= */
            <div className="space-y-3">
              {pvpHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Swords className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">Belum Ada Riwayat PvP</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Buat room atau gabung room multiplayer untuk menantang pemain lain!
                  </p>
                </div>
              ) : (
                pvpHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.rank === 1
                        ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                            item.rank === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {item.rank === 1 ? <Trophy className="w-3 h-3 text-amber-400" /> : <Users className="w-3 h-3" />}
                          Peringkat {item.rank} dari {item.totalPlayers} Pemain
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{item.quizTitle}</span>
                        <span className="text-[11px] font-mono text-purple-400 font-normal">({item.roomCode})</span>
                      </h4>

                      {/* Opponents List */}
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-slate-500">Lawan di room:</span>
                        {item.opponents && item.opponents.length > 0 ? (
                          item.opponents.map((opp) => (
                            <span
                              key={opp}
                              className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[11px] font-mono"
                            >
                              @{opp}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Tanpa lawan lain</span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <span className="text-lg font-black text-amber-400">
                        {item.score} <span className="text-xs font-normal text-slate-400">poin</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        Benar: {item.correctCount}/{item.totalQuestions}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Logout Action */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          {onLogout ? (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Keluar dari akun saat ini dan beralih ke username lain"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Ganti Akun / Logout</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {showOwnerCustomizer && (
        <OwnerCustomizationModal
          isOpen={showOwnerCustomizer}
          onClose={() => setShowOwnerCustomizer(false)}
          currentUser={profile}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            onProfileUpdated(updated);
          }}
        />
      )}
    </div>
  );
};
