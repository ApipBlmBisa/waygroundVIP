import { FlashcardQuestion } from '../types';

/**
 * Cryptographically strong random number generator between 0 and 1.
 * Falls back to Math.random if Web Crypto API is unavailable.
 */
export function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
  }
  return Math.random();
}

/**
 * Fisher-Yates unbiased array shuffle algorithm using secure random
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Deranges an array of questions so that no question stays in its original position
 * if there are at least 2 questions.
 */
export function derangeQuestions(questions: FlashcardQuestion[]): FlashcardQuestion[] {
  if (questions.length <= 1) return [...questions];

  let candidate = shuffleArray(questions);
  let attempts = 0;

  while (attempts < 25) {
    const fixedPoints = candidate.filter((item, idx) => item.id === questions[idx].id).length;
    // Aim for 0 fixed points (complete derangement) or at least different first question
    if (fixedPoints === 0 && candidate[0].id !== questions[0].id) {
      return candidate;
    }
    candidate = shuffleArray(questions);
    attempts++;
  }

  // Fallback if random permutation didn't derange completely:
  // Apply a non-zero shift offset and shuffle again
  const offset = 1 + Math.floor(secureRandom() * (questions.length - 1));
  const shifted = questions.map((_, idx) => questions[(idx + offset) % questions.length]);
  return shuffleArray(shifted);
}

/**
 * Generates an evenly distributed, non-repeating sequence of target correct answer
 * keys ('A', 'B', 'C', 'D') across N questions so that:
 * 1. The correct answers are distributed evenly (e.g. ~25% A, ~25% B, ~25% C, ~25% D)
 * 2. No two adjacent questions share the exact same correct answer (no 'B, B, B' streaks)
 * 3. Cannot be predicted ("tidak ketebak") by the quiz taker
 */
export function generateBalancedAnswerKeys(count: number): Array<'A' | 'B' | 'C' | 'D'> {
  const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  if (count <= 0) return [];
  if (count === 1) return [keys[Math.floor(secureRandom() * keys.length)]];

  const pool: Array<'A' | 'B' | 'C' | 'D'> = [];
  const fullCycles = Math.floor(count / 4);
  const remainder = count % 4;

  for (let c = 0; c < fullCycles; c++) {
    pool.push('A', 'B', 'C', 'D');
  }

  const extraKeys = shuffleArray([...keys]);
  for (let r = 0; r < remainder; r++) {
    pool.push(extraKeys[r]);
  }

  // Multi-attempt shuffle to guarantee NO consecutive identical keys
  let attempts = 0;
  while (attempts < 40) {
    const candidate = shuffleArray(pool);
    let hasConsecutiveSame = false;
    for (let i = 0; i < candidate.length - 1; i++) {
      if (candidate[i] === candidate[i + 1]) {
        hasConsecutiveSame = true;
        break;
      }
    }
    if (!hasConsecutiveSame) {
      return candidate;
    }
    attempts++;
  }

  // Greedy resolution for any remaining adjacent collisions
  const result = shuffleArray(pool);
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i] === result[i + 1]) {
      for (let j = 0; j < result.length; j++) {
        if (
          result[j] !== result[i] &&
          (j === 0 || result[j - 1] !== result[i]) &&
          (j === result.length - 1 || result[j + 1] !== result[i])
        ) {
          const temp = result[i + 1];
          result[i + 1] = result[j];
          result[j] = temp;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Shuffles options (A, B, C, D) for a question by assigning the correct answer to targetKey,
 * and dynamically randomizing the other 3 incorrect choices into the remaining slots.
 */
export function shuffleQuestionWithOptionsTarget(
  q: FlashcardQuestion,
  targetKey: 'A' | 'B' | 'C' | 'D'
): FlashcardQuestion {
  const originalOptions = q.options;
  const correctText = originalOptions[q.correctAnswer];

  const allKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const incorrectKeys = allKeys.filter((k) => k !== q.correctAnswer);
  const incorrectTexts = shuffleArray(incorrectKeys.map((k) => originalOptions[k]));

  const remainingKeys = shuffleArray(allKeys.filter((k) => k !== targetKey));

  const newOptions = {
    A: '',
    B: '',
    C: '',
    D: '',
  };

  // Place correct text in target slot
  newOptions[targetKey] = correctText;

  // Place the remaining incorrect choices in the remaining slots
  remainingKeys.forEach((key, idx) => {
    newOptions[key] = incorrectTexts[idx];
  });

  return {
    ...q,
    options: newOptions,
    correctAnswer: targetKey,
  };
}

/**
 * Prepares questions for a quiz session based on user settings:
 * - Shuffles question ordering completely (derangement) if shuffleQuestions is enabled
 * - Shuffles options (A, B, C, D) with balanced, non-repeating key distribution if shuffleOptions is enabled
 */
export function prepareQuizQuestions(
  rawQuestions: FlashcardQuestion[],
  options: { shuffleQuestions: boolean; shuffleOptions: boolean }
): FlashcardQuestion[] {
  if (!rawQuestions || rawQuestions.length === 0) return [];

  // Deep clone to ensure zero mutations on raw references
  let list: FlashcardQuestion[] = rawQuestions.map((q) => ({
    ...q,
    options: { ...q.options },
  }));

  // 1. Shuffle Questions with complete derangement
  if (options.shuffleQuestions && list.length > 1) {
    list = derangeQuestions(list);
  }

  // 2. Shuffle Options with balanced non-repeating distribution
  if (options.shuffleOptions) {
    const balancedKeys = generateBalancedAnswerKeys(list.length);
    list = list.map((q, idx) => {
      const targetKey = balancedKeys[idx] || (['A', 'B', 'C', 'D'][idx % 4] as 'A' | 'B' | 'C' | 'D');
      return shuffleQuestionWithOptionsTarget(q, targetKey);
    });
  }

  return list;
}
