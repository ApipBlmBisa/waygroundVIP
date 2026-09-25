import { QuizSettings, SavedQuiz } from '../types';

const SETTINGS_KEY = 'wayground_quiz_settings_v2';
const HISTORY_KEY = 'wayground_saved_quizzes_v1';

export const DEFAULT_SETTINGS: QuizSettings = {
  themeId: 'cyber-purple',
  readQuestionTimer: 3,
  questionTimer: 5,
  answerTimer: 3,
  soundEnabled: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  bgImageUrl: null,
  bgBlur: 6,
  bgOpacity: 75,
};

export function loadStoredSettings(): QuizSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        themeId: parsed.themeId || 'cyber-purple',
        readQuestionTimer: Number(parsed.readQuestionTimer) || 3,
        questionTimer: Number(parsed.questionTimer) || 5,
        answerTimer: Number(parsed.answerTimer) || 3,
        shuffleQuestions: parsed.shuffleQuestions !== undefined ? Boolean(parsed.shuffleQuestions) : true,
        shuffleOptions: parsed.shuffleOptions !== undefined ? Boolean(parsed.shuffleOptions) : true,
      };
    }

    // Auto-migrate from v1: preserve user theme & custom timers, but enforce shuffle defaults to true
    const oldRaw = localStorage.getItem('wayground_quiz_settings_v1');
    if (oldRaw) {
      try {
        const oldParsed = JSON.parse(oldRaw);
        const migrated: QuizSettings = {
          ...DEFAULT_SETTINGS,
          themeId: oldParsed.themeId || 'cyber-purple',
          readQuestionTimer: Number(oldParsed.readQuestionTimer) || 3,
          questionTimer: Number(oldParsed.questionTimer) || 5,
          answerTimer: Number(oldParsed.answerTimer) || 3,
          soundEnabled: oldParsed.soundEnabled !== undefined ? Boolean(oldParsed.soundEnabled) : true,
          shuffleQuestions: true,
          shuffleOptions: true,
          bgImageUrl: oldParsed.bgImageUrl || null,
          bgBlur: Number(oldParsed.bgBlur) || 6,
          bgOpacity: Number(oldParsed.bgOpacity) || 75,
        };
        saveStoredSettings(migrated);
        return migrated;
      } catch {
        // fallback to default
      }
    }

    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: QuizSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function loadSavedQuizzes(): SavedQuiz[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveQuizHistory(quiz: SavedQuiz): SavedQuiz[] {
  try {
    const existing = loadSavedQuizzes();
    // Filter out duplicate if same ID or exact same title
    const filtered = existing.filter(q => q.id !== quiz.id && q.title !== quiz.title);
    // Keep up to 15 recent quizzes
    const updated = [quiz, ...filtered].slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save quiz to history:', err);
    return [];
  }
}

export function deleteSavedQuiz(id: string): SavedQuiz[] {
  try {
    const existing = loadSavedQuizzes();
    const updated = existing.filter(q => q.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
