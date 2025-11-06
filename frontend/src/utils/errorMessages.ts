/**
 * Contextual error message utility
 *
 * Provides user-friendly error messages for different types of errors
 * with context about what the user was trying to do.
 */

export type ErrorContext =
  | 'election_create'
  | 'election_activate'
  | 'election_close'
  | 'election_finalize'
  | 'candidate_add'
  | 'vote_submit'
  | 'vote_decrypt'
  | 'ipfs_upload'
  | 'ipfs_fetch'
  | 'blockchain_transaction'
  | 'wallet_connect'
  | 'elgamal_setup'
  | 'zkproof_generate'
  | 'generic';

export interface UserFriendlyError {
  /**
   * Short title for the error
   */
  title: string;

  /**
   * Detailed message explaining what went wrong
   */
  message: string;

  /**
   * Suggested actions the user can take
   */
  actions: string[];

  /**
   * Technical details for debugging (optional)
   */
  technicalDetails?: string;

  /**
   * Severity level
   */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Extract user-friendly error message from various error types
 */
export function getUserFriendlyError(
  error: any,
  context: ErrorContext = 'generic'
): UserFriendlyError {
  const errorMessage = extractErrorMessage(error);
  const errorType = classifyError(errorMessage);

  // Build base error
  const baseError: UserFriendlyError = {
    title: '',
    message: '',
    actions: [],
    technicalDetails: errorMessage,
    severity: 'error',
  };

  // Network errors
  if (errorType === 'network') {
    baseError.title = 'Problème de connexion';
    baseError.message = getNetworkErrorMessage(context);
    baseError.actions = [
      'Vérifiez votre connexion Internet',
      'Réessayez dans quelques instants',
      'Si le problème persiste, contactez le support',
    ];
  }

  // IPFS errors
  else if (errorType === 'ipfs') {
    baseError.title = 'Problème avec le stockage décentralisé';
    baseError.message = getIPFSErrorMessage(context);
    baseError.actions = [
      'Le service IPFS est temporairement surchargé',
      'Réessayez dans 30 secondes',
      'Vos données ne seront pas perdues',
    ];
  }

  // Wallet errors
  else if (errorType === 'wallet') {
    baseError.title = 'Problème avec votre portefeuille';
    baseError.message = getWalletErrorMessage(errorMessage, context);
    baseError.actions = getWalletErrorActions(errorMessage);
  }

  // Transaction errors
  else if (errorType === 'transaction') {
    baseError.title = 'La transaction a échoué';
    baseError.message = getTransactionErrorMessage(errorMessage, context);
    baseError.actions = getTransactionErrorActions(errorMessage);
  }

  // Validation errors
  else if (errorType === 'validation') {
    baseError.title = 'Données invalides';
    baseError.message = getValidationErrorMessage(errorMessage, context);
    baseError.actions = ['Vérifiez les informations saisies', 'Corrigez les erreurs et réessayez'];
    baseError.severity = 'warning';
  }

  // Permission errors
  else if (errorType === 'permission') {
    baseError.title = 'Permission refusée';
    baseError.message = getPermissionErrorMessage(context);
    baseError.actions = [
      'Vérifiez que vous êtes connecté avec le bon compte',
      'Vous devez être organisateur pour effectuer cette action',
    ];
  }

  // Crypto errors (ElGamal, zk-SNARK)
  else if (errorType === 'crypto') {
    baseError.title = 'Erreur cryptographique';
    baseError.message = getCryptoErrorMessage(errorMessage, context);
    baseError.actions = getCryptoErrorActions(errorMessage, context);
  }

  // Generic errors
  else {
    baseError.title = 'Une erreur est survenue';
    baseError.message = getGenericErrorMessage(context);
    baseError.actions = [
      'Réessayez l\'opération',
      'Actualisez la page si le problème persiste',
      'Contactez le support si l\'erreur continue',
    ];
  }

  return baseError;
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error?.message) return error.message;
  if (error?.error) return extractErrorMessage(error.error);
  if (error?.data?.message) return error.data.message;
  return 'Unknown error';
}

/**
 * Classify error type
 */
function classifyError(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('econnrefused')
  ) {
    return 'network';
  }

  if (lowerMessage.includes('ipfs') || lowerMessage.includes('pinata')) {
    return 'ipfs';
  }

  if (
    lowerMessage.includes('wallet') ||
    lowerMessage.includes('user cancelled') ||
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('transaction declined')
  ) {
    return 'wallet';
  }

  if (
    lowerMessage.includes('transaction failed') ||
    lowerMessage.includes('insufficient funds') ||
    lowerMessage.includes('gas')
  ) {
    return 'transaction';
  }

  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('must be')
  ) {
    return 'validation';
  }

  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('not allowed')
  ) {
    return 'permission';
  }

  if (
    lowerMessage.includes('elgamal') ||
    lowerMessage.includes('decrypt') ||
    lowerMessage.includes('proof') ||
    lowerMessage.includes('zk-snark') ||
    lowerMessage.includes('nullifier')
  ) {
    return 'crypto';
  }

  return 'generic';
}

/**
 * Get network error message based on context
 */
function getNetworkErrorMessage(context: ErrorContext): string {
  const contextMessages: Record<ErrorContext, string> = {
    election_create: 'Impossible de créer l\'élection en raison d\'un problème de connexion.',
    election_activate: 'Impossible d\'activer l\'élection. Vérifiez votre connexion.',
    election_close: 'Impossible de clôturer l\'élection. La connexion réseau a échoué.',
    election_finalize: 'Impossible de finaliser l\'élection. Problème de connexion détecté.',
    candidate_add: 'Impossible d\'ajouter le candidat. Connexion réseau interrompue.',
    vote_submit: 'Votre vote n\'a pas pu être envoyé. Problème de connexion réseau.',
    vote_decrypt: 'Impossible de déchiffrer les votes. Connexion au backend interrompue.',
    ipfs_upload: 'L\'upload vers IPFS a échoué en raison d\'un problème réseau.',
    ipfs_fetch: 'Impossible de récupérer les données depuis IPFS. Connexion interrompue.',
    blockchain_transaction: 'La transaction blockchain a échoué. Problème de connexion.',
    wallet_connect: 'Impossible de se connecter au portefeuille. Vérifiez votre réseau.',
    elgamal_setup: 'Impossible de configurer le chiffrement. Problème de connexion.',
    zkproof_generate: 'La génération de la preuve a échoué. Connexion interrompue.',
    generic: 'Une erreur de connexion réseau est survenue.',
  };

  return contextMessages[context] || contextMessages.generic;
}

/**
 * Get IPFS error message based on context
 */
function getIPFSErrorMessage(context: ErrorContext): string {
  if (context === 'ipfs_upload') {
    return 'Le service de stockage décentralisé (IPFS) n\'a pas pu recevoir vos données. Cela arrive parfois lors de pics de charge.';
  }
  if (context === 'ipfs_fetch') {
    return 'Impossible de récupérer les données depuis le réseau IPFS. Le fichier est peut-être temporairement inaccessible.';
  }
  return 'Un problème est survenu avec le stockage décentralisé (IPFS).';
}

/**
 * Get wallet error message
 */
function getWalletErrorMessage(errorMessage: string, context: ErrorContext): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('user cancelled') || lowerMessage.includes('user rejected')) {
    return 'Vous avez annulé la transaction dans votre portefeuille.';
  }

  if (lowerMessage.includes('not connected')) {
    return 'Votre portefeuille n\'est pas connecté. Veuillez vous connecter pour continuer.';
  }

  return `Un problème est survenu avec votre portefeuille lors de l'opération: ${context.replace('_', ' ')}.`;
}

/**
 * Get wallet error actions
 */
function getWalletErrorActions(errorMessage: string): string[] {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('user cancelled') || lowerMessage.includes('user rejected')) {
    return ['Réessayez l\'opération', 'Confirmez la transaction dans votre portefeuille'];
  }

  if (lowerMessage.includes('not connected')) {
    return [
      'Cliquez sur "Connecter" en haut à droite',
      'Approuvez la connexion dans votre portefeuille',
    ];
  }

  return [
    'Vérifiez que votre portefeuille est déverrouillé',
    'Rafraîchissez la page et reconnectez-vous',
    'Essayez avec un autre navigateur si le problème persiste',
  ];
}

/**
 * Get transaction error message
 */
function getTransactionErrorMessage(errorMessage: string, context: ErrorContext): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('insufficient funds') || lowerMessage.includes('not enough')) {
    return 'Vous n\'avez pas assez de fonds pour effectuer cette transaction. Vérifiez le solde de votre portefeuille.';
  }

  if (lowerMessage.includes('gas')) {
    return 'Les frais de transaction (gas) sont insuffisants ou la transaction consomme trop de gas.';
  }

  return `La transaction a échoué lors de: ${context.replace('_', ' ')}. ${errorMessage}`;
}

/**
 * Get transaction error actions
 */
function getTransactionErrorActions(errorMessage: string): string[] {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('insufficient funds')) {
    return [
      'Ajoutez des fonds à votre portefeuille',
      'Vérifiez que vous êtes sur le bon réseau (Devnet/Testnet/Mainnet)',
    ];
  }

  if (lowerMessage.includes('gas')) {
    return [
      'Augmentez la limite de gas dans votre portefeuille',
      'Attendez que le réseau soit moins congestionné',
    ];
  }

  return ['Réessayez la transaction', 'Vérifiez les détails de la transaction', 'Contactez le support si cela continue'];
}

/**
 * Get validation error message
 */
function getValidationErrorMessage(errorMessage: string, context: ErrorContext): string {
  return `Les données saisies sont invalides: ${errorMessage}`;
}

/**
 * Get permission error message
 */
function getPermissionErrorMessage(context: ErrorContext): string {
  const permissionMessages: Record<string, string> = {
    election_activate: 'Seul l\'organisateur peut activer cette élection.',
    election_close: 'Seul l\'organisateur peut clôturer cette élection.',
    election_finalize: 'Seul l\'organisateur peut finaliser cette élection.',
    vote_decrypt: 'Seuls l\'organisateur et les co-organisateurs autorisés peuvent déchiffrer les votes.',
    elgamal_setup: 'Seul l\'organisateur peut configurer le chiffrement ElGamal.',
  };

  return permissionMessages[context] || 'Vous n\'avez pas la permission d\'effectuer cette action.';
}

/**
 * Get crypto error message
 */
function getCryptoErrorMessage(errorMessage: string, context: ErrorContext): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('secret') || lowerMessage.includes('private key')) {
    return 'La clé privée est manquante ou invalide. Vous devez avoir sauvegardé votre secret lors de la configuration.';
  }

  if (lowerMessage.includes('proof') || lowerMessage.includes('zk-snark')) {
    return 'La génération de la preuve cryptographique a échoué. Cela peut prendre jusqu\'à 5 secondes.';
  }

  if (lowerMessage.includes('nullifier')) {
    return 'Le nullifier est invalide. Vous avez peut-être déjà voté avec ce compte.';
  }

  if (lowerMessage.includes('decrypt')) {
    return 'Le déchiffrement des votes a échoué. Vérifiez que vous utilisez la bonne clé privée.';
  }

  return `Erreur cryptographique: ${errorMessage}`;
}

/**
 * Get crypto error actions
 */
function getCryptoErrorActions(errorMessage: string, context: ErrorContext): string[] {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('secret') || lowerMessage.includes('private key')) {
    return [
      'Importez votre clé privée sauvegardée',
      'Si vous avez perdu votre clé, vous ne pouvez pas déchiffrer les votes',
      'Contactez un co-organisateur qui a la clé',
    ];
  }

  if (lowerMessage.includes('proof') || lowerMessage.includes('zk-snark')) {
    return [
      'Attendez quelques secondes et réessayez',
      'Assurez-vous d\'avoir sélectionné un candidat valide',
      'Vérifiez que votre navigateur supporte WebAssembly',
    ];
  }

  if (lowerMessage.includes('nullifier')) {
    return [
      'Vérifiez que vous n\'avez pas déjà voté',
      'Utilisez un autre compte si vous voulez voter à nouveau (pour les tests)',
    ];
  }

  return ['Réessayez l\'opération', 'Actualisez la page', 'Contactez le support technique'];
}

/**
 * Get generic error message
 */
function getGenericErrorMessage(context: ErrorContext): string {
  const contextMessages: Record<ErrorContext, string> = {
    election_create: 'Impossible de créer l\'élection.',
    election_activate: 'Impossible d\'activer l\'élection.',
    election_close: 'Impossible de clôturer l\'élection.',
    election_finalize: 'Impossible de finaliser l\'élection.',
    candidate_add: 'Impossible d\'ajouter le candidat.',
    vote_submit: 'Impossible de soumettre le vote.',
    vote_decrypt: 'Impossible de déchiffrer les votes.',
    ipfs_upload: 'Impossible d\'uploader les données.',
    ipfs_fetch: 'Impossible de récupérer les données.',
    blockchain_transaction: 'La transaction a échoué.',
    wallet_connect: 'Impossible de connecter le portefeuille.',
    elgamal_setup: 'Impossible de configurer le chiffrement.',
    zkproof_generate: 'Impossible de générer la preuve.',
    generic: 'Une erreur inattendue est survenue.',
  };

  return contextMessages[context] || contextMessages.generic;
}

/**
 * Format error for display in UI (toast, modal, etc.)
 */
export function formatErrorForDisplay(error: UserFriendlyError): string {
  let message = `**${error.title}**\n\n${error.message}`;

  if (error.actions.length > 0) {
    message += '\n\n**Que faire ?**\n';
    error.actions.forEach((action, index) => {
      message += `${index + 1}. ${action}\n`;
    });
  }

  return message;
}

/**
 * Log error with context for debugging
 */
export function logError(error: any, context: ErrorContext, additionalInfo?: Record<string, any>): void {
  const userError = getUserFriendlyError(error, context);

  console.error(`[${context.toUpperCase()}] ${userError.title}`, {
    message: userError.message,
    technicalDetails: userError.technicalDetails,
    severity: userError.severity,
    ...additionalInfo,
  });
}
