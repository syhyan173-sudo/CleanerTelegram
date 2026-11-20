// === src/confirm.js ===
// Menampilkan preview daftar grup/chat dan meminta konfirmasi pengguna sebelum tindakan destruktif

const input = require("input");
const logger = require("./logger");

/**
 * Menampilkan daftar obrolan yang akan diproses ke terminal dengan nomor dan status peran
 * @param {Array<object>} daftar
 */
function tampilkanDaftarPreview(daftar) {
  console.log("\n========================================================");
  console.log(` DAFTAR OBROLAN YANG AKAN DIPROSES (TOTAL: ${daftar.length})`);
  console.log("========================================================");

  let countOwner = 0;
  let countAdmin = 0;
  let countMember = 0;
  let countBot = 0;
  let countUser = 0;

  daftar.forEach((item, idx) => {
    let tag = `[${item.status}]`;
    if (item.status === "OWNER") countOwner++;
    else if (item.status === "ADMIN") countAdmin++;
    else if (item.status === "BOT") countBot++;
    else if (item.status === "USER") countUser++;
    else countMember++;

    const baris = `${String(idx + 1).padStart(3, " ")}. ${tag.padEnd(9, " ")} | ${item.nama} (ID: ${item.id})`;
    console.log(baris);
  });

  console.log("--------------------------------------------------------");
  const rincian = [];
  if (countOwner > 0) rincian.push(`OWNER: ${countOwner}`);
  if (countAdmin > 0) rincian.push(`ADMIN: ${countAdmin}`);
  if (countMember > 0) rincian.push(`MEMBER: ${countMember}`);
  if (countBot > 0) rincian.push(`BOT: ${countBot}`);
  if (countUser > 0) rincian.push(`USER: ${countUser}`);
  console.log(`Rincian: ${rincian.join(" | ")}`);
  console.log("========================================================\n");
}

/**
 * Meminta konfirmasi eksekusi kepada pengguna dengan pengamanan bertingkat
 * @param {Array<object>} daftar - Daftar yang akan diproses
 * @param {object} cfg - Konfigurasi
 * @returns {Promise<boolean>} true jika dikonfirmasi, false jika dibatalkan
 */
async function mintaKonfirmasi(daftar, cfg) {
  // Jika DRY_RUN aktif, tidak perlu minta konfirmasi eksekusi nyata
  if (cfg.DRY_RUN) {
    logger.warn("DRY_RUN = true: Program berada dalam mode SIMULASI.");
    logger.info("Tidak ada grup atau chat yang akan ditinggalkan/dihapus.");
    logger.info(`Daftar lengkap tetap tersimpan di file "${cfg.FILE_BACKUP}".`);
    return false;
  }

  if (daftar.length === 0) {
    logger.info("Tidak ada obrolan yang memenuhi kriteria untuk diproses.");
    return false;
  }

  // Peringatan awal
  console.log("\nPERINGATAN: Anda akan keluar/menghapus obrolan di atas secara otomatis!");
  const jawaban1 = await input.text('Ketik "YA" (huruf besar) untuk melanjutkan eksekusi: ');

  if (jawaban1.trim() !== "YA") {
    logger.warn('Konfirmasi dibatalkan (Anda tidak mengetik "YA"). Program berhenti.');
    return false;
  }

  // Jika opsi HAPUS_JIKA_OWNER aktif dan ada grup dengan status OWNER
  const adaGrupOwner = daftar.some((d) => d.status === "OWNER");
  if (cfg.HAPUS_JIKA_OWNER && adaGrupOwner) {
    console.log("\n⚠️ PERINGATAN KRITIS: Opsi HAPUS_JIKA_OWNER bernilai TRUE.");
    console.log("Grup yang Anda buat/miliki ([OWNER]) akan DIHAPUS PERMANEN untuk semua anggota!");
    const jawaban2 = await input.text('Ketik persis "HAPUS PERMANEN" untuk menyetujui penghapusan: ');

    if (jawaban2.trim() !== "HAPUS PERMANEN") {
      logger.warn('Konfirmasi kedua dibatalkan. Program berhenti demi keamanan.');
      return false;
    }
  }

  return true;
}

module.exports = {
  tampilkanDaftarPreview,
  mintaKonfirmasi,
};
