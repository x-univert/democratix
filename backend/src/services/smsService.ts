/**
 * 📱 SMS Service - Twilio Integration
 *
 * Service pour l'envoi de codes OTP par SMS avec vérification.
 * Utilise Twilio pour l'envoi en masse avec rate limiting.
 *
 * @date 5 Novembre 2025
 * @version 1.0.0
 */

import twilio from 'twilio';

// Configuration Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// Configuration OTP
const OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 15;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 1; // Min 1 minute entre deux envois au même numéro

// Initialisation client Twilio
let twilioClient: twilio.Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio SMS service initialized');
} else {
  console.warn('⚠️ Twilio credentials not configured - SMS service disabled');
}

/**
 * Interface pour un code OTP stocké
 */
interface OTPRecord {
  code: string;
  phoneNumber: string;
  electionId: number;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

/**
 * Interface pour le résultat d'envoi SMS
 */
export interface SMSSendResult {
  success: boolean;
  phoneNumber: string;
  messageId?: string;
  error?: string;
  retryAfter?: number; // Secondes avant de pouvoir réessayer
}

/**
 * Interface pour le résultat de vérification OTP
 */
export interface OTPVerifyResult {
  success: boolean;
  phoneNumber: string;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Stockage temporaire des OTP en mémoire
 * Format: phoneNumber -> OTPRecord
 *
 * Note: En production, utiliser Redis ou une DB pour persistance
 */
const otpStore = new Map<string, OTPRecord>();

/**
 * Stockage des derniers envois pour rate limiting
 * Format: phoneNumber -> timestamp dernier envoi
 */
const rateLimitStore = new Map<string, number>();

/**
 * Générer un code OTP aléatoire de 6 chiffres
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normaliser un numéro de téléphone
 * Accepte formats: +33612345678, 0612345678, etc.
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Supprimer espaces, tirets, parenthèses
  let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Si commence par 0, remplacer par indicatif pays (ex: France +33)
  if (normalized.startsWith('0')) {
    // Par défaut France, mais devrait être configurable
    normalized = '+33' + normalized.substring(1);
  }

  // Si pas d'indicatif pays, ajouter +33 par défaut
  if (!normalized.startsWith('+')) {
    normalized = '+33' + normalized;
  }

  return normalized;
}

/**
 * Vérifier si un numéro a dépassé le rate limit
 */
function isRateLimited(phoneNumber: string): boolean {
  const lastSent = rateLimitStore.get(phoneNumber);
  if (!lastSent) return false;

  const now = Date.now();
  const minutesSinceLastSend = (now - lastSent) / (1000 * 60);

  return minutesSinceLastSend < RATE_LIMIT_MINUTES;
}

/**
 * Calculer le temps restant avant de pouvoir renvoyer un SMS
 */
function getRetryAfterSeconds(phoneNumber: string): number {
  const lastSent = rateLimitStore.get(phoneNumber);
  if (!lastSent) return 0;

  const now = Date.now();
  const elapsedMs = now - lastSent;
  const rateLimitMs = RATE_LIMIT_MINUTES * 60 * 1000;
  const remainingMs = rateLimitMs - elapsedMs;

  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Nettoyer les OTP expirés (appelé périodiquement)
 */
function cleanupExpiredOTPs(): void {
  const now = Date.now();

  for (const [phoneNumber, record] of otpStore.entries()) {
    if (record.expiresAt.getTime() < now) {
      otpStore.delete(phoneNumber);
      console.log(`[SMS] OTP expiré supprimé pour ${phoneNumber}`);
    }
  }
}

// Nettoyer les OTP expirés toutes les 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

/**
 * Envoyer un code OTP par SMS à un numéro de téléphone
 *
 * @param phoneNumber Numéro de téléphone du destinataire
 * @param electionId ID de l'élection associée
 * @param electionTitle Titre de l'élection (optionnel)
 * @returns Résultat de l'envoi
 */
export async function sendOTP(
  phoneNumber: string,
  electionId: number,
  electionTitle?: string
): Promise<SMSSendResult> {
  // Vérifier que Twilio est configuré
  if (!twilioClient) {
    return {
      success: false,
      phoneNumber,
      error: 'Service SMS non configuré. Contactez l\'administrateur.'
    };
  }

  // Normaliser le numéro
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Vérifier rate limiting
  if (isRateLimited(normalizedPhone)) {
    const retryAfter = getRetryAfterSeconds(normalizedPhone);
    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`,
      retryAfter
    };
  }

  try {
    // Générer le code OTP
    const code = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Créer le message SMS
    const electionText = electionTitle ? ` pour l'élection "${electionTitle}"` : '';
    const message = `DEMOCRATIX: Votre code de vérification${electionText} est: ${code}\n\nCe code expire dans ${OTP_EXPIRATION_MINUTES} minutes.\n\nNe partagez ce code avec personne.`;

    // Envoyer le SMS via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: normalizedPhone
    });

    console.log(`[SMS] Code OTP envoyé à ${normalizedPhone} - MessageID: ${twilioMessage.sid}`);

    // Stocker l'OTP
    otpStore.set(normalizedPhone, {
      code,
      phoneNumber: normalizedPhone,
      electionId,
      createdAt: now,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // Mettre à jour rate limiting
    rateLimitStore.set(normalizedPhone, Date.now());

    return {
      success: true,
      phoneNumber: normalizedPhone,
      messageId: twilioMessage.sid
    };

  } catch (error: any) {
    console.error('[SMS] Erreur envoi OTP:', error);

    let errorMessage = 'Erreur lors de l\'envoi du SMS.';

    // Messages d'erreur Twilio spécifiques
    if (error.code === 21211) {
      errorMessage = 'Numéro de téléphone invalide.';
    } else if (error.code === 21608) {
      errorMessage = 'Le numéro de téléphone n\'est pas autorisé à recevoir des SMS.';
    } else if (error.code === 21614) {
      errorMessage = 'Numéro de téléphone invalide: format incorrect.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: errorMessage
    };
  }
}

/**
 * Vérifier un code OTP pour un numéro de téléphone
 *
 * @param phoneNumber Numéro de téléphone
 * @param code Code OTP à vérifier
 * @returns Résultat de la vérification
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<OTPVerifyResult> {
  // Normaliser le numéro
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Récupérer l'OTP stocké
  const record = otpStore.get(normalizedPhone);

  if (!record) {
    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: 'Aucun code OTP trouvé pour ce numéro. Demandez un nouveau code.'
    };
  }

  // Vérifier si l'OTP a expiré
  if (record.expiresAt.getTime() < Date.now()) {
    otpStore.delete(normalizedPhone);
    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: `Code expiré. Demandez un nouveau code. (Expiration: ${OTP_EXPIRATION_MINUTES} min)`
    };
  }

  // Vérifier si déjà vérifié
  if (record.verified) {
    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: 'Ce code a déjà été utilisé. Demandez un nouveau code.'
    };
  }

  // Vérifier le nombre de tentatives
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedPhone);
    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: `Trop de tentatives échouées (${MAX_ATTEMPTS} max). Demandez un nouveau code.`
    };
  }

  // Incrémenter le compteur de tentatives
  record.attempts++;

  // Vérifier le code
  if (record.code !== code) {
    const attemptsRemaining = MAX_ATTEMPTS - record.attempts;

    console.log(`[SMS] Code incorrect pour ${normalizedPhone} - Tentatives restantes: ${attemptsRemaining}`);

    return {
      success: false,
      phoneNumber: normalizedPhone,
      error: `Code incorrect. ${attemptsRemaining} tentative(s) restante(s).`,
      attemptsRemaining
    };
  }

  // Code correct !
  record.verified = true;
  console.log(`[SMS] Code OTP vérifié avec succès pour ${normalizedPhone}`);

  return {
    success: true,
    phoneNumber: normalizedPhone
  };
}

/**
 * Envoyer des codes OTP en masse à plusieurs numéros
 *
 * @param phoneNumbers Liste de numéros de téléphone
 * @param electionId ID de l'élection
 * @param electionTitle Titre de l'élection
 * @returns Résultats d'envoi pour chaque numéro
 */
export async function sendBulkOTP(
  phoneNumbers: string[],
  electionId: number,
  electionTitle?: string
): Promise<SMSSendResult[]> {
  const results: SMSSendResult[] = [];

  console.log(`[SMS] Envoi en masse de ${phoneNumbers.length} codes OTP...`);

  for (const phoneNumber of phoneNumbers) {
    try {
      // Délai de 500ms entre chaque envoi pour éviter rate limiting Twilio
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await sendOTP(phoneNumber, electionId, electionTitle);
      results.push(result);

      if (result.success) {
        console.log(`[SMS] ✅ ${phoneNumber}`);
      } else {
        console.log(`[SMS] ❌ ${phoneNumber}: ${result.error}`);
      }

    } catch (error: any) {
      console.error(`[SMS] Erreur pour ${phoneNumber}:`, error);
      results.push({
        success: false,
        phoneNumber,
        error: error.message || 'Erreur inconnue'
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  console.log(`[SMS] Envoi en masse terminé: ${successCount} succès, ${failureCount} échecs`);

  return results;
}

/**
 * Obtenir les statistiques d'un OTP pour un numéro
 * (Pour debugging et monitoring)
 */
export function getOTPStats(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const record = otpStore.get(normalizedPhone);

  if (!record) {
    return null;
  }

  return {
    phoneNumber: normalizedPhone,
    electionId: record.electionId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    attempts: record.attempts,
    verified: record.verified,
    isExpired: record.expiresAt.getTime() < Date.now()
  };
}

/**
 * Supprimer un OTP (pour cleanup manuel ou après utilisation)
 */
export function deleteOTP(phoneNumber: string): boolean {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return otpStore.delete(normalizedPhone);
}

/**
 * Service SMS complet
 */
export const SMSService = {
  sendOTP,
  verifyOTP,
  sendBulkOTP,
  getOTPStats,
  deleteOTP,
  normalizePhoneNumber
};

export default SMSService;
