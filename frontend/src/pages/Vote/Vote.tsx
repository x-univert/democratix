import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useVote, useSubmitPrivateVote } from 'hooks/transactions';
import { useGetElection, useGetCandidates, useHasVoted, useCandidateMetadata, useIPFSImage, useIsVoterRegistered, type Election, type Candidate } from 'hooks/elections';
import { ConfirmModal } from 'components';
import { useGetAccount } from 'lib';

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
                <p className="text-sm text-secondary mb-3 line-clamp-3">
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
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-link border border-accent px-2 py-1 rounded"
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
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-link border border-accent px-2 py-1 rounded"
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
  const { castVote } = useVote();
  const { submitPrivateVote } = useSubmitPrivateVote();
  const { getElection } = useGetElection();
  const { getCandidates } = useGetCandidates();
  const { hasVoted: checkHasVoted } = useHasVoted();
  const { isVoterRegistered } = useIsVoterRegistered();

  const [election, setElection] = useState<ElectionWithCandidates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voteType, setVoteType] = useState<'standard' | 'private'>('standard');
  const [showPrivateVoteModal, setShowPrivateVoteModal] = useState(false);
  const [privateVoteProgress, setPrivateVoteProgress] = useState({ step: '', progress: 0 });

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

          // Vérifier si l'utilisateur a déjà voté
          const voted = await checkHasVoted(electionId);
          setAlreadyVoted(voted);

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
  }, [id, address]);

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
  const handleSubmit = (type: 'standard' | 'private') => {
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

    // Si vote privé, ouvrir le modal de progression
    if (type === 'private') {
      setShowPrivateVoteModal(true);
      handlePrivateVote();
    } else {
      // Ouvrir la modale de confirmation pour vote standard
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
      const result = await submitPrivateVote(
        electionId,
        selectedCandidate!,
        numCandidates,
        (step, progress) => {
          setPrivateVoteProgress({ step, progress });
        }
      );

      console.log('✅ Private vote submitted successfully:', result);
      alert('Vote privé enregistré avec succès! 🔐');
      setShowPrivateVoteModal(false);
      navigate(`/election/${id}`);
    } catch (error) {
      console.error('❌ Private vote error:', error);
      alert('Erreur lors du vote privé. Veuillez réessayer.');
      setShowPrivateVoteModal(false);
    } finally {
      setIsSubmitting(false);
      setPrivateVoteProgress({ step: '', progress: 0 });
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
        <h2 className="text-2xl text-secondary">{election.title}</h2>
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
          <h3 className="text-lg font-bold text-primary mb-2">✅ {t('vote.alreadyVotedTitle')}</h3>
          <p className="text-secondary">
            {t('vote.alreadyVotedMessage')}
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
        <p className="text-sm text-secondary">
          ⚠️ <strong className="text-primary">{t('vote.warning.title')}</strong> {t('vote.warning.message')}
        </p>
      </div>

      {/* Boutons */}
      <div className="space-y-4">
        {/* Bouton Vote Standard */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/election/${id}`)}
            className="flex-1 px-6 py-3 border border-secondary text-secondary rounded-lg hover:bg-tertiary transition-colors"
            disabled={isSubmitting}
          >
            {t('vote.cancel')}
          </button>
          <button
            onClick={() => handleSubmit('standard')}
            disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)
                ? 'bg-tertiary text-tertiary cursor-not-allowed border border-secondary'
                : 'bg-btn-primary text-btn-primary hover:bg-btn-hover btn-confirm-vote'
            }`}
          >
            {isSubmitting && voteType === 'standard' ? t('vote.submitting') : alreadyVoted ? t('vote.alreadyVoted') : (election.requires_registration && !isRegistered) ? t('vote.notRegistered') : '🗳️ Vote Standard'}
          </button>
        </div>

        {/* Bouton Vote Privé zk-SNARK */}
        <div className="bg-accent bg-opacity-5 border-2 border-accent rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🔐</span>
            <div className="flex-1">
              <h4 className="font-bold text-primary mb-1">Vote Privé zk-SNARK</h4>
              <p className="text-sm text-secondary">
                Vote totalement anonyme avec preuve cryptographique. Votre choix reste secret et votre identité protégée.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSubmit('private')}
            disabled={selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedCandidate === null || isSubmitting || alreadyVoted || (election.requires_registration && !isRegistered)
                ? 'bg-tertiary text-tertiary cursor-not-allowed border border-secondary'
                : 'bg-accent text-white hover:bg-opacity-90'
            }`}
          >
            {isSubmitting && voteType === 'private' ? '⏳ Vote privé en cours...' : '🔐 Voter en Mode Privé (zk-SNARK)'}
          </button>
        </div>
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

      {/* Modal de Progression Vote Privé zk-SNARK */}
      {showPrivateVoteModal && (
        <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-secondary rounded-lg shadow-xl max-w-md w-full mx-4 border-2 border-accent">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h3 className="text-2xl font-bold text-primary mb-2">
                  Vote Privé zk-SNARK
                </h3>
                <p className="text-sm text-secondary">
                  Génération de la preuve cryptographique...
                </p>
              </div>

              {/* Barre de progression */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-secondary mb-2">
                  <span>{privateVoteProgress.step}</span>
                  <span className="font-bold text-accent">{privateVoteProgress.progress}%</span>
                </div>
                <div className="w-full bg-tertiary rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${privateVoteProgress.progress}%` }}
                  />
                </div>
              </div>

              {/* Étapes détaillées */}
              <div className="space-y-3 text-sm">
                <div className={`flex items-center gap-3 p-2 rounded ${privateVoteProgress.progress >= 10 ? 'bg-accent bg-opacity-10' : ''}`}>
                  <span className={privateVoteProgress.progress >= 10 ? 'text-accent' : 'text-secondary'}>
                    {privateVoteProgress.progress >= 20 ? '✅' : privateVoteProgress.progress >= 10 ? '⏳' : '⏸️'}
                  </span>
                  <span className={privateVoteProgress.progress >= 10 ? 'text-primary font-semibold' : 'text-secondary'}>
                    Vérification service zk-SNARK
                  </span>
                </div>
                <div className={`flex items-center gap-3 p-2 rounded ${privateVoteProgress.progress >= 20 && privateVoteProgress.progress < 40 ? 'bg-accent bg-opacity-10' : ''}`}>
                  <span className={privateVoteProgress.progress >= 20 ? 'text-accent' : 'text-secondary'}>
                    {privateVoteProgress.progress >= 40 ? '✅' : privateVoteProgress.progress >= 20 ? '⏳' : '⏸️'}
                  </span>
                  <span className={privateVoteProgress.progress >= 20 ? 'text-primary font-semibold' : 'text-secondary'}>
                    Préparation clés cryptographiques
                  </span>
                </div>
                <div className={`flex items-center gap-3 p-2 rounded ${privateVoteProgress.progress >= 40 && privateVoteProgress.progress < 70 ? 'bg-accent bg-opacity-10' : ''}`}>
                  <span className={privateVoteProgress.progress >= 40 ? 'text-accent' : 'text-secondary'}>
                    {privateVoteProgress.progress >= 70 ? '✅' : privateVoteProgress.progress >= 40 ? '⏳' : '⏸️'}
                  </span>
                  <span className={privateVoteProgress.progress >= 40 ? 'text-primary font-semibold' : 'text-secondary'}>
                    Génération preuve zk-SNARK
                  </span>
                </div>
                <div className={`flex items-center gap-3 p-2 rounded ${privateVoteProgress.progress >= 70 && privateVoteProgress.progress < 90 ? 'bg-accent bg-opacity-10' : ''}`}>
                  <span className={privateVoteProgress.progress >= 70 ? 'text-accent' : 'text-secondary'}>
                    {privateVoteProgress.progress >= 90 ? '✅' : privateVoteProgress.progress >= 70 ? '⏳' : '⏸️'}
                  </span>
                  <span className={privateVoteProgress.progress >= 70 ? 'text-primary font-semibold' : 'text-secondary'}>
                    Préparation transaction blockchain
                  </span>
                </div>
                <div className={`flex items-center gap-3 p-2 rounded ${privateVoteProgress.progress >= 90 ? 'bg-accent bg-opacity-10' : ''}`}>
                  <span className={privateVoteProgress.progress >= 90 ? 'text-accent' : 'text-secondary'}>
                    {privateVoteProgress.progress >= 100 ? '✅' : privateVoteProgress.progress >= 90 ? '⏳' : '⏸️'}
                  </span>
                  <span className={privateVoteProgress.progress >= 90 ? 'text-primary font-semibold' : 'text-secondary'}>
                    Signature et envoi transaction
                  </span>
                </div>
              </div>

              {/* Info sécurité */}
              <div className="mt-6 p-3 bg-accent bg-opacity-10 rounded border border-accent">
                <p className="text-xs text-secondary text-center">
                  🔒 Votre vote reste totalement anonyme et votre choix secret
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
