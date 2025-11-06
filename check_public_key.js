// Script pour vérifier la clé publique ElGamal d'une élection
const https = require('https');

const votingContract = 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';
const electionId = 66;

// Convertir l'ID en hex
const idHex = electionId.toString(16).padStart(16, '0');

console.log('🔍 Vérification de la clé publique ElGamal pour l\'élection #' + electionId);
console.log('');

const data = JSON.stringify({
  scAddress: votingContract,
  funcName: 'getElectionPublicKey',
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

      if (result.data && result.data.data && result.data.data.returnData) {
        if (result.data.data.returnData.length === 0) {
          console.log('❌ Aucune clé publique ElGamal trouvée pour cette élection');
          console.log('');
          console.log('⚠️  Vous devez configurer la clé publique ElGamal avant de pouvoir utiliser les Options 1 ou 2');
          console.log('');
          console.log('📝 Pour configurer la clé :');
          console.log('   1. Allez sur la page de détail de l\'élection');
          console.log('   2. Cliquez sur "Configurer ElGamal" ou "Setup ElGamal Encryption"');
          console.log('   3. Générez et stockez la clé publique');
          console.log('');
        } else {
          console.log('✅ Clé publique ElGamal trouvée!');
          console.log('');

          const returnData = result.data.data.returnData;
          console.log('📊 Données (base64):', returnData[0]);

          // Parser les données
          const hexData = Buffer.from(returnData[0], 'base64').toString('hex');
          console.log('📊 Données (hex):', hexData);
          console.log('');

          if (hexData.length > 0) {
            console.log('🔑 La clé publique est configurée');
            console.log('');
            console.log('✅ Vous pouvez maintenant voter avec :');
            console.log('   - Option 1 : Vote chiffré ElGamal');
            console.log('   - Option 2 : Vote chiffré ElGamal + zk-SNARK');
          }
        }
      } else {
        console.log('⚠️  Réponse inattendue:', result);
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
