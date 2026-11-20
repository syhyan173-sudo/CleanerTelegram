// === src/logger.js ===
// Modul pencatat aktivitas (logger) ke terminal dan file teks secara bersamaan

const fs = require("fs");
const path = require("path");
const { formatWaktuSekarang } = require("./utils");

let logFilePath = path.resolve(process.cwd(), "log_bersih.txt");

/**
 * Mengatur path file log yang digunakan oleh logger.
 * @param {string} namaFile
 */
function inisialisasiLogger(namaFile) {
  if (namaFile) {
    logFilePath = path.resolve(process.cwd(), namaFile);
  }
}

/**
 * Menyaring teks agar tidak memunculkan data sensitif seperti API Hash atau String Session.
 * @param {string} pesan
 * @returns {string} Pesan yang sudah disterilkan
 */
function bersihkanPesanSensitif(pesan) {
  if (typeof pesan !== "string") return String(pesan);
  // Sensor karakter sesi GramJS (biasanya string panjang berawalan 1B atau 1A)
  let bersih = pesan.replace(/1[A-Za-z0-9_-]{50,}/g, "[SESI_DISEMBUNYIKAN]");
  // Sensor kemungkinan hash 32 karakter hexadecimal
  bersih = bersih.replace(/[a-f0-9]{32}/gi, "[HASH_DISEMBUNYIKAN]");
  return bersih;
}

/**
 * Menuliskan log ke terminal dan menambahkan ke file log.
 * @param {"INFO"|"WARN"|"ERROR"|"SUKSES"} level
 * @param {string} pesan
 */
function tulisLog(level, pesan) {
  const waktu = formatWaktuSekarang();
  const pesanAman = bersihkanPesanSensitif(pesan);
  const baris = `[${waktu}] [${level}] ${pesanAman}`;

  // Tampilkan di terminal dengan format rapi
  if (level === "ERROR") {
    console.error(`\x1b[31m${baris}\x1b[0m`);
  } else if (level === "WARN") {
    console.warn(`\x1b[33m${baris}\x1b[0m`);
  } else if (level === "SUKSES") {
    console.log(`\x1b[32m${baris}\x1b[0m`);
  } else {
    console.log(baris);
  }

  // Tulis ke file log secara sinkron/append agar tidak hilang jika terjadi crash
  try {
    fs.appendFileSync(logFilePath, baris + "\n", "utf-8");
  } catch (err) {
    console.error("Gagal menulis ke file log:", err.message);
  }
}

module.exports = {
  inisialisasiLogger,
  info: (pesan) => tulisLog("INFO", pesan),
  warn: (pesan) => tulisLog("WARN", pesan),
  error: (pesan) => tulisLog("ERROR", pesan),
  sukses: (pesan) => tulisLog("SUKSES", pesan),
};
