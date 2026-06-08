import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 1. Fetch marketing settings from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/driverlicence-780b8/databases/(default)/documents/marketing/settings`;
    const firestoreRes = await fetch(firestoreUrl);
    
    let ogTitle = "Mon Permis de Conduire Belge en 1 clic - 100% Certifié Be";
    let ogDescription = "Obtenez votre permis de conduire belge sans stress. Accompagnement légal officiel, dossiers suivis en direct par votre conseiller. Inscrivez-vous gratuitement dès aujourd'hui !";
    let ogImageUrl = "https://res.cloudinary.com/dcimc8pg3/image/upload/v1780933559/marketing_poster_1780933559047.png";

    if (firestoreRes.ok) {
      const data = await firestoreRes.json();
      if (data && data.fields) {
        if (data.fields.ogTitle?.stringValue) ogTitle = data.fields.ogTitle.stringValue;
        if (data.fields.ogDescription?.stringValue) ogDescription = data.fields.ogDescription.stringValue;
        if (data.fields.ogImageUrl?.stringValue) ogImageUrl = data.fields.ogImageUrl.stringValue;
      }
    }

    // 2. Read the static index.html file
    const filePath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    // 3. Construct and inject the Open Graph meta tags
    const metaTags = `
    <title>${ogTitle}</title>
    <meta name="description" content="${ogDescription}" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDescription}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    `;

    // Remove any default title tag to avoid duplicates, and inject new tags
    html = html.replace(/<title>.*?<\/title>/gi, '');
    html = html.replace('</head>', `${metaTags}\n</head>`);

    // 4. Return the modified HTML page
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // cache for 60 seconds
    return res.status(200).send(html);

  } catch (error) {
    console.error("Error generating OG tags:", error);
    // Fallback: just return index.html unmodified
    try {
      const filePath = path.join(process.cwd(), 'index.html');
      const html = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (e) {
      return res.status(500).send("Internal Server Error");
    }
  }
}
