import { UserProfile, LeaderboardEntry, TryoutHistoryItem, PvPHistoryItem, PvPRoom, CustomBadgeItem } from '../types';

export const CURRENT_USER_KEY = 'wayground_current_username';

export function getStoredUsername(): string | null {
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

export function setStoredUsername(username: string): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, username.toLowerCase());
  } catch (err) {
    console.error('Failed to store username:', err);
  }
}

export function clearStoredUsername(): void {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // ignore
  }
}

// REST API Methods
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  message: string;
  isSecretOwner?: boolean;
  cleanUsername?: string;
}> {
  try {
    const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
    return await res.json();
  } catch {
    return { available: false, message: 'Gagal menghubungi server' };
  }
}

export async function registerUserProfile(
  username: string,
  displayName: string,
  avatar: string,
  isOwner?: boolean,
  activeBadgeId?: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, avatar, isOwner, activeBadgeId }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Koneksi server gagal' };
  }
}

export async function updateOwnerBadge(
  username: string,
  activeBadgeId: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  try {
    const res = await fetch('/api/users/badge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, activeBadgeId }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan badge ke server' };
  }
}

export async function updateOwnerStyle(
  username: string,
  params: {
    displayName?: string;
    ownerNameEffect?: string;
    ownerNameAnimation?: string;
    activeBadgeId?: string;
  }
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  try {
    const res = await fetch('/api/users/owner-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, ...params }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan kustomisasi Owner ke database' };
  }
}

export async function fetchCustomBadges(): Promise<{
  success: boolean;
  badges: CustomBadgeItem[];
  message?: string;
}> {
  try {
    const res = await fetch('/api/custom-badges');
    return await res.json();
  } catch {
    return { success: false, badges: [] };
  }
}

export async function fetchUserProfile(username: string): Promise<{
  success: boolean;
  user?: UserProfile;
  tryoutHistory?: TryoutHistoryItem[];
  pvpHistory?: PvPHistoryItem[];
  message?: string;
}> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
    return await res.json();
  } catch {
    return { success: false, message: 'Gagal mengambil data profil' };
  }
}

export async function fetchGlobalLeaderboard(): Promise<{ success: boolean; leaderboard: LeaderboardEntry[] }> {
  try {
    const res = await fetch('/api/leaderboard');
    return await res.json();
  } catch {
    return { success: false, leaderboard: [] };
  }
}

export async function recordTryoutHistory(data: {
  username: string;
  quizTitle: string;
  score: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/history/tryout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result.success;
  } catch {
    return false;
  }
}

export async function fetchActiveRooms(): Promise<{ success: boolean; rooms: any[] }> {
  try {
    const res = await fetch('/api/rooms');
    return await res.json();
  } catch {
    return { success: false, rooms: [] };
  }
}

export async function createPvPRoom(data: {
  name: string;
  hostUsername: string;
  questions: any[];
  quizTitle: string;
  readQuestionTimer?: number;
  questionTimer: number;
  answerTimer?: number;
}): Promise<{ success: boolean; roomCode?: string; room?: PvPRoom; message?: string }> {
  try {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Gagal membuat room' };
  }
}

// WebSocket Helper for Real-Time PvP
export class PvPWebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private openHandlers: (() => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private shouldReconnect = true;

  connect() {
    this.shouldReconnect = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.openHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach((h) => h(data));
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    this.ws.onclose = () => {
      this.closeHandlers.forEach((h) => h());
      if (this.shouldReconnect) {
        setTimeout(() => {
          if (this.shouldReconnect) this.connect();
        }, 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('WebSocket error:', err);
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onOpen(handler: () => void) {
    this.openHandlers.push(handler);
    return () => {
      this.openHandlers = this.openHandlers.filter((h) => h !== handler);
    };
  }

  onClose(handler: () => void) {
    this.closeHandlers.push(handler);
    return () => {
      this.closeHandlers = this.closeHandlers.filter((h) => h !== handler);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
