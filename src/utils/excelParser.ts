import * as XLSX from 'xlsx';
import { FlashcardQuestion } from '../types';

/**
 * Normalizes an object's keys to lowercase alphanumeric for robust column matching
 */
function findKeyValue(row: Record<string, unknown>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const target of possibleKeys) {
    const found = rowKeys.find(
      k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === target.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (found && row[found] !== undefined && row[found] !== null) {
      return String(row[found]).trim();
    }
  }
  return '';
}

/**
 * Checks if a string contains Arabic characters or diacritics
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Normalizes Arabic text and ensures isolated diacritical marks (harakat)
 * have an appropriate carrier (such as tatweel 'ـ' or dotted circle)
 * so that harakat are visibly rendered instead of collapsing or disappearing.
 */
export function normalizeHarakatText(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  // Arabic combining diacritical marks range:
  // \u064B (fathatan) to \u065F (wavy hamza below), \u0670 (superscript alef)
  const isOnlyDiacritics = /^[\u064B-\u065F\u0670\s]+$/.test(trimmed);
  if (isOnlyDiacritics) {
    // Isolated harakat with no base letter - attach a tatweel carrier 'ـ'
    // E.g. 'ـَ' so the harakat is clearly floating on a visible baseline
    return `ـ${trimmed.trim()}`;
  }

  return trimmed;
}

/**
 * Clean option text while preserving numbers, mathematical expressions,
 * and Arabic harakat / diacritics.
 */
export function cleanOptionText(text: string): string {
  if (!text) return '';
  const raw = String(text).trim();
  if (!raw) return '';

  // CRITICAL FIX: NEVER strip digits (1-4, 0-9, or Arabic numerals) as they are part of test content
  // (e.g. "1. َ", "1 dan 2", "1. Fathah", "2. Kasrah", etc.).
  // ONLY strip option letter prefixes like "A. ", "B) ", "(C) ", "D - ", "a. "
  // and ONLY if there is actual remaining text after the prefix.
  const prefixRegex = /^(\s*(\(|\[)?[A-Da-d](\)|\.|\:|\-)\s+)/;
  let cleaned = raw;
  if (prefixRegex.test(raw)) {
    const candidate = raw.replace(prefixRegex, '').trim();
    if (candidate.length > 0) {
      cleaned = candidate;
    }
  }

  return normalizeHarakatText(cleaned);
}

/**
 * Parse Excel (.xlsx, .xls, .csv) file content into FlashcardQuestion array
 */
export async function parseExcelQuizFile(file: File): Promise<FlashcardQuestion[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');
  }

  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Sheet Excel kosong atau tidak memiliki baris data.');
  }

  const questions: FlashcardQuestion[] = [];

  rawRows.forEach((row, index) => {
    const questionText = findKeyValue(row, ['Pertanyaan', 'Question', 'Soal', 'Teks Soal']);
    const rawOptA = findKeyValue(row, ['Pilihan A', 'Option A', 'A', 'Jawaban A']) || 'Pilihan A';
    const rawOptB = findKeyValue(row, ['Pilihan B', 'Option B', 'B', 'Jawaban B']) || 'Pilihan B';
    const rawOptC = findKeyValue(row, ['Pilihan C', 'Option C', 'C', 'Jawaban C']) || 'Pilihan C';
    const rawOptD = findKeyValue(row, ['Pilihan D', 'Option D', 'D', 'Jawaban D']) || 'Pilihan D';
    const rawKey = findKeyValue(row, ['Kunci Jawaban', 'Kunci', 'Jawaban Benar', 'Answer', 'Key']);

    if (!questionText) {
      // Skip empty row
      return;
    }

    const optA = cleanOptionText(rawOptA);
    const optB = cleanOptionText(rawOptB);
    const optC = cleanOptionText(rawOptC);
    const optD = cleanOptionText(rawOptD);

    const normKey = rawKey.toUpperCase().trim();
    const cleanKey = cleanOptionText(rawKey).toUpperCase();
    let correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A';

    if (
      normKey === 'A' ||
      normKey.startsWith('A.') ||
      normKey.startsWith('A)') ||
      normKey === rawOptA.toUpperCase() ||
      cleanKey === optA.toUpperCase()
    ) {
      correctAnswer = 'A';
    } else if (
      normKey === 'B' ||
      normKey.startsWith('B.') ||
      normKey.startsWith('B)') ||
      normKey === rawOptB.toUpperCase() ||
      cleanKey === optB.toUpperCase()
    ) {
      correctAnswer = 'B';
    } else if (
      normKey === 'C' ||
      normKey.startsWith('C.') ||
      normKey.startsWith('C)') ||
      normKey === rawOptC.toUpperCase() ||
      cleanKey === optC.toUpperCase()
    ) {
      correctAnswer = 'C';
    } else if (
      normKey === 'D' ||
      normKey.startsWith('D.') ||
      normKey.startsWith('D)') ||
      normKey === rawOptD.toUpperCase() ||
      cleanKey === optD.toUpperCase()
    ) {
      correctAnswer = 'D';
    } else {
      const char = normKey.replace(/[^ABCD]/g, '').charAt(0);
      if (char === 'A' || char === 'B' || char === 'C' || char === 'D') {
        correctAnswer = char;
      }
    }

    questions.push({
      id: `q-${index + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      question: questionText,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD,
      },
      correctAnswer,
    });
  });

  if (questions.length === 0) {
    throw new Error('Tidak ditemukan soal yang valid. Pastikan kolom sesuai format: Pertanyaan, Pilihan A, Pilihan B, Pilihan C, Pilihan D, Kunci Jawaban');
  }

  return questions;
}

/**
 * Downloads a ready-to-use template Excel (.xlsx) file matching the exact expected format
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      'Pertanyaan': 'Apa ibu kota negara Indonesia saat ini?',
      'Pilihan A': 'Surabaya',
      'Pilihan B': 'Jakarta',
      'Pilihan C': 'Bandung',
      'Pilihan D': 'Medan',
      'Kunci Jawaban': 'B',
    },
    {
      'Pertanyaan': 'Planet manakah yang dijuluki sebagai Planet Merah?',
      'Pilihan A': 'Venus',
      'Pilihan B': 'Jupiter',
      'Pilihan C': 'Mars',
      'Pilihan D': 'Saturnus',
      'Kunci Jawaban': 'C',
    },
    {
      'Pertanyaan': 'Berapakah hasil dari 15 x 6 + 10?',
      'Pilihan A': '100',
      'Pilihan B': '95',
      'Pilihan C': '80',
      'Pilihan D': '110',
      'Kunci Jawaban': 'A',
    },
    {
      'Pertanyaan': 'Unsur kimia dengan simbol O adalah...',
      'Pilihan A': 'Emas',
      'Pilihan B': 'Oksigen',
      'Pilihan C': 'Helium',
      'Pilihan D': 'Karbon',
      'Kunci Jawaban': 'B',
    },
    {
      'Pertanyaan': 'Siapakah penemu bola lampu pijar modern?',
      'Pilihan A': 'Alexander Graham Bell',
      'Pilihan B': 'Nikola Tesla',
      'Pilihan C': 'Thomas Alva Edison',
      'Pilihan D': 'Albert Einstein',
      'Kunci Jawaban': 'C',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 45 }, // Pertanyaan
    { wch: 25 }, // Pilihan A
    { wch: 25 }, // Pilihan B
    { wch: 25 }, // Pilihan C
    { wch: 25 }, // Pilihan D
    { wch: 15 }, // Kunci Jawaban
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Soal Kuis');
  XLSX.writeFile(workbook, 'Template_Soal_Wayground_Flashcard.xlsx');
}

/**
 * Built-in Preset Questions so user can test the app immediately without uploading
 */
export const SAMPLE_PRESET_QUIZZES: { title: string; desc: string; questions: FlashcardQuestion[] }[] = [
  {
    title: 'Kuis Pengetahuan Umum & Sains',
    desc: '5 Soal tentang Geografi, Sains, dan Trivia Dunia',
    questions: [
      {
        id: 'sample-1',
        question: 'Apa nama ibukota negara Jepang?',
        options: {
          A: 'Kyoto',
          B: 'Osaka',
          C: 'Tokyo',
          D: 'Hiroshima',
        },
        correctAnswer: 'C',
      },
      {
        id: 'sample-2',
        question: 'Gas apa yang paling banyak terkandung di atmosfer bumi?',
        options: {
          A: 'Oksigen',
          B: 'Nitrogen',
          C: 'Karbon Dioksida',
          D: 'Argon',
        },
        correctAnswer: 'B',
      },
      {
        id: 'sample-3',
        question: 'Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...',
        options: {
          A: 'Jantung',
          B: 'Paru-paru',
          C: 'Hati',
          D: 'Ginjal',
        },
        correctAnswer: 'A',
      },
      {
        id: 'sample-4',
        question: 'Siapakah ilmuwan yang mencetuskan Teori Relativitas?',
        options: {
          A: 'Isaac Newton',
          B: 'Galileo Galilei',
          C: 'Stephen Hawking',
          D: 'Albert Einstein',
        },
        correctAnswer: 'D',
      },
      {
        id: 'sample-5',
        question: 'Benua terbesar di dunia berdasarkan luas daratan adalah...',
        options: {
          A: 'Afrika',
          B: 'Asia',
          C: 'Amerika Utara',
          D: 'Eropa',
        },
        correctAnswer: 'B',
      },
    ],
  },
  {
    title: 'Kuis Teknologi & Komputer Wayground',
    desc: '4 Soal tentang Web, Pemrograman, dan Hardware',
    questions: [
      {
        id: 'sample-tech-1',
        question: 'Apa kepanjangan dari singkatan "HTML"?',
        options: {
          A: 'Hyper Transfer Markup Language',
          B: 'Hyper Text Markup Language',
          C: 'High Tech Modern Language',
          D: 'Home Tool Markup Language',
        },
        correctAnswer: 'B',
      },
      {
        id: 'sample-tech-2',
        question: 'Komponen komputer yang berfungsi sebagai otak utama pengolah instruksi adalah...',
        options: {
          A: 'RAM',
          B: 'SSD',
          C: 'GPU',
          D: 'CPU',
        },
        correctAnswer: 'D',
      },
      {
        id: 'sample-tech-3',
        question: 'Perusahaan pembuat sistem operasi Android adalah...',
        options: {
          A: 'Google',
          B: 'Apple',
          C: 'Microsoft',
          D: 'Samsung',
        },
        correctAnswer: 'A',
      },
      {
        id: 'sample-tech-4',
        question: 'Bahasa pemrograman yang sering digunakan untuk interaktivitas di browser adalah...',
        options: {
          A: 'Python',
          B: 'JavaScript',
          C: 'C++',
          D: 'PHP',
        },
        correctAnswer: 'B',
      },
    ],
  },
  {
    title: 'Kuis Huruf Hijaiyah & Tanda Harakat',
    desc: '4 Soal tanda baca harakat Arab lengkap dengan angka pilihan',
    questions: [
      {
        id: 'sample-arab-1',
        question: 'Manakah tanda harakat yang menghasilkan bunyi vokal "A" (Fathah)?',
        options: {
          A: '1. َ (Fathah)',
          B: '2. ِ (Kasrah)',
          C: '3. ُ (Dhammah)',
          D: '4. ْ (Sukun)',
        },
        correctAnswer: 'A',
      },
      {
        id: 'sample-arab-2',
        question: 'Tanda baca Tanwin Kasratain ("-in") ditunjukkan oleh nomor...',
        options: {
          A: '1. ً (Fathatain)',
          B: '2. ٍ (Kasratain)',
          C: '3. ٌ (Dhammatain)',
          D: '4. ّ (Tasydid)',
        },
        correctAnswer: 'B',
      },
      {
        id: 'sample-arab-3',
        question: 'Huruf yang berharakat Dhommah terdapat pada nomor...',
        options: {
          A: '1. بَ',
          B: '2. بِ',
          C: '3. بُ',
          D: '4. بْ',
        },
        correctAnswer: 'C',
      },
      {
        id: 'sample-arab-4',
        question: 'Tanda Sukun (mati) ditunjukkan oleh simbol nomor...',
        options: {
          A: '1. َ',
          B: '2. ِ',
          C: '3. ُ',
          D: '4. ْ',
        },
        correctAnswer: 'D',
      },
    ],
  },
];
