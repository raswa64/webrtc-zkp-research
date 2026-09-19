const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { groth16 } = require('snarkjs');
const fs = require('fs');
const path = require('path');

// === KONFIGURASI UTAMA ===
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Kunci rahasia JWT (gunakan nilai acak panjang di produksi)
const JWT_SECRET = 'webrtc_zkp_research_2026_rahasia_panjang_acak_123456789';

// Muat kunci verifikasi ZKP publik
const VERIFICATION_KEY_PATH = path.join(__dirname, 'verification_key.json');
const VERIFICATION_KEY = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));

// Nilai referensi yang terdaftar di sirkuit
const NILAI_TERDAFTAR = BigInt(0);

const PORT = 8080;

// === PENYAJIAN BERKAS STATIS ===
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));
app.use('/zkp', express.static(path.join(__dirname, 'zkp')));

// === ENDPOINT: BUAT TOKEN JWT ===
app.post('/auth/jwt', (req, res) => {
    try {
        const { peerId } = req.body;
        if (!peerId) return res.status(400).json({ error: 'peerId wajib diisi' });

        const token = jwt.sign(
            { peerId: peerId, metode: 'JWT', waktu: Date.now() },
            JWT_SECRET,
            { expiresIn: '2 jam' }
        );

        res.json({
            sukses: true,
            token: token,
            kedaluwarsa: '2 jam'
        });
        console.log(`🔑 Token JWT dibuat untuk: ${peerId}`);
    } catch (err) {
        console.error(`❌ Kesalahan pembuatan JWT: ${err.message}`);
        res.status(500).json({ error: 'Gagal membuat token' });
    }
});

// === MIDDLEWARE AUTENTIKASI SOCKET.IO ===
io.use(async (socket, selanjutnya) => {
    const metode = socket.handshake.query.metode;
    const kredensial = socket.handshake.query.kredensial;

    if (!metode || !kredensial) {
        console.log('❌ Autentikasi ditolak: data tidak lengkap');
        return selanjutnya(new Error('Metode dan kredensial wajib disertakan'));
    }

    try {
        if (metode === 'jwt') {
            // Verifikasi JWT
            const dataJWT = jwt.verify(kredensial, JWT_SECRET);
            socket.identitas = dataJWT.peerId;
            socket.metodeAuth = 'JWT';
            socket.waktuMasuk = Date.now();
            console.log(`✅ Autentikasi JWT BERHASIL: ${dataJWT.peerId}`);
            return selanjutnya();
        }

        if (metode === 'zkp') {
            // Dekode dan verifikasi bukti ZKP Groth16
            const dataBukti = JSON.parse(Buffer.from(kredensial, 'base64').toString());
            const { proof, publicSignals } = dataBukti;

            const buktiValid = await groth16.verify(VERIFICATION_KEY, publicSignals, proof);

            if (buktiValid) {
                socket.identitas = 'pengguna-terverifikasi-zkp';
                socket.metodeAuth = 'ZKP-Groth16';
                socket.waktuMasuk = Date.now();
                console.log(`✅ Autentikasi ZKP BERHASIL: Tanpa mengungkap data rahasia`);
                return selanjutnya();
            } else {
                console.log(`❌ Autentikasi ZKP GAGAL: Bukti tidak valid`);
                return selanjutnya(new Error('Bukti autentikasi tidak sah'));
            }
        }

        console.log(`❌ Metode tidak dikenal: ${metode}`);
        selanjutnya(new Error('Metode autentikasi tidak didukung'));
    } catch (err) {
        console.error(`❌ Kesalahan verifikasi: ${err.message}`);
        selanjutnya(new Error(`Gagal memverifikasi: ${err.message}`));
    }
});

// === PENANGANAN KONEKSI DAN SINYAL WEBRTC ===
io.on('connection', (socket) => {
    console.log(`🔌 Terhubung: ${socket.identitas} | Metode: ${socket.metodeAuth}`);

    // Terima penawaran koneksi
    socket.on('offer', (data) => {
        console.log(`📤 Menerima penawaran dari ${socket.identitas} ke ${data.tujuan}`);
        socket.to(data.tujuan).emit('offer', {
            dari: socket.identitas,
            sdp: data.sdp
        });
    });

    // Terima jawaban koneksi
    socket.on('answer', (data) => {
        console.log(`📥 Menerima jawaban dari ${socket.identitas}`);
        socket.to(data.tujuan).emit('answer', {
            dari: socket.identitas,
            sdp: data.sdp
        });
    });

    // Terima kandidat ICE
    socket.on('ice-candidate', (data) => {
        socket.to(data.tujuan).emit('ice-candidate', {
            dari: socket.identitas,
            kandidat: data.kandidat
        });
    });

    // Koneksi terputus
    socket.on('disconnect', (alasan) => {
        const durasi = Math.round((Date.now() - socket.waktuMasuk) / 1000);
        console.log(`🔌 Terputus: ${socket.identitas} | Durasi: ${durasi} detik | Alasan: ${alasan}`);
    });
});

// === JALANKAN SERVER ===
server.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 Server Penelitian WebRTC + ZKP Berjalan');
    console.log(`📍 Alamat: http://localhost:${PORT}`);
    console.log(`🔐 Verifikasi ZKP: AKTIF`);
    console.log(`🔑 Verifikasi JWT: AKTIF`);
    console.log('========================================');
});