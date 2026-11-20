// === src/actions.js ===
// Logika eksekusi aksi keluar atau hapus obrolan menggunakan MTProto GramJS

const { Api } = require("telegram");

/**
 * Keluar dari grup atau channel (Leave).
 * Menyesuaikan metode antara supergroup/channel dan grup biasa (legacy).
 * @param {object} client - TelegramClient
 * @param {object} item - Objek obrolan dari dialogs.js
 */
async function keluarDariGrup(client, item) {
  const { tipe, entity } = item;

  if (tipe === "supergroup" || tipe === "channel") {
    // Untuk Channel atau Supergroup, gunakan Api.channels.LeaveChannel
    await client.invoke(
      new Api.channels.LeaveChannel({
        channel: entity,
      })
    );
  } else if (tipe === "grup_biasa") {
    // Untuk grup biasa (Chat), gunakan Api.messages.DeleteChatUser dengan userId: "me"
    await client.invoke(
      new Api.messages.DeleteChatUser({
        chatId: entity.id,
        userId: "me",
      })
    );
  } else {
    throw new Error(`Tipe obrolan tidak didukung untuk keluar: ${tipe}`);
  }
}

/**
 * Menghapus grup secara permanen (hanya jika akun adalah OWNER).
 * @param {object} client - TelegramClient
 * @param {object} item - Objek obrolan dari dialogs.js
 */
async function hapusGrup(client, item) {
  const { tipe, entity } = item;

  if (tipe === "supergroup" || tipe === "channel") {
    // Untuk Channel atau Supergroup milik kita, gunakan Api.channels.DeleteChannel
    await client.invoke(
      new Api.channels.DeleteChannel({
        channel: entity,
      })
    );
  } else if (tipe === "grup_biasa") {
    // Untuk grup biasa milik kita, gunakan Api.messages.DeleteChat
    await client.invoke(
      new Api.messages.DeleteChat({
        chatId: entity.id,
      })
    );
  } else {
    throw new Error(`Tipe obrolan tidak didukung untuk dihapus: ${tipe}`);
  }
}

/**
 * Menghapus riwayat obrolan pribadi (user atau bot) dari daftar obrolan akun kita.
 * @param {object} client - TelegramClient
 * @param {object} item - Objek obrolan dari dialogs.js
 */
async function hapusChatPribadi(client, item) {
  const { entity } = item;
  await client.invoke(
    new Api.messages.DeleteHistory({
      peer: entity,
      maxId: 0,
      justClear: false,
      revoke: false, // Menghapus dari sisi akun kita saja
    })
  );
}

module.exports = {
  keluarDariGrup,
  hapusGrup,
  hapusChatPribadi,
};
