import { useNavigate } from 'react-router-dom';
import { useGetAccount } from 'lib';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Election } from '../../hooks/elections/useGetElection';
import { useHasVoted, useHasVotedPrivately, useElectionMetadata, useIPFSImage, useIsCoOrganizer } from '../../hooks/elections';
import { useIsVoterRegistered } from '../../hooks/transactions/useIsVoterRegistered';
import { useActivateElection } from '../../hooks/transactions/useActivateElection';
import { TransactionProgressModal } from '../TransactionProgressModal';
import { EncryptionTypeBadge } from '../EncryptionTypeBadge';
import { RouteNamesEnum } from '../../localConstants';

interface ElectionCardProps {
  election: Election;
}

export const ElectionCard = ({ election }: ElectionCardProps) => {
  const navigate = useNavigate();
  const { address } = useGetAccount();
  const { hasVoted: checkHasVoted } = useHasVoted();
  const hasVotedPrivately = useHasVotedPrivately(election.id);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const { t } = useTranslation();

  // Registration hooks
  const { checkRegistration } = useIsVoterRegistered();
  const { activateElection } = useActivateElection();
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationTxHash, setActivationTxHash] = useState<string | undefined>();

  // Récupérer les métadonnées IPFS
  const { metadata: electionMetadata } = useElectionMetadata(election.description_ipfs);
  const imageUrl = useIPFSImage(electionMetadata?.image);

  // Vérifier si l'utilisateur est co-organisateur
  const { isOrganizer: isOrganizerOrCoOrg, isPrimaryOrganizer, isCoOrganizer: isCoOrganizerStatus } = useIsCoOrganizer(
    election.id,
    election.organizer
  );

  // Calculer le statut en fonction des dates et du status
  const now = Date.now() / 1000; // Timestamp en secondes
  const isUpcoming = election.start_time > now;
  // Utiliser directement le statut blockchain
  const isActive = election.status === 'Active';
  const isClosed = election.status === 'Closed';
  const isFinalized = election.status === 'Finalized';
  const isPending = election.status === 'Pending';

  // Pour les actions de l'organisateur
  const canActivate = isPending && election.start_time <= now && election.end_time > now;
  const shouldClose = (isActive || isPending) && election.end_time < now;
  const canAddCandidates = isPending && election.end_time > now;

  // Vérifier si l'utilisateur a déjà voté (standard OU privé)
  useEffect(() => {
    if (isActive && address) {
      checkHasVoted(election.id).then(voted => {
        // Combiner vote standard ET vote privé
        setAlreadyVoted(voted || hasVotedPrivately);
      });
    } else if (isActive) {
      // Si pas d'adresse, vérifier seulement le vote privé
      setAlreadyVoted(hasVotedPrivately);
    }
  }, [isActive, address, election.id, hasVotedPrivately]);

  // Vérifier si l'utilisateur est inscrit (pour les élections avec inscription obligatoire)
  useEffect(() => {
    if (election.requires_registration && address) {
      setCheckingRegistration(true);
      checkRegistration(election.id, address).then(registered => {
        setIsRegistered(registered);
        setCheckingRegistration(false);
      });
    }
  }, [election.requires_registration, election.id, address]);

  // Vérifier si l'utilisateur connecté est l'organisateur (legacy - pour compatibilité)
  const isOrganizer = isOrganizerOrCoOrg;

  // Déterminer le badge à afficher
  const getBadge = () => {
    if (isFinalized) {
      return { text: t('electionCard.status.finalized'), bgClass: 'bg-accent', textClass: 'text-primary' };
    }
    if (isClosed) {
      return { text: t('electionCard.status.closed'), bgClass: 'bg-tertiary', textClass: 'closed-badge' };
    }
    if (isActive) {
      return { text: t('electionCard.status.active'), bgClass: 'bg-success', textClass: 'text-black' };
    }
    if (isUpcoming) {
      return { text: t('electionCard.status.upcoming'), bgClass: 'bg-btn-primary', textClass: 'text-btn-primary' };
    }
    return { text: t('electionCard.status.pending'), bgClass: 'bg-warning', textClass: 'text-black' };
  };

  const badge = getBadge();

  // Formater les dates avec heure
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer le taux de participation
  const participationRate = election.requires_registration && election.registered_voters_count > 0
    ? Math.round((election.total_votes / election.registered_voters_count) * 100)
    : election.num_candidates > 0
    ? Math.min(Math.round((election.total_votes / (election.num_candidates * 100)) * 100), 100)
    : 0;

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') {
      return;
    }
    navigate(RouteNamesEnum.electionDetail.replace(':id', election.id.toString()));
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(RouteNamesEnum.electionDetail.replace(':id', election.id.toString()));
  };

  const handleAddCandidate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(RouteNamesEnum.addCandidate.replace(':electionId', election.id.toString()));
  };

  const handleActivate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (election.num_candidates < 2) {
      alert(t('electionCard.actions.needMinCandidates') || 'Vous devez avoir au moins 2 candidats pour activer l\'élection');
      return;
    }

    setIsActivating(true);
    try {
      const result = await activateElection(election.id);
      console.log('Activation result:', result);

      // Ouvrir la modal de progression avec le hash de transaction
      setActivationTxHash(result.transactionHash);
      setShowActivationModal(true);
    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
      alert(t('electionCard.actions.activationError') || 'Erreur lors de l\'activation de l\'élection');
      setIsActivating(false);
    }
  };

  const handleActivationSuccess = () => {
    // Recharger la page pour voir les changements
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleCloseActivationModal = () => {
    setShowActivationModal(false);
    setActivationTxHash(undefined);
    setIsActivating(false);
  };

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(RouteNamesEnum.vote.replace(':id', election.id.toString()));
  };

  const handleRegister = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Rediriger vers la page de détails pour s'inscrire avec un code d'invitation
    navigate(RouteNamesEnum.electionDetail.replace(':id', election.id.toString()));
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <div
      className="relative bg-secondary border-2 border-secondary vibe-border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden flex flex-col h-full"
      onClick={handleClick}
    >
      {/* Image de l'élection */}
      {imageUrl && (
        <div className="relative w-full h-48 bg-tertiary overflow-hidden">
          <img
            src={imageUrl}
            alt={election.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // En cas d'erreur, on cache l'image
              e.currentTarget.parentElement!.style.display = 'none';
            }}
          />
          {/* Badge de statut sur l'image */}
          <div className={`absolute top-4 right-4 ${badge.bgClass} ${badge.textClass} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg`}>
            {badge.text}
          </div>
        </div>
      )}

      {/* Badge de statut (si pas d'image) */}
      {!imageUrl && (
        <div className={`absolute top-4 right-4 ${badge.bgClass} ${badge.textClass} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide z-10 shadow-md`}>
          {badge.text}
        </div>
      )}

      {/* Contenu principal */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary pr-32 line-clamp-2 leading-tight">
          {election.title}
        </h2>

        {/* Description depuis IPFS */}
        {electionMetadata?.description && (
          <p className="text-sm text-secondary line-clamp-2">
            {electionMetadata.description}
          </p>
        )}

        {/* Catégorie et Type de chiffrement */}
        <div className="flex flex-wrap items-center gap-2">
          {electionMetadata?.metadata?.category && (
            <span className="inline-block px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-xs font-semibold">
              {electionMetadata.metadata.category === 'presidential' && `🏛️ ${t('createElection.form.categories.presidential')}`}
              {electionMetadata.metadata.category === 'legislative' && `📜 ${t('createElection.form.categories.legislative')}`}
              {electionMetadata.metadata.category === 'local' && `🏘️ ${t('createElection.form.categories.local')}`}
              {electionMetadata.metadata.category === 'referendum' && `🗳️ ${t('createElection.form.categories.referendum')}`}
              {electionMetadata.metadata.category === 'association' && `🤝 ${t('createElection.form.categories.association')}`}
              {electionMetadata.metadata.category === 'other' && `📋 ${t('createElection.form.categories.other')}`}
            </span>
          )}
          <EncryptionTypeBadge encryptionType={election.encryption_type} size="small" />
        </div>

        {/* Informations */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary font-medium">{t('electionCard.startDate')}</span>
            <span className="text-primary font-semibold">{formatDateTime(election.start_time)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary font-medium">{t('electionCard.endDate')}</span>
            <span className="text-primary font-semibold">{formatDateTime(election.end_time)}</span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-primary rounded-lg">
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl font-bold text-primary">{election.num_candidates}</span>
            <span className="text-xs text-secondary uppercase tracking-wide">{election.num_candidates > 1 ? t('electionCard.candidates_plural') : t('electionCard.candidates')}</span>
          </div>

          {/* Afficher les inscrits si l'élection requiert l'inscription */}
          {election.requires_registration ? (
            <>
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl font-bold text-primary">{election.registered_voters_count}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{t('electionCard.registered')}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl font-bold text-primary">{election.total_votes}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{election.total_votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl font-bold text-primary">{election.total_votes}</span>
              <span className="text-xs text-secondary uppercase tracking-wide">{election.total_votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</span>
            </div>
          )}

          {/* Afficher le taux de participation seulement si approprié */}
          {((election.requires_registration && election.registered_voters_count > 0) || (!election.requires_registration && election.total_votes > 0)) && (
            <div className="flex flex-col items-center text-center col-span-2 md:col-span-3">
              <span className="text-2xl font-bold text-primary">{participationRate}%</span>
              <span className="text-xs text-secondary uppercase tracking-wide">{t('electionCard.participation')}</span>
            </div>
          )}
        </div>

        {/* Barre de progression pour les élections actives */}
        {isActive && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-secondary font-medium">
              <span>{t('electionCard.timeRemaining')}</span>
              <span className="text-primary font-semibold">
                {Math.ceil((election.end_time - now) / 86400)} {Math.ceil((election.end_time - now) / 86400) > 1 ? t('electionCard.days') : t('electionCard.day')}
              </span>
            </div>
            <div className="h-1.5 bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((now - election.start_time) / (election.end_time - election.start_time)) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Organisateur */}
        <div className="flex items-center gap-2 text-xs pt-3 border-t border-secondary mt-auto">
          {isPrimaryOrganizer ? (
            <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-500 rounded-lg text-amber-800 dark:text-amber-200 font-bold">
              {t('electionCard.youAreOrganizer')}
            </span>
          ) : isCoOrganizerStatus ? (
            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-500 rounded-lg text-purple-800 dark:text-purple-200 font-bold">
              {t('electionCard.youAreCoOrganizer') || 'Vous êtes co-organisateur'}
            </span>
          ) : (
            <>
              <span className="text-secondary font-medium">{t('electionCard.organizedBy')}</span>
              <span className="text-primary font-mono text-xs bg-primary px-2 py-1 rounded" title={election.organizer}>
                {formatAddress(election.organizer)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 pt-0 border-t border-secondary bg-primary flex flex-col gap-2">
        {/* Boutons pour l'organisateur - Élection en attente non expirée */}
        {isOrganizerOrCoOrg && canAddCandidates && (
          <>
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 px-4 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
                onClick={handleAddCandidate}
              >
                {t('electionCard.actions.addCandidates')}
              </button>
              {/* Activate button - Primary organizer only */}
              {isPrimaryOrganizer && canActivate && (
                <button
                  className="flex-1 bg-btn-primary text-btn-primary px-4 py-2 rounded-lg hover:bg-btn-hover transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleActivate}
                  disabled={election.num_candidates < 2 || isActivating}
                >
                  {isActivating ? t('electionCard.actions.activating') || 'Activation...' : t('electionCard.actions.activateElection')}
                  {!isActivating && election.num_candidates < 2 && ` ${t('electionCard.actions.activateMinCandidates', { count: election.num_candidates })}`}
                </button>
              )}
            </div>
            <button
              className="w-full px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
              onClick={handleViewDetails}
            >
              {t('electionCard.actions.viewDetails')}
            </button>
          </>
        )}

        {/* Bouton pour l'organisateur PRINCIPAL UNIQUEMENT - Élection expirée (Pending ou Active) */}
        {isPrimaryOrganizer && shouldClose && (
          <div className="w-full space-y-2">
            <div className="text-xs text-center px-2 py-1 bg-orange-500 bg-opacity-20 border border-orange-500 rounded text-primary font-bold">
              {t('electionCard.actions.expiredWarning')}
            </div>
            <button
              className="w-full px-6 py-2 bg-error text-white border-2 border-error rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-sm"
              onClick={handleViewDetails}
            >
              {t('electionCard.actions.closeOnBlockchain')}
            </button>
          </div>
        )}

        {/* Bouton pour l'organisateur PRINCIPAL UNIQUEMENT - Élection fermée (à finaliser) */}
        {isPrimaryOrganizer && isClosed && !isFinalized && (
          <div className="w-full space-y-2">
            <div className="text-xs text-center px-2 py-1 bg-accent bg-opacity-10 border-2 border-accent rounded">
              <span className="text-accent font-bold">ℹ️ {t('electionCard.actions.needsFinalization')}</span>
            </div>
            <button
              className="w-full bg-btn-primary text-btn-primary px-6 py-2 rounded-lg hover:bg-btn-hover transition-colors font-semibold text-sm"
              onClick={handleViewDetails}
            >
              ✅ {t('electionCard.actions.finalizeOnBlockchain')}
            </button>
          </div>
        )}

        {/* Registration section - For pending elections with registration required */}
        {isPending && election.requires_registration && !shouldClose && (
          <div className="w-full space-y-2">
            {isRegistered ? (
              <div className="w-full px-4 py-2 bg-success bg-opacity-10 border-2 border-success rounded-lg text-center">
                <span className="text-black font-semibold text-sm">✓ {t('electionCard.registered')}</span>
              </div>
            ) : (
              <>
                <div className="text-xs text-center px-2 py-1 bg-accent bg-opacity-10 border-2 border-accent rounded space-y-1">
                  <p className="text-primary font-bold">🔐 {t('electionCard.registrationRequired')}</p>
                  <p className="text-secondary text-[10px]">{t('electionCard.registrationHint') || 'Code d\'invitation requis'}</p>
                </div>
                <button
                  onClick={handleRegister}
                  disabled={!address}
                  className="w-full bg-btn-primary text-btn-primary px-4 py-2 rounded-lg hover:bg-btn-hover transition-colors font-semibold text-sm disabled:opacity-50"
                >
                  🎫 {t('electionCard.registerWithCode') || 'S\'inscrire avec un code'}
                </button>
              </>
            )}
            {/* Bouton "Voir les détails" seulement pour les non-organisateurs (l'organisateur a déjà ce bouton dans sa section) */}
            {!isOrganizerOrCoOrg && (
              <button
                className="w-full px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
                onClick={handleViewDetails}
              >
                {t('electionCard.actions.viewDetails')}
              </button>
            )}
          </div>
        )}

        {/* Boutons pour les élections actives non expirées */}
        {isActive && !shouldClose && (
          <>
            {alreadyVoted ? (
              <div className="w-full px-6 py-3 bg-success text-white rounded-lg font-semibold text-center uppercase tracking-wide shadow-md">
                {t('electionCard.actions.alreadyVoted')}
              </div>
            ) : election.requires_registration && !isRegistered ? (
              <div className="w-full space-y-2">
                <div className="w-full px-6 py-3 bg-tertiary border-2 border-secondary rounded-lg font-semibold text-center text-secondary">
                  {t('electionCard.notRegistered')}
                </div>
              </div>
            ) : (
              <button
                className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold uppercase tracking-wide btn-vote"
                onClick={handleVote}
              >
                {t('electionCard.actions.voteNow')}
              </button>
            )}
            <button
              className="w-full px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
              onClick={handleViewDetails}
            >
              {t('electionCard.actions.viewDetails')}
            </button>
          </>
        )}

        {/* Bouton détails par défaut */}
        {!isActive && (!isOrganizerOrCoOrg || !isPending) && !shouldClose && !(isPending && election.requires_registration) && (
          <button
            className="w-full px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm btn-results"
            onClick={handleViewDetails}
          >
            {isFinalized || isClosed ? t('electionCard.actions.viewResults') : t('electionCard.actions.viewDetails')}
          </button>
        )}

        {/* Bouton détails pour élections expirées (non-organisateur principal) */}
        {isActive && shouldClose && !isPrimaryOrganizer && (
          <button
            className="w-full px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm btn-results"
            onClick={handleViewDetails}
          >
            {t('electionCard.actions.viewDetails')}
          </button>
        )}
      </div>

      {/* Modal de progression de l'activation */}
      <TransactionProgressModal
        isOpen={showActivationModal}
        transactionHash={activationTxHash}
        title={t('electionDetail.activating') || 'Activation en cours'}
        onClose={handleCloseActivationModal}
        onSuccess={handleActivationSuccess}
      />
    </div>
  );
};
