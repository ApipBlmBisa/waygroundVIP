export interface FlashcardQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface UserAnswerResult {
  questionId: string;
  questionNumber: number;
  questionText: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  selectedText: string;
  correctText: string;
  isCorrect: boolean;
  isTimedOut: boolean;
  timeSpent: number; // in seconds
}

export type ThemeId =
  | 'cyber-purple'
  | 'tokyo-cyberpunk'
  | 'emerald-matrix'
  | 'ocean-abyss'
  | 'solar-flare'
  | 'synth-vaporwave'
  | 'carbon-stealth'
  // 4 Exclusive Owner Themes:
  | 'obsidian-gold'
  | 'cyber-neon-cyan'
  | 'deep-purple-glow'
  | 'crimson-blood';

export interface QuizSettings {
  themeId: ThemeId;
  readQuestionTimer: number; // default: 3 seconds (waktu membaca soal sebelum opsi muncul)
  questionTimer: number;     // default: 5 seconds (waktu memilih opsi setelah opsi muncul)
  answerTimer: number;       // default: 3 seconds (waktu kartu menampilkan kunci jawaban)
  soundEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  bgImageUrl: string | null;
  bgBlur: number;            // in px, e.g. 8
  bgOpacity: number;         // 0 to 100
}

export interface SavedQuiz {
  id: string;
  title: string;
  fileName: string;
  uploadedAt: string;
  questionsCount: number;
  questions: FlashcardQuestion[];
}

export type QuizState = 'setup' | 'playing' | 'results';
export type CardPhase = 'reading' | 'answering' | 'revealed' | 'transitioning';
export type CardSide = 'front' | 'back';

export interface SecurityConfig {
  isProtectionEnabled: boolean;
  passwordHash: string;
  passwordHint: string;
  createdAt: number;
  lastChangedAt: number;
}

export type OwnerNameEffect =
  | 'default'
  | 'gold-glow'
  | 'cyberpunk-rgb'
  | 'fire-lava'
  | 'holographic'
  | 'emerald-matrix'
  | 'ocean-abyss'
  | 'sunset-flare'
  | 'ruby-rose'
  | 'purple-galaxy'
  | 'neon-mint'
  | 'ice-blue'
  | 'electric-violet';

export type OwnerNameAnimation =
  | 'none'
  | 'shimmer'
  | 'neon-glow'
  | 'pulse-wave';

// User Profile
export interface UserProfile {
  username: string;
  displayName: string;
  avatar: string; // emoji or icon code e.g. "🐱", "🚀", "⚡"
  createdAt: string;
  totalScore: number;
  tryoutMatches: number;
  tryoutAvgAccuracy: number;
  pvpMatches: number;
  pvpWins: number;
  isOwner?: boolean;
  activeBadgeId?: string;
  ownerNameEffect?: OwnerNameEffect;
  ownerNameAnimation?: OwnerNameAnimation;
}

// Individual History: Tryout vs PvP
export interface TryoutHistoryItem {
  id: string;
  username: string;
  quizTitle: string;
  score: number;
  accuracy: number; // percentage e.g. 85.5
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  date: string;
}

export interface PvPHistoryItem {
  id: string;
  username: string;
  roomCode: string;
  roomName: string;
  quizTitle: string;
  score: number;
  rank: number; // e.g. 1
  totalPlayers: number; // e.g. 4 -> "Rank 1 dari 4 pemain"
  opponents: string[]; // List of other players' usernames
  correctCount: number;
  totalQuestions: number;
  date: string;
}

// PvP Multiplayer Room
export interface PvPRoomPlayer {
  username: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  currentQuestionIndex: number;
  hasFinished: boolean;
  rank?: number;
  correctCount?: number;
  timeSpentSeconds?: number;
  isOwner?: boolean;
  activeBadgeId?: string;
  ownerNameEffect?: OwnerNameEffect;
  ownerNameAnimation?: OwnerNameAnimation;
}

export interface PvPRoom {
  code: string;
  name: string;
  hostUsername: string;
  status: 'waiting' | 'in_game' | 'finished';
  questions: FlashcardQuestion[];
  quizTitle: string;
  readQuestionTimer?: number; // in seconds (waktu baca soal)
  questionTimer: number; // in seconds (waktu menjawab)
  answerTimer?: number; // in seconds (waktu tinjau kunci jawaban)
  players: PvPRoomPlayer[];
  createdAt: number;
}

export interface CustomBadgeItem {
  id: string;
  filename: string;
  name: string;
  url: string;
  createdAt: number;
  sizeBytes: number;
  sizeFormatted: string;
}

// Global Leaderboard Item
export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  avatar: string;
  totalScore: number;
  pvpMatches: number;
  pvpWins: number;
  tryoutMatches: number;
  tryoutAvgAccuracy: number;
  lastActive: string;
  isOwner?: boolean;
  activeBadgeId?: string;
  ownerNameEffect?: OwnerNameEffect;
  ownerNameAnimation?: OwnerNameAnimation;
}
