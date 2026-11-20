// === src/runner.js ===
// Menjalankan antrean pembersihan, penanganan FloodWait retry, limit error beruntun, dan ringkasan

const logger = require("./logger");
const { sleep } = require("./utils");
const { keluarDariGrup, hapusGrup, hapusChatPribadi } = require("./actions");
const { ambilDetikFloodWait, klasifikasiError } = require("./errors");

/**
 * Menjalankan proses keluar/hapus grup & chat satu per satu
 * @param {object} client - TelegramClient
 * @param {Array<object>} daftar - Daftar yang sudah disaring
 * @param {object} cfg - Objek config
 * @returns {Promise<object>} Ringkasan statistik eksekusi
 */
async function jalankanPembersihan(client, daftar, cfg) {
  const statistik = {
    total: daftar.length,
    berhasilKeluar: 0,
    berhasilDihapus: 0,
    berhasilChatPribadi: 0,
    dilewati: 0,
    gagal: 0,
    rincianGagal: [],
  };

  let errorBeruntun = 0;
  let berhentiKarenaInterupsi = false;

  // Tangani sinyal Ctrl+C (SIGINT) agar berhenti dengan rapi
  const sigintHandler = () => {
    console.log("\n[!] Menerima sinyal Ctrl+C (Batal). Menghentikan antrean setelah obrolan ini...");
    berhentiKarenaInterupsi = true;
  };
  process.on("SIGINT", sigintHandler);

  logger.info(`Memulai eksekusi pembersihan ${daftar.length} obrolan...`);

  for (let i = 0; i < daftar.length; i++) {
    if (berhentiKarenaInterupsi) {
      logger.warn("Pembersihan dihentikan pengguna lewat Ctrl+C.");
      break;
    }

    if (errorBeruntun >= 5) {
      logger.error(
        "TERJADI 5 KESALAHAN BERTURUT-TURUT! Program dihentikan otomatis demi keamanan akun Anda."
      );
      break;
    }

    const item = daftar[i];
    const nomorProgres = `[${i + 1}/${daftar.length}]`;
    const adalahPribadi = item.tipe === "user" || item.tipe === "bot";
    const adalahOwner = item.status === "OWNER";
    const akanDihapus = adalahOwner && cfg.HAPUS_JIKA_OWNER;

    let labelAksi = "Keluar";
    if (adalahPribadi) {
      labelAksi = "Hapus Obrolan Pribadi";
    } else if (akanDihapus) {
      labelAksi = "HAPUS PERMANEN";
    }

    let selesaiItemIni = false;
    let percobaan = 0;
    const MAX_PERCOBAAN_FLOOD = 3;

    while (!selesaiItemIni && percobaan < MAX_PERCOBAAN_FLOOD) {
      percobaan++;
      try {
        if (adalahPribadi) {
          await hapusChatPribadi(client, item);
          statistik.berhasilChatPribadi++;
          logger.sukses(`${nomorProgres} Berhasil Hapus Chat: "${item.nama}" (ID: ${item.id})`);
        } else if (akanDihapus) {
          await hapusGrup(client, item);
          statistik.berhasilDihapus++;
          logger.sukses(`${nomorProgres} Berhasil Hapus Grup: "${item.nama}" (ID: ${item.id})`);
        } else {
          await keluarDariGrup(client, item);
          statistik.berhasilKeluar++;
          logger.sukses(`${nomorProgres} Berhasil Keluar: "${item.nama}" (ID: ${item.id})`);
        }

        errorBeruntun = 0; // Reset counter kesalahan jika sukses
        selesaiItemIni = true;
      } catch (err) {
        // Cek apakah terkena FloodWait dari Telegram
        const detikTunggu = ambilDetikFloodWait(err);
        if (detikTunggu !== null) {
          const jedaTunggu = detikTunggu + 1;
          logger.warn(
            `${nomorProgres} Terkena limit FloodWait Telegram (${detikTunggu} detik). Menunggu ${jedaTunggu} detik sebelum mencoba ulang...`
          );
          await sleep(jedaTunggu * 1000);
          continue; // Ulangi obrolan yang sama
        }

        // Jika bukan flood wait, catat kegagalan dan lanjutkan
        const alasan = klasifikasiError(err);
        statistik.gagal++;
        statistik.rincianGagal.push({
          nama: item.nama,
          id: item.id,
          alasan: alasan,
        });
        errorBeruntun++;

        logger.error(
          `${nomorProgres} Gagal ${labelAksi} "${item.nama}": ${alasan} (Error beruntun: ${errorBeruntun}/5)`
        );
        selesaiItemIni = true; // Lanjut ke item berikutnya
      }
    }

    // Jeda antar permintaan agar ramah terhadap API Telegram
    if (i < daftar.length - 1 && !berhentiKarenaInterupsi) {
      await sleep(cfg.JEDA_MS);
    }
  }

  // Bersihkan event listener SIGINT
  process.removeListener("SIGINT", sigintHandler);

  return statistik;
}

/**
 * Menampilkan ringkasan hasil pembersihan ke terminal dan log
 * @param {object} stat - Objek statistik dari jalankanPembersihan
 */
function tampilkanRingkasan(stat) {
  console.log("\n========================================================");
  console.log("            RINGKASAN AKHIR PEMBERSIHAN");
  console.log("========================================================");
  console.log(`Total Target             : ${stat.total}`);
  console.log(`Berhasil Keluar (Grup)   : ${stat.berhasilKeluar}`);
  console.log(`Berhasil Dihapus (Owner) : ${stat.berhasilDihapus}`);
  console.log(`Berhasil Dihapus (Chat)  : ${stat.berhasilChatPribadi}`);
  console.log(`Gagal                    : ${stat.gagal}`);
  console.log("--------------------------------------------------------");

  if (stat.rincianGagal.length > 0) {
    console.log("Rincian Kesalahan:");
    stat.rincianGagal.forEach((item, idx) => {
      console.log(` ${idx + 1}. ${item.nama} (ID: ${item.id}) -> ${item.alasan}`);
    });
    console.log("--------------------------------------------------------");
  }

  console.log("Proses selesai dengan aman.\n");
}

module.exports = {
  jalankanPembersihan,
  tampilkanRingkasan,
};
