import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserProfile, TryoutHistoryItem, PvPHistoryItem, ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';
import { fetchGlobalLeaderboard, fetchUserProfile } from '../utils/api';
import { OwnerBadge } from './OwnerBadge';
import { OwnerNameText } from './OwnerNameText';
import {
  Trophy,
  X,
  Search,
  Swords,
  BookOpen,
  Award,
  Crown,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface GlobalLeaderboardModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUsername?: string;
  theme?: ThemePreset;
  themeId?: ThemeId;
}

export const GlobalLeaderboardModal: React.FC<GlobalLeaderboardModalProps> = ({
  isOpen = true,
  onClose,
  currentUsername,
  theme,
  themeId = 'cyber-purple',
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pvp' | 'tryout'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const currentTheme = theme || getThemePreset(themeId);

  // Transparent User Detail Inspection
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [inspectProfile, setInspectProfile] = useState<UserProfile | null>(null);
  const [inspectTryouts, setInspectTryouts] = useState<TryoutHistoryItem[]>([]);
  const [inspectPvPs, setInspectPvPs] = useState<PvPHistoryItem[]>([]);
  const [inspectTab, setInspectTab] = useState<'summary' | 'tryout' | 'pvp'>('summary');
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  useEffect(() => {
    if (isOpen === false) return;

    setIsLoading(true);
    fetchGlobalLeaderboard()
      .then((res) => {
        if (res.success && res.leaderboard) {
          setLeaderboard(res.leaderboard);
        }
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleInspectUser = async (username: string) => {
    setSelectedUser(username);
    setIsInspectingLoading(true);
    setInspectTab('summary');

    const res = await fetchUserProfile(username);
    setIsInspectingLoading(false);
    if (res.success && res.user) {
      setInspectProfile(res.user);
      setInspectTryouts(res.tryoutHistory || []);
      setInspectPvPs(res.pvpHistory || []);
    }
  };

  if (isOpen === false) return null;

  // Filter & Search Leaderboard
  let filtered = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (filterMode === 'pvp') {
    filtered = [...filtered].sort((a, b) => b.pvpWins - a.pvpWins || b.totalScore - a.totalScore);
  } else if (filterMode === 'tryout') {
    filtered = [...filtered].sort((a, b) => b.tryoutAvgAccuracy - a.tryoutAvgAccuracy || b.tryoutMatches - a.tryoutMatches);
  } else {
    filtered = [...filtered].sort((a, b) => b.totalScore - a.totalScore);
  }

  const top3 = filtered.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-4xl bg-slate-900 border ${currentTheme.cardBorderHighlight} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative transition-all duration-300`}>
        {/* Subtle Background Glow Orbs */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${currentTheme.ambientOrbs.orb1} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 ${currentTheme.ambientOrbs.orb2} rounded-full blur-3xl pointer-events-none -ml-20 -mb-20`} />

        {/* Header */}
        <div className={`p-4 sm:p-6 bg-gradient-to-r ${currentTheme.bgGradient} border-b border-white/10 flex items-center justify-between relative z-10`}>
          <div className="flex items-center gap-3">
            {selectedUser ? (
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Leaderboard
              </button>
            ) : (
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${currentTheme.badgeBgClass} ${currentTheme.accentClass}`}>
                <Trophy className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                {selectedUser ? `Statistik Publik: @${selectedUser}` : 'Leaderboard Global & Statistik Publik'}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedUser
                  ? 'Transparansi penuh rekapitulasi performa dan riwayat pengerjaan'
                  : 'Peringkat pemain aktif berdasarkan akumulasi skor kuis'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {selectedUser ? (
          /* ========================================================= */
          /* TRANSPARENT PUBLIC USER DETAILS VIEW                      */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {isInspectingLoading || !inspectProfile ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Memuat data publik pengguna...</p>
              </div>
            ) : (
              <>
                {/* Profile Overview Card */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  inspectProfile.isOwner
                    ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl p-0.5 flex items-center justify-center ${
                      inspectProfile.isOwner
                        ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                        : 'bg-gradient-to-br from-amber-500 to-purple-600'
                    }`}>
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                        <UserAvatar avatar={inspectProfile.avatar} size="lg" showBadge={false} className="text-2xl" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <OwnerNameText
                          name={inspectProfile.displayName}
                          isOwner={inspectProfile.isOwner}
                          effect={inspectProfile.ownerNameEffect}
                          animation={inspectProfile.ownerNameAnimation}
                          className="text-lg font-black"
                        />
                        {inspectProfile.isOwner && (
                          <OwnerBadge
                            badgeId={inspectProfile.activeBadgeId}
                            isOwner={true}
                            size="sm"
                            showLabel
                          />
                        )}
                      </div>
                      <p className="text-xs font-mono text-purple-300">@{inspectProfile.username}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bergabung sejak:{' '}
                        {new Date(inspectProfile.createdAt).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Poin</span>
                      <span className="text-base font-black text-amber-400">
                        {inspectProfile.totalScore.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PvP Wins</span>
                      <span className="text-base font-black text-purple-400">{inspectProfile.pvpWins}x</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Akurasi Tryout</span>
                      <span className="text-base font-black text-cyan-400">{inspectProfile.tryoutAvgAccuracy}%</span>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs for Inspected User */}
                <div className="flex border-b border-white/10 gap-2">
                  <button
                    onClick={() => setInspectTab('summary')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      inspectTab === 'summary'
                        ? 'border-purple-400 text-purple-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    Ringkasan Performa
                  </button>
                  <button
                    onClick={() => setInspectTab('tryout')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      inspectTab === 'tryout'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    Riwayat Tryout ({inspectTryouts.length})
                  </button>
                  <button
                    onClick={() => setInspectTab('pvp')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      inspectTab === 'pvp'
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    Riwayat PvP & Lawan ({inspectPvPs.length})
                  </button>
                </div>

                {/* Tab Content */}
                {inspectTab === 'summary' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-cyan-500/20 space-y-2">
                      <span className="text-xs font-bold uppercase text-cyan-300 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Performa Tryout Mandiri
                      </span>
                      <p className="text-xs text-slate-300">
                        Pengguna telah menyelesaikan <b>{inspectProfile.tryoutMatches} sesi tryout</b> dengan rata-rata
                        akurasi jawaban <b>{inspectProfile.tryoutAvgAccuracy}%</b>.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => setInspectTab('tryout')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Lihat semua sesi tryout <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-amber-500/20 space-y-2">
                      <span className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5">
                        <Swords className="w-4 h-4" /> Performa Duel PvP
                      </span>
                      <p className="text-xs text-slate-300">
                        Mengikuti <b>{inspectProfile.pvpMatches} pertandingan PvP</b> dan berhasil meraih Juara 1
                        sebanyak <b>{inspectProfile.pvpWins} kali</b>.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => setInspectTab('pvp')}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Lihat semua riwayat room & lawan <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {inspectTab === 'tryout' && (
                  <div className="space-y-2.5">
                    {inspectTryouts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat tryout yang tercatat.</p>
                    ) : (
                      inspectTryouts.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{t.quizTitle}</span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(t.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              • {t.correctCount}/{t.totalQuestions} Benar ({t.timeSpentSeconds}s)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-cyan-400 block">{t.score} poin</span>
                            <span className="text-[10px] text-emerald-400">Akurasi: {t.accuracy}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {inspectTab === 'pvp' && (
                  <div className="space-y-2.5">
                    {inspectPvPs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat PvP yang tercatat.</p>
                    ) : (
                      inspectPvPs.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.rank === 1
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {p.rank === 1 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-400" /> Juara 1
                                  </span>
                                ) : (
                                  `Peringkat ${p.rank}`
                                )}{' '}
                                dari {p.totalPlayers}
                              </span>
                              <span>{p.quizTitle}</span>
                            </span>
                            <span className="font-bold text-amber-400">{p.score} poin</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                            <span className="text-slate-500">Lawan:</span>
                            {p.opponents && p.opponents.length > 0 ? (
                              p.opponents.map((opp) => (
                                <button
                                  key={opp}
                                  onClick={() => handleInspectUser(opp)}
                                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 font-mono hover:underline cursor-pointer"
                                >
                                  @{opp}
                                </button>
                              ))
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                            <span className="text-slate-600 ml-auto">
                              {new Date(p.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* GLOBAL LEADERBOARD MAIN LIST                              */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 w-full sm:w-auto">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? `bg-gradient-to-r ${currentTheme.actionBtnGradient} ${currentTheme.accentGlowClass} text-white`
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Skor
                </button>
                <button
                  onClick={() => setFilterMode('pvp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === 'pvp' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Swords className="w-3 h-3" /> Top PvP
                </button>
                <button
                  onClick={() => setFilterMode('tryout')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === 'tryout' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Akurasi Tryout
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari username..."
                  style={{ borderColor: searchQuery ? currentTheme.accentColor : undefined }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Top 3 Podium (Shown when not searching) */}
            {!searchQuery && top3.length >= 3 && filterMode === 'all' && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end">
                {/* 2nd Place */}
                <div
                  onClick={() => handleInspectUser(top3[1].username)}
                  className={`p-3 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-slate-500 transition-all hover:scale-105 ${
                    top3[1].isOwner
                      ? 'bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'bg-slate-950/80 border border-slate-700/60'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 text-xs font-black flex items-center justify-center mb-1">
                    2
                  </div>
                  <div className="my-1 relative">
                    <UserAvatar avatar={top3[1].avatar} size="md" />
                    {top3[1].isOwner && (
                      <div className="absolute -bottom-1 -right-1">
                        <OwnerBadge isOwner={true} badgeId={top3[1].activeBadgeId} size="xs" glow />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                    <OwnerNameText
                      name={top3[1].displayName}
                      isOwner={top3[1].isOwner}
                      effect={top3[1].ownerNameEffect}
                      animation={top3[1].ownerNameAnimation}
                      className="text-xs font-bold truncate max-w-full"
                    />
                    {top3[1].isOwner && (
                      <OwnerBadge isOwner={true} badgeId={top3[1].activeBadgeId} size="xs" showLabel />
                    )}
                  </div>
                  <p className="text-[10px] text-purple-300 font-mono">@{top3[1].username}</p>
                  <span className="text-xs font-black text-cyan-400 mt-1">
                    {top3[1].totalScore.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* 1st Place (Crown) */}
                <div
                  onClick={() => handleInspectUser(top3[0].username)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-all relative -mt-3 ${
                    top3[0].isOwner
                      ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-amber-950/40 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.45)] ring-2 ring-amber-400/40'
                      : 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-1 shadow">
                    1
                  </div>
                  <div className="my-1 relative">
                    <UserAvatar avatar={top3[0].avatar} size="lg" />
                    {top3[0].isOwner && (
                      <div className="absolute -bottom-1.5 -right-1.5">
                        <OwnerBadge isOwner={true} badgeId={top3[0].activeBadgeId} size="sm" glow />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                    <OwnerNameText
                      name={top3[0].displayName}
                      isOwner={top3[0].isOwner}
                      effect={top3[0].ownerNameEffect}
                      animation={top3[0].ownerNameAnimation}
                      className="text-xs sm:text-sm font-black truncate max-w-full"
                    />
                    {top3[0].isOwner && (
                      <OwnerBadge isOwner={true} badgeId={top3[0].activeBadgeId} size="xs" showLabel />
                    )}
                  </div>
                  <p className="text-[10px] text-amber-300 font-mono">@{top3[0].username}</p>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-1">
                    {top3[0].totalScore.toLocaleString('id-ID')} pt
                  </span>
                </div>

                {/* 3rd Place */}
                <div
                  onClick={() => handleInspectUser(top3[2].username)}
                  className={`p-3 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-amber-600 transition-all hover:scale-105 ${
                    top3[2].isOwner
                      ? 'bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'bg-slate-950/80 border border-amber-700/40'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-1">
                    3
                  </div>
                  <div className="my-1 relative">
                    <UserAvatar avatar={top3[2].avatar} size="md" />
                    {top3[2].isOwner && (
                      <div className="absolute -bottom-1 -right-1">
                        <OwnerBadge isOwner={true} badgeId={top3[2].activeBadgeId} size="xs" glow />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 max-w-full flex-wrap">
                    <OwnerNameText
                      name={top3[2].displayName}
                      isOwner={top3[2].isOwner}
                      effect={top3[2].ownerNameEffect}
                      animation={top3[2].ownerNameAnimation}
                      className="text-xs font-bold truncate max-w-full"
                    />
                    {top3[2].isOwner && (
                      <OwnerBadge isOwner={true} badgeId={top3[2].activeBadgeId} size="xs" showLabel />
                    )}
                  </div>
                  <p className="text-[10px] text-purple-300 font-mono">@{top3[2].username}</p>
                  <span className="text-xs font-black text-cyan-400 mt-1">
                    {top3[2].totalScore.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Full Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3">
                <span>Peringkat & Pemain</span>
                <div className="flex items-center gap-6">
                  <span className="hidden sm:inline">Statistik</span>
                  <span>Total Poin</span>
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className={`w-7 h-7 border-2 border-current ${currentTheme.accentClass} border-t-transparent rounded-full animate-spin`} />
                  <p className="text-xs">Mengambil papan peringkat...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Tidak ada pemain yang cocok dengan pencarian "{searchQuery}".
                </div>
              ) : (
                filtered.map((player, idx) => {
                  const isCurrent = currentUsername && player.username.toLowerCase() === currentUsername.toLowerCase();
                  return (
                    <div
                      key={player.username}
                      onClick={() => handleInspectUser(player.username)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                        player.isOwner
                          ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/20 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:border-amber-400'
                          : isCurrent
                          ? `${currentTheme.badgeBgClass} ${currentTheme.cardBorderHighlight} shadow-md`
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="shrink-0">
                          <UserAvatar avatar={player.avatar} size="sm" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <OwnerNameText
                              name={player.displayName}
                              isOwner={player.isOwner}
                              effect={player.ownerNameEffect}
                              animation={player.ownerNameAnimation}
                              className="text-xs sm:text-sm font-bold truncate max-w-[140px] sm:max-w-xs"
                            />
                            {player.isOwner && (
                              <OwnerBadge
                                isOwner={true}
                                badgeId={player.activeBadgeId}
                                size="xs"
                                showLabel
                              />
                            )}
                            {isCurrent && (
                              <span className={`px-1.5 py-0.2 rounded bg-gradient-to-r ${currentTheme.actionBtnGradient} text-[9px] font-bold text-white uppercase`}>
                                Anda
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] font-mono ${currentTheme.accentClass}`}>@{player.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* Summary Badges */}
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Swords className="w-3 h-3 text-amber-400" /> {player.pvpWins} Menang
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-cyan-400" /> {player.tryoutAvgAccuracy}% Akurasi
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-amber-400">
                            {player.totalScore.toLocaleString('id-ID')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
