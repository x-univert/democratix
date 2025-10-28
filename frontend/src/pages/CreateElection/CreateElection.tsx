import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useCreateElection } from 'hooks/transactions';
import { ipfsService, type ElectionMetadata } from '../../services/ipfsService';
import { useGetAccount } from 'lib';
import { ConfirmModal } from 'components';

export const CreateElection = () => {
  const navigate = useNavigate();
  const { createElection } = useCreateElection();
  const { address } = useGetAccount();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAddCandidate = () => {
    setCandidates([...candidates, '']);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleCandidateChange = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        alert(t('createElection.errors.invalidImage') || 'Veuillez sélectionner une image valide');
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('createElection.errors.imageTooLarge') || 'L\'image ne doit pas dépasser 5MB');
        return;
      }
      setImageFile(file);
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !startDate || !endDate) {
      alert(t('createElection.errors.fillRequired') || 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (candidates.filter(c => c.trim() !== '').length < 2) {
      alert(t('createElection.errors.minCandidates') || 'Vous devez avoir au moins 2 candidats');
      return;
    }

    // Validation des timestamps
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    const nowTimestamp = Math.floor(Date.now() / 1000);

    if (startTimestamp <= nowTimestamp) {
      alert(t('createElection.errors.startDateFuture') || 'La date de début doit être dans le futur');
      return;
    }
    if (endTimestamp <= startTimestamp) {
      alert(t('createElection.errors.endDateAfterStart') || 'La date de fin doit être après la date de début');
      return;
    }

    // Ouvrir la modale de confirmation
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // Convertir les dates en timestamp Unix (secondes)
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      // Uploader sur IPFS
      setUploadingToIPFS(true);
      let ipfsHash: string;

      try {
        // 1. Upload de l'image sur IPFS (si présente)
        let imageIPFS: string | undefined;
        if (imageFile) {
          console.log('Upload de l\'image sur IPFS...');
          imageIPFS = await ipfsService.uploadFile(imageFile);
          console.log('Image uploadée sur IPFS:', imageIPFS);
        }

        // 2. Créer les métadonnées de l'élection
        const metadata: ElectionMetadata = {
          title,
          description,
          image: imageIPFS,
          organizer: address || '',
          metadata: {
            category: category || undefined,
            createdAt: new Date().toISOString(),
          }
        };

        // 3. Upload des métadonnées sur IPFS
        console.log('Upload des métadonnées sur IPFS...');
        ipfsHash = await ipfsService.uploadElectionMetadata(metadata);
        console.log('Métadonnées uploadées sur IPFS:', ipfsHash);
      } catch (ipfsError) {
        console.error('Erreur lors de l\'upload IPFS:', ipfsError);
        alert(t('createElection.errors.ipfsUpload') || 'Erreur lors de l\'upload sur IPFS. Vérifiez votre connexion internet.');
        setIsSubmitting(false);
        setUploadingToIPFS(false);
        return;
      } finally {
        setUploadingToIPFS(false);
      }

      // Appeler le smart contract avec le hash IPFS
      await createElection(
        title,
        ipfsHash,
        startTimestamp,
        endTimestamp
      );

      // TODO: Après création, il faudrait ajouter les candidats avec addCandidate
      // Pour chaque candidat: await addCandidate(electionId, candidateName, candidateDescriptionIPFS)

      // Rediriger vers la liste des élections
      navigate(RouteNamesEnum.elections);
    } catch (error) {
      console.error('Erreur lors de la création de l\'élection:', error);
      alert(t('createElection.errors.createElection') || 'Erreur lors de la création de l\'élection. Vérifiez que vous êtes connecté.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(RouteNamesEnum.elections)}
          className="text-accent hover:text-link mb-4"
        >
          ← {t('electionDetail.backToElections')}
        </button>

        <h1 className="text-4xl font-bold mb-2 text-primary">{t('createElection.title')}</h1>
        <p className="text-secondary">
          {t('createElection.subtitle') || 'Remplissez les informations pour créer une nouvelle élection'}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-secondary rounded-lg shadow-md p-8 border-2 border-secondary vibe-border">
        {/* Titre */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.electionTitle')} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('createElection.form.titlePlaceholder') || "Ex: Élection présidentielle 2025"}
            className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.description')} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('createElection.form.descriptionPlaceholder') || "Décrivez l'objectif et les règles de cette élection..."}
            rows={5}
            className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        {/* Image (optionnel) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.image')}
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:cursor-pointer hover:file:bg-accent-hover"
              />
              <p className="text-xs text-secondary mt-1">
                {t('createElection.form.imageHint')}
              </p>
            </div>
            {imagePreview && (
              <div className="relative w-32 h-32 border-2 border-accent rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-opacity-80"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Catégorie (optionnel) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.category')}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">{t('createElection.form.categoryPlaceholder')}</option>
            <option value="presidential">{t('createElection.form.categories.presidential')}</option>
            <option value="legislative">{t('createElection.form.categories.legislative')}</option>
            <option value="local">{t('createElection.form.categories.local')}</option>
            <option value="referendum">{t('createElection.form.categories.referendum')}</option>
            <option value="association">{t('createElection.form.categories.association')}</option>
            <option value="other">{t('createElection.form.categories.other')}</option>
          </select>
        </div>

        {/* Date de début */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.startDate')} *
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
          <p className="text-xs text-secondary mt-1">
            {t('createElection.form.startDateHint')}
          </p>
        </div>

        {/* Date de fin */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.endDate')} *
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().slice(0, 16)}
            className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
          <p className="text-xs text-secondary mt-1">
            {t('createElection.form.endDateHint')}
          </p>
        </div>

        {/* Candidats */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-primary">
            {t('createElection.form.candidates')} * ({t('createElection.form.candidatesMinimum')})
          </label>

          {candidates.map((candidate, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={candidate}
                onChange={(e) => handleCandidateChange(index, e.target.value)}
                placeholder={t('createElection.form.candidatePlaceholder', { number: index + 1 })}
                className="flex-1 p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {candidates.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCandidate(index)}
                  className="px-4 py-2 text-error border border-error rounded-lg hover:bg-tertiary"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddCandidate}
            className="mt-2 text-accent hover:text-link"
          >
            + {t('createElection.form.addCandidate')}
          </button>
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(RouteNamesEnum.elections)}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border border-secondary text-secondary rounded-lg hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('createElection.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadingToIPFS}
            className="flex-1 bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadingToIPFS && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {uploadingToIPFS ? t('createElection.form.uploadingToIPFS') : isSubmitting ? t('createElection.form.creatingOnBlockchain') : t('createElection.form.createButton')}
          </button>
        </div>

        {/* Info IPFS */}
        {(uploadingToIPFS || isSubmitting) && (
          <div className="mt-4 p-4 bg-accent bg-opacity-10 border-2 border-accent rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">
                  {uploadingToIPFS && `📤 ${t('createElection.info.uploadingIPFS')}`}
                  {!uploadingToIPFS && isSubmitting && `⛓️ ${t('createElection.info.sendingTransaction')}`}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {uploadingToIPFS && t('createElection.info.uploadingIPFSHint')}
                  {!uploadingToIPFS && isSubmitting && t('createElection.info.sendingTransactionHint')}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmModal(false)}
        title={t('createElection.confirmModal.title')}
        message={t('createElection.confirmModal.message', { electionTitle: title })}
        confirmText={t('createElection.confirmModal.confirm')}
        cancelText={t('createElection.confirmModal.cancel')}
        type="info"
      />
    </div>
  );
};
