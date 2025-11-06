import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';

interface BulkImportModalProps {
  isOpen: boolean;
  electionId: number;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

interface ParsedRow {
  address: string;
  email?: string;
  name?: string;
}

interface ValidationResult {
  valid: ParsedRow[];
  invalid: Array<{ row: number; address: string; error: string }>;
}

export const BulkImportModal = ({
  isOpen,
  electionId,
  onClose,
  onImport
}: BulkImportModalProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAddress = (address: string): boolean => {
    // MultiversX address validation: starts with "erd1" and is 62 characters
    const trimmed = address.trim();
    return trimmed.startsWith('erd1') && trimmed.length === 62;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt'].includes(fileType || '')) {
      alert(t('bulkImport.invalidFileType', 'Format de fichier non supporté. Utilisez CSV ou TXT.'));
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);
  };

  const handleParse = () => {
    if (!file) return;

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const valid: ParsedRow[] = [];
        const invalid: Array<{ row: number; address: string; error: string }> = [];

        results.data.forEach((row: any, index: number) => {
          // Support multiple column names
          const address = row.address || row.Address || row.wallet || row.Wallet || row.ADDRESS || '';
          const email = row.email || row.Email || row.EMAIL || '';
          const name = row.name || row.Name || row.NAME || '';

          if (!address) {
            invalid.push({
              row: index + 2, // +2 because: +1 for 1-indexed, +1 for header
              address: '',
              error: t('bulkImport.missingAddress', 'Adresse manquante')
            });
            return;
          }

          if (!validateAddress(address)) {
            invalid.push({
              row: index + 2,
              address: address,
              error: t('bulkImport.invalidAddress', 'Adresse invalide (doit commencer par "erd1" et avoir 62 caractères)')
            });
            return;
          }

          valid.push({ address: address.trim(), email, name });
        });

        setValidationResult({ valid, invalid });
        setIsProcessing(false);
      },
      error: (error) => {
        alert(t('bulkImport.parseError', `Erreur lors de la lecture du fichier: ${error.message}`));
        setIsProcessing(false);
      }
    });
  };

  const handleImport = () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    const addresses = validationResult.valid.map(row => row.address);
    onImport(addresses);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = 'address,email,name\nerd1...,voter@example.com,John Doe\nerd1...,voter2@example.com,Jane Smith';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `democratix_voters_template_election_${electionId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-secondary border-2 border-accent rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            📊 {t('bulkImport.title', 'Importation Groupée d\'Électeurs')}
          </h2>
          <button
            onClick={handleClose}
            className="text-secondary hover:text-primary transition-colors text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-primary mb-2">
            📝 {t('bulkImport.instructions', 'Instructions')}
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>{t('bulkImport.step1', 'Téléchargez le modèle CSV ci-dessous')}</li>
            <li>{t('bulkImport.step2', 'Remplissez le fichier avec les adresses MultiversX (erd1...)')}</li>
            <li>{t('bulkImport.step3', 'Importez le fichier et vérifiez la preview')}</li>
            <li>{t('bulkImport.step4', 'Confirmez l\'ajout à la whitelist')}</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
          >
            📥 {t('bulkImport.downloadTemplate', 'Télécharger le modèle CSV')}
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-primary mb-2">
            {t('bulkImport.selectFile', 'Sélectionner un fichier CSV')}
          </label>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="flex-1 bg-primary border border-accent rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleParse}
              disabled={!file || isProcessing}
              className="bg-btn-primary text-btn-primary px-6 py-2 rounded-lg hover:bg-btn-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {isProcessing ? '⏳' : '🔍'} {t('bulkImport.validate', 'Valider')}
            </button>
          </div>
          {file && (
            <p className="text-sm text-secondary mt-2">
              📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold text-primary">
                    {t('bulkImport.validAddresses', 'Adresses Valides')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {validationResult.valid.length}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">❌</span>
                  <span className="font-semibold text-primary">
                    {t('bulkImport.invalidAddresses', 'Adresses Invalides')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {validationResult.invalid.length}
                </p>
              </div>
            </div>

            {/* Valid Preview */}
            {validationResult.valid.length > 0 && (
              <div className="bg-primary border border-accent rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">
                  ✅ {t('bulkImport.preview', 'Aperçu des adresses valides')} ({validationResult.valid.slice(0, 10).length}/{validationResult.valid.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResult.valid.slice(0, 10).map((row, index) => (
                    <div key={index} className="bg-secondary rounded p-2 font-mono text-xs text-primary flex items-center gap-2">
                      <span className="text-accent font-bold">#{index + 1}</span>
                      <span className="flex-1">{row.address}</span>
                      {row.name && <span className="text-secondary">({row.name})</span>}
                    </div>
                  ))}
                  {validationResult.valid.length > 10 && (
                    <p className="text-center text-sm text-secondary italic">
                      ... {t('bulkImport.andMore', 'et {{count}} de plus', { count: validationResult.valid.length - 10 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Invalid Preview */}
            {validationResult.invalid.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">
                  ❌ {t('bulkImport.errors', 'Erreurs détectées')}
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResult.invalid.slice(0, 10).map((error, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-600 font-bold">Ligne {error.row}</span>
                        <span className="text-red-500">{error.error}</span>
                      </div>
                      {error.address && (
                        <p className="font-mono text-secondary truncate">{error.address}</p>
                      )}
                    </div>
                  ))}
                  {validationResult.invalid.length > 10 && (
                    <p className="text-center text-sm text-secondary italic">
                      ... {t('bulkImport.andMore', 'et {{count}} de plus', { count: validationResult.invalid.length - 10 })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-accent">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-lg border-2 border-accent text-primary hover:bg-primary transition-all font-semibold"
          >
            {t('common.cancel', 'Annuler')}
          </button>
          <button
            onClick={handleImport}
            disabled={!validationResult || validationResult.valid.length === 0}
            className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
          >
            <span>📤</span>
            {t('bulkImport.import', 'Importer {{count}} adresse(s)', { count: validationResult?.valid.length || 0 })}
          </button>
        </div>
      </div>
    </div>
  );
};
