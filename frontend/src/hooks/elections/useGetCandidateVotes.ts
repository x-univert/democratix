import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

export const useGetCandidateVotes = () => {
  const { network } = useGetNetworkConfig();

  const getCandidateVotes = async (electionId: number, candidateId: number): Promise<number> => {
    try {
      const apiUrl = network.apiAddress;

      // Convertir les IDs en hex avec le bon padding
      // election_id: u64 (8 bytes = 16 caractères hex)
      // candidate_id: u32 (4 bytes = 8 caractères hex)
      const electionIdHex = electionId.toString(16).padStart(16, '0');
      const candidateIdHex = candidateId.toString(16).padStart(8, '0');

      console.log(`🔍 Fetching votes for candidate ${candidateId} in election ${electionId}`);
      console.log(`   Election ID hex: ${electionIdHex}, Candidate ID hex: ${candidateIdHex}`);

      const response = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getCandidateVotes',
            args: [electionIdHex, candidateIdHex]
          })
        }
      );

      const data = await response.json();
      console.log(`   Response for candidate ${candidateId}:`, data);
      console.log(`   data.data:`, data.data);
      console.log(`   data.data.data:`, data.data?.data);

      if (!data.data?.data?.returnData || data.data.data.returnData.length === 0) {
        console.log(`   ⚠️ No data returned for candidate ${candidateId}`);
        console.log(`   returnData:`, data.data?.data?.returnData);
        return 0;
      }

      // Décoder le nombre de votes depuis base64
      const votesBase64 = data.data.data.returnData[0];
      if (!votesBase64) {
        console.log(`   ⚠️ Empty base64 for candidate ${candidateId}`);
        return 0;
      }

      console.log(`   Base64 votes: ${votesBase64}`);

      // Convertir base64 -> hex -> number
      // Utiliser atob au lieu de Buffer pour la compatibilité navigateur
      const binaryString = atob(votesBase64);
      const bytes: number[] = [];
      for (let i = 0; i < binaryString.length; i++) {
        bytes.push(binaryString.charCodeAt(i));
      }

      // Convertir les bytes en nombre (big-endian)
      let votes = 0;
      for (let i = 0; i < bytes.length; i++) {
        votes = votes * 256 + bytes[i];
      }

      console.log(`   ✅ Candidate ${candidateId} has ${votes} vote(s)`);
      return votes;
    } catch (err) {
      console.error(`❌ Error fetching votes for candidate ${candidateId}:`, err);
      return 0;
    }
  };

  return { getCandidateVotes };
};
