const express = require('express');
const axios = require('axios');
const app = express();

const BASIC_USER = 'gptinsee';
const BASIC_PASS = 'R9tKe7!gGq42xZ0m';

const CLIENT_ID = '21693dec-5976-4f3e-b4fc-d7f8adce3786';
const CLIENT_SECRET = '7FfCDoq3TarWXthd0mvJUbHE1TW71yvr';

app.get('/insee/communes', async (req, res) => {
  const auth = req.headers.authorization || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return res.status(401).json({ error: 'Authentification requise (Basic)' });
  }

  const decoded = Buffer.from(encoded, 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user !== BASIC_USER || pass !== BASIC_PASS) {
    return res.status(403).json({ error: 'Identifiants invalides' });
  }

  try {
    const tokenResp = await axios.post(
      'https://api.insee.fr/token',
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = tokenResp.data.access_token;

    const communesResp = await axios.get(
      'https://api.insee.fr/metadonnees/V1/geo/communes',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          codeDepartement: req.query.codeDepartement || '42',
          champs: req.query.champs || 'code,nom',
        },
      }
    );

    res.json(communesResp.data);
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des données INSEE' });
  }
});

app.listen(3000, () => {
  console.log('Proxy INSEE actif sur le port 3000');
});
