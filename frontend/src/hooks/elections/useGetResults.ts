import { resultsContract } from 'config';
// import resultsAbi from 'contracts/results.abi.json'; // À créer
import {
  AbiRegistry,
  Address,
  ProxyNetworkProvider,
  useGetNetworkConfig
} from 'lib';

export interface CandidateResult {
  id: number;
  name: string;
  votes: number;
  percentage: number;
}

export interface ElectionResults {
  electionId: number;
  totalVotes: number;
  candidates: CandidateResult[];
  status: 'Pending' | 'Finalized';
}

export const useGetResults = () => {
  const { network } = useGetNetworkConfig();

  const getResults = async (electionId: number): Promise<ElectionResults | null> => {
    try {
      // NOTE: Pour l'instant, cette fonction retourne null
      // car le smart contract results n'est pas encore déployé.
      // Une fois déployé, décommenter le code ci-dessous:

      /*
      const networkProvider = new ProxyNetworkProvider(network.apiAddress);
      const abi = AbiRegistry.create(resultsAbi);
      const controller = new SmartContractController(abi);

      const interaction = controller.createInteraction({
        caller: Address.Zero(),
        contract: new Address(resultsContract),
        function: 'getResults',
        args: [electionId]
      });

      const query = interaction.buildQuery();
      const response = await networkProvider.queryContract(query);
      const result = interaction.interpretQueryResponse(response);

      if (!result || !result[0]) {
        return null;
      }

      const resultsData = result[0].valueOf();

      // Calculer le total des votes
      const totalVotes = resultsData.candidates.reduce(
        (sum: number, candidate: any) => sum + candidate.votes.toNumber(),
        0
      );

      // Calculer les pourcentages
      const candidates = resultsData.candidates.map((candidate: any) => {
        const votes = candidate.votes.toNumber();
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

        return {
          id: candidate.id.toNumber(),
          name: candidate.name.toString(),
          votes,
          percentage
        };
      });

      return {
        electionId: resultsData.election_id.toNumber(),
        totalVotes,
        candidates,
        status: resultsData.status.name
      };
      */

      console.log('getResults called for election:', electionId);
      console.log('Smart contract results not deployed yet, returning null');
      return null;
    } catch (err) {
      console.error('Unable to fetch results:', err);
      return null;
    }
  };

  return { getResults };
};
