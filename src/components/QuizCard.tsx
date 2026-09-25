import React, { useEffect, useRef } from 'react';
import { CardPhase, FlashcardQuestion, ThemeId, UserAnswerResult } from '../types';
import { getThemePreset } from '../utils/themes';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Eye,
  Zap,
  HelpCircle,
  Check,
  X,
  TimerOff,
  Dices
} from 'lucide-react';

interface QuizCardProps {
  question: FlashcardQuestion;
  currentIndex: number;
  totalQuestions: number;
  isFlipped: boolean;
  cardPhase: CardPhase;
  readTimerRemaining: number;
  readTimerTotal: number;
  questionTimerRemaining: number;
  questionTimerTotal: number;
  answerTimerRemaining: number;
  answerTimerTotal: number;
  currentResult: UserAnswerResult | null;
  onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  onRevealOptions: () => void;
  onSkipAnswerTimer: () => void;
  correctCount: number;
  wrongCount: number;
  themeId?: ThemeId;
}

const OPTION_STYLES: Record<'A' | 'B' | 'C' | 'D', {
  border: string;
  badgeBg: string;
  badgeText: string;
  hover: string;
  glow: string;
}> = {
  A: {
    border: 'border-violet-500/40 hover:border-violet-400',
    badgeBg: 'bg-gradient-to-br from-violet-600 to-indigo-700',
    badgeText: 'text-white',
    hover: 'hover:bg-violet-950/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    glow: 'group-hover:border-violet-400',
  },
  B: {
    border: 'border-sky-500/40 hover:border-sky-400',
    badgeBg: 'bg-gradient-to-br from-sky-600 to-blue-700',
    badgeText: 'text-white',
    hover: 'hover:bg-sky-950/40 hover:shadow-[0_0_20px_rgba(14,165,233,0.25)]',
    glow: 'group-hover:border-sky-400',
  },
  C: {
    border: 'border-amber-500/40 hover:border-amber-400',
    badgeBg: 'bg-gradient-to-br from-amber-600 to-orange-700',
    badgeText: 'text-white',
    hover: 'hover:bg-amber-950/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    glow: 'group-hover:border-amber-400',
  },
  D: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    badgeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    badgeText: 'text-white',
    hover: 'hover:bg-emerald-950/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    glow: 'group-hover:border-emerald-400',
  },
};

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  isFlipped,
  cardPhase,
  readTimerRemaining,
  readTimerTotal,
  questionTimerRemaining,
  questionTimerTotal,
  answerTimerRemaining,
  answerTimerTotal,
  currentResult,
  onSelectOption,
  onRevealOptions,
  onSkipAnswerTimer,
  correctCount,
  wrongCount,
  themeId,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  // Apply active theme color and typography style here: resolve active theme preset
  const currentTheme = getThemePreset(themeId);

  // Cache the last answered question & result to strictly prevent the upcoming question's answer
  // from leaking on the back face during rotation/flip-back or reading delays
  const lastAnsweredQuestionRef = useRef<FlashcardQuestion | null>(null);
  const lastAnsweredResultRef = useRef<UserAnswerResult | null>(null);

  useEffect(() => {
    if (isFlipped && cardPhase === 'revealed') {
      lastAnsweredQuestionRef.current = question;
      lastAnsweredResultRef.current = currentResult;
    }
  }, [isFlipped, cardPhase, question, currentResult]);

  // Back face only ever displays the question that was answered, NEVER the next incoming question!
  const displayedBackQuestion = isFlipped ? question : lastAnsweredQuestionRef.current;
  const displayedBackResult = isFlipped ? currentResult : lastAnsweredResultRef.current;

  // Keyboard shortcut listener (Space/Enter to reveal options or skip answer, 1-4 / A-D to select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (cardPhase === 'reading' || cardPhase === 'transitioning') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (cardPhase === 'reading') onRevealOptions();
        }
      } else if (cardPhase === 'answering') {
        const key = e.key.toUpperCase();
        if (key === 'A' || key === '1') onSelectOption('A');
        else if (key === 'B' || key === '2') onSelectOption('B');
        else if (key === 'C' || key === '3') onSelectOption('C');
        else if (key === 'D' || key === '4') onSelectOption('D');
      } else if (cardPhase === 'revealed' || isFlipped) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          onSkipAnswerTimer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardPhase, isFlipped, onRevealOptions, onSelectOption, onSkipAnswerTimer]);

  const readProgressPct = Math.max(0, Math.min(100, (readTimerRemaining / readTimerTotal) * 100));
  const questionProgressPct = Math.max(0, Math.min(100, (questionTimerRemaining / questionTimerTotal) * 100));
  const answerProgressPct = Math.max(0, Math.min(100, (answerTimerRemaining / answerTimerTotal) * 100));

  // Urgency color for question timer
  const timerUrgent = cardPhase === 'answering' && questionTimerRemaining <= 2;

  const optionsList: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { key: 'A', text: question.options.A },
    { key: 'B', text: question.options.B },
    { key: 'C', text: question.options.C },
    { key: 'D', text: question.options.D },
  ];

  return (
    <div className="w-full max-w-4xl perspective-1000 mx-auto select-none" id="quiz-card-container">
      {/* 3D Flipping Card Container */}
      <div
        ref={cardRef}
        className={`relative w-full min-h-[580px] sm:min-h-[620px] rounded-3xl transform-style-3d transition-transform duration-700 ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ========================================================= */}
        {/* SISI DEPAN (SOAL)                                          */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-950/95 glass-card ${currentTheme.accentGlowClass} p-5 sm:p-8 flex flex-col justify-between overflow-hidden`}
          id="quiz-card-front"
        >
          {/* Top Progress Bar: Dynamic depending on Reading vs Answering */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800/80 overflow-hidden">
            {cardPhase === 'reading' || cardPhase === 'transitioning' ? (
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_#38bdf8] transition-all duration-100 ease-linear"
                style={{ width: `${readProgressPct}%` }}
              />
            ) : (
              <div
                className={`h-full transition-all duration-100 ease-linear ${
                  timerUrgent
                    ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                    : `bg-gradient-to-r ${currentTheme.gradientText} shadow-[0_0_10px_#818cf8]`
                }`}
                style={{ width: `${questionProgressPct}%` }}
              />
            )}
          </div>

          {/* Card Header: Metadata & Dynamic Timer Indicator */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Question Counter Badge & Shuffle Mode Indicator */}
            <div className="flex items-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${currentTheme.badgeBgClass} flex items-center gap-1.5 shadow-sm`}>
                <Sparkles className={`w-3.5 h-3.5 ${currentTheme.accentClass} animate-pulse`} />
                Soal {currentIndex + 1} / {totalQuestions}
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 border border-purple-500/40 text-purple-300 shadow-sm"
                title="Soal dan pilihan jawaban (A, B, C, D) diacak dinamis"
              >
                <Dices className="w-3.5 h-3.5 text-purple-400" />
                <span>Mode Acak</span>
              </span>
            </div>

            {/* Live Timer Badge (Reading Phase vs Answering Phase) */}
            {cardPhase === 'reading' || cardPhase === 'transitioning' ? (
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold bg-cyan-950/60 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
                title="Waktu membaca soal sebelum opsi muncul"
              >
                <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Baca Soal: {readTimerRemaining.toFixed(1)}s</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold transition-all duration-300 ${
                  timerUrgent
                    ? 'bg-rose-500/25 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-bounce'
                    : 'bg-slate-800/80 border-slate-700/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                }`}
                title="Waktu memilih opsi jawaban"
              >
                <Clock className={`w-4 h-4 ${timerUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                <span>Waktu Jawab: {questionTimerRemaining.toFixed(1)}s</span>
              </div>
            )}

            {/* Score pills */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                <span>{correctCount}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-300 shadow-sm">
                <X className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                <span>{wrongCount}</span>
              </span>
            </div>
          </div>

          {/* Question Text in Center-Top */}
          <div className="my-auto py-6 px-2 sm:px-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs tracking-widest text-indigo-300/80 uppercase font-semibold mb-3 flex items-center gap-1.5 font-display">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Pertanyaan
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-relaxed max-w-2xl drop-shadow-md font-display">
              {question.question}
            </h2>
          </div>

          {/* Bottom Area: Phase 1 (Reading prompt) vs Phase 2 (2x2 Answer Grid) */}
          {cardPhase === 'answering' ? (
            /* FASE MENJAWAB: 2x2 Answer Options Grid muncul */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 pt-3 animate-fade-in-up">
              {optionsList.map((opt, idx) => {
                const style = OPTION_STYLES[opt.key];
                return (
                  <button
                    key={opt.key}
                    id={`quiz-option-${opt.key.toLowerCase()}`}
                    onClick={() => onSelectOption(opt.key)}
                    className={`group relative flex items-center p-4 sm:p-5 min-h-[76px] sm:min-h-[86px] rounded-2xl bg-slate-900/70 backdrop-blur-md border ${style.border} ${style.hover} text-left transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md`}
                  >
                    {/* Option Badge (A, B, C, D) */}
                    <div
                      className={`shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl ${style.badgeBg} ${style.badgeText} flex items-center justify-center font-black text-lg sm:text-xl shadow-md group-hover:scale-110 transition-transform duration-200 mr-4`}
                    >
                      {opt.key}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg md:text-xl font-bold text-slate-100 group-hover:text-white leading-snug">
                        {opt.text}
                      </p>
                    </div>

                    {/* Keyboard hint badge */}
                    <span className="hidden md:inline-block ml-3 px-2 py-1 rounded-md text-xs font-mono font-semibold text-slate-400 bg-slate-800/90 border border-slate-700/80 group-hover:border-slate-500 shadow-sm">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* FASE MEMBACA SOAL / TRANSISI: Opsi belum muncul */
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-md text-center flex flex-col items-center justify-center gap-3 animate-fade-in-up">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-cyan-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span>Pahami pertanyaan di atas. Opsi jawaban akan muncul dalam:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-400/40 font-mono font-bold text-cyan-200">
                  {readTimerRemaining.toFixed(1)}s
                </span>
              </div>

              {/* Instant reveal button for fast readers */}
              <button
                id="btn-reveal-options-now"
                onClick={onRevealOptions}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs sm:text-sm hover:from-cyan-400 hover:to-indigo-500 active:scale-95 shadow-[0_0_18px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Tampilkan Opsi Sekarang</span>
                <span className="hidden sm:inline text-[11px] opacity-80 font-normal">(Tekan Spasi)</span>
              </button>
            </div>
          )}

          {/* Keyboard tip footer */}
          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400/80">
            {cardPhase === 'reading' ? (
              <>
                <span className="hidden sm:inline">Persiapkan diri membaca soal dengan seksama</span>
                <span className="ml-auto">Tekan [Spasi] untuk lewati jeda baca</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Tekan tombol [1 - 4] atau [A - D] di keyboard</span>
                <span className="ml-auto">Pilih cepat sebelum waktu habis!</span>
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SISI BELAKANG (JAWABAN) - EMERALD NEON GLOWING             */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl glass-emerald-card shadow-neon-emerald p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            isFlipped
              ? 'opacity-100 pointer-events-auto visible'
              : 'opacity-0 pointer-events-none invisible'
          }`}
          id="quiz-card-back"
          aria-hidden={!isFlipped}
        >
          {/* Top Auto-advance Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-950/80 overflow-hidden">
            <div
              className="h-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7] transition-all duration-100 ease-linear"
              style={{ width: `${answerProgressPct}%` }}
            />
          </div>

          {/* Header Status Indicator */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Status Badge */}
            {displayedBackResult?.isCorrect ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-200 stroke-[2.5]" />
                <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-display">
                  Jawaban Benar!
                </span>
              </div>
            ) : displayedBackResult?.isTimedOut ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/30 border border-amber-300/40 text-amber-100 shadow-md">
                <TimerOff className="w-5 h-5 text-amber-200 stroke-[2.5]" />
                <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-display">
                  Waktu Habis!
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/30 border border-rose-300/40 text-rose-100 shadow-md">
                <XCircle className="w-5 h-5 text-rose-200 stroke-[2.5]" />
                <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-display">
                  Jawaban Salah!
                </span>
              </div>
            )}

            {/* Answer countdown timer pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 text-xs sm:text-sm font-semibold font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Next: {answerTimerRemaining.toFixed(1)}s</span>
            </div>
          </div>

          {/* Center Body: Giant Key Letter & Text */}
          {displayedBackQuestion && (
            <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs sm:text-sm uppercase tracking-widest text-emerald-200 font-bold mb-2 font-display">
                Kunci Jawaban Yang Benar
              </span>

              {/* Giant Letter Badge */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 my-3 rounded-3xl bg-emerald-950/80 border-2 border-emerald-300/60 shadow-[0_0_35px_rgba(16,185,129,0.8)] flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <span className="text-6xl sm:text-7xl font-black text-emerald-300 tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] font-display">
                  {displayedBackQuestion.correctAnswer}
                </span>
              </div>

              {/* Correct text description */}
              <div className="max-w-xl mx-auto px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-400/30 mt-2 backdrop-blur-md">
                <p className="text-base sm:text-xl font-bold text-white leading-relaxed">
                  {displayedBackQuestion.options[displayedBackQuestion.correctAnswer]}
                </p>
              </div>

              {/* If user picked wrong, show what they answered */}
              {!displayedBackResult?.isCorrect && (
                <div className="mt-3 text-xs sm:text-sm text-emerald-100/90 font-medium">
                  {displayedBackResult?.isTimedOut ? (
                    <span className="text-amber-200">Kamu tidak sempat memilih jawaban.</span>
                  ) : (
                    <span>
                      Jawaban kamu:{' '}
                      <span className="font-bold text-rose-200 line-through">
                        {displayedBackResult?.selectedOption}: {displayedBackResult?.selectedText}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer: Skip to Next Question Button */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="text-xs text-emerald-100/80 hidden sm:block">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-500/50 font-mono">Spasi</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-500/50 font-mono">Enter</kbd> untuk lanjut
            </div>

            <button
              id="btn-skip-answer"
              onClick={onSkipAnswerTimer}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-extrabold text-sm sm:text-base shadow-lg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentIndex + 1 >= totalQuestions ? 'Lihat Hasil Kuis' : 'Soal Berikutnya'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

