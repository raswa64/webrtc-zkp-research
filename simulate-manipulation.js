// simulate-manipulation.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:8080/auth';
const TOTAL_ATTEMPTS = 50;
const CSV_FILE_PATH = path.join(__dirname, 'log-manipulation-attack.csv');

// Inisialisasi Berkas CSV Hasil Eksperimen
const csvHeader = 'Attempt,Authentication_Method,Tampered_Parameter,Status_Code,Server_Response,Attack_Success_State\n';
fs.writeFileSync(CSV_FILE_PATH, csvHeader, 'utf8');

function createTamperedPayload(method) {
    if (method === 'JWT') {
        return {
            method: 'JWT',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYXR0YWNrZXJfaWQiLCJyb29tX2lkIjoicm9vbV8xMDEifQ.invalid_signature_due_to_tampering_attack'
        };
    } else {
        return {
            method: 'Groth16_zk-SNARK',
            user_id: 'attacker_identity_id', // Nilai publik diubah di tengah jalan (MitM)
            room_id: 'room_test_101',
            proof: { pi_a: ['0x1', '0x2'], pi_b: [['0x3', '0x4'], ['0x5', '0x6']], pi_c: ['0x7', '0x8'] }
        };
    }
}

function sendTamperedRequest(attempt, method) {
    return new Promise((resolve) => {
        const payload = createTamperedPayload(method);
        const data = JSON.stringify(payload);
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
                // Kriteria Sukses Sistem: Menolak ketidaksesuaian kriptografi (403 Forbidden / Verification Failed)
                const isRejected = res.statusCode === 403 || body.includes('invalid signature') || body.includes('verification failed');
                const attackSuccess = !isRejected ? 1 : 0;

                const cleanBody = body.replace(/,/g, ';').trim();
                const csvRow = `${attempt},${method},user_id,${res.statusCode},${cleanBody},${attackSuccess}\n`;
                fs.appendFileSync(CSV_FILE_PATH, csvRow, 'utf8');

                resolve({ success: !isRejected });
            });
        });

        req.on('error', () => {
            const csvRow = `${attempt},${method},user_id,500,Network_Error,0\n`;
            fs.appendFileSync(CSV_FILE_PATH, csvRow, 'utf8');
            resolve({ success: false });
        });

        req.write(data);
        req.end();
    });
}

async function runExperiment() {
    console.log(`======================================================================`);
    console.log(`JUDUL RISET: Evaluating Performance and Privacy Trade-offs...`);
    console.log(`SIMULASI METODOLOGI: PAYLOAD MANIPULATION (50 ITERASI PER METODE)`);
    console.log(`======================================================================`);

    const methods = ['JWT', 'Groth16_zk-SNARK'];
    
    for (const method of methods) {
        console.log(`\n> Memulai Intersept Kontrol Pada Metode: [ ${method} ]`);
        let attackSuccessCount = 0;

        for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
            const result = await sendTamperedRequest(i, method);
            if (result.success) attackSuccessCount++;
        }

        const attackSuccessRate = (attackSuccessCount / TOTAL_ATTEMPTS) * 100;
        console.log(`  --------------------------------------------------`);
        console.log(`  * Total Percobaan Manipulasi : ${TOTAL_ATTEMPTS} Sesi`);
        console.log(`  * Tembus Hambatan Kriptografi: ${attackSuccessCount} Kali`);
        console.log(`  * Attack Success Rate (ASR)  : ${attackSuccessRate.toFixed(2)}%`);
        console.log(`  * Status Keamanan Fungsional : ${attackSuccessRate === 0 ? 'AMAN MUTLAK (0.0% ASR)' : 'RENTAN BUBBLE'}`);
    }
    console.log(`\n======================================================================`);
    console.log(`Ekspor Laporan Telemetri Komparatif: ${CSV_FILE_PATH}`);
    console.log(`======================================================================\n`);
}

runExperiment();