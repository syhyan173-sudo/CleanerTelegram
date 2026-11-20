// === index.js ===
// Titik masuk utama aplikasi: hanya merangkai modul tanpa logika berat

const { config, validasiConfig } = require("./src/config");
const { inisialisasiLogger, info, error } = require("./src/logger");
const { buatClient, putusKoneksi } = require("./src/client");
const { ambilDaftarDialog } = require("./src/dialogs");
const { saringDialog } = require("./src/filters");
const { simpanKeCsv } = require("./src/backup");
const { tampilkanDaftarPreview, mintaKonfirmasi } = require("./src/confirm");
const { jalankanPembersihan, tampilkanRingkasan } = require("./src/runner");

async function main() {
  let client = null;

  try {
    // 1. Validasi konfigurasi lingkungan (.env)
    validasiConfig();

    // Inisialisasi file logger
    inisialisasiLogger(config.FILE_LOG);

    info("=== MEMULAI PROGRAM PEMBERSIH GRUP TELEGRAM ===");

    // 2. Login dan inisialisasi GramJS client
    client = await buatClient(config);

    // 3. Ambil seluruh obrolan (dialog) sesuai target
    const semuaDialog = await ambilDaftarDialog(client, config.TARGET);

    // 4. Saring dialog berdasarkan filter (kata kunci, ID, keaktifan, maks proses)
    const dialogTersaring = saringDialog(semuaDialog, config);

    if (dialogTersaring.length === 0) {
      info("Tidak ada grup yang perlu diproses setelah penyaringan. Selesai.");
      return;
    }

    // 5. Cadangkan daftar yang akan diproses ke CSV
    simpanKeCsv(dialogTersaring, config.FILE_BACKUP);

    // 6. Tampilkan preview daftar grup bernomor ke terminal
    tampilkanDaftarPreview(dialogTersaring);

    // 7. Minta konfirmasi pengguna (akan berhenti otomatis jika DRY_RUN = true)
    const disetujui = await mintaKonfirmasi(dialogTersaring, config);
    if (!disetujui) {
      return;
    }

    // 8. Jalankan antrean pembersihan grup
    const statistik = await jalankanPembersihan(client, dialogTersaring, config);

    // 9. Tampilkan ringkasan akhir hasil pemrosesan
    tampilkanRingkasan(statistik);
  } catch (err) {
    error(`Terjadi kesalahan kritis: ${err.message}`);
  } finally {
    // 10. Putus koneksi client dengan aman saat aplikasi selesai
    if (client) {
      await putusKoneksi(client);
    }
    info("Program selesai. Sampai jumpa!");
    process.exit(0);
  }
}

// Jalankan fungsi utama
main();
