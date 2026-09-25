import React, { useRef } from 'react';
import { Palette, Check, X, Sparkles, Image as ImageIcon, Trash2, Crown, ShieldAlert } from 'lucide-react';
import { QuizSettings, ThemeId } from '../types';
import { THEME_PRESETS, getThemePreset } from '../utils/themes';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuizSettings;
  onUpdateSettings: (newSettings: QuizSettings) => void;
  isOwner?: boolean;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isOwner = false,
}) => {
  const bgInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentTheme = getThemePreset(settings.themeId);

  const handleSelectTheme = (themeId: ThemeId) => {
    onUpdateSettings({
      ...settings,
      themeId,
    });
  };

  const standardThemes = THEME_PRESETS.filter((t) => !t.isOwnerOnly);
  const ownerThemes = THEME_PRESETS.filter((t) => t.isOwnerOnly);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUpdateSettings({
          ...settings,
          bgImageUrl: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeBgImage = () => {
    onUpdateSettings({
      ...settings,
      bgImageUrl: null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-5 sm:p-7 border border-white/20 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-white/10 ${currentTheme.accentClass}`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Pilih Tema Warna Kuis
                <span className={`text-xs px-2 py-0.5 rounded-full border ${currentTheme.badgeBgClass}`}>
                  {currentTheme.name}
                </span>
                {isOwner && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center gap-1">
                    <Crown className="w-3 h-3" /> OWNER
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Pilih suasana warna favoritmu. Perubahan langsung aktif seketika!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Theme Grid */}
        <div className="py-4 space-y-6 overflow-y-auto pr-1">
          {/* Owner Exclusive Themes Section */}
          {isOwner && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/30 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.2)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                  4 Tema Eksklusif Owner (VIP Sovereign)
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  Khusus Akun Owner
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Hanya muncul untuk status Owner. Tema ini langsung tersimpan di LocalStorage perangkat Anda.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ownerThemes.map((theme) => {
                  const isSelected = (settings.themeId || 'cyber-purple') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? `${theme.cardBorderHighlight} bg-slate-950/90 shadow-xl ring-2 ring-amber-400`
                          : 'border-amber-500/30 bg-slate-950/60 hover:bg-slate-900 hover:border-amber-400/70'
                      }`}
                    >
                      {/* Background Preview Glow */}
                      <div
                        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl opacity-40 pointer-events-none transition-opacity group-hover:opacity-70"
                        style={{ backgroundColor: theme.accentColor }}
                      />

                      <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-white group-hover:text-amber-200 flex items-center gap-1">
                              {theme.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black">
                              OWNER
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-300 block mt-0.5">
                            {theme.tagline}
                          </span>
                        </div>

                        {/* Checkmark indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                              : 'border border-amber-400/40 text-transparent opacity-40 group-hover:opacity-80'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      {/* Color Swatch Dots */}
                      <div className="relative z-10 flex items-center gap-1.5 pt-1">
                        {theme.previewColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        <span className="text-[10px] text-amber-400/90 ml-1 font-mono font-semibold">
                          {isSelected ? 'Aktif Sekarang' : 'Klik untuk Terapkan'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Theme Cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Koleksi Tema Standar
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {standardThemes.map((theme) => {
                const isSelected = (settings.themeId || 'cyber-purple') === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? `${theme.cardBorderHighlight} bg-white/10 shadow-lg ring-2 ring-white/20`
                        : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    {/* Background Preview Glow */}
                    <div
                      className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
                      style={{ backgroundColor: theme.accentColor }}
                    />

                    <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-white">
                            {theme.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${theme.badgeBgClass}`}>
                            {theme.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {theme.tagline}
                        </span>
                      </div>

                      {/* Checkmark indicator */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white text-slate-950 scale-110 shadow-sm'
                            : 'border border-white/20 text-transparent opacity-40 group-hover:opacity-80'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="relative z-10 flex items-center gap-1.5 pt-1">
                      {theme.previewColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">
                        {isSelected ? 'Aktif Sekarang' : 'Klik untuk Terapkan'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Background Wallpaper Layer */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  Kustom Gambar Latar Belakang (Opsional)
                </span>
                <span className="text-[11px] text-slate-400">
                  {settings.bgImageUrl
                    ? 'Gambar kustom sedang aktif di atas tema warna'
                    : 'Gunakan gradasi murni tema atau tambahkan wallpaper kustom'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {settings.bgImageUrl ? 'Ganti Foto' : 'Upload Foto'}
                </button>

                <input
                  type="file"
                  ref={bgInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {settings.bgImageUrl && (
                  <button
                    onClick={removeBgImage}
                    className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                    title="Hapus wallpaper kustom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* If bg image is active, show sliders for blur and darkness */}
            {settings.bgImageUrl && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Lapisan Blur</span>
                    <span>{settings.bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.bgBlur}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        bgBlur: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Kegelapan Overlay</span>
                    <span>{settings.bgOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={settings.bgOpacity}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        bgOpacity: parseInt(e.target.value) || 50,
                      })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Tema otomatis tersimpan di perangkat Anda.
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-slate-950 text-xs sm:text-sm font-bold shadow-lg hover:bg-slate-200 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
};
