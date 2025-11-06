/**
 * Service de génération et gestion des QR codes pour inscription
 */

export interface QRCodeData {
  token: string;
  electionId: number;
  url: string;
  expiresAt?: number;
  metadata?: {
    voterName?: string;
    voterEmail?: string;
    generatedBy: string;
    generatedAt: number;
  };
}

/**
 * Génère un token unique sécurisé
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère l'URL d'inscription avec token
 */
export function generateRegistrationURL(
  electionId: number,
  token: string,
  baseUrl: string = window.location.origin
): string {
  return `${baseUrl}/register/${electionId}?token=${token}`;
}

/**
 * Crée les données pour un QR code d'inscription
 */
export function createQRCodeData(
  electionId: number,
  organizerAddress: string,
  options?: {
    expirationHours?: number;
    voterName?: string;
    voterEmail?: string;
  }
): QRCodeData {
  const token = generateSecureToken();
  const url = generateRegistrationURL(electionId, token);

  const data: QRCodeData = {
    token,
    electionId,
    url,
    metadata: {
      generatedBy: organizerAddress,
      generatedAt: Date.now(),
      voterName: options?.voterName,
      voterEmail: options?.voterEmail
    }
  };

  // Ajouter expiration si spécifié
  if (options?.expirationHours) {
    data.expiresAt = Date.now() + (options.expirationHours * 60 * 60 * 1000);
  }

  return data;
}

/**
 * Génère plusieurs QR codes
 */
export function generateBatchQRCodes(
  electionId: number,
  organizerAddress: string,
  count: number,
  options?: {
    expirationHours?: number;
    prefix?: string;
  }
): QRCodeData[] {
  const qrCodes: QRCodeData[] = [];

  for (let i = 0; i < count; i++) {
    const voterName = options?.prefix ? `${options.prefix}-${i + 1}` : undefined;
    qrCodes.push(createQRCodeData(electionId, organizerAddress, {
      ...options,
      voterName
    }));
  }

  return qrCodes;
}

/**
 * Vérifie si un QR code est expiré
 */
export function isQRCodeExpired(qrCode: QRCodeData): boolean {
  if (!qrCode.expiresAt) return false;
  return Date.now() > qrCode.expiresAt;
}

/**
 * Sauvegarde les QR codes dans localStorage
 */
export function saveQRCodes(electionId: number, qrCodes: QRCodeData[]): void {
  const key = `qr-codes-${electionId}`;
  localStorage.setItem(key, JSON.stringify(qrCodes));
}

/**
 * Charge les QR codes depuis localStorage
 */
export function loadQRCodes(electionId: number): QRCodeData[] {
  const key = `qr-codes-${electionId}`;
  const stored = localStorage.getItem(key);

  if (!stored) return [];

  try {
    return JSON.parse(stored) as QRCodeData[];
  } catch (error) {
    console.error('Failed to parse stored QR codes:', error);
    return [];
  }
}

/**
 * Exporte les QR codes en CSV
 */
export function exportQRCodesCSV(qrCodes: QRCodeData[]): string {
  const headers = ['Token', 'URL', 'Voter Name', 'Voter Email', 'Expires At', 'Generated At'];
  const rows = qrCodes.map(qr => [
    qr.token,
    qr.url,
    qr.metadata?.voterName || '',
    qr.metadata?.voterEmail || '',
    qr.expiresAt ? new Date(qr.expiresAt).toLocaleString() : 'Never',
    new Date(qr.metadata?.generatedAt || 0).toLocaleString()
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

/**
 * Télécharge les QR codes en CSV
 */
export function downloadQRCodesCSV(electionId: number, qrCodes: QRCodeData[]): void {
  const csv = exportQRCodesCSV(qrCodes);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `democratix_qrcodes_election_${electionId}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Formate la durée d'expiration
 */
export function formatExpiration(qrCode: QRCodeData): string {
  if (!qrCode.expiresAt) return 'Jamais';

  const now = Date.now();
  const diff = qrCode.expiresAt - now;

  if (diff <= 0) return 'Expiré';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} jour(s)`;
  if (hours > 0) return `${hours} heure(s)`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute(s)`;
}
