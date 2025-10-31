import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvitationCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: string[];
  electionId: number;
  electionTitle: string;
}

export const InvitationCodesModal = ({
  isOpen,
  onClose,
  codes,
  electionId,
  electionTitle
}: InvitationCodesModalProps) => {
  const { t } = useTranslation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedCodes, setExpandedCodes] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

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
    const allCodes = codes.join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedIndex(-1); // -1 pour indiquer "tous copiés"
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Code,Index',
      ...codes.map((code, index) => `${code},${index + 1}`)
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
      election_title: electionTitle,
      total_codes: codes.length,
      generated_at: new Date().toISOString(),
      codes: codes.map((code, index) => ({
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary border-2 border-accent vibe-border rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b-2 border-secondary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">
                🎟️ Codes d'invitation générés
              </h2>
              <p className="text-sm text-secondary">
                {codes.length} code(s) pour l'élection #{electionId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-secondary bg-secondary bg-opacity-30">
          <div className="flex flex-wrap gap-2">
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
          <div className="mt-3 bg-accent bg-opacity-10 border border-accent rounded-lg p-3 text-xs text-secondary">
            <p>💡 Les électeurs peuvent utiliser ces codes pour s'inscrire à l'élection sans être sur la liste blanche.</p>
          </div>
        </div>

        {/* Codes List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-2">
            {codes.map((code, index) => {
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-secondary bg-secondary bg-opacity-30">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-btn-primary text-btn-primary rounded-lg hover:bg-btn-hover transition-all font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
