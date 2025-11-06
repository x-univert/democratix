// Script pour vérifier une élection sur la blockchain
const https = require('https');

const votingContract = 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';
const electionId = 66;

// Convertir l'ID en hex (u64 = 8 bytes = 16 caractères hex)
const idHex = electionId.toString(16).padStart(16, '0');

console.log('🔍 Vérification de l\'élection #' + electionId);
console.log('📍 Contrat:', votingContract);
console.log('🔢 ID (hex):', idHex);
console.log('');

const data = JSON.stringify({
  scAddress: votingContract,
  funcName: 'getElection',
  args: [idHex]
});

const options = {
  hostname: 'devnet-api.multiversx.com',
  path: '/vm-values/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);

      if (result.data && result.data.data && result.data.data.returnData && result.data.data.returnData.length > 0) {
        const electionBase64 = result.data.data.returnData[0];
        const electionHex = Buffer.from(electionBase64, 'base64').toString('hex');

        console.log('✅ Élection trouvée!');
        console.log('');
        console.log('📊 Données brutes (hex):', electionHex);
        console.log('');
        console.log('🔍 Longueur des données:', electionHex.length / 2, 'bytes');
        console.log('');

        // Parser les champs basiques
        let offset = 0;

        // ID (u64 - 8 bytes)
        const id = parseInt(electionHex.substr(offset, 16), 16);
        offset += 16;
        console.log('ID:', id);

        // Title length (u32 - 4 bytes)
        const titleLen = parseInt(electionHex.substr(offset, 8), 16);
        offset += 8;

        // Title (ManagedBuffer)
        const titleHex = electionHex.substr(offset, titleLen * 2);
        const title = Buffer.from(titleHex, 'hex').toString('utf8');
        offset += titleLen * 2;
        console.log('Titre:', title);

        // Description length
        const descLen = parseInt(electionHex.substr(offset, 8), 16);
        offset += 8;

        // Description
        const descHex = electionHex.substr(offset, descLen * 2);
        offset += descLen * 2;

        // Organizer (32 bytes)
        offset += 64;

        // Start time (u64)
        offset += 16;

        // End time (u64)
        offset += 16;

        // Num candidates (u32)
        offset += 8;

        // Status (u8)
        offset += 2;

        // Total votes (u64)
        offset += 16;

        // Requires registration (bool - u8)
        const requiresReg = parseInt(electionHex.substr(offset, 2), 16);
        offset += 2;
        console.log('Requires registration:', requiresReg === 1);

        // Registered voters count (u64)
        offset += 16;

        // Registration deadline (Option<u64>)
        if (offset < electionHex.length) {
          const hasDeadline = parseInt(electionHex.substr(offset, 2), 16);
          offset += 2;

          if (hasDeadline === 1) {
            offset += 16; // Skip the u64 deadline
          }

          console.log('Has deadline:', hasDeadline === 1);
        }

        // ENCRYPTION TYPE (u8)
        if (offset < electionHex.length) {
          const encryptionType = parseInt(electionHex.substr(offset, 2), 16);
          offset += 2;

          console.log('');
          console.log('🔐 ENCRYPTION_TYPE:', encryptionType);
          console.log('');

          if (encryptionType === 0) {
            console.log('   ➡️ Type 0: Aucun chiffrement (Standard)');
          } else if (encryptionType === 1) {
            console.log('   ➡️ Type 1: ElGamal seulement');
          } else if (encryptionType === 2) {
            console.log('   ➡️ Type 2: ElGamal + zk-SNARK');
          } else {
            console.log('   ⚠️ Type inconnu:', encryptionType);
          }
        } else {
          console.log('');
          console.log('⚠️ ENCRYPTION_TYPE non trouvé dans les données!');
          console.log('   ➡️ L\'élection a probablement été créée avec l\'ancien smart contract');
        }

        console.log('');
        console.log('📏 Bytes restants:', (electionHex.length - offset) / 2);

      } else {
        console.log('❌ Élection non trouvée ou erreur:', result);
      }
    } catch (error) {
      console.error('❌ Erreur de parsing:', error);
      console.log('Réponse brute:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur réseau:', error);
});

req.write(data);
req.end();
