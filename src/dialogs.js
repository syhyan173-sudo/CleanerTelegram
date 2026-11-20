// === src/dialogs.js ===
// Mengambil seluruh obrolan (dialog) akun, menyaring grup/channel/obrolan pribadi, dan mendeteksi peran

const logger = require("./logger");

/**
 * Menentukan status peran akun kita pada obrolan (OWNER, ADMIN, MEMBER, BOT, KONTAK, USER)
 * @param {object} entity - Objek entity dari Telegram (Chat, Channel, atau User)
 * @returns {"OWNER"|"ADMIN"|"MEMBER"|"BOT"|"KONTAK"|"USER"}
 */
function tentukanStatusPeran(entity) {
  if (!entity) return "MEMBER";

  // Jika ini akun pengguna pribadi / Bot
  if (entity.className === "User") {
    if (entity.bot) return "BOT";
    if (entity.contact) return "KONTAK";
    return "USER";
  }

  // Jika kita adalah pemilik/pembuat grup
  if (entity.creator === true) {
    return "OWNER";
  }

  // Jika kita memiliki hak admin
  if (entity.adminRights && Object.keys(entity.adminRights).length > 0) {
    return "ADMIN";
  }

  return "MEMBER";
}

/**
 * Menentukan jenis dialog: "supergroup", "grup_biasa", "channel", "bot", "user", atau "lainnya"
 * @param {object} dialog
 * @returns {"supergroup"|"grup_biasa"|"channel"|"bot"|"user"|"lainnya"}
 */
function tentukanTipeDialog(dialog) {
  const entity = dialog.entity;
  if (!entity) return "lainnya";

  // Obrolan pribadi atau Bot
  if (dialog.isUser || entity.className === "User") {
    if (entity.bot) {
      return "bot";
    }
    return "user";
  }

  // Channel atau Supergroup (kelas Channel di MTProto)
  if (entity.className === "Channel") {
    if (entity.megagroup) {
      return "supergroup"; // Supergroup (grup modern)
    }
    return "channel"; // Channel siaran publik/privat
  }

  // Grup biasa / klasik (legacy group)
  if (entity.className === "Chat") {
    return "grup_biasa";
  }

  return "lainnya";
}

/**
 * Mengambil seluruh dialog dari akun dan menyaring sesuai target konfigurasi
 * @param {object} client - Objek TelegramClient GramJS
 * @param {string} targetTipe - "grup" | "channel" | "keduanya" | "pribadi" | "semua"
 * @returns {Promise<Array<object>>} Daftar dialog terstruktur
 */
async function ambilDaftarDialog(client, targetTipe = "keduanya") {
  logger.info("Mengambil daftar obrolan dari akun Telegram Anda...");

  // Dapatkan info diri sendiri untuk memastikan Saved Messages tidak pernah disentuh
  const me = await client.getMe();
  const myIdStr = String(me.id);

  // getDialogs({}) mengambil semua dialog yang ada di akun
  const semuaDialog = await client.getDialogs({});
  logger.info(`Ditemukan total ${semuaDialog.length} obrolan (termasuk chat pribadi & bot).`);

  const hasil = [];

  for (const dialog of semuaDialog) {
    const tipe = tentukanTipeDialog(dialog);
    const entity = dialog.entity;
    if (!entity) continue;

    const idStr = String(dialog.id || entity.id);

    // ========================================================
    // PROTEKSI MUTLAK: JANGAN PERNAH SENTUH:
    // 1. Akun Resmi Notifikasi Telegram (ID: 777000)
    // 2. Saved Messages (Pesan Tersimpan diri sendiri)
    // ========================================================
    if (idStr === "777000" || entity.id === 777000) {
      continue;
    }
    if (idStr === myIdStr || entity.isSelf) {
      continue;
    }

    const apakahGrup = tipe === "supergroup" || tipe === "grup_biasa";
    const apakahChannel = tipe === "channel";
    const apakahPribadi = tipe === "user" || tipe === "bot";

    let cocokTarget = false;
    if (targetTipe === "semua") {
      cocokTarget = apakahGrup || apakahChannel || apakahPribadi;
    } else if (targetTipe === "pribadi") {
      cocokTarget = apakahPribadi;
    } else if (targetTipe === "keduanya") {
      cocokTarget = apakahGrup || apakahChannel;
    } else if (targetTipe === "channel") {
      cocokTarget = apakahChannel;
    } else {
      // default "grup"
      cocokTarget = apakahGrup;
    }

    if (!cocokTarget) {
      continue;
    }

    const statusPeran = tentukanStatusPeran(entity);

    // Dapatkan tanggal pesan terakhir (unix timestamp dalam detik)
    const timestampPesanTerakhir = dialog.date || (dialog.message ? dialog.message.date : null);

    // Dapatkan estimasi jumlah anggota
    const jumlahAnggota = entity.participantsCount !== undefined ? entity.participantsCount : 1;

    hasil.push({
      id: idStr,
      nama: dialog.name || dialog.title || "(Tanpa Nama)",
      tipe: tipe, // "supergroup", "grup_biasa", "channel", "user", "bot"
      status: statusPeran, // "OWNER", "ADMIN", "MEMBER", "BOT", "KONTAK", "USER"
      username: entity.username ? `@${entity.username}` : "-",
      jumlahAnggota: jumlahAnggota,
      timestampPesanTerakhir: timestampPesanTerakhir,
      rawDialog: dialog,
      entity: entity,
    });
  }

  logger.info(
    `Berhasil memfilter ${hasil.length} obrolan yang cocok dengan target ("${targetTipe}").`
  );

  return hasil;
}

module.exports = {
  ambilDaftarDialog,
  tentukanStatusPeran,
  tentukanTipeDialog,
};
