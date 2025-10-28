import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAddCandidate } from 'hooks/transactions';
import { useGetElection } from 'hooks/elections';
import { RouteNamesEnum } from 'localConstants';
import { ipfsService, type CandidateMetadata } from '../../services/ipfsService';
import { ConfirmModal } from 'components';

export const AddCandidate = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addCandidate } = useAddCandidate();
  const { getElection } = useGetElection();

  const [candidateName, setCandidateName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [party, setParty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [nextCandidateId, setNextCandidateId] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Récupérer l'élection pour obtenir le nombre actuel de candidats
  useEffect(() => {
    const fetchElection = async () => {
      if (!electionId) return;

      try {
        const election = await getElection(parseInt(electionId));
        if (election) {
          // L'ID du prochain candidat = nombre actuel de candidats
          setNextCandidateId(election.num_candidates);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'élection:', error);
      }
    };

    fetchElection();
  }, [electionId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        alert(t('addCandidate.errors.invalidImage'));
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('addCandidate.errors.imageTooLarge'));
        return;
      }

      setImageFile(file);

      // Créer un preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!electionId) return;
    if (!candidateName.trim()) {
      alert(t('addCandidate.errors.nameRequired') || 'Le nom du candidat est requis');
      return;
    }

    // Ouvrir la modale de confirmation
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    if (!electionId) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setUploadingToIPFS(true);

    try {
      // 1. Upload image to IPFS if present
      let imageIPFS: string | undefined;
      if (imageFile) {
        console.log('Upload de l\'image sur IPFS...');
        imageIPFS = await ipfsService.uploadFile(imageFile);
        console.log('Image uploadée:', imageIPFS);
      }

      // 2. Create candidate metadata
      const metadata: CandidateMetadata = {
        name: candidateName,
        biography: description,
        image: imageIPFS,
        links: {
          website: website || undefined,
          twitter: twitter || undefined,
        },
        metadata: {
          party: party || undefined,
        }
      };

      // 3. Upload metadata to IPFS
      console.log('Upload des métadonnées sur IPFS...');
      const ipfsHash = await ipfsService.uploadCandidateMetadata(metadata);
      console.log('Métadonnées uploadées:', ipfsHash);

      setUploadingToIPFS(false);

      // 4. Call smart contract with IPFS hash
      await addCandidate(
        parseInt(electionId),
        nextCandidateId,
        candidateName,
        ipfsHash
      );

      // Rediriger vers les détails de l'élection
      navigate(`/election/${electionId}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du candidat:', error);
      alert(t('addCandidate.errors.addError'));
      setIsSubmitting(false);
      setUploadingToIPFS(false);
    }
  };

  const handleCancel = () => {
    navigate(`/election/${electionId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">
          {t('addCandidate.title')}
        </h1>
        <p className="text-secondary">
          {t('addCandidate.subtitle')}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom du candidat */}
        <div>
          <label className="block text-primary font-medium mb-2">
            {t('addCandidate.form.name')} *
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder={t('addCandidate.form.namePlaceholder')}
            className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary transition-colors"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Image du candidat */}
        <div>
          <label className="block text-primary font-medium mb-2">
            {t('addCandidate.form.photo')}
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-primary file:font-semibold hover:file:bg-opacity-80"
              disabled={isSubmitting}
            />
            {imagePreview && (
              <div className="relative w-full h-48 border-2 border-secondary rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-error text-white p-2 rounded-full hover:bg-opacity-80 transition-colors"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            )}
            <p className="text-sm text-tertiary">
              {t('addCandidate.form.photoHint')}
            </p>
          </div>
        </div>

        {/* Description / Programme */}
        <div>
          <label className="block text-primary font-medium mb-2">
            {t('addCandidate.form.biography')} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('addCandidate.form.biographyPlaceholder')}
            className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary h-40 resize-y transition-colors"
            required
            disabled={isSubmitting}
          />
          <p className="text-sm text-tertiary mt-1">
            {t('addCandidate.form.biographyHint')}
          </p>
        </div>

        {/* Informations supplémentaires */}
        <div className="border-2 border-secondary rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-primary mb-3">
            {t('addCandidate.form.additionalInfo')}
          </h3>

          {/* Parti politique */}
          <div>
            <label className="block text-primary font-medium mb-2">
              {t('addCandidate.form.party')}
            </label>
            <input
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder={t('addCandidate.form.partyPlaceholder')}
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Site web */}
          <div>
            <label className="block text-primary font-medium mb-2">
              {t('addCandidate.form.website')}
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('addCandidate.form.websitePlaceholder')}
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Twitter/X */}
          <div>
            <label className="block text-primary font-medium mb-2">
              {t('addCandidate.form.twitter')}
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder={t('addCandidate.form.twitterPlaceholder')}
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-accent bg-secondary text-primary transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Indicateur de progression IPFS */}
        {uploadingToIPFS && (
          <div className="p-4 border-2 border-accent rounded-lg bg-accent bg-opacity-10">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
              <span className="text-accent font-medium">
                {t('addCandidate.form.uploadingToIPFS')}
              </span>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border-2 border-secondary text-primary rounded-lg hover:bg-tertiary transition-colors font-medium"
            disabled={isSubmitting}
          >
            {t('addCandidate.form.cancel')}
          </button>

          <button
            type="submit"
            className="flex-1 bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {uploadingToIPFS ? t('addCandidate.form.uploadingIPFS') : isSubmitting ? t('addCandidate.form.submitting') : t('addCandidate.form.submit')}
          </button>
        </div>
      </form>

      {/* Note d'information */}
      <div className="mt-8 p-4 border-2 border-secondary rounded-lg bg-secondary">
        <h3 className="font-semibold text-primary mb-2">ℹ️ {t('addCandidate.info.title')}</h3>
        <ul className="text-sm text-secondary space-y-1">
          <li>• {t('addCandidate.info.organizerOnly')}</li>
          <li>• {t('addCandidate.info.pendingOnly')}</li>
          <li>• {t('addCandidate.info.noAddAfterActivation')}</li>
        </ul>
      </div>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmAdd}
        onCancel={() => setShowConfirmModal(false)}
        title={t('addCandidate.confirmModal.title')}
        message={t('addCandidate.confirmModal.message', { candidateName })}
        confirmText={t('addCandidate.confirmModal.confirm')}
        cancelText={t('addCandidate.confirmModal.cancel')}
        type="info"
      />
    </div>
  );
};
