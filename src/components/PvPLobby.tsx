import React, { useState, useEffect } from 'react';
import { FlashcardQuestion, PvPRoom, PvPRoomPlayer, UserProfile, SavedQuiz, ThemeId } from '../types';
import { ThemePreset, getThemePreset } from '../utils/themes';
import { PvPWebSocketManager, fetchActiveRooms, createPvPRoom } from '../utils/api';
import { prepareQuizQuestions } from '../utils/quizUtils';
import { PvPGameView } from './PvPGameView';
import { UserAvatar } from './UserAvatar';
import { OwnerBadge } from './OwnerBadge';
import { OwnerNameText } from './OwnerNameText';
import {
  Swords,
  Users,
  Plus,
  LogIn,
  Crown,
  Play,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Send,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Dices,
  Shuffle,
  Settings2,
} from 'lucide-react';

interface PvPLobbyProps {
  currentUser: UserProfile;
  savedQuizzes: SavedQuiz[];
  defaultQuestions: FlashcardQuestion[];
  onBackToSolo: () => void;
  theme?: ThemePreset;
  themeId?: ThemeId;
}

export const PvPLobby: React.FC<PvPLobbyProps> = ({
  currentUser,
  savedQuizzes,
  defaultQuestions,
  onBackToSolo,
  theme,
  themeId = 'cyber-purple',
}) => {
  const currentTheme = theme || getThemePreset(themeId);
  const [wsManager] = useState<PvPWebSocketManager>(() => new PvPWebSocketManager());
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<PvPRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  // Create Room Modal State & Settings
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedQuizSource, setSelectedQuizSource] = useState<'preset' | string>('preset');
  const [newRoomReadTimer, setNewRoomReadTimer] = useState<number>(3);
  const [newRoomQuestionTimer, setNewRoomQuestionTimer] = useState<number>(5);
  const [newRoomAnswerTimer, setNewRoomAnswerTimer] = useState<number>(3);
  const [newRoomShuffleQuestions, setNewRoomShuffleQuestions] = useState<boolean>(true);
  const [newRoomShuffleOptions, setNewRoomShuffleOptions] = useState<boolean>(true);
  const [newRoomQuestionLimit, setNewRoomQuestionLimit] = useState<'all' | '5' | '10' | '15' | '20'>('all');

  // Chat in Lobby
  const [chatMessages, setChatMessages] = useState<
    { username: string; avatar: string; message: string; timestamp: string; isOwner?: boolean; activeBadgeId?: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');

  // Connect WebSocket on mount
  useEffect(() => {
    wsManager.connect();

    const unsubMsg = wsManager.onMessage((data) => {
      if (data.type === 'ROOM_UPDATE') {
        setCurrentRoom(data.room);
      } else if (data.type === 'GAME_STARTED') {
        setCurrentRoom(data.room);
      } else if (data.type === 'CHAT_MESSAGE') {
        setChatMessages((prev) => [
          ...prev.slice(-20),
          {
            username: data.username,
            avatar: data.avatar,
            message: data.message,
            timestamp: data.timestamp,
            isOwner: data.isOwner,
            activeBadgeId: data.activeBadgeId,
            ownerNameEffect: data.ownerNameEffect,
            ownerNameAnimation: data.ownerNameAnimation,
          },
        ]);
      } else if (data.type === 'ERROR') {
        setErrorMsg(data.message);
      }
    });

    loadRooms();

    return () => {
      unsubMsg();
      wsManager.disconnect();
    };
  }, []);

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    const res = await fetchActiveRooms();
    setIsLoadingRooms(false);
    if (res.success && res.rooms) {
      setActiveRoomsList(res.rooms);
    }
  };

  const handleJoinByCode = (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) return;
    setErrorMsg(null);

    wsManager.send({
      type: 'JOIN_ROOM',
      roomCode: code,
      username: currentUser.username,
      avatar: currentUser.avatar,
      isOwner: currentUser.isOwner,
      activeBadgeId: currentUser.activeBadgeId,
      ownerNameEffect: currentUser.ownerNameEffect,
      ownerNameAnimation: currentUser.ownerNameAnimation,
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let questionsToUse = [...defaultQuestions];
    let quizTitleToUse = 'Kuis Standar Wayground';

    if (selectedQuizSource !== 'preset') {
      const found = savedQuizzes.find((q) => q.id === selectedQuizSource);
      if (found && found.questions.length > 0) {
        questionsToUse = [...found.questions];
        quizTitleToUse = found.title;
      }
    }

    // Apply Randomization (Acak Urutan Soal & Acak Pilihan Opsi A-D)
    if (newRoomShuffleQuestions || newRoomShuffleOptions) {
      questionsToUse = prepareQuizQuestions(questionsToUse, {
        shuffleQuestions: newRoomShuffleQuestions,
        shuffleOptions: newRoomShuffleOptions,
      });
    }

    // Apply Question Limit if selected
    if (newRoomQuestionLimit !== 'all') {
      const limit = parseInt(newRoomQuestionLimit, 10);
      if (!isNaN(limit) && limit > 0 && limit < questionsToUse.length) {
        questionsToUse = questionsToUse.slice(0, limit);
      }
    }

    const res = await createPvPRoom({
      name: newRoomName.trim() || `Room ${currentUser.displayName}`,
      hostUsername: currentUser.username,
      questions: questionsToUse,
      quizTitle: quizTitleToUse,
      readQuestionTimer: Math.max(0, Math.min(30, Number.isFinite(Number(newRoomReadTimer)) ? Number(newRoomReadTimer) : 2)),
      questionTimer: Math.max(0, Math.min(60, Number.isFinite(Number(newRoomQuestionTimer)) ? Number(newRoomQuestionTimer) : 5)),
      answerTimer: Math.max(0, Math.min(30, Number.isFinite(Number(newRoomAnswerTimer)) ? Number(newRoomAnswerTimer) : 3)),
    });

    if (res.success && res.room) {
      setShowCreateModal(false);
      setCurrentRoom(res.room);
      // Connect WebSocket to that room
      wsManager.send({
        type: 'JOIN_ROOM',
        roomCode: res.room.code,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isOwner: currentUser.isOwner,
        activeBadgeId: currentUser.activeBadgeId,
        ownerNameEffect: currentUser.ownerNameEffect,
        ownerNameAnimation: currentUser.ownerNameAnimation,
      });
    } else {
      setErrorMsg(res.message || 'Gagal membuat room');
    }
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    wsManager.send({
      type: 'START_GAME',
      roomCode: currentRoom.code,
      username: currentUser.username,
    });
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      wsManager.send({
        type: 'LEAVE_ROOM',
        roomCode: currentRoom.code,
        username: currentUser.username,
      });
      setCurrentRoom(null);
      setChatMessages([]);
      loadRooms();
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentRoom) return;
    wsManager.send({
      type: 'CHAT_MESSAGE',
      roomCode: currentRoom.code,
      username: currentUser.username,
      avatar: currentUser.avatar,
      isOwner: currentUser.isOwner,
      activeBadgeId: currentUser.activeBadgeId,
      ownerNameEffect: currentUser.ownerNameEffect,
      ownerNameAnimation: currentUser.ownerNameAnimation,
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  // If Game is in progress
  if (currentRoom && currentRoom.status === 'in_game') {
    return (
      <PvPGameView
        room={currentRoom}
        currentUser={currentUser}
        wsManager={wsManager}
        onExitGame={() => {
          handleLeaveRoom();
          onBackToSolo();
        }}
        onPlayAgain={() => {
          // Re-set room status in local view back to waiting
          setCurrentRoom({ ...currentRoom, status: 'waiting' });
        }}
        theme={currentTheme}
        themeId={themeId}
      />
    );
  }

  // =========================================================
  // VIEW: INSIDE LOBBY ROOM (WAITING FOR PLAYERS)
  // =========================================================
  if (currentRoom) {
    const isHost = currentRoom.hostUsername.toLowerCase() === currentUser.username.toLowerCase();

    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Room Header Card */}
        <div className={`p-5 sm:p-6 rounded-3xl bg-slate-900 border ${currentTheme.cardBorderHighlight} shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-44 h-44 ${currentTheme.ambientOrbs.orb1} rounded-full blur-2xl pointer-events-none -mr-16 -mt-16`} />
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${currentTheme.badgeBgClass}`}>
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span className={currentTheme.accentClass}>Lobby Room PvP</span>
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {currentRoom.quizTitle}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{currentRoom.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Host:{' '}
              <span className={`font-mono font-semibold ${currentTheme.accentClass}`}>@{currentRoom.hostUsername}</span> •{' '}
              {currentRoom.questions.length} Soal • Baca: {currentRoom.readQuestionTimer || 3}s • Jawab: {currentRoom.questionTimer}s • Tinjau: {currentRoom.answerTimer || 3}s
            </p>
          </div>

          {/* Room Code Badge & Copy */}
          <div className="flex items-center gap-2 relative z-10">
            <div className={`p-3 rounded-2xl bg-slate-950 border ${currentTheme.cardBorderHighlight} text-center`}>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Kode Room</span>
              <span className="text-xl font-black tracking-widest text-amber-400 font-mono">
                {currentRoom.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-3 rounded-2xl border transition-colors cursor-pointer ${currentTheme.badgeBgClass} hover:brightness-125`}
              title="Salin Kode Room"
            >
              {hasCopiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className={`w-5 h-5 ${currentTheme.accentClass}`} />}
            </button>
          </div>
        </div>

        {/* Players List & Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players in Room (Real-Time) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className={`w-4 h-4 ${currentTheme.accentClass}`} />
                <span>Pemain Bergabung ({currentRoom.players.length})</span>
              </h3>
              <span className="text-xs text-slate-500">Live Real-time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.players.map((player) => {
                const isPlayerHost = player.username.toLowerCase() === currentRoom.hostUsername.toLowerCase();
                const isMe = player.username.toLowerCase() === currentUser.username.toLowerCase();

                return (
                  <div
                    key={player.username}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      player.isOwner
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : isPlayerHost
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <UserAvatar avatar={player.avatar} size="md" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <OwnerNameText
                            name={`@${player.username}`}
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
                            <span className={`px-1.5 py-0.2 rounded bg-gradient-to-r ${currentTheme.actionBtnGradient} text-[9px] font-bold text-white uppercase`}>
                              Anda
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold inline-flex items-center gap-1 mt-0.5 ${
                            isPlayerHost ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isPlayerHost ? (
                            <>
                              <Crown className="w-3 h-3" /> Host Room
                            </>
                          ) : (
                            '✓ Siap Bertanding'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Host Action Banner vs Waiting Notice */}
            <div className="pt-4">
              {isHost ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Anda adalah Host Room ini</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Hanya Anda yang memiliki wewenang untuk menekan tombol <b>Mulai Kuis</b> saat semua pemain sudah
                    siap.
                  </p>
                  <button
                    onClick={handleStartGame}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Mulai Kuis Sekarang (Start Game)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                    <span>Menunggu Host (@{currentRoom.hostUsername}) memulai kuis...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kuis akan otomatis dimulai di layar Anda saat tombol Start ditekan oleh Host.
                  </p>
                </div>
              )}
            </div>

            {/* Leave Room Button */}
            <div className="pt-2">
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Tinggalkan Room
              </button>
            </div>
          </div>

          {/* Lobby Real-Time Chat / Activity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col h-[420px]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Chat Room</h4>
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {chatMessages.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-10">Kirim pesan pertama di room ini!</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UserAvatar avatar={msg.avatar} size="xs" />
                      <OwnerNameText
                        name={`@${msg.username}`}
                        isOwner={msg.isOwner}
                        effect={msg.ownerNameEffect}
                        animation={msg.ownerNameAnimation}
                        className="font-bold font-mono text-[11px]"
                      />
                      {msg.isOwner && (
                        <OwnerBadge
                          isOwner={true}
                          badgeId={msg.activeBadgeId}
                          size="xs"
                          showLabel
                        />
                      )}
                      <span className="text-[9px] text-slate-500 ml-auto">{msg.timestamp}</span>
                    </div>
                    <p className="text-slate-200 pl-5 leading-relaxed bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan..."
                maxLength={100}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW: PVP BROWSER & ROOM SELECTOR
  // =========================================================
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Multiplayer Online</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            PvP Duel Room Flashcard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Adu cepat dan akurasi menjawab soal kuis secara serentak bersama teman atau pemain lain di room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} ${currentTheme.accentGlowClass} hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer`}
          >
            <Plus className="w-4 h-4" /> Buat Room Baru
          </button>
          <button
            onClick={onBackToSolo}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm cursor-pointer"
          >
            Kembali ke Tryout
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            ✕
          </button>
        </div>
      )}

      {/* Quick Join With Code Form */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${currentTheme.badgeBgClass} ${currentTheme.accentClass}`}>
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Gabung dengan Kode Room</h4>
            <p className="text-xs text-slate-400">Masukkan 6 digit kode room yang dibagikan oleh teman (misal: WG-1001)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="KODE ROOM"
            maxLength={10}
            style={{ borderColor: joinCodeInput ? currentTheme.accentColor : undefined }}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm tracking-wider uppercase placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20 w-full sm:w-44"
          />
          <button
            onClick={() => handleJoinByCode()}
            disabled={!joinCodeInput.trim()}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm cursor-pointer disabled:opacity-50`}
          >
            Gabung
          </button>
        </div>
      </div>

      {/* Active Waiting Rooms List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className={`w-4 h-4 ${currentTheme.accentClass}`} />
            <span>Daftar Room Menunggu ({activeRoomsList.length})</span>
          </h3>
          <button
            onClick={loadRooms}
            disabled={isLoadingRooms}
            className={`text-xs ${currentTheme.accentClass} hover:brightness-125 font-bold flex items-center gap-1 cursor-pointer`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} /> Refresh Room
          </button>
        </div>

        {isLoadingRooms ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className={`w-7 h-7 border-2 border-current ${currentTheme.accentClass} border-t-transparent rounded-full animate-spin`} />
            <p className="text-xs">Memuat daftar room...</p>
          </div>
        ) : activeRoomsList.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
            <Swords className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">Belum Ada Room yang Sedang Menunggu</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Jadilah yang pertama membuat room baru dan bagikan kodenya ke teman-teman!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} hover:brightness-110 text-white font-bold text-xs cursor-pointer shadow-md`}
            >
              + Buat Room Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeRoomsList.map((room) => (
              <div
                key={room.code}
                className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:${currentTheme.cardBorderHighlight} transition-all flex items-center justify-between gap-3`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold ${currentTheme.badgeBgClass} ${currentTheme.accentClass}`}>
                      {room.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>Host:{' '}
                        <OwnerNameText
                          name={`@${room.hostUsername}`}
                          isOwner={room.isHostOwner}
                          effect={room.hostNameEffect}
                          animation={room.hostNameAnimation}
                          className="font-bold font-mono text-xs text-slate-300"
                        />
                      </span>
                      {room.isHostOwner && (
                        <OwnerBadge
                          isOwner={true}
                          badgeId={room.hostBadgeId}
                          size="xs"
                          showLabel
                        />
                      )}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{room.name}</h4>
                  <p className="text-xs text-slate-400">
                    {room.quizTitle} • {room.questionCount} Soal • Baca: {room.readQuestionTimer || 3}s • Jawab: {room.questionTimer}s • Tinjau: {room.answerTimer || 3}s
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" /> {room.playerCount} Pemain
                  </span>
                  <button
                    onClick={() => handleJoinByCode(room.code)}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Gabung
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-[340px] sm:max-w-[350px] glass-card rounded-2xl p-4 sm:p-5 border border-white/20 shadow-2xl relative transition-all duration-300 ${currentTheme.cardBorderHighlight} my-auto max-h-[92vh] overflow-y-auto custom-scrollbar`}>
            {/* Glow decoration bubbles inside card matching theme & login page */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${currentTheme.ambientOrbs.orb1} rounded-full blur-2xl pointer-events-none -mr-12 -mt-12`} />
            <div className={`absolute bottom-0 left-0 w-32 h-32 ${currentTheme.ambientOrbs.orb2} rounded-full blur-2xl pointer-events-none -ml-12 -mb-12`} />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors border border-white/10"
              title="Tutup"
            >
              ✕
            </button>

            {/* Top Badge matching Login aesthetic - positioned safely inside card so it does not get cut off */}
            <div className="flex justify-center mb-2 mt-0.5 relative z-10">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentTheme.actionBtnGradient} p-1 ${currentTheme.accentGlowClass} shadow-lg flex items-center justify-center`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-[14px]" />
                  <Crown className="w-6 h-6 text-amber-400 stroke-[2.2] animate-pulse relative z-10" />
                </div>
              </div>
            </div>

            {/* Header Title */}
            <div className="text-center space-y-0.5 mb-2.5 relative z-10">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider mb-0.5 ${currentTheme.badgeBgClass}`}>
                <Swords className={`w-2.5 h-2.5 ${currentTheme.accentClass}`} />
                <span>Pengaturan Room</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-display">
                Buat Room PvP
              </h2>
              <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                Atur kuis, timer & acak soal sebelum duel
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3 relative z-10">
              {/* Room Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Room
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={`Room Duel ${currentUser.displayName}`}
                  maxLength={30}
                  style={{ borderColor: newRoomName ? currentTheme.accentColor : undefined }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/20 font-medium placeholder-slate-500"
                />
              </div>

              {/* Quiz Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Pilih Paket Soal
                </label>
                <select
                  value={selectedQuizSource}
                  onChange={(e) => setSelectedQuizSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
                >
                  <option value="preset">Kuis Standar Preset ({defaultQuestions.length} Soal)</option>
                  {savedQuizzes.map((sq) => (
                    <option key={sq.id} value={sq.id}>
                      {sq.title} ({sq.questionsCount} Soal)
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Count Limit */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Jumlah Soal Dimainkan
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {(['all', '5', '10', '15', '20'] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNewRoomQuestionLimit(count)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                        newRoomQuestionLimit === count
                          ? `bg-gradient-to-r ${currentTheme.actionBtnGradient} border-white/40 text-white shadow-sm`
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count === 'all' ? 'Semua' : `${count}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Flow Settings (Waktu Soal & Waktu Jawaban) */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${currentTheme.accentClass}`} />
                    <span>Pengaturan Waktu PvP (Timer)</span>
                  </label>
                  {/* Preset quick shortcuts */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Kilat (1s/1s)', r: 0, q: 1, a: 1 },
                      { label: 'Cepat (4s/2s)', r: 1, q: 4, a: 2 },
                      { label: 'Standar (5s/3s)', r: 2, q: 5, a: 3 },
                      { label: 'Santai (10s/4s)', r: 3, q: 10, a: 4 },
                    ].map((p) => {
                      const isActive =
                        newRoomQuestionTimer === p.q &&
                        newRoomAnswerTimer === p.a;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setNewRoomReadTimer(p.r);
                            setNewRoomQuestionTimer(p.q);
                            setNewRoomAnswerTimer(p.a);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            isActive
                              ? `bg-gradient-to-r ${currentTheme.actionBtnGradient} text-white border-white/40 shadow-sm`
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2 Main inputs requested: Waktu Soal & Waktu Jawaban + Jeda Baca (Bisa hingga 1s bahkan 0s) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* 1. Waktu Soal (Sisi Depan) */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-300 block">Waktu Soal</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                        Depan
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={newRoomQuestionTimer}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setNewRoomQuestionTimer(isNaN(val) ? 0 : Math.max(0, Math.min(60, val)));
                        }}
                        className="w-full bg-slate-950 text-white font-bold text-center py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-400 text-sm font-mono"
                      />
                      <span className="text-xs text-slate-400 font-bold">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      {newRoomQuestionTimer === 0 ? '0 dtk (Tanpa Batas)' : newRoomQuestionTimer === 1 ? '1 dtk (Kilat/Blitz)' : 'Membaca & menjawab'}
                    </span>
                  </div>

                  {/* 2. Waktu Jawaban (Sisi Belakang) */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300 block">Waktu Jawaban</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        Belakang
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={newRoomAnswerTimer}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setNewRoomAnswerTimer(isNaN(val) ? 0 : Math.max(0, Math.min(30, val)));
                        }}
                        className="w-full bg-slate-950 text-white font-bold text-center py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-400 text-sm font-mono"
                      />
                      <span className="text-xs text-slate-400 font-bold">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      {newRoomAnswerTimer === 0 ? '0 dtk (Transisi Instan)' : newRoomAnswerTimer === 1 ? '1 dtk (Tinjau Kilat)' : 'Tinjau kunci jawaban'}
                    </span>
                  </div>

                  {/* 3. Jeda Baca Soal */}
                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 block">Jeda Baca Soal</span>
                      <span className="text-[9px] text-slate-400">sebelum opsi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={newRoomReadTimer}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setNewRoomReadTimer(isNaN(val) ? 0 : Math.max(0, Math.min(20, val)));
                        }}
                        className="w-full bg-slate-950 text-white font-bold text-center py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 text-sm font-mono"
                      />
                      <span className="text-xs text-slate-400 font-bold">dtk</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block truncate">
                      {newRoomReadTimer === 0 ? '0 dtk (Langsung Opsi)' : newRoomReadTimer === 1 ? '1 dtk (Baca Kilat)' : 'Bisa dilewati via spasi/klik'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Randomization Toggles (Acak Soal & Acak Opsi) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                  <Dices className={`w-3 h-3 ${currentTheme.accentClass}`} /> Acak Soal & Opsi
                </span>

                {/* Toggle 1: Acak Urutan Soal */}
                <div
                  onClick={() => setNewRoomShuffleQuestions(!newRoomShuffleQuestions)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    newRoomShuffleQuestions
                      ? `${currentTheme.badgeBgClass} ${currentTheme.cardBorderHighlight} text-white`
                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Shuffle className={`w-3.5 h-3.5 shrink-0 ${newRoomShuffleQuestions ? currentTheme.accentClass : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className="truncate">Acak Urutan Soal</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                          newRoomShuffleQuestions ? `${currentTheme.badgeBgClass} ${currentTheme.accentClass}` : 'bg-slate-800 text-slate-500'
                        }`}>
                          {newRoomShuffleQuestions ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Urutan soal diacak untuk tiap peserta
                      </p>
                    </div>
                  </div>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                    newRoomShuffleQuestions ? `bg-gradient-to-r ${currentTheme.actionBtnGradient}` : 'bg-slate-800'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm ${
                      newRoomShuffleQuestions ? 'translate-x-3.5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                {/* Toggle 2: Acak Pilihan Opsi A, B, C, D */}
                <div
                  onClick={() => setNewRoomShuffleOptions(!newRoomShuffleOptions)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    newRoomShuffleOptions
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Dices className={`w-3.5 h-3.5 shrink-0 ${newRoomShuffleOptions ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className="truncate">Acak Opsi Pilihan (A-D)</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                          newRoomShuffleOptions ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {newRoomShuffleOptions ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Posisi opsi jawaban disebar merata
                      </p>
                    </div>
                  </div>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                    newRoomShuffleOptions ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm ${
                      newRoomShuffleOptions ? 'translate-x-3.5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl bg-gradient-to-r ${currentTheme.actionBtnGradient} ${currentTheme.accentGlowClass} hover:brightness-110 active:scale-[0.99] text-white text-xs font-bold shadow-lg cursor-pointer transition-all flex items-center gap-1.5`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Buat Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
