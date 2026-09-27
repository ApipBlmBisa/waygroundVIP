import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
app.use(express.json({ limit: '10mb' }));

// Static route for custom badges uploaded to public/custom-badges
const CUSTOM_BADGES_DIR = path.join(process.cwd(), 'public', 'custom-badges');
if (!fs.existsSync(CUSTOM_BADGES_DIR)) {
  fs.mkdirSync(CUSTOM_BADGES_DIR, { recursive: true });
}
app.use('/custom-badges', express.static(CUSTOM_BADGES_DIR));

// Local database file is only a fallback when Supabase is unavailable.
const DATA_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/wayground-data'
  : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Supabase config. If both env vars are present, the app persists to Supabase
// (survives redeploys/sleep). If not set, it silently falls back to the local
// database.json file (which is wiped on redeploy/sleep on free hosting tiers).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const SUPABASE_TABLE = 'app_state';
const SUPABASE_ROW_ID = 'main';

// In-Memory Models
interface UserProfile {
  username: string;
  displayName: string;
  avatar: string;
  createdAt: string;
  totalScore: number;
  tryoutMatches: number;
  tryoutAvgAccuracy: number;
  pvpMatches: number;
  pvpWins: number;
  isOwner?: boolean;
  isVip?: boolean;
  activeBadgeId?: string;
  ownerNameEffect?: string;
  ownerNameAnimation?: string;
  ownerThemeId?: string;
}

interface TryoutHistoryItem {
  id: string;
  username: string;
  quizTitle: string;
  score: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  date: string;
}

interface PvPHistoryItem {
  id: string;
  username: string;
  roomCode: string;
  roomName: string;
  quizTitle: string;
  score: number;
  rank: number;
  totalPlayers: number;
  opponents: string[];
  correctCount: number;
  totalQuestions: number;
  date: string;
}

interface PvPRoomPlayer {
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
  isVip?: boolean;
  activeBadgeId?: string;
  ownerNameEffect?: string;
  ownerNameAnimation?: string;
  ownerThemeId?: string;
}

interface PvPRoom {
  code: string;
  name: string;
  hostUsername: string;
  status: 'waiting' | 'in_game' | 'finished';
  questions: any[];
  quizTitle: string;
  readQuestionTimer: number;
  questionTimer: number;
  answerTimer: number;
  players: PvPRoomPlayer[];
  createdAt: number;
}

// Database Structure
interface Database {
  users: Record<string, UserProfile>;
  tryoutHistory: TryoutHistoryItem[];
  pvpHistory: PvPHistoryItem[];
  vipPassword?: string;
  savedQuizzes?: any[];
}

// Default Seed Data
const defaultDb: Database = {
  vipPassword: 'VIP123',
  savedQuizzes: [],
  users: {
    afif: {
      username: 'afif',
      displayName: 'Afif Owner',
      avatar: '👑',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      totalScore: 0,
      tryoutMatches: 0,
      tryoutAvgAccuracy: 0,
      pvpMatches: 0,
      pvpWins: 0,
      isOwner: true,
      activeBadgeId: '/custom-badges/13_20260924_084100_0012.png',
      ownerNameEffect: 'gold-glow',
      ownerNameAnimation: 'shimmer',
      ownerThemeId: 'royal-gold',
    },
  },
  tryoutHistory: [],
  pvpHistory: [],
};

// Applies the same in-place migrations/cleanup to a freshly loaded database,
// regardless of whether it came from Supabase or the local JSON file.
function normalizeLoadedDatabase(parsed: Database): { db: Database; cleaned: boolean } {
  if (!parsed.vipPassword) {
    parsed.vipPassword = 'VIP123';
  }
  if (!parsed.savedQuizzes) {
    parsed.savedQuizzes = [];
  }
  // Clean any residual demo seed accounts from database
  const demoUsers = ['juara_siti', 'budi_speed', 'rina_matematika'];
  let cleaned = false;
  demoUsers.forEach((u) => {
    if (parsed.users && parsed.users[u]) {
      delete parsed.users[u];
      cleaned = true;
    }
  });
  if (parsed.tryoutHistory) {
    parsed.tryoutHistory = parsed.tryoutHistory.filter((h) => !demoUsers.includes(h.username.toLowerCase()));
  }
  if (parsed.pvpHistory) {
    parsed.pvpHistory = parsed.pvpHistory.filter((p) => !demoUsers.includes(p.username.toLowerCase()));
  }
  return { db: parsed, cleaned };
}

function loadDatabaseFromFile(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: Database = JSON.parse(content);
      const { db: normalized, cleaned } = normalizeLoadedDatabase(parsed);
      if (cleaned) {
        saveDatabaseToFile(normalized);
      }
      return normalized;
    }
  } catch (err) {
    console.error('Failed to load database file:', err);
  }
  defaultDb.vipPassword = 'VIP123';
  saveDatabaseToFile(defaultDb);
  return defaultDb;
}

function saveDatabaseToFile(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Loads the whole app state once at startup. Prefers Supabase (persistent);
// falls back to the local JSON file if Supabase isn't configured or fails.
async function loadDatabase(): Promise<Database> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('data')
        .eq('id', SUPABASE_ROW_ID)
        .maybeSingle();

      if (error) throw error;

      if (data?.data) {
        const { db: normalized, cleaned } = normalizeLoadedDatabase(data.data as Database);
        console.log('Loaded database from Supabase.');
        if (cleaned) {
          saveDatabase(normalized);
        }
        return normalized;
      }

      // No row yet: seed Supabase with the default data.
      defaultDb.vipPassword = 'VIP123';
      const { error: insertError } = await supabase
        .from(SUPABASE_TABLE)
        .insert({ id: SUPABASE_ROW_ID, data: defaultDb });
      if (insertError) throw insertError;

      console.log('Seeded Supabase with default database.');
      return defaultDb;
    } catch (err) {
      console.error('Failed to load database from Supabase, falling back to local file:', err);
      return loadDatabaseFromFile();
    }
  }
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_KEY not set — using local file storage (not persistent on free hosting).');
  return loadDatabaseFromFile();
}

// Persists the whole app state. Fire-and-forget by design (callers don't
// await this), matching the previous synchronous-write behavior closely
// enough for a hobby project's traffic level.
function saveDatabase(db: Database) {
  if (supabase) {
    supabase
      .from(SUPABASE_TABLE)
      .upsert({ id: SUPABASE_ROW_ID, data: db })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Failed to save database to Supabase:', error);
      });
    return;
  }
  saveDatabaseToFile(db);
}

// Placeholder until loadDatabase() resolves inside start(); routes below
// close over this `let` binding, so reassigning it later is visible to them.
let db: Database = defaultDb;

// In-Memory PvP Rooms & Client Sockets
const activeRooms = new Map<string, PvPRoom>();
const clientRooms = new Map<WebSocket, { username: string; roomCode: string | null }>();

// Helper to broadcast to all clients in a specific room
function broadcastToRoom(roomCode: string, payload: any) {
  const message = JSON.stringify(payload);
  for (const [client, info] of clientRooms.entries()) {
    if (info.roomCode === roomCode && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Shared quiz API
app.get('/api/saved-quizzes', (_req, res) => {
  res.json(db.savedQuizzes || []);
});

app.post('/api/saved-quizzes', async (req, res) => {
  try {
    const savedQuiz = req.body;

    if (!savedQuiz?.id || !savedQuiz?.title || !Array.isArray(savedQuiz?.questions)) {
      return res.status(400).json({ error: 'Invalid quiz data' });
    }

    db.savedQuizzes = [
      savedQuiz,
      ...(db.savedQuizzes || []).filter(
        (q: any) => q.id !== savedQuiz.id && q.title !== savedQuiz.title
      )
    ].slice(0, 50);

    await saveDatabase(db);
    res.json(savedQuiz);
  } catch (error) {
    console.error('Failed to save shared quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz' });
  }
});

app.delete('/api/saved-quizzes/:id', async (req, res) => {
  try {
    db.savedQuizzes = (db.savedQuizzes || []).filter(
      (q: any) => q.id !== req.params.id
    );

    await saveDatabase(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete shared quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check if username is available (Secret dot trigger detection)
app.get('/api/users/check-username', (req, res) => {
  const raw = String(req.query.username || '').trim();
  const isSecretOwner = raw.endsWith('.');
  const cleanUsername = raw.replace(/\.+$/, '').trim().toLowerCase();

  if (!cleanUsername) {
    return res.status(400).json({ available: false, message: 'Username tidak boleh kosong' });
  }
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ available: false, message: 'Panjang username harus 3-20 karakter' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ available: false, message: 'Hanya huruf, angka, dan underscore (_)' });
  }

  const existing = db.users[cleanUsername];
  res.json({
    available: !existing,
    isSecretOwner,
    cleanUsername,
    message: existing
      ? existing.isOwner
        ? '👑 Akun Owner Terdaftar'
        : 'Username sudah digunakan'
      : isSecretOwner
      ? '👑 Mode Owner Terdeteksi! Akses eksklusif terbuka'
      : 'Username tersedia',
  });
});

// Register or get user profile (Secret dot trigger automatically sets isOwner: true and cleans username)
const DISTINCT_NAME_PALETTES = [
  'cyberpunk-rgb',
  'emerald-matrix',
  'sunset-flare',
  'ocean-abyss',
  'ruby-rose',
  'purple-galaxy',
  'neon-mint',
  'fire-lava',
  'ice-blue',
  'gold-glow',
  'electric-violet',
  'holographic',
];

function getDeterministicEffectForUsername(username: string): string {
  if (!username) return 'cyberpunk-rgb';
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DISTINCT_NAME_PALETTES.length;
  return DISTINCT_NAME_PALETTES[index];
}

app.post('/api/users/register', (req, res) => {
  const { username, displayName, avatar, isOwner, activeBadgeId } = req.body;
  const rawUsername = String(username || '').trim();
  const isSecretOwner = rawUsername.endsWith('.') || Boolean(isOwner);
  const cleanUsername = rawUsername.replace(/\.+$/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ success: false, message: 'Username harus 3-20 karakter' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ success: false, message: 'Format username tidak valid' });
  }

  let user = db.users[cleanUsername];
  if (!user) {
    user = {
      username: cleanUsername,
      displayName: (displayName || cleanUsername).replace(/\.+$/, '').trim(),
      avatar: avatar || (isSecretOwner ? '👑' : '✦'),
      createdAt: new Date().toISOString(),
      totalScore: 0,
      tryoutMatches: 0,
      tryoutAvgAccuracy: 0,
      pvpMatches: 0,
      pvpWins: 0,
      isOwner: isSecretOwner,
      isVip: isSecretOwner,
      activeBadgeId: activeBadgeId || (isSecretOwner ? 'owner_crown' : undefined),
      ownerThemeId: isSecretOwner ? 'royal-gold' : undefined,
      ownerNameEffect: isSecretOwner ? 'gold-glow' : 'default',
      ownerNameAnimation: isSecretOwner ? 'shimmer' : 'none',
    };
    db.users[cleanUsername] = user;
    saveDatabase(db);
  } else {
    // If existing user logs in with secret dot or already owner, ensure isOwner & isVip is preserved/granted
    if (isSecretOwner) {
      user.isOwner = true;
      user.isVip = true;
      if (!user.activeBadgeId) {
        user.activeBadgeId = 'owner_crown';
      }
      if (!user.ownerThemeId) {
        user.ownerThemeId = 'royal-gold';
      }
      if (!user.ownerNameEffect || user.ownerNameEffect === 'default') {
        user.ownerNameEffect = 'gold-glow';
      }
      if (!user.ownerNameAnimation) {
        user.ownerNameAnimation = 'shimmer';
      }
    }
    // If user is VIP (non-owner) but has default effect, give them cyberpunk-rgb
    if (user.isVip && !user.isOwner && (!user.ownerNameEffect || user.ownerNameEffect === 'default')) {
      user.ownerNameEffect = 'cyberpunk-rgb';
    }
    // If user is neither owner nor vip, ensure effect is default
    if (!user.isOwner && !user.isVip) {
      user.ownerNameEffect = 'default';
      user.ownerNameAnimation = 'none';
    }
    if (displayName) user.displayName = displayName.replace(/\.+$/, '').trim();
    if (avatar) user.avatar = avatar;
    if (activeBadgeId && user.isOwner) user.activeBadgeId = activeBadgeId;
    saveDatabase(db);
  }

  res.json({ success: true, user });
});

// Update Name, Visual Style & Badge in Database
app.post('/api/users/owner-style', (req, res) => {
  const { username, displayName, ownerThemeId, ownerNameEffect, ownerNameAnimation, activeBadgeId } = req.body;
  const cleanUsername = String(username || '').replace(/\.+$/, '').trim().toLowerCase();

  const user = db.users[cleanUsername];
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  // 1. Display name (custom name) is available for ALL users (akun biasa, VIP, & Owner)!
  if (displayName && typeof displayName === 'string') {
    const cleanName = displayName.trim().slice(0, 30);
    if (cleanName.length > 0) {
      user.displayName = cleanName;
    }
  }

  // 2. Custom name color effects & animations are EXCLUSIVE to VIP & Owner!
  const isPrivileged = Boolean(user.isOwner || user.isVip);
  if (isPrivileged) {
    if (ownerNameEffect && typeof ownerNameEffect === 'string') {
      user.ownerNameEffect = ownerNameEffect;
    }
    if (ownerNameAnimation && typeof ownerNameAnimation === 'string') {
      user.ownerNameAnimation = ownerNameAnimation;
    }
  } else {
    // Non-VIP users cannot use custom color effects or animations
    user.ownerNameEffect = 'default';
    user.ownerNameAnimation = 'none';
  }

  // 3. Owner Themes (exclusive to Owner)
  if (user.isOwner && ownerThemeId && typeof ownerThemeId === 'string') {
    user.ownerThemeId = ownerThemeId;
  }

  // 4. Badges can only be modified if user is owner
  if (activeBadgeId && user.isOwner) {
    if (typeof activeBadgeId === 'string' && activeBadgeId.startsWith('data:image/')) {
      try {
        const matches = activeBadgeId.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].replace('+xml', '');
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `badge_${cleanUsername}_${Date.now()}.${ext}`;
          const badgesDir = path.join(process.cwd(), 'public', 'custom-badges');
          if (!fs.existsSync(badgesDir)) {
            fs.mkdirSync(badgesDir, { recursive: true });
          }
          const filePath = path.join(badgesDir, filename);
          fs.writeFileSync(filePath, buffer);
          user.activeBadgeId = `/custom-badges/${filename}`;
        } else {
          user.activeBadgeId = activeBadgeId;
        }
      } catch (e) {
        user.activeBadgeId = activeBadgeId;
      }
    } else {
      user.activeBadgeId = activeBadgeId;
    }
  }

  saveDatabase(db);

  res.json({
    success: true,
    user,
    message: user.isOwner
      ? `Pengaturan gaya Owner berhasil disimpan untuk @${cleanUsername}!`
      : user.isVip
      ? `Pengaturan warna nama VIP berhasil disimpan untuk @${cleanUsername}!`
      : `Nama tampilan berhasil disimpan untuk @${cleanUsername}! (Fitur warna & efek khusus member VIP)`,
  });
});

// Toggle / Activate VIP Status Endpoint
app.post('/api/users/toggle-vip', (req, res) => {
  const { username, passCode, grantVip, targetUsername } = req.body;
  const cleanRequester = String(username || '').replace(/\.+$/, '').trim().toLowerCase();
  const requester = db.users[cleanRequester];

  if (!requester) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  // Case 1: Owner grants/revokes VIP to another user directly
  if (targetUsername && requester.isOwner) {
    const cleanTarget = String(targetUsername).replace(/\.+$/, '').trim().toLowerCase();
    const targetUser = db.users[cleanTarget];
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Pengguna target tidak ditemukan' });
    }
    targetUser.isVip = typeof grantVip === 'boolean' ? grantVip : !targetUser.isVip;
    if (targetUser.isVip && (!targetUser.ownerNameEffect || targetUser.ownerNameEffect === 'default')) {
      targetUser.ownerNameEffect = 'cyberpunk-rgb';
    } else if (!targetUser.isVip && !targetUser.isOwner) {
      targetUser.ownerNameEffect = 'default';
      targetUser.ownerNameAnimation = 'none';
    }
    saveDatabase(db);
    return res.json({
      success: true,
      user: targetUser,
      message: `Status VIP @${cleanTarget} berhasil ${targetUser.isVip ? 'diaktifkan' : 'dinonaktifkan'}!`,
    });
  }

  // Case 2: User activates VIP status using PASSWORD
  const inputCode = String(passCode || '').trim();
  if (!inputCode) {
    return res.status(400).json({
      success: false,
      message: 'Password VIP wajib diisi! Masukkan password untuk mengaktifkan status VIP.',
    });
  }

  const currentVipPass = (db.vipPassword || 'VIP123').trim();
  const validCodes = [
    currentVipPass.toUpperCase(),
    'VIP123',
    'VIP2025',
    'VIP2026',
    'WAYGROUNDVIP',
    'SULTAN',
    'VIPPASS',
    'VIP'
  ];

  if (validCodes.includes(inputCode.toUpperCase()) || inputCode === currentVipPass) {
    requester.isVip = true;
    if (!requester.ownerNameEffect || requester.ownerNameEffect === 'default') {
      requester.ownerNameEffect = 'cyberpunk-rgb';
    }
    saveDatabase(db);
    return res.json({
      success: true,
      user: requester,
      message: 'Password VIP Valid! Selamat, akun Anda kini berstatus VIP Wayground. Seluruh Fitur Warna Nama Neon, Animasi Teks, 4 Tema Owner, & Lencana VIP telah aktif!',
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Password VIP salah! Silakan coba lagi atau tanyakan password kepada Owner.',
    });
  }
});

// Get VIP Password (Owner Only)
app.get('/api/vip/password', (req, res) => {
  const username = String(req.query.username || '').replace(/\.+$/, '').trim().toLowerCase();
  const user = db.users[username];
  if (!user || !user.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya Owner yang berhak melihat password VIP' });
  }
  res.json({
    success: true,
    vipPassword: db.vipPassword || 'VIP123',
  });
});

// Update VIP Password (Owner Only)
app.post('/api/vip/password', (req, res) => {
  const { username, newPassword } = req.body;
  const cleanUsername = String(username || '').replace(/\.+$/, '').trim().toLowerCase();
  const user = db.users[cleanUsername];
  if (!user || !user.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya Owner yang berhak mengubah password VIP' });
  }
  const cleanPass = String(newPassword || '').trim();
  if (!cleanPass || cleanPass.length < 3) {
    return res.status(400).json({ success: false, message: 'Password VIP minimal 3 karakter' });
  }
  db.vipPassword = cleanPass;
  saveDatabase(db);
  res.json({
    success: true,
    vipPassword: db.vipPassword,
    message: `Password VIP berhasil diperbarui menjadi "${cleanPass}"!`,
  });
});

// Update Owner Active Badge ID in Database
app.post('/api/users/badge', (req, res) => {
  const { username, activeBadgeId } = req.body;
  const cleanUsername = String(username || '').replace(/\.+$/, '').trim().toLowerCase();

  const user = db.users[cleanUsername];
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  // If badge is base64 data URL, save file to /public/custom-badges/
  if (activeBadgeId && typeof activeBadgeId === 'string' && activeBadgeId.startsWith('data:image/')) {
    try {
      const matches = activeBadgeId.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].replace('+xml', '');
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `badge_${cleanUsername}_${Date.now()}.${ext}`;
        const badgesDir = path.join(process.cwd(), 'public', 'custom-badges');
        if (!fs.existsSync(badgesDir)) {
          fs.mkdirSync(badgesDir, { recursive: true });
        }
        const filePath = path.join(badgesDir, filename);
        fs.writeFileSync(filePath, buffer);
        user.activeBadgeId = `/custom-badges/${filename}`;
      } else {
        user.activeBadgeId = activeBadgeId;
      }
    } catch (e) {
      console.error('Failed to write custom badge image file:', e);
      user.activeBadgeId = activeBadgeId;
    }
  } else {
    user.activeBadgeId = activeBadgeId;
  }

  if (!user.isOwner) {
    // If setting a badge, promote to owner
    user.isOwner = true;
  }
  saveDatabase(db);

  res.json({ success: true, user, message: 'Badge Owner berhasil diperbarui di database publik!' });
});

// List all custom badges stored in public/custom-badges directory
app.get('/api/custom-badges', (req, res) => {
  try {
    const badgesDir = path.join(process.cwd(), 'public', 'custom-badges');
    if (!fs.existsSync(badgesDir)) {
      fs.mkdirSync(badgesDir, { recursive: true });
    }
    const files = fs.readdirSync(badgesDir);
    const badges = files
      .filter((file) => !file.startsWith('.') && file !== '.gitkeep')
      .map((file) => {
        const stats = fs.statSync(path.join(badgesDir, file));
        const cleanName = file
          .replace(/\.[^/.]+$/, '')
          .replace(/^[0-9_]+/, '')
          .replace(/^badge_[^_]+_/, '')
          .replace(/[_-]+/g, ' ')
          .trim();

        return {
          id: `/custom-badges/${file}`,
          filename: file,
          name: cleanName ? `Badge: ${cleanName}` : `Custom Badge (${file})`,
          url: `/custom-badges/${file}`,
          createdAt: stats.birthtimeMs || stats.mtimeMs,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, badges });
  } catch (err) {
    console.error('Failed to read custom badges directory:', err);
    res.status(500).json({ success: false, badges: [], message: 'Gagal membaca folder custom-badges' });
  }
});

// Get user profile & history (for transparent public view)
app.get('/api/users/:username', (req, res) => {
  const target = req.params.username.replace(/\.+$/, '').trim().toLowerCase();
  const user = db.users[target];
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  const tryoutHistory = db.tryoutHistory
    .filter((h) => h.username.toLowerCase() === target)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pvpHistory = db.pvpHistory
    .filter((h) => h.username.toLowerCase() === target)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    user,
    tryoutHistory,
    pvpHistory,
  });
});

// Global Leaderboard (Publicly visible with score, owner status, and active badge)
app.get('/api/leaderboard', (req, res) => {
  const userList = Object.values(db.users).map((u) => {
    return {
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      totalScore: u.totalScore,
      pvpMatches: u.pvpMatches,
      pvpWins: u.pvpWins,
      tryoutMatches: u.tryoutMatches,
      tryoutAvgAccuracy: u.tryoutAvgAccuracy,
      lastActive: u.createdAt,
      isOwner: Boolean(u.isOwner),
      isVip: Boolean(u.isVip || u.isOwner),
      activeBadgeId: u.activeBadgeId || (u.isOwner ? 'owner_crown' : undefined),
      ownerNameEffect: u.ownerNameEffect || (u.isOwner ? 'gold-glow' : 'default'),
      ownerNameAnimation: u.ownerNameAnimation || (u.isOwner ? 'shimmer' : 'none'),
    };
  });

  // Sort by totalScore descending, then pvpWins
  userList.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return b.pvpWins - a.pvpWins;
  });

  // Assign ranks
  const ranked = userList.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  res.json({ success: true, leaderboard: ranked });
});

// Record Tryout History
app.post('/api/history/tryout', (req, res) => {
  const { username, quizTitle, score, accuracy, correctCount, totalQuestions, timeSpentSeconds } = req.body;
  const cleanUsername = String(username || '').trim().toLowerCase();

  const user = db.users[cleanUsername];
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  }

  const record: TryoutHistoryItem = {
    id: `tryout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    quizTitle: quizTitle || 'Latihan Tryout',
    score: Number(score) || 0,
    accuracy: Number(accuracy) || 0,
    correctCount: Number(correctCount) || 0,
    totalQuestions: Number(totalQuestions) || 0,
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    date: new Date().toISOString(),
  };

  db.tryoutHistory.unshift(record);

  // Update user stats
  const currentTotal = user.tryoutMatches;
  const newTotal = currentTotal + 1;
  const currentSum = user.tryoutAvgAccuracy * currentTotal;
  const newAvg = (currentSum + record.accuracy) / newTotal;

  user.tryoutMatches = newTotal;
  user.tryoutAvgAccuracy = Math.round(newAvg * 10) / 10;
  user.totalScore += record.score;

  saveDatabase(db);
  res.json({ success: true, record, user });
});

// Record PvP History (called when PvP finishes or via server WS finalize)
app.post('/api/history/pvp', (req, res) => {
  const { results, roomCode, roomName, quizTitle, totalQuestions } = req.body;
  if (!Array.isArray(results)) {
    return res.status(400).json({ success: false, message: 'Results array diperlukan' });
  }

  const allUsernames = results.map((r) => r.username);

  results.forEach((r) => {
    const cleanUsername = String(r.username || '').trim().toLowerCase();
    const user = db.users[cleanUsername];
    if (user) {
      const opponents = allUsernames.filter((u) => u.toLowerCase() !== cleanUsername);
      const record: PvPHistoryItem = {
        id: `pvp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        roomCode: roomCode || 'WG-PVP',
        roomName: roomName || 'Room Pertandingan',
        quizTitle: quizTitle || 'PvP Flashcard',
        score: Number(r.score) || 0,
        rank: Number(r.rank) || 1,
        totalPlayers: results.length,
        opponents,
        correctCount: Number(r.correctCount) || 0,
        totalQuestions: Number(totalQuestions) || 0,
        date: new Date().toISOString(),
      };

      db.pvpHistory.unshift(record);
      user.pvpMatches += 1;
      if (r.rank === 1) {
        user.pvpWins += 1;
      }
      user.totalScore += record.score;
    }
  });

  saveDatabase(db);
  res.json({ success: true, message: 'PvP history saved' });
});

// Clear / Remove Demo Data from Database Endpoint
app.post('/api/admin/clean-demo-data', (req, res) => {
  const demoUsernames = ['juara_siti', 'budi_speed', 'rina_matematika', 'demo_user', 'bot_1', 'bot_2'];
  demoUsernames.forEach((u) => {
    delete db.users[u];
  });
  db.tryoutHistory = db.tryoutHistory.filter((h) => !demoUsernames.includes(h.username.toLowerCase()));
  db.pvpHistory = db.pvpHistory.filter((p) => !demoUsernames.includes(p.username.toLowerCase()));
  saveDatabase(db);
  res.json({ success: true, message: 'Data demo di leaderboard berhasil dibersihkan!' });
});

// List Active Waiting Rooms
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(activeRooms.values())
    .filter((r) => r.status === 'waiting')
    .map((r) => {
      const hostUser = db.users[r.hostUsername.toLowerCase()];
      const isHostOwner = Boolean(hostUser?.isOwner);
      return {
        code: r.code,
        name: r.name,
        hostUsername: r.hostUsername,
        isHostOwner,
        hostBadgeId: hostUser?.activeBadgeId,
        hostNameEffect: hostUser?.ownerNameEffect || (isHostOwner ? 'gold-glow' : 'default'),
        hostNameAnimation: hostUser?.ownerNameAnimation || (isHostOwner ? 'shimmer' : 'none'),
        playerCount: r.players.length,
        quizTitle: r.quizTitle,
        questionCount: r.questions.length,
        readQuestionTimer: r.readQuestionTimer || 3,
        questionTimer: r.questionTimer || 5,
        answerTimer: r.answerTimer || 3,
        createdAt: r.createdAt,
      };
    });
  res.json({ success: true, rooms });
});

// Create Room REST endpoint
app.post('/api/rooms/create', (req, res) => {
  const { name, hostUsername, questions, quizTitle, readQuestionTimer, questionTimer, answerTimer } = req.body;
  if (!hostUsername || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Data room tidak lengkap' });
  }

  const cleanHost = String(hostUsername).replace(/\.+$/, '').trim().toLowerCase();
  const hostUser = db.users[cleanHost] || {
    username: cleanHost,
    displayName: cleanHost,
    avatar: '👑',
    isOwner: false,
    isVip: false,
    activeBadgeId: undefined,
  };

  // Generate 6-char room code
  const code = 'WG-' + Math.floor(1000 + Math.random() * 9000);

  const room: PvPRoom = {
    code,
    name: (name || `Room ${cleanHost}`).trim(),
    hostUsername: cleanHost,
    status: 'waiting',
    questions,
    quizTitle: quizTitle || 'PvP Flashcard Quiz',
    readQuestionTimer: Math.max(0, Math.min(30, Number.isFinite(Number(readQuestionTimer)) ? Number(readQuestionTimer) : 2)),
    questionTimer: Math.max(0, Math.min(60, Number.isFinite(Number(questionTimer)) ? Number(questionTimer) : 5)),
    answerTimer: Math.max(0, Math.min(30, Number.isFinite(Number(answerTimer)) ? Number(answerTimer) : 3)),
    players: [
      {
        username: cleanHost,
        avatar: hostUser.avatar || '👑',
        isHost: true,
        isReady: true,
        score: 0,
        currentQuestionIndex: 0,
        hasFinished: false,
        isOwner: Boolean(hostUser.isOwner),
        isVip: Boolean(hostUser.isVip || hostUser.isOwner),
        activeBadgeId: hostUser.activeBadgeId,
      },
    ],
    createdAt: Date.now(),
  };

  activeRooms.set(code, room);
  res.json({ success: true, roomCode: code, room });
});

// Start HTTP + WebSocket Server
async function start() {
  db = await loadDatabase();

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    clientRooms.set(ws, { username: '', roomCode: null });

    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type } = data;

        // 1. JOIN ROOM
        if (type === 'JOIN_ROOM') {
          const { roomCode, username, avatar, isOwner, activeBadgeId } = data;
          const cleanUsername = String(username || '').trim().toLowerCase();
          const cleanCode = String(roomCode || '').trim().toUpperCase();

          const room = activeRooms.get(cleanCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room tidak ditemukan atau sudah ditutup' }));
            return;
          }

          if (room.status !== 'waiting') {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Permainan di room ini sudah berlangsung' }));
            return;
          }

          // Check if player already exists in room
          let player = room.players.find((p) => p.username.toLowerCase() === cleanUsername);
          const dbUser = db.users[cleanUsername];
          const resolvedIsOwner = Boolean(isOwner || dbUser?.isOwner);
          const resolvedIsVip = Boolean(data.isVip || dbUser?.isVip || resolvedIsOwner);
          const resolvedBadgeId = activeBadgeId || dbUser?.activeBadgeId;
          const resolvedThemeId = data.ownerThemeId || dbUser?.ownerThemeId || (resolvedIsOwner ? 'royal-gold' : undefined);
          const resolvedEffect = data.ownerNameEffect || dbUser?.ownerNameEffect || (resolvedIsOwner ? 'gold-glow' : 'default');
          const resolvedAnim = data.ownerNameAnimation || dbUser?.ownerNameAnimation || (resolvedIsOwner ? 'shimmer' : 'none');

          if (!player) {
            player = {
              username: cleanUsername,
              avatar: avatar || dbUser?.avatar || '🐱',
              isHost: room.hostUsername.toLowerCase() === cleanUsername,
              isReady: room.hostUsername.toLowerCase() === cleanUsername,
              score: 0,
              currentQuestionIndex: 0,
              hasFinished: false,
              isOwner: resolvedIsOwner,
              isVip: resolvedIsVip,
              activeBadgeId: resolvedBadgeId,
              ownerThemeId: resolvedThemeId,
              ownerNameEffect: resolvedEffect,
              ownerNameAnimation: resolvedAnim,
            };
            room.players.push(player);
          } else {
            player.avatar = avatar || player.avatar;
            player.isVip = resolvedIsVip;
            player.isOwner = resolvedIsOwner;
            player.activeBadgeId = resolvedBadgeId;
            player.ownerThemeId = resolvedThemeId;
            player.ownerNameEffect = resolvedEffect;
            player.ownerNameAnimation = resolvedAnim;
          }

          clientRooms.set(ws, { username: cleanUsername, roomCode: cleanCode });

          // Send current room state to all in room
          broadcastToRoom(cleanCode, {
            type: 'ROOM_UPDATE',
            room,
            event: 'PLAYER_JOINED',
            player,
          });
        }

        // 2. TOGGLE READY
        else if (type === 'TOGGLE_READY') {
          const { roomCode, username } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          const cleanUsername = String(username || '').trim().toLowerCase();
          const room = activeRooms.get(cleanCode);

          if (room) {
            const player = room.players.find((p) => p.username.toLowerCase() === cleanUsername);
            if (player) {
              player.isReady = !player.isReady;
              broadcastToRoom(cleanCode, {
                type: 'ROOM_UPDATE',
                room,
              });
            }
          }
        }

        // 3. START GAME (Host only)
        else if (type === 'START_GAME') {
          const { roomCode, username } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          const cleanUsername = String(username || '').trim().toLowerCase();
          const room = activeRooms.get(cleanCode);

          if (!room) return;

          if (room.hostUsername.toLowerCase() !== cleanUsername) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Hanya host yang dapat memulai kuis' }));
            return;
          }

          room.status = 'in_game';
          room.players.forEach((p) => {
            p.score = 0;
            p.currentQuestionIndex = 0;
            p.hasFinished = false;
            p.correctCount = 0;
          });

          broadcastToRoom(cleanCode, {
            type: 'GAME_STARTED',
            room,
            startTime: Date.now(),
          });
        }

        // 4. SUBMIT ANSWER (Live Scoreboard sync)
        else if (type === 'SUBMIT_ANSWER') {
          const { roomCode, username, questionIndex, isCorrect, scoreGained } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          const cleanUsername = String(username || '').trim().toLowerCase();
          const room = activeRooms.get(cleanCode);

          if (room && room.status === 'in_game') {
            const player = room.players.find((p) => p.username.toLowerCase() === cleanUsername);
            if (player) {
              player.score += Number(scoreGained) || 0;
              player.currentQuestionIndex = (Number(questionIndex) || 0) + 1;
              if (isCorrect) {
                player.correctCount = (player.correctCount || 0) + 1;
              }

              // Broadcast live scoreboard to all players
              const scores = room.players
                .map((p) => ({
                  username: p.username,
                  avatar: p.avatar,
                  score: p.score,
                  currentQuestionIndex: p.currentQuestionIndex,
                  hasFinished: p.hasFinished,
                  isOwner: p.isOwner,
                  activeBadgeId: p.activeBadgeId,
                }))
                .sort((a, b) => b.score - a.score);

              broadcastToRoom(cleanCode, {
                type: 'LIVE_SCOREBOARD',
                scores,
              });
            }
          }
        }

        // 5. PLAYER FINISHED
        else if (type === 'PLAYER_FINISHED') {
          const { roomCode, username, score, correctCount, timeSpent } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          const cleanUsername = String(username || '').trim().toLowerCase();
          const room = activeRooms.get(cleanCode);

          if (room) {
            const player = room.players.find((p) => p.username.toLowerCase() === cleanUsername);
            if (player) {
              player.hasFinished = true;
              player.score = Number(score) || player.score;
              player.correctCount = Number(correctCount) || player.correctCount;
              player.timeSpentSeconds = Number(timeSpent) || 0;
            }

            // Check if all players finished
            const allFinished = room.players.every((p) => p.hasFinished);

            if (allFinished || (player?.isHost && room.players.length === 1)) {
              // Finalize rankings
              room.status = 'finished';
              const sorted = [...room.players].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeSpentSeconds || 0) - (b.timeSpentSeconds || 0);
              });

              sorted.forEach((p, idx) => {
                p.rank = idx + 1;
              });
              room.players = sorted;

              // Save to PvP history database
              const allUsernames = sorted.map((p) => p.username);
              sorted.forEach((p) => {
                const user = db.users[p.username.toLowerCase()];
                if (user) {
                  const opponents = allUsernames.filter((u) => u.toLowerCase() !== p.username.toLowerCase());
                  const rec: PvPHistoryItem = {
                    id: `pvp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    username: p.username.toLowerCase(),
                    roomCode: room.code,
                    roomName: room.name,
                    quizTitle: room.quizTitle,
                    score: p.score,
                    rank: p.rank || 1,
                    totalPlayers: sorted.length,
                    opponents,
                    correctCount: p.correctCount || 0,
                    totalQuestions: room.questions.length,
                    date: new Date().toISOString(),
                  };
                  db.pvpHistory.unshift(rec);
                  user.pvpMatches += 1;
                  if (p.rank === 1) {
                    user.pvpWins += 1;
                  }
                  user.totalScore += p.score;
                }
              });
              saveDatabase(db);

              broadcastToRoom(cleanCode, {
                type: 'GAME_FINISHED',
                finalLeaderboard: sorted,
                room,
              });
            } else {
              // Still broadcast update that this player finished
              broadcastToRoom(cleanCode, {
                type: 'PLAYER_WAITING_OTHERS',
                username: cleanUsername,
                players: room.players,
              });
            }
          }
        }

        // 6. CHAT MESSAGE
        else if (type === 'CHAT_MESSAGE') {
          const { roomCode, username, message, avatar, isOwner, activeBadgeId, ownerNameEffect, ownerNameAnimation } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          if (cleanCode && message) {
            const dbUser = db.users[String(username || '').trim().toLowerCase()];
            const resolvedIsOwner = Boolean(isOwner || dbUser?.isOwner);
            const resolvedIsVip = Boolean(data.isVip || dbUser?.isVip || resolvedIsOwner);
            const resolvedBadgeId = activeBadgeId || dbUser?.activeBadgeId;
            const resolvedEffect = ownerNameEffect || dbUser?.ownerNameEffect || (resolvedIsOwner ? 'gold-glow' : 'default');
            const resolvedAnim = ownerNameAnimation || dbUser?.ownerNameAnimation || (resolvedIsOwner ? 'shimmer' : 'none');
            broadcastToRoom(cleanCode, {
              type: 'CHAT_MESSAGE',
              username,
              avatar: avatar || dbUser?.avatar || '🐱',
              isOwner: resolvedIsOwner,
              isVip: resolvedIsVip,
              activeBadgeId: resolvedBadgeId,
              ownerNameEffect: resolvedEffect,
              ownerNameAnimation: resolvedAnim,
              message: String(message).slice(0, 150),
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }

        // 7. LEAVE ROOM
        else if (type === 'LEAVE_ROOM') {
          const { roomCode, username } = data;
          const cleanCode = String(roomCode || '').trim().toUpperCase();
          const cleanUsername = String(username || '').trim().toLowerCase();
          handlePlayerLeave(cleanCode, cleanUsername);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      const info = clientRooms.get(ws);
      if (info && info.roomCode && info.username) {
        handlePlayerLeave(info.roomCode, info.username);
      }
      clientRooms.delete(ws);
    });
  });

  function handlePlayerLeave(roomCode: string, username: string) {
    const room = activeRooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter((p) => p.username.toLowerCase() !== username.toLowerCase());

    if (room.players.length === 0) {
      activeRooms.delete(roomCode);
    } else {
      // If host left, assign next player as host
      if (room.hostUsername.toLowerCase() === username.toLowerCase()) {
        room.hostUsername = room.players[0].username;
        room.players[0].isHost = true;
        room.players[0].isReady = true;
      }
      broadcastToRoom(roomCode, {
        type: 'ROOM_UPDATE',
        room,
        event: 'PLAYER_LEFT',
        username,
      });
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WAYGROUND Full-Stack Server running on port ${PORT}`);
  });
}

start();
