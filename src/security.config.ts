/**
 * ==============================================================================
 * KONFIGURASI KATA SANDI & KEAMANAN WEB (KHUSUS KODING / ANTI-HACK)
 * ==============================================================================
 * Demi keamanan maksimal agar web tidak dapat di-hack atau di-reset oleh pengunjung:
 * - Pengaturan kata sandi DIHAPUS dari antarmuka web (UI).
 * - Pengunjung / siswa TIDAK BISA mengganti atau mereset sandi lewat browser.
 * - HANYA ANDA (pemilik kodingan) yang dapat mengatur sandi di file ini.
 * ==============================================================================
 */

export const SECURITY_CONFIG = {
  /**
   * 1. KATA SANDI WEB
   * Ganti kata sandi di bawah ini sesuai keinginan Anda:
   * Contoh: 'rahasia2025', 'kuis-ipa-123', dsb.
   */
  PASSWORD: 'jangan nangis',

  /**
   * 2. STATUS PROTEKSI
   * true  = Web terkunci, wajib memasukkan kata sandi di atas untuk membuka.
   * false = Web terbuka bebas (siapa pun bisa langsung masuk tanpa sandi).
   */
  IS_PROTECTED: true,

  /**
   * 3. PETUNJUK SANDI (HINT) UNTUK PENGUNJUNG
   * Teks petunjuk yang akan ditampilkan di layar kunci.
   * Kosongkan "" jika tidak ingin menampilkan petunjuk sama sekali.
   */
  HINT: '',
};
