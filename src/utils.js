// === src/utils.js ===
// Berisi fungsi-fungsi pembantu (helper) sederhana yang sering digunakan

/**
 * Menghentikan eksekusi kode sementara selama durasi tertentu.
 * @param {number} ms - Durasi jeda dalam milidetik (1 detik = 1000 ms)
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Menghasilkan string waktu saat ini dengan format: YYYY-MM-DD HH:mm:ss
 * @returns {string} Waktu lokal yang rapi
 */
function formatWaktuSekarang() {
  const sekarang = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const tgl = `${sekarang.getFullYear()}-${pad(sekarang.getMonth() + 1)}-${pad(sekarang.getDate())}`;
  const jam = `${pad(sekarang.getHours())}:${pad(sekarang.getMinutes())}:${pad(sekarang.getSeconds())}`;
  return `${tgl} ${jam}`;
}

/**
 * Mengubah timestamp Unix (detik) menjadi string tanggal terbaca.
 * @param {number|null} timestampSec - Timestamp dalam detik
 * @returns {string} Tanggal terbaca atau "Tidak diketahui"
 */
function formatTanggalUnix(timestampSec) {
  if (!timestampSec) return "Tidak diketahui";
  const d = new Date(timestampSec * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Menghitung selisih hari antara waktu saat ini dengan timestamp unix tertentu.
 * @param {number|null} timestampSec - Timestamp dalam detik
 * @returns {number} Jumlah hari selisih
 */
function hitungSelisihHari(timestampSec) {
  if (!timestampSec) return 9999; // Jika tidak ada riwayat pesan, anggap sangat lama
  const waktuPesan = timestampSec * 1000;
  const selisihMs = Date.now() - waktuPesan;
  return Math.floor(selisihMs / (1000 * 60 * 60 * 24));
}

module.exports = {
  sleep,
  formatWaktuSekarang,
  formatTanggalUnix,
  hitungSelisihHari,
};
