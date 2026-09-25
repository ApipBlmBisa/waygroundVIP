import React, { useRef, useState, useEffect } from 'react';
import { FlashcardQuestion, QuizSettings, SavedQuiz, ThemeId } from '../types';
import { parseExcelQuizFile, downloadExcelTemplate, SAMPLE_PRESET_QUIZZES } from '../utils/excelParser';
import { THEME_PRESETS, getThemePreset } from '../utils/themes';
import { isProtectionActive } from '../utils/security';
import {
  UploadCloud,
  FileSpreadsheet,
  Settings2,
  Clock,
  Volume2,
  VolumeX,
  Layers,
  History,
  Trash2,
  Play,
  Download,
  Image as ImageIcon,
  Check,
  AlertCircle,
  X,
  Palette,
  Shuffle,
  Dices,
  CheckCircle2,
  Lock,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

interface UploadAndSettingsProps {
  settings: QuizSettings;
  onUpdateSettings: (newSettings: QuizSettings) => void;
  savedQuizzes: SavedQuiz[];
  onStartQuiz: (
    questions: FlashcardQuestion[],
    quizTitle: string,
    fileName: string,
    overrideSettings?: Partial<QuizSettings>
  ) => void;
  onDeleteSavedQuiz: (id: string) => void;
  onOpenSecuritySettings?: () => void;
  onLockNow?: () => void;
}

export const UploadAndSettings: React.FC<UploadAndSettingsProps> = ({
  settings,
  onUpdateSettings,
  savedQuizzes,
  onStartQuiz,
  onDeleteSavedQuiz,
  onOpenSecuritySettings,
  onLockNow,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Local settings edit state
  const [localSettings, setLocalSettings] = useState<QuizSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Apply active theme color and typography style here: resolve dynamic theme preset
  const currentTheme = getThemePreset(localSettings.themeId);

  const handleSettingChange = <K extends keyof QuizSettings>(key: K, val: QuizSettings[K]) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setIsLoadingFile(true);

    try {
      const questions = await parseExcelQuizFile(file);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setIsLoadingFile(false);
      onStartQuiz(questions, title, file.name, {
        shuffleQuestions: localSettings.shuffleQuestions,
        shuffleOptions: localSettings.shuffleOptions,
      });
    } catch (err: unknown) {
      setIsLoadingFile(false);
      if (err instanceof Error) {
        setParseError(err.message);
      } else {
        setParseError('Gagal memproses file. Pastikan format kolom sesuai.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Custom Background Image Upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleSettingChange('bgImageUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBgImage = () => {
    handleSettingChange('bgImageUrl', null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="upload-settings-section">
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Flashcard Kuis{' '}
          <span
            className={`text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.gradientText} drop-shadow-sm`}
          >
            Interaktif
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium">
          apip, daus, pano Gg
        </p>
      </div>

      {/* Quick Settings Bar (Always Visible for Convenience) */}
      <div className="glass-panel rounded-2xl p-4 border border-white/15 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Read Question Delay Timer */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700" title="Waktu jeda membaca soal sebelum opsi jawaban muncul">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Baca Soal:</span>
            <input
              type="number"
              min="1"
              max="30"
              value={localSettings.readQuestionTimer}
              onChange={(e) => handleSettingChange('readQuestionTimer', Math.max(1, parseInt(e.target.value) || 3))}
              className="w-12 bg-slate-800 text-white font-bold text-center px-1 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-cyan-400 text-sm"
              title="Waktu membaca soal sebelum opsi jawaban muncul"
            />
            <span className="text-xs text-slate-400 font-medium">dtk</span>
          </div>

          {/* Question Timer */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700" title="Waktu untuk memilih jawaban setelah opsi muncul">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Waktu Jawab:</span>
            <input
              type="number"
              min="2"
              max="60"
              value={localSettings.questionTimer}
              onChange={(e) => handleSettingChange('questionTimer', Math.max(1, parseInt(e.target.value) || 5))}
              className="w-12 bg-slate-800 text-white font-bold text-center px-1 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-indigo-400 text-sm"
              title="Waktu berjalan untuk memilih jawaban soal"
            />
            <span className="text-xs text-slate-400 font-medium">dtk</span>
          </div>

          {/* Answer Timer */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700" title="Waktu kartu memperlihatkan kunci jawaban di sisi belakang">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Tinjau Kunci:</span>
            <input
              type="number"
              min="1"
              max="30"
              value={localSettings.answerTimer}
              onChange={(e) => handleSettingChange('answerTimer', Math.max(1, parseInt(e.target.value) || 3))}
              className="w-12 bg-slate-800 text-white font-bold text-center px-1 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-emerald-400 text-sm"
              title="Waktu kartu memperlihatkan kunci jawaban sebelum lanjut"
            />
            <span className="text-xs text-slate-400 font-medium">dtk</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => handleSettingChange('soundEnabled', !localSettings.soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              localSettings.soundEnabled
                ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass}`
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}
          >
            {localSettings.soundEnabled ? (
              <Volume2 className={`w-4 h-4 ${currentTheme.accentClass}`} />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className={localSettings.soundEnabled ? currentTheme.accentClass : ''}>
              {localSettings.soundEnabled ? 'Suara Aktif' : 'Mute'}
            </span>
          </button>

          {/* Shuffle Questions Toggle */}
          <button
            type="button"
            id="toggle-shuffle-questions"
            onClick={() => handleSettingChange('shuffleQuestions', !localSettings.shuffleQuestions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              localSettings.shuffleQuestions
                ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass}`
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Acak urutan kemunculan soal saat kuis dimainkan"
          >
            <Shuffle className={`w-4 h-4 ${localSettings.shuffleQuestions ? currentTheme.accentClass : 'text-slate-400'}`} />
            <span className={localSettings.shuffleQuestions ? currentTheme.accentClass : ''}>
              Acak Soal: {localSettings.shuffleQuestions ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Shuffle Options Toggle */}
          <button
            type="button"
            id="toggle-shuffle-options"
            onClick={() => handleSettingChange('shuffleOptions', !localSettings.shuffleOptions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              localSettings.shuffleOptions
                ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass}`
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Acak posisi pilihan jawaban A, B, C, D di setiap soal agar tidak menghafal letak kunci"
          >
            <Dices className={`w-4 h-4 ${localSettings.shuffleOptions ? currentTheme.accentClass : 'text-slate-400'}`} />
            <span className={localSettings.shuffleOptions ? currentTheme.accentClass : ''}>
              Acak Opsi A-D: {localSettings.shuffleOptions ? 'ON' : 'OFF'}
            </span>
          </button>




        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          id="tab-upload"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'upload'
              ? `${currentTheme.accentBorderClass.replace('/40', '')} ${currentTheme.accentClass}`
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File Excel (.xlsx / .csv)</span>
        </button>

        <button
          id="tab-history"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? `${currentTheme.accentBorderClass.replace('/40', '')} ${currentTheme.accentClass}`
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat File ({savedQuizzes.length})</span>
        </button>

        <button
          id="tab-presets"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'presets'
              ? `${currentTheme.accentBorderClass.replace('/40', '')} ${currentTheme.accentClass}`
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Soal Preset / Contoh</span>
        </button>
      </div>

      {/* Error notification if parse fails */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Gagal Membaca File</p>
            <p className="text-rose-300/90 mt-0.5">{parseError}</p>
            <button
              onClick={downloadExcelTemplate}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white underline hover:text-rose-100"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Template Excel Contoh
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Automatic Question & Option Randomization Feature Banner */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl bg-white/10 ${currentTheme.accentClass} shrink-0 mt-0.5`}>
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">Mode Acak Variatif Aktif (Anti-Ketebak & Anti-Hafal)</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${currentTheme.badgeBgClass}`}>
                    Auto-Shuffle
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Soal dan opsi pilihan (A, B, C, D) diacak secara kriptografis & variatif: urutan soal dikocok penuh dan kunci jawaban disebar merata di setiap huruf tanpa pola berulang.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleSettingChange('shuffleQuestions', !localSettings.shuffleQuestions)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  localSettings.shuffleQuestions
                    ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass} text-white`
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Klik untuk mengubah mode acak urutan soal"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Soal: {localSettings.shuffleQuestions ? 'Acak ✓' : 'Sesuai File'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('shuffleOptions', !localSettings.shuffleOptions)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  localSettings.shuffleOptions
                    ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass} text-white`
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Klik untuk mengubah mode acak opsi jawaban"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Opsi A-D: {localSettings.shuffleOptions ? 'Acak ✓' : 'Sesuai File'}</span>
              </button>
            </div>
          </div>

          {/* Dropzone Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl p-5 sm:p-7 text-center border-2 border-dashed transition-all duration-300 cursor-pointer ${
              isDragging
                ? `${currentTheme.cardBorderHighlight} bg-white/10 ${currentTheme.accentGlowClass} scale-[1.01]`
                : `border-slate-700 hover:${currentTheme.cardBorderHighlight} bg-slate-900/50 hover:bg-slate-900/80`
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2.5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentTheme.actionBtnGradient} flex items-center justify-center text-white ${currentTheme.accentGlowClass}`}>
                {isLoadingFile ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Tarik & Taruh file Excel (.xlsx / .csv) di sini
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  atau <span className={`${currentTheme.accentClass} underline font-semibold`}>klik untuk memilih file dari komputer</span>
                </p>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 font-mono">.xlsx</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 font-mono">.xls</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 font-mono">.csv</span>
              </div>
            </div>
          </div>

          {/* Format Requirements Info & Template Downloader */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Format Kolom Excel yang Didukung
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Kolom: <strong className="text-slate-200">Pertanyaan</strong>,{' '}
                <strong className="text-slate-200">Pilihan A</strong>,{' '}
                <strong className="text-slate-200">Pilihan B</strong>,{' '}
                <strong className="text-slate-200">Pilihan C</strong>,{' '}
                <strong className="text-slate-200">Pilihan D</strong>,{' '}
                <strong className="text-slate-200">Kunci Jawaban</strong> (A/B/C/D)
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadExcelTemplate();
              }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template Excel</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HISTORY (Riwayat File yang pernah diupload) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Pilih kuis dari riwayat file yang pernah Anda upload sebelumnya tanpa perlu mengunggah ulang:
            </p>
          </div>

          {savedQuizzes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300">Belum Ada Riwayat Kuis</p>
              <p className="text-xs">
                File Excel yang Anda unggah otomatis tersimpan di sini untuk digunakan kembali kapan saja.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`glass-card rounded-2xl p-5 border border-white/10 hover:${currentTheme.cardBorderHighlight} transition-all flex flex-col justify-between group`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-bold text-white text-base group-hover:${currentTheme.accentClass} transition-colors`}>
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        File: {quiz.fileName} • {quiz.questionsCount} Soal
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Diupload: {new Date(quiz.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteSavedQuiz(quiz.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Hapus dari riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">Siap dimainkan</span>
                    <button
                      onClick={() =>
                        onStartQuiz(quiz.questions, quiz.title, quiz.fileName, {
                          shuffleQuestions: localSettings.shuffleQuestions,
                          shuffleOptions: localSettings.shuffleOptions,
                        })
                      }
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Kuis</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PRESETS */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_PRESET_QUIZZES.map((preset, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-5 border border-white/10 hover:border-purple-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md ${currentTheme.badgeBgClass} text-xs font-bold mb-2`}>
                  <Layers className={`w-3 h-3 ${currentTheme.accentClass}`} /> 
                  <span className={currentTheme.accentClass}>Preset Wayground</span>
                </div>
                <h4 className="font-bold text-white text-lg">{preset.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{preset.desc}</p>
                <p className="text-xs font-semibold text-slate-400 mt-2">
                  Total: {preset.questions.length} Soal Pilihan Ganda
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() =>
                    onStartQuiz(preset.questions, preset.title, `${preset.title}.xlsx`, {
                      shuffleQuestions: localSettings.shuffleQuestions,
                      shuffleOptions: localSettings.shuffleOptions,
                    })
                  }
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 text-white text-xs font-extrabold ${currentTheme.accentGlowClass} active:scale-95 transition-all cursor-pointer`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Coba Mainkan Preset Ini</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* THEME & BACKGROUND MODAL                                    */}
      {/* ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-400" />
                Pengaturan Visual & Tema
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Tutup Pengaturan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-5">
              {/* Randomization Modes (Soal & Opsi) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Dices className="w-4 h-4 text-purple-400" />
                    Pengacakan Soal & Pilihan Jawaban
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Anti-Ketebak
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Toggle Shuffle Questions */}
                  <button
                    type="button"
                    onClick={() => handleSettingChange('shuffleQuestions', !localSettings.shuffleQuestions)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      localSettings.shuffleQuestions
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        localSettings.shuffleQuestions
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {localSettings.shuffleQuestions ? '✓' : ''}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Acak Urutan Soal</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Urutan soal dikocok acak penuh (derangement) sehingga nomor soal tidak bisa dihafal.
                      </span>
                    </div>
                  </button>

                  {/* Toggle Shuffle Options */}
                  <button
                    type="button"
                    onClick={() => handleSettingChange('shuffleOptions', !localSettings.shuffleOptions)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      localSettings.shuffleOptions
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        localSettings.shuffleOptions
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {localSettings.shuffleOptions ? '✓' : ''}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Acak Pilihan Opsi (A, B, C, D)</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Distribusi kunci bervariasi seimbang di A, B, C, D dan tidak pernah kembar berturut-turut.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Timer Flow Settings */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Pengaturan Waktu Alur Kuis (Timer)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Read Timer */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-1">
                    <span className="text-[11px] font-semibold text-cyan-300 block">1. Jeda Baca Soal</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.readQuestionTimer}
                        onChange={(e) => handleSettingChange('readQuestionTimer', Math.max(1, parseInt(e.target.value) || 3))}
                        className="w-full bg-slate-800 text-white font-bold text-center py-1 rounded border border-slate-600 focus:outline-none focus:border-cyan-400 text-sm"
                      />
                      <span className="text-xs text-slate-400">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">Waktu baca sebelum opsi muncul</span>
                  </div>

                  {/* Question Timer */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-300 block">2. Waktu Jawab</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={localSettings.questionTimer}
                        onChange={(e) => handleSettingChange('questionTimer', Math.max(1, parseInt(e.target.value) || 5))}
                        className="w-full bg-slate-800 text-white font-bold text-center py-1 rounded border border-slate-600 focus:outline-none focus:border-indigo-400 text-sm"
                      />
                      <span className="text-xs text-slate-400">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">Waktu memilih opsi A, B, C, D</span>
                  </div>

                  {/* Answer Timer */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-300 block">3. Tinjau Kunci</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.answerTimer}
                        onChange={(e) => handleSettingChange('answerTimer', Math.max(1, parseInt(e.target.value) || 3))}
                        className="w-full bg-slate-800 text-white font-bold text-center py-1 rounded border border-slate-600 focus:outline-none focus:border-emerald-400 text-sm"
                      />
                      <span className="text-xs text-slate-400">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">Waktu tampilan sisi belakang</span>
                  </div>
                </div>
              </div>

              {/* Background Image Upload */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Custom Background Image
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Pilih Gambar Latar</span>
                  </button>

                  <input
                    type="file"
                    ref={bgInputRef}
                    onChange={handleBgImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {localSettings.bgImageUrl && (
                    <button
                      onClick={removeBgImage}
                      className="text-xs text-rose-400 hover:underline font-semibold"
                    >
                      Hapus Gambar (Gunakan Gradasi Standar)
                    </button>
                  )}
                </div>
              </div>

              {/* Blur Level Slider */}
              {localSettings.bgImageUrl && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Lapisan Blur Background</span>
                    <span>{localSettings.bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localSettings.bgBlur}
                    onChange={(e) => handleSettingChange('bgBlur', parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Dimmer / Darkness Overlay Slider */}
              {localSettings.bgImageUrl && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Lapisan Dimmer Gelap (Overlay)</span>
                    <span>{localSettings.bgOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={localSettings.bgOpacity}
                    onChange={(e) => handleSettingChange('bgOpacity', parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Preset Background Color Themes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    Pilihan Tema Warna Kuis
                  </span>
                  <span className="text-[11px] text-purple-300 font-normal">
                    Tema Aktif: <strong className="text-white">{currentTheme.name}</strong>
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {THEME_PRESETS.map((t) => {
                    const isSelected = (localSettings.themeId || 'cyber-purple') === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSettingChange('themeId', t.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? `${t.cardBorderHighlight} bg-white/10 shadow-md ring-1 ring-white/30`
                            : 'border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">
                              {t.name}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${t.badgeBgClass}`}>
                              {t.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {t.tagline}
                          </span>
                        </div>

                        {/* Swatches & Indicator */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex -space-x-1">
                            {t.previewColors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-sm ml-1">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Security Web Password Setting Block */}
              {onOpenSecuritySettings && (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Proteksi Kata Sandi Web (Level Koding)
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isProtectionActive()
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isProtectionActive() ? 'Terproteksi' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Kata sandi diatur langsung di file koding (<code className="text-cyan-300">src/security.config.ts</code>) agar tidak dapat dibajak atau di-reset oleh pengunjung web.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        onOpenSecuritySettings();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Lihat Info & Panduan Koding</span>
                    </button>
                    {onLockNow && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsModal(false);
                          onLockNow();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kunci Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 text-white text-sm font-bold shadow-md cursor-pointer`}
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
