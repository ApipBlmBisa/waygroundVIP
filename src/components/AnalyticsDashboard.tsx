import React, { useEffect, useRef, useState } from 'react';
import { UserAnswerResult } from '../types';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  Share2,
  ListFilter,
  Home,
  Swords,
} from 'lucide-react';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title);

interface AnalyticsDashboardProps {
  quizTitle: string;
  results: UserAnswerResult[];
  onRestartQuiz: () => void;
  onChangeQuiz: () => void;
  onBackToLobby?: () => void;
  onGoToPvP?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  quizTitle,
  results,
  onRestartQuiz,
  onChangeQuiz,
  onBackToLobby,
  onGoToPvP,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<'doughnut'> | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'wrong'>('all');
  const [showQuestionsList, setShowQuestionsList] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState(false);

  const totalQuestions = results.length;
  const correctCount = results.filter(r => r.isCorrect).length;
  const wrongCount = results.filter(r => !r.isCorrect).length;
  const timeoutCount = results.filter(r => r.isTimedOut).length;
  const accuracyPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTime = totalQuestions > 0
    ? (results.reduce((acc, r) => acc + r.timeSpent, 0) / totalQuestions).toFixed(1)
    : '0.0';

  // Trigger celebration confetti if score is high
  useEffect(() => {
    if (accuracyPct >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6ee7b7', '#a855f7', '#6366f1', '#38bdf8'],
      });
    }
  }, [accuracyPct]);

  // Render Chart.js Donut Chart
  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing instance if any
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Jawaban Benar', 'Jawaban Salah / Waktu Habis'],
        datasets: [
          {
            data: [correctCount, wrongCount],
            backgroundColor: [
              '#10b981', // Emerald Neon
              '#f43f5e', // Rose Red
            ],
            borderColor: [
              '#059669',
              '#e11d48',
            ],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e2e8f0',
              font: {
                family: 'Outfit, sans-serif',
                size: 13,
                weight: 'bold',
              },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = Number(context.parsed) || 0;
                const pct = totalQuestions > 0 ? Math.round((val / totalQuestions) * 100) : 0;
                return ` ${context.label}: ${val} soal (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [correctCount, wrongCount, totalQuestions]);

  const filteredResults = results.filter((r) => {
    if (filterMode === 'correct') return r.isCorrect;
    if (filterMode === 'wrong') return !r.isCorrect;
    return true;
  });

  const handleShareResult = () => {
    const text = `Hasil Latihan Flashcard Kuis "${quizTitle}" di Wayground:\nSkor: ${correctCount}/${totalQuestions} Benar (${accuracyPct}% Akurasi)`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn" id="analytics-dashboard">
      {/* Top Banner & Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-neon-purple border border-white/15">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 font-display">
            <Award className="w-4 h-4 text-purple-300" />
            Ringkasan Hasil Latihan Kuis
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            {accuracyPct >= 80 ? 'Luar Biasa! Kerja Bagus!' : accuracyPct >= 50 ? 'Hasil Cukup Bagus!' : 'Terus Berlatih & Tingkatkan!'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto">
            Topik: <span className="font-semibold text-white">{quizTitle}</span>
          </p>
        </div>
      </div>

      {/* Grid: Donut Chart & Metric Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Chart.js Donut Chart */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center border border-white/15 shadow-xl relative">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Proporsi Jawaban (Chart.js)
          </h3>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2">
            <canvas ref={canvasRef} id="quiz-donut-chart" />
            {/* Center percentage display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-7">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {accuracyPct}%
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">
                Akurasi
              </span>
            </div>
          </div>
        </div>

        {/* Right: Metric Summary Cards */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          {/* Card: Total Soal */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ListFilter className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Soal</p>
                <p className="text-2xl font-black text-white">{totalQuestions} Soal</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Rata-rata respons</span>
              <p className="text-sm font-bold text-indigo-300">{avgTime} dtk/soal</p>
            </div>
          </div>

          {/* Card: Jawaban Benar (Emerald Neon) */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-950/80 to-slate-900/90 border border-emerald-500/40 shadow-neon-emerald flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Jawaban Benar</p>
                <p className="text-3xl font-black text-white">{correctCount}</p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
            </span>
          </div>

          {/* Card: Jawaban Salah / Waktu Habis (Rose Red) */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-rose-950/80 to-slate-900/90 border border-rose-500/40 shadow-neon-rose flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/25 border border-rose-400/40 flex items-center justify-center text-rose-300">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Jawaban Salah / Waktu Habis</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{wrongCount}</span>
                  {timeoutCount > 0 && (
                    <span className="text-xs text-rose-300 font-semibold">({timeoutCount} timeout)</span>
                  )}
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold">
              {totalQuestions > 0 ? Math.round((wrongCount / totalQuestions) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation & Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
        {/* Tombol Utama: Kembali ke Lobby */}
        <button
          id="btn-back-to-lobby"
          onClick={onBackToLobby || onChangeQuiz}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-base shadow-neon-purple hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all cursor-pointer"
          title="Kembali ke Lobby Utama / Menu Soal Kuis"
        >
          <Home className="w-5 h-5" />
          <span>Kembali ke Lobby</span>
        </button>

        {/* Tombol Acak Ulang & Main Lagi */}
        <button
          id="btn-restart-quiz"
          onClick={onRestartQuiz}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700 hover:bg-slate-700 font-bold text-base hover:border-slate-500 active:scale-95 transition-all cursor-pointer shadow-md"
          title="Mulai ulang kuis dengan soal dan opsi pilihan yang diacak ulang secara dinamis"
        >
          <RotateCcw className="w-5 h-5 text-purple-400" />
          <span>Acak Ulang & Main Lagi</span>
        </button>

        {/* Tombol Ganti Soal (Menu Upload) */}
        <button
          id="btn-change-quiz"
          onClick={onChangeQuiz}
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white font-semibold text-sm transition-all cursor-pointer"
          title="Ganti ke paket soal lain atau upload soal baru"
        >
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          <span>Ganti Soal</span>
        </button>

        {/* Tombol Ke Lobby PvP jika ingin bermain bersama pemain lain */}
        {onGoToPvP && (
          <button
            id="btn-goto-pvp"
            onClick={onGoToPvP}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 font-bold text-sm transition-all cursor-pointer"
            title="Buka Arena Lobby PvP Online"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Lobby PvP</span>
          </button>
        )}

        {/* Tombol Bagikan Skor */}
        <button
          id="btn-share-result"
          onClick={handleShareResult}
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-900/70 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white text-sm font-semibold transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{copiedToast ? 'Tersalin ke Clipboard!' : 'Bagikan Skor'}</span>
        </button>
      </div>

      {/* Question by Question Review Accordion */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 mt-8">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowQuestionsList(!showQuestionsList)}
        >
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Detail Review Semua Soal ({results.length})
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Periksa kunci jawaban dan jawaban kamu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1 rounded-lg text-slate-400 hover:text-white">
              {showQuestionsList ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showQuestionsList && (
          <div className="mt-5 space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Semua ({results.length})
              </button>
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'correct'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Benar ({correctCount})
              </button>
              <button
                onClick={() => setFilterMode('wrong')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'wrong'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Salah / Timeout ({wrongCount})
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredResults.map((res) => (
                <div
                  key={res.questionId}
                  className={`p-4 rounded-2xl border transition-all ${
                    res.isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : res.isTimedOut
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-400">
                          #{res.questionNumber}
                        </span>
                        {res.isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                          </span>
                        ) : res.isTimedOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Waktu Habis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" /> Salah
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          ({res.timeSpent.toFixed(1)}s)
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white mb-2">
                        {res.questionText}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                          <span className="text-emerald-400 font-semibold">Kunci Jawaban:</span>{' '}
                          <span className="font-bold text-white">
                            {res.correctOption}. {res.correctText}
                          </span>
                        </div>

                        {!res.isCorrect && (
                          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/20">
                            <span className="text-rose-400 font-semibold">Jawaban Kamu:</span>{' '}
                            <span className="font-bold text-white">
                              {res.isTimedOut ? 'Tidak Dijawab' : `${res.selectedOption}. ${res.selectedText}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
