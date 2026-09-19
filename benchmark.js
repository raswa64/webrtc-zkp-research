// run-benchmark.js
// Skrip otomatisasi pengujian: menjalankan proses autentikasi + call setup
// WebRTC berulang kali (Peer A <-> Peer B) untuk metode JWT dan ZKP,
// tanpa perlu klik manual. Hasil detail sudah otomatis tercatat di
// data/log-pengujian.csv lewat endpoint /log pada server.js.
//
// Install dependency: npm install puppeteer
// Jalankan: node run-benchmark.js
// (Pastikan `node server.js` sudah berjalan di terminal terpisah)

const puppeteer = require('puppeteer');

// ============================================================
// KONFIGURASI PENGUJIAN
// ============================================================
const SERVER_URL = 'http://localhost:8080';
const JUMLAH_ITERASI = 30;         // ulangi tiap metode sebanyak ini
const METODE_DIUJI = ['jwt', 'zkp'];
const TIMEOUT_PER_PERCOBAAN_MS = 20000; // batas waktu tunggu tiap percobaan
const JEDA_ANTAR_PERCOBAAN_MS = 1500;   // jeda agar socket lama benar-benar disconnect

function tunggu(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function jalankanSatuPercobaan(browser, metode, nomorIterasi) {
    const halamanA = await browser.newPage();
    const halamanB = await browser.newPage();

    const hasil = { metode, iterasi: nomorIterasi, status: 'gagal', error: null, durasiTotalMs: null };

    try {
        // Muat kedua halaman dari awal (state bersih tiap percobaan)
        await halamanB.goto(`${SERVER_URL}/peer-b.html`, { waitUntil: 'networkidle0' });
        await halamanA.goto(`${SERVER_URL}/peer-a.html`, { waitUntil: 'networkidle0' });

        // --- Langkah 1: Peer B connect & registrasi dulu ---
        const selectorTombol = metode === 'jwt' ? '#btnJwt' : '#btnZkp';
        await halamanB.click(selectorTombol);

        await halamanB.waitForFunction(
            () => window.__benchmark && (window.__benchmark.status === 'siap' || window.__benchmark.status === 'gagal'),
            { timeout: TIMEOUT_PER_PERCOBAAN_MS }
        );

        const statusB = await halamanB.evaluate(() => window.__benchmark);
        if (statusB.status !== 'siap') {
            throw new Error(`Peer B gagal siap: ${statusB.error}`);
        }

        // --- Langkah 2: Peer A connect, otomatis membuat offer begitu terhubung ---
        await halamanA.click(selectorTombol);

        await halamanA.waitForFunction(
            () => window.__benchmark && (window.__benchmark.status === 'selesai' || window.__benchmark.status === 'gagal'),
            { timeout: TIMEOUT_PER_PERCOBAAN_MS }
        );

        const statusA = await halamanA.evaluate(() => window.__benchmark);
        if (statusA.status === 'selesai') {
            hasil.status = 'sukses';
            hasil.durasiTotalMs = statusA.durasiTotal;
        } else {
            throw new Error(`Peer A gagal: ${statusA.error}`);
        }

    } catch (err) {
        hasil.status = 'gagal';
        hasil.error = err.message;
    } finally {
        await halamanA.close();
        await halamanB.close();
    }

    return hasil;
}

async function main() {
    console.log('========================================');
    console.log('🤖 Memulai benchmark otomatis JWT vs ZKP');
    console.log(`   Iterasi per metode: ${JUMLAH_ITERASI}`);
    console.log('========================================\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            // Izinkan akses kamera/mikrofon palsu tanpa perlu izin manual/dialog,
            // agar getUserMedia() di kode WebRTC tidak macet menunggu izin.
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--no-sandbox'
        ]
    });

    const rekapHasil = [];

    for (const metode of METODE_DIUJI) {
        console.log(`\n▶️  Menguji metode: ${metode.toUpperCase()}`);

        for (let i = 1; i <= JUMLAH_ITERASI; i++) {
            process.stdout.write(`   Percobaan ${i}/${JUMLAH_ITERASI}... `);

            const hasil = await jalankanSatuPercobaan(browser, metode, i);
            rekapHasil.push(hasil);

            if (hasil.status === 'sukses') {
                console.log(`✅ sukses (${hasil.durasiTotalMs?.toFixed(2)} ms)`);
            } else {
                console.log(`❌ gagal (${hasil.error})`);
            }

            await tunggu(JEDA_ANTAR_PERCOBAAN_MS);
        }
    }

    await browser.close();

    // === RINGKASAN AKHIR DI TERMINAL ===
    console.log('\n========================================');
    console.log('📊 RINGKASAN HASIL BENCHMARK');
    console.log('========================================');

    for (const metode of METODE_DIUJI) {
        const punyaMetode = rekapHasil.filter((h) => h.metode === metode);
        const sukses = punyaMetode.filter((h) => h.status === 'sukses');
        const asr = ((punyaMetode.length - sukses.length) / punyaMetode.length * 100).toFixed(1);

        const durasiSukses = sukses.map((h) => h.durasiTotalMs).filter(Boolean);
        const rataRata = durasiSukses.length
            ? (durasiSukses.reduce((a, b) => a + b, 0) / durasiSukses.length).toFixed(2)
            : '-';

        console.log(`\n${metode.toUpperCase()}:`);
        console.log(`   Total percobaan : ${punyaMetode.length}`);
        console.log(`   Berhasil        : ${sukses.length}`);
        console.log(`   Gagal           : ${punyaMetode.length - sukses.length} (tingkat gagal: ${asr}%)`);
        console.log(`   Rata-rata durasi total call setup: ${rataRata} ms`);
    }

    console.log('\n📄 Detail lengkap tiap tahap (login, generate proof, verifikasi, dst.)');
    console.log('   tersimpan otomatis di: data/log-pengujian.csv (ditulis oleh server.js)');
    console.log('\n✅ Benchmark selesai.');
}

main().catch((err) => {
    console.error('❌ Benchmark gagal dijalankan:', err);
    process.exit(1);
});