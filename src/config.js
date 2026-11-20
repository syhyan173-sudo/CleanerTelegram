// === src/config.js ===
// Membaca variabel lingkungan (.env), konfigurasi pembersihan, dan memvalidasi nilainya

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Muat file .env jika ada
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback default dotenv
}

/**
 * Mengubah string boolean atau variabel env ke nilai boolean murni
 * @param {string|undefined} val
 * @param {boolean} nilaiDefault
 * @returns {boolean}
 */
function parseBoolean(val, nilaiDefault) {
  if (val === undefined || val === null || val === "") return nilaiDefault;
  return String(val).trim().toLowerCase() === "true" || String(val).trim() === "1";
}

/**
 * Mengubah string daftar dipisah koma menjadi array string bersih
 * @param {string|undefined} val
 * @returns {string[]}
 */
function parseArray(val) {
  if (!val) return [];
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Konfigurasi aplikasi
const config = {
  // Kredensial Telegram (Wajib dari .env)
  API_ID: process.env.API_ID ? parseInt(process.env.API_ID.trim(), 10) : null,
  API_HASH: process.env.API_HASH ? process.env.API_HASH.trim() : "",

  // Mode Pengoperasian
  // DRY_RUN = true: Hanya simulasi (membaca & membuat CSV), TIDAK KELUAR/HAPUS GRUP
  // DRY_RUN = false: Eksekusi nyata untuk keluar/hapus grup
  DRY_RUN: parseBoolean(process.env.DRY_RUN, true),

  // HAPUS_JIKA_OWNER = false: Hanya keluar dari grup biasa / supergroup
  // HAPUS_JIKA_OWNER = true: Jika akun Anda adalah PEMBUAT (OWNER), grup akan DIHAPUS PERMANEN
  HAPUS_JIKA_OWNER: parseBoolean(process.env.HAPUS_JIKA_OWNER, false),

  // TARGET: Jenis entitas yang ingin diproses
  // Pilihan: "grup" | "channel" | "keduanya" | "pribadi" | "semua"
  TARGET: (process.env.TARGET || "keduanya").toLowerCase().trim(),

  // Lindungi kontak pribadi (teman yang tersimpan di kontak HP) agar tidak ikut terhapus
  // Default: true (Sangat disarankan)
  KECUALIKAN_KONTAK: parseBoolean(process.env.KECUALIKAN_KONTAK, true),

  // Filter Kata Kunci Nama Grup / Obrolan (Case-insensitive)
  // Contoh: ["Keluarga", "Kantor", "Penting"]
  KECUALIKAN: parseArray(process.env.KECUALIKAN),

  // Filter ID Grup / Obrolan (Angka ID yang TIDAK BOLEH disentuh/dihapus)
  // Contoh: ["-1001234567890", "987654321"]
  KECUALIKAN_ID: parseArray(process.env.KECUALIKAN_ID),

  // Hanya proses grup yang namanya mengandung kata berikut (jika kosong = proses semua)
  // Contoh: ["Promo", "Airdrop", "Crypto"]
  HANYA_JIKA_MENGANDUNG: parseArray(process.env.HANYA_JIKA_MENGANDUNG),

  // Batas Maksimal Grup yang diproses dalam 1 sesi (0 = tanpa batas)
  MAKS_PROSES: process.env.MAKS_PROSES ? parseInt(process.env.MAKS_PROSES, 10) : 0,

  // Jeda Waktu antar aksi (milidetik). Sangat disarankan minimal 2000 ms (2 detik)
  JEDA_MS: process.env.JEDA_MS ? parseInt(process.env.JEDA_MS, 10) : 2000,

  // Filter grup berdasarkan riwayat keaktifan pesan terakhir (dalam jumlah hari)
  // 0 = nonaktif (tidak memfilter umur pesan)
  // Misal 30 = hanya proses grup yang tidak ada pesan baru selama lebih dari 30 hari
  HARI_TIDAK_AKTIF: process.env.HARI_TIDAK_AKTIF ? parseInt(process.env.HARI_TIDAK_AKTIF, 10) : 0,

  // Nama File Penyimpanan
  FILE_LOG: process.env.FILE_LOG || "log_bersih.txt",
  FILE_BACKUP: process.env.FILE_BACKUP || "daftar_grup.csv",
  FILE_SESI: process.env.FILE_SESI || "sesi.txt",
};

/**
 * Validasi kelayakan konfigurasi sebelum bot dijalankan.
 * Jika konfigurasi penting belum ada, hentikan program dengan instruksi jelas.
 */
function validasiConfig() {
  const kesalahan = [];

  if (!config.API_ID || isNaN(config.API_ID)) {
    kesalahan.push(
      "API_ID belum diisi atau bukan angka valid. Silakan isi di file .env (contoh: API_ID=12345678)."
    );
  }

  if (!config.API_HASH || config.API_HASH.length < 10) {
    kesalahan.push(
      "API_HASH belum diisi atau tidak valid. Silakan isi di file .env."
    );
  }

  const pilihanTarget = ["grup", "channel", "keduanya", "pribadi", "semua"];
  if (!pilihanTarget.includes(config.TARGET)) {
    kesalahan.push(
      `TARGET tidak valid (${config.TARGET}). Pilihan yang tersedia: "grup", "channel", "keduanya", "pribadi", atau "semua".`
    );
  }

  if (kesalahan.length > 0) {
    console.error("\n========================================================");
    console.error(" [!] KESALAHAN PADA KONFIGURASI PROGRAM");
    console.error("========================================================");
    kesalahan.forEach((pesan, idx) => {
      console.error(`${idx + 1}. ${pesan}`);
    });
    console.error("\nPanduan: Salin file .env.example menjadi .env lalu isi datanya.");
    console.error("========================================================\n");
    process.exit(1);
  }
}

module.exports = {
  config,
  validasiConfig,
};
