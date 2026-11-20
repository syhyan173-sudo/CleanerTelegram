// === src/backup.js ===
// Menyimpan daftar obrolan yang akan diproses ke file CSV sebelum tindakan apa pun dieksekusi

const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const { formatTanggalUnix } = require("./utils");

/**
 * Membersihkan dan mengenkapsulasi string untuk format CSV standar (RFC 4180).
 * Jika ada tanda kutip ganda ("), diganti dengan dua tanda kutip ("").
 * Seluruh teks dibungkus tanda kutip ganda agar koma dan baris baru tidak merusak kolom.
 * @param {string|number} teks
 * @returns {string} String yang aman untuk CSV
 */
function escapeCsv(teks) {
  if (teks === null || teks === undefined) return '""';
  const str = String(teks).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Menyimpan daftar obrolan ke file CSV sebagai arsip/backup
 * @param {Array<object>} daftar - Daftar obrolan
 * @param {string} namaFile - Nama file CSV (misal: "daftar_grup.csv")
 * @returns {string} Path absolut file CSV
 */
function simpanKeCsv(daftar, namaFile = "daftar_grup.csv") {
  const filePath = path.resolve(process.cwd(), namaFile);

  const header = [
    "No",
    "ID",
    "Nama_Grup",
    "Tipe",
    "Status_Peran",
    "Username",
    "Jumlah_Anggota",
    "Pesan_Terakhir",
  ];

  const baris = [header.map(escapeCsv).join(",")];

  daftar.forEach((item, index) => {
    const barisData = [
      index + 1,
      item.id,
      item.nama,
      item.tipe,
      item.status,
      item.username,
      item.jumlahAnggota,
      formatTanggalUnix(item.timestampPesanTerakhir),
    ];
    baris.push(barisData.map(escapeCsv).join(","));
  });

  // Tulis ke file dengan encoding UTF-8 (BOM opsional untuk kompatibilitas Excel)
  const bom = "\uFEFF";
  fs.writeFileSync(filePath, bom + baris.join("\n"), "utf-8");

  logger.sukses(`Daftar ${daftar.length} grup berhasil dicadangkan ke: ${namaFile}`);
  return filePath;
}

module.exports = {
  simpanKeCsv,
  escapeCsv,
};
