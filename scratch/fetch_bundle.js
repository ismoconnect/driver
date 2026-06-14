import https from 'https';

const url = 'https://www.permisdeconduirebe.com/assets/index-CE3sJiNE.js';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Bundle length:', data.length);
    console.log('Contains fbq:', data.includes('fbq'));
    console.log('Contains fbevents:', data.includes('fbevents.js'));
    console.log('Contains metaPixelId:', data.includes('metaPixelId'));
  });
}).on('error', (err) => {
  console.error(err);
});
