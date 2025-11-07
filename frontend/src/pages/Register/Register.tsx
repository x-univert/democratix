import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useRegisterWithCode } from 'hooks/transactions';
import { useGetElection, useIsVoterRegistered, useElectionMetadata, type Election } from 'hooks/elections';
import { TransactionProgressModal } from 'components';
import { useGetAccount, useGetNetworkConfig } from 'lib';

export const Register = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();

  const electionId = id ? parseInt(id, 10) : null;
  const token = searchParams.get('token');

  console.log('🔍 Register Page - URL params:', { id, electionId, token: token?.substring(0, 10) + '...' });
  console.log('📱 QR Code Registration - Using invitation code from QR');

  // Hooks
  const { getElection } = useGetElection();
  const { isVoterRegistered } = useIsVoterRegistered();
  const { registerWithCode } = useRegisterWithCode();

  // Charger les métadonnées depuis IPFS (titre, description, etc.)
  const { metadata: electionMetadata, loading: metadataLoading } = useElectionMetadata(election?.description_ipfs || null);

  // Local state
  const [election, setElection] = useState<Election | null>(null);
  const [electionLoading, setElectionLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [error, setError] = useState<string>();

  // Refs pour éviter les re-exécutions multiples
  const hasLoadedElection = useRef(false);
  const hasCheckedRegistration = useRef(false);
  const lastElectionId = useRef<number | null>(null);
  const lastAddress = useRef<string>('');

  // Charger l'élection (une seule fois par electionId)
  useEffect(() => {
    if (!electionId || (hasLoadedElection.current && lastElectionId.current === electionId)) {
      if (!electionId) setElectionLoading(false);
      return;
    }

    const loadElection = async () => {
      console.log('🔍 Register Page - Loading election:', electionId);
      setElectionLoading(true);
      hasLoadedElection.current = true;
      lastElectionId.current = electionId;

      try {
        const electionData = await getElection(electionId);
        console.log('🔍 Register Page - Election loaded:', electionData);
        setElection(electionData);
      } catch (err) {
        console.error('❌ Register Page - Error loading election:', err);
        setElection(null);
      } finally {
        setElectionLoading(false);
      }
    };

    loadElection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  // Vérifier l'inscription de l'utilisateur (une seule fois par combinaison electionId/address)
  useEffect(() => {
    const key = `${electionId}-${address}`;
    const lastKey = `${lastElectionId.current}-${lastAddress.current}`;

    if (!electionId || !address || (hasCheckedRegistration.current && key === lastKey)) {
      if (!electionId || !address) {
        setIsRegistered(false);
        setRegistrationLoading(false);
      }
      return;
    }

    const checkRegistration = async () => {
      console.log('🔍 Register Page - Checking registration:', { electionId, address: address.substring(0, 10) });
      setRegistrationLoading(true);
      hasCheckedRegistration.current = true;
      lastAddress.current = address;

      try {
        const registered = await isVoterRegistered(electionId, address);
        console.log('🔍 Register Page - Is registered:', registered);
        setIsRegistered(registered);
      } catch (err) {
        console.error('❌ Register Page - Error checking registration:', err);
        setIsRegistered(false);
      } finally {
        setRegistrationLoading(false);
      }
    };

    checkRegistration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, address]);

  // Vérification initiale
  useEffect(() => {
    console.log('🔍 Register Page - Validation:', { electionId, tokenLength: token?.length });
    if (!electionId || !token) {
      console.log('❌ Register Page - Invalid link: missing electionId or token');
      setError(t('register.invalidLink', 'Lien d\'inscription invalide'));
    } else if (token.length !== 64) {
      console.log('❌ Register Page - Invalid token length:', token.length);
      setError(t('register.invalidToken', 'Code d\'invitation invalide'));
    } else {
      console.log('✅ Register Page - Valid invitation code');
      setError(undefined);
    }
  }, [electionId, token, t]);

  // Rediriger si déjà inscrit
  useEffect(() => {
    if (isRegistered && !registrationLoading) {
      console.log('🔍 Register Page - Already registered, redirecting...');
      navigate(RouteNamesEnum.electionDetail.replace(':id', String(electionId)));
    }
  }, [isRegistered, registrationLoading, navigate, electionId]);

  const handleRegister = async () => {
    if (!electionId || !token || !address) {
      return;
    }

    try {
      setIsRegistering(true);
      setError(undefined);

      console.log('📱 QR Code Registration - Starting registration for election:', electionId);
      console.log('📱 QR Code Registration - Using invitation code:', token);

      const sessionId = await registerWithCode(electionId, token);

      if (sessionId) {
        console.log('✅ QR Code Registration - Transaction sent! Session:', sessionId);
        setIsRegistering(false);

        // Attendre un peu pour que la transaction soit indexée
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Récupérer le hash de transaction depuis l'API
        try {
          console.log('🔍 Fetching transaction hash from API...');
          const response = await fetch(
            `${network.apiAddress}/accounts/${address}/transactions?size=5&order=desc`
          );
          const transactions = await response.json();

          console.log('📡 Recent transactions:', transactions);

          // Trouver la transaction registerWithInvitationCode la plus récente
          const registrationTx = transactions.find((tx: any) =>
            tx.function === 'registerWithInvitationCode' &&
            tx.sender === address
          );

          if (registrationTx && registrationTx.txHash) {
            console.log('✅ Transaction hash found:', registrationTx.txHash);
            setTransactionHash(registrationTx.txHash);
            setShowTransactionModal(true);
          } else {
            console.warn('⚠️ Transaction hash not found, redirecting anyway');
            setTimeout(() => {
              navigate(RouteNamesEnum.electionDetail.replace(':id', String(electionId)));
            }, 2000);
          }
        } catch (fetchErr) {
          console.error('❌ Error fetching transaction hash:', fetchErr);
          // Redirection de secours
          setTimeout(() => {
            navigate(RouteNamesEnum.electionDetail.replace(':id', String(electionId)));
          }, 2000);
        }
      }
    } catch (err) {
      console.error('❌ QR Code Registration error:', err);
      setError(t('register.registrationError', 'Erreur lors de l\'inscription. Le code est peut-être invalide ou déjà utilisé.'));
      setIsRegistering(false);
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionModal(false);
    navigate(RouteNamesEnum.electionDetail.replace(':id', String(electionId)));
  };

  const handleTransactionClose = () => {
    setShowTransactionModal(false);
    navigate(RouteNamesEnum.electionDetail.replace(':id', String(electionId)));
  };

  if (electionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-primary">{t('register.loading', 'Chargement...')}</p>
        </div>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-secondary border-2 border-error rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-error mb-4">
            {t('register.errorTitle', 'Erreur')}
          </h1>
          <p className="text-primary mb-6">
            {error || t('register.electionNotFound', 'Élection non trouvée')}
          </p>

          <button
            onClick={() => navigate(RouteNamesEnum.elections)}
            className="bg-accent text-primary px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold"
          >
            {t('register.backToElections', 'Retour aux élections')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-secondary border-2 border-accent rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('register.title', 'Inscription via QR Code')}
          </h1>
          <p className="text-secondary">
            {t('register.subtitle', 'Vous avez scanné un QR code d\'inscription')}
          </p>
        </div>

        {/* Election Info */}
        <div className="bg-tertiary rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            🗳️ {t('register.electionInfo', 'Information sur l\'élection')}
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-black text-sm">{t('register.electionName', 'Nom')} :</span>
              <p className="text-black font-semibold">
                {metadataLoading ? (
                  <span className="animate-pulse">Chargement...</span>
                ) : (
                  electionMetadata?.title || election.title || 'Sans titre'
                )}
              </p>
            </div>
            <div>
              <span className="text-black text-sm">{t('register.electionDescription', 'Description')} :</span>
              <p className="text-black">
                {metadataLoading ? (
                  <span className="animate-pulse">Chargement...</span>
                ) : (
                  electionMetadata?.description || 'Aucune description'
                )}
              </p>
            </div>
            <div>
              <span className="text-black text-sm">{t('register.electionId', 'ID')} :</span>
              <p className="text-black font-mono">#{election.id}</p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        {!address ? (
          <div className="bg-primary rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-primary mb-3">
              {t('register.connectWallet', 'Connectez votre wallet')}
            </h3>
            <p className="text-secondary mb-6">
              {t('register.connectWalletDescription', 'Vous devez connecter votre wallet MultiversX pour vous inscrire à cette élection.')}
            </p>
            <button
              onClick={() => {
                // Sauvegarder l'URL actuelle pour y revenir après connexion
                const currentUrl = window.location.pathname + window.location.search;
                sessionStorage.setItem('returnUrl', currentUrl);
                navigate(RouteNamesEnum.unlock);
              }}
              className="bg-accent text-primary px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold text-lg"
            >
              {t('register.connectButton', 'Connecter mon wallet')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-primary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔑</span>
                <span className="text-black text-sm font-semibold">
                  {t('register.tokenLabel', 'Token d\'inscription')}
                </span>
              </div>
              <p className="text-xs font-mono text-black break-all bg-tertiary p-2 rounded">
                {token}
              </p>
            </div>

            {/* Wallet Info */}
            <div className="bg-primary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👛</span>
                <span className="text-black text-sm font-semibold">
                  {t('register.walletLabel', 'Votre wallet')}
                </span>
              </div>
              <p className="text-xs font-mono text-black break-all bg-tertiary p-2 rounded">
                {address}
              </p>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full bg-accent text-primary px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  {t('register.registering', 'Inscription en cours...')}
                </>
              ) : (
                <>
                  <span>🎫</span>
                  {t('register.registerButton', 'S\'inscrire à cette élection')}
                </>
              )}
            </button>

            {/* Info */}
            <div className="text-center text-sm text-secondary">
              <p>💡 {t('register.hint', 'Vous devrez signer la transaction avec votre wallet')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Progress Modal */}
      <TransactionProgressModal
        isOpen={showTransactionModal}
        transactionHash={transactionHash}
        title={t('register.registrationInProgress', 'Inscription en cours')}
        onClose={handleTransactionClose}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};
