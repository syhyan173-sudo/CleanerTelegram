# 🧹 Userbot Pembersih Grup, Channel & Obrolan Pribadi Telegram (GramJS)

Userbot Telegram berbasis **Node.js** dan library **GramJS** (`telegram`) untuk membersihkan dan keluar dari ratusan grup, saluran (channel), bot, maupun obrolan pribadi di akun Telegram Anda secara otomatis, aman, dan cepat.

Didesain khusus untuk pemula dengan struktur kode yang modular, aman dari banned/flood, serta dapat dijalankan baik di **PC/Laptop (Windows/macOS/Linux)** maupun di **HP Android (Termux)**.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Cara Mendapatkan API_ID dan API_HASH](#-cara-mendapatkan-api_id-dan-api_hash)
- [Panduan Instalasi](#-panduan-instalasi)
  - [1. Di Komputer (PC / Laptop)](#1-di-komputer-pc--laptop)
  - [2. Di HP Android (Termux)](#2-di-hp-android-termux)
- [Tata Cara Pemakaian (Urutan Aman)](#-tata-cara-pemakaian-urutan-aman)
- [Tabel Konfigurasi (.env)](#-tabel-konfigurasi-env)
- [Pilihan Target Pembersihan](#-pilihan-target-pembersihan)
- [Penanganan Kendala & Error](#-penanganan-kendala--error)
- [Keamanan & Privasi](#-keamanan--privasi)

---

## ✨ Fitur Utama

- **Mendukung Seluruh Tipe Obrolan**:
  - Grup biasa & Supergroup.
  - Saluran siaran (Channel).
  - Obrolan Bot & Obrolan Pribadi (User).
- **Proteksi Mutlak Anti-Salah Hapus**:
  - Chat resmi **Telegram (ID: 777000)** tempat menerima kode OTP **tidak akan pernah dihapus**.
  - **Saved Messages (Pesan Tersimpan)** Anda **selalu dilindungi**.
  - Fitur **`KECUALIKAN_KONTAK=true`**: Teman/kontak yang nomornya tersimpan di kontak HP Anda otomatis dilindungi (hanya menghapus chat bot dan orang tak dikenal).
- **Mode Simulasi Aman (DRY_RUN)**: Default aktif (`true`). Anda bisa melihat daftar obrolan yang akan diproses tanpa risiko keluar atau kehilangan obrolan secara tidak sengaja.
- **Pencadangan CSV Otomatis**: Menyimpan seluruh daftar obrolan (Nama, ID, Username, Jumlah Anggota, Status) ke file `.csv` sebelum tindakan apa pun dijalankan.
- **Penyaringan Fleksibel**:
  - Kata kunci nama grup/chat yang dikecualikan.
  - ID spesifik yang dikecualikan.
  - Saring berdasarkan hari tidak aktif.
- **Penanganan FloodWait Cerdas**: Jika Telegram meminta jeda waktu, program otomatis menghitung mundur lalu mencoba ulang secara otomatis.

---

## 🎯 Pilihan Target Pembersihan (`TARGET` di .env)

Anda bisa mengatur obrolan apa saja yang ingin dibersihkan melalui variabel `TARGET` di file `.env`:

| Nilai `TARGET` | Obrolan yang Diproses |
| :--- | :--- |
| `grup` | Hanya grup diskusi (klasik & supergroup) |
| `channel` | Hanya channel / saluran siaran |
| `keduanya` | **Grup + Channel** (pilihan default terbaik) |
| `pribadi` | Hanya obrolan pribadi & bot (kontak HP dilindungi jika `KECUALIKAN_KONTAK=true`) |
| `semua` | **Semua obrolan**: Grup + Channel + Bot + Obrolan Pribadi |

---

## ⚙️ Tabel Konfigurasi Lengkap (.env)

| Variabel | Default | Penjelasan |
| :--- | :--- | :--- |
| `API_ID` | *(Wajib)* | ID API angka dari my.telegram.org |
| `API_HASH` | *(Wajib)* | Hash API teks dari my.telegram.org |
| `DRY_RUN` | `true` | `true` = hanya simulasi / baca data. `false` = keluar/hapus nyata |
| `TARGET` | `keduanya` | Pilihan: `grup`, `channel`, `keduanya`, `pribadi`, atau `semua` |
| `KECUALIKAN_KONTAK`| `true` | Lindungi teman di kontak HP agar chatnya tidak terhapus |
| `HAPUS_JIKA_OWNER`| `false` | `false` = hanya keluar. `true` = grup buatan Anda (`[OWNER]`) akan dihapus permanen |
| `KECUALIKAN` | `""` | Kata kunci nama yang dilewati (pisahkan dengan koma) |
| `KECUALIKAN_ID` | `""` | ID yang dilindungi dari pembersihan (pisahkan dengan koma) |
| `HANYA_JIKA_MENGANDUNG`| `""`| Hanya proses chat yang mengandung kata tertentu |
| `MAKS_PROSES` | `0` | Batas jumlah obrolan per jalan (`0` = semua) |
| `JEDA_MS` | `2000` | Jeda antar aksi dalam milidetik (minimal 2000 ms agar aman dari ban) |
| `HARI_TIDAK_AKTIF` | `0` | Filter hari pesan terakhir (`0` = nonaktif, misal `30` = tidak aktif > 30 hari) |
| `FILE_BACKUP` | `daftar_grup.csv` | Nama file hasil cadangan data grup/chat |
| `FILE_LOG` | `log_bersih.txt` | Nama file riwayat log proses |

---

## 🚀 Panduan Penggunaan Cepat

1. Pastikan konfigurasi `.env` sudah sesuai (misal `TARGET=semua` atau `TARGET=pribadi`).
2. Jalankan:
   ```bash
   npm start
   ```
3. Periksa file `daftar_grup.csv`.
4. Jika sudah yakin, setel `DRY_RUN=false` di `.env`, lalu jalankan `npm start` dan ketik **`YA`**.
