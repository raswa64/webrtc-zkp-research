// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const jwt = require('jsonwebtoken');
// const fs = require('fs');
// const path = require('path');
// const snarkjs = require('snarkjs');

// // === KONFIGURASI UTAMA ===
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// const JWT_SECRET = 'webrtc_zkp_research_2026_rahasia_panjang_acak_123456789';

// const VERIFICATION_KEY_PATH = path.join(__dirname, 'verification_key.json');
// let VERIFICATION_KEY = {};
// try {
//     VERIFICATION_KEY = JSON.parse(fs.readFileSync(VERIFICATION_KEY_PATH, 'utf8'));
// } catch (err) {
//     console.warn('⚠️ verification_key.json belum ditemukan.');
// }

// const REGISTRY_PATH = path.join(__dirname, 'zkp', 'registry-publik.json');
// let REGISTRY_PUBLIK = {};
// try {
//     REGISTRY_PUBLIK = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
//     console.log('📖 registry-publik.json dimuat:', Object.keys(REGISTRY_PUBLIK));
// } catch (err) {
//     console.warn('⚠️ registry-publik.json belum ditemukan.');
// }

// const PORT = 8080;

// // === LOGGING TERSTRUKTUR ===
// const DATA_DIR = path.join(__dirname, 'data');
// const LOG_CSV_PATH = path.join(DATA_DIR, 'log-pengujian.csv');
// const CSV_HEADER = 'timestamp,peerId,metode,tahap,durasi_ms,ukuran_payload_byte,status,keterangan\n';

// function pastikanFileLogSiap() {
//     if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
//     if (!fs.existsSync(LOG_CSV_PATH)) fs.writeFileSync(LOG_CSV_PATH, CSV_HEADER);
// }
// pastikanFileLogSiap();

// function tulisBarisLog(entri) {
//     const amankan = (v) => String(v ?? '').replace(/,/g, ';').replace(/\n/g, ' ');
//     const baris = [
//         new Date().toISOString(),
//         amankan(entri.peerId),
//         amankan(entri.metode),
//         amankan(entri.tahap),
//         entri.durasi_ms ?? '',
//         entri.ukuran_payload_byte ?? '',
//         amankan(entri.status),
//         amankan(entri.keterangan)
//     ].join(',') + '\n';

//     fs.appendFileSync(LOG_CSV_PATH, baris);
// }

// // === MIDDLEWARE & STATIK ===
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'client')));
// app.use('/zkp', express.static(path.join(__dirname, 'zkp')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client', 'peer-a.html'), err => {
//         if (err) res.send('<h1>Server Aktif ✅</h1><p>Akses via /peer-a.html atau /peer-b.html</p>');
//     });
// });
// app.get('/favicon.ico', (req, res) => res.status(204).end());

// // === ENDPOINT: LOG CLIENT ===
// app.post('/log', (req, res) => {
//     try {
//         const { peerId, metode, tahap, durasi_ms, ukuran_payload_byte, status, keterangan } = req.body;
//         if (!peerId || !metode || !tahap || !status) {
//             return res.status(400).json({ error: 'Field wajib tidak lengkap' });
//         }
//         tulisBarisLog({ peerId, metode, tahap, durasi_ms, ukuran_payload_byte, status, keterangan });
//         res.json({ sukses: true });
//     } catch (err) {
//         res.status(500).json({ error: 'Gagal menulis log' });
//     }
// });

// // === ENDPOINT: BUAT TOKEN JWT ===
// app.post('/auth/jwt', (req, res) => {
//     try {
//         const { peerId } = req.body;
//         if (!peerId) return res.status(400).json({ error: 'peerId wajib diisi' });

//         const t0 = process.hrtime.bigint();
//         const token = jwt.sign(
//             { peerId: peerId, metode: 'JWT', waktu: Date.now() },
//             JWT_SECRET,
//             { expiresIn: '2h' }
//         );
//         const t1 = process.hrtime.bigint();
//         const waktuMs = Number(t1 - t0) / 1e6;

//         tulisBarisLog({
//             peerId, metode: 'JWT', tahap: 'generate_token_server',
//             durasi_ms: waktuMs.toFixed(3), ukuran_payload_byte: token.length,
//             status: 'sukses', keterangan: ''
//         });

//         res.json({ sukses: true, token: token, kedaluwarsa: '2 jam' });
//         console.log(`🔑 Token JWT dibuat untuk: ${peerId} (${waktuMs.toFixed(2)} ms)`);
//     } catch (err) {
//         res.status(500).json({ error: 'Gagal membuat token' });
//     }
// });

// // === MIDDLEWARE AUTENTIKASI SOCKET.IO ===
// io.use(async (socket, selanjutnya) => {
//     const metode = socket.handshake.query.metode;
//     const kredensial = socket.handshake.query.kredensial;
//     const routingId = socket.handshake.query.peerId;

//     if (!metode || !kredensial || !routingId) {
//         return selanjutnya(new Error('Data autentikasi tidak lengkap'));
//     }

//     const t0 = process.hrtime.bigint();

//     try {
//         if (metode === 'jwt') {
//             const dataJWT = jwt.verify(kredensial, JWT_SECRET);
//             const t1 = process.hrtime.bigint();
//             const waktuMs = Number(t1 - t0) / 1e6;

//             if (dataJWT.peerId !== routingId) {
//                 return selanjutnya(new Error('peerId tidak sesuai dengan token'));
//             }

//             tulisBarisLog({
//                 peerId: routingId, metode: 'JWT', tahap: 'verifikasi_server',
//                 durasi_ms: waktuMs.toFixed(3), ukuran_payload_byte: kredensial.length,
//                 status: 'sukses'
//             });

//             socket.identitas = dataJWT.peerId;
//             socket.metodeAuth = 'JWT';
//             socket.routingId = routingId;
//             socket.waktuMasuk = Date.now();
//             return selanjutnya();
//         }

//         if (metode === 'zkp') {
//             const hasil = await verifikasiZkp(kredensial, routingId);
//             const t1 = process.hrtime.bigint();
//             const waktuMs = Number(t1 - t0) / 1e6;

//             tulisBarisLog({
//                 peerId: routingId, metode: 'ZKP', tahap: 'verifikasi_server',
//                 durasi_ms: waktuMs.toFixed(3), ukuran_payload_byte: kredensial.length,
//                 status: hasil.valid ? 'sukses' : 'gagal', keterangan: hasil.alasan || ''
//             });

//             if (hasil.valid) {
//                 socket.identitas = 'pengguna-terverifikasi-zkp';
//                 socket.metodeAuth = 'ZKP-Groth16';
//                 socket.routingId = routingId;
//                 socket.waktuMasuk = Date.now();
//                 return selanjutnya();
//             } else {
//                 return selanjutnya(new Error(hasil.alasan));
//             }
//         }

//         selanjutnya(new Error('Metode autentikasi tidak didukung'));
//     } catch (err) {
//         selanjutnya(new Error(`Gagal memverifikasi: ${err.message}`));
//     }
// });

// async function verifikasiZkp(kredensialBase64, routingIdKlaim) {
//     let dataBukti;
//     try {
//         dataBukti = JSON.parse(Buffer.from(kredensialBase64, 'base64').toString());
//     } catch (err) {
//         return { valid: false, alasan: 'Format Base64/JSON rusak' };
//     }

//     try {
//         const { proof, publicSignals } = dataBukti;
//         if (!proof || !publicSignals || publicSignals.length === 0) {
//             return { valid: false, alasan: 'Payload ZKP tidak lengkap' };
//         }

//         const dataTerdaftar = REGISTRY_PUBLIK[routingIdKlaim];
//         if (!dataTerdaftar) {
//             return { valid: false, alasan: `Identitas '${routingIdKlaim}' tidak terdaftar` };
//         }

//         const hashDariKlien = publicSignals[0];
//         const hashMilikServer = dataTerdaftar.hashIdentitasTerdaftar;

//         if (String(hashDariKlien) !== String(hashMilikServer)) {
//             return { valid: false, alasan: 'Hash tidak cocok dengan registry' };
//         }

//         const hasilVerifikasi = await snarkjs.groth16.verify(VERIFICATION_KEY, publicSignals, proof);
//         return hasilVerifikasi ? { valid: true } : { valid: false, alasan: 'Bukti kriptografi ZKP tidak valid' };

//     } catch (err) {
//         return { valid: false, alasan: `Kesalahan internal SnarkJS: ${err.message}` };
//     }
// }

// // === SIGNALING WEBRTC ===
// io.on('connection', (socket) => {
//     socket.join(socket.routingId);
//     console.log(`🔌 Terhubung: ${socket.routingId} (${socket.metodeAuth})`);

//     socket.on('offer', (data) => {
//         console.log(`📤 Offer dari ${socket.routingId} -> ${data.tujuan}`);
//         socket.to(data.tujuan).emit('offer', { dari: socket.routingId, sdp: data.sdp });
//     });

//     socket.on('answer', (data) => {
//         console.log(`📥 Answer dari ${socket.routingId} -> ${data.tujuan}`);
//         socket.to(data.tujuan).emit('answer', { dari: socket.routingId, sdp: data.sdp });
//     });

//     socket.on('ice-candidate', (data) => {
//         socket.to(data.tujuan).emit('ice-candidate', { dari: socket.routingId, kandidat: data.kandidat });
//     });

//     socket.on('disconnect', () => {
//         console.log(`🔌 Terputus: ${socket.routingId}`);
//     });
// });

// server.listen(PORT, () => {
//     console.log('========================================');
//     console.log(`🚀 Server WebRTC + ZKP Berjalan di http://localhost:${PORT}`);
//     console.log(`📊 Log CSV di: ${LOG_CSV_PATH}`);
//     console.log('========================================');
// });
// const express = require('express');
// const http = require('http');
// const path = require('path');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: { origin: "*", methods: ["GET", "POST"] },
//     pingTimeout: 30000,
//     pingInterval: 10000
// });
// // Mengembalikan status 204 No Content untuk request favicon agar tidak memicu error 404
// app.get('/favicon.ico', (req, res) => res.status(204).end());

// app.use(express.json());

// // PENTING: Sajikan folder statis agar dapat diakses oleh browser & worker
// app.use(express.static(path.join(__dirname, 'client')));
// app.use('/zkp', express.static(path.join(__dirname, 'zkp')));

// // Dummy endpoint auth JWT
// app.post('/auth/jwt', (req, res) => {
//     const { peerId } = req.body;
//     console.log(`🔑 Token JWT dibuat untuk: ${peerId}`);
//     res.json({ sukses: true, token: `jwt-dummy-token-for-${peerId}` });
// });

// // Dummy endpoint log
// app.post('/log', (req, res) => {
//     res.json({ sukses: true });
// });

// // Middleware Socket.io Auth
// io.use((socket, next) => {
//     const { metode, kredensial, peerId } = socket.handshake.query;
//     if (!peerId) return next(new Error('peerId tidak ditemukan'));
    
//     socket.routingId = peerId;
//     socket.metodeAuth = metode;
//     next();
// });

// io.on('connection', (socket) => {
//     socket.join(socket.routingId);
//     console.log(`🔌 Terhubungkan: ${socket.routingId} (${socket.metodeAuth ? socket.metodeAuth.toUpperCase() : 'UNKNOWN'})`);

//     socket.on('offer', (data) => {
//         console.log(`📤 Offer dari ${socket.routingId} -> ${data.tujuan}`);
//         socket.to(data.tujuan).emit('offer', { dari: socket.routingId, sdp: data.sdp });
//     });

//     socket.on('answer', (data) => {
//         console.log(`📥 Answer dari ${socket.routingId} -> ${data.tujuan}`);
//         socket.to(data.tujuan).emit('answer', { dari: socket.routingId, sdp: data.sdp });
//     });

//     socket.on('ice-candidate', (data) => {
//         socket.to(data.tujuan).emit('ice-candidate', { dari: socket.routingId, kandidat: data.kandidat });
//     });

//     socket.on('disconnect', () => {
//         console.log(`🔌 Terputus: ${socket.routingId}`);
//     });
// });

// const PORT = 8080;
// server.listen(PORT, () => {
//     console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
// });
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// === 1. Konfigurasi Socket.io ===
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 30000,
    pingInterval: 10000
});

app.use(express.json());

// === 2. Persiapan File Log CSV ===
const LOG_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(LOG_DIR, 'log-pengujian.csv');

// Buat direktori 'data' jika belum ada
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Buat file CSV dan tulis header jika belum ada
if (!fs.existsSync(LOG_FILE)) {
    const header = 'timestamp,peerId,metode,tahap,durasi_ms,ukuran_payload_byte,status,keterangan\n';
    fs.writeFileSync(LOG_FILE, header, 'utf8');
}

// === 3. Handling Middleware & Static Files ===

// Mencegah error 404 pada favicon agar log terminal bersih
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Sajikan folder client dan zkp sebagai file statis
app.use(express.static(path.join(__dirname, 'client')));
app.use('/zkp', express.static(path.join(__dirname, 'zkp')));

// === 4. Endpoint HTTP API ===

// Endpoint autentikasi JWT Dummy
app.post('/auth/jwt', (req, res) => {
    const { peerId } = req.body;
    console.log(`🔑 Token JWT dibuat untuk: ${peerId}`);
    res.json({ 
        sukses: true, 
        token: `jwt-dummy-token-for-${peerId}` 
    });
});

// Endpoint untuk menerima & menyimpan log pengujian ke CSV
app.post('/log', (req, res) => {
    const { peerId, metode, tahap, durasi_ms, ukuran_payload_byte, status, keterangan } = req.body;
    const timestamp = new Date().toISOString();

    const barisCsv = `"${timestamp}","${peerId || ''}","${metode || ''}","${tahap || ''}","${durasi_ms || ''}","${ukuran_payload_byte || ''}","${status || ''}","${keterangan || ''}"\n`;

    fs.appendFile(LOG_FILE, barisCsv, 'utf8', (err) => {
        if (err) {
            console.error('❌ Gagal menulis log ke CSV:', err.message);
            return res.status(500).json({ sukses: false, error: err.message });
        }
        res.json({ sukses: true });
    });
});

// === 5. Middleware Autentikasi & Signaling Socket.io ===
io.use((socket, next) => {
    const { metode, kredensial, peerId } = socket.handshake.query;
    if (!peerId) return next(new Error('peerId tidak ditemukan'));
    
    socket.routingId = peerId;
    socket.metodeAuth = metode;
    next();
});

io.on('connection', (socket) => {
    socket.join(socket.routingId);
    console.log(`🔌 Terhubung: ${socket.routingId} (${socket.metodeAuth ? socket.metodeAuth.toUpperCase() : 'UNKNOWN'})`);

    // Sinyal WebRTC Offer
    socket.on('offer', (data) => {
        console.log(`📤 Offer dari ${socket.routingId} -> ${data.tujuan}`);
        socket.to(data.tujuan).emit('offer', { dari: socket.routingId, sdp: data.sdp });
    });

    // Sinyal WebRTC Answer
    socket.on('answer', (data) => {
        console.log(`📥 Answer dari ${socket.routingId} -> ${data.tujuan}`);
        socket.to(data.tujuan).emit('answer', { dari: socket.routingId, sdp: data.sdp });
    });

    // Sinyal ICE Candidates
    socket.on('ice-candidate', (data) => {
        socket.to(data.tujuan).emit('ice-candidate', { dari: socket.routingId, kandidat: data.kandidat });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Terputus: ${socket.routingId}`);
    });
});

// === 6. Jalankan Server ===
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📊 Log pengujian akan disimpan ke: ${LOG_FILE}`);
});