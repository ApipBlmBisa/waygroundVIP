import React, { useState, useEffect } from 'react';
import { UserProfile, ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';
import { checkUsernameAvailability, registerUserProfile, setStoredUsername, fetchUserProfile } from '../utils/api';
import { User, CheckCircle2, AlertCircle, Sparkles, ArrowRight, LogIn, Crown } from 'lucide-react';
import { UNIQUE_SYMBOLS, getSymbolConfig } from './UserAvatar';

interface UserProfileSetupProps {
  onProfileCreated: (user: UserProfile) => void;
  theme?: ThemePreset;
  themeId?: ThemeId;
}

export const UserProfileSetup: React.FC<UserProfileSetupProps> = ({
  onProfileCreated,
  theme,
  themeId = 'cyber-purple',
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('✦');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    message: string;
    isSecretOwner?: boolean;
    cleanUsername?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secret dot owner detection
  const isSecretOwnerTriggered = username.trim().endsWith('.');
  const cleanUsernamePreview = username.trim().replace(/\.+$/, '').toLowerCase();

  // Apply active theme color and typography style here: dynamic theme properties
  const currentTheme = theme || getThemePreset(themeId);
  const selectedConf = getSymbolConfig(selectedAvatar);

  // Apply active theme color and typography style here: CSS variables for theme consistency
  const themeCssVariables = {
    '--theme-accent': currentTheme.accentColor,
    '--theme-secondary': currentTheme.secondaryColor,
    '--theme-panel-bg': currentTheme.panelBg,
    '--theme-card-bg': currentTheme.cardBg,
    '--theme-border': currentTheme.activeBorder,
    '--theme-glow': currentTheme.neonGlow,
  } as React.CSSProperties;

  // Debounce username check
  useEffect(() => {
    const raw = username.trim();
    const clean = raw.replace(/\.+$/, '');
    if (!clean || clean.length < 3) {
      setAvailability(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setAvailability({ available: false, message: 'Hanya huruf, angka, dan underscore (_)' });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(raw);
      setAvailability(res);
      setIsChecking(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleLoginExisting = async (cleanUsername: string, isOwnerTrigger: boolean) => {
    setIsSubmitting(true);
    setError(null);
    if (isOwnerTrigger) {
      // Re-register or promote to owner
      const res = await registerUserProfile(cleanUsername, displayName.trim() || cleanUsername, selectedAvatar, true, 'owner_crown');
      setIsSubmitting(false);
      if (res.success && res.user) {
        setStoredUsername(res.user.username);
        onProfileCreated(res.user);
      } else {
        setError(res.message || 'Gagal memuat profil pengguna');
      }
    } else {
      const res = await fetchUserProfile(cleanUsername);
      setIsSubmitting(false);
      if (res.success && res.user) {
        setStoredUsername(res.user.username);
        onProfileCreated(res.user);
      } else {
        setError(res.message || 'Gagal memuat profil pengguna');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = username.trim();
    const isOwner = raw.endsWith('.');
    const cleanUsername = raw.replace(/\.+$/, '').toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }

    if (availability && !availability.available && !isOwner) {
      // Username is already registered -> perform login
      handleLoginExisting(cleanUsername, false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await registerUserProfile(
      cleanUsername,
      displayName.trim().replace(/\.+$/, '') || cleanUsername,
      selectedAvatar,
      isOwner,
      isOwner ? 'owner_crown' : undefined
    );
    setIsSubmitting(false);

    if (res.success && res.user) {
      setStoredUsername(res.user.username);
      onProfileCreated(res.user);
    } else {
      setError(res.message || 'Gagal membuat profil pengguna');
    }
  };

  return (
    <div
      style={themeCssVariables}
      className={`min-h-screen w-full ${currentTheme.baseBgClass} text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500`}
      id="profile-setup-container"
    >
      {/* Dynamic Themed Ambient Background - Apply active theme color and typography style here */}
      <div className={`fixed inset-0 ${currentTheme.bgGradient} -z-30 pointer-events-none transition-all duration-700`} />
      <div className={`fixed top-1/4 -left-32 w-96 h-96 ${currentTheme.ambientOrbs.orb1} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed bottom-1/4 -right-32 w-96 h-96 ${currentTheme.ambientOrbs.orb2} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${currentTheme.ambientOrbs.orb3} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />

      {/* Main Account Identity Card - Exactly matching Login Card dimensions, radius, border, and elevation */}
      <div
        style={{
          boxShadow: `${currentTheme.neonGlow}, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`,
          borderColor: currentTheme.activeBorder,
        }}
        className={`w-full max-w-sm sm:max-w-[380px] glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl relative transition-all duration-300 ${currentTheme.cardBorderHighlight}`}
      >
        {/* Glow decoration inside card matching active theme */}
        <div className={`absolute top-0 right-0 w-44 h-44 ${currentTheme.ambientOrbs.orb1} rounded-full blur-2xl pointer-events-none -mr-16 -mt-16`} />
        <div className={`absolute bottom-0 left-0 w-44 h-44 ${currentTheme.ambientOrbs.orb2} rounded-full blur-2xl pointer-events-none -ml-16 -mb-16`} />

        <div className="relative z-10">
          {/* Top Floating Badge - Apply active theme color and typography style here: dynamic glow effect matching active theme accent */}
          <div className="flex justify-center -mt-12 mb-3">
            <div
              style={{
                boxShadow: `0 0 28px ${currentTheme.accentColor}60, 0 0 10px ${currentTheme.accentColor}`,
                borderColor: currentTheme.accentColor,
              }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTheme.actionBtnGradient} p-1 shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-300 border`}
            >
              <div className="w-full h-full bg-slate-950 rounded-[16px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <span
                  style={{
                    color: currentTheme.accentColor,
                    textShadow: `0 0 14px ${currentTheme.accentColor}, 0 0 4px ${currentTheme.accentColor}`,
                  }}
                  className="text-2xl font-mono font-black animate-pulse select-none"
                >
                  {selectedAvatar}
                </span>
              </div>
            </div>
          </div>

          {/* Header Title - Professional, modern sans-serif typography */}
          <div className="text-center mb-3.5">
            {/* Apply active theme color and typography style here: theme badge styling */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-1.5 ${currentTheme.badgeBgClass}`}>
              <Sparkles className={`w-3 h-3 ${currentTheme.accentClass}`} />
              <span>Setup Profil Pengguna</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              Identitas Akun
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-[280px] mx-auto leading-relaxed">
              Pilih simbol avatar & tentukan username untuk kuis dan peringkat leaderboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Symbol Picker - Clean, aesthetic unique symbols */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Pilih Simbol Avatar
                </label>
                <span
                  style={{ color: currentTheme.accentColor }}
                  className="text-[10px] font-bold"
                >
                  {selectedConf.label}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                {UNIQUE_SYMBOLS.map((item) => {
                  const isSelected = selectedAvatar === item.symbol;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAvatar(item.symbol)}
                      title={item.label}
                      style={
                        isSelected
                          ? {
                              borderColor: currentTheme.accentColor,
                              boxShadow: `0 0 14px ${currentTheme.accentColor}70`,
                              backgroundColor: `${currentTheme.accentColor}25`,
                              color: currentTheme.accentColor,
                            }
                          : undefined
                      }
                      // Apply active theme color and typography style here: symbol selection styling
                      className={`h-8 sm:h-9 rounded-xl font-mono font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 scale-105 shadow-md'
                          : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      {item.symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="username-input" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Username Unik <span className="text-rose-400">*</span>
                </label>
                {isChecking && (
                  <span className={`text-[10px] ${currentTheme.accentClass} flex items-center gap-1`}>
                    <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Memeriksa...
                  </span>
                )}
                {!isChecking && availability && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 ${
                      isSecretOwnerTriggered
                        ? 'text-amber-300'
                        : availability.available
                        ? 'text-emerald-400'
                        : currentTheme.accentClass
                    }`}
                  >
                    {isSecretOwnerTriggered ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> Mode Owner Aktif
                      </>
                    ) : availability.available ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" /> Tersedia
                      </>
                    ) : (
                      <>
                        <LogIn className="w-2.5 h-2.5" /> Akun Terdaftar (Siap Masuk)
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">@</span>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="contoh: juara_kuis"
                  maxLength={21}
                  autoFocus
                  // Apply active theme color and typography style here: input border & focus glow
                  style={{
                    borderColor: isSecretOwnerTriggered
                      ? '#fbbf24'
                      : username
                      ? currentTheme.accentColor
                      : undefined,
                    boxShadow: isSecretOwnerTriggered
                      ? '0 0 16px rgba(251, 191, 36, 0.45)'
                      : username
                      ? `0 0 10px ${currentTheme.accentColor}25`
                      : undefined,
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white font-medium text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
                />
              </div>

              {/* Secret Dot Owner Trigger Notice */}
              {isSecretOwnerTriggered && (
                <div className="mt-2 p-2 rounded-xl bg-amber-950/80 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse flex items-start gap-2 text-[11px] text-amber-200">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block">Pemicu Owner Terdeteksi!</span>
                    <p className="text-[10px] text-amber-100/90 leading-tight">
                      Nama disimpan bersih sebagai: <strong className="text-white font-mono">@{cleanUsernamePreview}</strong>. Status Owner, Badge Eksklusif & 4 Tema Rahasia akan langsung terbuka!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Display Name Input */}
            {(!availability || availability.available) && (
              <div>
                <label htmlFor="displayname-input" className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Tampilan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="displayname-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={username ? username : 'Nama panggilan kamu'}
                    maxLength={25}
                    // Apply active theme color and typography style here: input dynamic accent border
                    style={{
                      borderColor: displayName ? currentTheme.accentColor : undefined,
                      boxShadow: displayName ? `0 0 10px ${currentTheme.accentColor}25` : undefined,
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white font-medium text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button - Apply active theme color and typography style here */}
            <button
              type="submit"
              disabled={isSubmitting || username.trim().length < 3}
              style={{
                boxShadow: `0 0 20px ${currentTheme.accentColor}40`,
              }}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-lg bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 active:scale-[0.99] text-white mt-2`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : availability && !availability.available ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Sebagai @{username.trim()}</span>
                </>
              ) : (
                <>
                  <span>Mulai & Simpan Profil</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Branding - Apply active theme color and typography style here */}
      <div className="mt-6 text-center text-xs text-slate-500 flex items-center gap-2 select-none">
        <Sparkles className={`w-4 h-4 ${currentTheme.accentClass}`} />
        <span>WAYGROUND Flashcard • Profil & Identitas Akun</span>
      </div>
    </div>
  );
};

