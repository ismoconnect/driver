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

    // 2. Generate the index.html content using a template to avoid filesystem packaging errors on Vercel
    const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

    // 3. Return the HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate'); // 10 seconds cache
    return res.status(200).send(html);

  } catch (error) {
    console.error("Error generating OG tags:", error);
    // Safe fallback html
    const fallbackHtml = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mon Permis de Conduire Belge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(fallbackHtml);
  }
}
