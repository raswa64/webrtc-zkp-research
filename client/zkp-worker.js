// // client/zkp-worker.js

// // Memuat SnarkJS versi 0.7.0 sesuai versi tag script di peer-a.html Anda
// importScripts('https://cdn.jsdelivr.net/npm/snarkjs@0.7.0/dist/snarkjs.min.js');

// self.onmessage = async (e) => {
//     const { input, wasmPath, zkeyPath } = e.data;
    
//     try {
//         // Eksekusi matematika berat ZKP dipindah ke utas latar belakang ini
//         const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        
//         // Kirim kembali hasil kalkulasi ke script utama halaman web
//         self.postMessage({ status: 'sukses', proof, publicSignals });
//     } catch (err) {
//         self.postMessage({ status: 'gagal', error: err.message });
//     }
// };
importScripts('/snarkjs.min.js');

self.onmessage = async function (e) {
    if (e.data.type === 'GENERATE_PROOF') {
        try {
            const { input, wasmPath, zkeyPath } = e.data;
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                wasmPath,
                zkeyPath
            );
            self.postMessage({
                type: 'PROOF_SUCCESS',
                payload: { proof, publicSignals }
            });
        } catch (err) {
            self.postMessage({
                type: 'PROOF_ERROR',
                error: err.message || 'Gagal membuat proof di worker'
            });
        }
    }
};