import { useState, useEffect } from 'react';
import { useGetNetworkConfig } from 'lib';

interface TransactionResult {
  isCompleted: boolean;
  isSuccess: boolean;
  returnData: string[];
  error?: string;
}

/**
 * Hook pour surveiller une transaction et récupérer ses résultats
 */
export const useTransactionWatcher = (txHash: string | null) => {
  const [result, setResult] = useState<TransactionResult>({
    isCompleted: false,
    isSuccess: false,
    returnData: []
  });
  const [loading, setLoading] = useState(false);
  const { network } = useGetNetworkConfig();

  useEffect(() => {
    if (!txHash) {
      setResult({ isCompleted: false, isSuccess: false, returnData: [] });
      setLoading(false);
      return;
    }

    let isCancelled = false;
    let pollInterval: NodeJS.Timeout;

    const fetchTransactionStatus = async () => {
      try {
        // Récupérer d'abord le statut de la transaction
        const url = `${network.apiAddress}/transactions/${txHash}`;
        console.log('🌐 Fetching transaction with URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('🌐 Response received, status:', response.status);

        if (isCancelled) return;

        // Vérifier si la transaction est complétée
        if (data.status === 'success' || data.status === 'fail' || data.status === 'invalid') {
          console.log('📡 Transaction complétée:', data.status);
          console.log('📦 TOUTES les données de la transaction:', JSON.stringify(data, null, 2));

          let returnData: any[] = [];

          // Si la transaction est réussie, chercher les Smart Contract Results
          if (data.status === 'success') {
            console.log('📦 Recherche des Smart Contract Results...');

            // 1. Chercher d'abord dans data.results (priorité pour les gros volumes)
            if (data.results && Array.isArray(data.results) && data.results.length > 0) {
              console.log('📦 Recherche dans data.results:', data.results);

              // Trouver le résultat avec les codes (celui qui a @ok@...)
              const scResults = data.results.filter((r: any) =>
                r.data && (r.data.startsWith('@ok@') || r.data.startsWith('QDZm'))
              );

              if (scResults.length > 0 && scResults[0].data) {
                const resultData = scResults[0].data;
                console.log('📦 Result data brut:', resultData);

                try {
                  // Décoder le base64 - les codes sont en format hex-string ASCII
                  const decoded = atob(resultData);
                  console.log('📦 Data décodé (ASCII):', decoded);

                  // Les codes sont encodés comme "@ok@code1@code2@code3..."
                  // où chaque code est déjà une hex-string ASCII
                  const parts = decoded.split('@').filter(p => p && p !== 'ok' && p.length >= 64);
                  console.log('📦 Codes extraits du data.results:', parts);

                  if (parts.length > 0) {
                    // Les codes sont déjà en format hex-string ASCII
                    returnData.push(...parts);
                  }
                } catch (err) {
                  console.error('❌ Erreur lors du parsing du data.results:', err);
                }
              }
            }

            // 2. Si rien trouvé, chercher dans les logs de la transaction
            if (returnData.length === 0 && data.logs && data.logs.events) {
              console.log('📦 Logs trouvés:', data.logs.events);

              // Chercher l'événement writeLog qui contient les codes
              const writeLogEvents = data.logs.events.filter((e: any) => e.identifier === 'writeLog');
              if (writeLogEvents.length > 0) {
                console.log('📦 writeLog events trouvés:', writeLogEvents);

                writeLogEvents.forEach((event: any) => {
                  // Extraire depuis le champ data
                  if (event.data) {
                    console.log('📦 Traitement du champ data:', event.data);
                    try {
                      const decoded = atob(event.data);
                      console.log('📦 Data décodé (ASCII):', decoded);

                      // Le decoded est déjà une string avec "@6f6b@code1@code2..."
                      // On ne doit PAS le re-convertir en hex!
                      const parts = decoded.split('@').filter(p => p && p !== '6f6b' && p.length >= 64);
                      console.log('📦 Codes extraits du event.data:', parts);
                      if (parts.length > 0) {
                        // Les codes sont déjà en format hex-string
                        returnData.push(...parts);
                      }
                    } catch (err) {
                      console.error('❌ Erreur lors du parsing du event.data:', err);
                    }
                  }

                  // Fallback: extraire les topics (déjà en base64 dans les topics)
                  if (returnData.length === 0 && event.topics && event.topics.length > 0) {
                    // Les topics sont en base64, il faut les convertir en hex
                    try {
                      const topicBase64 = event.topics[0];
                      const decoded = atob(topicBase64);
                      let hex = '';
                      for (let i = 0; i < decoded.length; i++) {
                        hex += decoded.charCodeAt(i).toString(16).padStart(2, '0');
                      }
                      console.log('📦 Code extrait du topic (hex):', hex);
                      returnData.push(hex);
                    } catch (err) {
                      console.error('❌ Erreur lors de la conversion du topic:', err);
                      // En cas d'erreur, garder le format base64 original
                      returnData.push(event.topics[0]);
                    }
                  }
                });
              }
            }
          }

          console.log('📦 returnData final extrait:', returnData);

          setResult({
            isCompleted: true,
            isSuccess: data.status === 'success',
            returnData: returnData,
            error: data.status !== 'success' ? data.status : undefined
          });
          setLoading(false);

          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la transaction:', err);
        if (!isCancelled) {
          setResult({
            isCompleted: true,
            isSuccess: false,
            returnData: [],
            error: 'Erreur de récupération'
          });
          setLoading(false);
        }
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    // Démarrer la surveillance
    setLoading(true);
    fetchTransactionStatus(); // Premier appel immédiat

    // Puis polling toutes les 2 secondes
    pollInterval = setInterval(fetchTransactionStatus, 2000);

    // Timeout après 2 minutes
    const timeout = setTimeout(() => {
      if (!isCancelled && loading) {
        console.warn('⏱️ Timeout de surveillance de transaction');
        setResult({
          isCompleted: true,
          isSuccess: false,
          returnData: [],
          error: 'Timeout'
        });
        setLoading(false);
        clearInterval(pollInterval);
      }
    }, 120000); // 2 minutes

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (timeout) clearTimeout(timeout);
    };
  }, [txHash, network.apiAddress]);

  return { result, loading };
};
