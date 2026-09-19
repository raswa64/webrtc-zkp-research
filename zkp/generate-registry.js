const { buildPoseidon } = require('circomlibjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Ukuran field BN128 yang dipakai circom/snarkjs (agar nilai rahasia selalu valid sebagai signal)
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

function generateSecretValue() {
  let secret;
  do {
    const randomBytes = crypto.randomBytes(31);
    secret = BigInt('0x' + randomBytes.toString('hex'));
  } while (secret >= FIELD_SIZE || secret === 0n);
  return secret;
}

async function hitungHashPoseidon(nilaiRahasia) {
  const poseidon = await buildPoseidon();
  const hasil = poseidon([nilaiRahasia]);
  return poseidon.F.toObject(hasil);
}

async function daftarkanPeer(peerId) {
  const nilaiRahasiaPengguna = generateSecretValue();
  const hashIdentitasTerdaftar = await hitungHashPoseidon(nilaiRahasiaPengguna);

  return {
    peerId,
    nilaiRahasiaPengguna: nilaiRahasiaPengguna.toString(),
    hashIdentitasTerdaftar: hashIdentitasTerdaftar.toString()
  };
}

async function main() {
  console.log('Mendaftarkan Peer A dan Peer B ke sistem ZKP...\n');

  const peerA = await daftarkanPeer('peer-a');
  const peerB = await daftarkanPeer('peer-b');

  const registryPublik = {
    'peer-a': { hashIdentitasTerdaftar: peerA.hashIdentitasTerdaftar },
    'peer-b': { hashIdentitasTerdaftar: peerB.hashIdentitasTerdaftar }
  };

  const rahasiaLokal = {
    'peer-a': { nilaiRahasiaPengguna: peerA.nilaiRahasiaPengguna },
    'peer-b': { nilaiRahasiaPengguna: peerB.nilaiRahasiaPengguna }
  };

  fs.writeFileSync(
    path.join(__dirname, 'registry-publik.json'),
    JSON.stringify(registryPublik, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, 'rahasia-LOKAL-SAJA.json'),
    JSON.stringify(rahasiaLokal, null, 2)
  );

  console.log('✅ Registrasi selesai!\n');
  console.log('--- Peer A ---');
  console.log('nilaiRahasiaPengguna (PRIVATE, simpan baik-baik):', peerA.nilaiRahasiaPengguna);
  console.log('hashIdentitasTerdaftar (PUBLIC, aman dibagikan): ', peerA.hashIdentitasTerdaftar);

  console.log('\n--- Peer B ---');
  console.log('nilaiRahasiaPengguna (PRIVATE, simpan baik-baik):', peerB.nilaiRahasiaPengguna);
  console.log('hashIdentitasTerdaftar (PUBLIC, aman dibagikan): ', peerB.hashIdentitasTerdaftar);

  console.log('\n📄 File tersimpan:');
  console.log('   - registry-publik.json      (boleh diakses server)');
  console.log('   - rahasia-LOKAL-SAJA.json   (JANGAN commit ke git / kirim ke server!)');
  console.log('\n⚠️  Tambahkan "rahasia-LOKAL-SAJA.json" ke .gitignore sekarang juga.');
}

main().catch((err) => {
  console.error('❌ Gagal menjalankan registrasi:', err);
  process.exit(1);
});