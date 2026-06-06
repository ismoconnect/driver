# 📢 Plan d'Implémentation des Notifications (E-mail & SMS)

Ce document résume l'architecture et les étapes de configuration pour ajouter les notifications par e-mail et par SMS à l'application.

---

## 📧 1. Notifications E-mail (Nodemailer + Vercel Serverless SMTP)

### ⚙️ Architecture
* **Hébergement** : Fonction Serverless Node.js déployée sur **Vercel** (`/api/send-email`).
* **Envoi** : Librairie open-source **Nodemailer** connectée au serveur **SMTP** de votre boîte mail professionnelle.
* **Sécurité** : Les identifiants SMTP sont stockés dans les variables d'environnement de Vercel.

### 🔑 Variables d'environnement à configurer (Vercel Dashboard)
Ajoutez ces variables dans les paramètres de votre projet sur Vercel :
* `SMTP_HOST` : Adresse du serveur sortant (ex: `smtp.hostinger.com`, `mail.infomaniak.com`).
* `SMTP_PORT` : Port de connexion (utilisez `465` pour SSL/TLS, ou `587` pour STARTTLS).
* `SMTP_USER` : Votre adresse e-mail professionnelle (ex: `dossier@sitedepermis.be`).
* `SMTP_PASS` : Le mot de passe de cette boîte mail (ou mot de passe d'application si double facteur activé).
* `SMTP_FROM_NAME` : Le nom affiché de l'expéditeur (ex: `Mon Permis`).

### 🛠️ Exemple de code de la fonction Serverless (`/api/send-email.js`)
```javascript
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { to, subject, html } = req.body;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465', // true pour 465, false pour 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Mon Permis'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true, message: 'E-mail envoyé avec succès' });
  } catch (error) {
    console.error('Erreur SMTP:', error);
    return res.status(500).json({ error: 'Échec de l\'envoi de l\'e-mail', details: error.message });
  }
}
```

---

## 💬 2. Notifications SMS (Passerelle Android / API)

### 📲 Option A : Passerelle Android (Open-Source / Économique)
Idéal pour commencer sans frais de vérification d'entreprise ni surcoût de message.
1. **Équipement** : Un téléphone Android connecté avec une carte SIM (forfait SMS illimités).
2. **Logiciel** : Installation d'une application de passerelle SMS (ex: [SMS Gateway API](https://play.google.com/store/details?id=com.cloudspace.smsgateway) ou similaire).
3. **Fonctionnement** : Le téléphone fournit une clé d'API. Notre application envoie une requête HTTP à l'IP/l'API du téléphone Android, qui se charge de transmettre le SMS physique.

### 🏢 Option B : API Professionnelle (Twilio / Vonage / Brevo)
Idéal pour une mise en production industrielle à grande échelle.
* ** Twilio / Vonage** : Demande la création d'un profil de confiance d'entreprise (TVA, adresse) et l'approbation d'un nom d'expéditeur (*Sender ID*).
* **Brevo** : Permet de centraliser les e-mails et les SMS avec une seule facture prépayée (crédits de SMS rechargeables).

---

## 🚀 Prochaines Étapes
1. Créer le dossier `api/` à la racine ou dans le dossier `client/` pour accueillir la fonction serverless.
2. Installer `nodemailer` (`npm install nodemailer` dans le backend/function).
3. Configurer les variables d'environnement sur Vercel.
4. Écrire les templates d'e-mails (Inscription, Règlement requis, Validation de dossier).
