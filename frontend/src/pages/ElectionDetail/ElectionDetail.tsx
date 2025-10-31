import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { votingContract } from 'config';
import { useGetElection, type Election, useElectionMetadata, useIPFSImage, useCandidateMetadata } from '../../hooks/elections';
import { useGetCandidates, type Candidate } from '../../hooks/elections/useGetCandidates';
import { useGetCandidateVotes } from '../../hooks/elections/useGetCandidateVotes';
import { useGetRegisteredVoters } from '../../hooks/elections/useGetRegisteredVoters';
import { useActivateElection } from '../../hooks/transactions/useActivateElection';
import { useCloseElection } from '../../hooks/transactions/useCloseElection';
import { useFinalizeElection } from '../../hooks/transactions/useFinalizeElection';
import { useRegisterToVote } from '../../hooks/transactions/useRegisterToVote';
import { useAddToWhitelist } from '../../hooks/transactions/useAddToWhitelist';
import { useGenerateInvitationCodes } from '../../hooks/transactions/useGenerateInvitationCodes';
import { useRegisterWithCode } from '../../hooks/transactions/useRegisterWithCode';
import { useIsVoterRegistered } from '../../hooks/elections/useIsVoterRegistered';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';
import { RouteNamesEnum } from '../../localConstants';
import { SkeletonDetail } from '../../components/Skeleton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ConfirmModal, InvitationCodesModal, TransactionSentModal } from '../../components';

interface CandidateWithVotes extends Candidate {
  votes: number;
  percentage: number;
}

// Composant pour afficher un candidat avec image et biographie IPFS
const CandidateListItem = ({ candidate }: { candidate: Candidate }) => {
  const { metadata } = useCandidateMetadata(candidate.description_ipfs);
  const imageUrl = useIPFSImage(metadata?.image);

  return (
    <div className="bg-primary border-2 border-secondary vibe-border rounded-lg overflow-hidden hover:shadow-md transition-all hover:translate-x-1">
      <div className="flex flex-col sm:flex-row">
        {/* Image du candidat */}
        {imageUrl && (
          <div className="w-full sm:w-32 h-32 bg-tertiary flex-shrink-0">
            <img
              src={imageUrl}
              alt={candidate.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Informations */}
        <div className="p-4 flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-primary">
              {metadata?.name || candidate.name}
            </h3>
            {metadata?.metadata?.party && (
              <span className="px-2 py-0.5 bg-accent bg-opacity-20 text-accent rounded-full text-xs font-semibold">
                {metadata.metadata.party}
              </span>
            )}
          </div>

          {/* Biographie courte */}
          {metadata?.biography && (
            <p className="text-sm text-secondary line-clamp-2 mb-2">
              {metadata.biography}
            </p>
          )}

          {/* Liens */}
          {(metadata?.links?.website || metadata?.links?.twitter) && (
            <div className="flex flex-wrap gap-2">
              {metadata.links.website && (
                <a
                  href={metadata.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-link"
                >
                  🌐 Site
                </a>
              )}
              {metadata.links.twitter && (
                <a
                  href={`https://twitter.com/${metadata.links.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-link"
                >
                  𝕏 {metadata.links.twitter}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ElectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { getElection } = useGetElection();
  const { getCandidates } = useGetCandidates();
  const { getCandidateVotes } = useGetCandidateVotes();
  const { activateElection } = useActivateElection();
  const { closeElection } = useCloseElection();
  const { finalizeElection } = useFinalizeElection();
  const { registerToVote } = useRegisterToVote();
  const { isVoterRegistered } = useIsVoterRegistered();
  const { addToWhitelist } = useAddToWhitelist();
  const { generateCodes } = useGenerateInvitationCodes();
  const { registerWithCode } = useRegisterWithCode();

  // Fetch registered voters for export functionality
  const { voters: registeredVoters, loading: loadingVoters } = useGetRegisteredVoters(
    id ? parseInt(id) : 0
  );

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesWithVotes, setCandidatesWithVotes] = useState<CandidateWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // Whitelist management
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [showWhitelistSection, setShowWhitelistSection] = useState(false);

  // Invitation codes
  const [invitationCodeCount, setInvitationCodeCount] = useState('1');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showInvitationSection, setShowInvitationSection] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [showTxSentModal, setShowTxSentModal] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  // Registration with code
  const [invitationCode, setInvitationCode] = useState('');

  // Export voters
  const [showExportSection, setShowExportSection] = useState(false);

  // Watch transaction for invitation codes generation
  const { result: txResult, loading: txLoading } = useTransactionWatcher(pendingTxHash);

  // Récupérer les métadonnées IPFS de l'élection
  const { metadata: electionMetadata, loading: metadataLoading } = useElectionMetadata(election?.description_ipfs);
  const electionImageUrl = useIPFSImage(electionMetadata?.image);

  useEffect(() => {
    const fetchElectionAndCandidates = async () => {
      if (!id) {
        setError('ID d\'élection manquant');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getElection(parseInt(id));
        if (!data) {
          setError(t('electionDetail.errors.notFound'));
        } else {
          setElection(data);
          const candidatesData = await getCandidates(parseInt(id));
          setCandidates(candidatesData);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'élection:', err);
        setError(t('electionDetail.errors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchElectionAndCandidates();
  }, [id]);

  // Fetch votes for closed or finalized elections
  useEffect(() => {
    const fetchVotes = async () => {
      if (!election || candidates.length === 0) return;

      const now = Date.now() / 1000;
      const isClosedByTime = election.end_time < now;
      const isClosedByStatus = election.status === 'Closed' || election.status === 'Finalized';
      const canShowResults = isClosedByStatus || isClosedByTime;

      if (!canShowResults) return;

      setLoadingResults(true);
      try {
        const votesPromises = candidates.map(async (candidate) => {
          const votes = await getCandidateVotes(election.id, candidate.id);
          return { ...candidate, votes, percentage: 0 };
        });

        const results = await Promise.all(votesPromises);
        const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);
        const withPercentages = results.map(c => ({
          ...c,
          percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
        }));

        withPercentages.sort((a, b) => b.votes - a.votes);
        setCandidatesWithVotes(withPercentages);
      } catch (err) {
        console.error('Erreur lors du chargement des résultats:', err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchVotes();
  }, [election, candidates]);

  // Check voter registration status
  useEffect(() => {
    const checkRegistration = async () => {
      if (!election || !address || !election.requires_registration) {
        setIsRegistered(false);
        return;
      }

      setCheckingRegistration(true);
      try {
        const registered = await isVoterRegistered(election.id, address);
        setIsRegistered(registered);
      } catch (err) {
        console.error('Error checking registration:', err);
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [election, address]);

  // Watch for transaction completion and extract invitation codes
  useEffect(() => {
    console.log('🔍 useEffect txResult:', {
      isCompleted: txResult.isCompleted,
      isSuccess: txResult.isSuccess,
      returnDataLength: txResult.returnData.length,
      returnData: txResult.returnData
    });

    if (txResult.isCompleted && txResult.isSuccess && txResult.returnData.length > 0) {
      console.log('🎟️ Transaction complétée, extraction des codes...');
      console.log('📦 Données retournées:', txResult.returnData);

      try {
        // Le smart contract retourne un MultiValueEncoded
        // Le hook useTransactionWatcher a déjà extrait et décodé les codes
        // returnData contient directement les codes en format hex-string
        const codesHex: string[] = [];

        for (const code of txResult.returnData) {
          const codeString = typeof code === 'string' ? code : '';

          if (!codeString) continue;

          // Les codes sont déjà en format hex-string, on les garde tels quels
          if (codeString.length >= 64) {
            codesHex.push(codeString.toLowerCase());
          }
        }

        console.log(`✅ ${codesHex.length} codes extraits avec succès`);
        if (codesHex.length > 0) {
          console.log('📋 Premier code:', codesHex[0]);
        }

        setGeneratedCodes(codesHex);
        setShowTxSentModal(false); // Fermer la modale de chargement
        setShowCodesModal(true); // Ouvrir la modale avec les codes
        setPendingTxHash(null); // Reset
      } catch (err) {
        console.error('Erreur lors de l\'extraction des codes:', err);
        setShowTxSentModal(false); // Fermer la modale de chargement
        alert('Les codes ont été générés mais impossible de les extraire automatiquement. Consultez la transaction dans l\'explorer.');
        setPendingTxHash(null);
      }
    } else if (txResult.isCompleted && !txResult.isSuccess) {
      console.error('❌ Transaction échouée:', txResult.error);
      setShowTxSentModal(false); // Fermer la modale de chargement
      alert(`Échec de la génération des codes: ${txResult.error || 'Erreur inconnue'}`);
      setPendingTxHash(null);
    }
  }, [txResult]);

  const handleRegister = async () => {
    if (!election || !id) return;

    try {
      await registerToVote(parseInt(id));
      // Refresh registration status after successful registration
      const registered = await isVoterRegistered(election.id, address);
      setIsRegistered(registered);
    } catch (err) {
      console.error('Error registering to vote:', err);
    }
  };

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !election) {
    return (
      <ErrorMessage
        type="notFound"
        title={error || t('electionDetail.errors.notFound')}
        message={t('electionDetail.errors.notFoundDescription')}
        showBackButton
        backLabel={t('electionDetail.backToElections')}
        onBack={() => navigate(RouteNamesEnum.elections)}
      />
    );
  }

  const now = Date.now() / 1000;
  const isUpcoming = election.start_time > now;
  // Utiliser directement le statut blockchain
  const isActive = election.status === 'Active';
  const isClosed = election.status === 'Closed';
  const isFinalized = election.status === 'Finalized';
  const isPending = election.status === 'Pending';

  // Pour les actions de l'organisateur, vérifier aussi les dates
  const canActivate = isPending && election.start_time <= now && election.end_time > now;
  const shouldClose = (isActive || isPending) && election.end_time < now;
  const canAddCandidates = isPending && election.end_time > now;

  const isOrganizer = address && election.organizer &&
    address.toLowerCase() === election.organizer.toLowerCase();

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  const getBadge = () => {
    if (isFinalized) return { text: t('electionCard.status.finalized'), bgClass: 'bg-accent', textClass: 'text-primary' };
    if (isClosed) return { text: t('electionCard.status.closed'), bgClass: 'bg-tertiary', textClass: 'text-secondary' };
    if (isActive) return { text: t('electionCard.status.active'), bgClass: 'bg-success', textClass: 'text-white' };
    if (isUpcoming) return { text: t('electionCard.status.upcoming'), bgClass: 'bg-btn-primary', textClass: 'text-btn-primary' };
    return { text: t('electionCard.status.pending'), bgClass: 'bg-warning', textClass: 'text-white' };
  };

  const badge = getBadge();

  const handleAddCandidate = () => {
    navigate(RouteNamesEnum.addCandidate.replace(':electionId', election.id.toString()));
  };

  const handleActivate = () => {
    setShowActivateModal(true);
  };

  const handleConfirmActivate = async () => {
    if (!election) return;
    setShowActivateModal(false);
    try {
      await activateElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
    }
  };

  const handleVote = () => {
    // Vérifier si l'inscription est requise et si l'utilisateur est inscrit
    if (election?.requires_registration && !isRegistered) {
      alert(t('electionDetail.errors.mustRegister') || 'Vous devez vous inscrire avant de pouvoir voter à cette élection.');
      return;
    }
    navigate(RouteNamesEnum.vote.replace(':id', election.id.toString()));
  };

  const handleClose = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = async () => {
    if (!election) return;
    setShowCloseModal(false);
    try {
      await closeElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de la fermeture:', err);
      alert(t('electionDetail.errors.closeError'));
    }
  };

  const handleFinalize = () => {
    setShowFinalizeModal(true);
  };

  const handleConfirmFinalize = async () => {
    if (!election) return;
    setShowFinalizeModal(false);
    try {
      await finalizeElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de la finalisation:', err);
      alert(t('electionDetail.errors.finalizeError'));
    }
  };

  // Whitelist handlers
  const handleAddToWhitelist = async () => {
    if (!election || !whitelistAddresses.trim()) return;

    try {
      // Parse addresses (comma or newline separated)
      const addresses = whitelistAddresses
        .split(/[,\n]/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (addresses.length === 0) {
        alert(t('electionDetail.whitelist.noAddresses') || 'Aucune adresse valide trouvée');
        return;
      }

      await addToWhitelist(election.id, addresses);
      setWhitelistAddresses('');
      alert(t('electionDetail.whitelist.success') || `${addresses.length} adresse(s) ajoutée(s) avec succès`);
    } catch (err) {
      console.error('Erreur lors de l\'ajout à la liste blanche:', err);
      alert(t('electionDetail.whitelist.error') || 'Erreur lors de l\'ajout à la liste blanche');
    }
  };

  // Invitation codes handlers
  const handleGenerateCodes = async () => {
    if (!election) return;

    const count = parseInt(invitationCodeCount);
    if (isNaN(count) || count < 1 || count > 1000) {
      alert(t('electionDetail.invitationCodes.invalidCount') || 'Nombre invalide (1-1000)');
      return;
    }

    try {
      const sessionId = await generateCodes(election.id, count);
      console.log('✅ Transaction envoyée. Session ID:', sessionId);

      // Afficher la belle modale de confirmation
      setShowTxSentModal(true);

      // Attendre un peu pour que la transaction soit indexée
      setTimeout(async () => {
        try {
          // Récupérer les transactions récentes de l'utilisateur (sans filtre status pour inclure pending)
          const response = await fetch(
            `${network.apiAddress}/accounts/${address}/transactions?size=10`
          );
          const transactions = await response.json();

          console.log('🔍 Recherche de transaction parmi:', transactions);
          console.log('🔍 Fonction recherchée: generateInvitationCodes');
          console.log('🔍 Contrat cible:', votingContract);

          // Trouver la transaction de génération de codes (la plus récente avec la fonction generateInvitationCodes)
          const targetTx = transactions.find((tx: any) =>
            tx.function === 'generateInvitationCodes' &&
            tx.receiver === votingContract
          );

          console.log('🔍 Transaction trouvée:', targetTx);

          if (targetTx && targetTx.txHash) {
            console.log('📡 Transaction trouvée:', targetTx.txHash);
            console.log('📡 Définition de pendingTxHash:', targetTx.txHash);
            setPendingTxHash(targetTx.txHash);
            console.log('📡 pendingTxHash défini, le watcher devrait démarrer');
            // Ne PAS fermer la modale ici - elle se fermera quand les codes seront extraits
          } else {
            console.warn('⚠️ Transaction non trouvée, récupération manuelle nécessaire');
            console.warn('⚠️ Transactions reçues:', transactions);
            setShowTxSentModal(false);
            alert(
              'Les codes ont été générés avec succès mais la récupération automatique a échoué.\n\n' +
              'Consultez votre transaction dans l\'explorer MultiversX pour voir les codes.'
            );
          }
        } catch (err) {
          console.error('Erreur lors de la recherche de la transaction:', err);
          setShowTxSentModal(false);
          alert('Récupération automatique échouée. Consultez l\'explorer pour voir vos codes.');
        }
      }, 8000); // Attendre 8 secondes pour l'indexation

    } catch (err) {
      console.error('Erreur lors de la génération des codes:', err);
      alert(t('electionDetail.invitationCodes.error') || 'Erreur lors de la génération des codes');
    }
  };

  // Register with code handler
  const handleRegisterWithInvitationCode = async () => {
    if (!election || !invitationCode.trim()) return;

    try {
      await registerWithCode(election.id, invitationCode);
      setInvitationCode('');
      // Refresh registration status
      const registered = await isVoterRegistered(election.id, address);
      setIsRegistered(registered);
      alert(t('electionDetail.invitationCodes.registerSuccess') || 'Inscription réussie avec le code d\'invitation');
    } catch (err) {
      console.error('Erreur lors de l\'inscription avec code:', err);
      alert(t('electionDetail.invitationCodes.registerError') || 'Erreur lors de l\'inscription avec le code');
    }
  };

  // Export voters handlers
  const handleExportVotersCSV = async () => {
    if (!election || !registeredVoters) return;

    try {
      // Create CSV content
      const csvContent = [
        'Address',
        ...registeredVoters
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `election_${election.id}_voters.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de l\'export CSV:', err);
      alert(t('electionDetail.export.error') || 'Erreur lors de l\'export');
    }
  };

  const handleExportVotersJSON = async () => {
    if (!election || !registeredVoters) return;

    try {
      // Create JSON content
      const jsonContent = JSON.stringify({
        election_id: election.id,
        election_title: election.title,
        total_registered: registeredVoters.length,
        exported_at: new Date().toISOString(),
        voters: registeredVoters
      }, null, 2);

      // Download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `election_${election.id}_voters.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de l\'export JSON:', err);
      alert(t('electionDetail.export.error') || 'Erreur lors de l\'export');
    }
  };

  const timeRemaining = () => {
    if (isActive) {
      const remaining = election.end_time - now;
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);

      if (days > 0) return `${days} ${days > 1 ? t('electionDetail.time.days') : t('electionDetail.time.day')} ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}min`;
      return `${minutes} ${minutes > 1 ? t('electionDetail.time.minutes') : t('electionDetail.time.minute')}`;
    }
    if (isUpcoming) {
      const remaining = election.start_time - now;
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);

      if (days > 0) return t('electionDetail.time.startsIn', { days, unit: days > 1 ? t('electionDetail.time.days') : t('electionDetail.time.day') });
      return t('electionDetail.time.startsInHours', { hours });
    }
    return null;
  };

  const progressPercent = isActive
    ? Math.min(100, ((now - election.start_time) / (election.end_time - election.start_time)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => navigate(RouteNamesEnum.elections)}
        className="mb-6 px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all hover:-translate-x-1 font-semibold"
      >
        ← {t('electionDetail.backToElections')}
      </button>

      {/* Header */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <h1 className="text-4xl font-bold text-primary flex-1">{election.title}</h1>
          <div className={`${badge.bgClass} ${badge.textClass} px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-md`}>
            {badge.text}
          </div>
        </div>

        {isOrganizer && (
          <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg px-4 py-2 inline-block">
            <span className="text-accent font-semibold">{t('electionDetail.youAreOrganizer')}</span>
          </div>
        )}
      </div>

      {/* Time remaining banner */}
      {(isActive || isUpcoming) && (
        <div className={`${isActive ? 'bg-success' : 'bg-accent'} bg-opacity-10 border-2 ${isActive ? 'border-success' : 'border-accent'} rounded-xl p-6 mb-6 shadow-lg`}>
          <div className="flex items-center gap-4 mb-4">
            <svg className={`w-10 h-10 ${isActive ? 'text-success' : 'text-accent'} animate-pulse`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-bold text-primary uppercase tracking-wide mb-1">
                {isActive ? `⏰ ${t('electionDetail.time.timeRemaining')}` : `🗓️ ${t('electionDetail.time.electionStart')}`}
              </div>
              <span className="text-2xl font-bold text-primary">{timeRemaining()}</span>
            </div>
          </div>
          {isActive && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-primary font-bold">{t('electionDetail.progress')}</span>
                <span className="text-primary font-bold text-lg">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-3 bg-secondary border-2 border-secondary vibe-border rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-success to-accent transition-all duration-500 shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-primary font-semibold pt-1">
                <span>{t('electionDetail.start')}: {formatDateTime(election.start_time)}</span>
                <span>{t('electionDetail.end')}: {formatDateTime(election.end_time)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image de l'élection */}
          {electionImageUrl && (
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl overflow-hidden shadow-md">
              <img
                src={electionImageUrl}
                alt={election.title}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  // En cas d'erreur de chargement, on cache l'image
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.description')}</h2>
            {metadataLoading ? (
              <div className="flex items-center gap-2 text-secondary">
                <div className="w-5 h-5 border-2 border-secondary border-t-accent rounded-full animate-spin"></div>
                {t('electionDetail.loadingMetadata')}
              </div>
            ) : electionMetadata?.description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-primary whitespace-pre-wrap">{electionMetadata.description}</p>
                {electionMetadata.metadata?.category && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-sm font-semibold">
                      {electionMetadata.metadata.category === 'presidential' && `🏛️ ${t('createElection.form.categories.presidential')}`}
                      {electionMetadata.metadata.category === 'legislative' && `📜 ${t('createElection.form.categories.legislative')}`}
                      {electionMetadata.metadata.category === 'local' && `🏘️ ${t('createElection.form.categories.local')}`}
                      {electionMetadata.metadata.category === 'referendum' && `🗳️ ${t('createElection.form.categories.referendum')}`}
                      {electionMetadata.metadata.category === 'association' && `🤝 ${t('createElection.form.categories.association')}`}
                      {electionMetadata.metadata.category === 'other' && `📋 ${t('createElection.form.categories.other')}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-secondary italic">{t('electionDetail.noDescription')}</p>
            )}
          </div>

          {/* Candidates section */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">
                {t('electionDetail.candidates')} ({candidates.length})
              </h2>
              {isOrganizer && canAddCandidates && (
                <button
                  onClick={handleAddCandidate}
                  className="px-4 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
                >
                  + {t('electionDetail.addButton')}
                </button>
              )}
            </div>

            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary mb-4">{t('electionDetail.noCandidates')}</p>
                {isOrganizer && canAddCandidates && (
                  <button
                    onClick={handleAddCandidate}
                    className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
                  >
                    {t('electionDetail.addFirstCandidate')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <CandidateListItem key={`${election.id}-${candidate.id}-${index}`} candidate={candidate} />
                ))}
              </div>
            )}
          </div>

          {/* Organizer Management Sections */}
          {isOrganizer && election.requires_registration && (
            <div className="space-y-6">
              {/* Whitelist Management Section */}
              <div className="bg-secondary border-2 border-accent vibe-border rounded-xl p-6 shadow-md">
                <button
                  onClick={() => setShowWhitelistSection(!showWhitelistSection)}
                  className="w-full flex justify-between items-center mb-4"
                >
                  <h2 className="text-xl font-bold text-primary">
                    👥 {t('electionDetail.whitelist.title') || 'Liste Blanche d\'Adresses'}
                  </h2>
                  <span className="text-accent text-2xl">{showWhitelistSection ? '−' : '+'}</span>
                </button>

                {showWhitelistSection && (
                  <div className="space-y-4">
                    {/* KYC Process explanation */}
                    <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-4 space-y-2">
                      <p className="text-primary font-bold text-sm flex items-center gap-2">
                        🔐 {t('electionDetail.whitelist.kycTitle') || 'Inscription automatique après KYC'}
                      </p>
                      <p className="text-secondary text-xs leading-relaxed">
                        {t('electionDetail.whitelist.kycDescription') || 'Les adresses ajoutées à la liste blanche sont automatiquement inscrites. Utilisez cette méthode après avoir vérifié l\'identité de vos électeurs via votre processus KYC hors blockchain.'}
                      </p>
                      <div className="bg-primary bg-opacity-50 rounded p-2 mt-2">
                        <p className="text-xs text-secondary font-medium">
                          ✅ {t('electionDetail.whitelist.kycSteps') || 'Processus : 1) Électeur complète KYC 2) Électeur fournit son adresse MultiversX 3) Vous ajoutez l\'adresse ici 4) Inscription automatique confirmée'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">
                        {t('electionDetail.whitelist.addressesLabel') || 'Adresses vérifiées (une par ligne ou séparées par des virgules)'}
                      </label>
                      <textarea
                        value={whitelistAddresses}
                        onChange={(e) => setWhitelistAddresses(e.target.value)}
                        placeholder="erd1abc..., erd1def..."
                        rows={4}
                        className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                      />
                    </div>

                    <button
                      onClick={handleAddToWhitelist}
                      disabled={!whitelistAddresses.trim()}
                      className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('electionDetail.whitelist.addButton') || '✅ Inscrire automatiquement ces adresses'}
                    </button>

                    <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-3 text-xs text-secondary">
                      <p>💡 {t('electionDetail.whitelist.hint') || 'Importez un CSV avec les adresses vérifiées en copiant-collant le contenu ici.'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Invitation Codes Section */}
              <div className="bg-secondary border-2 border-accent vibe-border rounded-xl p-6 shadow-md">
                <button
                  onClick={() => setShowInvitationSection(!showInvitationSection)}
                  className="w-full flex justify-between items-center mb-4"
                >
                  <h2 className="text-xl font-bold text-primary">
                    🎫 {t('electionDetail.invitationCodes.title') || 'Codes d\'Invitation'}
                  </h2>
                  <span className="text-accent text-2xl">{showInvitationSection ? '−' : '+'}</span>
                </button>

                {showInvitationSection && (
                  <div className="space-y-4">
                    {/* KYC with invitation codes explanation */}
                    <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg p-4 space-y-2">
                      <p className="text-primary font-bold text-sm flex items-center gap-2">
                        🎫 {t('electionDetail.invitationCodes.kycTitle') || 'Alternative : Codes d\'invitation après KYC'}
                      </p>
                      <p className="text-secondary text-xs leading-relaxed">
                        {t('electionDetail.invitationCodes.kycDescription') || 'Générez des codes uniques à usage unique que vous distribuerez aux électeurs après leur vérification KYC. Chaque code permet une seule inscription.'}
                      </p>
                      <div className="bg-primary bg-opacity-50 rounded p-2 mt-2">
                        <p className="text-xs text-secondary font-medium">
                          🔄 {t('electionDetail.invitationCodes.kycFlow') || 'Flux : 1) Électeur complète KYC 2) Vous générez et envoyez un code 3) Électeur s\'inscrit avec le code 4) Code marqué comme utilisé'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">
                        {t('electionDetail.invitationCodes.countLabel') || 'Nombre de codes à générer'}
                      </label>
                      <input
                        type="number"
                        value={invitationCodeCount}
                        onChange={(e) => setInvitationCodeCount(e.target.value)}
                        min="1"
                        max="1000"
                        className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCodes}
                      className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold"
                    >
                      {t('electionDetail.invitationCodes.generateButton') || 'Générer les codes'}
                    </button>

                    {/* Afficher les codes générés */}
                    {generatedCodes.length > 0 && (
                      <div className="bg-accent bg-opacity-5 border-2 border-accent rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-accent">
                            🎟️ {generatedCodes.length} code(s) générés
                          </h3>
                          <button
                            onClick={() => setShowCodesModal(true)}
                            className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-80 transition-all font-semibold text-sm"
                          >
                            📋 Voir tous les codes
                          </button>
                        </div>

                        {/* Aperçu des 3 premiers codes */}
                        <div className="space-y-2">
                          {generatedCodes.slice(0, 3).map((code, index) => {
                            const truncatedCode = code.length > 24
                              ? `${code.substring(0, 12)}...${code.substring(code.length - 12)}`
                              : code;

                            return (
                              <div
                                key={index}
                                className="bg-primary border border-accent rounded-lg p-3 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-accent flex-shrink-0">#{index + 1}</span>
                                  <code className="text-xs text-secondary font-mono" title={code}>
                                    {truncatedCode}
                                  </code>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(code);
                                    alert('Code copié!');
                                  }}
                                  className="px-2 py-1 bg-accent text-primary rounded text-xs font-semibold hover:bg-opacity-80 transition-all flex-shrink-0"
                                >
                                  📋
                                </button>
                              </div>
                            );
                          })}

                          {generatedCodes.length > 3 && (
                            <p className="text-xs text-secondary text-center pt-2">
                              + {generatedCodes.length - 3} code(s) supplémentaire(s)
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              const allCodes = generatedCodes.join('\n');
                              navigator.clipboard.writeText(allCodes);
                              alert('Tous les codes copiés!');
                            }}
                            className="px-3 py-2 bg-secondary text-accent border border-accent rounded-lg hover:bg-tertiary transition-all font-semibold text-xs"
                          >
                            📋 Copier tous
                          </button>
                          <button
                            onClick={() => {
                              const csvContent = [
                                'Code,Index',
                                ...generatedCodes.map((code, index) => `${code},${index + 1}`)
                              ].join('\n');
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `codes_election_${election?.id || 0}.csv`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                            className="px-3 py-2 bg-secondary text-accent border border-accent rounded-lg hover:bg-tertiary transition-all font-semibold text-xs"
                          >
                            📄 Export CSV
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-3 text-xs text-secondary space-y-1">
                      <p>💡 {t('electionDetail.invitationCodes.hint') || 'Les codes générés s\'afficheront automatiquement ici et dans une fenêtre modale.'}</p>
                      <p className="text-accent font-semibold">
                        🔒 {t('electionDetail.invitationCodes.securityHint') || 'Sécurité : Distribuez chaque code de manière sécurisée à un seul électeur vérifié. Une fois utilisé, le code ne peut plus être réutilisé.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Voters Section */}
              <div className="bg-secondary border-2 border-accent vibe-border rounded-xl p-6 shadow-md">
                <button
                  onClick={() => setShowExportSection(!showExportSection)}
                  className="w-full flex justify-between items-center mb-4"
                >
                  <h2 className="text-xl font-bold text-primary">
                    📥 {t('electionDetail.export.title') || 'Export de la Liste'}
                  </h2>
                  <span className="text-accent text-2xl">{showExportSection ? '−' : '+'}</span>
                </button>

                {showExportSection && (
                  <div className="space-y-4">
                    <p className="text-sm text-secondary mb-4">
                      {t('electionDetail.export.description') || 'Exportez la liste complète des électeurs inscrits pour audit ou transparence.'}
                    </p>

                    <div className="bg-primary border border-secondary rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {election.registered_voters_count}
                      </div>
                      <div className="text-xs text-secondary uppercase">
                        {t('electionDetail.export.totalRegistered') || 'Inscrits'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleExportVotersCSV}
                        className="bg-secondary text-accent border-2 border-accent px-4 py-3 rounded-lg hover:bg-tertiary transition-all font-semibold text-sm"
                      >
                        📄 {t('electionDetail.export.csvButton') || 'Export CSV'}
                      </button>
                      <button
                        onClick={handleExportVotersJSON}
                        className="bg-secondary text-accent border-2 border-accent px-4 py-3 rounded-lg hover:bg-tertiary transition-all font-semibold text-sm"
                      >
                        📋 {t('electionDetail.export.jsonButton') || 'Export JSON'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results section (for closed or finalized elections) */}
          {(isFinalized || isClosed) && (
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-primary mb-4">📊 {t('electionDetail.resultsPreview')}</h2>

              {loadingResults ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-12 h-12 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
                  <p className="text-secondary">{t('electionDetail.loadingResults')}</p>
                </div>
              ) : candidatesWithVotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary">{t('electionDetail.noResults')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidatesWithVotes.slice(0, 3).map((candidate, index) => (
                    <div key={`result-${election.id}-${candidate.id}-${index}`} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${index === 0 ? 'text-warning' : 'text-secondary'}`}>
                            #{index + 1}
                          </span>
                          <span className="text-primary font-semibold">{candidate.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{candidate.percentage}%</div>
                          <div className="text-xs text-secondary">{candidate.votes} {candidate.votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${index === 0 ? 'bg-warning' : 'bg-accent'} transition-all duration-500`}
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.statistics')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary rounded-lg">
                <span className="block text-3xl font-bold text-primary mb-1">{election.num_candidates}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{election.num_candidates > 1 ? t('electionCard.candidates_plural') : t('electionCard.candidates')}</span>
              </div>
              <div className="text-center p-4 bg-primary rounded-lg">
                <span className="block text-3xl font-bold text-primary mb-1">{election.total_votes}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{election.total_votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.votingPeriod')}</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.start')}</span>
                <span className="text-sm text-primary font-medium">{formatDateTime(election.start_time)}</span>
              </div>
              <div>
                <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.end')}</span>
                <span className="text-sm text-primary font-medium">{formatDateTime(election.end_time)}</span>
              </div>
              {election.requires_registration && election.registration_deadline && (
                <div className="pt-2 border-t border-accent">
                  <span className="block text-xs text-accent font-semibold uppercase tracking-wide mb-1">
                    ⏰ {t('electionDetail.registrationDeadline') || 'Date limite d\'inscription'}
                  </span>
                  <span className="text-sm text-primary font-medium">{formatDateTime(election.registration_deadline)}</span>
                  {now < election.registration_deadline ? (
                    <div className="mt-2 text-xs text-success font-medium">
                      ✓ {t('electionDetail.registrationOpen') || 'Inscriptions ouvertes'}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-error font-medium">
                      ✗ {t('electionDetail.registrationClosed') || 'Inscriptions closes'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.organizer')}</h2>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-primary border-2 border-secondary vibe-border rounded-lg px-3 py-2 text-xs text-primary font-mono break-all" title={election.organizer}>
                {formatAddress(election.organizer)}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(election.organizer)}
                className="w-10 h-10 flex items-center justify-center bg-secondary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-colors"
                title={t('electionDetail.copyAddress')}
              >
                📋
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Organizer actions (pending) - Activer */}
            {isOrganizer && canActivate && (
              <button
                onClick={handleActivate}
                className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={election.num_candidates < 2}
                title={election.num_candidates < 2 ? t('electionDetail.activateTooltip') : ''}
              >
                {t('electionDetail.activateButton')}
                {election.num_candidates < 2 && ` (${election.num_candidates}/2)`}
              </button>
            )}

            {/* Organizer actions (active expired) - Fermer sur blockchain */}
            {isOrganizer && shouldClose && (
              <div className="space-y-2">
                <div className="bg-orange-500 bg-opacity-20 border-2 border-orange-500 rounded-lg p-3 text-sm text-primary font-bold">
                  ⚠️ {t('electionDetail.expiredWarning')}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-error text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
                >
                  {t('electionDetail.closeButton')}
                </button>
              </div>
            )}

            {/* Registration with invitation code (KYC flow) */}
            {election.requires_registration && election.status === 'Pending' && !isRegistered && (
              <div className="space-y-3">
                {/* Info message about KYC process */}
                <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg p-4 text-sm space-y-2">
                  <p className="text-primary font-bold flex items-center gap-2">
                    🔐 {t('electionDetail.kycRequired') || 'Inscription avec vérification d\'identité'}
                  </p>
                  <p className="text-secondary text-xs leading-relaxed">
                    {t('electionDetail.kycHint') || 'Pour participer à cette élection, vous devez compléter un processus de vérification d\'identité (KYC) hors blockchain. L\'organisateur vous fournira ensuite un code d\'invitation unique.'}
                  </p>
                  <div className="bg-primary bg-opacity-50 rounded-lg p-2 mt-2">
                    <p className="text-xs text-secondary font-medium">
                      💡 {t('electionDetail.kycSteps') || 'Étapes : 1) Créer votre adresse MultiversX 2) Compléter le KYC 3) Recevoir votre code d\'invitation 4) S\'inscrire ci-dessous'}
                    </p>
                  </div>
                </div>

                {/* Registration with invitation code */}
                <div className="bg-secondary border-2 border-accent rounded-xl p-4">
                  <label className="block text-sm font-bold mb-3 text-primary">
                    🎫 {t('electionDetail.invitationCodes.registerWithCode') || 'Entrez votre code d\'invitation'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      placeholder={t('electionDetail.invitationCodes.codePlaceholder') || 'Collez votre code ici...'}
                      className="flex-1 p-3 border-2 border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
                    />
                    <button
                      onClick={handleRegisterWithInvitationCode}
                      disabled={!invitationCode.trim()}
                      className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide shadow-md"
                    >
                      {t('electionDetail.invitationCodes.registerButton') || 'S\'inscrire'}
                    </button>
                  </div>
                  <p className="text-xs text-secondary mt-2">
                    ℹ️ {t('electionDetail.invitationCodes.codeInfo') || 'Le code d\'invitation est un identifiant unique à usage unique fourni par l\'organisateur.'}
                  </p>
                </div>
              </div>
            )}

            {/* Registered badge (for registered voters) */}
            {election.requires_registration && isRegistered && (
              <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-3 text-sm">
                <p className="text-black font-medium flex items-center gap-2">
                  <span>✓</span>
                  {t('electionDetail.registered') || 'Vous êtes inscrit à cette élection'}
                </p>
              </div>
            )}

            {/* Vote button (active elections not expired) */}
            {isActive && !shouldClose && (!election.requires_registration || isRegistered) && (
              <button
                onClick={handleVote}
                className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold uppercase tracking-wide shadow-md btn-vote"
              >
                {t('electionDetail.voteNow')}
              </button>
            )}

            {/* Finalize button (closed elections, organizer only) */}
            {isOrganizer && isClosed && !isFinalized && (
              <div className="space-y-2">
                <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg p-3 text-sm">
                  <span className="text-accent font-bold">ℹ️ {t('electionDetail.finalizeInfo')}</span>
                </div>
                <button
                  onClick={handleFinalize}
                  className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold uppercase tracking-wide shadow-md"
                >
                  ✅ {t('electionDetail.finalizeButton')}
                </button>
              </div>
            )}

            {/* View results (closed or finalized) */}
            {(isFinalized || isClosed) && (
              <button
                onClick={() => navigate(RouteNamesEnum.results.replace(':id', election.id.toString()))}
                className="w-full px-6 py-3 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold btn-results"
              >
                📊 {t('electionDetail.viewResults')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modales de confirmation */}
      <ConfirmModal
        isOpen={showCloseModal}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowCloseModal(false)}
        title={t('electionDetail.confirmModal.close.title')}
        message={t('electionDetail.confirmModal.close.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.close.confirm')}
        cancelText={t('electionDetail.confirmModal.close.cancel')}
        type="danger"
      />

      <ConfirmModal
        isOpen={showActivateModal}
        onConfirm={handleConfirmActivate}
        onCancel={() => setShowActivateModal(false)}
        title={t('electionDetail.confirmModal.activate.title')}
        message={t('electionDetail.confirmModal.activate.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.activate.confirm')}
        cancelText={t('electionDetail.confirmModal.activate.cancel')}
        type="info"
      />

      <ConfirmModal
        isOpen={showFinalizeModal}
        onConfirm={handleConfirmFinalize}
        onCancel={() => setShowFinalizeModal(false)}
        title={t('electionDetail.confirmModal.finalize.title')}
        message={t('electionDetail.confirmModal.finalize.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.finalize.confirm')}
        cancelText={t('electionDetail.confirmModal.finalize.cancel')}
        type="info"
      />

      {/* Transaction Sent Modal */}
      <TransactionSentModal
        isOpen={showTxSentModal}
        onClose={() => setShowTxSentModal(false)}
        count={parseInt(invitationCodeCount) || 0}
      />

      {/* Invitation Codes Modal */}
      <InvitationCodesModal
        isOpen={showCodesModal}
        onClose={() => setShowCodesModal(false)}
        codes={generatedCodes}
        electionId={election?.id || 0}
        electionTitle={election?.title || ''}
      />

      {/* Loading indicator for transaction watching */}
      {txLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-primary via-secondary to-primary border-2 border-accent vibe-border rounded-2xl p-8 shadow-2xl max-w-lg w-full">
            <div className="flex flex-col items-center gap-6">
              {/* Animated icon */}
              <div className="relative">
                <div className="w-24 h-24 border-4 border-secondary rounded-full animate-spin"></div>
                <div className="w-24 h-24 border-4 border-accent border-t-transparent rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl animate-pulse">🎟️</span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h3 className="text-white font-bold text-2xl mb-2">
                  Génération des codes
                </h3>
                <p className="text-white font-semibold text-lg">
                  ⏳ Récupération en cours...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="h-full bg-accent animate-pulse" style={{ width: '100%' }}></div>
              </div>

              {/* Description */}
              <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
                <p className="text-white text-sm text-center leading-relaxed font-medium">
                  La transaction est en cours de finalisation sur la blockchain MultiversX.
                  <br />
                  <span className="text-accent font-semibold">Les codes s'afficheront automatiquement</span> dans quelques secondes.
                </p>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-2 w-full">
                <div className="flex items-center gap-2 text-xs text-white font-medium">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Transaction</span>
                </div>
                <div className="flex-1 h-px bg-white opacity-30"></div>
                <div className="flex items-center gap-2 text-xs text-white font-medium">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <span>Décodage</span>
                </div>
                <div className="flex-1 h-px bg-white opacity-30"></div>
                <div className="flex items-center gap-2 text-xs text-white font-medium">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span>Affichage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
