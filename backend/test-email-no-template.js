/**
 * Test SendGrid SANS template (email simple)
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const testEmail = process.argv[2] || 'x_democratix@protonmail.com';

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found');
  process.exit(1);
}

console.log('📤 Test email SIMPLE (sans template)');
console.log('  From:', process.env.SENDGRID_FROM_EMAIL);
console.log('  To:', testEmail);
console.log('');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: testEmail,
  from: {
    email: process.env.SENDGRID_FROM_EMAIL,
    name: 'DEMOCRATIX Test'
  },
  subject: '🗳️ Test DEMOCRATIX - Email Simple',
  text: 'Ceci est un email de test simple sans template.\n\nSi vous recevez cet email, SendGrid fonctionne correctement !',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f7;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
        <h1 style="color: #1E40AF;">🗳️ DEMOCRATIX</h1>
        <h2>Test Email Simple</h2>
        <p>Ceci est un email de test <strong>sans template SendGrid</strong>.</p>
        <p>Si vous recevez cet email, cela signifie que :</p>
        <ul>
          <li>✅ Votre API Key SendGrid fonctionne</li>
          <li>✅ L'email expéditeur est vérifié</li>
          <li>✅ La livraison fonctionne</li>
        </ul>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          Test envoyé depuis DEMOCRATIX Backend<br>
          ${new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  `
};

console.log('Envoi en cours...');

sgMail.send(msg)
  .then((response) => {
    console.log('✅ Email simple envoyé !');
    console.log('  Status:', response[0].statusCode);
    console.log('  Message ID:', response[0].headers['x-message-id']);
    console.log('');
    console.log('📬 Vérifiez votre boîte:', testEmail);
    console.log('   (Y compris les spams)');
  })
  .catch((error) => {
    console.error('❌ Erreur:');
    if (error.response) {
      console.error('Status:', error.response.statusCode);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  });
