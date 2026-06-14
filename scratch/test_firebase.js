import https from 'https';

const url = 'https://www.permisdeconduirebe.com/src/main.jsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.slice(0, 1000));
  });
}).on('error', (err) => {
  console.error(err);
});
