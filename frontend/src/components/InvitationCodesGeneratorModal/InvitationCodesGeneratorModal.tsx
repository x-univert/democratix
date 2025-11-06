import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetNetworkConfig, useGetAccount } from 'lib';
import { useGenerateInvitationCodes } from '../../hooks/transactions';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';
import { votingContract } from '../../config';

interface InvitationCodesGeneratorModalProps {
  isOpen: boolean;
  electionId: number;
  organizerAddress: string;
  onClose: () => void;
}

export const InvitationCodesGeneratorModal = ({
  isOpen,
  electionId,
  organizerAddress,
  onClose
}: InvitationCodesGeneratorModalProps) => {
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();
  const { generateCodes, generateCodesBatch } = useGenerateInvitationCodes();

  const [count, setCount] = useState('100');
  const [invitationCodes, setInvitationCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [pendingTxHashes, setPendingTxHashes] = useState<string[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [accumulatedCodes, setAccumulatedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedCodes, setExpandedCodes] = useState<Set<number>>(new Set());
  const processedTxHashes = useRef<Set<string>>(new Set());
  const processedReturnData = useRef<Set<string>>(new Set());

  // Email sending state
  const [emailText, setEmailText] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailResults, setEmailResults] = useState<any>(null);

  const { result: txResult } = useTransactionWatcher(pendingTxHash);

  // Watch for transaction completion and extract invitation codes
  useEffect(() => {
    if (!pendingTxHash) return;

    console.log('🔍 Codes Generator - useEffect txResult:', {
      isCompleted: txResult.isCompleted,
      isSuccess: txResult.isSuccess,
      returnDataLength: txResult.returnData.length,
      currentBatchIndex,
      totalBatches,
      pendingTxHash
    });

    // Skip if already processed this transaction
    if (processedTxHashes.current.has(pendingTxHash)) {
      console.log('⏭️ Codes Generator - Transaction already processed, skipping:', pendingTxHash);
      return;
    }

    if (txResult.isCompleted && txResult.isSuccess && txResult.returnData.length > 0) {
      // Create a unique signature for this returnData to detect if we've processed it before
      const returnDataSignature = txResult.returnData.slice(0, 3).join('-');

      if (processedReturnData.current.has(returnDataSignature)) {
        console.log('⏭️ Codes Generator - Return data already processed (stale cache), skipping');
        return;
      }

      // Mark transaction and return data as processed
      processedTxHashes.current.add(pendingTxHash);
      processedReturnData.current.add(returnDataSignature);
      console.log(`✅ Codes Generator - Batch ${currentBatchIndex + 1}/${totalBatches} completed, extracting codes...`);
      console.log('📦 Codes Generator - Return data length:', txResult.returnData.length);

      try {
        // Extract invitation codes from transaction return data
        const codesHex: string[] = [];

        for (const code of txResult.returnData) {
          const codeString = typeof code === 'string' ? code : '';
          if (!codeString) continue;

          // Codes are already in hex-string format
          if (codeString.length >= 64) {
            codesHex.push(codeString.toLowerCase());
          }
        }

        console.log(`✅ Codes Generator - Batch ${currentBatchIndex + 1}/${totalBatches} - Extracted ${codesHex.length} codes from transaction`);

        // Accumulate codes and deduplicate
        const allCodes = [...accumulatedCodes, ...codesHex];
        const newAccumulatedCodes = Array.from(new Set(allCodes));

        if (newAccumulatedCodes.length < allCodes.length) {
          console.warn(`⚠️ Codes Generator - Removed ${allCodes.length - newAccumulatedCodes.length} duplicate codes`);
        }

        setAccumulatedCodes(newAccumulatedCodes);
        console.log(`📊 Codes Generator - Total unique codes accumulated: ${newAccumulatedCodes.length}`);

        // Check if there are more batches to process
        if (currentBatchIndex + 1 < pendingTxHashes.length) {
          // Move to next batch
          const nextIndex = currentBatchIndex + 1;
          setCurrentBatchIndex(nextIndex);
          console.log(`🔄 Codes Generator - Moving to batch ${nextIndex + 1}/${totalBatches}`);

          // Set next transaction hash to watch
          setPendingTxHash(pendingTxHashes[nextIndex]);
        } else {
          // All batches completed, set invitation codes
          console.log(`\n✅ Codes Generator - All ${totalBatches} batches completed. Total codes: ${newAccumulatedCodes.length}`);

          setInvitationCodes(newAccumulatedCodes);
          setIsGenerating(false);
          setCurrentBatchIndex(0);
          setTotalBatches(0);
          setPendingTxHash(null);
          setPendingTxHashes([]);
          setAccumulatedCodes([]);
          processedTxHashes.current = new Set();
          processedReturnData.current = new Set();

          console.log('✅ Codes Generator - All invitation codes extracted successfully');
        }
      } catch (err) {
        console.error('❌ Codes Generator - Error extracting codes:', err);
        alert(t('invitationCodes.extractionError', 'Les codes ont été générés mais impossible de les extraire. Consultez la transaction dans l\'explorer.'));
        setIsGenerating(false);
        setPendingTxHash(null);
        setPendingTxHashes([]);
        setCurrentBatchIndex(0);
        setTotalBatches(0);
        setAccumulatedCodes([]);
        processedTxHashes.current = new Set();
        processedReturnData.current = new Set();
      }
    } else if (txResult.isCompleted && !txResult.isSuccess) {
      console.error('❌ Codes Generator - Transaction failed:', txResult.error);
      alert(`${t('invitationCodes.generationFailed', 'Échec de la génération')}: ${txResult.error || 'Erreur inconnue'}`);
      setIsGenerating(false);
      setPendingTxHash(null);
      setPendingTxHashes([]);
      setCurrentBatchIndex(0);
      setTotalBatches(0);
      setAccumulatedCodes([]);
      processedTxHashes.current = new Set();
      processedReturnData.current = new Set();
    }
  }, [txResult, electionId, organizerAddress, t, currentBatchIndex, totalBatches, accumulatedCodes, pendingTxHash, pendingTxHashes]);

  const handleGenerate = async () => {
    const numCount = parseInt(count);

    if (isNaN(numCount) || numCount < 1 || numCount > 1000) {
      alert(t('invitationCodes.invalidCount', 'Nombre invalide (1-1000)'));
      return;
    }

    try {
      setIsGenerating(true);
      setInvitationCodes([]);
      setAccumulatedCodes([]);
      processedTxHashes.current = new Set();
      processedReturnData.current = new Set();

      console.log('🎫 Codes Generator - Generating blockchain invitation codes:', numCount);

      // Calculate batch sizes (max 100 codes per transaction)
      const BATCH_SIZE = 100;
      const numBatches = Math.ceil(numCount / BATCH_SIZE);
      setTotalBatches(numBatches);
      setCurrentBatchIndex(0);

      console.log(`📊 Codes Generator - Will create ${numBatches} batch(es) of max ${BATCH_SIZE} codes`);

      // Prepare batch sizes
      const batchSizes: number[] = [];
      for (let i = 0; i < numBatches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, numCount);
        batchSizes.push(batchEnd - batchStart);
      }

      console.log('📦 Batch sizes:', batchSizes);

      // If only one batch, use the single transaction function
      if (numBatches === 1) {
        console.log('🔄 Codes Generator - Single batch, using direct method');
        const sessionId = await generateCodes(electionId, batchSizes[0]);
        console.log('✅ Codes Generator - Transaction sent. Session ID:', sessionId);

        // Wait for indexing and get transaction hash
        setTimeout(async () => {
          try {
            const response = await fetch(
              `${network.apiAddress}/accounts/${address}/transactions?size=10&order=desc`
            );
            const transactions = await response.json();

            const targetTx = transactions.find((tx: any) =>
              tx.function === 'generateInvitationCodes' &&
              tx.receiver === votingContract
            );

            if (targetTx && targetTx.txHash) {
              console.log('📡 Codes Generator - Transaction hash:', targetTx.txHash);
              setPendingTxHashes([targetTx.txHash]);
              setPendingTxHash(targetTx.txHash);
            } else {
              console.warn('⚠️ Codes Generator - Transaction not found');
              setIsGenerating(false);
              alert(t('invitationCodes.transactionNotFound', 'Transaction non trouvée'));
            }
          } catch (err) {
            console.error('❌ Codes Generator - Error finding transaction:', err);
            setIsGenerating(false);
            alert(t('invitationCodes.retrievalError', 'Erreur de récupération'));
          }
        }, 8000);
      } else {
        // Multiple batches - sign all transactions together
        console.log('🔄 Codes Generator - Multiple batches, signing all together');
        const sessionId = await generateCodesBatch(electionId, batchSizes);
        console.log('✅ Codes Generator - All transactions sent. Session ID:', sessionId);

        // Wait for indexing and get all transaction hashes
        setTimeout(async () => {
          try {
            const response = await fetch(
              `${network.apiAddress}/accounts/${address}/transactions?size=20&order=desc`
            );
            const transactions = await response.json();

            // Find all generateInvitationCodes transactions
            const targetTxs = transactions.filter((tx: any) =>
              tx.function === 'generateInvitationCodes' &&
              tx.receiver === votingContract
            ).slice(0, numBatches); // Take only the number we need

            if (targetTxs.length === numBatches) {
              const txHashes = targetTxs.map((tx: any) => tx.txHash);
              console.log('📡 Codes Generator - Found all transaction hashes:', txHashes);
              setPendingTxHashes(txHashes);
              // Start watching the first transaction
              setPendingTxHash(txHashes[0]);
            } else {
              console.warn('⚠️ Codes Generator - Not all transactions found:', targetTxs.length, 'of', numBatches);
              setIsGenerating(false);
              alert(t('invitationCodes.transactionNotFound', 'Toutes les transactions n\'ont pas été trouvées'));
            }
          } catch (err) {
            console.error('❌ Codes Generator - Error finding transactions:', err);
            setIsGenerating(false);
            alert(t('invitationCodes.retrievalError', 'Erreur de récupération'));
          }
        }, 8000);
      }
    } catch (err) {
      console.error('❌ Codes Generator - Error generating codes:', err);
      setIsGenerating(false);
      setCurrentBatchIndex(0);
      setTotalBatches(0);
      processedTxHashes.current = new Set();
      processedReturnData.current = new Set();
      alert(t('invitationCodes.error', 'Erreur lors de la génération des codes d\'invitation'));
    }
  };

  const truncateCode = (code: string) => {
    if (code.length <= 24) return code;
    return `${code.substring(0, 12)}...${code.substring(code.length - 12)}`;
  };

  const toggleCodeExpansion = (index: number) => {
    const newExpanded = new Set(expandedCodes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCodes(newExpanded);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allCodes = invitationCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Code,Index',
      ...invitationCodes.map((code, index) => `${code},${index + 1}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation_codes_election_${electionId}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify({
      election_id: electionId,
      total_codes: invitationCodes.length,
      generated_at: new Date().toISOString(),
      generated_by: organizerAddress,
      codes: invitationCodes.map((code, index) => ({
        index: index + 1,
        code
      }))
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation_codes_election_${electionId}_${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmails = async () => {
    if (!emailText.trim()) {
      alert(t('invitationCodes.emailRequired', 'Veuillez entrer au moins une adresse email'));
      return;
    }

    if (invitationCodes.length === 0) {
      alert(t('invitationCodes.noCodesAvailable', 'Aucun code d\'invitation disponible. Générez d\'abord les codes.'));
      return;
    }

    // Extract emails from text (supports comma, semicolon, space, newline)
    const emails = emailText
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    if (emails.length === 0) {
      alert(t('invitationCodes.noValidEmails', 'Aucune adresse email valide trouvée'));
      return;
    }

    if (emails.length > invitationCodes.length) {
      alert(
        t('invitationCodes.notEnoughCodes',
          `Vous avez ${emails.length} emails mais seulement ${invitationCodes.length} codes. Générez plus de codes ou réduisez le nombre d'emails.`)
      );
      return;
    }

    const confirmMsg = t(
      'invitationCodes.confirmSendEmails',
      `Voulez-vous envoyer ${emails.length} email(s) d'invitation avec les codes d'invitation ?`
    );

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsSendingEmails(true);
    setEmailResults(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003';
      const response = await fetch(`${backendUrl}/api/elections/${electionId}/send-invitations-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: emails,
          invitationCodes: invitationCodes
        })
      });

      const data = await response.json();

      if (data.success) {
        setEmailResults(data.data);
        alert(
          t('invitationCodes.emailSuccess',
            `Emails envoyés avec succès!\n✅ Succès: ${data.data.successCount}\n❌ Échecs: ${data.data.failureCount}`)
        );

        // Clear email text on success
        if (data.data.failureCount === 0) {
          setEmailText('');
        }
      } else {
        alert(t('invitationCodes.emailError', `Erreur: ${data.error}`));
      }
    } catch (error: any) {
      console.error('Error sending emails:', error);
      alert(t('invitationCodes.emailNetworkError', `Erreur réseau: ${error.message}`));
    } finally {
      setIsSendingEmails(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn overflow-y-auto">
      <div className="bg-secondary border-2 border-accent rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            🎫 {t('invitationCodes.title', 'Générateur de Codes d\'Invitation')}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-2">
            ℹ️ {t('invitationCodes.instructions', 'Comment utiliser')}
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>{t('invitationCodes.step1', 'Génère des codes d\'invitation sur la blockchain MultiversX')}</li>
            <li>{t('invitationCodes.step2', 'Chaque code est unique et à usage unique')}</li>
            <li>{t('invitationCodes.step3', 'Distribuez les codes aux électeurs (email, SMS, etc.)')}</li>
            <li>{t('invitationCodes.step4', 'L\'électeur utilise le code pour s\'inscrire à l\'élection')}</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            ⚠️ {t('invitationCodes.warning', 'Important')}
          </h3>
          <p className="text-sm text-secondary">
            {t('invitationCodes.warningText',
              'Les codes d\'invitation sont générés sur la blockchain et nécessitent une transaction. ' +
              'Chaque code ne peut être utilisé qu\'une seule fois.')}
          </p>
        </div>

        {/* Configuration */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-primary mb-2">
            {t('invitationCodes.countLabel', 'Nombre de codes à générer')}
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min="1"
            max="1000"
            disabled={isGenerating}
            className="w-full bg-primary border border-accent rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="100"
          />
          <p className="text-xs text-secondary mt-1">
            {t('invitationCodes.countHint', 'Maximum: 1000 codes (par lots de 100)')}
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              {t('invitationCodes.generating', 'Génération en cours...')}
            </>
          ) : (
            <>
              🎯 {t('invitationCodes.generate', 'Générer les codes d\'invitation')}
            </>
          )}
        </button>

        {/* Loading state info */}
        {isGenerating && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-primary font-semibold mb-2">
              ⏳ {t('invitationCodes.loadingTitle', 'Génération en cours...')}
            </p>
            {totalBatches > 1 && (
              <div className="mb-3">
                <p className="text-lg font-bold text-accent mb-2">
                  📦 Batch {currentBatchIndex + 1} / {totalBatches}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${((currentBatchIndex + 1) / totalBatches) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-secondary mt-2">
                  {t('invitationCodes.batchProgress',
                    `Transaction ${currentBatchIndex + 1} sur ${totalBatches} (max 100 codes par transaction)`)}
                </p>
              </div>
            )}
            <p className="text-xs text-secondary">
              {totalBatches > 1
                ? t('invitationCodes.loadingTextBatch',
                    'Génération par lots de 100 codes pour optimiser les coûts en gas. ' +
                    'Toutes les transactions sont signées ensemble.')
                : t('invitationCodes.loadingText',
                    'Veuillez patienter pendant que les codes sont générés sur la blockchain. ' +
                    'Cela peut prendre quelques secondes.')
              }
            </p>
          </div>
        )}

        {/* Codes List */}
        {invitationCodes.length > 0 && (
          <>
            {/* Actions */}
            <div className="p-4 border-b border-secondary bg-secondary bg-opacity-30 rounded-lg mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-80 transition-all font-semibold text-sm"
                >
                  {copiedIndex === -1 ? '✅ Tous copiés!' : '📋 Copier tous'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all font-semibold text-sm"
                >
                  📄 Exporter CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all font-semibold text-sm"
                >
                  📋 Exporter JSON
                </button>
              </div>
              <div className="flex-1 text-center text-sm text-secondary">
                ✅ {invitationCodes.length} code(s) généré(s) avec succès
              </div>
            </div>

            {/* Email Sending Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                📧 {t('invitationCodes.sendEmails', 'Envoyer par Email')}
              </h3>

              <p className="text-sm text-secondary mb-4">
                {t('invitationCodes.emailInstructions',
                  'Entrez les adresses emails (séparées par virgule, espace ou retour ligne). Chaque email recevra un code d\'invitation unique.')}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-primary mb-2">
                  {t('invitationCodes.emailAddresses', 'Adresses Email')}
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  disabled={isSendingEmails || invitationCodes.length === 0}
                  placeholder="exemple1@email.com, exemple2@email.com&#10;exemple3@email.com"
                  rows={4}
                  className="w-full bg-primary border border-accent rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed resize-vertical font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-secondary">
                    {emailText ? (
                      <>
                        {emailText.split(/[\s,;]+/).filter(e => e.trim().includes('@')).length} email(s) détecté(s)
                      </>
                    ) : (
                      t('invitationCodes.emailPlaceholder', 'Entrez les emails à inviter')
                    )}
                  </p>
                  <p className="text-xs text-accent font-semibold">
                    {invitationCodes.length} code(s) disponible(s)
                  </p>
                </div>
              </div>

              <button
                onClick={handleSendEmails}
                disabled={isSendingEmails || !emailText.trim() || invitationCodes.length === 0}
                className="w-full px-6 py-3 bg-accent text-primary rounded-lg hover:bg-opacity-80 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingEmails ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('invitationCodes.sending', 'Envoi en cours...')}
                  </>
                ) : (
                  <>
                    📨 {t('invitationCodes.sendButton', 'Envoyer les Emails')}
                  </>
                )}
              </button>

              {/* Email Results */}
              {emailResults && (
                <div className="mt-4 p-4 bg-primary border border-accent rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    📊 {t('invitationCodes.emailResults', 'Résultats de l\'envoi')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">
                        {t('invitationCodes.totalEmails', 'Total d\'emails')}:
                      </span>
                      <span className="font-semibold text-primary">
                        {emailResults.totalEmails}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 dark:text-green-400">
                        ✅ {t('invitationCodes.successCount', 'Succès')}:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {emailResults.successCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 dark:text-red-400">
                        ❌ {t('invitationCodes.failureCount', 'Échecs')}:
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {emailResults.failureCount}
                      </span>
                    </div>
                  </div>

                  {/* Show failed emails if any */}
                  {emailResults.failedEmails && emailResults.failedEmails.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="font-semibold text-red-600 dark:text-red-400 mb-2 text-xs">
                        {t('invitationCodes.failedEmails', 'Emails échoués')}:
                      </p>
                      <ul className="text-xs text-secondary space-y-1">
                        {emailResults.failedEmails.map((failed: any, idx: number) => (
                          <li key={idx} className="font-mono">
                            {failed.email}: {failed.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Codes Grid */}
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {invitationCodes.map((code, index) => {
                const isExpanded = expandedCodes.has(index);
                const displayCode = isExpanded ? code : truncateCode(code);
                const shouldTruncate = code.length > 24;

                return (
                  <div
                    key={index}
                    className="bg-secondary border border-secondary rounded-lg p-4 hover:border-accent transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-accent">
                            #{index + 1}
                          </span>
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleCodeExpansion(index)}
                              className="text-xs text-accent hover:text-primary transition-colors underline"
                            >
                              {isExpanded ? '🔼 Réduire' : '🔽 Voir tout'}
                            </button>
                          )}
                        </div>
                        <code className={`text-sm text-primary font-mono block ${isExpanded ? 'break-all' : 'truncate'}`}>
                          {displayCode}
                        </code>
                      </div>
                      <button
                        onClick={() => handleCopyCode(code, index)}
                        className="px-3 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-80 transition-all font-semibold text-sm whitespace-nowrap flex-shrink-0"
                      >
                        {copiedIndex === index ? '✅ Copié!' : '📋 Copier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-accent">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border-2 border-accent text-primary hover:bg-primary transition-all font-semibold"
          >
            {t('common.close', 'Fermer')}
          </button>
        </div>
      </div>
    </div>
  );
};
