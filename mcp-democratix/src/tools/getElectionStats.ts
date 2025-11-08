/**
 * Get Election Stats Tool
 * Récupère les statistiques complètes d'une élection depuis la blockchain
 */

import axios from 'axios';

const MULTIVERSX_API = process.env.MULTIVERSX_API_URL || 'https://devnet-api.multiversx.com';
const VOTING_CONTRACT = process.env.VOTING_CONTRACT_ADDRESS || '';

export async function getElectionStatsTool(args: any) {
  const { electionId } = args;

  try {
    // Convert election ID to hex
    const electionIdHex = electionId.toString(16).padStart(16, '0');

    // Query blockchain for election data
    const response = await axios.post(`${MULTIVERSX_API}/vm-values/query`, {
      scAddress: VOTING_CONTRACT,
      funcName: 'getElection',
      args: [electionIdHex]
    });

    if (!response.data?.data?.returnData) {
      throw new Error(`Election ${electionId} not found`);
    }

    // Parse election data (simplified - adapt based on your contract)
    const returnData = response.data.data.returnData;

    // Get votes for this election
    const votesResponse = await axios.get(
      `${MULTIVERSX_API}/accounts/${VOTING_CONTRACT}/transactions?function=vote&function=submitPrivateVote&function=submitEncryptedVote&function=submitPrivateVoteWithProof`
    );

    const allTxs = votesResponse.data || [];
    const electionVotes = allTxs.filter((tx: any) => {
      // Check if this transaction is for our election (simplified)
      return tx.status === 'success';
    });

    const stats = {
      electionId,
      totalVotes: electionVotes.length,
      votesByType: {
        standard: electionVotes.filter((tx: any) => tx.function === 'vote').length,
        privateZkSnark: electionVotes.filter((tx: any) => tx.function === 'submitPrivateVote').length,
        encryptedElGamal: electionVotes.filter((tx: any) => tx.function === 'submitEncryptedVote').length,
        encryptedWithProof: electionVotes.filter((tx: any) => tx.function === 'submitPrivateVoteWithProof').length
      },
      averageGasUsed: electionVotes.length > 0
        ? electionVotes.reduce((sum: number, tx: any) => sum + (tx.gasUsed || 0), 0) / electionVotes.length
        : 0,
      frontendUrl: `${process.env.FRONTEND_URL}/election/${electionId}`
    };

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Statistiques Élection #${electionId}**\n\n` +
                `**Total votes**: ${stats.totalVotes}\n\n` +
                `**Votes par type**:\n` +
                `- Standard (public): ${stats.votesByType.standard}\n` +
                `- Privé zk-SNARK: ${stats.votesByType.privateZkSnark}\n` +
                `- Chiffré ElGamal (Option 1): ${stats.votesByType.encryptedElGamal}\n` +
                `- Chiffré + zkSNARK (Option 2): ${stats.votesByType.encryptedWithProof}\n\n` +
                `**Gas moyen**: ${Math.round(stats.averageGasUsed).toLocaleString()} units\n\n` +
                `**Lien**: ${stats.frontendUrl}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to get election stats: ${error instanceof Error ? error.message : String(error)}`);
  }
}
