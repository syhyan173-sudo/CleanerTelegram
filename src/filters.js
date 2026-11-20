// === src/filters.js ===
// Menerapkan aturan penyaringan: kata kunci kecualikan, ID kecualikan, kontak HP, kata kunci wajib, hari aktif, & batas maks

const logger = require("./logger");
const { hitungSelisihHari } = require("./utils");

/**
 * Menerapkan semua filter konfigurasi terhadap daftar obrolan
 * @param {Array<object>} daftar - Hasil dari dialogs.js
 * @param {object} cfg - Objek config dari src/config.js
 * @returns {Array<object>} Daftar yang lolos seleksi filter
 */
function saringDialog(daftar, cfg) {
  logger.info("Memeriksa filter penyaringan...");

  const hasil = [];
  let dikecualikanKataKunci = 0;
  let dikecualikanId = 0;
  let dikecualikanKontak = 0;
  let tidakLolosWajib = 0;
  let tidakLolosHari = 0;

  for (const item of daftar) {
    const namaKecil = item.nama.toLowerCase();
    const idStr = String(item.id);

    // 1. Filter ID Dikecualikan
    const apakahDikecualikanId = cfg.KECUALIKAN_ID.some((idBanned) => {
      const idBannedStr = String(idBanned).trim();
      return idStr === idBannedStr || idStr === `-${idBannedStr}` || idStr === `-100${idBannedStr}`;
    });

    if (apakahDikecualikanId) {
      dikecualikanId++;
      continue;
    }

    // 2. Filter Kontak Pribadi (teman yang tersimpan di buku telepon)
    if (cfg.KECUALIKAN_KONTAK && item.status === "KONTAK") {
      dikecualikanKontak++;
      continue;
    }

    // 3. Filter Kata Kunci Dikecualikan (Case-insensitive)
    const apakahDikecualikanNama = cfg.KECUALIKAN.some((kata) =>
      namaKecil.includes(kata.toLowerCase().trim())
    );

    if (apakahDikecualikanNama) {
      dikecualikanKataKunci++;
      continue;
    }

    // 4. Filter Hanya Jika Mengandung Kata Kunci Tertentu (jika diatur)
    if (cfg.HANYA_JIKA_MENGANDUNG.length > 0) {
      const adaKataWajib = cfg.HANYA_JIKA_MENGANDUNG.some((kata) =>
        namaKecil.includes(kata.toLowerCase().trim())
      );
      if (!adaKataWajib) {
        tidakLolosWajib++;
        continue;
      }
    }

    // 5. Filter Hari Tidak Aktif (jika diatur > 0)
    if (cfg.HARI_TIDAK_AKTIF > 0) {
      const selisihHari = hitungSelisihHari(item.timestampPesanTerakhir);
      if (selisihHari < cfg.HARI_TIDAK_AKTIF) {
        // Masih aktif dalam rentang hari tersebut
        tidakLolosHari++;
        continue;
      }
    }

    hasil.push(item);
  }

  // Tampilkan ringkasan yang tersaring jika ada yang dilewati
  if (dikecualikanKontak > 0) logger.info(`Dilewati karena KONTAK PRIBADI tersimpan: ${dikecualikanKontak}`);
  if (dikecualikanId > 0) logger.info(`Dilewati karena KECUALIKAN_ID: ${dikecualikanId}`);
  if (dikecualikanKataKunci > 0) logger.info(`Dilewati karena KECUALIKAN (nama): ${dikecualikanKataKunci}`);
  if (tidakLolosWajib > 0) logger.info(`Dilewati karena tidak mengandung kata wajib: ${tidakLolosWajib}`);
  if (tidakLolosHari > 0) logger.info(`Dilewati karena masih aktif (< ${cfg.HARI_TIDAK_AKTIF} hari): ${tidakLolosHari}`);

  // 6. Potong sesuai MAKS_PROSES jika diatur > 0
  if (cfg.MAKS_PROSES > 0 && hasil.length > cfg.MAKS_PROSES) {
    logger.info(
      `Membatasi jumlah proses menjadi ${cfg.MAKS_PROSES} (dari ${hasil.length}) sesuai MAKS_PROSES.`
    );
    return hasil.slice(0, cfg.MAKS_PROSES);
  }

  return hasil;
}

module.exports = {
  saringDialog,
};
