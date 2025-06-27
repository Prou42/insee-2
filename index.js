/**
 * Proxy INSEE – GPT
 * - Authentification Basic (clé API simple)
 * - Récupération automatique du token OAuth2 INSEE
 */

const express = require('express');
const axios   = require('axios');
const app     = express();

/* ---------- Identifiants Basic que GPT doit envoyer ---------- */
const BASIC_USER = process.env.BASIC_USER || 'gptinsee';
const BASIC_PASS = process.env.BASIC_PASS || 'R9tKe7!gGq42xZ0m';

/* ---------- Identifiants OAuth2 INSEE ---------- */
const CLIENT_ID     = process.env.CLIENT_ID     || '21693dec-5976-4f3e-b4fc-d7f8adce3786';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '7FfCDoq3TarWXthd0mvJUbHE1TW71yvr';

/* ---------- Middleware : vérifie l’auth Basic ---------- */
function checkBasicAuth(req, res, next) {
  const raw = req.headers.authorization || '';
  if (!raw) return res.status(401).json({ error: 'Authentification requise (Basic)' });

  // Accepte : "Basic <base64>" OU directement "<base64>"
  const isPrefixed = raw.startsWith('Basic ');
  const base64 = isPrefixed ? raw.slice(6).trim() : raw.trim();

  let user = '', pass = '';
  try {
    [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
  } catch {
    return res.status(400).json({ error: 'En-tête Basic mal formé' });
  }

  if (user !== BASIC_USER || pass !== BASIC_PASS) {
    return res.status(403).json({ error: 'Identifiants invalides' });
  }
  next();
}

/* ---------- Route /insee/communes ---------- */
app.get('/insee/communes', checkBasicAuth, async (req, res) => {
  try {
    /* 1) Obtient le token OAuth2 INSEE */
    const tokenResp = await axios.post(
      'https://api.insee.fr/token',
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const accessToken = tokenResp.data.access_token;

    /* 2) Appelle l’API Découpage administratif */
    const communesResp = await axios.get(
      'https://api.insee.fr/metadonnees/V1/geo/communes',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          codeDepartement: req.query.codeDepartement || '42',
          champs: req.query.champs || 'code,nom'
        }
      }
    );

    res.json(communesResp.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de l’appel à l’API INSEE' });
  }
});

/* ---------- Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy INSEE GPT prêt sur http://localhost:${PORT}`);
});
