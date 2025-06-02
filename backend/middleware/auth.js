const { verifyToken } = require('./jwt');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante o formato non valido.' });
  }

  const token = authHeader.slice(7); // Rimuove 'Bearer '
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }

  req.user = payload;
  console.log(`Utente autenticato: ${payload.nome}`);
  next();
}

module.exports = auth;
