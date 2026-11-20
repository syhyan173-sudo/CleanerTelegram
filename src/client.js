// === src/client.js ===
// Menginisialisasi TelegramClient (GramJS), menangani login akun pribadi dan penyimpanan sesi

const fs = require("fs");
const path = require("path");
const input = require("input");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const logger = require("./logger");

/**
 * Membuat dan menghubungkan client Telegram dengan session string
 * @param {object} cfg - Objek config dari src/config.js
 * @returns {Promise<TelegramClient>} Objek client yang sudah terhubung dan terautentikasi
 */
async function buatClient(cfg) {
  const fileSesiPath = path.resolve(process.cwd(), cfg.FILE_SESI);
  let sessionData = "";

  // Baca string session jika file sesi.txt sudah ada sebelumnya
  if (fs.existsSync(fileSesiPath)) {
    sessionData = fs.readFileSync(fileSesiPath, "utf-8").trim();
  }

  const session = new StringSession(sessionData);

  const client = new TelegramClient(session, cfg.API_ID, cfg.API_HASH, {
    connectionRetries: 5,
  });

  logger.info("Menghubungkan ke server Telegram...");

  // Proses login interaktif jika belum ada sesi valid tersimpan
  await client.start({
    phoneNumber: async () => {
      logger.info("Sesi baru diperlukan.");
      return await input.text(
        "Masukkan Nomor HP Anda (dengan kode negara, contoh: +628123456789): "
      );
    },
    password: async () => {
      return await input.password(
        "Masukkan Password 2-Step Verification (2FA) (jika ada): "
      );
    },
    phoneCode: async () => {
      return await input.text(
        "Masukkan Kode OTP yang dikirimkan Telegram ke aplikasi Anda: "
      );
    },
    onError: (err) => {
      logger.error(`Terjadi kesalahan login: ${err.message}`);
    },
  });

  logger.sukses("Berhasil terhubung ke akun Telegram!");

  // Simpan string sesi terbaru ke file sesi.txt agar login berikutnya otomatis
  const savedSessionString = client.session.save();
  try {
    fs.writeFileSync(fileSesiPath, savedSessionString, "utf-8");
    logger.info(`Sesi akun berhasil disimpan di ${cfg.FILE_SESI} (JANGAN BAGIKAN FILE INI!).`);
  } catch (err) {
    logger.warn(`Gagal menyimpan sesi ke file: ${err.message}`);
  }

  return client;
}

/**
 * Memutus koneksi client secara bersih (graceful disconnect)
 * @param {TelegramClient} client
 */
async function putusKoneksi(client) {
  if (client) {
    try {
      await client.disconnect();
      logger.info("Koneksi Telegram diputus dengan aman.");
    } catch (err) {
      // Abaikan jika sudah terputus
    }
  }
}

module.exports = {
  buatClient,
  putusKoneksi,
};
