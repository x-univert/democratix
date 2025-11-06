const https = require('https');

const contractAddress = 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';

// Récupérer l'ABI du contrat depuis l'API
https.get(`https://devnet-api.multiversx.com/accounts/${contractAddress}`, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const account = JSON.parse(data);
    console.log('\n=== INFORMATIONS DU CONTRAT ===');
    console.log('Code Hash:', account.codeHash);
    console.log('Code:', account.code ? `${account.code.substring(0, 100)}...` : 'N/A');

    // Maintenant récupérons les détails de la dernière transaction pour voir l'ABI
    https.get(`https://devnet-api.multiversx.com/accounts/${contractAddress}/transactions?size=1&function=generateInvitationCodes`, (res2) => {
      let data2 = '';

      res2.on('data', (chunk) => {
        data2 += chunk;
      });

      res2.on('end', () => {
        const txs = JSON.parse(data2);
        if (txs.length > 0) {
          const lastTx = txs[0];
          console.log('\n=== DERNIÈRE TRANSACTION generateInvitationCodes ===');
          console.log('Hash:', lastTx.txHash);
          console.log('Data:', lastTx.data);

          // Décoder le data
          const decoded = Buffer.from(lastTx.data, 'base64').toString('utf-8');
          console.log('Data décodée:', decoded);

          const parts = decoded.split('@');
          console.log('\nArguments:');
          console.log('- Function:', parts[0]);
          console.log('- Arg 1 (election_id):', parts[1], '=', parseInt(parts[1], 16));
          console.log('- Arg 2 (count):', parts[2], '=', parseInt(parts[2], 16));
          console.log('- Arg 3 (batch_offset):', parts[3] || 'VIDE', parts[3] ? '= ' + parseInt(parts[3], 16) : '');
        }
      });
    });
  });
});
