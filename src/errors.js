// === src/errors.js ===
// Klasifikasi error Telegram MTProto dan penanganan limit kecepatan (FloodWait)

/**
 * Mengecek apakah suatu error adalah FloodWait dan mengambil jumlah detik tunggu
 * @param {Error|object} err
 * @returns {number|null} Jumlah detik yang harus ditunggu, atau null jika bukan flood
 */
function ambilDetikFloodWait(err) {
  if (!err) return null;

  // Jika properti seconds tersedia langsung di objek error GramJS
  if (typeof err.seconds === "number" && err.seconds > 0) {
    return err.seconds;
  }

  // Jika berupa pesan teks seperti: "A wait of 45 seconds is required" atau "FLOOD_WAIT_45"
  const pesan = String(err.errorMessage || err.message || "");
  const matchDetik = pesan.match(/wait of (\d+) seconds/i);
  if (matchDetik) {
    return parseInt(matchDetik[1], 10);
  }

  const matchFlood = pesan.match(/FLOOD_WAIT_(\d+)/i);
  if (matchFlood) {
    return parseInt(matchFlood[1], 10);
  }

  return null;
}

/**
 * Menerjemahkan dan mengklasifikasikan pesan error Telegram ke bahasa Indonesia yang mudah dipahami
 * @param {Error|object} err
 * @returns {string} Penjelasan error ramah pengguna
 */
function klasifikasiError(err) {
  if (!err) return "Error tidak diketahui";

  const pesan = String(err.errorMessage || err.message || "");

  if (ambilDetikFloodWait(err) !== null) {
    return `FloodWait (Terlalu banyak permintaan cepat, Telegram meminta jeda)`;
  }
  if (pesan.includes("USER_NOT_PARTICIPANT")) {
    return "Akun Anda sudah bukan anggota grup ini lagi";
  }
  if (pesan.includes("CHAT_ADMIN_REQUIRED")) {
    return "Dibutuhkan hak Admin untuk melakukan tindakan ini";
  }
  if (pesan.includes("CHANNEL_PRIVATE")) {
    return "Grup/Channel privat tidak dapat diakses";
  }
  if (pesan.includes("PEER_ID_INVALID")) {
    return "ID grup tidak valid atau sudah kadaluarsa";
  }
  if (pesan.includes("CHAT_ID_INVALID")) {
    return "ID chat tidak valid";
  }
  if (pesan.includes("RPCError") || pesan.includes("CONNECTION")) {
    return `Kendala koneksi RPC Telegram (${pesan})`;
  }

  return pesan;
}

module.exports = {
  ambilDetikFloodWait,
  klasifikasiError,
};
