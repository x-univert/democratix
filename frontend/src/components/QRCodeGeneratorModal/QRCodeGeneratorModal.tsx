import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useGetNetworkConfig, useGetAccount } from 'lib';
import { useGenerateInvitationCodes } from '../../hooks/transactions';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';
import { votingContract } from '../../config';
import {
  downloadQRCodesCSV,
  type QRCodeData
} from '../../utils/qrCodeService';

interface QRCodeGeneratorModalProps {
  isOpen: boolean;
  electionId: number;
  organizerAddress: string;
  onClose: () => void;
}

export const QRCodeGeneratorModal = ({
  isOpen,
  electionId,
  organizerAddress,
  onClose
}: QRCodeGeneratorModalProps) => {
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();
  const { generateCodes, generateCodesBatch } = useGenerateInvitationCodes();

  const [count, setCount] = useState('5');
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [pendingTxHashes, setPendingTxHashes] = useState<string[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [accumulatedCodes, setAccumulatedCodes] = useState<string[]>([]);
  const processedTxHashes = useRef<Set<string>>(new Set());
  const processedReturnData = useRef<Set<string>>(new Set());

  const { result: txResult } = useTransactionWatcher(pendingTxHash);

  // Watch for transaction completion and extract invitation codes
  useEffect(() => {
    if (!pendingTxHash) return;

    console.log('🔍 QR Generator - useEffect txResult:', {
      isCompleted: txResult.isCompleted,
      isSuccess: txResult.isSuccess,
      returnDataLength: txResult.returnData.length,
      currentBatchIndex,
      totalBatches,
      pendingTxHash
    });

    // Skip if already processed this transaction
    if (processedTxHashes.current.has(pendingTxHash)) {
      console.log('⏭️ QR Generator - Transaction already processed, skipping:', pendingTxHash);
      return;
    }

    if (txResult.isCompleted && txResult.isSuccess && txResult.returnData.length > 0) {
      // Create a unique signature for this returnData to detect if we've processed it before
      const returnDataSignature = txResult.returnData.slice(0, 3).join('-');

      if (processedReturnData.current.has(returnDataSignature)) {
        console.log('⏭️ QR Generator - Return data already processed (stale cache), skipping');
        return;
      }

      // Mark transaction and return data as processed
      processedTxHashes.current.add(pendingTxHash);
      processedReturnData.current.add(returnDataSignature);
      console.log(`✅ QR Generator - Batch ${currentBatchIndex + 1}/${totalBatches} completed, extracting codes...`);
      console.log('📦 QR Generator - Return data length:', txResult.returnData.length);

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

        console.log(`✅ QR Generator - Batch ${currentBatchIndex + 1}/${totalBatches} - Extracted ${codesHex.length} codes from transaction`);

        // Accumulate codes and deduplicate
        const allCodes = [...accumulatedCodes, ...codesHex];
        const newAccumulatedCodes = Array.from(new Set(allCodes));

        if (newAccumulatedCodes.length < allCodes.length) {
          console.warn(`⚠️ QR Generator - Removed ${allCodes.length - newAccumulatedCodes.length} duplicate codes`);
        }

        setAccumulatedCodes(newAccumulatedCodes);
        console.log(`📊 QR Generator - Total unique codes accumulated: ${newAccumulatedCodes.length}`);

        // Check if there are more batches to process
        if (currentBatchIndex + 1 < pendingTxHashes.length) {
          // Move to next batch
          const nextIndex = currentBatchIndex + 1;
          setCurrentBatchIndex(nextIndex);
          console.log(`🔄 QR Generator - Moving to batch ${nextIndex + 1}/${totalBatches}`);

          // Set next transaction hash to watch
          setPendingTxHash(pendingTxHashes[nextIndex]);
        } else {
          // All batches completed, create QR codes
          console.log(`\n✅ QR Generator - All ${totalBatches} batches completed. Total codes: ${newAccumulatedCodes.length}`);

          const baseUrl = window.location.origin;
          const qrCodesData: QRCodeData[] = newAccumulatedCodes.map((invitationCode, index) => ({
            token: invitationCode,
            electionId,
            url: `${baseUrl}/register/${electionId}?token=${invitationCode}`,
            metadata: {
              generatedBy: organizerAddress,
              generatedAt: Date.now(),
              voterName: `Code #${index + 1}`
            }
          }));

          setQRCodes(qrCodesData);
          setIsGenerating(false);
          setCurrentBatchIndex(0);
          setTotalBatches(0);
          setPendingTxHash(null);
          setPendingTxHashes([]);
          setAccumulatedCodes([]);
          processedTxHashes.current = new Set();
          processedReturnData.current = new Set();

          console.log('✅ QR Generator - All QR codes created successfully');
        }
      } catch (err) {
        console.error('❌ QR Generator - Error extracting codes:', err);
        alert(t('qrGenerator.extractionError', 'Les codes ont été générés mais impossible de les extraire. Consultez la transaction dans l\'explorer.'));
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
      console.error('❌ QR Generator - Transaction failed:', txResult.error);
      alert(`${t('qrGenerator.generationFailed', 'Échec de la génération')}: ${txResult.error || 'Erreur inconnue'}`);
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
      alert(t('qrGenerator.invalidCount', 'Nombre invalide (1-1000)'));
      return;
    }

    try {
      setIsGenerating(true);
      setQRCodes([]);
      setAccumulatedCodes([]);
      processedTxHashes.current = new Set();
      processedReturnData.current = new Set();

      console.log('📱 QR Generator - Generating blockchain invitation codes:', numCount);

      // Calculate batch sizes (max 100 codes per transaction)
      const BATCH_SIZE = 100;
      const numBatches = Math.ceil(numCount / BATCH_SIZE);
      setTotalBatches(numBatches);
      setCurrentBatchIndex(0);

      console.log(`📊 QR Generator - Will create ${numBatches} batch(es) of max ${BATCH_SIZE} codes`);

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
        console.log('🔄 QR Generator - Single batch, using direct method');
        const sessionId = await generateCodes(electionId, batchSizes[0]);
        console.log('✅ QR Generator - Transaction sent. Session ID:', sessionId);

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
              console.log('📡 QR Generator - Transaction hash:', targetTx.txHash);
              setPendingTxHashes([targetTx.txHash]);
              setPendingTxHash(targetTx.txHash);
            } else {
              console.warn('⚠️ QR Generator - Transaction not found');
              setIsGenerating(false);
              alert(t('qrGenerator.transactionNotFound', 'Transaction non trouvée'));
            }
          } catch (err) {
            console.error('❌ QR Generator - Error finding transaction:', err);
            setIsGenerating(false);
            alert(t('qrGenerator.retrievalError', 'Erreur de récupération'));
          }
        }, 8000);
      } else {
        // Multiple batches - sign all transactions together
        console.log('🔄 QR Generator - Multiple batches, signing all together');
        const sessionId = await generateCodesBatch(electionId, batchSizes);
        console.log('✅ QR Generator - All transactions sent. Session ID:', sessionId);

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
              console.log('📡 QR Generator - Found all transaction hashes:', txHashes);
              setPendingTxHashes(txHashes);
              // Start watching the first transaction
              setPendingTxHash(txHashes[0]);
            } else {
              console.warn('⚠️ QR Generator - Not all transactions found:', targetTxs.length, 'of', numBatches);
              setIsGenerating(false);
              alert(t('qrGenerator.transactionNotFound', 'Toutes les transactions n\'ont pas été trouvées'));
            }
          } catch (err) {
            console.error('❌ QR Generator - Error finding transactions:', err);
            setIsGenerating(false);
            alert(t('qrGenerator.retrievalError', 'Erreur de récupération'));
          }
        }, 8000);
      }
    } catch (err) {
      console.error('❌ QR Generator - Error generating codes:', err);
      setIsGenerating(false);
      setCurrentBatchIndex(0);
      setTotalBatches(0);
      processedTxHashes.current = new Set();
      processedReturnData.current = new Set();
      alert(t('qrGenerator.error', 'Erreur lors de la génération des codes d\'invitation'));
    }
  };

  const handleDownloadCSV = () => {
    if (qrCodes.length === 0) return;
    downloadQRCodesCSV(electionId, qrCodes);
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    alert(t('qrGenerator.urlCopied', 'URL copiée dans le presse-papier!'));
  };

  const handleDownloadQR = (qrCode: QRCodeData, index: number) => {
    const svg = document.getElementById(`qr-${index}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode_election_${electionId}_${index + 1}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn overflow-y-auto">
      <div className="bg-secondary border-2 border-accent rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            📱 {t('qrGenerator.title', 'Générateur de QR Codes')}
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
            ℹ️ {t('qrGenerator.instructions', 'Comment utiliser')}
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>{t('qrGenerator.step1blockchain', 'Génère des codes d\'invitation sur la blockchain MultiversX')}</li>
            <li>{t('qrGenerator.step2', 'Chaque QR code contient un code d\'invitation unique à usage unique')}</li>
            <li>{t('qrGenerator.step3', 'Distribuez les QR codes aux électeurs (email, impression, etc.)')}</li>
            <li>{t('qrGenerator.step4', 'L\'électeur scanne le QR et s\'inscrit automatiquement')}</li>
          </ul>
        </div>

        {/* Warning about blockchain codes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            ⚠️ {t('qrGenerator.blockchainWarning', 'Important')}
          </h3>
          <p className="text-sm text-secondary">
            {t('qrGenerator.blockchainWarningText',
              'Les codes d\'invitation sont générés sur la blockchain et nécessitent une transaction. ' +
              'Chaque code ne peut être utilisé qu\'une seule fois pour s\'inscrire à l\'élection.')}
          </p>
        </div>

        {/* Configuration */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-primary mb-2">
            {t('qrGenerator.countLabel', 'Nombre de codes d\'invitation à générer')}
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min="1"
            max="1000"
            disabled={isGenerating}
            className="w-full bg-primary border border-accent rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="5"
          />
          <p className="text-xs text-secondary mt-1">
            {t('qrGenerator.countHint', 'Maximum: 1000 codes par transaction')}
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
              {t('qrGenerator.generating', 'Génération en cours...')}
            </>
          ) : (
            <>
              🎯 {t('qrGenerator.generate', 'Générer les codes d\'invitation')}
            </>
          )}
        </button>

        {/* Loading state info */}
        {isGenerating && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-primary font-semibold mb-2">
              ⏳ {t('qrGenerator.loadingTitle', 'Génération en cours...')}
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
                  {t('qrGenerator.batchProgress',
                    `Transaction ${currentBatchIndex + 1} sur ${totalBatches} (max 100 codes par transaction)`)}
                </p>
              </div>
            )}
            <p className="text-xs text-secondary">
              {totalBatches > 1
                ? t('qrGenerator.loadingTextBatch',
                    'Génération par lots de 100 codes pour optimiser les coûts en gas. ' +
                    'Toutes les transactions sont signées ensemble.')
                : t('qrGenerator.loadingText',
                    'Veuillez patienter pendant que les codes d\'invitation sont générés sur la blockchain. ' +
                    'Cela peut prendre quelques secondes.')
              }
            </p>
          </div>
        )}

        {/* QR Codes Grid */}
        {qrCodes.length > 0 && (
          <>
            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleDownloadCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center gap-2"
              >
                <span>📊</span>
                {t('qrGenerator.downloadCSV', 'Télécharger CSV')}
              </button>
              <div className="flex-1 text-right text-sm text-secondary">
                {t('qrGenerator.generated', '{{count}} QR code(s) généré(s)', { count: qrCodes.length })}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrCodes.map((qr, index) => (
                <div
                  key={qr.token}
                  className="bg-primary border-2 border-accent rounded-lg p-4 hover:shadow-lg transition-all"
                >
                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-lg mb-3 flex items-center justify-center">
                    <QRCodeSVG
                      id={`qr-${index}`}
                      value={qr.url}
                      size={150}
                      level="H"
                      includeMargin
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent">#{index + 1}</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        🔗 {t('qrGenerator.blockchain', 'Blockchain')}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-secondary break-all">
                      {qr.token.substring(0, 16)}...
                    </p>
                    <p className="text-xs text-secondary">
                      {t('qrGenerator.oneTimeUse', 'Usage unique')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyURL(qr.url)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition-all"
                      title={t('qrGenerator.copyURL', 'Copier URL')}
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDownloadQR(qr, index)}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-xs hover:bg-purple-700 transition-all"
                      title={t('qrGenerator.downloadQR', 'Télécharger QR')}
                    >
                      💾
                    </button>
                    <button
                      onClick={() => setSelectedQR(qr)}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-xs hover:bg-gray-700 transition-all"
                      title={t('qrGenerator.details', 'Détails')}
                    >
                      👁️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Details Modal */}
        {selectedQR && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-70">
            <div className="bg-secondary border-2 border-accent rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">
                  {t('qrGenerator.details', 'Détails du QR Code')}
                </h3>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="text-secondary hover:text-primary transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-primary">{t('qrGenerator.invitationCode', 'Code d\'invitation')}:</span>
                  <p className="font-mono text-xs text-secondary break-all mt-1 bg-tertiary p-2 rounded">{selectedQR.token}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">URL:</span>
                  <p className="font-mono text-xs text-secondary break-all mt-1">{selectedQR.url}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">{t('qrGenerator.status', 'Statut')}:</span>
                  <p className="text-secondary mt-1">
                    🔗 {t('qrGenerator.blockchainCode', 'Code blockchain - Usage unique')}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-primary">{t('qrGenerator.generatedAt', 'Généré le')}:</span>
                  <p className="text-secondary mt-1">
                    {new Date(selectedQR.metadata?.generatedAt || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedQR(null)}
                className="w-full mt-4 bg-btn-primary text-btn-primary px-4 py-2 rounded-lg hover:bg-btn-hover transition-all"
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          </div>
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
