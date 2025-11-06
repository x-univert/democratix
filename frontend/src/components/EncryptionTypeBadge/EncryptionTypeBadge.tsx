import { useTranslation } from 'react-i18next';

interface EncryptionTypeBadgeProps {
  encryptionType?: number;
  size?: 'small' | 'medium' | 'large';
}

export const EncryptionTypeBadge = ({ encryptionType, size = 'medium' }: EncryptionTypeBadgeProps) => {
  const { t } = useTranslation();

  // Si pas de type de chiffrement spécifié, on considère que c'est le type 0 (standard)
  const type = encryptionType ?? 0;

  // Styles en fonction de la taille
  const sizeClasses = {
    small: 'text-[10px] px-2 py-0.5',
    medium: 'text-xs px-3 py-1',
    large: 'text-sm px-4 py-2'
  };

  const iconSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  if (type === 0) {
    // Type 0: Aucun chiffrement (Standard)
    return (
      <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-500 text-blue-800 dark:text-blue-200 rounded-full font-semibold ${sizeClasses[size]}`}>
        <span className={iconSize[size]}>🗳️</span>
        <span>{t('createElection.encryption.option0.title', 'Aucun chiffrement (Standard)')}</span>
      </span>
    );
  }

  if (type === 1) {
    // Type 1: ElGamal
    return (
      <span className={`inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 border border-green-600 text-green-800 dark:text-green-200 rounded-full font-semibold ${sizeClasses[size]}`}>
        <span className={iconSize[size]}>🔐</span>
        <span>{t('createElection.encryption.option1.title', 'Option 1: ElGamal')}</span>
        <span className="bg-green-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
          {t('createElection.encryption.option1.badge', 'RECOMMANDÉ')}
        </span>
      </span>
    );
  }

  if (type === 2) {
    // Type 2: ElGamal + zk-SNARK
    return (
      <span className={`inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-600 text-purple-800 dark:text-purple-200 rounded-full font-semibold ${sizeClasses[size]}`}>
        <span className={iconSize[size]}>🛡️</span>
        <span>{t('createElection.encryption.option2.title', 'Option 2: ElGamal + zk-SNARK')}</span>
        <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
          {t('createElection.encryption.option2.badge', 'SÉCURITÉ MAX')}
        </span>
      </span>
    );
  }

  return null;
};
