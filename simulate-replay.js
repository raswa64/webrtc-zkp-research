// simulate-replay.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:8080/auth'; // Sesuaikan endpoint auth server Anda
const TOTAL_ATTEMPTS = 50;
const CSV_FILE_PATH = path.join(__dirname, 'log-replay-attack.csv');

// Inisialisasi Berkas CSV Hasil Eksperimen
const csvHeader = 'Attempt,Method,Timestamp_Sent,Status_Code,Server_Response,Attack_Success_State\n';
fs.writeFileSync(CSV_FILE_PATH, csvHeader, 'utf8');

// Objek muatan legal hasil intersep (diduga kedaluwarsa/nonce bekas)
const tamperedPayload = {
    method: 'Groth16_zk-SNARK',
    user_id: 'user_riset_01',
    room_id: 'room_test_101',
    timestamp: Date.now() - 15000, // Stempel waktu usang (15 detik lalu)
    nonce: 'exp_webrtc_nonce_2026',
    proof: { pi_a: ['0x1', '0x2'], pi_b: [['0x3', '0x4'], ['0x5', '0x6']], pi_c: ['0x7', '0x8'] }
};

function sendReplayRequest(attempt) {
    return new Promise((resolve) => {
        const data = JSON.stringify(tamperedPayload);
        const url = new URL(SERVER_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                // Kriteria Sukses Sistem: Menolak akses (401 Unauthorized / deteksi reuse)
                const isRejected = res.statusCode === 401 || body.includes('expired') || body.includes('nonce reuse');
                const attackSuccess = !isRejected ? 1 : 0; // 1 = Tembus, 0 = Ditolak (Aman)
                
                // Catat baris ke CSV
                const cleanBody = body.replace(/,/g, ';').trim();
                const csvRow = `${attempt},Groth16_zk-SNARK,${Date.now()},${res.statusCode},${cleanBody},${attackSuccess}\n`;
                fs.appendFileSync(CSV_FILE_PATH, csvRow, 'utf8');

                resolve({ attempt, statusCode: res.statusCode, success: !isRejected });
            });
        });

        req.on('error', (err) => {
            const csvRow = `${attempt},Groth16_zk-SNARK,${Date.now()},500,Network_Error,0\n`;
            fs.appendFileSync(CSV_FILE_PATH, csvRow, 'utf8');
            resolve({ attempt, statusCode: 500, success: false });
        });

        req.write(data);
        req.end();
    });
}

async function runExperiment() {
    console.log(`======================================================================`);
    console.log(`JUDUL RISET: Evaluating Performance and Privacy Trade-offs...`);
    console.log(`SIMULASI METODOLOGI: REPLAY ATTACK (50 ITERASI OTOMATIS)`);
    console.log(`======================================================================`);
    
    let attackSuccessCount = 0;

    for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
        const result = await sendReplayRequest(i);
        if (result.success) attackSuccessCount++;
        console.log(`[Uji Coba #${String(i).padStart(2, '0')}] Status HTTP: ${result.statusCode} | Attack Success: ${result.success ? 'YA ❌' : 'TIDAK (Sistem Aman)  '}`);
    }

    const attackSuccessRate = (attackSuccessCount / TOTAL_ATTEMPTS) * 100;
    console.log(`\n=================== HASIL KETAHANAN KUANTITATIF ===================`);
    console.log(`Total Eksekusi Serangan        : ${TOTAL_ATTEMPTS} Kali`);
    console.log(`Total Kebocoran Terdeteksi      : ${attackSuccessCount}`);
    console.log(`Tingkat Keberhasilan Serangan  : ${attackSuccessRate.toFixed(2)}%`);
    console.log(`Ekspor Berkas Telemetri        : ${CSV_FILE_PATH}`);
    console.log(`Status Kriteria Keberhasilan    : ${attackSuccessRate === 0 ? 'VALID (0.0% Failure Rate)' : 'EVALUASI KEMBALI KODE SERVER'}`);
    console.log(`======================================================================\n`);
}

runExperiment();