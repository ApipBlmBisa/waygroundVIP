import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlashcardQuestion, PvPRoom, PvPRoomPlayer, UserProfile, ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';
import { PvPWebSocketManager } from '../utils/api';
import { UserAvatar } from './UserAvatar';
import { OwnerBadge } from './OwnerBadge';
import { OwnerNameText } from './OwnerNameText';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  Crown,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Eye,
  TimerOff,
  HelpCircle,
  Check,
  X,
  Dices,
} from 'lucide-react';

interface PvPGameViewProps {
  room: PvPRoom;
  currentUser: UserProfile;
  wsManager: PvPWebSocketManager;
  onExitGame: () => void;
  onPlayAgain: () => void;
  theme?: ThemePreset;
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

interface UserAnswerSummary {
  isCorrect: boolean;
  isTimedOut: boolean;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  scoreGained: number;
}

export const PvPGameView: React.FC<PvPGameViewProps> = ({
  room,
  currentUser,
  wsManager,
  onExitGame,
  onPlayAgain,
  theme,
  themeId = 'cyber-purple',
}) => {
  const currentTheme = theme || getThemePreset(themeId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 3D Flip Card state: identical to Mode Individu (QuizCard)
  const [isFlipped, setIsFlipped] = useState(false);
  type CardPhase = 'reading' | 'answering' | 'revealed' | 'transitioning';

  // Timers (dapat disetel 0 atau 1 detik)
  const readTimerTotal = typeof room.readQuestionTimer === 'number' ? Math.max(0, room.readQuestionTimer) : 2;
  const questionTimerTotal = typeof room.questionTimer === 'number' ? Math.max(0, room.questionTimer) : 5;
  const answerTimerTotal = typeof room.answerTimer === 'number' ? Math.max(0, room.answerTimer) : 3;

  const [cardPhase, setCardPhase] = useState<CardPhase>(readTimerTotal === 0 ? 'answering' : 'reading');

  const [readTimerRemaining, setReadTimerRemaining] = useState(readTimerTotal);
  const [questionTimerRemaining, setQuestionTimerRemaining] = useState(questionTimerTotal);
  const [answerTimerRemaining, setAnswerTimerRemaining] = useState(answerTimerTotal);

  // Scores
  const [playerScore, setPlayerScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hasFinishedGame, setHasFinishedGame] = useState(false);

  // Current answer result
  const [currentResult, setCurrentResult] = useState<UserAnswerSummary | null>(null);

  // Cache to prevent answer leaking during 3D flip-back
  const lastAnsweredQuestionRef = useRef<FlashcardQuestion | null>(null);
  const lastAnsweredResultRef = useRef<UserAnswerSummary | null>(null);

  // Transition locks
  const isAdvancingRef = useRef<boolean>(false);
  const advanceTimeoutRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Live Scoreboard
  const [liveScores, setLiveScores] = useState<
    { username: string; avatar: string; score: number; currentQuestionIndex: number; hasFinished: boolean }[]
  >([]);

  // Final Results Leaderboard
  const [finalResults, setFinalResults] = useState<PvPRoomPlayer[] | null>(null);

  const totalQuestions = room.questions.length;
  const currentQuestion: FlashcardQuestion | undefined = room.questions[currentQuestionIndex];

  // What is displayed on back side
  const displayedBackQuestion = isFlipped ? currentQuestion : lastAnsweredQuestionRef.current;
  const displayedBackResult = isFlipped ? currentResult : lastAnsweredResultRef.current;

  // Listen to WebSocket messages
  useEffect(() => {
    const unsub = wsManager.onMessage((data) => {
      if (data.type === 'LIVE_SCOREBOARD') {
        setLiveScores(data.scores || []);
      } else if (data.type === 'GAME_FINISHED') {
        setFinalResults(data.finalLeaderboard || []);
        try {
          confetti({
            particleCount: 90,
            spread: 100,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, [wsManager]);

  // Reveal options early (skip reading delay)
  const handleRevealOptionsEarly = useCallback(() => {
    if (cardPhase !== 'reading' || isFlipped) return;
    setCardPhase('answering');
    setReadTimerRemaining(0);
    questionStartTimeRef.current = Date.now();
    soundManager.playReveal();
  }, [cardPhase, isFlipped]);

  // Advance to Next Question with 3D Flip synchronized animation
  const advanceToNext = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    // Step 1: Immediately flip card back to front side and pause
    setIsFlipped(false);
    setCardPhase('transitioning');
    soundManager.playFlip();

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }

    // Step 2: At 320ms, card is edge-on (90 degrees). Swap index and reset timers
    advanceTimeoutRef.current = window.setTimeout(() => {
      if (currentQuestionIndex + 1 < totalQuestions) {
        setCurrentQuestionIndex((prev) => prev + 1);
        const nextPhase: CardPhase = readTimerTotal === 0 ? 'answering' : 'reading';
        setCardPhase(nextPhase);
        setCurrentResult(null);
        setReadTimerRemaining(readTimerTotal);
        setQuestionTimerRemaining(questionTimerTotal);
        setAnswerTimerRemaining(answerTimerTotal);
        questionStartTimeRef.current = Date.now();
      } else {
        // All questions completed!
        setHasFinishedGame(true);
        const totalTimeSpent = Math.round(
          totalQuestions * (readTimerTotal + questionTimerTotal + answerTimerTotal)
        );
        wsManager.send({
          type: 'PLAYER_FINISHED',
          roomCode: room.code,
          username: currentUser.username,
          score: playerScore,
          correctCount,
          timeSpent: totalTimeSpent,
        });
      }

      // Unlock for future transitions after 700ms 3D rotation finishes
      window.setTimeout(() => {
        isAdvancingRef.current = false;
      }, 380);
    }, 320);
  }, [
    currentQuestionIndex,
    totalQuestions,
    readTimerTotal,
    questionTimerTotal,
    answerTimerTotal,
    room.code,
    currentUser.username,
    playerScore,
    correctCount,
    wsManager,
  ]);

  // Handle player answer selection -> LANGSUNG FLIP 3D ke Sisi Belakang
  const handleAnswerSelect = useCallback(
    (opt: 'A' | 'B' | 'C' | 'D' | null, isTimedOut: boolean = false) => {
      if (cardPhase !== 'answering' || isFlipped || hasFinishedGame || !currentQuestion) return;

      const isCorrect = opt !== null && opt === currentQuestion.correctAnswer;
      const timeSpent = Math.max(0.1, (Date.now() - questionStartTimeRef.current) / 1000);
      const timeLeftRatio = questionTimerTotal > 0
        ? Math.max(0.1, (questionTimerTotal - timeSpent) / questionTimerTotal)
        : 1.0;

      // Score bonus based on speed
      const scoreGained = isCorrect ? Math.round(500 + 500 * timeLeftRatio) : 0;
      const newScore = playerScore + scoreGained;

      setPlayerScore(newScore);
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setWrongCount((prev) => prev + 1);
      }

      const result: UserAnswerSummary = {
        isCorrect,
        isTimedOut,
        selectedOption: opt,
        correctOption: currentQuestion.correctAnswer,
        scoreGained,
      };

      setCurrentResult(result);
      lastAnsweredQuestionRef.current = currentQuestion;
      lastAnsweredResultRef.current = result;

      // Broadcast answer to WebSocket server
      wsManager.send({
        type: 'SUBMIT_ANSWER',
        roomCode: room.code,
        username: currentUser.username,
        questionIndex: currentQuestionIndex,
        isCorrect,
        scoreGained,
      });

      // LANGSUNG FLIP 3D KE SISI BELAKANG!
      setCardPhase('revealed');
      setIsFlipped(true);
      setAnswerTimerRemaining(answerTimerTotal);

      // Audio effects
      soundManager.playFlip();
      if (isCorrect) {
        setTimeout(() => soundManager.playCorrect(), 120);
      } else if (isTimedOut) {
        setTimeout(() => soundManager.playTimeout(), 120);
      } else {
        setTimeout(() => soundManager.playWrong(), 120);
      }
    },
    [
      cardPhase,
      isFlipped,
      hasFinishedGame,
      currentQuestion,
      questionTimerTotal,
      playerScore,
      room.code,
      currentUser.username,
      currentQuestionIndex,
      answerTimerTotal,
      wsManager,
    ]
  );

  // Automated 3-Phase Loop Engine (100ms precision tick)
  useEffect(() => {
    if (hasFinishedGame || finalResults || !currentQuestion) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = 100;

    timerRef.current = window.setInterval(() => {
      if (cardPhase === 'reading') {
        // FASE 1: Membaca Soal (opsi belum muncul)
        if (readTimerTotal === 0) {
          setCardPhase('answering');
          questionStartTimeRef.current = Date.now();
          return;
        }
        setReadTimerRemaining((prev) => {
          const nextVal = prev - intervalMs / 1000;
          if (nextVal <= 0) {
            setCardPhase('answering');
            questionStartTimeRef.current = Date.now();
            soundManager.playReveal();
            return 0;
          }
          return nextVal;
        });
      } else if (cardPhase === 'answering') {
        // FASE 2: Menjawab Soal (opsi A-D aktif)
        if (questionTimerTotal === 0) {
          // 0 dtk = Tanpa batas waktu (unlimited)
          return;
        }
        setQuestionTimerRemaining((prev) => {
          const nextVal = prev - intervalMs / 1000;
          if (nextVal <= 0) {
            // Waktu habis! Otomatis simpan Tidak Dijawab/Salah dan LANGSUNG FLIP 3D
            handleAnswerSelect(null, true);
            return 0;
          }
          if (nextVal <= 2 && Math.floor(nextVal * 10) % 10 === 0) {
            soundManager.playTick();
          }
          return nextVal;
        });
      } else if (cardPhase === 'revealed' && isFlipped) {
        // FASE 3: Sisi Belakang Kunci Jawaban (Auto-Next saat timer habis)
        if (answerTimerTotal === 0) {
          if (!isAdvancingRef.current) {
            advanceToNext();
          }
          return;
        }
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
  }, [
    hasFinishedGame,
    finalResults,
    currentQuestion,
    cardPhase,
    isFlipped,
    readTimerTotal,
    questionTimerTotal,
    answerTimerTotal,
    handleAnswerSelect,
    advanceToNext,
  ]);

  // Keyboard Shortcuts (Space/Enter to reveal or advance, 1-4 / A-D to pick option)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (cardPhase === 'reading' || cardPhase === 'transitioning') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (cardPhase === 'reading') handleRevealOptionsEarly();
        }
      } else if (cardPhase === 'answering') {
        const key = e.key.toUpperCase();
        if (key === 'A' || key === '1') handleAnswerSelect('A');
        else if (key === 'B' || key === '2') handleAnswerSelect('B');
        else if (key === 'C' || key === '3') handleAnswerSelect('C');
        else if (key === 'D' || key === '4') handleAnswerSelect('D');
      } else if (cardPhase === 'revealed' || isFlipped) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          advanceToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardPhase, isFlipped, handleRevealOptionsEarly, handleAnswerSelect, advanceToNext]);

  // Clean up advance timer
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  // Urgency indicator for answering
  const timerUrgent = questionTimerTotal > 0 && cardPhase === 'answering' && questionTimerRemaining <= 2;
  const readProgressPct = readTimerTotal > 0 ? Math.max(0, Math.min(100, (readTimerRemaining / readTimerTotal) * 100)) : 0;
  const questionProgressPct = questionTimerTotal > 0
    ? Math.max(0, Math.min(100, (questionTimerRemaining / questionTimerTotal) * 100))
    : 100;
  const answerProgressPct = answerTimerTotal > 0
    ? Math.max(0, Math.min(100, (answerTimerRemaining / answerTimerTotal) * 100))
    : 0;

  // =========================================================
  // VIEW: FINAL RESULTS PODIUM
  // =========================================================
  if (finalResults) {
    const myRank =
      finalResults.find(
        (p) => p.username.toLowerCase() === currentUser.username.toLowerCase()
      )?.rank || 1;

    return (
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Header Podium Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Hasil Akhir Pertandingan PvP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Papan Peringkat Room {room.code}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {myRank === 1
              ? '✦ Selamat! Anda menjadi Juara 1 di room ini!'
              : `Pertandingan selesai! Anda meraih Peringkat ${myRank}.`}
          </p>
        </div>

        {/* Podium Top 3 */}
        {finalResults.length > 1 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
            {/* 2nd Place */}
            {finalResults[1] && (
              <div className={`p-3 sm:p-4 rounded-2xl text-center flex flex-col items-center ${
                finalResults[1].isOwner
                  ? 'bg-gradient-to-b from-amber-950/50 to-slate-950 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                  : 'bg-slate-950/80 border border-slate-700'
              }`}>
                <span className="w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-black flex items-center justify-center mb-1">
                  2
                </span>
                <div className="my-1 relative">
                  <UserAvatar avatar={finalResults[1].avatar} size="md" />
                  {finalResults[1].isOwner && (
                    <div className="absolute -bottom-1 -right-1">
                      <OwnerBadge isOwner={true} badgeId={finalResults[1].activeBadgeId} size="xs" glow />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                  <OwnerNameText
                    name={finalResults[1].username}
                    isOwner={finalResults[1].isOwner}
                    effect={finalResults[1].ownerNameEffect}
                    animation={finalResults[1].ownerNameAnimation}
                    className="text-xs font-bold truncate max-w-full"
                  />
                  {finalResults[1].isOwner && (
                    <OwnerBadge isOwner={true} badgeId={finalResults[1].activeBadgeId} size="xs" showLabel />
                  )}
                </div>
                <span className="text-xs font-black text-cyan-400 mt-1">
                  {finalResults[1].score} pt
                </span>
              </div>
            )}

            {/* 1st Place */}
            {finalResults[0] && (
              <div className={`p-4 sm:p-5 rounded-2xl text-center flex flex-col items-center -mt-4 ${
                finalResults[0].isOwner
                  ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-amber-950/40 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/40'
                  : 'bg-amber-950/50 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              }`}>
                <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-1 shadow">
                  1
                </span>
                <div className="my-1 relative">
                  <UserAvatar avatar={finalResults[0].avatar} size="lg" />
                  {finalResults[0].isOwner && (
                    <div className="absolute -bottom-1.5 -right-1.5">
                      <OwnerBadge isOwner={true} badgeId={finalResults[0].activeBadgeId} size="sm" glow />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                  <OwnerNameText
                    name={finalResults[0].username}
                    isOwner={finalResults[0].isOwner}
                    effect={finalResults[0].ownerNameEffect}
                    animation={finalResults[0].ownerNameAnimation}
                    className="text-sm font-black truncate max-w-full"
                  />
                  {finalResults[0].isOwner && (
                    <OwnerBadge isOwner={true} badgeId={finalResults[0].activeBadgeId} size="xs" showLabel />
                  )}
                </div>
                <span className="text-sm font-black text-amber-400 mt-1">
                  {finalResults[0].score} pt
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {finalResults[2] && (
              <div className={`p-3 sm:p-4 rounded-2xl text-center flex flex-col items-center ${
                finalResults[2].isOwner
                  ? 'bg-gradient-to-b from-amber-950/50 to-slate-950 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                  : 'bg-slate-950/80 border border-amber-900/60'
              }`}>
                <span className="w-6 h-6 rounded-full bg-amber-800 text-amber-100 text-xs font-black flex items-center justify-center mb-1">
                  3
                </span>
                <div className="my-1 relative">
                  <UserAvatar avatar={finalResults[2].avatar} size="md" />
                  {finalResults[2].isOwner && (
                    <div className="absolute -bottom-1 -right-1">
                      <OwnerBadge isOwner={true} badgeId={finalResults[2].activeBadgeId} size="xs" glow />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                  <OwnerNameText
                    name={finalResults[2].username}
                    isOwner={finalResults[2].isOwner}
                    effect={finalResults[2].ownerNameEffect}
                    animation={finalResults[2].ownerNameAnimation}
                    className="text-xs font-bold truncate max-w-full"
                  />
                  {finalResults[2].isOwner && (
                    <OwnerBadge isOwner={true} badgeId={finalResults[2].activeBadgeId} size="xs" showLabel />
                  )}
                </div>
                <span className="text-xs font-black text-cyan-400 mt-1">
                  {finalResults[2].score} pt
                </span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Leaderboard Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Peringkat & Pemain</span>
            <span>Skor Akhir</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {finalResults.map((player) => {
              const isMe = player.username.toLowerCase() === currentUser.username.toLowerCase();
              return (
                <div
                  key={player.username}
                  className={`p-3.5 flex items-center justify-between transition-colors ${
                    player.isOwner
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/20 border-l-4 border-l-amber-400'
                      : isMe
                      ? 'bg-purple-950/40 border-l-4 border-l-purple-500'
                      : 'hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        player.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : player.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : player.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {player.rank}
                    </span>
                    <div>
                      <UserAvatar avatar={player.avatar} size="sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <OwnerNameText
                          name={player.username}
                          isOwner={player.isOwner}
                          effect={player.ownerNameEffect}
                          animation={player.ownerNameAnimation}
                          className="text-sm font-bold"
                        />
                        {player.isOwner && (
                          <OwnerBadge
                            isOwner={true}
                            badgeId={player.activeBadgeId}
                            size="xs"
                            showLabel
                          />
                        )}
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-600 text-[9px] font-bold text-white uppercase">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {player.correctCount || 0}/{totalQuestions} Soal Benar
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-amber-400">{player.score}</span>
                    <span className="text-xs text-slate-400 block">poin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r ${currentTheme.actionBtnGradient} ${currentTheme.accentGlowClass} hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
          >
            <RotateCcw className="w-4 h-4" /> Main Lagi di Lobby
          </button>
          <button
            onClick={onExitGame}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm cursor-pointer active:scale-95 transition-all"
          >
            Kembali ke Tryout
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW: WAITING FOR OTHER PLAYERS TO FINISH
  // =========================================================
  if (hasFinishedGame) {
    return (
      <div
        className={`w-full max-w-lg mx-auto p-6 sm:p-8 text-center space-y-5 animate-fade-in bg-slate-900 border ${currentTheme.cardBorderHighlight} rounded-3xl shadow-2xl relative overflow-hidden`}
      >
        <div
          className={`absolute top-0 right-0 w-36 h-36 ${currentTheme.ambientOrbs.orb1} rounded-full blur-2xl pointer-events-none -mr-12 -mt-12`}
        />
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${currentTheme.badgeBgClass} ${currentTheme.accentClass}`}
        >
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white">Kamu Sudah Selesai!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Menunggu semua pemain lain menyelesaikan soal kuis...
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-xs uppercase font-bold text-slate-400 block">Skor Sementara Kamu</span>
          <span className="text-3xl sm:text-4xl font-black text-amber-400">{playerScore}</span>
          <span className="text-xs text-slate-400 block mt-1">
            Akurasi: {correctCount}/{totalQuestions} Soal Benar ({wrongCount} Salah)
          </span>
        </div>

        <div className={`flex items-center justify-center gap-2 text-xs font-bold ${currentTheme.accentClass}`}>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Sinkronisasi papan skor akhir dari server...</span>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVE PVP GAMEPLAY: FLIP 3D FLASHCARD (MATCHING INDIVIDU)
  // =========================================================
  const optionsList: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = currentQuestion
    ? [
        { key: 'A', text: currentQuestion.options.A },
        { key: 'B', text: currentQuestion.options.B },
        { key: 'C', text: currentQuestion.options.C },
        { key: 'D', text: currentQuestion.options.D },
      ]
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 space-y-4 animate-fade-in">
      {/* Top Live PvP Scoreboard Bar */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-sm">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>PvP Live</span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            Room: <strong className="text-purple-300 font-mono">{room.code}</strong>
          </span>
        </div>

        {/* Live Standings Avatars */}
        {liveScores.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-[50%] sm:max-w-[65%]">
            {liveScores.map((s) => {
              const isMe = s.username.toLowerCase() === currentUser.username.toLowerCase();
              return (
                <div
                  key={s.username}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all ${
                    s.isOwner
                      ? 'bg-gradient-to-r from-amber-950/70 to-slate-900 border border-amber-400/60 text-amber-300 font-bold shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                      : isMe
                      ? 'bg-purple-900/70 border border-purple-400/60 text-white font-bold shadow-sm'
                      : 'bg-slate-900/70 text-slate-300 border border-slate-800'
                  }`}
                  title={`@${s.username}: ${s.score} pt`}
                >
                  <div className="relative">
                    <UserAvatar avatar={s.avatar} size="xs" />
                  </div>
                  <span className="text-[11px] font-semibold truncate max-w-[55px] sm:max-w-[80px]">
                    @{s.username}
                  </span>
                  {s.isOwner && (
                    <OwnerBadge isOwner={true} badgeId={s.activeBadgeId} size="xs" showLabel />
                  )}
                  <span className="text-[10px] text-amber-400 font-black font-mono">{s.score}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Player's Current Score */}
        <div className="text-right pl-2">
          <span className="text-lg font-black text-amber-400 font-mono drop-shadow">{playerScore}</span>
          <span className="text-[10px] text-slate-400 block -mt-1 font-semibold">poin</span>
        </div>
      </div>

      {/* 3D Flipping Card Container */}
      <div className="w-full perspective-1000 select-none" id="pvp-card-container">
        <div
          className={`relative w-full min-h-[560px] sm:min-h-[600px] rounded-3xl transform-style-3d transition-transform duration-700 ease-out ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={() => {
            // Clicking card during reading reveals options immediately
            if (cardPhase === 'reading') {
              handleRevealOptionsEarly();
            }
          }}
        >
          {/* ========================================================= */}
          {/* SISI DEPAN (SOAL)                                          */}
          {/* ========================================================= */}
          <div
            className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-950/95 glass-card ${currentTheme.accentGlowClass} p-5 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl`}
            id="pvp-card-front"
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

            {/* Card Header: Metadata & Live Timer Indicator */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {/* Question Counter Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${currentTheme.badgeBgClass} flex items-center gap-1.5 shadow-sm`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${currentTheme.accentClass} animate-pulse`} />
                  Soal {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 border border-purple-500/40 text-purple-300 shadow-sm"
                  title="Adu cepat serentak di room PvP"
                >
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duel PvP</span>
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
                  <Clock
                    className={`w-4 h-4 ${timerUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`}
                  />
                  <span>
                    {questionTimerTotal === 0
                      ? 'Waktu Soal: ∞ (Tanpa Batas)'
                      : `Waktu Soal: ${questionTimerRemaining.toFixed(1)}s`}
                  </span>
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
            {currentQuestion && (
              <div className="my-auto py-6 px-2 sm:px-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs tracking-widest text-indigo-300/80 uppercase font-semibold mb-3 flex items-center gap-1.5 font-display">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Pertanyaan Kuis
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-relaxed max-w-2xl drop-shadow-md font-display">
                  {currentQuestion.question}
                </h2>
              </div>
            )}

            {/* Bottom Area: Phase 1 (Reading prompt) vs Phase 2 (2x2 Answer Grid) */}
            {cardPhase === 'answering' ? (
              /* FASE MENJAWAB: 2x2 Answer Options Grid muncul */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 animate-fade-in-up">
                {optionsList.map((opt, idx) => {
                  const style = OPTION_STYLES[opt.key];
                  return (
                    <button
                      key={opt.key}
                      id={`pvp-option-${opt.key.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswerSelect(opt.key);
                      }}
                      className={`group relative flex items-center p-4 sm:p-5 min-h-[76px] sm:min-h-[84px] rounded-2xl bg-slate-900/75 backdrop-blur-md border ${style.border} ${style.hover} text-left transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md`}
                    >
                      {/* Option Badge (A, B, C, D) */}
                      <div
                        className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${style.badgeBg} ${style.badgeText} flex items-center justify-center font-black text-lg sm:text-xl shadow-md group-hover:scale-110 transition-transform duration-200 mr-3.5`}
                      >
                        {opt.key}
                      </div>

                      {/* Option Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base md:text-lg font-bold text-slate-100 group-hover:text-white leading-snug">
                          {opt.text}
                        </p>
                      </div>

                      {/* Keyboard shortcut badge */}
                      <span className="hidden md:inline-block ml-2 px-2 py-1 rounded-md text-xs font-mono font-semibold text-slate-400 bg-slate-800/90 border border-slate-700/80 group-hover:border-slate-500 shadow-sm">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* FASE MEMBACA SOAL / TRANSISI: OPSI BELUM MUNCUL */
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
                  id="pvp-btn-reveal-options"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevealOptionsEarly();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs sm:text-sm hover:from-cyan-400 hover:to-indigo-500 active:scale-95 shadow-[0_0_18px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Tampilkan Opsi Sekarang</span>
                  <span className="hidden sm:inline text-[11px] opacity-80 font-normal">
                    (Tekan Spasi atau Klik Kartu)
                  </span>
                </button>
              </div>
            )}

            {/* Keyboard tip footer */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400/80">
              {cardPhase === 'reading' ? (
                <>
                  <span className="hidden sm:inline">Persiapkan diri membaca pertanyaan kuis</span>
                  <span className="ml-auto">Tekan [Spasi] atau klik kartu untuk lewati jeda baca</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Tekan tombol [1 - 4] atau [A - D] di keyboard</span>
                  <span className="ml-auto">Pilih cepat untuk mendapatkan bonus poin kecepatan!</span>
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
            id="pvp-card-back"
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
                    Jawaban Benar! (+{displayedBackResult.scoreGained} Poin)
                  </span>
                </div>
              ) : displayedBackResult?.isTimedOut ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/30 border border-amber-300/40 text-amber-100 shadow-md">
                  <TimerOff className="w-5 h-5 text-amber-200 stroke-[2.5]" />
                  <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-display">
                    Waktu Habis! (+0 Poin)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/30 border border-rose-300/40 text-rose-100 shadow-md">
                  <XCircle className="w-5 h-5 text-rose-200 stroke-[2.5]" />
                  <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-display">
                    Jawaban Salah! (+0 Poin)
                  </span>
                </div>
              )}

              {/* Answer countdown timer pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 text-xs sm:text-sm font-semibold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {answerTimerTotal === 0 ? 'Next: Instan' : `Next: ${answerTimerRemaining.toFixed(1)}s`}
                </span>
              </div>
            </div>

            {/* Center Body: Giant Key Letter & Text */}
            {displayedBackQuestion && (
              <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm uppercase tracking-widest text-emerald-200 font-bold mb-1 font-display">
                  Kunci Jawaban Yang Benar
                </span>

                {/* Giant Letter Badge */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 my-3 rounded-3xl bg-emerald-950/80 border-2 border-emerald-300/60 shadow-[0_0_35px_rgba(16,185,129,0.8)] flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                  <span className="text-6xl sm:text-7xl font-black text-emerald-300 tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] font-display">
                    {displayedBackQuestion.correctAnswer}
                  </span>
                </div>

                {/* Correct text description */}
                <div className="max-w-xl mx-auto px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-400/30 mt-1 backdrop-blur-md">
                  <p className="text-base sm:text-xl font-bold text-white leading-relaxed">
                    {displayedBackQuestion.options[displayedBackQuestion.correctAnswer]}
                  </p>
                </div>

                {/* If user picked wrong, show what they answered */}
                {!displayedBackResult?.isCorrect && (
                  <div className="mt-3 text-xs sm:text-sm text-emerald-100/90 font-medium">
                    {displayedBackResult?.isTimedOut ? (
                      <span className="text-amber-200 font-semibold">
                        Kamu tidak sempat memilih jawaban sebelum waktu habis.
                      </span>
                    ) : (
                      <span>
                        Pilihan kamu:{' '}
                        <span className="font-bold text-rose-200 line-through">
                          ({displayedBackResult?.selectedOption}){' '}
                          {displayedBackResult?.selectedOption
                            ? displayedBackQuestion.options[displayedBackResult.selectedOption]
                            : ''}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Explanation if present */}
                {displayedBackQuestion.explanation && (
                  <div className="mt-3 max-w-lg mx-auto p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-400/20 text-xs text-emerald-100 text-left">
                    <span className="font-bold text-emerald-300 block mb-0.5">💡 Pembahasan:</span>
                    <p className="leading-relaxed line-clamp-3">{displayedBackQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer: Skip to Next Question (Auto-Next notification) */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="text-xs text-emerald-100/80 hidden sm:block">
                {answerTimerTotal === 0 ? (
                  <span>Transisi instan ke soal berikutnya...</span>
                ) : (
                  <span>
                    Otomatis berpindah dalam{' '}
                    <span className="font-mono font-bold text-emerald-200">
                      {answerTimerRemaining.toFixed(1)}s
                    </span>{' '}
                    (atau tekan{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-500/50 font-mono">
                      Spasi
                    </kbd>
                    )
                  </span>
                )}
              </div>

              <button
                id="pvp-btn-skip-answer"
                onClick={(e) => {
                  e.stopPropagation();
                  advanceToNext();
                }}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-extrabold text-sm sm:text-base shadow-lg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>
                  {currentQuestionIndex + 1 >= totalQuestions
                    ? 'Lihat Papan Skor PvP'
                    : 'Soal Berikutnya'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
