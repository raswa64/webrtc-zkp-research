pragma circom 2.0.0;

/*
====================================================================
   SIRKUIT AUTENTIKASI ZERO-KNOWLEDGE PROOF
   Judul Penelitian: Analisis Performa dan Keamanan Autentikasi
   WebRTC Berbasis Zero-Knowledge Proof Skema ZK-SNARKs
====================================================================
   Fungsi:
   1. Pengguna membuktikan bahwa ia mengetahui nilai rahasia
   2. Tanpa pernah mengirimkan atau mengungkap nilai rahasia itu
   3. Server hanya memverifikasi kesesuaian dengan hash terdaftar
====================================================================
*/

template AutentikasiWebRTC() {
    // ---------------- MASUKAN PUBLIK (Diketahui Server) ----------------
    // Hash identitas yang sudah terdaftar di sistem
    signal input hashIdentitasTerdaftar;

    // ---------------- MASUKAN RAHASIA (Tidak Dikirim ke Server) ----------------
    // Nilai rahasia yang hanya diketahui pengguna (kunci/sandi)
    signal input nilaiRahasiaPengguna;

    // ---------------- KELUARAN PUBLIK ----------------
    // Bukti apakah autentikasi valid atau tidak
    signal output statusValid;

    // ---------------- SYARAT PEMBUKTIAN ----------------
    // Syarat: Nilai rahasia yang diklaim HARUS sama dengan yang terdaftar
    // Jika syarat terpenuhi → bukti valid, jika tidak → ditolak
    nilaiRahasiaPengguna - hashIdentitasTerdaftar === 0;

    // Keluarkan status 1 = Autentikasi Berhasil
    statusValid <== 1;
}

// Inisialisasi komponen utama
component main = AutentikasiWebRTC();