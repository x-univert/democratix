/**
 * Script de test simple pour SendGrid
 * Usage: node test-email-simple.js votre-email@test.com
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Vérifier que l'email est fourni
const testEmail = process.argv[2];
if (!testEmail) {
  console.error('❌ Usage: node test-email-simple.js votre-email@test.com');
  process.exit(1);
}

// Vérifier configuration
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in .env');
  process.exit(1);
}

if (!process.env.SENDGRID_INVITATION_TEMPLATE_ID) {
  console.error('❌ SENDGRID_INVITATION_TEMPLATE_ID not found in .env');
  process.exit(1);
}

console.log('🔧 Configuration SendGrid:');
console.log('  API Key:', process.env.SENDGRID_API_KEY.substring(0, 20) + '...');
console.log('  From:', process.env.SENDGRID_FROM_EMAIL);
console.log('  Template ID:', process.env.SENDGRID_INVITATION_TEMPLATE_ID);
console.log('  To:', testEmail);
console.log('');

// Initialiser SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Message avec template
const msg = {
  to: testEmail,
  from: {
    email: process.env.SENDGRID_FROM_EMAIL,
    name: process.env.SENDGRID_FROM_NAME || 'DEMOCRATIX'
  },
  templateId: process.env.SENDGRID_INVITATION_TEMPLATE_ID,
  dynamicTemplateData: {
    electionTitle: 'TEST - Élection du Président 2025',
    organizerName: 'Test Organizer',
    invitationCode: 'TEST-CODE-123456789',
    voteUrl: 'http://localhost:3000/register/1?token=TEST-CODE-123456789',
    expirationDate: '31/12/2025',
    currentYear: new Date().getFullYear()
  }
};

console.log('📤 Envoi de l\'email de test...');

sgMail.send(msg)
  .then((response) => {
    console.log('✅ Email envoyé avec succès!');
    console.log('  Status:', response[0].statusCode);
    console.log('  Message ID:', response[0].headers['x-message-id']);
    console.log('');
    console.log('📬 Vérifiez votre boîte mail:', testEmail);
    console.log('   (Peut prendre 10-30 secondes)');
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'envoi:');
    console.error('');

    if (error.response) {
      console.error('Status:', error.response.statusCode);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));

      // Erreurs communes
      if (error.response.statusCode === 401) {
        console.error('');
        console.error('💡 Solution: API Key invalide');
        console.error('   → Vérifier SENDGRID_API_KEY dans .env');
        console.error('   → Regénérer une nouvelle clé dans SendGrid Dashboard');
      } else if (error.response.statusCode === 403) {
        console.error('');
        console.error('💡 Solution: Sender not verified');
        console.error('   → Vérifier que', process.env.SENDGRID_FROM_EMAIL, 'est vérifié dans SendGrid');
        console.error('   → Settings → Sender Authentication → Single Sender Verification');
      } else if (error.response.body?.errors?.[0]?.message?.includes('template')) {
        console.error('');
        console.error('💡 Solution: Template ID invalide');
        console.error('   → Vérifier SENDGRID_INVITATION_TEMPLATE_ID dans .env');
        console.error('   → Copier l\'ID depuis SendGrid Dashboard → Dynamic Templates');
      }
    } else {
      console.error(error.message);
    }

    process.exit(1);
  });
