// === src/commands.js ===
// (Fitur Tambahan) Memantau perintah khusus (.daftar dan .bersih) di "Saved Messages" (Pesan Tersimpan)

const { NewMessage } = require("telegram/events");
const logger = require("./logger");
const { ambilDaftarDialog } = require("./dialogs");
const { saringDialog } = require("./filters");
const { jalankanPembersihan } = require("./runner");

/**
 * Memasang pendengar event (event listener) untuk perintah pribadi di Saved Messages
 * Perintah yang didukung:
 * - .daftar : Melihat jumlah grup saat ini yang terdeteksi
 * - .bersih : Memulai proses pembersihan langsung dari Telegram
 *
 * @param {object} client - TelegramClient
 * @param {object} cfg - Konfigurasi
 */
function pasangPerintahSavedMessages(client, cfg) {
  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      if (!message || !message.text) return;

      // Pastikan pesan hanya berasal dari diri sendiri di Saved Messages
      const sender = await message.getSender();
      const me = await client.getMe();

      if (!sender || String(sender.id) !== String(me.id)) {
        return;
      }

      // Pastikan chat adalah chat pribadi ke diri sendiri
      if (!message.isPrivate) {
        return;
      }

      const teks = message.text.trim().toLowerCase();

      if (teks === ".daftar") {
        logger.info('Menerima perintah ".daftar" dari Saved Messages.');
        await client.sendMessage("me", {
          message: "⏳ Sedang memindai obrolan Anda...",
        });

        const dialogs = await ambilDaftarDialog(client, cfg.TARGET);
        const tersaring = saringDialog(dialogs, cfg);

        let balasan = `📊 **Hasil Pemindaian Grup (${cfg.TARGET})**\n\n`;
        balasan += `• Total terdeteksi: **${tersaring.length}** grup/channel\n`;
        balasan += `• Mode DRY_RUN saat ini: **${cfg.DRY_RUN}**\n\n`;
        balasan += `_Ketik .bersih di sini untuk mulai membersihkan (pastikan DRY_RUN=false di .env jika ingin aksi nyata)._`;

        await client.sendMessage("me", { message: balasan });
      } else if (teks === ".bersih") {
        logger.info('Menerima perintah ".bersih" dari Saved Messages.');

        if (cfg.DRY_RUN) {
          await client.sendMessage("me", {
            message:
              "⚠️ Mode DRY_RUN masih aktif (true) di .env.\nTidak ada grup yang dikeluarkan. Ubah DRY_RUN=false jika ingin eksekusi nyata.",
          });
          return;
        }

        await client.sendMessage("me", {
          message: "🚀 Memulai proses keluar dari grup... Cek terminal untuk progres lengkap.",
        });

        const dialogs = await ambilDaftarDialog(client, cfg.TARGET);
        const tersaring = saringDialog(dialogs, cfg);
        const stat = await jalankanPembersihan(client, tersaring, cfg);

        await client.sendMessage("me", {
          message:
            `✅ **Pembersihan Selesai!**\n\n` +
            `• Berhasil Keluar: ${stat.berhasilKeluar}\n` +
            `• Berhasil Dihapus: ${stat.berhasilDihapus}\n` +
            `• Gagal: ${stat.gagal}`,
        });
      }
    } catch (err) {
      logger.error(`Error pada penanganan perintah Saved Messages: ${err.message}`);
    }
  }, new NewMessage({}));

  logger.info('Perintah Saved Messages aktif: Anda bisa mengirim ".daftar" atau ".bersih" ke Saved Messages.');
}

module.exports = {
  pasangPerintahSavedMessages,
};
