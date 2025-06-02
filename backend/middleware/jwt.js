const jwt = require('jsonwebtoken');

const options = {
  algorithm: "HS256",
  expiresIn: "1h" // Token valido per un'ora
};

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key"; 

// Genera un nuovo token JWT
function generateToken(payload) {
  return jwt.sign({ id: payload.id, nome: payload.nome }, JWT_SECRET, options);
}

// Verifica il token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null; // Se il token è invalido, restituisce null invece di generare un errore
  }
}

module.exports = { generateToken, verifyToken };
