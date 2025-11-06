/**
 * 📧 Email Service - SendGrid Integration
 *
 * Service pour l'envoi automatique d'emails d'invitation avec codes.
 * Utilise SendGrid pour l'envoi en masse avec templates HTML.
 *
 * @date 4 Novembre 2025
 * @version 1.0.0
 */

import sgMail from '@sendgrid/mail';

// Configuration SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@democratix.io';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'DEMOCRATIX';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Template ID SendGrid (à configurer dans le dashboard SendGrid)
const INVITATION_TEMPLATE_ID = process.env.SENDGRID_INVITATION_TEMPLATE_ID || 'd-xxxxxxxxxxxxx';

// Initialisation SendGrid
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== '') {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid API initialized');
} else {
  console.warn('⚠️ SendGrid API key not configured - email service disabled');
}

/**
 * Interface pour les données d'invitation par email
 */
export interface EmailInvitation {
  to: string;                    // Email destinataire
  electionId: number;            // ID de l'élection
  electionTitle: string;         // Titre de l'élection
  organizerName?: string;        // Nom de l'organisateur
  invitationCode: string;        // Code d'invitation unique
  expirationDate?: string;       // Date d'expiration (optionnel)
}

/**
 * Interface pour le résultat d'envoi
 */
export interface EmailSendResult {
  success: boolean;
  email: string;
  messageId?: string;
  error?: string;
}

/**
 * Service Email avec SendGrid
 */
export class EmailService {

  /**
   * Vérifier si le service est configuré
   */
  static isConfigured(): boolean {
    return SENDGRID_API_KEY !== '' && SENDGRID_API_KEY !== undefined;
  }

  /**
   * Envoyer un email d'invitation unique
   *
   * @param invitation Données de l'invitation
   * @returns Résultat de l'envoi
   */
  static async sendInvitation(invitation: EmailInvitation): Promise<EmailSendResult> {

    if (!this.isConfigured()) {
      return {
        success: false,
        email: invitation.to,
        error: 'SendGrid not configured - set SENDGRID_API_KEY in .env'
      };
    }

    // Valider l'email
    if (!this.isValidEmail(invitation.to)) {
      return {
        success: false,
        email: invitation.to,
        error: 'Invalid email format'
      };
    }

    try {
      // Construire l'URL de vote avec le code
      const voteUrl = `${FRONTEND_URL}/register/${invitation.electionId}?token=${invitation.invitationCode}`;

      // Message SendGrid
      const msg = {
        to: invitation.to,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        templateId: INVITATION_TEMPLATE_ID,
        dynamicTemplateData: {
          electionTitle: invitation.electionTitle,
          organizerName: invitation.organizerName || 'L\'organisateur',
          invitationCode: invitation.invitationCode,
          voteUrl: voteUrl,
          expirationDate: invitation.expirationDate || 'Non définie',
          currentYear: new Date().getFullYear()
        }
      };

      // Envoi via SendGrid
      const [response] = await sgMail.send(msg);

      console.log(`✅ Email sent to ${invitation.to} - Status: ${response.statusCode}`);

      return {
        success: true,
        email: invitation.to,
        messageId: response.headers['x-message-id'] as string
      };

    } catch (error: any) {
      console.error(`❌ Error sending email to ${invitation.to}:`, error);

      let errorMessage = 'Unknown error';
      if (error.response) {
        errorMessage = error.response.body?.errors?.[0]?.message || error.message;
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        email: invitation.to,
        error: errorMessage
      };
    }
  }

  /**
   * Envoyer plusieurs emails d'invitation en masse
   *
   * @param invitations Liste des invitations à envoyer
   * @param delayMs Délai entre chaque envoi (pour éviter rate limiting)
   * @returns Résultats de tous les envois
   */
  static async sendBulkInvitations(
    invitations: EmailInvitation[],
    delayMs: number = 100
  ): Promise<EmailSendResult[]> {

    if (!this.isConfigured()) {
      return invitations.map(inv => ({
        success: false,
        email: inv.to,
        error: 'SendGrid not configured'
      }));
    }

    const results: EmailSendResult[] = [];

    console.log(`📧 Starting bulk email send: ${invitations.length} emails`);

    // Envoyer les emails séquentiellement avec délai
    for (let i = 0; i < invitations.length; i++) {
      const invitation = invitations[i];

      console.log(`📤 Sending email ${i + 1}/${invitations.length} to ${invitation.to}`);

      const result = await this.sendInvitation(invitation);
      results.push(result);

      // Délai entre chaque envoi (sauf pour le dernier)
      if (i < invitations.length - 1) {
        await this.delay(delayMs);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Bulk email send completed: ${successCount} success, ${failureCount} failures`);

    return results;
  }

  /**
   * Envoyer un email de test
   *
   * @param toEmail Email de test
   * @returns Résultat de l'envoi
   */
  static async sendTestEmail(toEmail: string): Promise<EmailSendResult> {
    const testInvitation: EmailInvitation = {
      to: toEmail,
      electionId: 0,
      electionTitle: 'Test Election - DEMOCRATIX',
      organizerName: 'Test Organizer',
      invitationCode: 'TEST-CODE-123456',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
    };

    return await this.sendInvitation(testInvitation);
  }

  /**
   * Valider un email
   *
   * @param email Email à valider
   * @returns true si valide
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extraire une liste d'emails depuis un texte
   * Supporte : séparateur virgule, point-virgule, espace, retour ligne
   *
   * @param text Texte contenant les emails
   * @returns Liste d'emails uniques et valides
   */
  static extractEmails(text: string): string[] {
    // Nettoyer le texte et extraire les emails
    const emails = text
      .split(/[\s,;]+/)                    // Séparer par espace, virgule, point-virgule
      .map(email => email.trim())          // Nettoyer
      .filter(email => email.length > 0)   // Supprimer les vides
      .filter(email => this.isValidEmail(email)); // Valider

    // Dédupliquer
    return Array.from(new Set(emails));
  }

  /**
   * Délai utilitaire
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtenir les statistiques d'utilisation SendGrid (optionnel)
   * Nécessite des permissions supplémentaires dans l'API key
   */
  static async getStats(): Promise<any> {
    if (!this.isConfigured()) {
      return { error: 'SendGrid not configured' };
    }

    try {
      // Note: Nécessite une API key avec permissions "Stats - Read access"
      const request = {
        method: 'GET' as const,
        url: '/v3/stats',
        qs: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }
      };

      // @ts-ignore
      const [response, body] = await sgMail.request(request);
      return body;
    } catch (error: any) {
      console.error('Error fetching SendGrid stats:', error);
      return { error: error.message };
    }
  }
}

export default EmailService;
