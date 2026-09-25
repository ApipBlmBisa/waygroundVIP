import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Cat,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { verifyPassword, loginUser, getPasswordHint } from '../utils/security';
import { ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';

interface LockScreenProps {
  onUnlockSuccess: () => void;
  themeId?: ThemeId;
  theme?: ThemePreset;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlockSuccess,
  themeId = 'cyber-purple',
  theme,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState(false);

  // Apply active theme color and typography style here: dynamic theme properties
  const currentTheme = theme || getThemePreset(themeId);
  const hintText = getPasswordHint();

  // Apply active theme color and typography style here: dynamic CSS variables for theme consistency
  const themeCssVariables = {
    '--theme-accent': currentTheme.accentColor,
    '--theme-secondary': currentTheme.secondaryColor,
    '--theme-panel-bg': currentTheme.panelBg,
    '--theme-card-bg': currentTheme.cardBg,
    '--theme-border': currentTheme.activeBorder,
    '--theme-glow': currentTheme.neonGlow,
  } as React.CSSProperties;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Silakan masukkan kata sandi terlebih dahulu.');
      triggerShake();
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    setTimeout(() => {
      const isValid = verifyPassword(password.trim());
      if (isValid) {
        setIsSuccessUnlocked(true);
        loginUser();
        setTimeout(() => {
          onUnlockSuccess();
        }, 500);
      } else {
        setIsVerifying(false);
        setErrorMsg('Kata sandi salah. Silakan hubungi pembuat/pengelola kuis untuk mendapatkan akses.');
        triggerShake();
      }
    }, 250);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  return (
    <div
      style={themeCssVariables}
      className={`min-h-screen w-full ${currentTheme.baseBgClass} text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500`}
      id="lock-screen-container"
    >
      {/* Dynamic Themed Ambient Background - Apply active theme color and typography style here */}
      <div className={`fixed inset-0 ${currentTheme.bgGradient} -z-30 pointer-events-none transition-all duration-700`} />
      <div className={`fixed top-1/4 -left-32 w-96 h-96 ${currentTheme.ambientOrbs.orb1} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed bottom-1/4 -right-32 w-96 h-96 ${currentTheme.ambientOrbs.orb2} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${currentTheme.ambientOrbs.orb3} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />

      {/* Main Lock Card - Apply active theme color and typography style here */}
      <div
        style={{
          boxShadow: `${currentTheme.neonGlow}, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`,
          borderColor: currentTheme.activeBorder,
        }}
        className={`w-full max-w-sm sm:max-w-[380px] glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl relative transition-all duration-300 ${currentTheme.cardBorderHighlight} ${
          isShaking ? 'animate-shake' : ''
        } ${isSuccessUnlocked ? 'scale-95 opacity-80' : 'scale-100'}`}
      >
        {/* Glow decoration inside card */}
        <div className={`absolute top-0 right-0 w-44 h-44 ${currentTheme.ambientOrbs.orb1} rounded-full blur-2xl pointer-events-none -mr-16 -mt-16`} />
        <div className={`absolute bottom-0 left-0 w-44 h-44 ${currentTheme.ambientOrbs.orb2} rounded-full blur-2xl pointer-events-none -ml-16 -mb-16`} />

        {/* Top Floating Badge - Apply active theme color and typography style here: dynamic glow effect */}
        <div className="flex justify-center -mt-12 mb-3 relative z-10">
          <div
            style={{
              boxShadow: `0 0 28px ${currentTheme.accentColor}60, 0 0 10px ${currentTheme.accentColor}`,
              borderColor: currentTheme.accentColor,
            }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTheme.actionBtnGradient} p-1 shadow-xl transform transition-transform duration-300 hover:rotate-3 flex items-center justify-center border`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[16px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              {isSuccessUnlocked ? (
                <Unlock className="w-7 h-7 text-emerald-400 stroke-[2.5] animate-bounce" />
              ) : (
                <Lock
                  style={{
                    filter: `drop-shadow(0 0 8px ${currentTheme.accentColor})`,
                  }}
                  className={`w-7 h-7 ${currentTheme.accentClass} stroke-[2.2] animate-pulse`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1 mb-4 relative z-10">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-0.5 ${currentTheme.badgeBgClass}`}>
            <ShieldCheck className={`w-3 h-3 ${currentTheme.accentClass}`} />
            <span>Akses Terproteksi</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Akses Web Kuis
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed px-1">
            Halaman kuis ini diproteksi. Masukkan kata sandi untuk mengakses materi.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3.5 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 animate-fade-in-up relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Akses Ditolak</p>
              <p className="text-rose-300 text-[11px] mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {isSuccessUnlocked && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in-up relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">Kata sandi benar! Membuka akses...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-3.5 relative z-10">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
              <span>Kata Sandi</span>
              {hintText && (
                <span className="text-[10px] font-normal text-slate-400 normal-case">
                  Hint: {hintText}
                </span>
              )}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>

              <input
                id="web-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Masukkan kata sandi..."
                autoFocus
                disabled={isVerifying || isSuccessUnlocked}
                style={{
                  borderColor: password ? currentTheme.accentColor : undefined,
                }}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white font-medium text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-unlock-web"
            disabled={isVerifying || isSuccessUnlocked}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm shadow-lg ${currentTheme.accentGlowClass} flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2`}
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSuccessUnlocked ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Akses Diterima!</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Buka Akses Web</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Branding */}
      <div className="mt-6 text-center text-xs text-slate-500 flex items-center gap-2">
        <Cat className={`w-4 h-4 ${currentTheme.accentClass}`} />
        <span>WAYGROUND Flashcard Kuis • Keamanan Akses Terproteksi</span>
      </div>
    </div>
  );
};
