/**
 * Service de gestion des tentatives automatiques (retry) avec backoff exponentiel
 */

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Exécute une fonction avec retry automatique
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    delayMs,
    exponentialBackoff = true,
    onRetry,
    shouldRetry = () => true
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Vérifier si on doit retry
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Si c'est la dernière tentative, throw
      if (attempt === maxAttempts) {
        throw new RetryError(
          `Échec après ${maxAttempts} tentative(s): ${lastError.message}`,
          maxAttempts,
          lastError
        );
      }

      // Calculer le délai avec backoff exponentiel
      const delay = exponentialBackoff
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs;

      // Appeler callback si fourni
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Attendre avant la prochaine tentative
      await sleep(delay);
    }
  }

  // Ne devrait jamais arriver ici
  throw new RetryError(
    `Échec après ${maxAttempts} tentative(s)`,
    maxAttempts,
    lastError!
  );
}

/**
 * Retry spécifique pour IPFS (3 tentatives, backoff exponentiel)
 */
export async function withIPFSRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 3,
    delayMs: 2000, // 2s, 4s, 8s
    exponentialBackoff: true,
    onRetry,
    shouldRetry: (error) => {
      // Ne pas retry sur certaines erreurs
      const message = error.message.toLowerCase();
      return !message.includes('unauthorized') && !message.includes('forbidden');
    }
  });
}

/**
 * Retry spécifique pour transactions blockchain (2 tentatives, délai fixe)
 */
export async function withTransactionRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 2,
    delayMs: 5000, // 5s fixe
    exponentialBackoff: false,
    onRetry,
    shouldRetry: (error) => {
      // Ne pas retry sur certaines erreurs critiques
      const message = error.message.toLowerCase();
      return (
        !message.includes('insufficient funds') &&
        !message.includes('nonce') &&
        !message.includes('invalid signature')
      );
    }
  });
}

/**
 * Helper pour attendre un certain délai
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Détecte si l'utilisateur est en ligne
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Attend que l'utilisateur revienne en ligne
 */
export function waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const timeout = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeoutMs);

    const onlineHandler = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };

    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Wrapper pour fetch avec retry et détection offline
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: Partial<RetryOptions>
): Promise<Response> {
  // Vérifier connexion
  if (!isOnline()) {
    throw new Error('Vous êtes hors ligne. Vérifiez votre connexion internet.');
  }

  return withRetry(
    async () => {
      const response = await fetch(url, options);

      // Vérifier le statut
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`);
        }
        if (response.status === 429) {
          throw new Error('Trop de requêtes. Veuillez patienter.');
        }
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      maxAttempts: retryOptions?.maxAttempts || 3,
      delayMs: retryOptions?.delayMs || 2000,
      exponentialBackoff: retryOptions?.exponentialBackoff ?? true,
      onRetry: retryOptions?.onRetry,
      shouldRetry: (error) => {
        // Retry sur erreurs réseau et erreurs serveur
        const message = error.message.toLowerCase();
        return (
          message.includes('fetch') ||
          message.includes('network') ||
          message.includes('timeout') ||
          message.includes('serveur')
        );
      }
    }
  );
}

/**
 * Formatte un message d'erreur contextuel
 */
export function formatErrorMessage(
  error: Error,
  context: 'ipfs' | 'transaction' | 'network'
): string {
  const message = error.message;

  switch (context) {
    case 'ipfs':
      if (message.includes('timeout')) {
        return '⏱️ IPFS est lent. Vérifiez votre connexion ou réessayez plus tard.';
      }
      if (message.includes('unauthorized')) {
        return '🔒 Erreur d\'authentification IPFS. Contactez l\'administrateur.';
      }
      return `📦 Erreur IPFS: ${message}`;

    case 'transaction':
      if (message.includes('insufficient funds')) {
        return '💰 Solde insuffisant pour effectuer cette transaction.';
      }
      if (message.includes('nonce')) {
        return '🔢 Erreur de nonce. Veuillez recharger la page et réessayer.';
      }
      if (message.includes('gas')) {
        return '⛽ Erreur de gas. Augmentez la limite de gas ou réessayez.';
      }
      return `⛓️ Erreur blockchain: ${message}`;

    case 'network':
      if (message.includes('offline') || message.includes('hors ligne')) {
        return '📡 Vous êtes hors ligne. Vérifiez votre connexion internet.';
      }
      if (message.includes('timeout')) {
        return '⏱️ Délai d\'attente dépassé. Le serveur ne répond pas.';
      }
      if (message.includes('429')) {
        return '🚦 Trop de requêtes. Veuillez patienter quelques instants.';
      }
      return `🌐 Erreur réseau: ${message}`;

    default:
      return message;
  }
}
