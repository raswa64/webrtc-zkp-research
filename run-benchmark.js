// // const puppeteer = require('puppeteer');

// // const JUMLAH_ITERASI = 5; 
// // const BASE_URL = 'http://localhost:8080';

// // const LAUNCH_OPTIONS = {
// //     headless: 'new',
// //     executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
// //     args: [
// //         '--no-sandbox',
// //         '--disable-setuid-sandbox',
// //         '--disable-dev-shm-usage',
// //         '--use-fake-ui-for-media-stream',
// //         '--use-fake-device-for-media-stream',
// //         '--allow-insecure-localhost',
// //         '--autoplay-policy=no-user-gesture-required',
// //         // Tambahkan 2 flag ini agar Chrome Headless tidak menyembunyikan IP lokal:
// //         '--disable-features=WebRtcHideLocalIpsWithMdns',
// //         '--allow-loopback-in-peer-connection'
// //     ]
// // };

// // function jeda(ms) {
// //     return new Promise(resolve => setTimeout(resolve, ms));
// // }

// // async function jalankanPengujianSatuIterasi(browser, metode, iterasiKe) {
// //     console.log(`  [${metode}] Percobaan ${iterasiKe}/${JUMLAH_ITERASI}...`);
    
// //     // Gunakan SATU BrowserContext terpisah untuk tiap iterasi agar isolasi bersih
// //     const context = await browser.createBrowserContext();
// //     let pageA = null;
// //     let pageB = null;

// //     try {
// //         // 1. Inisialisasi Peer B (Penerima)
// //         pageB = await context.newPage();
        
// //         // Cetak console.log dari browser ke terminal untuk debugging jika ada error JS
// //         pageB.on('pageerror', err => console.log('    [Console Error Peer B]:', err.message));

// //         await pageB.goto(`${BASE_URL}/peer-b.html`, { waitUntil: 'domcontentloaded' });
        
// //         // Klik tombol sambung Peer B
// //         if (metode === 'JWT') {
// //             await pageB.click('#btnJwt');
// //         } else {
// //             await pageB.click('#btnZkp');
// //         }

// //         // Tunggu hingga status socket Peer B sukses terhubung
// //         await pageB.waitForFunction(
// //             () => {
// //                 const el = document.getElementById('status');
// //                 return el && el.classList.contains('sukses');
// //             },
// //             { timeout: 15000 }
// //         );

// //         await jeda(1000); // Berikan jeda agar Socket room benar-benar terdaftar di server

// //         // 2. Inisialisasi Peer A (Pembuat Penawaran)
// //         pageA = await context.newPage();
// //         pageA.on('pageerror', err => console.log('    [Console Error Peer A]:', err.message));

// //         await pageA.goto(`${BASE_URL}/peer-a.html`, { waitUntil: 'domcontentloaded' });

// //         if (metode === 'JWT') {
// //             await pageA.click('#btnJwt');
// //         } else {
// //             await pageA.click('#btnZkp');
// //         }

// //         // 3. Tunggu hingga benchmark selesai pada Peer A
// //         const timeoutMs = metode === 'ZKP' ? 60000 : 30000;

// //         await pageA.waitForFunction(
// //             () => {
// //                 return window.__benchmark && 
// //                        (window.__benchmark.status === 'selesai' || window.__benchmark.status === 'gagal');
// //             },
// //             { timeout: timeoutMs }
// //         );

// //         const hasil = await pageA.evaluate(() => window.__benchmark);

// //         if (hasil.status === 'selesai') {
// //             console.log(`    ✅ Sukses! Durasi Total: ${Number(hasil.durasiTotal).toFixed(2)} ms`);
// //         } else {
// //             console.log(`    ❌ Gagal di App! Error: ${hasil.error || 'Terjadi kesalahan'}`);
// //         }

// //     } catch (err) {
// //         console.log(`    ❌ Gagal! (${err.message})`);
// //     } finally {
// //         // Tutup isolasi context halaman
// //         await context.close();
// //         await jeda(1000);
// //     }
// // }

// // async function mulaiBenchmark() {
// //     console.log('===================================================');
// //     console.log('🤖 Memulai benchmark otomatis JWT vs ZKP (WebRTC)');
// //     console.log(`🔄 Iterasi per metode: ${JUMLAH_ITERASI}`);
// //     console.log('===================================================\n');

// //     const browser = await puppeteer.launch(LAUNCH_OPTIONS);

// //     try {
// //         console.log('▶️ Menguji metode: JWT');
// //         for (let i = 1; i <= JUMLAH_ITERASI; i++) {
// //             await jalankanPengujianSatuIterasi(browser, 'JWT', i);
// //         }

// //         console.log('\n---------------------------------------------------\n');

// //         console.log('▶️ Menguji metode: ZKP');
// //         for (let i = 1; i <= JUMLAH_ITERASI; i++) {
// //             await jalankanPengujianSatuIterasi(browser, 'ZKP', i);
// //         }

// //         console.log('\n===================================================');
// //         console.log('🎉 Seluruh pengujian benchmark selesai!');
// //         console.log('===================================================');

// //     } catch (err) {
// //         console.error('❌ Terjadi kesalahan runner:', err);
// //     } finally {
// //         await browser.close();
// //         process.exit(0);
// //     }
// // }

// // mulaiBenchmark();
// const puppeteer = require('puppeteer');

// // Konfigurasi Pengujian
// const JUMLAH_ITERASI = 5; 
// const BASE_URL = 'http://localhost:8080';

// // Konfigurasi Puppeteer khusus lingkungan WSL / Linux Headless
// const LAUNCH_OPTIONS = {
//     headless: 'new',
//     executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
//     args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--use-fake-ui-for-media-stream',
//         '--use-fake-device-for-media-stream',
//         '--allow-insecure-localhost',
//         '--autoplay-policy=no-user-gesture-required',
//         '--disable-features=WebRtcHideLocalIpsWithMdns',
//         '--allow-loopback-in-peer-connection',
//         // Tambahkan flag ini untuk stabilitas WebAssembly SnarkJS di WSL:
//         '--js-flags="--max-old-space-size=4096"',
//         '--disable-web-security'
//     ]
// };

// function jeda(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function jalankanPengujianSatuIterasi(browser, metode, iterasiKe) {
//     console.log(`  [${metode}] Percobaan ${iterasiKe}/${JUMLAH_ITERASI}...`);
    
//     // Gunakan BrowserContext terpisah untuk isolasi sesi antar percobaan
//     const context = await browser.createBrowserContext();
//     let pageA = null;
//     let pageB = null;

//     try {
//         // 1. Inisialisasi Peer B (Penerima Offer)
//         pageB = await context.newPage();
        
//         // Tangkap console error dari browser jika ada
//         // pageB.on('pageerror', err => console.log('    [Console Error Peer B]:', err.message));
//         pageB.on('console', msg => {
//     if (msg.type() === 'error' || msg.text().includes('ZKP') || msg.text().includes('snark')) {
//         console.log('    [Console B]:', msg.text());
//     }
// });

//         await pageB.goto(`${BASE_URL}/peer-b.html`, { waitUntil: 'domcontentloaded' });
        
//         // Pemicu autentikasi Peer B
//         if (metode === 'JWT') {
//             await pageB.click('#btnJwt');
//         } else {
//             await pageB.click('#btnZkp');
//         }

//         // Tunggu hingga Socket Peer B terhubung & bukti/token selesai dibuat
//         // (ZKP memerlukan waktu lebih lama untuk pembuktian di Peer B)
//         const timeoutPeerB = metode === 'ZKP' ? 60000 : 15000;
//         await pageB.waitForFunction(
//             () => {
//                 const el = document.getElementById('status');
//                 return el && el.classList.contains('sukses');
//             },
//             { timeout: timeoutPeerB }
//         );

//         await jeda(500); // Beri waktu sejenak agar Socket room terdaftar lengkap di server

//         // 2. Inisialisasi Peer A (Pembuat Offer)
//         pageA = await context.newPage();
//         // pageA.on('pageerror', err => console.log('    [Console Error Peer A]:', err.message));
//         pageA.on('console', msg => {
//     if (msg.type() === 'error' || msg.text().includes('ZKP') || msg.text().includes('snark')) {
//         console.log('    [Console A]:', msg.text());
//     }
// });
//         await pageA.goto(`${BASE_URL}/peer-a.html`, { waitUntil: 'domcontentloaded' });

//         if (metode === 'JWT') {
//             await pageA.click('#btnJwt');
//         } else {
//             await pageA.click('#btnZkp');
//         }

//         // 3. Tunggu hingga benchmark pada Peer A selesai (koneksi P2P WebRTC terbentuk)
//         const timeoutPeerA = metode === 'ZKP' ? 120000 : 30000;

//         await pageA.waitForFunction(
//             () => {
//                 return window.__benchmark && 
//                        (window.__benchmark.status === 'selesai' || window.__benchmark.status === 'gagal');
//             },
//             { timeout: timeoutPeerA }
//         );

//         const hasil = await pageA.evaluate(() => window.__benchmark);

//         if (hasil.status === 'selesai') {
//             console.log(`    ✅ Sukses! Durasi Total: ${Number(hasil.durasiTotal).toFixed(2)} ms`);
//         } else {
//             console.log(`    ❌ Gagal di App! Error: ${hasil.error || 'Terjadi kesalahan'}`);
//         }

//     } catch (err) {
//         console.log(`    ❌ Gagal! (${err.message})`);
//     } finally {
//         // Tutup context halaman untuk mengosongkan memori sebelum iterasi berikutnya
//         await context.close();
//         await jeda(1000);
//     }
// }

// async function mulaiBenchmark() {
//     console.log('===================================================');
//     console.log('🤖 Memulai benchmark otomatis JWT vs ZKP (WebRTC)');
//     console.log(`🔄 Iterasi per metode: ${JUMLAH_ITERASI}`);
//     console.log('===================================================\n');

//     const browser = await puppeteer.launch(LAUNCH_OPTIONS);

//     try {
//         // === Pengujian Metode JWT ===
//         console.log('▶️ Menguji metode: JWT');
//         for (let i = 1; i <= JUMLAH_ITERASI; i++) {
//             await jalankanPengujianSatuIterasi(browser, 'JWT', i);
//         }

//         console.log('\n---------------------------------------------------\n');

//         // === Pengujian Metode ZKP ===
//         console.log('▶️ Menguji metode: ZKP');
//         for (let i = 1; i <= JUMLAH_ITERASI; i++) {
//             await jalankanPengujianSatuIterasi(browser, 'ZKP', i);
//         }

//         console.log('\n===================================================');
//         console.log('🎉 Seluruh pengujian benchmark selesai!');
//         console.log('===================================================');

//     } catch (err) {
//         console.error('❌ Terjadi kesalahan fatal pada runner:', err);
//     } finally {
//         await browser.close();
//         process.exit(0);
//     }
// }

// // Jalankan runner
// mulaiBenchmark();
const puppeteer = require('puppeteer');

const JUMLAH_ITERASI = 100; 
const BASE_URL = 'http://localhost:8080';

const LAUNCH_OPTIONS = {
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-insecure-localhost',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-features=WebRtcHideLocalIpsWithMdns',
        '--allow-loopback-in-peer-connection',
        '--js-flags="--max-old-space-size=4096"'
    ]
};

function jeda(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function jalankanPengujianSatuIterasi(browser, metode, iterasiKe) {
    console.log(`  [${metode}] Percobaan ${iterasiKe}/${JUMLAH_ITERASI}...`);
    
    const context = await browser.createBrowserContext();
    let pageA = null;
    let pageB = null;

    try {
        pageB = await context.newPage();
        
        // pageB.on('console', msg => {
        //     if (msg.type() === 'error') console.log('    [Console B Error]:', msg.text());
        // });
        pageB.on('console', msg => {
    const text = msg.text();
    // Abaikan error favicon agar terminal tidak tercemar log tidak penting
    if (msg.type() === 'error' && !text.includes('favicon.ico')) {
        console.log('    [Console B Error]:', text);
    }
});

        await pageB.goto(`${BASE_URL}/peer-b.html`, { waitUntil: 'domcontentloaded' });
        
        if (metode === 'JWT') {
            await pageB.click('#btnJwt');
        } else {
            await pageB.click('#btnZkp');
        }

        const timeoutPeerB = metode === 'ZKP' ? 60000 : 15000;
        await pageB.waitForFunction(
            () => {
                const el = document.getElementById('status');
                return el && el.classList.contains('sukses');
            },
            { timeout: timeoutPeerB }
        );

        await jeda(500);

        pageA = await context.newPage();
        // pageA.on('console', msg => {
        //     if (msg.type() === 'error') console.log('    [Console A Error]:', msg.text());
        // });
        pageA.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon.ico')) {
        console.log('    [Console A Error]:', text);
    }
});

        await pageA.goto(`${BASE_URL}/peer-a.html`, { waitUntil: 'domcontentloaded' });

        if (metode === 'JWT') {
            await pageA.click('#btnJwt');
        } else {
            await pageA.click('#btnZkp');
        }

        const timeoutPeerA = metode === 'ZKP' ? 120000 : 30000;

        await pageA.waitForFunction(
            () => {
                return window.__benchmark && 
                       (window.__benchmark.status === 'selesai' || window.__benchmark.status === 'gagal');
            },
            { timeout: timeoutPeerA }
        );

        const hasil = await pageA.evaluate(() => window.__benchmark);

        if (hasil.status === 'selesai') {
            console.log(`    ✅ Sukses! Durasi Total: ${Number(hasil.durasiTotal).toFixed(2)} ms`);
        } else {
            console.log(`    ❌ Gagal di App! Error: ${hasil.error || 'Terjadi kesalahan'}`);
        }

    } catch (err) {
        console.log(`    ❌ Gagal! (${err.message})`);
    } finally {
        await context.close();
        await jeda(1000);
    }
}

async function mulaiBenchmark() {
    console.log('===================================================');
    console.log('🤖 Memulai benchmark otomatis JWT vs ZKP (WebRTC)');
    console.log(`🔄 Iterasi per metode: ${JUMLAH_ITERASI}`);
    console.log('===================================================\n');

    const browser = await puppeteer.launch(LAUNCH_OPTIONS);

    try {
        console.log('▶️ Menguji metode: JWT');
        for (let i = 1; i <= JUMLAH_ITERASI; i++) {
            await jalankanPengujianSatuIterasi(browser, 'JWT', i);
        }

        console.log('\n---------------------------------------------------\n');

        console.log('▶️ Menguji metode: ZKP');
        for (let i = 1; i <= JUMLAH_ITERASI; i++) {
            await jalankanPengujianSatuIterasi(browser, 'ZKP', i);
        }

        console.log('\n===================================================');
        console.log('🎉 Seluruh pengujian benchmark selesai!');
        console.log('===================================================');

    } catch (err) {
        console.error('❌ Terjadi kesalahan fatal pada runner:', err);
    } finally {
        await browser.close();
        process.exit(0);
    }
}

mulaiBenchmark();