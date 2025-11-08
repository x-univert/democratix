/**
 * Get Votes By Type Tool
 * Analyse la répartition des votes par type de chiffrement
 */

import axios from 'axios';

const MULTIVERSX_API = process.env.MULTIVERSX_API_URL || 'https://devnet-api.multiversx.com';
const VOTING_CONTRACT = process.env.VOTING_CONTRACT_ADDRESS || '';

export async function getVotesByTypeTool(args: any) {
  const { electionId } = args;

  try {
    // Get all transactions for voting contract
    const response = await axios.get(
      `${MULTIVERSX_API}/accounts/${VOTING_CONTRACT}/transactions`,
      {
        params: {
          size: 100,
          status: 'success'
        }
      }
    );

    const transactions = response.data || [];

    // Count votes by type
    const stats = {
      standard: 0,
      privateZkSnark: 0,
      encryptedElGamal: 0,
      encryptedWithProof: 0,
      total: 0
    };

    const voteFunctions = {
      'vote': 'standard',
      'submitPrivateVote': 'privateZkSnark',
      'submitEncryptedVote': 'encryptedElGamal',
      'submitPrivateVoteWithProof': 'encryptedWithProof'
    };

    transactions.forEach((tx: any) => {
      if (tx.function in voteFunctions) {
        const type = voteFunctions[tx.function as keyof typeof voteFunctions];
        stats[type as keyof typeof stats]++;
        stats.total++;
      }
    });

    // Calculate percentages
    const percentages = {
      standard: stats.total > 0 ? (stats.standard / stats.total * 100).toFixed(1) : '0',
      privateZkSnark: stats.total > 0 ? (stats.privateZkSnark / stats.total * 100).toFixed(1) : '0',
      encryptedElGamal: stats.total > 0 ? (stats.encryptedElGamal / stats.total * 100).toFixed(1) : '0',
      encryptedWithProof: stats.total > 0 ? (stats.encryptedWithProof / stats.total * 100).toFixed(1) : '0'
    };

    let result = `📊 **Répartition des Votes par Type${electionId ? ` - Élection #${electionId}` : ''}**\n\n`;
    result += `**Total**: ${stats.total} votes\n\n`;

    result += `| Type | Votes | Pourcentage |\n`;
    result += `|------|-------|-------------|\n`;
    result += `| 📢 Standard (Public) | ${stats.standard} | ${percentages.standard}% |\n`;
    result += `| 🔐 Privé zk-SNARK | ${stats.privateZkSnark} | ${percentages.privateZkSnark}% |\n`;
    result += `| 🔒 Chiffré ElGamal (Option 1) | ${stats.encryptedElGamal} | ${percentages.encryptedElGamal}% |\n`;
    result += `| 🛡️ Chiffré + zkSNARK (Option 2) | ${stats.encryptedWithProof} | ${percentages.encryptedWithProof}% |\n\n`;

    // Visual bar chart
    const maxVotes = Math.max(stats.standard, stats.privateZkSnark, stats.encryptedElGamal, stats.encryptedWithProof);
    if (maxVotes > 0) {
      result += `**Graphique**:\n\`\`\`\n`;
      const barLength = 40;
      result += `Standard:         ${'█'.repeat(Math.round(stats.standard / maxVotes * barLength))} ${stats.standard}\n`;
      result += `Privé zkSNARK:    ${'█'.repeat(Math.round(stats.privateZkSnark / maxVotes * barLength))} ${stats.privateZkSnark}\n`;
      result += `ElGamal (Opt 1):  ${'█'.repeat(Math.round(stats.encryptedElGamal / maxVotes * barLength))} ${stats.encryptedElGamal}\n`;
      result += `ElGamal+zk (Opt2):${'█'.repeat(Math.round(stats.encryptedWithProof / maxVotes * barLength))} ${stats.encryptedWithProof}\n`;
      result += `\`\`\``;
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to get votes by type: ${error instanceof Error ? error.message : String(error)}`);
  }
}
