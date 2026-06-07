const API_URL = '/api/send-email';

const emailTemplateWrapper = (content) => `
<div style="font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 2px solid #f97316;">
      <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-decoration: none; display: inline-block;">MON <span style="color: #f97316;">PERMIS</span></span>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 32px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Permis de Conduire Belgique. Tous droits réservés.</p>
      <p style="margin: 0;">Espace d'échange sécurisé SSL. Vos informations d'identité sont cryptées de bout en bout.</p>
    </div>
  </div>
</div>
`;

export async function sendEmail({ to, subject, html }) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(to, firstName, settings = {}) {
  const subject = settings.emailWelcomeSubject || '🚀 Bienvenue sur Mon Permis - Compte Candidat Activé';
  const bodyText = settings.emailWelcomeBody || `Votre compte candidat a été créé avec succès sur notre plateforme **Mon Permis Belgique**.\n\nVous êtes maintenant connecté à votre conseiller attitré. Vous pouvez accéder à votre espace en ligne sécurisé pour suivre l'avancement de votre dossier à tout moment.`;

  const formattedBody = bodyText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  const html = emailTemplateWrapper(`
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Félicitations ${firstName} ! 🚀</h2>
    <p style="font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${formattedBody}</p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://permisdeconduirebe.com/mon-espace" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(249,115,22,0.25);">Accéder à mon Espace ➔</a>
    </div>
    
    <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Si vous avez la moindre question, vous pouvez envoyer un message direct à votre conseiller depuis votre tableau de bord.</p>
  `);

  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendNewMessageNotification(to, recipientName, senderName, messageText, settings = {}) {
  // If message contains long URLs (like attachments preview links), truncate them for readability
  let displayMessage = messageText;
  if (messageText.startsWith('http://') || messageText.startsWith('https://')) {
    displayMessage = messageText.includes('.pdf') ? '📄 Document joint' : '📷 Image jointe';
  }

  const rawSubject = settings.emailMessageSubject || '💬 Nouveau message de {senderName} - Mon Permis';
  const rawBody = settings.emailMessageBody || 'Vous avez reçu un nouveau message de la part de **{senderName}** dans votre espace d\'échange sécurisé :';

  const subject = rawSubject.replace(/{senderName}/g, senderName);
  const bodyText = rawBody.replace(/{senderName}/g, senderName).replace(/{messageText}/g, displayMessage);

  const formattedBody = bodyText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  const html = emailTemplateWrapper(`
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Nouveau message reçu 💬</h2>
    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">Bonjour ${recipientName},</p>
    <p style="font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${formattedBody}</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #f97316; padding: 16px 20px; border-radius: 0 12px 12px 0; font-style: italic; color: #334155; font-size: 13px; margin-bottom: 32px;">
      "${displayMessage}"
    </div>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://permisdeconduirebe.com/mon-espace" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(15,23,42,0.25);">Répondre depuis mon espace ➔</a>
    </div>
  `);

  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendFormulaSelectedEmail(to, firstName, formulaName, amount, settings = {}) {
  const rawSubject = settings.emailFormulaSelectedSubject || "📋 Votre inscription est bien reçue - Mon Permis";
  const rawBody = settings.emailFormulaSelectedBody || "Nous avons bien reçu votre dossier d'inscription pour la **{formulaName}** d'un montant de **{amount}**.\n\nNos équipes procèdent actuellement à la vérification de vos documents d'identité pour démarrer la constitution officielle de votre dossier auprès des services agréés.";

  const subject = rawSubject.replace(/{amount}/g, amount).replace(/{formulaName}/g, formulaName);
  const bodyText = rawBody.replace(/{amount}/g, amount).replace(/{formulaName}/g, formulaName);

  const formattedBody = bodyText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  const html = emailTemplateWrapper(`
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Inscription Reçue 📋</h2>
    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">Bonjour ${firstName},</p>
    <p style="font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.6;">${formattedBody}</p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://permisdeconduirebe.com/mon-espace" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(249,115,22,0.25);">Voir les détails du dossier ➔</a>
    </div>
  `);

  return sendEmail({
    to,
    subject,
    html,
  });
}
