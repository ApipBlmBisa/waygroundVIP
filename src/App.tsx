import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CardPhase,
  FlashcardQuestion,
  QuizSettings,
  QuizState,
  SavedQuiz,
  UserAnswerResult,
  UserProfile,
} from './types';
import {
  loadStoredSettings,
  saveStoredSettings,
  loadSavedQuizzes,
  saveQuizHistory,
  deleteSavedQuiz
} from './utils/storage';
import { soundManager } from './utils/audio';
import { QuizCard } from './components/QuizCard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UploadAndSettings } from './components/UploadAndSettings';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { LockScreen } from './components/LockScreen';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { UserProfileSetup } from './components/UserProfileSetup';
import { UserProfileModal } from './components/UserProfileModal';
import { GlobalLeaderboardModal } from './components/GlobalLeaderboardModal';
import { UserAvatar } from './components/UserAvatar';
import { OwnerBadge } from './components/OwnerBadge';
import { OwnerNameText } from './components/OwnerNameText';
import { OwnerCustomizationModal } from './components/OwnerCustomizationModal';
import { getOwnerBadge } from './utils/badges';
import { PvPLobby } from './components/PvPLobby';
import { getStoredUsername, fetchUserProfile, recordTryoutHistory, clearStoredUsername } from './utils/api';
import { SAMPLE_PRESET_QUIZZES } from './utils/excelParser';
import { isUserAuthenticated, logoutUser, isProtectionActive } from './utils/security';
import { getThemePreset } from './utils/themes';
import { prepareQuizQuestions } from './utils/quizUtils';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Cat,
  HelpCircle,
  Pause,
  Play,
  Palette,
  Lock,
  ShieldCheck,
  Trophy,
  Swords,
  BookOpen,
  User,
  Home,
  Sparkles,
  Crown,
} from 'lucide-react';

export default function App() {
  // Web Password Protection State
  const [isLocked, setIsLocked] = useState<boolean>(() => !isUserAuthenticated());
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showOwnerCustomizer, setShowOwnerCustomizer] = useState<boolean>(false);

  // App Mode State: Tryout Solo vs PvP Multiplayer
  const [appMode, setAppMode] = useState<'tryout' | 'pvp'>('tryout');
  const hasRecordedTryoutRef = useRef<boolean>(false);

  // Global Settings & History
  const [settings, setSettings] = useState<QuizSettings>(() => loadStoredSettings());
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>(() => loadSavedQuizzes());

  useEffect(() => {
    fetch('/api/saved-quizzes')
      .then(res => res.ok ? res.json() : [])
      .then((shared: SavedQuiz[]) => {
        if (Array.isArray(shared)) {
          setSavedQuizzes(shared);
          localStorage.setItem('wayground_saved_quizzes_v1', JSON.stringify(shared));
        }
      })
      .catch(err => console.error('Failed to load shared quizzes:', err));
  }, []);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  // Quiz Play State
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [quizTitle, setQuizTitle] = useState<string>('Flashcard Kuis');
  const [quizFileName, setQuizFileName] = useState<string>('');
  const [questions, setQuestions] = useState<FlashcardQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userResults, setUserResults] = useState<UserAnswerResult[]>([]);
  const [currentResult, setCurrentResult] = useState<UserAnswerResult | null>(null);

  // Card Flip and Multi-Phase Timers
  const [cardPhase, setCardPhase] = useState<CardPhase>('reading');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [readTimerRemaining, setReadTimerRemaining] = useState<number>(3);
  const [questionTimerRemaining, setQuestionTimerRemaining] = useState<number>(5);
  const [answerTimerRemaining, setAnswerTimerRemaining] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Interval reference for high precision timer
  const timerRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const isAdvancingRef = useRef<boolean>(false);
  const questionStartTimeRef = useRef<number>(Date.now());
  const rawQuestionsRef = useRef<FlashcardQuestion[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Sync sound setting
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
    saveStoredSettings(settings);
  }, [settings]);

  // Fetch logged in user profile when unlocked
  useEffect(() => {
    if (!isLocked) {
      const stored = getStoredUsername();
      if (stored) {
        fetchUserProfile(stored).then((res) => {
          if (res.success && res.user) {
            setCurrentUser(res.user);
          }
        });
      }
    }
  }, [isLocked]);

  // Record Tryout Results automatically upon finishing
  useEffect(() => {
    if (
      quizState === 'results' &&
      currentUser &&
      !hasRecordedTryoutRef.current &&
      userResults.length > 0
    ) {
      hasRecordedTryoutRef.current = true;
      const correct = userResults.filter((r) => r.isCorrect).length;
      const accuracy = Math.round((correct / userResults.length) * 100);
      const score = correct * 100;
      const timeSpent = Math.round(userResults.reduce((acc, r) => acc + r.timeSpent, 0));

      recordTryoutHistory({
        username: currentUser.username,
        quizTitle: quizTitle || 'Latihan Tryout',
        score,
        accuracy,
        correctCount: correct,
        totalQuestions: userResults.length,
        timeSpentSeconds: timeSpent,
      }).then(() => {
        fetchUserProfile(currentUser.username).then((res) => {
          if (res.success && res.user) {
            setCurrentUser(res.user);
          }
        });
      });
    }
  }, [quizState, currentUser, userResults, quizTitle]);

  // Handle Starting a Quiz
  const handleStartQuiz = (
    newQuestions: FlashcardQuestion[],
    title: string,
    fileName: string,
    overrideSettings?: Partial<QuizSettings>
  ) => {
    hasRecordedTryoutRef.current = false;
    const activeShuffleQuestions =
      overrideSettings?.shuffleQuestions !== undefined
        ? overrideSettings.shuffleQuestions
        : (settings.shuffleQuestions ?? true);

    const activeShuffleOptions =
      overrideSettings?.shuffleOptions !== undefined
        ? overrideSettings.shuffleOptions
        : (settings.shuffleOptions ?? true);

    // Deep-clone raw questions so they remain pristine for any re-shuffling
    rawQuestionsRef.current = JSON.parse(JSON.stringify(newQuestions));
    const qList = prepareQuizQuestions(newQuestions, {
      shuffleQuestions: activeShuffleQuestions,
      shuffleOptions: activeShuffleOptions,
    });

    setQuestions(qList);
    setQuizTitle(title);
    setQuizFileName(fileName);
    setCurrentIndex(0);
    setUserResults([]);
    setCurrentResult(null);
    setIsFlipped(false);
    setIsPaused(false);
    setCardPhase('reading');
    setReadTimerRemaining(settings.readQuestionTimer);
    setQuestionTimerRemaining(settings.questionTimer);
    setAnswerTimerRemaining(settings.answerTimer);
    setQuizState('playing');

    // Save to upload history in localStorage
    const saved = saveQuizHistory({
      id: `quiz-${Date.now()}`,
      title,
      fileName,
      uploadedAt: new Date().toISOString(),
      questionsCount: qList.length,
      questions: newQuestions,
    });
    setSavedQuizzes(saved);

    fetch('/api/saved-quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `quiz-${Date.now()}`,
        title,
        fileName,
        uploadedAt: new Date().toISOString(),
        questionsCount: newQuestions.length,
        questions: newQuestions,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Gagal menyimpan kuis bersama');
        return res.json();
      })
      .then((sharedQuiz: SavedQuiz) => {
        setSavedQuizzes(prev => [
          sharedQuiz,
          ...prev.filter(q => q.id !== sharedQuiz.id && q.title !== sharedQuiz.title)
        ]);
      })
      .catch(err => console.error('Failed to save shared quiz:', err));
  };

  const handleDeleteSavedQuiz = (id: string) => {
    const updated = deleteSavedQuiz(id);
    setSavedQuizzes(updated);
  };

  // Flip card to Answer side with given status
  const flipToAnswerSide = useCallback((
    selectedOpt: 'A' | 'B' | 'C' | 'D' | null,
    isTimedOut: boolean = false
  ) => {
    if (!questions[currentIndex] || isFlipped) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOpt === currentQ.correctAnswer;
    const timeSpent = Math.max(0.1, (Date.now() - questionStartTimeRef.current) / 1000);

    const result: UserAnswerResult = {
      questionId: currentQ.id,
      questionNumber: currentIndex + 1,
      questionText: currentQ.question,
      selectedOption: selectedOpt,
      correctOption: currentQ.correctAnswer,
      selectedText: selectedOpt ? currentQ.options[selectedOpt] : '(Tidak Dijawab)',
      correctText: currentQ.options[currentQ.correctAnswer],
      isCorrect,
      isTimedOut,
      timeSpent,
    };

    setCurrentResult(result);
    setUserResults((prev) => [...prev, result]);
    setCardPhase('revealed');
    setIsFlipped(true);
    setAnswerTimerRemaining(settings.answerTimer);

    // Audio effects
    soundManager.playFlip();
    if (isCorrect) {
      setTimeout(() => soundManager.playCorrect(), 120);
    } else if (isTimedOut) {
      setTimeout(() => soundManager.playTimeout(), 120);
    } else {
      setTimeout(() => soundManager.playWrong(), 120);
    }
  }, [questions, currentIndex, isFlipped, settings.answerTimer]);

  // Reveal options early (skip reading delay)
  const handleRevealOptionsEarly = useCallback(() => {
    if (cardPhase !== 'reading' || isPaused) return;
    setCardPhase('answering');
    setReadTimerRemaining(0);
    questionStartTimeRef.current = Date.now();
    soundManager.playReveal();
  }, [cardPhase, isPaused]);

  // Advance to Next Question or Final Results with synchronized flip animation
  const advanceToNext = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    // Step 1: Immediately flip card back to front side and pause phase timer
    setIsFlipped(false);
    setCardPhase('transitioning');
    soundManager.playFlip();

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }

    // Step 2: At 320ms, the card is rotated 90 degrees edge-on (neither front nor back is visible).
    // Now swap question index and reset timers so new question loads invisibly behind the rotation
    advanceTimeoutRef.current = window.setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setCardPhase('reading');
        setCurrentResult(null);
        setReadTimerRemaining(settings.readQuestionTimer);
        setQuestionTimerRemaining(settings.questionTimer);
        setAnswerTimerRemaining(settings.answerTimer);
      } else {
        setQuizState('results');
        setCardPhase('reading');
      }

      // Unlock for future transitions after the 700ms 3D rotation completes
      window.setTimeout(() => {
        isAdvancingRef.current = false;
      }, 380);
    }, 320);
  }, [currentIndex, questions.length, settings.readQuestionTimer, settings.questionTimer, settings.answerTimer]);

  // 3-Phase Automated Loop Engine (Reading -> Answering -> Revealed)
  useEffect(() => {
    if (quizState !== 'playing' || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = 100; // 100ms precision tick

    timerRef.current = window.setInterval(() => {
      if (cardPhase === 'reading') {
        // FASE 1: Membaca Soal (opsi belum muncul)
        setReadTimerRemaining((prev) => {
          const nextVal = prev - intervalMs / 1000;
          if (nextVal <= 0) {
            // Jeda baca selesai! Opsi jawaban muncul otomatis
            setCardPhase('answering');
            questionStartTimeRef.current = Date.now();
            soundManager.playReveal();
            return 0;
          }
          return nextVal;
        });
      } else if (cardPhase === 'answering') {
        // FASE 2: Menjawab Soal (opsi A, B, C, D aktif)
        setQuestionTimerRemaining((prev) => {
          const nextVal = prev - intervalMs / 1000;
          if (nextVal <= 0) {
            // Waktu menjawab habis!
            flipToAnswerSide(null, true);
            return 0;
          }
          // Soft sound tick saat <= 2 detik
          if (nextVal <= 2 && Math.floor(nextVal * 10) % 10 === 0) {
            soundManager.playTick();
          }
          return nextVal;
        });
      } else if (cardPhase === 'revealed' && isFlipped) {
        // FASE 3: Sisi Belakang Kunci Jawaban
        setAnswerTimerRemaining((prev) => {
          const nextVal = prev - intervalMs / 1000;
          if (nextVal <= 0) {
            advanceToNext();
            return 0;
          }
          return nextVal;
        });
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quizState, isPaused, cardPhase, isFlipped, flipToAnswerSide, advanceToNext]);

  // User selects an option on Front Side
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (cardPhase !== 'answering' || isFlipped || isPaused || isAdvancingRef.current) return;
    flipToAnswerSide(opt, false);
  };

  // Skip answer timer button
  const handleSkipAnswerTimer = () => {
    if (!isFlipped || cardPhase === 'transitioning' || isAdvancingRef.current) return;
    advanceToNext();
  };

  // Restart Quiz
  const handleRestartQuiz = () => {
    if (questions.length === 0) return;
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    isAdvancingRef.current = false;

    const baseList = rawQuestionsRef.current.length > 0 ? rawQuestionsRef.current : questions;
    const sourceQuestions: FlashcardQuestion[] = JSON.parse(JSON.stringify(baseList));
    const qList = prepareQuizQuestions(sourceQuestions, {
      shuffleQuestions: settings.shuffleQuestions,
      shuffleOptions: settings.shuffleOptions,
    });

    setQuestions(qList);
    setCurrentIndex(0);
    setUserResults([]);
    setCurrentResult(null);
    setIsFlipped(false);
    setIsPaused(false);
    setCardPhase('reading');
    setReadTimerRemaining(settings.readQuestionTimer);
    setQuestionTimerRemaining(settings.questionTimer);
    setAnswerTimerRemaining(settings.answerTimer);
    setQuizState('playing');
  };

  // Change Quiz / Back to Upload
  const handleChangeQuiz = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    isAdvancingRef.current = false;
    setQuizState('setup');
    setIsFlipped(false);
    setIsPaused(false);
  };

  // Calculate current running score
  const correctCount = userResults.filter((r) => r.isCorrect).length;
  const wrongCount = userResults.filter((r) => !r.isCorrect).length;

  const handleLockNow = () => {
    logoutUser();
    setIsLocked(true);
  };

  const handleLogout = () => {
    clearStoredUsername();
    setCurrentUser(null);
    setShowProfileModal(false);
    setShowLeaderboardModal(false);
    setQuizState('setup');
  };

  const handleUnlockSuccess = () => {
    setIsLocked(false);
    const stored = getStoredUsername();
    if (stored) {
      fetchUserProfile(stored).then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
        }
      });
    }
  };

  // Apply active theme color and typography style here: compute dynamic active theme & CSS variables
  const currentTheme = getThemePreset(settings.themeId);

  const themeCssVariables = {
    '--theme-accent': currentTheme.accentColor,
    '--theme-secondary': currentTheme.secondaryColor,
    '--theme-panel-bg': currentTheme.panelBg,
    '--theme-card-bg': currentTheme.cardBg,
    '--theme-border': currentTheme.activeBorder,
    '--theme-glow': currentTheme.neonGlow,
  } as React.CSSProperties;

  // If website is locked by password protection, display the Gatekeeper Lock Screen
  if (isLocked) {
    return (
      <LockScreen
        onUnlockSuccess={handleUnlockSuccess}
        themeId={settings.themeId}
        theme={currentTheme}
      />
    );
  }

  // If unlocked but user has not set up unique username profile, display UserProfileSetup
  if (!currentUser) {
    return (
      <UserProfileSetup
        onProfileCreated={(profile) => {
          setCurrentUser(profile);
        }}
        themeId={settings.themeId}
        theme={currentTheme}
      />
    );
  }

  return (
    <div
      style={themeCssVariables}
      className={`relative min-h-screen w-full ${currentTheme.baseBgClass} text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-purple-600 selection:text-white transition-colors duration-500`}
    >
      {/* ========================================================= */}
      {/* DYNAMIC BACKGROUND & DIMMER OVERLAYS                       */}
      {/* ========================================================= */}
      {/* Base Wayground gradient dynamically themed */}
      <div className={`fixed inset-0 ${currentTheme.bgGradient} -z-30 pointer-events-none transition-all duration-700`} />

      {/* Futuristic Glowing Ambient Orbs dynamically themed */}
      <div className={`fixed top-1/4 -left-32 w-96 h-96 ${currentTheme.ambientOrbs.orb1} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed bottom-1/4 -right-32 w-96 h-96 ${currentTheme.ambientOrbs.orb2} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] ${currentTheme.ambientOrbs.orb3} rounded-full blur-3xl pointer-events-none -z-20 transition-all duration-700`} />

      {/* Custom Background Image Upload if specified */}
      {settings.bgImageUrl && (
        <div
          className="fixed inset-0 bg-cover bg-center -z-25 transition-all duration-500 pointer-events-none"
          style={{
            backgroundImage: `url(${settings.bgImageUrl})`,
            filter: `blur(${settings.bgBlur}px)`,
          }}
        />
      )}

      {/* Custom Blur / Dimmer Overlay for Background Image */}
      {settings.bgImageUrl && (
        <div
          className="fixed inset-0 -z-24 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: `rgba(15, 23, 42, ${settings.bgOpacity / 100})`,
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TOP NAVIGATION BAR                                         */}
      {/* ========================================================= */}
      <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo & App Name */}
          <div
            onClick={handleChangeQuiz}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${currentTheme.actionBtnGradient} p-0.5 ${currentTheme.accentGlowClass} group-hover:scale-105 transition-transform`}>
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Cat className={`w-5 h-5 ${currentTheme.accentClass} group-hover:rotate-12 transition-transform duration-300`} />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-1.5 font-display">
                WAYGROUND
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-300 block font-medium tracking-tight">
                yang keras aja #CCA #JanganNangis #BelajarPegangMouse
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs (Tryout Solo vs PvP Online) */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setAppMode('tryout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                appMode === 'tryout'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tryout</span>
            </button>
            <button
              onClick={() => setAppMode('pvp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                appMode === 'pvp'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>PvP Online</span>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Solo Pause/Back (only when playing Tryout) */}
            {appMode === 'tryout' && quizState === 'playing' && (
              <>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isPaused ? 'Lanjutkan Kuis' : 'Jeda Kuis'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleChangeQuiz}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Kembali ke Menu Soal"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Solo Back to Lobby button when viewing Results */}
            {appMode === 'tryout' && quizState === 'results' && (
              <button
                id="header-btn-results-lobby"
                onClick={handleChangeQuiz}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
                title="Kembali ke Lobby / Menu Soal"
              >
                <Home className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Lobby</span>
              </button>
            )}

            {/* Global Leaderboard Button */}
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Papan Peringkat Global & Statistik Publik"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Leaderboard</span>
            </button>

            {/* Quick Owner / Name Customizer Button */}
            {currentUser.isOwner ? (
              <button
                onClick={() => setShowOwnerCustomizer(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-yellow-950/90 hover:from-amber-900/80 hover:to-yellow-850/80 text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(251,191,36,0.55)] hover:scale-105 active:scale-95 group"
                title="Buka Pengaturan Nama & Badge Eksklusif Owner"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-400/30 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] group-hover:rotate-6 transition-transform" />
                <span className="hidden xl:inline font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300">
                  Gaya Owner
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowOwnerCustomizer(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 group"
                title="Buka Pengaturan Warna & Gaya Nama Anda"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden xl:inline font-bold">
                  Warna Nama
                </span>
              </button>
            )}

            {/* User Profile Pill Button - Perfectly aligned with OwnerBadge and OwnerNameText */}
            <button
              onClick={() => setShowProfileModal(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer hover:brightness-125 ${
                currentUser.isOwner
                  ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:border-amber-300'
                  : `${currentTheme.badgeBgClass} ${currentTheme.cardBorderHighlight}`
              }`}
              title="Buka Profil & Statistik Riwayat Anda"
            >
              <div className="relative flex items-center shrink-0">
                <UserAvatar
                  avatar={currentUser.avatar}
                  size="xs"
                  glow={currentUser.isOwner}
                  matchTheme
                  accentColor={currentUser.isOwner ? '#fbbf24' : currentTheme.accentColor}
                />
              </div>

              {/* Seamless horizontal alignment of Name & Owner Badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <OwnerNameText
                  name={currentUser.displayName || `@${currentUser.username}`}
                  isOwner={currentUser.isOwner}
                  effect={currentUser.ownerNameEffect}
                  animation={currentUser.ownerNameAnimation}
                  className="text-xs font-bold truncate max-w-[85px] sm:max-w-[125px] leading-tight"
                />

                {currentUser.isOwner && (
                  <OwnerBadge
                    isOwner={true}
                    badgeId={currentUser.activeBadgeId}
                    size="xs"
                    showLabel
                  />
                )}
              </div>
            </button>

            {/* Theme Selector Button */}
            <button
              onClick={() => setShowThemeModal(true)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-800/60 hover:brightness-125`}
              title={`Ganti Tema Warna (Saat ini: ${currentTheme.name})`}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? `${currentTheme.badgeBgClass} ${currentTheme.accentGlowClass}`
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
              title={settings.soundEnabled ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
            >
              {settings.soundEnabled ? (
                <Volume2 className={`w-4 h-4 ${currentTheme.accentClass}`} />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Lock Web & Security Buttons (Only if password protection active) */}
            {isProtectionActive() && (
              <>
                <button
                  id="header-btn-lock-web"
                  onClick={handleLockNow}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Kunci Akses Web Sekarang"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  id="header-btn-security-settings"
                  onClick={() => setShowSecurityModal(true)}
                  className="p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-all cursor-pointer shadow-sm"
                  title="Pengaturan Kata Sandi & Proteksi Web"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER VIEW                                       */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {/* MODE A: PVP MULTIPLAYER */}
        {appMode === 'pvp' ? (
          <PvPLobby
            currentUser={currentUser}
            savedQuizzes={savedQuizzes}
            defaultQuestions={SAMPLE_PRESET_QUIZZES[0].questions}
            onBackToSolo={() => setAppMode('tryout')}
            theme={currentTheme}
            themeId={settings.themeId}
          />
        ) : (
          /* MODE B: TRYOUT SOLO */
          <>
            {/* VIEW 1: UPLOAD & SETUP */}
            {quizState === 'setup' && (
              <UploadAndSettings
                settings={settings}
                onUpdateSettings={setSettings}
                savedQuizzes={savedQuizzes}
                onStartQuiz={handleStartQuiz}
                onDeleteSavedQuiz={handleDeleteSavedQuiz}
                onOpenSecuritySettings={() => setShowSecurityModal(true)}
                onLockNow={handleLockNow}
              />
            )}

            {/* VIEW 2: ACTIVE PLAYING FLASHCARD */}
            {quizState === 'playing' && questions[currentIndex] && (
              <div className="space-y-4">
                {/* Pause Overlay indicator */}
                {isPaused && (
                  <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-center max-w-md mx-auto flex items-center justify-center gap-2 text-sm font-bold shadow-lg animate-pulse">
                    <Pause className="w-4 h-4" />
                    <span>Kuis Dijeda. Klik tombol play di pojok kanan atas untuk meneruskan.</span>
                  </div>
                )}

                {/* The 3D Flip Card */}
                <QuizCard
                  question={questions[currentIndex]}
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  isFlipped={isFlipped}
                  cardPhase={cardPhase}
                  readTimerRemaining={readTimerRemaining}
                  readTimerTotal={settings.readQuestionTimer}
                  questionTimerRemaining={questionTimerRemaining}
                  questionTimerTotal={settings.questionTimer}
                  answerTimerRemaining={answerTimerRemaining}
                  answerTimerTotal={settings.answerTimer}
                  currentResult={currentResult}
                  onSelectOption={handleSelectOption}
                  onRevealOptions={handleRevealOptionsEarly}
                  onSkipAnswerTimer={handleSkipAnswerTimer}
                  correctCount={correctCount}
                  wrongCount={wrongCount}
                  themeId={settings.themeId}
                />
              </div>
            )}

            {/* VIEW 3: ANALYTICS & RESULTS */}
            {quizState === 'results' && (
              <AnalyticsDashboard
                quizTitle={quizTitle}
                results={userResults}
                onRestartQuiz={handleRestartQuiz}
                onChangeQuiz={handleChangeQuiz}
                onBackToLobby={handleChangeQuiz}
                onGoToPvP={() => {
                  handleChangeQuiz();
                  setAppMode('pvp');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-white/5">
        <p>Wayground Flashcard Mode • Tryout & PvP Multiplayer • Real-time WebSocket</p>
      </footer>

      {/* User Profile Modal (Stats, Tryout History, PvP History) */}
      {showProfileModal && currentUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(updated) => setCurrentUser(updated)}
          onLogout={handleLogout}
          theme={currentTheme}
          themeId={settings.themeId}
        />
      )}

      {/* Owner Customization Modal (Exclusive Name & Badge Customization) */}
      {showOwnerCustomizer && currentUser && currentUser.isOwner && (
        <OwnerCustomizationModal
          isOpen={showOwnerCustomizer}
          onClose={() => setShowOwnerCustomizer(false)}
          currentUser={currentUser}
          onProfileUpdated={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* Global Leaderboard & Public Stats Modal */}
      {showLeaderboardModal && (
        <GlobalLeaderboardModal
          isOpen={showLeaderboardModal}
          onClose={() => setShowLeaderboardModal(false)}
          currentUsername={currentUser.username}
          theme={currentTheme}
          themeId={settings.themeId}
        />
      )}

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        isOwner={currentUser?.isOwner}
      />

      {/* Security & Password Management Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onLockNow={handleLockNow}
        themeId={settings.themeId}
      />
    </div>
  );
}
