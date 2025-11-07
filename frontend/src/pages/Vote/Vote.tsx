import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useVote, useSubmitPrivateVote, useSubmitEncryptedVote, useSubmitPrivateVoteWithProof } from 'hooks/transactions';
import { useGetElection, useGetCandidates, useHasVoted, useHasVotedPrivately, useCandidateMetadata, useIPFSImage, useIsVoterRegistered, useGetElectionPublicKey, type Election, type Candidate } from 'hooks/elections';
import { ConfirmModal, PrivateVoteModal } from 'components';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { votingContract } from 'config';

// Helper function to fix UTF-8 encoding issues
const fixEncoding = (str: string): string => {
  try {
    // Si le texte contient des caractères mal encodés comme "Ã©" au lieu de "é"
    // Cela signifie que des bytes UTF-8 ont été mal interprétés comme ISO-8859-1
    // Solution: encoder en ISO-8859-1 (Latin-1) puis décoder en UTF-8

    // Détecter si le texte semble mal encodé
    if (!str.includes('Ã') && !str.includes('â') && !str.includes('Ã©')) {
      return str; // Pas de problème d'encodage détecté
    }

    // Convertir la chaîne mal interprétée en bytes
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }

    // Décoder les bytes en UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch {
    return str;
  }
};

interface ElectionWithCandidates extends Election {
  candidates?: Candidate[];
}

// Composant pour afficher un candidat avec ses métadonnées IPFS
const CandidateCard = ({
  candidate,
  isSelected,
  isDisabled,
  onClick
}: {
  candidate: Candidate;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const { metadata } = useCandidateMetadata(candidate.description_ipfs);
  const imageUrl = useIPFSImage(metadata?.image);

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg overflow-hidden transition-all candidate-card ${
        isDisabled
          ? 'cursor-not-allowed opacity-60 border-secondary'
          : `cursor-pointer ${
              isSelected
                ? 'border-accent bg-tertiary candidate-selected'
                : 'border-secondary hover:border-accent hover:bg-tertiary'
            }`
      }`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image du candidat */}
        {imageUrl && (
          <div className="w-full md:w-48 h-48 bg-tertiary flex-shrink-0">
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

        {/* Informations du candidat */}
        <div className="flex-1 p-6">
          <div className="flex items-start gap-4">
            {/* Radio button */}
            <div className="flex-shrink-0 pt-1">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-accent bg-accent'
                    : 'border-secondary'
                }`}
              >
                {isSelected && (
                  <div className="w-3 h-3 bg-primary rounded-full" />
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h4 className="text-xl font-bold text-primary candidate-name">
                  {metadata?.name || candidate.name}
                </h4>
                {metadata?.metadata?.party && (
                  <span className="px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-xs font-semibold">
                    {metadata.metadata.party}
                  </span>
                )}
              </div>

              {/* Biographie */}
              {metadata?.biography && (
                <p className={`text-sm mb-3 line-clamp-3 ${isSelected ? 'candidate-bio-selected' : 'text-secondary'}`}>
                  {metadata.biography}
                </p>
              )}

              {/* Liens */}
              {(metadata?.links?.website || metadata?.links?.twitter) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {metadata.links.website && (
                    <a
                      href={metadata.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1 text-xs hover:text-link border-2 px-2 py-1 rounded ${
                        isSelected ? 'candidate-link-selected' : 'text-secondary border-secondary'
                      }`}
                    >
                      🌐 {t('vote.website')}
                    </a>
                  )}
                  {metadata.links.twitter && (
                    <a
                      href={`https://twitter.com/${metadata.links.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1 text-xs hover:text-link border-2 px-2 py-1 rounded ${
                        isSelected ? 'candidate-link-selected' : 'text-secondary border-secondary'
                      }`}
                    >
                      𝕏 {metadata.links.twitter}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Vote = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { castVote } = useVote();
  const { submitPrivateVote } = useSubmitPrivateVote();
  const { submitEncryptedVote } = useSubmitEncryptedVote();
  const { submitPrivateVoteWithProof, isGeneratingProof } = useSubmitPrivateVoteWithProof(id ? parseInt(id) : null);
  const { getElection } = useGetElection();
  const { getCandidates } = useGetCandidates();
  const { hasVoted: checkHasVoted } = useHasVoted();
  const hasVotedPrivately = useHasVotedPrivately(id ? parseInt(id) : null);
  const { isVoterRegistered } = useIsVoterRegistered();
  const { publicKey: elgamalPublicKey, loading: loadingPublicKey } = useGetElectionPublicKey(id ? parseInt(id) : null);

  const [election, setElection] = useState<ElectionWithCandidates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voteType, setVoteType] = useState<'standard' | 'private' | 'encrypted' | 'encrypted_with_proof'>('standard');
  const [showPrivateVoteModal, setShowPrivateVoteModal] = useState(false);
  const [privateVoteProgress, setPrivateVoteProgress] = useState({ step: '', progress: 0 });
  const [privateVoteSessionId, setPrivateVoteSessionId] = useState<string | null>(null);
  const [privateVoteTxHash, setPrivateVoteTxHash] = useState<string | null>(null);

  // Charger l'élection et les candidats depuis la blockchain
  useEffect(() => {
    const fetchElectionData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const electionId = parseInt(id);
        const electionData = await getElection(electionId);

        if (electionData) {
          const candidatesData = await getCandidates(electionId);
          setElection({ ...electionData, candidates: candidatesData });

          // DEBUG: Afficher encryption_type
          console.log('🔍 DEBUG - Election Data:', electionData);
          console.log('🔍 DEBUG - encryption_type:', electionData.encryption_type);
          console.log('🔍 DEBUG - elgamalPublicKey:', elgamalPublicKey);

          // Vérifier si l'utilisateur a déjà voté (standard OU privé)
          const voted = await checkHasVoted(electionId);
          setAlreadyVoted(voted || hasVotedPrivately);

          // Vérifier l'inscription si l'élection le requiert
          if (electionData.requires_registration && address) {
            setCheckingRegistration(true);
            try {
              const registered = await isVoterRegistered(electionId, address);
              setIsRegistered(registered);
            } catch (err) {
              console.error('Erreur lors de la vérification de l\'inscription:', err);
              setIsRegistered(false);
            } finally {
              setCheckingRegistration(false);
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'élection:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, [id, address, hasVotedPrivately]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-primary">{t('vote.loading')}</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-primary">{t('vote.notFound')}</p>
        <button
          onClick={() => navigate(RouteNamesEnum.elections)}
          className="text-accent hover:text-link"
        >
          ← {t('electionDetail.backToElections')}
        </button>
      </div>
    );
  }

  // Ouvrir la modale de confirmation
  const handleSubmit = (type: 'standard' | 'private' | 'encrypted' | 'encrypted_with_proof') => {
    console.log('🎯 ========== VOTE BUTTON CLICKED ==========');
    console.log('🎯 Vote Type:', type);
    console.log('🎯 Selected candidate:', selectedCandidate);
    console.log('🎯 Election ID from URL:', id);
    console.log('🎯 Election object:', election);

    if (selectedCandidate === null) {
      console.log('⚠️ No candidate selected, showing alert');
      alert(t('vote.selectCandidateWarning'));
      return;
    }

    setVoteType(type);

    // Si vote privé zk-SNARK, ouvrir le modal de progression
    if (type === 'private') {
      setShowPrivateVoteModal(true);
      handlePrivateVote();
    }
    // Si vote chiffré ElGamal (Option 1), ouvrir le modal de progression
    else if (type === 'encrypted') {
      setShowPrivateVoteModal(true);
      handleEncryptedVote();
    }
    // Si vote chiffré ElGamal + zk-SNARK (Option 2), ouvrir le modal de progression
    else if (type === 'encrypted_with_proof') {
      setShowPrivateVoteModal(true);
      handleEncryptedVoteWithProof();
    }
    // Vote standard : ouvrir la modale de confirmation
    else {
      setShowConfirmModal(true);
    }
  };

  // Effectuer le vote privé zk-SNARK
  const handlePrivateVote = async () => {
    console.log('🔐 Starting private vote (zk-SNARK)...');
    setIsSubmitting(true);

    try {
      const electionId = parseInt(id!);
      const numCandidates = election?.candidates?.length || 0;

      // Appeler le hook de vote privé avec callback de progression
      const sessionId = await submitPrivateVote(
        electionId,
        selectedCandidate!,
        numCandidates,
        (step, progress) => {
          setPrivateVoteProgress({ step, progress });
        }
      );

      console.log('✅ Private vote submitted successfully. Session ID:', sessionId);
      setPrivateVoteSessionId(sessionId);

      // Attendre un peu pour que la transaction soit indexée
      setTimeout(async () => {
        try {
          console.log('🔍 Recherche de la transaction de vote privé (délai: 8s)...');

          // Récupérer les transactions récentes de l'utilisateur
          const response = await fetch(
            `${network.apiAddress}/accounts/${address}/transactions?size=20`
          );
          const transactions = await response.json();

          console.log('📊 Nombre de transactions récupérées:', transactions.length);

          // Trouver la transaction submitPrivateVote la plus récente (par timestamp)
          const privateVoteTxs = transactions.filter((tx: any) =>
            tx.function === 'submitPrivateVote' &&
            tx.receiver === votingContract &&
            tx.sender === address
          );

          console.log('🎯 Transactions submitPrivateVote trouvées:', privateVoteTxs.length);

          if (privateVoteTxs.length > 0) {
            // Prendre la plus récente (première dans la liste car triée par défaut)
            const targetTx = privateVoteTxs[0];
            console.log('✅ Transaction trouvée:', targetTx.txHash);
            console.log('📅 Status:', targetTx.status);
            console.log('⏰ Timestamp:', targetTx.timestamp);
            setPrivateVoteTxHash(targetTx.txHash);
          } else {
            console.warn('⚠️ Transaction non trouvée, affichage du résultat manuel');
            // Même si on ne trouve pas le txHash, on montre la modale de succès
            setPrivateVoteTxHash('success-no-hash');
          }
        } catch (err) {
          console.error('❌ Erreur lors de la recherche de la transaction:', err);
          // En cas d'erreur de recherche, on affiche quand même le succès
          setPrivateVoteTxHash('success-no-hash');
        }
      }, 8000); // Attendre 8 secondes pour l'indexation (plus sûr)

    } catch (error) {
      console.error('❌ Private vote error:', error);
      // Fermer la modale de progression et ne pas ouvrir la modale de résultat
      setShowPrivateVoteModal(false);
      alert('Erreur lors du vote privé. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effectuer le vote chiffré ElGamal (Option 1)
  const handleEncryptedVote = async () => {
    console.log('🔐 Starting encrypted vote (ElGamal)...');
    setIsSubmitting(true);

    try {
      const electionId = parseInt(id!);

      // Vérifier que la clé publique est disponible
      if (!elgamalPublicKey) {
        throw new Error('Clé publique ElGamal non disponible pour cette élection');
      }

      // Appeler le hook de vote chiffré avec callback de progression
      const sessionId = await submitEncryptedVote(
        electionId,
        selectedCandidate!,
        elgamalPublicKey,
        (step, progress) => {
          setPrivateVoteProgress({ step, progress });
        }
      );

      console.log('✅ Encrypted vote submitted successfully. Session ID:', sessionId);
      setPrivateVoteSessionId(sessionId);

      // Attendre un peu pour que la transaction soit indexée
      setTimeout(async () => {
        try {
          console.log('🔍 Recherche de la transaction de vote chiffré (délai: 8s)...');

          // Récupérer les transactions récentes de l'utilisateur
          const response = await fetch(
            `${network.apiAddress}/accounts/${address}/transactions?size=20`
          );
          const transactions = await response.json();

          console.log('📊 Nombre de transactions récupérées:', transactions.length);

          // Trouver la transaction submitEncryptedVote la plus récente (par timestamp)
          const encryptedVoteTxs = transactions.filter((tx: any) =>
            tx.function === 'submitEncryptedVote' &&
            tx.receiver === votingContract &&
            tx.sender === address
          );

          console.log('🎯 Transactions submitEncryptedVote trouvées:', encryptedVoteTxs.length);

          if (encryptedVoteTxs.length > 0) {
            // Prendre la plus récente (première dans la liste car triée par défaut)
            const targetTx = encryptedVoteTxs[0];
            console.log('✅ Transaction trouvée:', targetTx.txHash);
            console.log('📅 Status:', targetTx.status);
            console.log('⏰ Timestamp:', targetTx.timestamp);
            setPrivateVoteTxHash(targetTx.txHash);
          } else {
            console.warn('⚠️ Transaction non trouvée, affichage du résultat manuel');
            // Même si on ne trouve pas le txHash, on montre la modale de succès
            setPrivateVoteTxHash('success-no-hash');
          }
        } catch (err) {
          console.error('❌ Erreur lors de la recherche de la transaction:', err);
          // En cas d'erreur de recherche, on affiche quand même le succès
          setPrivateVoteTxHash('success-no-hash');
        }
      }, 8000); // Attendre 8 secondes pour l'indexation (plus sûr)

    } catch (error) {
      console.error('❌ Encrypted vote error:', error);
      // Fermer la modale de progression et ne pas ouvrir la modale de résultat
      setShowPrivateVoteModal(false);
      alert('Erreur lors du vote chiffré. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effectuer le vote chiffré ElGamal avec preuve zk-SNARK (Option 2)
  const handleEncryptedVoteWithProof = async () => {
    console.log('🛡️ Starting encrypted vote with zk-SNARK proof (Option 2)...');
    setIsSubmitting(true);

    try {
      const electionId = parseInt(id!);
      const numCandidates = election?.candidates?.length || 0;

      // Vérifier que la clé publique est disponible
      if (!elgamalPublicKey) {
        throw new Error('Clé publique ElGamal non disponible pour cette élection');
      }

      console.log('🔐 Génération de la preuve zk-SNARK pour Option 2...');
      setPrivateVoteProgress({ step: 'Génération de la preuve zk-SNARK (2-3 secondes)...', progress: 30 });

      console.log('🔢 Candidate ID from smart contract (1-indexed):', {
        candidateId: selectedCandidate,
        numCandidates
      });

      // Appeler le hook de vote avec preuve
      // IMPORTANT: On passe l'ID du smart contract (1-indexed).
      // Le hook zkproofEncrypted.ts gérera les conversions:
      // - Pour ElGamal: candidateId + 1
      // - Pour circuit: candidateId - 1 (0-indexed)
      const result = await submitPrivateVoteWithProof({
        electionId,
        candidateId: selectedCandidate!,
        numCandidates,
      });

      console.log('✅ Vote avec preuve zk-SNARK soumis avec succès. Session ID:', result.sessionId);
      setPrivateVoteSessionId(result.sessionId);
      setPrivateVoteProgress({ step: 'Vote soumis avec succès!', progress: 100 });

      // Attendre un peu pour que la transaction soit indexée
      setTimeout(async () => {
        try {
          console.log('🔍 Recherche de la transaction de vote avec preuve (délai: 8s)...');

          // Récupérer les transactions récentes de l'utilisateur
          const response = await fetch(
            `${network.apiAddress}/accounts/${address}/transactions?size=20`
          );
          const transactions = await response.json();

          console.log('📊 Nombre de transactions récupérées:', transactions.length);

          // Trouver la transaction submitPrivateVoteWithProof la plus récente
          const voteWithProofTxs = transactions.filter((tx: any) =>
            tx.function === 'submitPrivateVoteWithProof' &&
            tx.receiver === votingContract &&
            tx.sender === address
          );

          console.log('🎯 Transactions submitPrivateVoteWithProof trouvées:', voteWithProofTxs.length);

          if (voteWithProofTxs.length > 0) {
            // Prendre la plus récente
            const targetTx = voteWithProofTxs[0];
            console.log('✅ Transaction trouvée:', targetTx.txHash);
            console.log('📅 Status:', targetTx.status);
            console.log('⏰ Timestamp:', targetTx.timestamp);
            setPrivateVoteTxHash(targetTx.txHash);
          } else {
            console.warn('⚠️ Transaction non trouvée, affichage du résultat manuel');
            // Même si on ne trouve pas le txHash, on montre la modale de succès
            setPrivateVoteTxHash('success-no-hash');
          }
        } catch (err) {
          console.error('❌ Erreur lors de la recherche de la transaction:', err);
          // En cas d'erreur de recherche, on affiche quand même le succès
          setPrivateVoteTxHash('success-no-hash');
        }
      }, 8000); // Attendre 8 secondes pour l'indexation

    } catch (error) {
      console.error('❌ Vote avec preuve zk-SNARK error:', error);
      // Fermer la modale de progression
      setShowPrivateVoteModal(false);
      alert('Erreur lors du vote avec preuve zk-SNARK. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effectuer réellement le vote après confirmation
  const handleConfirmVote = async () => {
    setShowConfirmModal(false);
    console.log('🚀 Starting vote submission...');
    setIsSubmitting(true);

    try {
      const electionId = parseInt(id!);
      console.log('📊 Parsed election ID:', electionId);

      // Appeler le smart contract avec l'ID de l'élection et l'ID du candidat
      // Le hook useVote gère le chiffrement et la création de la preuve
      console.log('📞 Calling castVote hook...');
      const result = await castVote(electionId, selectedCandidate!);
      console.log('✅ castVote returned:', result);

      console.log('🎉 Vote submitted successfully!');
      alert(t('vote.voteSuccess'));
      console.log('↩️ Navigating back to election detail page');
      navigate(`/election/${id}`);
    } catch (error) {
      console.error('❌ ========== VOTE ERROR IN COMPONENT ==========');
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Full error:', error);
      console.error('❌ ========== END COMPONENT ERROR ==========');
      alert(t('vote.voteError'));
    } finally {
      console.log('🏁 Vote submission complete, re-enabling button');
      setIsSubmitting(false);
    }
  };

  // Trouver le candidat sélectionné pour la confirmation
  const selectedCandidateData = election?.candidates?.find(c => c.id === selectedCandidate);

  // Fermer la modale de vote privé et naviguer
  const handleClosePrivateVoteModal = () => {
    setShowPrivateVoteModal(false);
    setPrivateVoteTxHash(null);
    setPrivateVoteSessionId(null);
    setPrivateVoteProgress({ step: '', progress: 0 });

    // Naviguer vers la page de détail de l'élection
    navigate(`/election/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <button
        onClick={() => navigate(`/election/${id}`)}
        className="text-accent hover:text-link mb-4"
      >
        ← {t('vote.backToDetails')}
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">{t('vote.title')}</h1>
        <h2 className="text-2xl text-secondary">
          {fixEncoding(election.title)}
        </h2>
      </div>

      {/* Message si inscription requise et pas inscrit */}
      {election.requires_registration && !isRegistered && !checkingRegistration && (
        <div className="bg-error bg-opacity-10 border-2 border-error rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-primary mb-2">🔒 {t('vote.notRegisteredTitle')}</h3>
          <p className="text-secondary mb-4">
            {t('vote.notRegisteredMessage')}
          </p>
          <button
            onClick={() => navigate(`/election/${id}`)}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
          >
            {t('vote.goToRegistration')}
          </button>
        </div>
      )}

      {/* Message si déjà voté */}
      {alreadyVoted && (
        <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#000000' }}>✅ VOUS AVEZ DEJA VOTE</h3>
          <p className="text-sm" style={{ color: '#000000' }}>
            Vous avez déjà participé à cette élection. Votre vote a été enregistré avec succès sur la blockchain.
          </p>
        </div>
      )}

      {/* Candidats */}
      <div className="bg-secondary rounded-lg shadow-md p-8 mb-6 border-2 border-secondary vibe-border">
        <h3 className="text-xl font-bold mb-6 text-primary">
          {alreadyVoted ? t('vote.voteRecorded') : t('vote.selectCandidate')}
        </h3>

        <div className="space-y-4">
          {(!election.candidates || election.candidates.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-secondary">{t('vote.noCandidates')}</p>
            </div>
          ) : (
            election.candidates.map((candidate, index) => (
              <CandidateCard
                key={`${election.id}-${candidate.id}-${index}`}
                candidate={candidate}
                isSelected={selectedCandidate === candidate.id}
                isDisabled={alreadyVoted || (election.requires_registration && !isRegistered)}
                onClick={() => !alreadyVoted && (election.requires_registration ? isRegistered : true) && setSelectedCandidate(candidate.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 mb-6">
        <p className="text-sm vote-warning-text">
          ⚠️ <strong>{t('vote.warning.title')}</strong> {t('vote.warning.message')}
        </p>
      </div>

      {/* Boutons */}
      <div className="space-y-4">
        {/* Bouton Vote Standard - Toujours affiché */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/election/${id}`)}
            className="flex-1 px-6 py-3 border border-secondary text-secondary rounded-lg hover:bg-tertiary transition-colors"
            disabled={isSubmitting}
          >
            {t('vote.cancel')}
          </button>
          {/* Bouton Vote Standard - Affiché SEULEMENT si encryption_type < 2 (ou non défini) */}
          {(!election.encryption_type || election.encryption_type < 2) && (
            <button
              onClick={() => handleSubmit('standard')}
              disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)
                  ? 'bg-tertiary vote-button-disabled cursor-not-allowed border border-secondary'
                  : 'bg-btn-primary text-btn-primary hover:bg-btn-hover btn-confirm-vote'
              }`}
            >
              {isSubmitting && voteType === 'standard' ? t('vote.submitting') : alreadyVoted ? t('vote.alreadyVoted') : (election.requires_registration && !isRegistered) ? t('vote.notRegistered') : '🗳️ Vote Standard'}
            </button>
          )}
        </div>

        {/* Bouton Vote Chiffré ElGamal (Option 1) - Affiché SEULEMENT si encryption_type === 1 et clé publique disponible */}
        {election.encryption_type === 1 && elgamalPublicKey && !loadingPublicKey && (
          <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold" style={{ color: '#000000' }}>Vote Chiffré ElGamal</h4>
                  <span className="text-xs px-2 py-1 bg-success text-white rounded-full font-medium">
                    OPTION 1
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#000000' }}>
                  Vote anonyme avec chiffrement ElGamal. Plus rapide et moins coûteux que zk-SNARK.
                  <a
                    href="/encryption-options"
                    target="_blank"
                    className="ml-2 text-accent hover:underline"
                  >
                    En savoir plus →
                  </a>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSubmit('encrypted')}
              disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)}
              className={`w-full px-6 py-3 rounded-lg font-bold transition-colors ${
                selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)
                  ? 'bg-tertiary vote-button-disabled cursor-not-allowed border border-secondary'
                  : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 shadow-lg'
              }`}
            >
              {isSubmitting && voteType === 'encrypted' ? '⏳ Vote chiffré en cours...' : '🔒 Voter avec Chiffrement ElGamal'}
            </button>
          </div>
        )}

        {/* Bouton Vote Chiffré ElGamal + zk-SNARK (Option 2) - Affiché si encryption_type === 2 et clé publique disponible */}
        {election.encryption_type === 2 && elgamalPublicKey && !loadingPublicKey && (
          <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">🛡️</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold" style={{ color: '#000000' }}>Vote Chiffré ElGamal + zk-SNARK</h4>
                  <span className="text-xs px-2 py-1 bg-purple-500 text-white rounded-full font-medium">
                    OPTION 2
                  </span>
                  <span className="text-xs px-2 py-1 bg-yellow-500 text-white rounded-full font-medium">
                    SÉCURITÉ MAX
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#000000' }}>
                  Sécurité maximale : Chiffrement ElGamal + preuve zk-SNARK garantissant mathématiquement la validité du vote. Anonymat total avec nullifier.
                  <a
                    href="/encryption-options"
                    target="_blank"
                    className="ml-2 text-accent hover:underline"
                  >
                    En savoir plus →
                  </a>
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#666666' }}>
                  <span>⏱️ Génération preuve: 2-3s</span>
                  <span>•</span>
                  <span>⛽ Gas: ~50M</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSubmit('encrypted_with_proof')}
              disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered) || isGeneratingProof}
              className={`w-full px-6 py-3 rounded-lg font-bold transition-colors ${
                selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered) || isGeneratingProof
                  ? 'bg-tertiary vote-button-disabled cursor-not-allowed border border-secondary'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              {isSubmitting && voteType === 'encrypted_with_proof' ? '⏳ Génération preuve zk-SNARK...' : isGeneratingProof ? '⏳ Génération en cours...' : '🛡️ Voter avec ElGamal + zk-SNARK (Option 2)'}
            </button>
          </div>
        )}

        {/* Bouton Vote Privé zk-SNARK (ancien système) - Affiché uniquement si encryption_type n'est pas défini (pour compatibilité) */}
        {(!election.encryption_type || election.encryption_type === 0) && (
          <div className="bg-accent bg-opacity-5 border-2 border-accent rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">🔐</span>
              <div className="flex-1">
                <h4 className="font-bold mb-1" style={{ color: '#000000' }}>Vote Privé zk-SNARK</h4>
                <p className="text-sm" style={{ color: '#000000' }}>
                  Vote totalement anonyme avec preuve cryptographique. Votre choix reste secret et votre identité protégée.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSubmit('private')}
              disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)}
              className={`w-full px-6 py-3 rounded-lg font-bold transition-colors ${
                selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)
                  ? 'bg-tertiary vote-button-disabled cursor-not-allowed border border-secondary'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              {isSubmitting && voteType === 'private' ? '⏳ Vote privé en cours...' : '🔐 Voter en Mode Privé (zk-SNARK)'}
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmVote}
        onCancel={() => setShowConfirmModal(false)}
        title={t('vote.confirmModal.title')}
        message={t('vote.confirmModal.message', { candidateName: selectedCandidateData?.name || '' })}
        confirmText={t('vote.confirmModal.confirm')}
        cancelText={t('vote.confirmModal.cancel')}
        type="warning"
      />

      {/* Modal de Vote Privé avec Suivi de Transaction */}
      <PrivateVoteModal
        isOpen={showPrivateVoteModal}
        onClose={handleClosePrivateVoteModal}
        sessionId={privateVoteSessionId}
        txHash={privateVoteTxHash}
        voteType={voteType === 'encrypted' ? 'elgamal' : voteType === 'encrypted_with_proof' ? 'elgamal-zksnark' : 'zk-snark'}
      />
    </div>
  );
};
