const https = require('https');

const contractAddress = 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';

https.get(`https://devnet-api.multiversx.com/accounts/${contractAddress}/transactions?size=5&function=upgradeContract`, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const txs = JSON.parse(data);
    console.log('\n=== DERNIÈRES TRANSACTIONS upgradeContract ===\n');

    txs.forEach((tx, i) => {
      const date = new Date(tx.timestamp * 1000);
      console.log(`Upgrade #${i + 1}:`);
      console.log('  Date:', date.toLocaleString('fr-FR'));
      console.log('  Hash:', tx.txHash);
      console.log('  Status:', tx.status);
      console.log('  Sender:', tx.sender);
      console.log('');
    });

    // Comparer avec les dates de nos transactions de génération de codes
    const genCodeTx1Date = new Date(1762256522 * 1000);
    const genCodeTx2Date = new Date(1762256534 * 1000);
    console.log('\n=== COMPARAISON ===');
    console.log('Génération de codes TX1:', genCodeTx1Date.toLocaleString('fr-FR'));
    console.log('Génération de codes TX2:', genCodeTx2Date.toLocaleString('fr-FR'));

    if (txs.length > 0) {
      const lastUpgradeDate = new Date(txs[0].timestamp * 1000);
      console.log('Dernier upgrade:', lastUpgradeDate.toLocaleString('fr-FR'));

      if (lastUpgradeDate < genCodeTx1Date) {
        console.log('\n⚠️  LE CONTRAT A ÉTÉ UPGRADÉ AVANT les transactions de génération de codes');
      } else {
        console.log('\n✅ Le contrat a été upgradé APRÈS les transactions de génération de codes');
      }
    }
  });
});
