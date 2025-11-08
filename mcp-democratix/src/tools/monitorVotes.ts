/**
 * Monitor Votes Tool
 * Monitore les votes en temps réel pour une élection
 */

import axios from 'axios';

const MULTIVERSX_API = process.env.MULTIVERSX_API_URL || 'https://devnet-api.multiversx.com';
const VOTING_CONTRACT = process.env.VOTING_CONTRACT_ADDRESS || '';

export async function monitorVotesTool(args: any) {
  const { electionId, limit = 10 } = args;

  try {
    // Get recent transactions for voting contract
    const response = await axios.get(
      `${MULTIVERSX_API}/accounts/${VOTING_CONTRACT}/transactions`,
      {
        params: {
          size: 50,
          status: 'success'
        }
      }
    );

    const transactions = response.data || [];

    // Filter vote transactions
    const voteFunctions = [
      'vote',
      'submitPrivateVote',
      'submitEncryptedVote',
      'submitPrivateVoteWithProof'
    ];

    const votes = transactions
      .filter((tx: any) => voteFunctions.includes(tx.function))
      .slice(0, limit)
      .map((tx: any) => {
        let voteType = 'Unknown';
        let voteTypeIcon = '❓';

        switch (tx.function) {
          case 'vote':
            voteType = 'Standard (Public)';
            voteTypeIcon = '📢';
            break;
          case 'submitPrivateVote':
            voteType = 'Privé zk-SNARK';
            voteTypeIcon = '🔐';
            break;
          case 'submitEncryptedVote':
            voteType = 'Chiffré ElGamal (Option 1)';
            voteTypeIcon = '🔒';
            break;
          case 'submitPrivateVoteWithProof':
            voteType = 'Chiffré + zkSNARK (Option 2)';
            voteTypeIcon = '🛡️';
            break;
        }

        return {
          txHash: tx.txHash,
          sender: tx.sender,
          type: voteType,
          icon: voteTypeIcon,
          timestamp: new Date(tx.timestamp * 1000).toLocaleString('fr-FR'),
          gasUsed: tx.gasUsed,
          status: tx.status,
          explorerUrl: `https://devnet-explorer.multiversx.com/transactions/${tx.txHash}`
        };
      });

    if (votes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `ℹ️  Aucun vote trouvé pour l'élection #${electionId}\n\n` +
                  `Vérifiez que l'élection est active et que des votes ont été soumis.`
          }
        ]
      };
    }

    let result = `📊 **Derniers Votes - Élection #${electionId}**\n\n`;
    result += `**${votes.length} votes récents**:\n\n`;

    votes.forEach((vote: any, index: number) => {
      result += `**${index + 1}. ${vote.icon} ${vote.type}**\n`;
      result += `- Votant: \`${vote.sender.substring(0, 10)}...${vote.sender.substring(vote.sender.length - 6)}\`\n`;
      result += `- Date: ${vote.timestamp}\n`;
      result += `- Gas: ${vote.gasUsed.toLocaleString()} units\n`;
      result += `- [Explorer](${vote.explorerUrl})\n\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to monitor votes: ${error instanceof Error ? error.message : String(error)}`);
  }
}
