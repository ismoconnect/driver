import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { to, subject, html, smtpConfig } = req.body;

  if (!to || !subject || !html || !smtpConfig) {
    return res.status(400).json({ error: 'Champs manquants (to, subject, html, smtpConfig)' });
  }

  const { host, port, user, pass, fromName } = smtpConfig;

  if (!host || !port || !user || !pass) {
    return res.status(400).json({ error: 'Configuration SMTP AIBV incomplète' });
  }

  const isSecure = parseInt(port) === 465;

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName || 'Service AIBV'}" <${user}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true, message: 'E-mail envoyé avec succès', messageId: info.messageId });
  } catch (error) {
    console.error('Erreur SMTP AIBV:', error);
    return res.status(500).json({ error: 'Échec de l\'envoi de l\'e-mail via AIBV', details: error.message });
  }
}
