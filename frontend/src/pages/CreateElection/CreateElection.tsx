import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useCreateElection } from 'hooks/transactions';
import { useAddCandidate } from 'hooks/transactions';
import { ipfsService, type ElectionMetadata, type CandidateMetadata } from '../../services/ipfsService';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { ConfirmModal } from 'components';
import { ProgressTracker } from 'components/ProgressTracker';
import { votingContract } from 'config';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

// Interface pour les données complètes d'un candidat
interface CandidateFormData {
  name: string;
  biography: string;
  imageFile: File | null;
  imagePreview: string | null;
  party: string;
  website: string;
  twitter: string;
}

export const CreateElection = () => {
  const navigate = useNavigate();
  const { createElection } = useCreateElection();
  const { addCandidate } = useAddCandidate();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Remplacer le tableau simple par des données complètes
  const [candidates, setCandidates] = useState<CandidateFormData[]>([
    { name: '', biography: '', imageFile: null, imagePreview: null, party: '', website: '', twitter: '' },
    { name: '', biography: '', imageFile: null, imagePreview: null, party: '', website: '', twitter: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  const handleAddCandidate = () => {
    setCandidates([
      ...candidates,
      { name: '', biography: '', imageFile: null, imagePreview: null, party: '', website: '', twitter: '' }
    ]);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
      if (expandedCandidate === index) {
        setExpandedCandidate(null);
      }
    }
  };

  const handleCandidateFieldChange = (index: number, field: keyof CandidateFormData, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = { ...newCandidates[index], [field]: value };
    setCandidates(newCandidates);
  };

  const handleCandidateImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('addCandidate.errors.invalidImage') || 'Veuillez sélectionner une image valide');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t('addCandidate.errors.imageTooLarge') || 'L\'image ne doit pas dépasser 5MB');
        return;
      }

      const newCandidates = [...candidates];
      newCandidates[index].imageFile = file;

      const reader = new FileReader();
      reader.onloadend = () => {
        newCandidates[index].imagePreview = reader.result as string;
        setCandidates([...newCandidates]);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCandidateExpanded = (index: number) => {
    setExpandedCandidate(expandedCandidate === index ? null : index);
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

    // Valider qu'il y a au moins 2 candidats avec nom et biographie
    const validCandidates = candidates.filter(c => c.name.trim() !== '' && c.biography.trim() !== '');
    if (validCandidates.length < 2) {
      alert(t('createElection.errors.minCandidates') || 'Vous devez avoir au moins 2 candidats avec nom et biographie');
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

    // Initialiser les étapes de progression
    const validCandidates = candidates.filter(c => c.name.trim() !== '' && c.biography.trim() !== '');
    const initialSteps: ProgressStep[] = [
      {
        id: 'upload-ipfs',
        label: t('createElection.progress.uploadIPFS', 'Upload metadata to IPFS'),
        status: 'pending',
      },
      {
        id: 'create-election',
        label: t('createElection.progress.createElection', 'Create election on blockchain'),
        status: 'pending',
      },
      {
        id: 'confirm-election',
        label: t('createElection.progress.confirmElection', 'Waiting for election confirmation'),
        status: 'pending',
      },
      ...validCandidates.map((candidate, index) => ({
        id: `add-candidate-${index}`,
        label: t('createElection.progress.addCandidate', `Add candidate: {{name}}`, { name: candidate.name }),
        status: 'pending' as const,
      }))
    ];

    setProgressSteps(initialSteps);
    setShowProgress(true);

    // Helper function to update step status
    const updateStep = (stepId: string, status: ProgressStep['status'], message?: string) => {
      setProgressSteps(prev => prev.map(step =>
        step.id === stepId ? { ...step, status, message } : step
      ));
    };

    try {
      // Convertir les dates en timestamp Unix (secondes)
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      // Uploader sur IPFS
      updateStep('upload-ipfs', 'in_progress');
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

        updateStep('upload-ipfs', 'completed', `IPFS Hash: ${ipfsHash}`);
      } catch (ipfsError) {
        console.error('Erreur lors de l\'upload IPFS:', ipfsError);
        updateStep('upload-ipfs', 'error', 'Failed to upload to IPFS');
        alert(t('createElection.errors.ipfsUpload') || 'Erreur lors de l\'upload sur IPFS. Vérifiez votre connexion internet.');
        setIsSubmitting(false);
        setUploadingToIPFS(false);
        return;
      } finally {
        setUploadingToIPFS(false);
      }

      // Créer l'élection sur la blockchain
      updateStep('create-election', 'in_progress');
      console.log('Création de l\'élection sur la blockchain...');

      // Convertir la date limite d'inscription si présente
      const deadlineTimestamp = registrationDeadline
        ? Math.floor(new Date(registrationDeadline).getTime() / 1000)
        : null;

      const result = await createElection(
        title,
        ipfsHash,
        startTimestamp,
        endTimestamp,
        requiresRegistration,
        deadlineTimestamp
      );

      updateStep('create-election', 'completed', `TX: ${result.transactionHash?.substring(0, 10)}...`);

      console.log('Transaction result:', result);

      if (!result.transactionHash) {
        throw new Error('No transaction hash returned from createElection');
      }

      const txHash = result.transactionHash;
      console.log('Transaction hash:', txHash);

      // Attendre que la transaction soit confirmée et exécutée
      updateStep('confirm-election', 'in_progress');
      console.log('Attente de confirmation et exécution de la transaction...');
      let nextElectionId: number;
      let txData: any;
      let retries = 0;
      const maxRetries = 10; // Maximum 10 tentatives (30 secondes)

      try {
        // Interroger l'API en boucle jusqu'à ce que la transaction soit exécutée
        const txUrl = `${network.apiAddress}/transactions/${txHash}?withResults=true`;
        console.log('Polling transaction status from:', txUrl);

        while (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3 secondes entre chaque tentative

          const txResponse = await fetch(txUrl);
          if (!txResponse.ok) {
            throw new Error(`HTTP error! status: ${txResponse.status}`);
          }

          txData = await txResponse.json();
          console.log(`Tentative ${retries + 1}/${maxRetries} - Status:`, txData.status);
          updateStep('confirm-election', 'in_progress', `Attempt ${retries + 1}/${maxRetries} - Status: ${txData.status}`);

          // Vérifier si la transaction est exécutée (success ou fail)
          if (txData.status === 'success' || txData.status === 'executed') {
            console.log('Transaction exécutée avec succès!');
            console.log('Transaction data (full):', JSON.stringify(txData, null, 2));
            console.log('Transaction results:', txData.results);
            console.log('Transaction smartContractResults:', txData.smartContractResults);
            console.log('Transaction logs:', txData.logs);
            console.log('Transaction operations:', txData.operations);
            break;
          } else if (txData.status === 'fail' || txData.status === 'invalid') {
            throw new Error(`Transaction failed with status: ${txData.status}`);
          }

          retries++;
        }

        if (retries >= maxRetries) {
          throw new Error('Transaction timeout - not executed after 30 seconds');
        }

        updateStep('confirm-election', 'completed', 'Transaction confirmed');

        // L'ID de l'élection est dans les events (logs), pas dans results
        // Chercher l'event "createElection" ou "electionCreated"
        const logs = txData.logs;
        if (!logs || !logs.events || logs.events.length === 0) {
          throw new Error('No logs/events found in transaction');
        }

        // Trouver l'event qui contient l'ID de l'élection
        const createElectionEvent = logs.events.find(
          (event: any) => event.identifier === 'createElection' || event.identifier === 'electionCreated'
        );

        if (!createElectionEvent) {
          console.error('Available events:', logs.events);
          throw new Error('createElection event not found in transaction logs');
        }

        console.log('createElection event:', createElectionEvent);
        console.log('Event topics:', createElectionEvent.topics);

        // L'ID de l'élection est dans topics[1] (topics[0] = nom de l'event, topics[1] = election_id, topics[2] = organizer)
        if (!createElectionEvent.topics || createElectionEvent.topics.length < 2) {
          throw new Error('Invalid createElection event structure');
        }

        const electionIdBase64 = createElectionEvent.topics[1];
        console.log('Election ID (base64):', electionIdBase64);

        // Décoder le résultat (base64 -> hex -> int)
        const electionIdHex = Buffer.from(electionIdBase64, 'base64').toString('hex');
        console.log('Election ID (hex):', electionIdHex);

        nextElectionId = parseInt(electionIdHex, 16);
        console.log('Election ID from transaction:', nextElectionId);

        if (isNaN(nextElectionId) || nextElectionId <= 0) {
          throw new Error(`Invalid election ID: ${nextElectionId}`);
        }
      } catch (txError) {
        console.error('Erreur lors de la récupération du résultat de transaction:', txError);
        alert('Élection créée, mais impossible de récupérer son ID. Veuillez ajouter les candidats manuellement.');
        setIsSubmitting(false);
        return;
      }

      // Maintenant ajouter les candidats à l'élection (on connaît déjà l'ID)
      console.log(`Ajout des candidats à l'élection #${nextElectionId}...`);
      try {
        const validCandidates = candidates.filter(c => c.name.trim() !== '' && c.biography.trim() !== '');

      for (let i = 0; i < validCandidates.length; i++) {
        const candidate = validCandidates[i];
        const stepId = `add-candidate-${i}`;

        try {
          updateStep(stepId, 'in_progress', 'Uploading to IPFS...');

          // Upload image candidate sur IPFS (si présente)
          let candidateImageIPFS: string | undefined;
          if (candidate.imageFile) {
            console.log(`Upload image candidat ${i + 1} sur IPFS...`);
            candidateImageIPFS = await ipfsService.uploadFile(candidate.imageFile);
            console.log(`Image candidat ${i + 1} uploadée:`, candidateImageIPFS);
          }

          // Créer métadonnées candidat
          const candidateMetadata: CandidateMetadata = {
            name: candidate.name,
            biography: candidate.biography,
            image: candidateImageIPFS,
            links: {
              website: candidate.website || undefined,
              twitter: candidate.twitter || undefined,
            },
            metadata: {
              party: candidate.party || undefined,
            }
          };

          // Upload métadonnées sur IPFS
          console.log(`Upload métadonnées candidat ${i + 1} sur IPFS...`);
          const candidateIpfsHash = await ipfsService.uploadCandidateMetadata(candidateMetadata);
          console.log(`Métadonnées candidat ${i + 1} uploadées:`, candidateIpfsHash);

          updateStep(stepId, 'in_progress', 'Adding to blockchain...');

          // Ajouter le candidat à l'élection
          console.log(`Ajout candidat ${i + 1} à l'élection #${nextElectionId}...`);
          await addCandidate(nextElectionId, i, candidate.name, candidateIpfsHash);
          console.log(`Candidat ${i + 1} ajouté avec succès à l'élection #${nextElectionId}!`);

          updateStep(stepId, 'completed', 'Successfully added');

          // Attendre un peu entre chaque ajout de candidat (6 secondes pour confirmation)
          await new Promise(resolve => setTimeout(resolve, 7000));
        } catch (candidateError) {
          console.error(`Erreur lors de l'ajout du candidat ${i + 1}:`, candidateError);
          updateStep(stepId, 'error', 'Failed to add candidate');
          alert(`Attention: Le candidat "${candidate.name}" n'a pas pu être ajouté. Vous devrez l'ajouter manuellement.`);
        }
      }

        console.log(`Élection #${nextElectionId} créée avec succès avec tous ses candidats!`);
        // Rediriger vers la liste des élections
        navigate(RouteNamesEnum.elections);
      } catch (candidatesError) {
        console.error('Erreur lors de l\'ajout des candidats:', candidatesError);
        alert(`Élection #${nextElectionId} créée, mais impossible d\'ajouter automatiquement les candidats. Veuillez les ajouter manuellement depuis la page de détails de l\'élection.`);
        navigate(RouteNamesEnum.elections);
      }
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

        {/* Inscription obligatoire */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresRegistration}
              onChange={(e) => setRequiresRegistration(e.target.checked)}
              className="w-5 h-5 rounded border-secondary text-accent focus:ring-accent focus:ring-2"
            />
            <div>
              <span className="text-sm font-medium text-primary">
                {t('createElection.form.requiresRegistration')}
              </span>
              <p className="text-xs text-secondary mt-1">
                {t('createElection.form.requiresRegistrationHint')}
              </p>
            </div>
          </label>
        </div>

        {/* Date limite d'inscription (optionnel) */}
        {requiresRegistration && (
          <div className="mb-6 ml-8 bg-primary bg-opacity-5 border border-secondary rounded-lg p-4">
            <label className="block text-sm font-medium mb-2 text-primary">
              {t('createElection.form.registrationDeadline')} ({t('createElection.form.optional')})
            </label>
            <input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              max={startDate}
              className="w-full p-3 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-secondary mt-1">
              ⚠️ {t('createElection.form.registrationDeadlineHint') || 'La date limite d\'inscription doit être AVANT la date de début du vote'}
            </p>
          </div>
        )}

        {/* Candidats - Formulaire complet */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-4 text-primary">
            {t('createElection.form.candidates')} * ({t('createElection.form.candidatesMinimum')})
          </label>

          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <div key={index} className="border-2 border-secondary rounded-lg p-4 bg-secondary">
                {/* Header du candidat avec bouton expand/collapse */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => toggleCandidateExpanded(index)}
                    className="flex-1 text-left font-semibold text-primary hover:text-accent transition-colors"
                  >
                    {candidate.name || `${t('createElection.form.candidatePlaceholder', { number: index + 1 })}`}
                    <span className="ml-2 text-sm text-secondary">
                      {expandedCandidate === index ? '▼' : '▶'}
                    </span>
                  </button>
                  {candidates.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidate(index)}
                      className="ml-4 px-3 py-1 text-error border border-error rounded-lg hover:bg-tertiary text-sm"
                    >
                      ✕ Supprimer
                    </button>
                  )}
                </div>

                {/* Formulaire candidat (collapsible) */}
                {expandedCandidate === index && (
                  <div className="space-y-4 pt-2 border-t-2 border-tertiary">
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-primary">
                        {t('addCandidate.form.name')} *
                      </label>
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => handleCandidateFieldChange(index, 'name', e.target.value)}
                        placeholder={t('addCandidate.form.namePlaceholder')}
                        className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Photo */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-primary">
                        {t('addCandidate.form.photo')}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCandidateImageChange(index, e)}
                        className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent file:text-white file:cursor-pointer hover:file:bg-opacity-80"
                        disabled={isSubmitting}
                      />
                      {candidate.imagePreview && (
                        <div className="mt-2 relative w-32 h-32 border-2 border-accent rounded-lg overflow-hidden">
                          <img src={candidate.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const newCandidates = [...candidates];
                              newCandidates[index].imageFile = null;
                              newCandidates[index].imagePreview = null;
                              setCandidates(newCandidates);
                            }}
                            className="absolute top-1 right-1 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-opacity-80"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Biographie */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-primary">
                        {t('addCandidate.form.biography')} *
                      </label>
                      <textarea
                        value={candidate.biography}
                        onChange={(e) => handleCandidateFieldChange(index, 'biography', e.target.value)}
                        placeholder={t('addCandidate.form.biographyPlaceholder')}
                        className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-y"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Informations supplémentaires (collapsible) */}
                    <details className="border border-secondary rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary">
                        {t('addCandidate.form.additionalInfo')} (optionnel)
                      </summary>
                      <div className="mt-3 space-y-3">
                        {/* Parti */}
                        <div>
                          <label className="block text-xs font-medium mb-1 text-secondary">
                            {t('addCandidate.form.party')}
                          </label>
                          <input
                            type="text"
                            value={candidate.party}
                            onChange={(e) => handleCandidateFieldChange(index, 'party', e.target.value)}
                            placeholder={t('addCandidate.form.partyPlaceholder')}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Site web */}
                        <div>
                          <label className="block text-xs font-medium mb-1 text-secondary">
                            {t('addCandidate.form.website')}
                          </label>
                          <input
                            type="url"
                            value={candidate.website}
                            onChange={(e) => handleCandidateFieldChange(index, 'website', e.target.value)}
                            placeholder={t('addCandidate.form.websitePlaceholder')}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Twitter */}
                        <div>
                          <label className="block text-xs font-medium mb-1 text-secondary">
                            {t('addCandidate.form.twitter')}
                          </label>
                          <input
                            type="text"
                            value={candidate.twitter}
                            onChange={(e) => handleCandidateFieldChange(index, 'twitter', e.target.value)}
                            placeholder={t('addCandidate.form.twitterPlaceholder')}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCandidate}
            className="mt-4 px-4 py-2 text-accent border-2 border-accent rounded-lg hover:bg-accent hover:text-white transition-colors"
            disabled={isSubmitting}
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

      {/* Progress Tracker */}
      {showProgress && progressSteps.length > 0 && (
        <div className="mt-8">
          <ProgressTracker steps={progressSteps} />
        </div>
      )}

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
