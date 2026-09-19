pragma circom 2.0.0;

/*
====================================================================
    SIRKUIT AUTENTIKASI ZERO-KNOWLEDGE PROOF (VERSI PERBAIKAN)
    Judul Penelitian: Analisis Performa dan Keamanan Autentikasi
    WebRTC Berbasis Zero-Knowledge Proof Skema ZK-SNARKs

    Perbaikan dari versi sebelumnya:
    1. Menggunakan hash Poseidon sungguhan (bukan pengurangan langsung),
       sehingga verifier tidak bisa membalikkan hash publik untuk
       menemukan nilai rahasia asli.
    2. hashIdentitasTerdaftar dideklarasikan PUBLIC secara eksplisit
       di component main, sehingga verifier punya nilai rujukan yang
       benar-benar bisa dipakai untuk memverifikasi proof.
====================================================================
*/

include "circomlib/circuits/poseidon.circom";

template AutentikasiWebRTC() {
    // ---------------- MASUKAN PUBLIK (Diketahui Server) ----------------
    // Hash identitas yang sudah terdaftar di sistem. Nilai ini AMAN
    // diketahui publik karena sifat hash bersifat satu arah (one-way).
    signal input hashIdentitasTerdaftar;

    // ---------------- MASUKAN RAHASIA (Tidak Dikirim ke Server) ----------------
    // Nilai rahasia yang hanya diketahui pengguna (kunci/sandi).
    signal input nilaiRahasiaPengguna;

    // ---------------- KELUARAN PUBLIK ----------------
    // Bukti apakah autentikasi valid atau tidak.
    signal output statusValid;

    // ---------------- PERHITUNGAN HASH ----------------
    component hasher = Poseidon(1);
    hasher.inputs[0] <== nilaiRahasiaPengguna;

    // ---------------- SYARAT PEMBUKTIAN ----------------
    // Syarat: hash dari nilai rahasia yang diklaim HARUS sama dengan
    // hash identitas yang terdaftar. Jika prover tidak benar-benar
    // memiliki nilaiRahasiaPengguna yang tepat, witness tidak akan
    // pernah bisa dihitung (proof generation gagal total).
    hasher.out === hashIdentitasTerdaftar;

    // Keluarkan status 1 = Autentikasi Berhasil
    statusValid <== 1;
}

// PENTING: hashIdentitasTerdaftar WAJIB dideklarasikan public di sini,
// jika tidak maka verifier tidak akan pernah punya nilai pembanding.
component main {public [hashIdentitasTerdaftar]} = AutentikasiWebRTC();