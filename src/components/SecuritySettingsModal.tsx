import React from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldCheck,
  Code2,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { SECURITY_CONFIG } from '../security.config';
import { isProtectionActive } from '../utils/security';
import { ThemeId } from '../types';
import { getThemePreset } from '../utils/themes';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow: () => void;
  themeId?: ThemeId;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onLockNow,
  themeId = 'cyber-purple',
}) => {
  const currentTheme = getThemePreset(themeId);
  const isProtected = isProtectionActive();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Proteksi Sandi (Level Koding)
              </h3>
              <p className="text-[11px] text-slate-400">Konfigurasi aman anti-hack via kode sumber</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Status Keamanan Web
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {isProtected
                  ? 'Web terkunci. Pengunjung wajib memasukkan kata sandi koding.'
                  : 'Web terbuka bebas tanpa proteksi kata sandi.'}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 border ${
                isProtected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isProtected ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Aktif</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Nonaktif</span>
                </>
              )}
            </span>
          </div>

          {/* Explanation Card */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Aman Dari Serangan & Bypass Web</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kata sandi sengaja <strong>tidak dapat diganti lewat browser/antarmuka web</strong>. Ini memastikan bahwa siswa atau pengunjung luar tidak dapat mereset atau membajak kata sandi web Anda.
            </p>
          </div>

          {/* How to Change Password via Code */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Cara Mengganti Sandi di File Koding</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <FileCode className="w-3 h-3" />
                src/security.config.ts
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Buka file <code className="text-cyan-300 font-mono font-semibold">src/security.config.ts</code> di editor proyek Anda dan ubah nilainya:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <span className="text-slate-500">// src/security.config.ts</span>
              <br />
              <span className="text-purple-400">export const</span> <span className="text-yellow-300">SECURITY_CONFIG</span> = &#123;
              <br />
              &nbsp;&nbsp;<span className="text-cyan-400">PASSWORD</span>: <span className="text-emerald-400">'{SECURITY_CONFIG.PASSWORD}'</span>, <span className="text-slate-500">// &lt;- Ganti sandi di sini</span>
              <br />
              &nbsp;&nbsp;<span className="text-cyan-400">IS_PROTECTED</span>: <span className="text-amber-400">{String(SECURITY_CONFIG.IS_PROTECTED)}</span>, <span className="text-slate-500">// true / false</span>
              <br />
              &nbsp;&nbsp;<span className="text-cyan-400">HINT</span>: <span className="text-emerald-400">'{SECURITY_CONFIG.HINT}'</span>, <span className="text-slate-500">// Petunjuk opsional</span>
              <br />
              &#125;;
            </div>
          </div>

          {/* Quick Lock Action */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockNow();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Kunci Web Sekarang (Uji Layar Kunci)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
